use abliteration_lab::{
    BUILD_SHA, VERSION,
    config::{REFUSALBENCH_RISKS, RunConfig},
    lifecycle::{Action, Outcome, Readiness, Session, report_outcome},
};
use clap::{Parser, ValueEnum};
use iced::alignment::{Horizontal, Vertical};
use iced::widget::rule::horizontal as horizontal_rule;
use iced::widget::{
    Column, Space, column, container, pick_list, responsive, row, scrollable, text,
};
use iced::{Background, Border, Element, Font, Length, Subscription, Task};
use iced_shadcn::{
    self as kit, BadgeProps, BadgeVariant, ButtonProps, ButtonSize, ButtonVariant, CardProps,
    InputProps,
};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
enum Page {
    Workspace,
    Benchmarks,
    Experiments,
    Results,
    Guide,
}

#[derive(Parser, Clone)]
#[command(
    version,
    about = "Native Iced research studio; model work runs through the Rust companion CLI"
)]
struct Args {
    #[arg(long, default_value_t = 1280, value_parser = clap::value_parser!(u32).range(900..=4096))]
    width: u32,
    #[arg(long, default_value_t = 860, value_parser = clap::value_parser!(u32).range(600..=2160))]
    height: u32,
    #[arg(long, value_enum, default_value = "workspace")]
    page: Page,
    #[arg(long)]
    dark: bool,
    #[arg(long)]
    workspace: Option<PathBuf>,
    #[arg(long, hide = true)]
    quit_after_seconds: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Preset {
    Smoke,
    Full,
    Quantized,
    Cuda,
    RefusalBench,
}

impl Preset {
    const ALL: [Self; 5] = [
        Self::Smoke,
        Self::Full,
        Self::Quantized,
        Self::Cuda,
        Self::RefusalBench,
    ];
    fn source(self) -> &'static str {
        match self {
            Self::Smoke => include_str!("../../configs/lfm3-smoke.toml"),
            Self::Full => include_str!("../../configs/lfm3-full.toml"),
            Self::Quantized => include_str!("../../configs/lfm3-q8-experimental.toml"),
            Self::Cuda => include_str!("../../configs/lfm3-cuda-experimental.toml"),
            Self::RefusalBench => include_str!("../../configs/refusalbench-research.toml"),
        }
    }
}

impl std::fmt::Display for Preset {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::Smoke => "Benign smoke · CPU",
            Self::Full => "Complete benign cohorts · CPU",
            Self::Quantized => "Q8 precision experiment",
            Self::Cuda => "CUDA experiment",
            Self::RefusalBench => "RefusalBench · reference only",
        })
    }
}

#[derive(Debug, Clone)]
struct JobOutput {
    action: Action,
    code: Option<i32>,
    stdout: String,
    stderr: String,
    report: Option<Value>,
    run_path: String,
}

#[derive(Debug, Clone)]
enum ChildFailure {
    Cancelled,
    Failed(String),
}
impl From<String> for ChildFailure {
    fn from(value: String) -> Self {
        Self::Failed(value)
    }
}
impl From<&str> for ChildFailure {
    fn from(value: &str) -> Self {
        Self::Failed(value.into())
    }
}

struct LoadedReport {
    value: Value,
    run_path: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum WindowState {
    Open,
    WaitingForChild,
    ExitRequested,
}

#[derive(Debug, Clone)]
enum Message {
    Navigate(Page),
    Preset(Preset),
    ToggleTheme,
    ModelPath(String),
    ProtocolPath(String),
    OutputPath(String),
    TokenCap(String),
    InputCap(String),
    TestLimit(String),
    CalibrationLimit(String),
    Start(Action),
    Finished(u64, Result<JobOutput, ChildFailure>),
    Cancel,
    SaveConfig,
    CopyConfig,
    Exit,
}

struct Studio {
    window_state: WindowState,
    page: Page,
    preset: Preset,
    theme: kit::Theme,
    dark: bool,
    model_path: String,
    protocol_path: String,
    output_path: String,
    token_cap: String,
    input_cap: String,
    test_limit: String,
    calibration_limit: String,
    operation: Session,
    model_state: Readiness,
    protocol_state: Readiness,
    status: String,
    detail: String,
    log: String,
    last_report: Option<LoadedReport>,
    cancellation: Arc<AtomicBool>,
    quit_after_seconds: Option<u64>,
}

impl Studio {
    fn new(args: Args) -> Self {
        let workspace = args.workspace.unwrap_or_else(default_workspace);
        Self {
            window_state: WindowState::Open,
            page: args.page,
            preset: Preset::Smoke,
            theme: if args.dark {
                kit::Theme::dark()
            } else {
                kit::Theme::light()
            },
            dark: args.dark,
            model_path: workspace
                .join("models/lfm3-1.7b")
                .to_string_lossy()
                .into_owned(),
            protocol_path: workspace.join("protocol").to_string_lossy().into_owned(),
            output_path: workspace
                .join("runs")
                .join(
                    chrono::Local::now()
                        .format("study-%Y%m%d-%H%M%S")
                        .to_string(),
                )
                .to_string_lossy()
                .into_owned(),
            token_cap: "2048".into(),
            input_cap: "4096".into(),
            test_limit: "1".into(),
            calibration_limit: "2".into(),
            operation: Session::default(),
            model_state: Readiness::Unchecked,
            protocol_state: Readiness::Unchecked,
            status: "Ready to configure".into(),
            detail: "Verify the checkpoint, prepare or verify benign cohorts, then run a new experiment."
                .into(),
            log: "No commands have run in this session.".into(),
            last_report: None,
            cancellation: Arc::new(AtomicBool::new(false)),
            quit_after_seconds: args.quit_after_seconds,
        }
    }

    fn config(&self) -> Result<RunConfig, String> {
        let mut config: RunConfig =
            toml::from_str(self.preset.source()).map_err(|e| e.to_string())?;
        config.max_new_tokens = self
            .token_cap
            .parse()
            .map_err(|_| "Output token cap must be a number")?;
        config.max_input_tokens = self
            .input_cap
            .parse()
            .map_err(|_| "Input token cap must be a number")?;
        config.test_limit_per_dataset = self
            .test_limit
            .parse()
            .map_err(|_| "Test limit must be a number")?;
        config.calibration_limit = self
            .calibration_limit
            .parse()
            .map_err(|_| "Calibration limit must be a number")?;
        config.validate().map_err(|e| e.to_string())?;
        Ok(config)
    }

