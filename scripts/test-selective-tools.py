#!/usr/bin/env python3
"""CPU regression tests for selective checkpoint integrity and experiment boundaries."""
import importlib.util
import json
import struct
import tempfile
import unittest
from pathlib import Path

import torch
from safetensors import safe_open
from safetensors.torch import save_file
from abliteration_math import apply_mode
from checkpoint_tools import inventory, parse_layers, plan, sha256, write_candidate
from research_experiment import load_protocol, score_response, select_trainable, wilson

spec = importlib.util.spec_from_file_location("selective_cli", Path(__file__).with_name("selective-checkpoint.py"))
cli = importlib.util.module_from_spec(spec); spec.loader.exec_module(cli)


class SelectiveCheckpointTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.base = self.root / "base"; self.base.mkdir()
        self.name = "model.layers.1.mlp.down_proj.weight"
        weights = {self.name: torch.tensor([[1., 2.], [2., 3.], [3., 4.]]), "model.layers.0.mlp.down_proj.weight": torch.eye(3, 2)}
        save_file(weights, str(self.base / "one.safetensors"), metadata={"format": "pt", "research": "test"})
        save_file({"model.embed_tokens.weight": torch.ones(4, 3)}, str(self.base / "two.safetensors"))
        index = {"weight_map": {**{k: "one.safetensors" for k in weights}, "model.embed_tokens.weight": "two.safetensors"}, "metadata": {"total_size": 96}}
        (self.base / "model.safetensors.index.json").write_text(json.dumps(index))
        (self.base / "chat_template.jinja").write_text("{{ messages }}")

    def test_only_selected_tensor_changes_and_roundtrip_is_independent(self):
        selection = plan(self.base, [1], ["down_proj"])
        hashes = {s: sha256(self.base / s) for s in inventory(self.base)["shards"]}
        out = self.root / "candidate"
        report = write_candidate(self.base, out, selection, lambda name, w: apply_mode(w, torch.tensor([1., 0., 0.]), "projected"), provenance={"test": True})
        self.assertEqual(report["changed_tensor_count"], 1)
        self.assertTrue(report["unselected_tensors_identical"])
        self.assertEqual(hashes, {s: sha256(self.base / s) for s in hashes})
        self.assertEqual(sha256(self.base / "two.safetensors"), sha256(out / "two.safetensors"))
        self.assertEqual((out / "chat_template.jinja").read_text(), "{{ messages }}")
        with safe_open(str(out / "one.safetensors"), framework="pt") as f:
            self.assertEqual(f.metadata()["research"], "test")
        verified = cli.verify(self.base, out)
        self.assertEqual(verified["changed_tensors"], [self.name])
        self.assertEqual(verified["unselected_tensors_identical"], 2)
        manifest_path = out / "edit-manifest.json"
        original_manifest = manifest_path.read_text()
        tampered = json.loads(original_manifest)
        tampered["plan"]["selected_tensors"]["model.embed_tokens.weight"] = {}
        manifest_path.write_text(json.dumps(tampered))
        with self.assertRaisesRegex(ValueError, "selection disagrees"):
            cli.verify(self.base, out)
        manifest_path.write_text(original_manifest)
        with (out / "two.safetensors").open("r+b") as f:
            f.seek(-1, 2); f.write(b"\x01")
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            cli.verify(self.base, out)

    def test_atomic_failure_and_no_overwrite(self):
        selection = plan(self.base, [1], ["down_proj"])
        out = self.root / "bad"
        with self.assertRaisesRegex(ValueError, "invalid transformed"):
            write_candidate(self.base, out, selection, lambda name, w: w * float("nan"), provenance={})
        self.assertFalse(out.exists())
        self.assertFalse(list(self.root.glob(".bad-*")))
        with self.assertRaisesRegex(ValueError, "new directory"):
            write_candidate(self.base, self.base, selection, lambda name, w: w, provenance={})
        with self.assertRaisesRegex(ValueError, "outside"):
            write_candidate(self.base, self.base / "nested", selection, lambda name, w: w, provenance={})

    def test_missing_layer_and_unsupported_module_fail(self):
        for layers, modules in [([20], ["down_proj"]), ([1], ["o_proj"]), ([1], ["q_proj"]), ([1, 1], ["down_proj"])]:
            with self.assertRaises(ValueError): plan(self.base, layers, modules)
        self.assertEqual(parse_layers("1,3-5"), [1, 3, 4, 5])
        for value in ["", "-1", "5-3", "0-999999999", "1.5", "1,"]:
            with self.assertRaises(ValueError): parse_layers(value)

    def test_index_and_header_are_validated_without_tensor_loading(self):
        index = self.base / "model.safetensors.index.json"
        index.write_text('{"weight_map":{"outside":"../outside.safetensors"}}')
        with self.assertRaisesRegex(ValueError, "index"):
            inventory(self.base)
        index.unlink()
        (self.base / "hostile.safetensors").write_bytes(struct.pack("<Q", 2**64-1))
        with self.assertRaisesRegex(ValueError, "header length"):
            inventory(self.base)

    def test_norm_preserving_and_invalid_strength(self):
        w = torch.tensor([[3., 0.], [4., 0.], [2., 0.]])
        r = torch.tensor([1., 0., 0.])
        out = apply_mode(w, r, "norm-preserving")
        self.assertTrue(torch.allclose(out.norm(dim=0), w.norm(dim=0)))
        self.assertTrue(torch.allclose(r @ out, torch.zeros(2)))
        self.assertTrue(torch.equal(w, apply_mode(w, r, "norm-preserving", 0.)))
        for alpha in [float("nan"), float("inf"), -1., 1.5]:
            with self.assertRaises(ValueError): apply_mode(w, r, "norm-preserving", alpha)
        with self.assertRaisesRegex(ValueError, "erased"):
            apply_mode(torch.tensor([[1.], [0.], [0.]]), r, "norm-preserving")
        with self.assertRaisesRegex(ValueError, "nonzero"):
            apply_mode(w, torch.zeros(3), "projected")


class ProtocolTests(unittest.TestCase):
    def test_frozen_parameters_remain_identical_after_training(self):
        model = torch.nn.Sequential(torch.nn.Linear(3, 4), torch.nn.Linear(4, 2))
        before = {n: p.detach().clone() for n, p in model.named_parameters()}
        selected = select_trainable(model, {"1.weight"})
        optimizer = torch.optim.SGD(selected, lr=.1)
        model(torch.ones(1, 3)).sum().backward(); optimizer.step()
        for name, p in model.named_parameters():
            self.assertEqual(p.requires_grad, name == "1.weight")
            self.assertEqual(torch.equal(before[name], p), name != "1.weight")

    def test_real_protocol_has_disjoint_splits(self):
        rows = load_protocol(Path(__file__).resolve().parents[1] / "data/experiments/minicpm5-protocol.jsonl")
        self.assertEqual(sum(r["split"] == "test" for r in rows), 40)
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "leak.jsonl"
            p.write_text("\n".join(json.dumps(x) for x in rows + [dict(rows[0], id="different", split="test", cohort="benign")]))
            with self.assertRaisesRegex(ValueError, "leakage"): load_protocol(p)

    def test_empty_output_is_not_refusal_and_interval_is_nontrivial(self):
        row = {"id": "probe", "cohort": "benign"}
        score = score_response(row, "", False)
        self.assertTrue(score["degenerate"]); self.assertFalse(score["refused"])
        self.assertGreater(wilson(0, 8)[1], .3)
        self.assertLess(wilson(8, 8)[0], .7)


if __name__ == "__main__":
    unittest.main()
