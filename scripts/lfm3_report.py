"""Recompute LFM3 evidence from complete response records before publication."""
from __future__ import annotations

import math

from lfm3_evaluation import PROFILES, screen, select_profile, summarize


def verify_measurement(protocol, identity, summary, responses, selection, status):
    """Validate coverage, order, hashes, selection and metrics, not answer quality."""
    if status not in {"completed", "needs-review"} or not summary.get("weights_unchanged"):
        raise ValueError("only terminal, unchanged-weight measurements can be exported")
    if identity["profiles"] != PROFILES or summary["selection"] != selection:
        raise ValueError("profile or selection identity changed")
    limit = identity["test_limit_per_dataset"]
    if type(limit) is not int or limit < 0 or summary["complete_benign_suites"] != (limit == 0):
        raise ValueError("pilot/full-suite identity is inconsistent")
    calibration = [r for r in protocol if r["split"] == "calibration"]
    test, counts = [], {}
    for row in protocol:
        if row["split"] != "test":
            continue
        counts[row["dataset"]] = counts.get(row["dataset"], 0) + 1
        if not limit or counts[row["dataset"]] <= limit:
            test.append(row)
    expected = [(profile, row) for subset in [calibration, test]
                for profile in PROFILES for row in subset]
    if len(responses) != len(expected):
        raise ValueError("missing or extra response records")
    recomputed = {p: {"calibration": [], "test": []} for p in PROFILES}
    for (profile, prompt), record in zip(expected, responses, strict=True):
        if record.get("profile") != profile or record.get("id") != prompt["id"]:
            raise ValueError("response order/profile/coverage differs from the protocol")
        if not isinstance(record.get("response"), str) or type(record.get("truncated")) is not bool:
            raise ValueError("malformed response record")
        tokens = record.get("generated_tokens")
        if type(tokens) is not int or not 1 <= tokens <= identity["decoding"]["max_new_tokens"]:
            raise ValueError("invalid generation token count")
        seconds = record.get("seconds")
        if not isinstance(seconds, (int, float)) or not math.isfinite(seconds) or seconds < 0:
            raise ValueError("invalid generation timing")
        scored = screen(prompt, record["response"], truncated=record["truncated"], error=record.get("error"))
        if any(record.get(key) != value for key, value in scored.items()):
            raise ValueError("response text, prompt hash or screening metrics changed")
        recomputed[profile][prompt["split"]].append(scored)
    calibrated = {p: recomputed[p]["calibration"] for p in PROFILES}
    if selection["selected_profile"] != select_profile(calibrated):
        raise ValueError("selection does not follow the calibration-only rule")
    if selection["calibration"] != {p: summarize(calibrated[p]) for p in PROFILES}:
        raise ValueError("calibration summary changed")
    expected_test = {p: summarize(recomputed[p]["test"]) for p in PROFILES}
    if expected_test != summary["test"]:
        raise ValueError("reported test metrics differ from the response records")
    invalid = sum(v["invalid_or_censored"] for p in expected_test.values() for v in p.values())
    if status != ("needs-review" if invalid else "completed"):
        raise ValueError("terminal status hides invalid/censored generations")
    return {"response_records": len(responses), "coverage_and_order_verified": True,
            "screening_recomputed": True, "calibration_only_selection_verified": True,
            "invalid_or_censored": invalid, "semantic_judging_performed": False}