    fn config_text(&self) -> Result<String, String> {
        let config = self.config()?;
        let header = if config.benchmark == "refusalbench" {
            format!("# NOT RUN / NOT VALIDATED\n# {REFUSALBENCH_RISKS}\n")
        } else {
            "# Native Rust experiment. Backend development revision is experimental.\n# Compilation and smoke tests are separate from benchmark validation.\n".into()
        };
        Ok(header + &toml::to_string_pretty(&config).map_err(|e| e.to_string())?)
    }

    fn fail(&mut self, message: String) {
        self.operation.notice(Outcome::Failed);
        self.status = "Action needs attention".into();
        self.detail = message.clone();
        self.log = message;
    }

    fn draft_changed(&mut self) {
        self.last_report = None;
        self.operation.reset_notice();
        self.status = "Ready to configure".into();
        self.detail = "This draft has not been evaluated. Verify any changed inputs before starting a new run.".into();
    }

    fn start(&mut self, action: Action) -> Task<Message> {
        if self.operation.is_busy() {
            return Task::none();
        }
        if action == Action::Run
            && (self.model_state != Readiness::Verified
                || self.protocol_state != Readiness::Verified)
        {
            self.fail(
                "Verify the checkpoint and prepare or verify the benign protocol before running."
                    .into(),
            );
            return Task::none();
        }
        let paths = (
            self.model_path.clone(),
            self.protocol_path.clone(),
            self.output_path.clone(),
        );
        let config_text = if action == Action::Run {
            let config = match self.config() {
                Ok(c) => c,
                Err(e) => {
                    self.fail(e);
                    return Task::none();
                }
            };
            if let Err(error) = config.executable() {
                self.fail(error.to_string());
                return Task::none();
            }
            match self.config_text() {
                Ok(c) => c,
                Err(e) => {
                    self.fail(e);
                    return Task::none();
                }
            }
        } else {
            String::new()
        };
        let Some(job) = self.operation.begin(action) else {
            return Task::none();
        };
        match action {
            Action::Verify | Action::Download => self.model_state = Readiness::Checking,
            Action::Prepare | Action::VerifyProtocol => self.protocol_state = Readiness::Checking,
            Action::Run | Action::VerifyReport => self.last_report = None,
            Action::Inspect => {}
        }
        self.status = match action {
            Action::Verify => "Verifying checkpoint bytes",
            Action::Download => "Downloading the pinned checkpoint",
            Action::Inspect => "Inspecting tensor metadata",
            Action::Prepare => "Preparing the frozen benign cohorts",
            Action::VerifyProtocol => "Verifying the existing benign protocol",
            Action::Run => "Running the native experiment",
            Action::VerifyReport => "Verifying saved native evidence",
        }
        .into();
        self.detail =
            "The interface stays responsive. Cancellation affects only this owned child process."
                .into();
        self.cancellation = Arc::new(AtomicBool::new(false));
        let cancellation = Arc::clone(&self.cancellation);
        Task::perform(
            run_child(action, paths, config_text, cancellation),
            move |result| Message::Finished(job.id, result),
        )
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        if self.window_state != WindowState::Open
            && !matches!(&message, Message::Finished(..) | Message::Exit)
        {
            return Task::none();
        }
        if self.operation.is_busy()
            && matches!(
                &message,
                Message::Preset(_)
                    | Message::ModelPath(_)
                    | Message::ProtocolPath(_)
                    | Message::OutputPath(_)
                    | Message::TokenCap(_)
                    | Message::InputCap(_)
                    | Message::TestLimit(_)
                    | Message::CalibrationLimit(_)
                    | Message::SaveConfig
                    | Message::CopyConfig
            )
        {
            return Task::none();
        }
        match message {
            Message::Navigate(page) => self.page = page,
            Message::ToggleTheme => {
                self.dark = !self.dark;
                self.theme = if self.dark {
                    kit::Theme::dark()
                } else {
                    kit::Theme::light()
                };
            }
            Message::ModelPath(value) => {
                self.model_path = value;
                self.model_state = Readiness::Unchecked;
                self.draft_changed();
            }
            Message::ProtocolPath(value) => {
                self.protocol_path = value;
                self.protocol_state = Readiness::Unchecked;
                self.draft_changed();
            }
            Message::OutputPath(value) => {
                self.output_path = value;
                self.draft_changed();
            }
            Message::TokenCap(value) => {
                self.token_cap = value;
                self.draft_changed();
            }
            Message::InputCap(value) => {
                self.input_cap = value;
                self.draft_changed();
            }
            Message::TestLimit(value) => {
                self.test_limit = value;
                self.draft_changed();
            }
            Message::CalibrationLimit(value) => {
                self.calibration_limit = value;
                self.draft_changed();
            }
            Message::Preset(preset) => {
                if !self.operation.is_busy() {
                    self.preset = preset;
                    if let Ok(config) = toml::from_str::<RunConfig>(preset.source()) {
                        self.token_cap = config.max_new_tokens.to_string();
                        self.input_cap = config.max_input_tokens.to_string();
                        self.test_limit = config.test_limit_per_dataset.to_string();
                        self.calibration_limit = config.calibration_limit.to_string();
                    }
                    self.draft_changed();
                }
            }
            Message::Start(action) => return self.start(action),
            Message::Cancel => {
                if !self.operation.cancel() {
                    return Task::none();
                }
                self.cancellation.store(true, Ordering::Relaxed);
                self.status = "Cancelling the owned run".into();
                self.detail =
                    "Partial records are retained and cannot be reported as a completed benchmark."
                        .into();
            }
            Message::Finished(id, result) => self.finish(id, result),
            Message::SaveConfig => {
                let result = (|| -> Result<String, String> {
                    let body = self.config_text()?;
                    let path = PathBuf::from(&self.output_path).with_extension("toml");
                    if let Some(parent) = path.parent() {
                        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    use std::io::Write;
                    let mut file = std::fs::File::options()
                        .create_new(true)
                        .write(true)
                        .open(&path)
                        .map_err(|e| e.to_string())?;
                    file.write_all(body.as_bytes()).map_err(|e| e.to_string())?;
                    Ok(format!("Saved {}", path.display()))
                })();
                match result {
                    Ok(message) => {
                        self.status = "Configuration exported".into();
                        self.detail = message;
                        self.operation.notice(Outcome::Succeeded);
                    }
                    Err(e) => self.fail(e),
                }
            }
            Message::CopyConfig => {
                return match self.config_text() {
                    Ok(body) => iced::clipboard::write(body),
                    Err(e) => {
                        self.fail(e);
                        Task::none()
                    }
                };
            }
            Message::Exit => {
                return self.request_exit();
            }
        }
        if self.window_state == WindowState::WaitingForChild && !self.operation.is_busy() {
            return self.request_exit();
        }
        Task::none()
    }

    fn request_exit(&mut self) -> Task<Message> {
        if self.operation.is_busy() {
            self.window_state = WindowState::WaitingForChild;
            self.operation.cancel();
            self.cancellation.store(true, Ordering::Relaxed);
            self.status = "Closing after the owned action stops".into();
            self.detail =
                "Waiting for the child process to exit and retain its partial evidence.".into();
            Task::none()
        } else {
            self.window_state = WindowState::ExitRequested;
            iced::exit()
        }
    }

    fn finish(&mut self, id: u64, result: Result<JobOutput, ChildFailure>) {
        let Some(job) = self.operation.active().filter(|job| job.id == id) else {
            return;
        };
        let mut report = None;
        let outcome = match result {
            Err(ChildFailure::Cancelled) => {
                self.status = "Action cancelled".into();
                self.detail = "The owned process has stopped. Partial evidence is retained; cancellation is not a completed benchmark.".into();
                self.log = self.detail.clone();
                Outcome::Cancelled
            }
            Err(ChildFailure::Failed(error)) => {
                self.status = "Command did not complete".into();
                self.detail = tail_text(&error, 900);
                self.log = error;
                Outcome::Failed
            }
            Ok(output) => {
                self.log = tail_text(&format!("{}\n{}", output.stdout, output.stderr), 16_000);
                let mut outcome = if output.action != job.action {
                    Outcome::Failed
                } else if matches!(job.action, Action::Run | Action::VerifyReport) {
                    report_outcome(
                        output.code,
                        output.report.as_ref().and_then(|r| r["status"].as_str()),
                    )
                } else if output.code == Some(0) {
                    Outcome::Succeeded
                } else {
                    Outcome::Failed
                };
                self.detail =
                    "The full command receipt is available under Session activity.".into();
                if outcome == Outcome::Succeeded
                    && matches!(job.action, Action::Verify | Action::Download)
                {
                    match serde_json::from_str::<abliteration_lab::model::ModelVerification>(
                        &output.stdout,
                    ) {
                        Ok(proof)
                            if proof.parameters == 1_728_801_536
                                && proof.file_sha256.len() == 11
                                && !proof.python_executed =>
                        {
                            self.detail = format!(
                                "{} files and {} tensors verified against the pinned model.",
                                proof.file_sha256.len(),
                                proof.tensors.len()
                            );
                        }
                        _ => outcome = Outcome::Failed,
                    }
                }
                if outcome == Outcome::Succeeded
                    && matches!(job.action, Action::Prepare | Action::VerifyProtocol)
                {
                    let valid = serde_json::from_str::<abliteration_lab::protocol::ProtocolPin>(
                        &output.stdout,
                    )
                    .is_ok_and(|pin| {
                        pin.total_rows == 366
                            && !pin.jbb_target_column_used
                            && pin.protocol_sha256
                                == abliteration_lab::protocol::EXPECTED_PROTOCOL_SHA256
                    });
                    if !valid {
                        outcome = Outcome::Failed;
                    }
                }
                self.status = match outcome {
                    Outcome::Failed => "Command did not complete",
                    Outcome::NeedsReview => "Evidence recorded · review output",
                    _ => match job.action {
                        Action::Verify | Action::Download => "Checkpoint verified",
                        Action::Prepare => "Benign protocol prepared",
                        Action::VerifyProtocol => "Benign protocol verified",
                        Action::Inspect => "Tensor inventory read",
                        Action::Run => "Run finished",
                        Action::VerifyReport => "Report integrity verified",
                    },
                }
                .into();
                if outcome == Outcome::Failed {
                    self.detail = if output.stderr.trim().is_empty() {
                        "The command exit and native evidence did not establish a valid result. See Session activity.".into()
                    } else {
                        tail_text(&output.stderr, 900)
                    };
                } else if outcome == Outcome::NeedsReview {
                    self.detail = "The report includes invalid or censored output. Affected rates remain unmeasured; inspect the recorded evidence.".into();
                }
                if matches!(outcome, Outcome::Succeeded | Outcome::NeedsReview) {
                    report = output.report.map(|value| LoadedReport {
                        value,
                        run_path: output.run_path,
                    });
                }
                outcome
            }
        };
        self.operation.finish(id, outcome);
        match job.action {
            Action::Verify | Action::Download => self.model_state.finish(outcome),
            Action::Prepare | Action::VerifyProtocol => self.protocol_state.finish(outcome),
            _ => {}
        }
        if let Some(report) = report {
            self.last_report = Some(report);
            self.page = Page::Results;
        }
    }

    fn native_theme(&self) -> iced::Theme {
        let mut palette = if self.dark {
            iced::Theme::Dark.palette()
        } else {
            iced::Theme::Light.palette()
        };
        palette.background = self.theme.palette.background;
        palette.text = self.theme.palette.foreground;
        palette.primary = self.theme.palette.primary;
        palette.danger = self.theme.palette.destructive;
        iced::Theme::custom("Abliteration Studio".to_owned(), palette)
    }

    fn evidence_label(&self) -> &'static str {
        if let Some(job) = self.operation.active()
            && matches!(job.action, Action::Run | Action::VerifyReport)
        {
            return if !self.operation.can_cancel() {
                "Stopping"
            } else if job.action == Action::Run {
                "Running"
            } else {
                "Checking"
            };
        }
        match &self.last_report {
            Some(report) if report.value["status"] == "needs_review" => "Review",
            Some(_) => "Recorded",
            None => "No result",
        }
    }

