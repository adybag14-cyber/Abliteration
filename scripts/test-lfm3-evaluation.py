#!/usr/bin/env python3
"""Offline contracts for LFM3 provenance, split isolation and honest metrics."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from lfm3_evaluation import PROFILES, generated_span, screen, select_profile, summarize, validate_protocol
from model_lock import validate_file_manifest, verify_files
from lfm3_report import verify_measurement

ROOT = Path(__file__).resolve().parents[1]


def row(identifier="cal", split="calibration", dataset="calibration_v1", prompt="Explain a compiler warning."):
    return {"id": identifier, "split": split, "dataset": dataset, "expected": "comply", "prompt": prompt}


class ProtocolTests(unittest.TestCase):
    def protocol(self):
        return [row(), row("test", "test", "xstest_safe", "Explain a photograph.")]

    def test_benign_protocol_is_valid(self):
        validate_protocol(self.protocol())

    def test_harmful_or_unknown_cohorts_are_not_calibration_candidates(self):
        for dataset in ["huihui", "jbb_harmful", "strongreject"]:
            rows = self.protocol()
            rows[1]["dataset"] = dataset
            with self.subTest(dataset=dataset), self.assertRaises(ValueError):
                validate_protocol(rows)
        rows = self.protocol(); rows[1]["expected"] = "refuse"
        with self.assertRaises(ValueError):
            validate_protocol(rows)

    def test_duplicate_ids_and_calibration_leakage_fail(self):
        rows = self.protocol(); rows[1]["id"] = rows[0]["id"]
        with self.assertRaisesRegex(ValueError, "unique"):
            validate_protocol(rows)
        rows = self.protocol(); rows[1]["prompt"] = "  EXPLAIN a compiler warning. "
        with self.assertRaisesRegex(ValueError, "leakage"):
            validate_protocol(rows)

    def test_invalid_generations_cannot_look_like_zero_refusal(self):
        for response, truncated, error in [("", False, None), ("...", False, None),
                                            ("An answer", True, None), ("An answer", False, "HTTP 500")]:
            value = summarize([screen(row(), response, truncated=truncated, error=error)])["calibration_v1"]
            self.assertIsNone(value["lexical_marker_rate"])
            self.assertIsNone(value["wilson_95"])
            self.assertEqual(value["invalid_or_censored"], 1)

    def test_zero_marker_rate_has_uncertainty_and_no_semantic_claim(self):
        value = summarize([screen(row(), "A useful answer.", truncated=False)])["calibration_v1"]
        self.assertEqual(value["lexical_marker_rate"], 0)
        self.assertGreater(value["wilson_95"][1], 0)
        self.assertIsNone(value["semantic_refusal_rate"])
        with self.assertRaises(ValueError):
            summarize([])

    def test_batch_padding_is_not_mistaken_for_truncated_generation(self):
        self.assertEqual(generated_span([12, 99, 0, 0], {99}, 4), ([12, 99], False))
        self.assertEqual(generated_span([12, 13, 14, 99], {99}, 4), ([12, 13, 14, 99], False))
        self.assertEqual(generated_span([12, 13, 14, 15], {99}, 4), ([12, 13, 14, 15], True))

    def test_selection_is_calibration_only_and_ties_prefer_baseline(self):
        answer = screen(row(), "A useful answer.", truncated=False)
        refusal = screen(row(), "I cannot help with that.", truncated=False)
        self.assertEqual(select_profile({"baseline": [answer], "context": [answer]}), "baseline")
        self.assertEqual(select_profile({"baseline": [refusal], "context": [answer]}), "context")
        test = {**answer, "split": "test"}
        with self.assertRaisesRegex(ValueError, "calibration"):
            select_profile({"baseline": [test], "context": [test]})
        with self.assertRaisesRegex(ValueError, "coverage"):
            select_profile({"baseline": [answer], "context": [{**answer, "id": "other"}]})

    def test_runtime_and_dataset_locks_are_explicit(self):
        lock = json.loads((ROOT / "data/models/lfm3-1.7b.json").read_text())
        self.assertEqual(lock["model_id"], "LiquidAI/LFM3-1.7B")
        self.assertEqual(lock["architecture"], "Lfm3ForCausalLM")
        self.assertEqual(lock["parameters"], 1728801536)
        self.assertEqual(sum(lock["layer_type_counts"].values()), 24)
        validate_file_manifest(lock["files"])
        self.assertTrue(all(name in lock["files"] for name in ["configuration_lfm3.py", "modeling_lfm3.py", "lfm3_conv.py", "chat_template.jinja"]))
        sources = json.loads((ROOT / "data/benchmarks/lfm3-benign.json").read_text())["sources"]
        self.assertEqual({s["id"]: s["selected_rows"] for s in sources}, {"xstest_safe": 250, "jbb_benign": 100})
        self.assertEqual(sources[0]["filter"], {"label": "safe"})
        self.assertEqual(sources[1]["prompt_column"], "Goal")


class FileLockTests(unittest.TestCase):
    def manifest(self):
        return {"modeling.py": {"sha256": hashlib.sha256(b"pass\n").hexdigest(), "bytes": 5}}

    def test_code_bytes_are_verified_before_execution(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); path = root / "modeling.py"; path.write_bytes(b"pass\n")
            self.assertEqual(verify_files(root, self.manifest())["modeling.py"], self.manifest()["modeling.py"]["sha256"])
            path.write_bytes(b"fail\n")
            with self.assertRaisesRegex(ValueError, "SHA-256"):
                verify_files(root, self.manifest())

    def test_unsafe_names_sizes_hashes_and_aliases_fail(self):
        for name in ["../model.py", "a/b.py", "a\\b.py", "C:model.py", ".", "x\0.py"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                validate_file_manifest({name: self.manifest()["modeling.py"]})
        for field, value in [("bytes", True), ("bytes", -1), ("sha256", "main")]:
            data = self.manifest(); data["modeling.py"][field] = value
            with self.assertRaises(ValueError):
                validate_file_manifest(data)
        data = self.manifest(); data["MODELING.py"] = copy.deepcopy(data["modeling.py"])
        with self.assertRaisesRegex(ValueError, "alias"):
            validate_file_manifest(data)


class EvidenceTests(unittest.TestCase):
    def fixture(self):
        protocol = [row(), row("test", "test", "xstest_safe", "Explain a photograph.")]
        responses = [{**screen(prompt, "A useful answer.", truncated=False), "profile": profile,
                      "response": "A useful answer.", "generated_tokens": 4, "seconds": 0.1}
                     for split in ["calibration", "test"] for profile in PROFILES
                     for prompt in protocol if prompt["split"] == split]
        calibrated = {p: [r for r in responses if r["profile"] == p and r["split"] == "calibration"] for p in PROFILES}
        selection = {"selected_profile": "baseline", "calibration": {p: summarize(calibrated[p]) for p in PROFILES}}
        identity = {"profiles": PROFILES, "test_limit_per_dataset": 0, "decoding": {"max_new_tokens": 32}}
        summary = {"weights_unchanged": True, "complete_benign_suites": True, "selection": copy.deepcopy(selection),
                   "test": {p: summarize([r for r in responses if r["profile"] == p and r["split"] == "test"]) for p in PROFILES}}
        return protocol, identity, summary, responses, selection, "completed"

    def test_complete_evidence_is_recomputed_without_semantic_claim(self):
        proof = verify_measurement(*self.fixture())
        self.assertEqual(proof["response_records"], 4)
        self.assertFalse(proof["semantic_judging_performed"])

    def test_missing_duplicate_reordered_and_tampered_responses_fail(self):
        for mutation in [lambda rs: rs.pop(), lambda rs: rs.append(rs[-1]),
                         lambda rs: rs.reverse(), lambda rs: rs[0].update(response="I cannot help with that.")]:
            args = self.fixture(); mutation(args[3])
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                verify_measurement(*args)

    def test_edited_selection_and_metrics_cannot_be_published(self):
        args = self.fixture(); args[2]["test"]["baseline"]["xstest_safe"]["marker_hits"] = 99
        with self.assertRaisesRegex(ValueError, "metrics"):
            verify_measurement(*args)
        args = self.fixture()
        args[2]["selection"]["selected_profile"] = args[4]["selected_profile"] = "context"
        with self.assertRaisesRegex(ValueError, "calibration-only"):
            verify_measurement(*args)

    def test_partial_run_and_pilot_relabelling_fail(self):
        args = list(self.fixture()); args[-1] = "failed"
        with self.assertRaisesRegex(ValueError, "terminal"):
            verify_measurement(*args)
        args = self.fixture(); args[1]["test_limit_per_dataset"] = 1
        with self.assertRaisesRegex(ValueError, "pilot/full"):
            verify_measurement(*args)


if __name__ == "__main__":
    unittest.main()
