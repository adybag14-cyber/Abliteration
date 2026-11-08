use crate::model::{sha256_bytes, sha256_file};
use anyhow::{Context, Result, ensure};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

const SOURCES: &str = include_str!("../../../data/benchmarks/lfm3-benign.json");
const CALIBRATION: &str = include_str!("../../../data/experiments/lfm3-calibration.jsonl");
const EXPECTED_PROTOCOL_SHA256: &str =
    "c36e3c99c8f1ad463c715589c994347b28b11c1e6fb82c32f83b0c8c6c37103f";
pub const CATALOG: &str = include_str!("../../../sources/research/lfm3-benchmarks-2026-11.json");

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Prompt {
    pub id: String,
    pub dataset: String,
    pub split: String,
    pub expected: String,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolPin {
    pub schema: u32,
    pub protocol_sha256: String,
    pub source_lock_sha256: String,
    pub calibration_sha256: String,
    pub counts: BTreeMap<String, usize>,
    pub total_rows: usize,
    pub jbb_target_column_used: bool,
}

#[derive(Deserialize)]
struct Sources {
    sources: Vec<Source>,
}

#[derive(Deserialize)]
struct Source {
    id: String,
    url: String,
    sha256: String,
    source_rows: usize,
    selected_rows: usize,
    filter: BTreeMap<String, String>,
    id_column: String,
    prompt_column: String,
}

pub fn validate(rows: &[Prompt]) -> Result<()> {
    ensure!(
        !rows.is_empty() && rows.len() <= 5000,
        "Protocol requires 1..5000 rows"
    );
    let mut ids = BTreeSet::new();
    let mut calibration = BTreeSet::new();
    let mut test = BTreeSet::new();
    for row in rows {
        ensure!(
            !row.id.trim().is_empty() && row.id.len() <= 128 && ids.insert(&row.id),
            "Duplicate or invalid prompt id"
        );
        ensure!(
            row.expected == "comply",
            "The executable study accepts explicitly benign rows only"
        );
        ensure!(
            !row.prompt.trim().is_empty() && row.prompt.len() <= 32768,
            "Empty or oversized prompt"
        );
        let normalized = row
            .prompt
            .to_lowercase()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ");
        match (row.dataset.as_str(), row.split.as_str()) {
            ("calibration_v1", "calibration") => {
                calibration.insert(normalized);
            }
            ("xstest_safe" | "jbb_benign", "test") => {
                test.insert(normalized);
            }
            _ => anyhow::bail!(
                "Unknown dataset or split; reference suites are not executable cohorts"
            ),
        }
    }
    ensure!(
        !calibration.is_empty() && !test.is_empty(),
        "Calibration and test cohorts are both required"
    );
    ensure!(
        calibration.is_disjoint(&test),
        "Calibration/test prompt leakage"
    );
    Ok(())
}

pub fn write_json_new(path: &Path, value: &impl Serialize) -> Result<()> {
    let mut file = File::options().write(true).create_new(true).open(path)?;
    serde_json::to_writer_pretty(&mut file, value)?;
    file.write_all(b"\n")?;
    Ok(())
}

pub fn fresh_directory(path: &Path) -> Result<()> {
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent)?;
    }
    fs::create_dir(path).context("Use a new output directory; existing results are immutable")
}

async fn fetch(source: &Source) -> Result<Vec<u8>> {
    ensure!(
        source.url.starts_with("https://"),
        "Only HTTPS sources are allowed"
    );
    let client = reqwest::Client::builder()
        .https_only(true)
        .timeout(std::time::Duration::from_secs(90))
        .build()?;
    let mut response = client.get(&source.url).send().await?.error_for_status()?;
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        ensure!(
            bytes.len() + chunk.len() <= 8 * 1024 * 1024,
            "Dataset exceeds 8 MiB"
        );
        bytes.extend_from_slice(&chunk);
    }
    ensure!(
        sha256_bytes(&bytes) == source.sha256,
        "Dataset SHA-256 differs from the pin"
    );
    Ok(bytes)
}