    fn subscription(&self) -> Subscription<Message> {
        let close = iced::window::close_requests().map(|_| Message::Exit);
        match self.quit_after_seconds {
            Some(seconds) => Subscription::batch([
                close,
                iced::time::every(Duration::from_secs(seconds.clamp(2, 60))).map(|_| Message::Exit),
            ]),
            None => close,
        }
    }

    fn button<'a>(
        &self,
        label: &'a str,
        message: Message,
        variant: ButtonVariant,
        disabled: bool,
    ) -> Element<'a, Message> {
        kit::button(
            label,
            Some(message),
            ButtonProps::new()
                .variant(variant)
                .size(ButtonSize::Size3)
                .disabled(disabled),
            &self.theme,
        )
        .into()
    }

    fn badge<'a>(&self, label: impl Into<String>) -> Element<'a, Message> {
        kit::badge(
            label,
            BadgeProps::default().variant(BadgeVariant::Secondary),
            &self.theme,
        )
    }

    fn field<'a>(
        &'a self,
        label: &'a str,
        value: &'a str,
        placeholder: &'a str,
        change: fn(String) -> Message,
    ) -> Element<'a, Message> {
        column![
            text(label)
                .size(12)
                .color(self.theme.palette.muted_foreground),
            kit::input(
                value,
                placeholder,
                Some(change),
                InputProps::new()
                    .custom_height(38.0)
                    .disabled(self.operation.is_busy()),
                &self.theme
            )
        ]
        .spacing(7)
        .width(Length::Fill)
        .into()
    }

    fn card<'a>(&self, content: impl Into<Element<'a, Message>>) -> Element<'a, Message> {
        kit::card(
            content,
            CardProps::new().padding(20.0).show_shadow(false),
            &self.theme,
        )
        .width(Length::Fill)
        .into()
    }

    fn stat<'a>(
        &self,
        label: &'a str,
        value: impl Into<String>,
        note: &'a str,
    ) -> Element<'a, Message> {
        self.card(
            column![
                text(label)
                    .size(12)
                    .color(self.theme.palette.muted_foreground),
                text(value.into()).size(23),
                text(note)
                    .size(11)
                    .color(self.theme.palette.muted_foreground),
            ]
            .spacing(8),
        )
    }

    fn sidebar(&self) -> Element<'_, Message> {
        let palette = self.theme.palette;
        let mark = container(text("A").size(23).color(palette.primary_foreground))
            .width(38)
            .height(38)
            .align_x(Horizontal::Center)
            .align_y(Vertical::Center)
            .style(move |_| container::Style {
                background: Some(Background::Color(palette.primary)),
                border: Border {
                    radius: 9.0.into(),
                    ..Default::default()
                },
                ..Default::default()
            });
        let mut navigation = Column::new().spacing(7);
        for (page, label) in [
            (Page::Workspace, "Workspace"),
            (Page::Benchmarks, "Benchmark catalog"),
            (Page::Experiments, "Configurations"),
            (Page::Results, "Results & activity"),
            (Page::Guide, "Reproduction guide"),
        ] {
            navigation = navigation.push(
                kit::button(
                    label,
                    Some(Message::Navigate(page)),
                    ButtonProps::new()
                        .variant(if self.page == page {
                            ButtonVariant::Secondary
                        } else {
                            ButtonVariant::Ghost
                        })
                        .size(ButtonSize::Size3)
                        .justify(kit::button::ButtonJustify::Start),
                    &self.theme,
                )
                .width(Length::Fill),
            );
        }
        let content = column![
            row![
                mark,
                column![
                    text("Abliteration").size(20),
                    text("RESEARCH STUDIO")
                        .size(10)
                        .color(palette.muted_foreground)
                ]
                .spacing(3)
            ]
            .spacing(12)
            .align_y(Vertical::Center),
            Space::new().height(24),
            text("WORKSPACE").size(10).color(palette.muted_foreground),
            navigation,
            Space::new().height(Length::Fill),
            self.badge("Experimental release"),
            text(format!("v{VERSION}"))
                .size(12)
                .color(palette.muted_foreground),
            text("Native Rust + Iced")
                .size(11)
                .color(palette.muted_foreground),
            self.button(
                if self.dark { "Light mode" } else { "Dark mode" },
                Message::ToggleTheme,
                ButtonVariant::Outline,
                false
            ),
        ]
        .spacing(12)
        .height(Length::Fill);
        container(content)
            .padding(20)
            .width(236)
            .height(Length::Fill)
            .style(move |_| container::Style {
                background: Some(Background::Color(palette.sidebar)),
                border: Border {
                    color: palette.sidebar_border,
                    width: 1.0,
                    radius: 0.0.into(),
                },
                ..Default::default()
            })
            .into()
    }

    fn experiment(&self, width: f32) -> Element<'_, Message> {
        let model = self.card(
            column![
                row![
                    text("Pinned checkpoint").size(18),
                    Space::new().width(Length::Fill),
                    self.badge(self.model_state.label())
                ]
                .align_y(Vertical::Center),
                text("LiquidAI/LFM3-1.7B").size(16),
                text("11 pinned files · 24 hybrid layers · original weights preserved")
                    .size(12)
                    .color(self.theme.palette.muted_foreground),
                self.field(
                    "Model directory",
                    &self.model_path,
                    "Path to the pinned checkpoint",
                    Message::ModelPath
                ),
                row![
                    self.button(
                        "Verify files",
                        Message::Start(Action::Verify),
                        ButtonVariant::Default,
                        self.operation.is_busy()
                    ),
                    self.button(
                        "Download model",
                        Message::Start(Action::Download),
                        ButtonVariant::Outline,
                        self.operation.is_busy()
                    ),
                    self.button(
                        "Inspect",
                        Message::Start(Action::Inspect),
                        ButtonVariant::Ghost,
                        self.operation.is_busy()
                    )
                ]
                .spacing(8),
                text("Revision 0dc4268b5614")
                    .font(Font::MONOSPACE)
                    .size(11)
                    .color(self.theme.palette.muted_foreground),
            ]
            .spacing(14),
        );
        let settings = self.settings_card();
        let setup: Element<_> = if width >= 900.0 {
            row![model, settings].spacing(16).into()
        } else {
            column![model, settings].spacing(16).into()
        };
        column![
            setup,
            self.card(column![
                text("Data and output").size(18),
                self.field("Prepared protocol folder", &self.protocol_path, "A new or previously prepared cohort folder", Message::ProtocolPath),
                row![
                    self.button("Prepare benign cohorts", Message::Start(Action::Prepare), ButtonVariant::Outline, self.operation.is_busy() || self.protocol_state == Readiness::Verified),
                    self.button("Verify existing", Message::Start(Action::VerifyProtocol), ButtonVariant::Outline, self.operation.is_busy()),
                ].spacing(12).align_y(Vertical::Center),
                text(format!("250 XSTest safe + 100 JBB benign · {}", self.protocol_state.label())).size(12).color(self.theme.palette.muted_foreground),
                self.field("New run folder", &self.output_path, "Existing results are never overwritten", Message::OutputPath),
                row![
                    self.button("Run evaluation", Message::Start(Action::Run), ButtonVariant::Default, self.operation.is_busy() || self.model_state != Readiness::Verified || self.protocol_state != Readiness::Verified || self.preset == Preset::RefusalBench),
                    self.button("Export config", Message::SaveConfig, ButtonVariant::Outline, self.operation.is_busy()),
                    self.button("Cancel owned run", Message::Cancel, ButtonVariant::Ghost, !self.operation.can_cancel())
                ].spacing(8),
                text("A smoke run checks the software path. It does not establish benchmark performance.").size(12).color(self.theme.palette.muted_foreground)
            ].spacing(14)),
        ].spacing(16).into()
    }

    fn settings_card(&self) -> Element<'_, Message> {
        let palette = self.theme.palette;
        self.card(column![
            row![text("Experiment configuration").size(18), Space::new().width(Length::Fill), self.badge("Greedy decoding")].align_y(Vertical::Center),
            pick_list(Preset::ALL, Some(self.preset), Message::Preset).padding(10).width(Length::Fill)
                .style(move |_, status| iced::widget::pick_list::Style {
                    text_color: palette.foreground, placeholder_color: palette.muted_foreground,
                    handle_color: palette.foreground, background: Background::Color(palette.card),
                    border: Border { radius: 6.0.into(), width: 1.0,
                        color: if matches!(status, iced::widget::pick_list::Status::Active) { palette.input } else { palette.ring } }
                }),
            row![
                self.field("Output token cap", &self.token_cap, "2048", Message::TokenCap),
                self.field("Input token cap", &self.input_cap, "4096", Message::InputCap)
            ].spacing(12),
            row![
                self.field("Test rows / suite · 0 = all", &self.test_limit, "1", Message::TestLimit),
                self.field("Calibration rows · 0 = all", &self.calibration_limit, "2", Message::CalibrationLimit)
            ].spacing(12),
            text("Context profile selection uses calibration only. Empty or censored output cannot become a zero-refusal claim.").size(12).color(self.theme.palette.muted_foreground),
        ].spacing(14))
    }

    fn benchmarks(&self) -> Element<'_, Message> {
        let mut content = column![
            self.card(column![
                text("Evaluate distinct questions separately").size(18),
                text("Benign false-refusal screening, general task quality, and harmful-request compliance are different measurements. Missing scores stay unmeasured.").size(13),
            ].spacing(10))
        ].spacing(14);
        for (name, count, status, detail) in [
            (
                "XSTest safe",
                "250 prompts",
                "Executable benign cohort",
                "Pinned safe-only selection. Lexical screen, not an official semantic judgment.",
            ),
            (
                "JailbreakBench benign",
                "100 prompts",
                "Executable benign cohort",
                "Uses the Goal column only. Harmful targets and assistant prefills are excluded.",
            ),
            (
                "Huihui HarmBench",
                "320 records",
                "Source verified · not run",
                "159 standard, 81 contextual and 80 copyright records. No universal Huihui judging protocol is assumed.",
            ),
            (
                "StrongREJECT",
                "313 records",
                "Source verified · not run",
                "Authorized mirror access was checked. Its logical rows match the pinned author CSV. Raw gated prompts are not bundled.",
            ),
            (
                "RefusalBench",
                "141 public prompts",
                "Included · not run / not validated",
                "Research reference configuration is available. It is excluded from automated execution; the public positive-control manifest is incomplete.",
            ),
        ] {
            content = content.push(
                self.card(
                    column![
                        row![
                            text(name).size(17),
                            Space::new().width(Length::Fill),
                            self.badge(count)
                        ]
                        .align_y(Vertical::Center),
                        text(status)
                            .size(12)
                            .color(self.theme.palette.muted_foreground),
                        text(detail).size(13),
                    ]
                    .spacing(9),
                ),
            );
        }
        content.push(self.risks()).into()
    }

    fn risks(&self) -> Element<'_, Message> {
        self.card(
            column![
                row![
                    text("RefusalBench research risks").size(18),
                    Space::new().width(Length::Fill),
                    self.badge("Not tested")
                ]
                .align_y(Vertical::Center),
                text(REFUSALBENCH_RISKS).size(13),
            ]
            .spacing(12),
        )
    }

    fn experiments(&self) -> Element<'_, Message> {
        let body = self
            .config_text()
            .unwrap_or_else(|e| format!("Configuration error: {e}"));
        column![
            self.settings_card(),
            self.card(column![
                text("Build evidence is not outcome evidence").size(18),
                text("Q8 changes numerical precision in memory. CUDA depends on the compiled backend and available device memory. Both can change outputs, timing and capability. Keep a baseline, pin inputs, retain failures, and review outcomes before drawing conclusions.").size(13),
                text("The pinned inference engine is a development revision. Full benchmark results and deployment suitability are not certified by successful compilation or a smoke test.").size(13).color(self.theme.palette.muted_foreground),
            ].spacing(12)),
            self.card(column![
                row![text("Reproducible configuration").size(18), Space::new().width(Length::Fill), self.button("Copy TOML", Message::CopyConfig, ButtonVariant::Outline, self.operation.is_busy())].align_y(Vertical::Center),
                text(body).font(Font::MONOSPACE).size(12),
                self.button("Export configuration file", Message::SaveConfig, ButtonVariant::Default, self.operation.is_busy()),
            ].spacing(14)),
            self.risks(),
        ].spacing(16).into()
    }

    fn results(&self) -> Element<'_, Message> {
        let mut results = column![
            self.card(column![
                text("Open a saved native run").size(18),
                self.field("Prepared protocol folder", &self.protocol_path, "Folder containing protocol.jsonl", Message::ProtocolPath),
                self.field("Run folder", &self.output_path, "Folder containing report.json and responses.jsonl", Message::OutputPath),
                self.button("Verify and load report", Message::Start(Action::VerifyReport), ButtonVariant::Outline, self.operation.is_busy()),
                text("Verifies coverage, hashes and marker calculations. This does not rerun the model or perform semantic judging.").size(12).color(self.theme.palette.muted_foreground),
            ].spacing(12))
        ].spacing(16);
        if let Some(loaded) = &self.last_report {
            let report = &loaded.value;
            let mut table = column![
                text("Observed marker screens").size(18),
                text(format!("Run: {}", loaded.run_path)).size(12),
                text("These are not semantic refusal or official harmful-compliance scores.")
                    .size(12)
                    .color(self.theme.palette.muted_foreground),
                horizontal_rule(1)
            ]
            .spacing(12);
            if let Some(profiles) = report["results"].as_object() {
                for (profile, cohorts) in profiles {
                    if let Some(cohorts) = cohorts.as_object() {
                        for (name, stats) in cohorts {
                            let rate = stats["lexical_marker_rate"]
                                .as_f64()
                                .map(|n| format!("{:.1}%", n * 100.0))
                                .unwrap_or_else(|| "Not measurable".into());
                            table = table.push(
                                row![
                                    column![
                                        text(name).size(13),
                                        text(profile)
                                            .size(11)
                                            .color(self.theme.palette.muted_foreground)
                                    ]
                                    .width(Length::Fill),
                                    text(format!("n {}", stats["n"])).size(12).width(55),
                                    text(format!("markers {}", stats["marker_hits"]))
                                        .size(12)
                                        .width(85),
                                    text(format!("invalid {}", stats["invalid_or_censored"]))
                                        .size(12)
                                        .width(85),
                                    text(rate).size(13).width(125),
                                ]
                                .spacing(10)
                                .align_y(Vertical::Center),
                            );
                        }
                    }
                }
            }
            results = results.push(self.card(table));
        } else {
            results = results.push(self.card(column![
                self.badge("No model result loaded"),
                text("Evidence will appear after a run").size(22),
                text("A completed native run records its model hashes, source revision, configuration, calibration decision and response coverage. Reference benchmarks stay marked not run.").size(14),
                self.button("Configure an experiment", Message::Navigate(Page::Workspace), ButtonVariant::Outline, false),
            ].spacing(14)));
        }
        results
            .push(
                self.card(
                    column![
                        text("Session activity").size(18),
                        text(&self.log).font(Font::MONOSPACE).size(12),
                    ]
                    .spacing(12),
                ),
            )
            .into()
    }

    fn guide(&self) -> Element<'_, Message> {
        let mut content = Column::new().spacing(14);
        for (number, title, body) in [
            (
                "01",
                "Verify the exact model",
                "Use the instruction-tuned LiquidAI/LFM3-1.7B checkpoint. The Rust verifier checks all 11 file hashes and all 286 tensor extents before inference. Python reference files are never executed.",
            ),
            (
                "02",
                "Prepare pinned benign inputs",
                "Download only the frozen XSTest safe and JBB benign source selections. Preserve the generated protocol manifest. Calibration and held-out prompts must remain disjoint.",
            ),
            (
                "03",
                "Start with an engineering smoke",
                "Use a new run directory, inspect errors and token-cap censoring, then choose a larger budget. A smoke result is not a leaderboard score.",
            ),
            (
                "04",
                "Read each metric in context",
                "Lexical markers are a screen, not a semantic judge. Keep uncertainty, unusable responses and missing results visible. Original checkpoint files remain unchanged.",
            ),
            (
                "05",
                "Treat experimental settings as research",
                "Precision changes and development backends may alter output quality. Record the exact configuration and validate your own study. RefusalBench is included as an unrun reference with explicit risks.",
            ),
        ] {
            content = content.push(
                self.card(
                    row![
                        text(number)
                            .size(22)
                            .color(self.theme.palette.muted_foreground)
                            .width(42),
                        column![text(title).size(18), text(body).size(13)]
                            .spacing(9)
                            .width(Length::Fill)
                    ]
                    .spacing(14),
                ),
            );
        }
        content.into()
    }

    fn main_content(&self, width: f32) -> Element<'_, Message> {
        let (title, subtitle) = match self.page {
            Page::Workspace => (
                "Research workspace",
                "Configure a traceable experiment on your own machine.",
            ),
            Page::Benchmarks => (
                "Benchmark catalog",
                "Keep source verification, model execution and judging separate.",
            ),
            Page::Experiments => (
                "Research configurations",
                "Inspect and export every parameter before running.",
            ),
            Page::Results => (
                "Results and activity",
                "Complete evidence, explicit uncertainty, and retained failures.",
            ),
            Page::Guide => (
                "Reproduce the workflow",
                "A practical path from pinned files to interpretable evidence.",
            ),
        };
        let body = match self.page {
            Page::Workspace => self.experiment(width),
            Page::Benchmarks => self.benchmarks(),
            Page::Experiments => self.experiments(),
            Page::Results => self.results(),
            Page::Guide => self.guide(),
        };
        let status_color = if self.operation.is_failure() {
            self.theme.palette.destructive
        } else {
            self.theme.palette.foreground
        };
        let header = row![
            column![
                text(title).size(28),
                text(subtitle)
                    .size(13)
                    .color(self.theme.palette.muted_foreground)
            ]
            .spacing(6),
            Space::new().width(Length::Fill),
            self.badge("LOCAL · RUST")
        ]
        .spacing(16)
        .align_y(Vertical::Center);
        let cards = row![
            self.stat("Pinned model", "1.73 B", "LiquidAI / LFM3"),
            self.stat("Runtime", "Rust", "Python is reference only"),
            self.stat("Evidence", self.evidence_label(), "No default-zero scores"),
        ]
        .spacing(12);
        container(
            column![
                header,
                cards,
                scrollable(body).height(Length::Fill),
                horizontal_rule(1),
                row![
                    column![
                        text(&self.status).size(13).color(status_color),
                        text(tail_text(
                            &self.detail.split_whitespace().collect::<Vec<_>>().join(" "),
                            240
                        ))
                        .size(11)
                        .color(self.theme.palette.muted_foreground)
                    ]
                    .spacing(4)
                    .width(Length::Fill),
                    text(if BUILD_SHA == "development" {
                        "Development build".into()
                    } else {
                        BUILD_SHA.chars().take(8).collect::<String>()
                    })
                    .size(11)
                    .font(Font::MONOSPACE)
                    .color(self.theme.palette.muted_foreground)
                ]
                .spacing(12)
                .align_y(Vertical::Center)
            ]
            .spacing(18)
            .height(Length::Fill),
        )
        .padding(24)
        .width(Length::Fill)
        .height(Length::Fill)
        .into()
    }

    fn view(&self) -> Element<'_, Message> {
        row![
            self.sidebar(),
            responsive(|size| self.main_content(size.width))
        ]
        .height(Length::Fill)
        .into()
    }
}

