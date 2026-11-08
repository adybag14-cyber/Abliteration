use abliteration_lab::{
    BUILD_SHA, VERSION,
    config::{REFUSALBENCH_RISKS, RunConfig},
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Action {
    Verify,
    Download,
    Inspect,
    Prepare,
    Run,
    VerifyReport,
}

#[derive(Debug, Clone)]
struct JobOutput {
    action: Action,
    code: Option<i32>,
    stdout: String,
    stderr: String,
    report: Option<Value>,
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
    Finished(Result<JobOutput, String>),
    Cancel,
    SaveConfig,
    CopyConfig,
    Exit,
}

struct Studio {
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
    busy: bool,
    model_verified: bool,
    protocol_prepared: bool,
    status: String,
    detail: String,
    error: bool,
    log: String,
    last_report: Option<Value>,
    cancellation: Arc<AtomicBool>,
    quit_after_seconds: Option<u64>,
}

impl Studio {
    fn new(args: Args) -> Self {
        let workspace = args.workspace.unwrap_or_else(default_workspace);
        Self {
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
            busy: false,
            model_verified: false,
            protocol_prepared: false,
            status: "Ready to configure".into(),
            detail: "Verify the checkpoint, prepare the benign cohorts, then run a new experiment."
                .into(),
            error: false,
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
        self.error = true;
        self.status = "Action needs attention".into();
        self.detail = message.clone();
        self.log = message;
    }

    fn start(&mut self, action: Action) -> Task<Message> {
        if self.busy {
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
        self.busy = true;
        self.error = false;
        self.status = match action {
            Action::Verify => "Verifying checkpoint bytes",
            Action::Download => "Downloading the pinned checkpoint",
            Action::Inspect => "Inspecting tensor metadata",
            Action::Prepare => "Preparing the frozen benign cohorts",
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
            Message::Finished,
        )
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        if self.busy
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
                self.model_verified = false;
            }
            Message::ProtocolPath(value) => {
                self.protocol_path = value;
                self.protocol_prepared = false;
            }
            Message::OutputPath(value) => self.output_path = value,
            Message::TokenCap(value) => self.token_cap = value,
            Message::InputCap(value) => self.input_cap = value,
            Message::TestLimit(value) => self.test_limit = value,
            Message::CalibrationLimit(value) => self.calibration_limit = value,
            Message::Preset(preset) => {
                if !self.busy {
                    self.preset = preset;
                    if let Ok(config) = toml::from_str::<RunConfig>(preset.source()) {
                        self.token_cap = config.max_new_tokens.to_string();
                        self.input_cap = config.max_input_tokens.to_string();
                        self.test_limit = config.test_limit_per_dataset.to_string();
                        self.calibration_limit = config.calibration_limit.to_string();
                    }
                }
            }
            Message::Start(action) => return self.start(action),
            Message::Cancel => {
                self.cancellation.store(true, Ordering::Relaxed);
                self.status = "Cancelling the owned run".into();
                self.detail =
                    "Partial records are retained and cannot be reported as a completed benchmark."
                        .into();
            }
            Message::Finished(result) => {
                self.busy = false;
                match result {
                    Err(error) => self.fail(error),
                    Ok(output) => {
                        self.log =
                            tail_text(&format!("{}\n{}", output.stdout, output.stderr), 16_000);
                        let valid_run = output.report.as_ref().is_some_and(|r| {
                            matches!(r["status"].as_str(), Some("completed" | "needs_review"))
                        });
                        let needs_review =
                            matches!(output.action, Action::Run | Action::VerifyReport)
                                && output.code == Some(2)
                                && valid_run;
                        self.error = (output.code != Some(0) && !needs_review)
                            || (matches!(output.action, Action::Run | Action::VerifyReport)
                                && !valid_run);
                        if self.error {
                            self.status = "Command did not complete".into();
                            self.detail = if output.stderr.trim().is_empty() {
                                "No valid native completion report was produced. See Session activity.".into()
                            } else {
                                tail_text(&output.stderr, 900)
                            };
                        } else {
                            self.status = match output.action {
                                Action::Verify | Action::Download => "Checkpoint verified",
                                Action::Inspect => "Tensor inventory read",
                                Action::Prepare => "Benign protocol prepared",
                                Action::Run if output.code == Some(2) => {
                                    "Run finished · review censored output"
                                }
                                Action::Run => "Run finished",
                                Action::VerifyReport => "Report integrity verified",
                            }
                            .into();
                            self.detail =
                                "The full command receipt is available under Session activity."
                                    .into();
                            if matches!(output.action, Action::Verify | Action::Download) {
                                match serde_json::from_str::<
                                    abliteration_lab::model::ModelVerification,
                                >(&output.stdout)
                                {
                                    Ok(proof)
                                        if proof.parameters == 1_728_801_536
                                            && proof.file_sha256.len() == 11
                                            && !proof.python_executed =>
                                    {
                                        self.model_verified = true;
                                        self.detail = format!(
                                            "{} files and {} tensors verified against the pinned model.",
                                            proof.file_sha256.len(),
                                            proof.tensors.len()
                                        );
                                    }
                                    _ => self.fail(
                                        "The verifier did not return complete native evidence."
                                            .into(),
                                    ),
                                }
                            }
                            if output.action == Action::Prepare {
                                self.protocol_prepared = true;
                            }
                            if let Some(report) = output.report {
                                self.last_report = Some(report);
                                self.page = Page::Results;
                            }
                        }
                    }
                }
            }
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
                        self.error = false;
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
                self.cancellation.store(true, Ordering::Relaxed);
                return iced::exit();
            }
        }
        Task::none()
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

    fn subscription(&self) -> Subscription<Message> {
        match self.quit_after_seconds {
            Some(seconds) => {
                iced::time::every(Duration::from_secs(seconds.clamp(2, 60))).map(|_| Message::Exit)
            }
            None => Subscription::none(),
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
                InputProps::new().custom_height(38.0).disabled(self.busy),
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
                    self.badge(if self.model_verified {
                        "Verified"
                    } else {
                        "Not verified"
                    })
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
                        self.busy
                    ),
                    self.button(
                        "Download model",
                        Message::Start(Action::Download),
                        ButtonVariant::Outline,
                        self.busy
                    ),
                    self.button(
                        "Inspect",
                        Message::Start(Action::Inspect),
                        ButtonVariant::Ghost,
                        self.busy
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
                self.field("Prepared protocol folder", &self.protocol_path, "A new folder for frozen benign cohorts", Message::ProtocolPath),
                row![
                    self.button(if self.protocol_prepared { "Protocol prepared" } else { "Prepare benign cohorts" }, Message::Start(Action::Prepare), ButtonVariant::Outline, self.busy || self.protocol_prepared),
                    text("250 XSTest safe + 100 JBB benign").size(12).color(self.theme.palette.muted_foreground)
                ].spacing(12).align_y(Vertical::Center),
                self.field("New run folder", &self.output_path, "Existing results are never overwritten", Message::OutputPath),
                row![
                    self.button("Run evaluation", Message::Start(Action::Run), ButtonVariant::Default, self.busy || !self.model_verified || self.preset == Preset::RefusalBench),
                    self.button("Export config", Message::SaveConfig, ButtonVariant::Outline, self.busy),
                    self.button("Cancel owned run", Message::Cancel, ButtonVariant::Ghost, !self.busy)
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
                row![text("Reproducible configuration").size(18), Space::new().width(Length::Fill), self.button("Copy TOML", Message::CopyConfig, ButtonVariant::Outline, false)].align_y(Vertical::Center),
                text(body).font(Font::MONOSPACE).size(12),
                self.button("Export configuration file", Message::SaveConfig, ButtonVariant::Default, self.busy),
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
                self.button("Verify and load report", Message::Start(Action::VerifyReport), ButtonVariant::Outline, self.busy),
                text("Verifies coverage, hashes and marker calculations. This does not rerun the model or perform semantic judging.").size(12).color(self.theme.palette.muted_foreground),
            ].spacing(12))
        ].spacing(16);
        if let Some(report) = &self.last_report {
            let mut table = column![
                text("Observed marker screens").size(18),
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
        let status_color = if self.error {
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
            self.stat(
                "Evaluation",
                if self.last_report.is_some() {
                    "Recorded"
                } else {
                    "Not run"
                },
                "No default-zero scores"
            ),
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
) -> Result<JobOutput, String> {
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
    let child = command.spawn().map_err(|e| e.to_string())?;
    let wait = child.wait_with_output();
    tokio::pin!(wait);
    let result = tokio::select! {
        result = &mut wait => result.map_err(|e| e.to_string())?,
        _ = async { while !cancel.load(Ordering::Relaxed) { tokio::time::sleep(Duration::from_millis(100)).await; } } => {
            return Err("Owned process cancelled. Partial evidence is retained; it is not a completed benchmark.".into());
        }
    };
    let report_path = Path::new(&output).join("report.json");
    let report = if matches!(action, Action::Run | Action::VerifyReport)
        && tokio::fs::metadata(&report_path)
            .await
            .is_ok_and(|m| m.len() <= 2 * 1024 * 1024)
    {
        tokio::fs::read_to_string(report_path)
            .await
            .ok()
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
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
        ..Default::default()
    })
    .theme(Studio::native_theme)
    .subscription(Studio::subscription)
    .run()
}
