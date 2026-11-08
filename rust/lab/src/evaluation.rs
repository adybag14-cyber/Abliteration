use crate::{
    BUILD_SHA, ENGINE_REVISION, VERSION, config::RunConfig, engine::Engine, metrics, model,
    protocol,
};
use anyhow::{Result, ensure};
use chrono::Utc;
use serde_json::json;
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::time::{Duration, Instant};

fn progress(output: &Path, status: &str, completed: usize, total: usize) -> Result<()> {
    let event =
        json!({"status":status, "completed":completed, "total":total, "pid":std::process::id()});
    fs::write(
        output.join("progress.json"),
        serde_json::to_vec_pretty(&event)?,
    )?;
    println!("{}", serde_json::to_string(&event)?);
    Ok(())
}

pub async fn run(
    model_dir: &Path,
    protocol_path: &Path,
    output: &Path,
    config: &RunConfig,
) -> Result<serde_json::Value> {
    config.executable()?;
    let (rows, pin) = protocol::read(protocol_path)?;
    let verification = model::verify_model(model_dir)?;
    protocol::fresh_directory(output)?;
    let started = Instant::now();
    let profiles: Vec<&str> = if config.compare_context {
        vec!["baseline", "context"]
    } else {
        vec!["baseline"]
    };
    let calibration: Vec<_> = rows
        .iter()
        .filter(|r| r.split == "calibration")
        .take(if config.calibration_limit == 0 {
            usize::MAX
        } else {
            config.calibration_limit
        })
        .collect();
    let mut counts = BTreeMap::new();
    let test: Vec<_> = rows
        .iter()
        .filter(|r| r.split == "test")
        .filter(|r| {
            let count = counts.entry(&r.dataset).or_insert(0);
            *count += 1;
            config.test_limit_per_dataset == 0 || *count <= config.test_limit_per_dataset
        })
        .collect();
    let total = profiles.len() * (calibration.len() + test.len());
    let executable = std::env::current_exe()?;
    let process_stat = fs::read_to_string("/proc/self/stat").ok();
    let process_fields = process_stat
        .as_deref()
        .and_then(|s| s.rsplit_once(')'))
        .map(|(_, tail)| tail.split_whitespace().collect::<Vec<_>>());
    let start_ticks = process_fields.as_ref().and_then(|f| f.get(19)).copied();
    let parent_pid = process_fields
        .as_ref()
        .and_then(|f| f.get(1))
        .and_then(|s| s.parse::<u32>().ok());
    protocol::write_json_new(
        &output.join("identity.json"),
        &json!({
            "schema":1, "started_at":Utc::now().to_rfc3339(), "pid":std::process::id(),
            "executable":executable, "executable_sha256":model::sha256_file(&executable)?,
            "start_ticks":start_ticks, "parent_pid":parent_pid,
            "command":std::env::args_os().map(|s|s.to_string_lossy().into_owned()).collect::<Vec<_>>(),
            "model":verification,
            "protocol":pin, "config":config, "app_version":VERSION, "build_sha":BUILD_SHA,
            "engine_revision":ENGINE_REVISION, "runtime":"Rust/mistral.rs", "python_executed":false,
            "decoding":{"do_sample":false,"enable_thinking":false,"max_new_tokens":config.max_new_tokens,
                        "max_input_tokens":config.max_input_tokens,"concurrent_sequences":1,
                        "dtype":if config.device == "cpu" {"f32"} else {"bf16"}}
        }),
    )?;
    progress(output, "loading", 0, total)?;
    let operation = async {
        let engine = Engine::load(model_dir, config).await?;
        let mut records = Vec::new();
        let mut raw = File::options()
            .create_new(true)
            .write(true)
            .open(output.join("responses.jsonl"))?;
        let mut selection = String::new();
        for subset in [&calibration, &test] {
            if subset.first().is_some_and(|r| r.split == "test") {
                selection = metrics::select_profile(&records, &profiles)?;
                protocol::write_json_new(
                    &output.join("selection-before-test.json"),
                    &json!({
                        "selected_profile":selection, "selected_at":Utc::now().to_rfc3339(),
                        "rule":"Calibration-only; invalid/censored profiles excluded; fewest lexical markers; ties prefer baseline"
                    }),
                )?;
            }
            for profile in &profiles {
                for prompt in subset {
                    let begin = Instant::now();
                    let response = engine.generate(&prompt.prompt, profile).await?;
                    ensure!(
                        matches!(response.finish_reason.as_str(), "stop" | "length"),
                        "Unexpected generation finish reason"
                    );
                    let mut record = metrics::screen(
                        prompt,
                        profile,
                        response.text,
                        response.finish_reason == "length",
                    );
                    record.input_tokens = response.input_tokens;
                    record.output_tokens = response.output_tokens;
                    record.seconds = begin.elapsed().as_secs_f64();
                    serde_json::to_writer(&mut raw, &record)?;
                    raw.write_all(b"\n")?;
                    raw.flush()?;
                    records.push(record);
                    progress(output, "running", records.len(), total)?;
                }
            }
        }
        ensure!(records.len() == total, "Incomplete response coverage");
        let after = model::verify_model(model_dir)?;
        ensure!(
            after.file_sha256 == verification.file_sha256,
            "Model files changed during evaluation"
        );
        let mut results = BTreeMap::new();
        for profile in &profiles {
            let mut datasets = BTreeMap::new();
            for dataset in ["calibration_v1", "xstest_safe", "jbb_benign"] {
                let group: Vec<_> = records
                    .iter()
                    .filter(|r| r.profile == *profile && r.dataset == dataset)
                    .collect();
                datasets.insert(dataset, metrics::summarize(&group)?);
            }
            results.insert(*profile, datasets);
        }
        let invalid: usize = results
            .values()
            .flat_map(|d| d.values())
            .map(|s| s.invalid_or_censored)
            .sum();
        let status = if invalid == 0 {
            "completed"
        } else {
            "needs_review"
        };
        let report = json!({
            "schema":1, "status":status, "runtime":"Rust/mistral.rs", "python_executed":false,
            "app_version":VERSION, "build_sha":BUILD_SHA, "engine_revision":ENGINE_REVISION,
            "model_id":after.model_id, "model_revision":after.revision, "model_files_sha256":after.file_sha256,
            "weights_on_disk_unchanged":true, "config":config, "protocol":pin,
            "selected_profile":selection, "results":results, "response_records":records.len(),
            "full_benign_suites":config.test_limit_per_dataset == 0,
            "complete_calibration":config.calibration_limit == 0 || config.calibration_limit == 16,
            "responses_sha256":model::sha256_file(&output.join("responses.jsonl"))?,
            "seconds":started.elapsed().as_secs_f64(),
            "metric":"Lexical refusal-marker screen; not a semantic refusal or official attack-success score",
            "reference_benchmarks":{"RefusalBench":{"status":"not_run","score":null},
                "StrongREJECT":{"status":"not_run","score":null},"Huihui HarmBench":{"status":"not_run","score":null}},
            "deployment_certified":false,
            "limitations":["The development inference backend is experimental.",
                "Empty or censored results cannot establish a valid zero-refusal rate.",
                "No harmful-request optimization or checkpoint surgery was performed.",
                "A low marker count does not prove usefulness, safety or retained capability."]
        });
        protocol::write_json_new(&output.join("report.json"), &report)?;
        progress(output, status, total, total)?;
        Ok::<_, anyhow::Error>(report)
    };
    match tokio::time::timeout(Duration::from_secs(config.timeout_seconds), operation).await {
        Ok(Ok(report)) => Ok(report),
        error => {
            let message = match error {
                Ok(Err(error)) => error.to_string(),
                Err(_) => "Experiment deadline exceeded".to_owned(),
                _ => unreachable!(),
            };
            fs::write(
                output.join("failure.json"),
                serde_json::to_vec_pretty(
                    &json!({"status":"failed","error":message,"partial_results_are_not_a_completed_benchmark":true}),
                )?,
            )?;
            anyhow::bail!(message)
        }
    }
}
