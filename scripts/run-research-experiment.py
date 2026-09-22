#!/usr/bin/env python3
"""Run a pinned dense-Llama selective-edit experiment, with an unchanged baseline.

This is a bounded local research comparison, not a reproduction of MoE LoMC or
neuron-cluster NeST and not a deployment approval. Raw responses stay in --output.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import platform
import random
import subprocess
import sys
import time
from pathlib import Path

from checkpoint_tools import inventory, plan, sha256, write_candidate
from research_experiment import load_protocol, score_response, select_trainable, summarize


def emit(event, **data):
    print(json.dumps({"event": event, **data}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--protocol", type=Path, default=Path("data/experiments/minicpm5-protocol.jsonl"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--methods", default="selective-projection,norm-preserving,selective-sft")
    parser.add_argument("--top-k", type=int, default=2)
    parser.add_argument("--alpha", type=float, default=0.8)
    parser.add_argument("--max-new-tokens", type=int, default=256)
    parser.add_argument("--max-input-tokens", type=int, default=256)
    parser.add_argument("--sft-steps", type=int, default=24)
    parser.add_argument("--learning-rate", type=float, default=0.0001)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--cxx", type=Path, help="Optional native select-layers executable; require Python/native agreement")
    parser.add_argument("--device", choices=["cuda", "cpu"], default="cuda")
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    args = parser.parse_args()
    methods = args.methods.split(",")
    if len(methods) != len(set(methods)) or not set(methods) <= {"selective-projection", "norm-preserving", "selective-sft", "global-projection"}:
        parser.error("unknown or duplicate method")
    if not 1 <= args.top_k <= 16 or not 0 <= args.alpha <= 1 or not 8 <= args.max_new_tokens <= 256 or not 32 <= args.max_input_tokens <= 1024 or not 1 <= args.sft_steps <= 1000 or not 0 < args.learning_rate <= .01 or not 30 <= args.timeout_seconds <= 14400:
        parser.error("run parameters are outside the bounded research ranges")
    if args.output.exists():
        parser.error("output must be a new directory")
    protocol = load_protocol(args.protocol)
    source_lock = json.loads((args.model / "source-lock.json").read_text(encoding="utf-8"))
    info = inventory(args.model)
    for name, expected in source_lock["shards"].items():
        if sha256(args.model / name) != expected:
            raise ValueError("model weights changed since pinned download")
    args.output.mkdir(parents=True)
    started = time.time()
    def deadline():
        if time.time() - started > args.timeout_seconds:
            raise TimeoutError("research experiment deadline exceeded")
    import torch
    import transformers
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from abliteration_math import apply_mode, mean_difference
    random.seed(args.seed); torch.manual_seed(args.seed)
    torch.set_num_threads(6)
    if args.device == "cuda":
        if not torch.cuda.is_available() or torch.cuda.mem_get_info()[0] < 6 * 1024**3:
            raise RuntimeError("CUDA needs at least 6 GiB currently free; do not stop unrelated GPU jobs")
    dtype = torch.bfloat16 if args.device == "cuda" else torch.float32
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True, trust_remote_code=False)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id
    model = AutoModelForCausalLM.from_pretrained(args.model, dtype=dtype, local_files_only=True, trust_remote_code=False, attn_implementation="sdpa").to(args.device).eval()
    if model.config.model_type != "llama" or model.config.num_hidden_layers != source_lock["lock"]["layers"]:
        raise ValueError("this protocol requires the pinned dense Llama architecture")
    identity = {"model": source_lock, "torch": torch.__version__, "transformers": transformers.__version__, "python": platform.python_version(), "device": torch.cuda.get_device_name() if args.device == "cuda" else "cpu", "seed": args.seed, "pid": os.getpid(), "executable": sys.executable, "protocol_sha256": sha256(args.protocol), "decoding": {"do_sample": False, "enable_thinking": False, "max_new_tokens": args.max_new_tokens, "max_input_tokens": args.max_input_tokens}, "selection_rule": "top-k calibration mean-separation norm; ties use lower layer index; first and last layers excluded", "methods": methods, "alpha": args.alpha, "sft_steps": args.sft_steps, "learning_rate": args.learning_rate}
    identity["source_sha256"] = {name: sha256(Path(__file__).with_name(name)) for name in ["run-research-experiment.py", "research_experiment.py", "checkpoint_tools.py", "abliteration_math.py"]}
    (args.output / "identity.json").write_text(json.dumps(identity, indent=2) + "\n")
    emit("loaded", pid=os.getpid(), model=source_lock["lock"]["model_id"], device=identity["device"])
    def encode(prompt):
        encoded = tokenizer.apply_chat_template([{"role": "user", "content": prompt}], add_generation_prompt=True, enable_thinking=False, return_dict=True, return_tensors="pt")
        if encoded["input_ids"].shape[1] > args.max_input_tokens:
            raise ValueError("prompt exceeds token limit; protocol truncation is forbidden")
        return encoded.to(args.device)
    calibration = {"target": [], "control": []}
    with torch.inference_mode():
        for row in protocol:
            if row["split"] != "calibration":
                continue
            deadline()
            result = model(**encode(row["prompt"]), output_hidden_states=True, use_cache=False, logits_to_keep=1)
            # hidden_states[i] is input to block i; i+1 is its output except the
            # final normalized state. Exclude that final block from selection.
            calibration[row["group"]].append(torch.stack([h[0, -1].float().cpu() for h in result.hidden_states[1:]]))
    bad, good = torch.stack(calibration["target"]), torch.stack(calibration["control"])
    candidates = range(1, model.config.num_hidden_layers - 1)
    scores = {i: float((bad[:, i].mean(0) - good[:, i].mean(0)).norm()) for i in candidates}
    if args.top_k > len(scores) or any(not __import__("math").isfinite(s) for s in scores.values()):
        raise ValueError("invalid layer scores or top-k")
    layers = sorted(sorted(scores, key=lambda i: (-scores[i], i))[:args.top_k])
    scores_file = args.output / "layer-scores.txt"
    scores_file.write_text(f"{len(scores)} 2\n" + "".join(f"{i} {score:.9g}\n" for i, score in scores.items()))
    if args.cxx:
        native_scores_path = str(scores_file.resolve())
        if os.name == "posix" and args.cxx.suffix.lower() == ".exe":
            native_scores_path = subprocess.run(["wslpath", "-w", native_scores_path], check=True, capture_output=True, text=True, timeout=10).stdout.strip()
        native = subprocess.run([str(args.cxx), "select-layers", "--scores", native_scores_path, "--count", str(args.top_k)], check=True, capture_output=True, text=True, timeout=30)
        if json.loads(native.stdout)["layers"] != layers:
            raise ValueError("native/Python layer selection disagreement")
    directions = {str(i): mean_difference(bad[:, i], good[:, i]) for i in range(model.config.num_hidden_layers)}
    torch.save(directions, args.output / "directions.pt")
    selection = plan(args.model, layers, ["o_proj", "down_proj"])
    (args.output / "selection.json").write_text(json.dumps(selection, indent=2) + "\n")
    parameters = dict(model.named_parameters())
    all_names = set(plan(args.model, list(range(model.config.num_hidden_layers)), ["o_proj", "down_proj"])["selected_tensors"])
    original = {name: parameters[name].detach().cpu().clone() for name in all_names}
    emit("selected", layers=layers, tensors=len(selection["selected_tensors"]), parameter_fraction=selection["selected_parameter_fraction"])
    test_rows = [r for r in protocol if r["split"] == "test"]
    baseline_logits = {}
    def evaluate(label):
        model.eval(); output = []; kls = []
        with (args.output / f"{label}-responses.jsonl").open("w", encoding="utf-8") as raw, torch.inference_mode():
            for index, row in enumerate(test_rows):
                deadline(); inputs = encode(row["prompt"])
                if row["cohort"] == "benign":
                    logp = torch.log_softmax(model(**inputs, logits_to_keep=1).logits[0, -1].float(), dim=-1).cpu()
                    if label == "baseline": baseline_logits[row["id"]] = logp
                    else:
                        base = baseline_logits[row["id"]]
                        kls.append(float((base.exp() * (base - logp)).sum()))
                generated = model.generate(**inputs, do_sample=False, max_new_tokens=args.max_new_tokens, pad_token_id=tokenizer.pad_token_id)
                tokens = generated[0, inputs["input_ids"].shape[1]:]
                response = tokenizer.decode(tokens, skip_special_tokens=True)
                eos = model.generation_config.eos_token_id
                eos = [eos] if isinstance(eos, int) else eos or []
                truncated = len(tokens) == args.max_new_tokens and (not len(tokens) or int(tokens[-1]) not in eos)
                scored = score_response(row, response, truncated); output.append(scored)
                raw.write(json.dumps({**scored, "response": response}, ensure_ascii=False) + "\n"); raw.flush()
                if (index + 1) % 16 == 0: emit("evaluation_progress", method=label, completed=index+1, total=len(test_rows))
        result = {"cohorts": summarize(output), "mean_benign_next_token_kl": sum(kls) / len(kls) if kls else 0., "rows": output}
        emit("evaluated", method=label, cohorts=result["cohorts"])
        return result
    results = {"baseline": evaluate("baseline")}
    for method in methods:
        deadline()
        for name, tensor in original.items():
            parameters[name].data = tensor.to(args.device, dtype=dtype).clone()
            parameters[name].requires_grad_(False)
        current = plan(args.model, list(range(model.config.num_hidden_layers)) if method == "global-projection" else layers, ["o_proj", "down_proj"])
        training = None
        if method == "selective-sft":
            training_rows = [r for r in protocol if r["split"] == "train"]
            if not training_rows: raise ValueError("selective SFT needs a separate training split")
            trainable = select_trainable(model, set(current["selected_tensors"]))
            for parameter in trainable: parameter.data = parameter.data.float()
            optimizer = torch.optim.AdamW(trainable, lr=args.learning_rate, weight_decay=0.)
            losses = []; model.train()
            for step in range(args.sft_steps):
                deadline(); row = training_rows[step % len(training_rows)]
                prefix = tokenizer.apply_chat_template([{"role": "user", "content": row["prompt"]}], add_generation_prompt=True, enable_thinking=False, tokenize=False)
                prefix_ids = tokenizer(prefix, add_special_tokens=False)["input_ids"]
                full = tokenizer(prefix + row["response"] + tokenizer.eos_token, add_special_tokens=False, return_tensors="pt").to(args.device)
                if full["input_ids"].shape[1] > args.max_input_tokens or full["input_ids"][0, :len(prefix_ids)].tolist() != prefix_ids:
                    raise ValueError("training template prefix changed or sequence exceeds limit")
                labels = full["input_ids"].clone(); labels[:, :len(prefix_ids)] = -100
                optimizer.zero_grad(set_to_none=True)
                with torch.autocast(device_type=args.device, dtype=dtype, enabled=args.device == "cuda"):
                    loss = model(**full, labels=labels, use_cache=False).loss
                if not torch.isfinite(loss): raise ValueError("non-finite SFT loss")
                loss.backward(); torch.nn.utils.clip_grad_norm_(trainable, 1.); optimizer.step(); losses.append(float(loss.detach()))
            for parameter in trainable: parameter.data = parameter.data.to(dtype); parameter.requires_grad_(False)
            del optimizer
            training = {"steps": len(losses), "losses": losses, "trainable_tensors": len(trainable), "trainable_parameters": sum(p.numel() for p in trainable), "objective": "assistant-response cross entropy on benign training split"}
        else:
            mode = "norm-preserving" if method == "norm-preserving" else "projected"
            with torch.no_grad():
                for name in current["selected_tensors"]:
                    layer = current["selected_tensors"][name]["layer"]
                    parameters[name].copy_(apply_mode(parameters[name], directions[str(layer)].to(args.device), mode, args.alpha))
        results[method] = evaluate(method)
        transformed = {name: parameters[name].detach().cpu().clone() for name in current["selected_tensors"]}
        export = write_candidate(args.model, args.output / method, current, lambda name, tensor: transformed[name].to(tensor.dtype), provenance={"method": method, "source_revision": source_lock["lock"]["revision"], "protocol_sha256": identity["protocol_sha256"], "alpha": args.alpha if method != "selective-sft" else None, "training": training})
        results[method]["edit"] = {"selected_layers": current["layers"], "selected_tensors": len(current["selected_tensors"]), "changed_tensors": export["changed_tensor_count"], "parameter_fraction": current["selected_parameter_fraction"], "unselected_tensors_identical": export["unselected_tensors_identical"]}
        if training: results[method]["training"] = training
        (args.output / "results.partial.json").write_text(json.dumps(results, indent=2) + "\n")
        del transformed
    summary = {"schema_version": 1, "status": "completed", "identity": identity, "elapsed_seconds": time.time()-started, "results": results, "limitations": ["Small hand-authored tutorial protocol, not AdvBench, HarmBench, or an official XSTest reproduction.", "Refusal is a lexical screening metric, not a semantic harmfulness judge or attack success rate.", "Capability probes use exact-match toy questions; they do not establish general capability retention.", "Calibration-only top-k is a localization baseline, not a causal validation of the selected layers.", "Selected-tensor SFT is a generic control, not a NeST or LoMC reproduction.", "No 98% reduction is assumed; report absolute percentage points and relative changes only with a nonzero baseline."]}
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    emit("completed", output=str(args.output), elapsed_seconds=summary["elapsed_seconds"])


if __name__ == "__main__":
    main()