pub async fn prepare(output: &Path) -> Result<ProtocolPin> {
    ensure!(!output.exists(), "Output directory already exists");
    let sources: Sources = serde_json::from_str(SOURCES)?;
    let mut rows: Vec<Prompt> = CALIBRATION
        .lines()
        .filter(|s| !s.trim().is_empty())
        .map(serde_json::from_str)
        .collect::<Result<_, _>>()?;
    for source in sources.sources {
        ensure!(
            matches!(source.id.as_str(), "xstest_safe" | "jbb_benign"),
            "Unsupported executable source"
        );
        let bytes = fetch(&source).await?;
        let records: Vec<BTreeMap<String, String>> = csv::Reader::from_reader(bytes.as_slice())
            .deserialize()
            .collect::<Result<_, _>>()?;
        ensure!(
            records.len() == source.source_rows,
            "Source row count differs from its pin"
        );
        let selected: Vec<_> = records
            .iter()
            .filter(|row| {
                source
                    .filter
                    .iter()
                    .all(|(key, value)| row.get(key) == Some(value))
            })
            .collect();
        ensure!(
            selected.len() == source.selected_rows,
            "Benign selection count differs from its pin"
        );
        for record in selected {
            rows.push(Prompt {
                id: format!(
                    "{}:{}",
                    source.id,
                    record.get(&source.id_column).context("Missing id column")?
                ),
                dataset: source.id.clone(),
                split: "test".into(),
                expected: "comply".into(),
                prompt: record
                    .get(&source.prompt_column)
                    .context("Missing prompt column")?
                    .clone(),
            });
        }
    }
    validate(&rows)?;
    let mut counts = BTreeMap::new();
    let mut payload = Vec::new();
    for row in &rows {
        *counts.entry(row.dataset.clone()).or_insert(0) += 1;
        serde_json::to_writer(&mut payload, row)?;
        payload.push(b'\n');
    }
    let pin = ProtocolPin {
        schema: 1,
        protocol_sha256: sha256_bytes(&payload),
        source_lock_sha256: sha256_bytes(SOURCES.as_bytes()),
        calibration_sha256: sha256_bytes(CALIBRATION.as_bytes()),
        counts,
        total_rows: rows.len(),
        jbb_target_column_used: false,
    };
    ensure!(
        pin.protocol_sha256 == EXPECTED_PROTOCOL_SHA256,
        "Prepared content differs from the frozen native protocol"
    );
    fresh_directory(output)?;
    let mut file = File::options()
        .create_new(true)
        .write(true)
        .open(output.join("protocol.jsonl"))?;
    file.write_all(&payload)?;
    write_json_new(&output.join("protocol-lock.json"), &pin)?;
    Ok(pin)
}

pub fn read(path: &Path) -> Result<(Vec<Prompt>, ProtocolPin)> {
    ensure!(
        path.metadata()?.len() <= 8 * 1024 * 1024,
        "Protocol exceeds 8 MiB"
    );
    let pin_path = path.with_file_name("protocol-lock.json");
    ensure!(
        pin_path.metadata()?.len() <= 64 * 1024,
        "Protocol manifest exceeds bounds"
    );
    let pin: ProtocolPin = serde_json::from_reader(File::open(pin_path)?)?;
    ensure!(
        pin.protocol_sha256 == EXPECTED_PROTOCOL_SHA256,
        "Protocol does not match the frozen benign cohort"
    );
    ensure!(
        pin.schema == 1 && !pin.jbb_target_column_used,
        "Unsupported prepared protocol"
    );
    ensure!(
        sha256_file(path)? == pin.protocol_sha256,
        "Protocol bytes have changed"
    );
    ensure!(
        pin.source_lock_sha256 == sha256_bytes(SOURCES.as_bytes()),
        "Source pins differ from this binary"
    );
    ensure!(
        pin.calibration_sha256 == sha256_bytes(CALIBRATION.as_bytes()),
        "Calibration differs from this binary"
    );
    let rows: Vec<Prompt> = fs::read_to_string(path)?
        .lines()
        .filter(|s| !s.trim().is_empty())
        .map(serde_json::from_str)
        .collect::<Result<_, _>>()?;
    validate(&rows)?;
    let mut counts = BTreeMap::new();
    for row in &rows {
        *counts.entry(row.dataset.clone()).or_insert(0) += 1;
    }
    ensure!(
        rows.len() == pin.total_rows && counts == pin.counts,
        "Protocol coverage differs from manifest"
    );
    ensure!(
        counts
            == BTreeMap::from([
                ("calibration_v1".into(), 16),
                ("jbb_benign".into(), 100),
                ("xstest_safe".into(), 250)
            ]),
        "Frozen cohort sizes are incomplete"
    );
    Ok((rows, pin))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn row(id: &str, dataset: &str, split: &str, prompt: &str) -> Prompt {
        Prompt {
            id: id.into(),
            dataset: dataset.into(),
            split: split.into(),
            expected: "comply".into(),
            prompt: prompt.into(),
        }
    }
    #[test]
    fn benign_split_isolation_is_enforced() {
        let mut rows = vec![
            row(
                "cal",
                "calibration_v1",
                "calibration",
                "Explain a compiler.",
            ),
            row("test", "xstest_safe", "test", "Explain a photograph."),
        ];
        validate(&rows).unwrap();
        rows[1].prompt = "  EXPLAIN a compiler. ".into();
        assert!(validate(&rows).is_err());
    }
    #[test]
    fn reference_suites_and_duplicate_ids_cannot_be_inserted() {
        let mut rows = vec![
            row(
                "cal",
                "calibration_v1",
                "calibration",
                "Explain a compiler.",
            ),
            row("test", "refusalbench", "test", "Example"),
        ];
        assert!(validate(&rows).is_err());
        rows[1].dataset = "xstest_safe".into();
        rows[1].id = "cal".into();
        assert!(validate(&rows).is_err());
    }
}
