use anyhow::{Result, bail, ensure};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct RunConfig {
    pub schema: u32,
    pub name: String,
    pub benchmark: String,
    pub device: String,
    pub max_new_tokens: usize,
    pub max_input_tokens: usize,
    pub repetition_penalty: f32,
    pub test_limit_per_dataset: usize,
    pub calibration_limit: usize,
    pub compare_context: bool,
    pub quantization: String,
    pub experimental: bool,
    pub automated_run: bool,
    pub timeout_seconds: u64,
}

impl Default for RunConfig {
    fn default() -> Self {
        Self {
            schema: 1,
            name: "LFM3 benign smoke".into(),
            benchmark: "benign-paired".into(),
            device: "cpu".into(),
            max_new_tokens: 2048,
            max_input_tokens: 4096,
            repetition_penalty: 1.1,
            test_limit_per_dataset: 1,
            calibration_limit: 2,
            compare_context: true,
            quantization: "none".into(),
            experimental: false,
            automated_run: true,
            timeout_seconds: 3600,
        }
    }
}

impl RunConfig {
    pub fn read(path: &Path) -> Result<Self> {
        ensure!(path.metadata()?.len() <= 64 * 1024, "Config exceeds 64 KiB");
        let config: Self = toml::from_str(&std::fs::read_to_string(path)?)?;
        config.validate()?;
        Ok(config)
    }

    pub fn validate(&self) -> Result<()> {
        ensure!(self.schema == 1, "Unsupported config schema");
        ensure!(
            self.repetition_penalty.is_finite() && (1.0..=2.0).contains(&self.repetition_penalty),
            "Repetition penalty must be finite and between 1 and 2"
        );
        ensure!(
            !self.name.trim().is_empty() && self.name.len() <= 128,
            "Invalid experiment name"
        );
        ensure!(
            matches!(self.benchmark.as_str(), "benign-paired" | "refusalbench"),
            "Unknown benchmark"
        );
        ensure!(
            matches!(self.device.as_str(), "cpu" | "cuda"),
            "Unknown device"
        );
        ensure!(
            (16..=4096).contains(&self.max_new_tokens),
            "New-token cap must be 16..4096"
        );
        ensure!(
            (256..=8192).contains(&self.max_input_tokens),
            "Input-token cap must be 256..8192"
        );
        ensure!(
            self.test_limit_per_dataset <= 1000,
            "Test limit exceeds 1000"
        );
        ensure!(
            self.calibration_limit <= 16,
            "Calibration limit exceeds the frozen set"
        );
        ensure!(
            (30..=14400).contains(&self.timeout_seconds),
            "Timeout must be 30..14400 seconds"
        );
        ensure!(
            matches!(self.quantization.as_str(), "none" | "q8_0"),
            "Unknown quantization"
        );
        if self.quantization != "none" {
            ensure!(
                self.experimental,
                "Quantization requires an explicitly experimental config"
            );
        }
        if self.benchmark == "refusalbench" {
            ensure!(
                self.experimental && !self.automated_run,
                "RefusalBench must remain experimental and excluded from automated runs"
            );
        }
        Ok(())
    }

    pub fn executable(&self) -> Result<()> {
        self.validate()?;
        if !self.automated_run || self.benchmark == "refusalbench" {
            bail!(
                "This is an unrun reference configuration. Inspect its protocol and risks; no RefusalBench execution is performed."
            );
        }
        Ok(())
    }
}

pub const REFUSALBENCH_RISKS: &str = "Not run; not validated. RefusalBench mixes biological risk tiers. Outputs may contain unsafe research guidance and need qualified review and controlled handling. The inspected public positive-control manifest has no data rows, so it cannot establish a safety-calibration floor. Judge bias, prompt leakage, output truncation and runtime changes can mislead comparisons. A skipped test is not a measured zero. Researchers are responsible for their study design, access controls and applicable institutional requirements; this configuration is not a deployment certification.";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validated_default_is_executable() {
        RunConfig::default().executable().unwrap();
    }

    #[test]
    fn reference_suite_never_enters_automated_execution() {
        let mut config = RunConfig {
            benchmark: "refusalbench".into(),
            experimental: true,
            automated_run: false,
            ..RunConfig::default()
        };
        config.validate().unwrap();
        assert!(config.executable().is_err());
        config.automated_run = true;
        assert!(config.validate().is_err());
    }

    #[test]
    fn configuration_rejects_silent_typos_and_unbounded_generation() {
        let config = RunConfig {
            max_new_tokens: usize::MAX,
            ..RunConfig::default()
        };
        assert!(config.validate().is_err());
        assert!(
            RunConfig {
                repetition_penalty: f32::NAN,
                ..RunConfig::default()
            }
            .validate()
            .is_err()
        );
        assert!(
            RunConfig {
                repetition_penalty: 0.5,
                ..RunConfig::default()
            }
            .validate()
            .is_err()
        );
        let text = toml::to_string(&RunConfig::default()).unwrap() + "\nmax_toknes = 2\n";
        assert!(toml::from_str::<RunConfig>(&text).is_err());
    }
}