impl Drop for Studio {
    fn drop(&mut self) {
        self.cancellation.store(true, Ordering::Relaxed);
    }
}

fn default_workspace() -> PathBuf {
    if cfg!(windows) {
        std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(std::env::temp_dir)
            .join("AbliterationStudio")
    } else {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|| {
                std::env::var_os("HOME")
                    .map(PathBuf::from)
                    .unwrap_or_else(std::env::temp_dir)
                    .join(".local/share")
            })
            .join("abliteration-studio")
    }
}

fn tail_text(value: &str, max: usize) -> String {
    let mut chars: Vec<_> = value.chars().rev().take(max).collect();
    chars.reverse();
    chars.into_iter().collect()
}

async fn run_child(
    action: Action,
    paths: (String, String, String),
    config_text: String,
    cancel: Arc<AtomicBool>,
) -> Result<JobOutput, ChildFailure> {
    if cancel.load(Ordering::Relaxed) {
        return Err(ChildFailure::Cancelled);
    }
    let (model, protocol, output) = paths;
    let executable = std::env::current_exe().map_err(|e| e.to_string())?;
    let cli = executable
        .parent()
        .ok_or("Application directory unavailable")?
        .join(if cfg!(windows) {
            "abliteration-cli.exe"
        } else {
            "abliteration-cli"
        });
    if !cli.is_file() {
        return Err("Install or build the companion abliteration-cli beside this GUI.".into());
    }
    let mut arguments = Vec::<String>::new();
    match action {
        Action::Verify => arguments.extend(["verify-model".into(), model]),
        Action::Download => arguments.extend(["download-model".into(), model]),
        Action::Inspect => arguments.extend(["inspect-tensors".into(), model]),
        Action::Prepare => arguments.extend(["prepare-protocol".into(), protocol]),
        Action::VerifyProtocol => arguments.extend([
            "verify-protocol".into(),
            Path::new(&protocol)
                .join("protocol.jsonl")
                .to_string_lossy()
                .into_owned(),
        ]),
        Action::VerifyReport => arguments.extend([
            "verify-report".into(),
            "--run".into(),
            output.clone(),
            "--protocol".into(),
            Path::new(&protocol)
                .join("protocol.jsonl")
                .to_string_lossy()
                .into_owned(),
        ]),
        Action::Run => {
            let directory = Path::new(&output);
            if directory.exists() {
                return Err("Choose a new output folder; existing results are immutable.".into());
            }
            let config = directory.with_extension("toml");
            if let Some(parent) = config.parent() {
                tokio::fs::create_dir_all(parent)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            use tokio::io::AsyncWriteExt;
            if config.exists() {
                let metadata = tokio::fs::metadata(&config)
                    .await
                    .map_err(|e| e.to_string())?;
                if metadata.len() > 64 * 1024
                    || tokio::fs::read_to_string(&config)
                        .await
                        .map_err(|e| e.to_string())?
                        != config_text
                {
                    return Err(
                        "An existing configuration differs. Choose a new run name to preserve it."
                            .into(),
                    );
                }
            } else {
                let mut file = tokio::fs::OpenOptions::new()
                    .create_new(true)
                    .write(true)
                    .open(&config)
                    .await
                    .map_err(|e| e.to_string())?;
                file.write_all(config_text.as_bytes())
                    .await
                    .map_err(|e| e.to_string())?;
                file.flush().await.map_err(|e| e.to_string())?;
            }
            arguments.extend([
                "run".into(),
                "--model".into(),
                model,
                "--protocol".into(),
                Path::new(&protocol)
                    .join("protocol.jsonl")
                    .to_string_lossy()
                    .into_owned(),
                "--output".into(),
                output.clone(),
                "--config".into(),
                config.to_string_lossy().into_owned(),
            ]);
        }
    }
    let mut command = tokio::process::Command::new(cli);
    command
        .args(arguments)
        .env("RAYON_NUM_THREADS", "6")
        .kill_on_drop(true)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.as_std_mut().creation_flags(0x0800_0000);
    }
    if cancel.load(Ordering::Relaxed) {
        return Err(ChildFailure::Cancelled);
    }
    let child = command.spawn().map_err(|e| e.to_string())?;
    let pid = child.id();
    let result = match capture_child(child, cancel).await {
        Err(ChildFailure::Cancelled) => {
            if action == Action::Run
                && let Some(pid) = pid
            {
                abliteration_lab::lifecycle::record_owned_cancellation(Path::new(&output), pid)
                    .map_err(|e| format!("Owned process stopped, but its cancellation receipt could not be recorded: {e}"))?;
            }
            return Err(ChildFailure::Cancelled);
        }
        other => other?,
    };
    let report_path = Path::new(&output).join("report.json");
    let report = if matches!(action, Action::Run | Action::VerifyReport)
        && matches!(result.status.code(), Some(0 | 2))
    {
        let bytes = tokio::task::spawn_blocking(move || {
            abliteration_lab::protocol::read_bounded(&report_path, 2 * 1024 * 1024)
        })
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| format!("Cannot load native report: {e}"))?;
        if action == Action::VerifyReport {
            let receipt: Value = serde_json::from_slice(&result.stdout)
                .map_err(|e| format!("The verifier returned an invalid receipt: {e}"))?;
            if !abliteration_lab::evidence::matches_report_receipt(&bytes, &receipt) {
                return Err(
                    "The report changed after verification. Verify and load it again.".into(),
                );
            }
        }
        serde_json::from_slice::<Value>(&bytes)
            .ok()
            .filter(|v| v["runtime"] == "Rust/mistral.rs" && v["python_executed"] == false)
    } else {
        None
    };
    Ok(JobOutput {
        action,
        code: result.status.code(),
        stdout: String::from_utf8_lossy(&result.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&result.stderr).into_owned(),
        report,
        run_path: output,
    })
}

