#!/usr/bin/env python3
"""Run pinned lm-eval capability tasks; bounded subsets are labelled as smoke tests."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import importlib.metadata
import hashlib
import io
import json
import os
from pathlib import Path
import sys
import time
import urllib.request
import zipfile

from lfm3_evaluation import PROFILES
from model_lock import sha256, verify_files

ROOT = Path(__file__).resolve().parents[1]


def prepare_nltk(source, directory):
    """Install only four English tokenizer tables from the hash-pinned archive."""
    with urllib.request.urlopen(source["url"], timeout=60) as response:
        payload = response.read(source["bytes"] + 1)
    if len(payload) != source["bytes"] or hashlib.sha256(payload).hexdigest() != source["sha256"]:
        raise ValueError("NLTK tokenizer archive changed")
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        target = directory / "tokenizers/punkt_tab/english"
        target.mkdir(parents=True)
        for filename in ["collocations.tab", "sent_starters.txt", "abbrev_types.txt", "ortho_context.tab"]:
            (target / filename).write_bytes(archive.read("punkt_tab/english/" + filename))
    os.environ["NLTK_DATA"] = str(directory.resolve())


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model", type=Path)
    p.add_argument("--tasks", default="arc_challenge,hellaswag,winogrande,truthfulqa_mc2")
    p.add_argument("--limit", type=int, default=32, help="Examples per leaf task; zero runs the full selected tasks")
    p.add_argument("--batch-size", type=int, default=2)
    p.add_argument("--profile", choices=list(PROFILES), default="baseline")
    p.add_argument("--prepare-only", action="store_true", help="Resolve pinned task data without loading a model")
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    if args.output.exists() or not 0 <= args.limit <= 10000 or not 1 <= args.batch_size <= 8:
        p.error("use a new output directory, limit 0..10000 and batch size 1..8")
    if not args.prepare_only and args.model is None:
        p.error("--model is required for inference")
    lock = json.loads((ROOT / "data/benchmarks/lfm3-capabilities.json").read_text())
    names = args.tasks.split(",")
    if not names or len(names) != len(set(names)) or any(name not in lock["tasks"] for name in names):
        p.error("tasks must be unique names from the capability lock")
    if importlib.metadata.version("lm_eval") != lock["lm_eval_version"]:
        raise ValueError("install the exact lm_eval version from requirements-lfm3.txt")
    args.output.mkdir(parents=True)
    started = time.monotonic()
    identity = {"pid": os.getpid(), "parent_pid": os.getppid(), "executable": sys.executable,
                "command": sys.argv, "started_at": datetime.now(timezone.utc).isoformat()}
    if os.name == "posix":
        identity.update(start_ticks=Path(f"/proc/{os.getpid()}/stat").read_text().rsplit(")", 1)[1].split()[19],
                        process_executable=str(Path(f"/proc/{os.getpid()}/exe").resolve()),
                        process_command=Path(f"/proc/{os.getpid()}/cmdline").read_bytes().decode().split("\0")[:-1])
    status_path = args.output / "status.json"
    status_path.write_text(json.dumps({"status": "preparing", "identity": identity}, indent=2))
    os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    os.environ["USE_HUB_KERNELS"] = "0"
    os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
    os.environ.setdefault("HF_HOME", str(args.output.parent / "capability-hf-cache"))
    os.environ.setdefault("HF_MODULES_CACHE", str(args.output / "module-cache"))
    os.environ.setdefault("TRITON_CACHE_DIR", str(args.output.parent / "triton-cache"))
    try:
        if "ifeval" in names:
            prepare_nltk(lock["nltk_punkt_tab"], args.output / "nltk-data")
        from lm_eval import simple_evaluate
        from lm_eval.tasks import TaskManager
        manager = TaskManager()
        roots = []
        for name in names:
            entry = manager.task_index[name]
            dataset = lock["tasks"][name]
            if name != "mmlu" and entry.cfg["dataset_path"] != dataset:
                raise ValueError("upstream task dataset changed")
            # This factory API is bound to the exact lm_eval version above.
            # Pass only task overrides: a full group dict would propagate its
            # aggregate_metric_list into leaf TaskConfig in lm_eval 0.4.13.
            overrides = {"dataset_kwargs": {**entry.cfg.get("dataset_kwargs", {}),
                                              "revision": lock["datasets"][dataset]}}
            roots.append(manager._factory.build(entry, overrides=overrides, registry=manager.task_index))
        loaded = manager.load(roots)
        task_proof = {}
        for name, task in loaded["tasks"].items():
            config = task.config
            dataset = config.dataset_path
            if dataset not in lock["datasets"] or config.dataset_kwargs.get("revision") != lock["datasets"][dataset]:
                raise ValueError("a leaf task escaped dataset revision pinning")
            task_proof[name] = {"dataset": dataset, "revision": config.dataset_kwargs["revision"],
                                "config": config.dataset_name, "num_fewshot": config.num_fewshot or 0,
                                "output_type": config.output_type,
                                "generation_kwargs": config.generation_kwargs,
                                "version": (config.metadata or {}).get("version"),
                                "split_fingerprints": {split: ds._fingerprint for split, ds in task.dataset.items()}}
        if "mmlu" in names and len([n for n in task_proof if n.startswith("mmlu_")]) != 57:
            raise ValueError("the pinned MMLU group must contain all 57 subjects")
        proof = {"schema": 1, "lm_eval_version": lock["lm_eval_version"],
                 "lm_eval_commit": lock["lm_eval_commit"], "requested_tasks": names, "leaf_tasks": task_proof,
                 "limit_per_leaf_task": args.limit or None, "full_selected_tasks": args.limit == 0,
                 "label": "full selected capability tasks" if args.limit == 0 else "bounded capability smoke; not leaderboard scores",
                 "profile": args.profile, "system_prompt": PROFILES[args.profile],
                 "chat_template": True, "enable_thinking": False, "batch_size": args.batch_size,
                 "max_context_tokens": 4096, "seed": 42,
                 "source_sha256": sha256(Path(__file__)),
                 "benchmark_lock_sha256": sha256(ROOT / "data/benchmarks/lfm3-capabilities.json")}
        (args.output / "task-provenance.json").write_text(json.dumps(proof, indent=2) + "\n")
        if args.prepare_only:
            status_path.write_text(json.dumps({"status": "prepared", "leaf_tasks": len(task_proof)}))
            print(json.dumps({"status": "prepared", "leaf_tasks": len(task_proof)}), flush=True)
            return
        model_lock = json.loads((ROOT / "data/models/lfm3-1.7b.json").read_text())
        downloaded = json.loads((args.model / "source-lock.json").read_text())
        if downloaded["lock"] != model_lock:
            raise ValueError("model differs from the repository lock")
        before = verify_files(args.model, model_lock["files"])
        if before != downloaded["runtime_files_sha256"]:
            raise ValueError("model runtime files changed")
        import torch
        import transformers
        from lm_eval.models.huggingface import HFLM
        if not torch.cuda.is_available() or torch.cuda.mem_get_info()[0] < 8 * 1024**3:
            raise RuntimeError("CUDA requires 8 GiB free; serialize this with other study runs")
        torch.cuda.set_per_process_memory_fraction(0.4)
        torch.set_num_threads(6)
        torch.manual_seed(42)
        torch.use_deterministic_algorithms(True)
        torch.backends.cuda.matmul.allow_tf32 = False
        torch.backends.cudnn.allow_tf32 = False
        torch.backends.cudnn.benchmark = False
        torch.backends.cudnn.deterministic = True
        os.environ["HF_HUB_OFFLINE"] = "1"
        os.environ["TRANSFORMERS_OFFLINE"] = "1"
        model = HFLM(pretrained=str(args.model.resolve()), tokenizer=str(args.model.resolve()),
                     backend="causal", device="cuda", dtype="bfloat16", batch_size=args.batch_size,
                     max_length=4096, trust_remote_code=True, enable_thinking=False,
                     local_files_only=True, attn_implementation="sdpa")
        model.model.eval().requires_grad_(False)
        if sum(p.numel() for p in model.model.parameters()) != model_lock["parameters"]:
            raise ValueError("loaded parameter count changed")
        results = simple_evaluate(model=model, tasks=roots, task_manager=manager,
                     limit=args.limit or None, bootstrap_iters=1000, log_samples=True,
                     apply_chat_template=True, system_instruction=PROFILES[args.profile],
                     fewshot_as_multiturn=True, random_seed=42, numpy_random_seed=42,
                     torch_random_seed=42, fewshot_random_seed=42,
                     confirm_run_unsafe_code=False)
        raw_path = args.output / "lm-eval-results.json"
        raw_path.write_text(json.dumps(results, indent=2, default=str) + "\n")
        if verify_files(args.model, model_lock["files"]) != before:
            raise ValueError("model runtime files changed during evaluation")
        report = {**proof, "status": "completed", "weights_unchanged": True,
                  "started_at": identity["started_at"], "seconds": time.monotonic() - started,
                  "model_id": model_lock["model_id"], "model_revision": model_lock["revision"],
                  "model_files_sha256": before, "results_sha256": sha256(raw_path),
                  "runtime": {"torch": torch.__version__, "transformers": transformers.__version__,
                              "device": torch.cuda.get_device_name(), "dtype": "bfloat16"},
                  "results": results["results"], "groups": results.get("groups", {}),
                  "n_samples": results["n-samples"], "deployment_certified": False}
        (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
        status_path.write_text(json.dumps({"status": "completed", "seconds": report["seconds"]}))
        print(json.dumps({"status": "completed", "output": str(args.output), "label": proof["label"]}), flush=True)
    except Exception as error:
        status_path.write_text(json.dumps({"status": "failed", "error": str(error), "identity": identity}, indent=2))
        raise


if __name__ == "__main__":
    main()
