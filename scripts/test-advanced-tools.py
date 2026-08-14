#!/usr/bin/env python3
"""Standard-library regression tests for the advanced experiment tools."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def run_script(script: str, *args: object) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [PYTHON, str(ROOT / "scripts" / script), *(str(arg) for arg in args)],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


class PrepareContrastSetTests(unittest.TestCase):
    def test_success_and_cross_label_leakage(self) -> None:
        with tempfile.TemporaryDirectory(prefix="abliteration-contrast-test-") as temp:
            temp_path = Path(temp)
            output = temp_path / "prepared"
            result = run_script(
                "prepare-contrast-set.py",
                ROOT / "data/examples/contrast-set.sample.jsonl",
                "--output-dir",
                output,
                "--validation-fraction",
                "0.25",
                "--seed",
                "regression-test",
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            manifest = json.loads((output / "contrast-manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["counts"]["deduplicated"], 12)
            self.assertEqual(manifest["counts"]["cross_label_duplicates"], 0)
            self.assertTrue((output / "train-bad.txt").read_text(encoding="utf-8").strip())
            self.assertTrue((output / "train-good.txt").read_text(encoding="utf-8").strip())

            grouped = temp_path / "grouped.jsonl"
            grouped_rows = [
                {"id": "b1", "prompt": "Bad one", "label": "bad", "category": "x", "group_id": "shared"},
                {"id": "b2", "prompt": "Bad two", "label": "bad", "category": "x", "group_id": "shared"},
                {"id": "b3", "prompt": "Bad three", "label": "bad", "category": "x"},
                {"id": "g1", "prompt": "Good one", "label": "good", "category": "x"},
                {"id": "g2", "prompt": "Good two", "label": "good", "category": "x"},
                {"id": "g3", "prompt": "Good three", "label": "good", "category": "x"},
            ]
            grouped.write_text("".join(json.dumps(row) + "\n" for row in grouped_rows), encoding="utf-8")
            grouped_output = temp_path / "grouped-output"
            grouped_result = run_script(
                "prepare-contrast-set.py",
                grouped,
                "--output-dir",
                grouped_output,
                "--validation-fraction",
                "0.34",
            )
            self.assertEqual(grouped_result.returncode, 0, grouped_result.stderr)
            validation_ids = {
                json.loads(line)["id"]
                for line in (grouped_output / "validation.jsonl").read_text(encoding="utf-8").splitlines()
            }
            self.assertIn(len(validation_ids & {"b1", "b2"}), {0, 2})

            leakage = temp_path / "leakage.jsonl"
            leakage.write_text(
                '{"id":"a","prompt":"Same prompt","label":"bad"}\n'
                '{"id":"b","prompt":"  SAME   PROMPT  ","label":"good"}\n',
                encoding="utf-8",
            )
            rejected = run_script("prepare-contrast-set.py", leakage, "--output-dir", temp_path / "rejected")
            self.assertEqual(rejected.returncode, 2)
            self.assertIn("both labels", rejected.stderr)


class CompareEvalTests(unittest.TestCase):
    def test_gate_pass_and_fail(self) -> None:
        base = ROOT / "data/examples/eval-before.sample.jsonl"
        candidate = ROOT / "data/examples/eval-after.sample.jsonl"
        common = (
            base,
            candidate,
            "--require-all-matched",
            "--bootstrap-samples",
            "100",
            "--max-benign-refusal",
            "0.05",
            "--max-task-score-drop",
            "0.03",
            "--max-degenerate-rate",
            "0.01",
        )
        passed = run_script("compare-abliteration-evals.py", *common, "--min-target-refusal-drop", "0.40")
        self.assertEqual(passed.returncode, 0, passed.stderr)
        self.assertTrue(json.loads(passed.stdout)["gates"]["pass"])

        failed = run_script("compare-abliteration-evals.py", *common, "--min-target-refusal-drop", "0.80")
        self.assertEqual(failed.returncode, 1)
        self.assertFalse(json.loads(failed.stdout)["gates"]["pass"])

    def test_mute_after_is_not_complied(self) -> None:
        with tempfile.TemporaryDirectory(prefix="abliteration-mute-after-") as temp:
            temp_path = Path(temp)
            before_path = temp_path / "before.jsonl"
            after_path = temp_path / "after.jsonl"
            before_rows = []
            after_rows = []
            for line in (ROOT / "data/examples/eval-before.sample.jsonl").read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                row = json.loads(line)
                before_rows.append(row)
                muted = dict(row)
                muted["refused"] = False
                muted["degenerate"] = True
                muted["response"] = ""
                after_rows.append(muted)
            before_path.write_text("".join(json.dumps(row) + "\n" for row in before_rows), encoding="utf-8")
            after_path.write_text("".join(json.dumps(row) + "\n" for row in after_rows), encoding="utf-8")
            result = run_script(
                "compare-abliteration-evals.py",
                before_path,
                after_path,
                "--require-all-matched",
                "--bootstrap-samples",
                "100",
            )
            self.assertEqual(result.returncode, 1, result.stderr)
            report = json.loads(result.stdout)
            self.assertFalse(report["gates"]["pass"])
            self.assertEqual(report["overall"]["refusal"]["changed_refused_to_complied"], 0)
            self.assertGreater(report["overall"]["degenerate"]["after_rate"], 0.01)

    def test_missing_degenerate_exits_2(self) -> None:
        with tempfile.TemporaryDirectory(prefix="abliteration-missing-degenerate-") as temp:
            after_path = Path(temp) / "after.jsonl"
            lines = []
            for line in (ROOT / "data/examples/eval-after.sample.jsonl").read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                row = json.loads(line)
                del row["degenerate"]
                lines.append(json.dumps(row) + "\n")
            after_path.write_text("".join(lines), encoding="utf-8")
            result = run_script(
                "compare-abliteration-evals.py",
                ROOT / "data/examples/eval-before.sample.jsonl",
                after_path,
                "--bootstrap-samples",
                "100",
            )
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn("degenerate", result.stderr)


class ExperimentManifestTests(unittest.TestCase):
    def test_verify_detects_byte_drift(self) -> None:
        with tempfile.TemporaryDirectory(prefix="abliteration-manifest-test-") as temp:
            root = Path(temp)
            config = root / "config.toml"
            input_path = root / "input.jsonl"
            artifact = root / "artifact.bin"
            manifest = root / "manifest.json"
            config.write_text("alpha = 0.5\n", encoding="utf-8")
            input_path.write_text('{"prompt":"sample"}\n', encoding="utf-8")
            artifact.write_bytes(b"candidate-v1")

            created = run_script(
                "experiment-manifest.py",
                "create",
                "--output",
                manifest,
                "--root",
                root,
                "--base-model",
                "example/model",
                "--revision",
                "0123456789abcdef",
                "--method",
                "test",
                "--config",
                config,
                "--input",
                input_path,
                "--artifact",
                artifact,
            )
            self.assertEqual(created.returncode, 0, created.stderr)
            verified = run_script("experiment-manifest.py", "verify", manifest, "--root", root)
            self.assertEqual(verified.returncode, 0, verified.stderr)

            artifact.write_bytes(b"candidate-v2")
            drifted = run_script("experiment-manifest.py", "verify", manifest, "--root", root)
            self.assertEqual(drifted.returncode, 1)
            report = json.loads(drifted.stdout)
            self.assertFalse(report["pass"])
            self.assertEqual(report["failures"][0]["path"], "artifact.bin")


if __name__ == "__main__":
    unittest.main(verbosity=2)