async fn read_child_stream(
    mut stream: impl tokio::io::AsyncRead + Unpin,
) -> Result<Vec<u8>, ChildFailure> {
    use tokio::io::AsyncReadExt;
    let mut bytes = Vec::new();
    stream
        .read_to_end(&mut bytes)
        .await
        .map_err(|e| e.to_string())?;
    Ok(bytes)
}

async fn capture_child(
    mut child: tokio::process::Child,
    cancel: Arc<AtomicBool>,
) -> Result<std::process::Output, ChildFailure> {
    let stdout = child.stdout.take().ok_or("Child stdout unavailable")?;
    let stderr = child.stderr.take().ok_or("Child stderr unavailable")?;
    let wait = async {
        tokio::select! {
            biased;
            result = child.wait() => result.map_err(|e| ChildFailure::Failed(e.to_string())),
            _ = async { while !cancel.load(Ordering::Relaxed) { tokio::time::sleep(Duration::from_millis(50)).await; } } => {
                // Kill through the owned handle and reap before admitting another job.
                child.kill().await.map_err(|e| e.to_string())?;
                Err(ChildFailure::Cancelled)
            }
        }
    };
    let (status, stdout, stderr) =
        tokio::try_join!(wait, read_child_stream(stdout), read_child_stream(stderr))?;
    Ok(std::process::Output {
        status,
        stdout,
        stderr,
    })
}

