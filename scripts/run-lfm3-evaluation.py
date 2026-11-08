#!/usr/bin/env python3
"""Compare unchanged LFM3 under two predeclared benign-request prompt profiles.

This does not edit model weights or optimize harmful-request compliance. Raw
benign responses remain in the requested local output directory.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import platform
import random
import subprocess
import sys
import time

from lfm3_evaluation import PROFILES, generated_span, load_protocol, screen, select_profile, summarize, text_hash
from model_lock import sha256, verify_files


def emit(event, **fields):
    print(json.dumps({"event": event, **fields}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--lock", type=Path, default=Path(__file__).resolve().parents[1] / "data/models/lfm3-1.7b.json")
    parser.add_argument("--protocol", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["cuda", "cpu"], default="cuda")
    parser.add_argument("--max-new-tokens", type=int, default=2048)
    parser.add_argument("--max-input-tokens", type=int, default=4096)
    parser.add_argument("--test-limit", type=int, default=0, help="Pilot limit per dataset; zero runs every test row")
    parser.add_argument("--timeout-seconds", type=int, default=7200)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=4)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("output must be a new directory; previous measurements are immutable")
    if not (16 <= args.max_new_tokens <= 4096 and 32 <= args.max_input_tokens <= 8192
            and 0 <= args.test_limit <= 1000 and 60 <= args.timeout_seconds <= 14400
            and 1 <= args.batch_size <= 8):
        parser.error("parameters are outside the bounded evaluation ranges")
    rows = load_protocol(args.protocol)
    protocol_lock = json.loads(args.protocol.with_name("protocol-lock.json").read_text())
    if sha256(args.protocol) != protocol_lock["protocol_sha256"]:
        raise ValueError("protocol no longer matches its prepared-source manifest")
    source_lock = json.loads((args.model / "source-lock.json").read_text())
    lock = source_lock["lock"]
    if lock != json.loads(args.lock.read_text(encoding="utf-8")):
        raise ValueError("download identity differs from the requested repository model lock")
    if lock["model_id"] != "LiquidAI/LFM3-1.7B" or lock["model_type"] != "lfm3":
        raise ValueError("this study requires the pinned instruction-tuned LFM3 checkpoint")
    runtime_files = verify_files(args.model, lock["files"])
    if source_lock.get("runtime_files_sha256") != runtime_files:
        raise ValueError("model runtime files changed since verified download")
    args.output.mkdir(parents=True)
    started = time.monotonic()
    identity = {"pid": os.getpid(), "parent_pid": os.getppid(), "executable": sys.executable,
                "command": sys.argv, "started_at": datetime.now(timezone.utc).isoformat(),
                "model": lock, "protocol": protocol_lock, "profiles": PROFILES,
                "python": platform.python_version(), "platform": platform.platform(),
                "seed": args.seed, "test_limit_per_dataset": args.test_limit,
                "decoding": {"do_sample": False, "repetition_penalty": 1.1,
                             "batch_size": args.batch_size, "padding_side": "left",
                             "enable_thinking": False, "max_new_tokens": args.max_new_tokens,
                             "max_input_tokens": args.max_input_tokens},
                "source_sha256": {name: sha256(Path(__file__).with_name(name)) for name in
                                  ["run-lfm3-evaluation.py", "lfm3_evaluation.py", "model_lock.py", "research_experiment.py"]}}
    if os.name == "posix":
        identity["start_ticks"] = Path(f"/proc/{os.getpid()}/stat").read_text().rsplit(")", 1)[1].split()[19]
        identity["process_executable"] = str(Path(f"/proc/{os.getpid()}/exe").resolve())
        identity["process_command"] = Path(f"/proc/{os.getpid()}/cmdline").read_bytes().decode().split("\0")[:-1]
    status_path = args.output / "status.json"
    status_path.write_text(json.dumps({"status": "loading", "identity": identity}, indent=2))
    emit("loading", pid=os.getpid(), model=lock["model_id"], revision=lock["revision"])
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    os.environ["USE_HUB_KERNELS"] = "0"
    os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
    os.environ.setdefault("HF_MODULES_CACHE", str(args.output / "module-cache"))
    os.environ.setdefault("TRITON_CACHE_DIR", str(args.model.parent / "triton-cache"))
    try:
        import torch
        import transformers
        from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig
        random.seed(args.seed)
        torch.manual_seed(args.seed)
        torch.set_num_threads(6)
        torch.use_deterministic_algorithms(True)
        if args.device == "cuda":
            if not torch.cuda.is_available() or torch.cuda.mem_get_info()[0] < 8 * 1024**3:
                raise RuntimeError("CUDA needs 8 GiB currently free; unrelated GPU processes must remain untouched")
            torch.cuda.set_per_process_memory_fraction(0.4)
            torch.backends.cuda.matmul.allow_tf32 = False
            torch.backends.cudnn.benchmark = False
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.allow_tf32 = False
        dtype = torch.bfloat16 if args.device == "cuda" else torch.float32
        tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True, trust_remote_code=False)
        tokenizer.padding_side = "left"
        model = AutoModelForCausalLM.from_pretrained(args.model, local_files_only=True,
                    trust_remote_code=True, use_safetensors=True, dtype=dtype,
                    attn_implementation="sdpa").to(args.device).eval()
        model.requires_grad_(False)
        if (model.config.model_type != "lfm3" or model.config.num_hidden_layers != 24
                or sum(p.numel() for p in model.parameters()) != lock["parameters"]):
            raise ValueError("loaded model identity/parameter count differs from the lock")
        identity.update(torch=torch.__version__, transformers=transformers.__version__,
                        device=torch.cuda.get_device_name() if args.device == "cuda" else "cpu",
                        dtype=str(dtype), model_class=type(model).__module__ + "." + type(model).__name__)
        (args.output / "identity.json").write_text(json.dumps(identity, indent=2) + "\n")
        generation = GenerationConfig(do_sample=False, temperature=1.0, repetition_penalty=1.1,
                        max_new_tokens=args.max_new_tokens, use_cache=True,
                        eos_token_id=model.generation_config.eos_token_id,
                        pad_token_id=model.generation_config.pad_token_id)
        eos = generation.eos_token_id
        eos_ids = {eos} if isinstance(eos, int) else set(eos)
        test_rows = []
        counts = {}
        for row in rows:
            if row["split"] == "test":
                counts[row["dataset"]] = counts.get(row["dataset"], 0) + 1
                if not args.test_limit or counts[row["dataset"]] <= args.test_limit:
                    test_rows.append(row)
        calibration_rows = [r for r in rows if r["split"] == "calibration"]
        results = {profile: {"calibration": [], "test": []} for profile in PROFILES}
        total = 2 * (len(calibration_rows) + len(test_rows))
        completed = 0
        with (args.output / "responses.jsonl").open("x", encoding="utf-8") as raw:
            def evaluate(profile, subset):
                nonlocal completed
                for offset in range(0, len(subset), args.batch_size):
                    if time.monotonic() - started > args.timeout_seconds:
                        raise TimeoutError("LFM3 study deadline exceeded")
                    batch = subset[offset:offset + args.batch_size]
                    conversations = []
                    for row in batch:
                        messages = []
                        if PROFILES[profile]:
                            messages.append({"role": "system", "content": PROFILES[profile]})
                        messages.append({"role": "user", "content": row["prompt"]})
                        conversations.append(messages)
                    encoded = tokenizer.apply_chat_template(conversations, add_generation_prompt=True,
                                enable_thinking=False, padding=True, return_dict=True, return_tensors="pt")
                    if encoded["input_ids"].shape[1] > args.max_input_tokens:
                        raise ValueError("prompt exceeds input cap; truncating benchmark prompts is forbidden")
                    encoded = encoded.to(args.device)
                    begin = time.monotonic()
                    with torch.inference_mode():
                        output = model.generate(**encoded, generation_config=generation)
                    duration = time.monotonic() - begin
                    for index, row in enumerate(batch):
                        tokens = output[index, encoded["input_ids"].shape[1]:].tolist()
                        generated, truncated = generated_span(tokens, eos_ids, args.max_new_tokens)
                        response = tokenizer.decode(generated, skip_special_tokens=True)
                        item = screen(row, response, truncated=truncated)
                        results[profile][row["split"]].append(item)
                        raw.write(json.dumps({**item, "profile": profile, "response": response,
                                  "generated_tokens": len(generated), "seconds": duration / len(batch),
                                  "batch_seconds": duration, "batch_size": len(batch)},
                                  ensure_ascii=False) + "\n")
                    raw.flush()
                    completed += len(batch)
                    if completed % 16 == 0 or completed == total:
                        emit("progress", completed=completed, total=total, split=row["split"], profile=profile)
            for profile in PROFILES:
                evaluate(profile, calibration_rows)
            selected = select_profile({p: results[p]["calibration"] for p in PROFILES})
            selection = {"selected_profile": selected, "selected_at": datetime.now(timezone.utc).isoformat(),
                         "rule": "calibration-only: zero invalid/censored rows, then fewest lexical marker hits; ties prefer baseline",
                         "profiles_sha256": text_hash(json.dumps(PROFILES, sort_keys=True)),
                         "calibration": {p: summarize(results[p]["calibration"]) for p in PROFILES}}
            (args.output / "selection-before-test.json").write_text(json.dumps(selection, indent=2) + "\n")
            emit("selected", profile=selected)
            for profile in PROFILES:
                evaluate(profile, test_rows)
        after = verify_files(args.model, lock["files"])
        if after != runtime_files:
            raise ValueError("the supposedly unchanged checkpoint/runtime files were modified")
        summary = {"schema": 1, "model_id": lock["model_id"], "revision": lock["revision"],
                   "weights_unchanged": True, "method": "unchanged weights; benign prompt-context comparison",
                   "complete_benign_suites": args.test_limit == 0, "selection": selection,
                   "test": {p: summarize(results[p]["test"]) for p in PROFILES},
                   "semantic_judging": "not performed; lexical screens are not semantic refusal or attack-success rates",
                   "safety_benchmarks": {name: {"status": "not_run", "score": None} for name in
                       ["huihui-ai/harmbench_behaviors", "JBB harmful", "StrongREJECT", "RefusalBench"]},
                   "responses_sha256": sha256(args.output / "responses.jsonl"),
                   "seconds": time.monotonic() - started,
                   "source_sha256": identity["source_sha256"], "runtime": {k: identity[k] for k in
                       ["torch", "transformers", "python", "device", "dtype", "model_class", "decoding"]}}
        (args.output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
        invalid = sum(s["invalid_or_censored"] for p in summary["test"].values() for s in p.values())
        status = "needs-review" if invalid else "completed"
        status_path.write_text(json.dumps({"status": status, "pid": os.getpid(), "seconds": summary["seconds"]}, indent=2))
        emit(status, output=str(args.output), selected=selected, invalid_or_censored=invalid)
        return 2 if invalid else 0
    except Exception as error:
        status_path.write_text(json.dumps({"status": "failed", "pid": os.getpid(),
                                        "error": str(error), "seconds": time.monotonic() - started}, indent=2))
        raise


if __name__ == "__main__":
    raise SystemExit(main())
