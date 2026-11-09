//! State contracts shared by the UI, run receipts, tests, and automation.
use anyhow::{Result, ensure};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    Verify,
    Download,
    Inspect,
    Prepare,
    VerifyProtocol,
    Run,
    VerifyReport,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    Succeeded,
    NeedsReview,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Job {
    pub id: u64,
    pub action: Action,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Operation {
    #[default]
    Ready,
    Running(Job),
    Cancelling(Job),
    Settled {
        job: Option<Job>,
        outcome: Outcome,
    },
}

#[derive(Debug, Default)]
pub struct Session {
    phase: Operation,
    sequence: u64,
}

impl Session {
    pub fn phase(&self) -> Operation {
        self.phase
    }
    pub fn active(&self) -> Option<Job> {
        match self.phase {
            Operation::Running(job) | Operation::Cancelling(job) => Some(job),
            _ => None,
        }
    }
    pub fn is_busy(&self) -> bool {
        self.active().is_some()
    }
    pub fn can_cancel(&self) -> bool {
        matches!(self.phase, Operation::Running(_))
    }
    pub fn is_failure(&self) -> bool {
        matches!(
            self.phase,
            Operation::Settled {
                outcome: Outcome::Failed,
                ..
            }
        )
    }
    pub fn begin(&mut self, action: Action) -> Option<Job> {
        if self.is_busy() {
            return None;
        }
        self.sequence = self.sequence.checked_add(1)?;
        let job = Job {
            id: self.sequence,
            action,
        };
        self.phase = Operation::Running(job);
        Some(job)
    }
    pub fn cancel(&mut self) -> bool {
        if let Operation::Running(job) = self.phase {
            self.phase = Operation::Cancelling(job);
            true
        } else {
            false
        }
    }
    /// A completion from an older job can never unlock or overwrite a new one.
    pub fn finish(&mut self, id: u64, outcome: Outcome) -> bool {
        let Some(job) = self.active().filter(|job| job.id == id) else {
            return false;
        };
        self.phase = Operation::Settled {
            job: Some(job),
            outcome,
        };
        true
    }
    pub fn notice(&mut self, outcome: Outcome) {
        if !self.is_busy() {
            self.phase = Operation::Settled { job: None, outcome };
        }
    }
    pub fn reset_notice(&mut self) {
        if !self.is_busy() {
            self.phase = Operation::Ready;
        }
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub enum Readiness {
    #[default]
    Unchecked,
    Checking,
    Verified,
    Failed,
}

impl Readiness {
    pub fn finish(&mut self, outcome: Outcome) {
        *self = match outcome {
            Outcome::Succeeded => Self::Verified,
            Outcome::Cancelled => Self::Unchecked,
            _ => Self::Failed,
        };
    }
    pub fn label(self) -> &'static str {
        match self {
            Self::Unchecked => "Not verified",
            Self::Checking => "Verifying",
            Self::Verified => "Verified",
            Self::Failed => "Verification failed",
        }
    }
}

/// Preserve the existing 0/2 contract; contradictory or absent evidence fails.
pub fn report_outcome(code: Option<i32>, status: Option<&str>) -> Outcome {
    match (code, status) {
        (Some(0), Some("completed")) => Outcome::Succeeded,
        (Some(2), Some("needs_review")) => Outcome::NeedsReview,
        _ => Outcome::Failed,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    Loading,
    Running,
    Completed,
    NeedsReview,
    Failed,
    Cancelled,
}

impl RunStatus {
    pub fn terminal(self) -> bool {
        !matches!(self, Self::Loading | Self::Running)
    }
    pub fn report_status(invalid: usize) -> Self {
        if invalid == 0 {
            Self::Completed
        } else {
            Self::NeedsReview
        }
    }
}

/// Wire field names are compatible with the original progress.json contract.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunProgress {
    status: RunStatus,
    completed: usize,
    total: usize,
    pid: u32,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FailureKind {
    ExecutionFailed,
    DeadlineExceeded,
}

impl RunProgress {
    pub fn is_terminal(&self) -> bool {
        self.status.terminal()
    }
    pub fn new(total: usize) -> Result<Self> {
        ensure!(total > 0, "Run coverage must not be empty");
        Ok(Self {
            status: RunStatus::Loading,
            completed: 0,
            total,
            pid: std::process::id(),
        })
    }
    fn validate(&self) -> Result<()> {
        ensure!(
            self.total > 0 && self.completed <= self.total,
            "Invalid run coverage"
        );
        ensure!(
            self.status != RunStatus::Loading || self.completed == 0,
            "Loading cannot contain responses"
        );
        ensure!(
            !matches!(self.status, RunStatus::Completed | RunStatus::NeedsReview)
                || self.completed == self.total,
            "Incomplete runs cannot be completed"
        );
        Ok(())
    }
    pub fn advance(&mut self, completed: usize) -> Result<()> {
        ensure!(
            !self.status.terminal() && completed > self.completed && completed <= self.total,
            "Invalid response progress transition"
        );
        self.status = RunStatus::Running;
        self.completed = completed;
        Ok(())
    }
    pub fn finish(&mut self, status: RunStatus) -> Result<()> {
        ensure!(
            !self.status.terminal() && status.terminal(),
            "Invalid terminal run transition"
        );
        ensure!(
            !matches!(status, RunStatus::Completed | RunStatus::NeedsReview)
                || self.completed == self.total,
            "Incomplete runs cannot be completed"
        );
        self.status = status;
        Ok(())
    }
    pub fn publish(&self, directory: &Path) -> Result<()> {
        self.validate()?;
        replace_json(&directory.join("progress.json"), self)?;
        Ok(())
    }
    pub fn finish_and_publish(&mut self, status: RunStatus, directory: &Path) -> Result<()> {
        let mut next = self.clone();
        next.finish(status)?;
        next.publish(directory)?;
        *self = next;
        Ok(())
    }
    pub fn record_failure(
        &mut self,
        directory: &Path,
        kind: FailureKind,
        error: &str,
    ) -> Result<()> {
        if !self.is_terminal() {
            self.finish_and_publish(RunStatus::Failed, directory)?;
        }
        crate::protocol::write_json_new(
            &directory.join("failure.json"),
            &serde_json::json!({
                "status":"failed", "kind":kind, "error":error,
                "partial_results_are_not_a_completed_benchmark":true
            }),
        )
    }
}

static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// Readers see one complete receipt. Never truncate the live progress file.
pub fn replace_json(path: &Path, value: &impl Serialize) -> Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Missing receipt directory"))?;
    if let Ok(metadata) = fs::symlink_metadata(path) {
        ensure!(
            metadata.is_file() && !metadata.file_type().is_symlink(),
            "Receipt must be a regular file"
        );
    }
    let temporary = parent.join(format!(
        ".progress-{}-{}.tmp",
        std::process::id(),
        TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed)
    ));
    let mut file = File::options()
        .create_new(true)
        .write(true)
        .open(&temporary)?;
    let result = (|| -> Result<()> {
        serde_json::to_writer_pretty(&mut file, value)?;
        file.write_all(b"\n")?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporary, path)?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

/// Only the supervisor holding this child's handle may call this after reaping it.
/// Existing terminal evidence is never downgraded by a late cancellation request.
pub fn record_owned_cancellation(directory: &Path, pid: u32) -> Result<bool> {
    let identity_path = directory.join("identity.json");
    let progress_path = directory.join("progress.json");
    if !identity_path.exists() || !progress_path.exists() {
        return Ok(false);
    }
    ensure!(
        identity_path.metadata()?.len() <= 512 * 1024 && progress_path.metadata()?.len() <= 4096,
        "Run identity exceeds bounds"
    );
    let identity: serde_json::Value = serde_json::from_slice(&fs::read(identity_path)?)?;
    let mut progress: RunProgress = serde_json::from_slice(&fs::read(progress_path)?)?;
    ensure!(
        identity["pid"].as_u64() == Some(u64::from(pid)) && progress.pid == pid,
        "Cancellation receipt belongs to another process"
    );
    progress.validate()?;
    if progress.status.terminal() {
        return Ok(false);
    }
    progress.finish(RunStatus::Cancelled)?;
    progress.publish(directory)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cancellation_is_idempotent_and_old_completions_cannot_unlock_new_work() {
        let mut session = Session::default();
        assert!(!session.cancel());
        let first = session.begin(Action::Run).unwrap();
        assert!(session.begin(Action::Verify).is_none());
        assert!(session.cancel());
        assert!(!session.cancel());
        assert!(session.is_busy());
        assert!(session.finish(first.id, Outcome::Cancelled));
        assert!(!session.is_failure());
        let second = session.begin(Action::Verify).unwrap();
        assert!(!session.finish(first.id, Outcome::Succeeded));
        assert_eq!(session.active(), Some(second));
    }
    #[test]
    fn a_completion_observed_before_cancellation_wins_the_race() {
        let mut session = Session::default();
        let job = session.begin(Action::Run).unwrap();
        session.cancel();
        assert!(session.finish(job.id, Outcome::Succeeded));
        assert!(!session.cancel());
    }
    #[test]
    fn report_exit_and_evidence_must_agree() {
        for code in [None, Some(0), Some(1), Some(2), Some(3)] {
            for status in [
                None,
                Some("running"),
                Some("completed"),
                Some("needs_review"),
                Some("failed"),
            ] {
                let expected = match (code, status) {
                    (Some(0), Some("completed")) => Outcome::Succeeded,
                    (Some(2), Some("needs_review")) => Outcome::NeedsReview,
                    _ => Outcome::Failed,
                };
                assert_eq!(report_outcome(code, status), expected);
            }
        }
    }
    #[test]
    fn failed_reverification_and_cancellation_remove_old_trust() {
        let mut state = Readiness::Verified;
        state.finish(Outcome::Failed);
        assert_eq!(state, Readiness::Failed);
        state.finish(Outcome::Cancelled);
        assert_eq!(state, Readiness::Unchecked);
    }
    #[test]
    fn run_progress_cannot_regress_or_claim_partial_completion() {
        let mut progress = RunProgress::new(2).unwrap();
        assert!(progress.finish(RunStatus::Completed).is_err());
        progress.advance(1).unwrap();
        assert!(progress.advance(1).is_err());
        assert!(progress.advance(3).is_err());
        progress.finish(RunStatus::Failed).unwrap();
        assert!(progress.advance(2).is_err());
        assert!(progress.finish(RunStatus::Completed).is_err());
        let mut complete = RunProgress::new(1).unwrap();
        complete.advance(1).unwrap();
        complete.finish(RunStatus::NeedsReview).unwrap();
        assert_eq!(
            serde_json::to_value(complete).unwrap()["status"],
            "needs_review"
        );
    }
    #[test]
    fn cancellation_requires_owned_identity_and_preserves_terminal_receipts() {
        let dir = tempfile::tempdir().unwrap();
        let mut progress = RunProgress::new(2).unwrap();
        crate::protocol::write_json_new(
            &dir.path().join("identity.json"),
            &serde_json::json!({"pid":progress.pid}),
        )
        .unwrap();
        progress.advance(1).unwrap();
        progress.publish(dir.path()).unwrap();
        assert!(record_owned_cancellation(dir.path(), progress.pid + 1).is_err());
        assert!(record_owned_cancellation(dir.path(), progress.pid).unwrap());
        assert!(!record_owned_cancellation(dir.path(), progress.pid).unwrap());
        let saved: RunProgress =
            serde_json::from_slice(&fs::read(dir.path().join("progress.json")).unwrap()).unwrap();
        assert_eq!(saved.status, RunStatus::Cancelled);
        assert_eq!(saved.completed, 1);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
    }

    #[test]
    fn failures_and_deadlines_publish_terminal_progress_with_retained_counts() {
        for kind in [FailureKind::ExecutionFailed, FailureKind::DeadlineExceeded] {
            let dir = tempfile::tempdir().unwrap();
            let mut progress = RunProgress::new(8).unwrap();
            progress.advance(3).unwrap();
            progress.publish(dir.path()).unwrap();
            progress
                .record_failure(dir.path(), kind, "fixture failure")
                .unwrap();
            let saved: RunProgress =
                serde_json::from_slice(&fs::read(dir.path().join("progress.json")).unwrap())
                    .unwrap();
            assert_eq!(saved.status, RunStatus::Failed);
            assert_eq!(saved.completed, 3);
            let failure: serde_json::Value =
                serde_json::from_slice(&fs::read(dir.path().join("failure.json")).unwrap())
                    .unwrap();
            assert_eq!(failure["kind"], serde_json::to_value(kind).unwrap());
            assert_eq!(failure["status"], "failed");
            assert!(!dir.path().join("report.json").exists());
        }
    }

    #[test]
    fn late_cancellation_never_downgrades_a_completed_run() {
        let dir = tempfile::tempdir().unwrap();
        let mut progress = RunProgress::new(1).unwrap();
        crate::protocol::write_json_new(
            &dir.path().join("identity.json"),
            &serde_json::json!({"pid":progress.pid}),
        )
        .unwrap();
        progress.advance(1).unwrap();
        progress
            .finish_and_publish(RunStatus::Completed, dir.path())
            .unwrap();
        let before = fs::read(dir.path().join("progress.json")).unwrap();
        assert!(!record_owned_cancellation(dir.path(), progress.pid).unwrap());
        assert_eq!(fs::read(dir.path().join("progress.json")).unwrap(), before);
    }
}