pub fn run() -> iced::Result {
    let args = Args::parse();
    let size = (args.width as f32, args.height as f32);
    iced::application(
        move || Studio::new(args.clone()),
        Studio::update,
        Studio::view,
    )
    .title("Abliteration Studio")
    .window(iced::window::Settings {
        size: iced::Size::new(size.0, size.1),
        min_size: Some(iced::Size::new(900.0, 600.0)),
        exit_on_close_request: false,
        ..Default::default()
    })
    .theme(Studio::native_theme)
    .subscription(Studio::subscription)
    .run()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn studio() -> Studio {
        Studio::new(Args {
            width: 900,
            height: 600,
            page: Page::Workspace,
            dark: false,
            workspace: Some(PathBuf::from("state-test")),
            quit_after_seconds: None,
        })
    }

    fn output(action: Action, code: i32, report: Option<Value>) -> JobOutput {
        JobOutput {
            action,
            code: Some(code),
            stdout: String::new(),
            stderr: String::new(),
            report,
            run_path: "state-test/run".into(),
        }
    }

    #[test]
    fn failed_reverification_cannot_retain_verified_readiness() {
        let mut app = studio();
        app.model_state = Readiness::Verified;
        let _task = app.start(Action::Verify);
        assert_eq!(app.model_state, Readiness::Checking);
        let id = app.operation.active().unwrap().id;
        app.finish(id, Ok(output(Action::Verify, 1, None)));
        assert_eq!(app.model_state, Readiness::Failed);
        assert!(app.operation.is_failure());
    }

    #[test]
    fn readiness_requires_a_complete_machine_receipt() {
        let mut app = studio();
        for action in [Action::Verify, Action::Prepare, Action::VerifyProtocol] {
            let _task = app.start(action);
            let id = app.operation.active().unwrap().id;
            app.finish(id, Ok(output(action, 0, None)));
            assert!(app.operation.is_failure());
        }
        assert_eq!(app.model_state, Readiness::Failed);
        assert_eq!(app.protocol_state, Readiness::Failed);
    }

    #[test]
    fn editing_report_inputs_clears_the_previous_result() {
        for message in [
            Message::OutputPath("new-run".into()),
            Message::ProtocolPath("new-protocol".into()),
            Message::ModelPath("new-model".into()),
            Message::TokenCap("1024".into()),
            Message::InputCap("2048".into()),
            Message::TestLimit("3".into()),
            Message::CalibrationLimit("4".into()),
            Message::Preset(Preset::Full),
        ] {
            let mut app = studio();
            app.last_report = Some(LoadedReport {
                value: serde_json::json!({"status":"completed"}),
                run_path: "old-run".into(),
            });
            let _task = app.update(message);
            assert!(app.last_report.is_none());
            assert_eq!(app.status, "Ready to configure");
        }
    }

    #[test]
    fn run_admission_requires_both_inputs_and_keeps_reference_suites_blocked() {
        let mut app = studio();
        app.model_state = Readiness::Verified;
        let _task = app.start(Action::Run);
        assert!(!app.operation.is_busy());
        app.protocol_state = Readiness::Verified;
        let _task = app.start(Action::Run);
        assert!(app.operation.is_busy());
        assert_eq!(app.evidence_label(), "Running");
        let id = app.operation.active().unwrap().id;
        app.finish(id, Err(ChildFailure::Cancelled));
        let _task = app.update(Message::Preset(Preset::RefusalBench));
        let _task = app.start(Action::Run);
        assert!(!app.operation.is_busy());
        assert!(app.detail.contains("RefusalBench"));
    }

    #[test]
    fn cancellation_and_late_callbacks_do_not_turn_into_generic_failures() {
        let mut app = studio();
        let _task = app.update(Message::Cancel);
        assert_eq!(app.status, "Ready to configure");
        let _task = app.start(Action::Verify);
        let old = app.operation.active().unwrap();
        let _task = app.update(Message::Cancel);
        assert!(app.operation.is_busy());
        app.finish(old.id, Err(ChildFailure::Cancelled));
        assert_eq!(app.status, "Action cancelled");
        assert!(!app.operation.is_failure());
        assert_eq!(app.model_state, Readiness::Unchecked);
        let _task = app.start(Action::Inspect);
        let current = app.operation.active().unwrap();
        app.finish(old.id, Ok(output(Action::Verify, 0, None)));
        assert_eq!(app.operation.active(), Some(current));
    }

    #[test]
    fn closing_waits_for_the_current_child_and_rejects_new_work() {
        let mut app = studio();
        let _task = app.start(Action::Verify);
        let job = app.operation.active().unwrap();
        let _task = app.update(Message::Exit);
        assert_eq!(app.window_state, WindowState::WaitingForChild);
        assert!(app.cancellation.load(Ordering::Relaxed));
        let _task = app.update(Message::Start(Action::Inspect));
        assert_eq!(app.operation.active(), Some(job));
        let _task = app.update(Message::Finished(job.id + 1, Err(ChildFailure::Cancelled)));
        assert_eq!(app.window_state, WindowState::WaitingForChild);
        let _task = app.update(Message::Finished(job.id, Err(ChildFailure::Cancelled)));
        assert_eq!(app.window_state, WindowState::ExitRequested);
        assert!(!app.operation.is_busy());
    }

    #[test]
    fn review_is_distinct_and_inconsistent_exit_receipts_are_rejected() {
        let mut app = studio();
        let _task = app.start(Action::VerifyReport);
        let id = app.operation.active().unwrap().id;
        app.finish(
            id,
            Ok(output(
                Action::VerifyReport,
                2,
                Some(serde_json::json!({"status":"needs_review"})),
            )),
        );
        assert!(app.last_report.is_some());
        assert!(!app.operation.is_failure());
        assert!(app.status.contains("review"));
        assert_eq!(app.evidence_label(), "Review");
        let _task = app.start(Action::VerifyReport);
        let id = app.operation.active().unwrap().id;
        assert!(app.last_report.is_none());
        app.finish(
            id,
            Ok(output(
                Action::VerifyReport,
                2,
                Some(serde_json::json!({"status":"completed"})),
            )),
        );
        assert!(app.last_report.is_none());
        assert!(app.operation.is_failure());
        assert_eq!(app.evidence_label(), "No result");
    }

    #[test]
    #[ignore = "only launched by the owned-child cancellation test"]
    fn owned_child_fixture() {
        println!("OWNED_CHILD_READY");
        std::thread::sleep(Duration::from_secs(30));
    }

    #[tokio::test]
    async fn cancellation_reaps_the_owned_child_without_a_shell() {
        let mut command = tokio::process::Command::new(std::env::current_exe().unwrap());
        command
            .args(["--ignored", "owned_child_fixture", "--nocapture"])
            .kill_on_drop(true)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.as_std_mut().creation_flags(0x0800_0000);
        }
        let mut child = command.spawn().unwrap();
        let pid = child.id().unwrap();
        use tokio::io::AsyncBufReadExt;
        let mut reader = tokio::io::BufReader::new(child.stdout.take().unwrap());
        tokio::time::timeout(Duration::from_secs(5), async {
            loop {
                let mut line = String::new();
                assert!(reader.read_line(&mut line).await.unwrap() > 0);
                if line.contains("OWNED_CHILD_READY") {
                    break;
                }
            }
        })
        .await
        .unwrap();
        child.stdout = Some(reader.into_inner());
        let cancelled = Arc::new(AtomicBool::new(true));
        let result = tokio::time::timeout(Duration::from_secs(5), capture_child(child, cancelled))
            .await
            .unwrap();
        assert!(matches!(result, Err(ChildFailure::Cancelled)));
        #[cfg(target_os = "linux")]
        assert!(!Path::new(&format!("/proc/{pid}")).exists());
        #[cfg(not(target_os = "linux"))]
        let _ = pid;
    }
}
