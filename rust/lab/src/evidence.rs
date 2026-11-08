use crate::{
    metrics::{self, ResponseRecord},
    model, protocol,
};
use anyhow::{Context, Result, ensure};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

pub fn verify(run: &Path, protocol_path: &Path) -> Result<Value> {
    let report_path = run.join("report.json");
    let raw_path = run.join("responses.jsonl");
    ensure!(
        report_path.metadata()?.len() <= 2 * 1024 * 1024,
        "Report exceeds bounds"
    );
    ensure!(
        raw_path.metadata()?.len() <= 64 * 1024 * 1024,
        "Responses exceed bounds"
    );
    let report: Value = serde_json::from_slice(&fs::read(&report_path)?)?;
    ensure!(
        report["schema"] == 1
            && report["runtime"] == "Rust/mistral.rs"
            && report["python_executed"] == false,
        "Not a native Rust run"
    );
    ensure!(
        matches!(
            report["status"].as_str(),
            Some("completed" | "needs_review")
        ),
        "Incomplete runs cannot be certified"
    );
    ensure!(
        model::sha256_file(&raw_path)? == report["responses_sha256"],
        "Response bytes changed"
    );
    let (prompts, pin) = protocol::read(protocol_path)?;
    ensure!(
        serde_json::to_value(&pin)? == report["protocol"],
        "Prepared inputs differ from the recorded protocol"
    );
    let config = &report["config"];
    let model_lock = model::lock()?;
    ensure!(
        report["model_id"] == model_lock.model_id
            && report["model_revision"] == model_lock.revision,
        "Model identity differs from the pin"
    );
    let model_files: BTreeMap<_, _> = model_lock
        .files
        .into_iter()
        .map(|(name, pin)| (name, pin.sha256))
        .collect();
    ensure!(
        serde_json::to_value(model_files)? == report["model_files_sha256"]
            && report["weights_on_disk_unchanged"] == true,
        "Reported model files differ from the pinned checkpoint"
    );
    ensure!(
        config["benchmark"] == "benign-paired" && config["automated_run"] == true,
        "Reference suites are not executable studies"
    );
    let test_limit = config["test_limit_per_dataset"]
        .as_u64()
        .context("Missing test limit")? as usize;
    let calibration_limit = config["calibration_limit"]
        .as_u64()
        .context("Missing calibration limit")? as usize;
    ensure!(
        test_limit <= 1000 && calibration_limit <= 16,
        "Run limits exceed bounds"
    );
    ensure!(
        report["full_benign_suites"] == (test_limit == 0),
        "A pilot was relabelled as a complete suite"
    );
    ensure!(
        report["complete_calibration"] == (calibration_limit == 0 || calibration_limit == 16),
        "Calibration coverage is mislabelled"
    );
    let profiles = if config["compare_context"]
        .as_bool()
        .context("Missing profile setting")?
    {
        vec!["baseline", "context"]
    } else {
        vec!["baseline"]
    };
    let calibration: Vec<_> = prompts
        .iter()
        .filter(|r| r.split == "calibration")
        .take(if calibration_limit == 0 {
            usize::MAX
        } else {
            calibration_limit
        })
        .collect();
    let mut counts = BTreeMap::new();
    let test: Vec<_> = prompts
        .iter()
        .filter(|r| r.split == "test")
        .filter(|r| {
            let count = counts.entry(&r.dataset).or_insert(0);
            *count += 1;
            test_limit == 0 || *count <= test_limit
        })
        .collect();
    let expected: Vec<_> = [&calibration, &test]
        .into_iter()
        .flat_map(|subset| {
            profiles
                .iter()
                .flat_map(move |profile| subset.iter().map(move |prompt| (*profile, *prompt)))
        })
        .collect();
    let records: Vec<ResponseRecord> = fs::read_to_string(raw_path)?
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(serde_json::from_str)
        .collect::<Result<_, _>>()?;
    ensure!(
        records.len() == expected.len() && report["response_records"] == records.len(),
        "Missing or extra response records"
    );
    for (record, (profile, prompt)) in records.iter().zip(expected) {
        let fresh = metrics::screen(prompt, profile, record.response.clone(), record.truncated);
        ensure!(
            record.id == fresh.id
                && record.profile == fresh.profile
                && record.dataset == fresh.dataset
                && record.split == fresh.split
                && record.prompt_sha256 == fresh.prompt_sha256
                && record.response_sha256 == fresh.response_sha256
                && record.refusal_marker == fresh.refusal_marker
                && record.empty_or_punctuation_only == fresh.empty_or_punctuation_only,
            "Record identity, order or screen changed"
        );
        ensure!(
            record.seconds.is_finite() && record.seconds >= 0.0,
            "Invalid response timing"
        );
    }
    let calibration_records: Vec<_> = records
        .iter()
        .filter(|r| r.split == "calibration")
        .cloned()
        .collect();
    let selected = metrics::select_profile(&calibration_records, &profiles)?;
    ensure!(
        report["selected_profile"] == selected,
        "Selection does not follow the calibration-only rule"
    );
    let selection: Value =
        serde_json::from_slice(&fs::read(run.join("selection-before-test.json"))?)?;
    ensure!(
        selection["selected_profile"] == selected,
        "Selection receipt changed"
    );
    let mut results = BTreeMap::new();
    for profile in profiles {
        let mut cohorts = BTreeMap::new();
        for dataset in ["calibration_v1", "xstest_safe", "jbb_benign"] {
            cohorts.insert(
                dataset,
                metrics::summarize(
                    &records
                        .iter()
                        .filter(|r| r.profile == profile && r.dataset == dataset)
                        .collect::<Vec<_>>(),
                )?,
            );
        }
        results.insert(profile, cohorts);
    }
    ensure!(
        serde_json::to_value(&results)? == report["results"],
        "Reported metrics differ from response records"
    );
    let invalid: usize = results
        .values()
        .flat_map(|v| v.values())
        .map(|v| v.invalid_or_censored)
        .sum();
    ensure!(
        report["status"]
            == if invalid == 0 {
                "completed"
            } else {
                "needs_review"
            },
        "Status hides invalid or censored outputs"
    );
    for name in ["RefusalBench", "StrongREJECT", "Huihui HarmBench"] {
        ensure!(
            report["reference_benchmarks"][name]["status"] == "not_run"
                && report["reference_benchmarks"][name]["score"].is_null(),
            "An unrun reference benchmark was assigned a score"
        );
    }
    Ok(json!({
        "schema":1, "valid":true, "response_records":records.len(), "selected_profile":selected,
        "report_sha256":model::sha256_file(&report_path)?, "responses_sha256":report["responses_sha256"],
        "coverage_order_and_screens_verified":true, "calibration_only_selection_verified":true,
        "model_files_reread":false, "semantic_judging_performed":false,
        "status":report["status"], "invalid_or_censored":invalid
    }))
}
