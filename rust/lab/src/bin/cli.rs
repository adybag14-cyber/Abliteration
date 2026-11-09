use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(version, about = "Native model diagnostics and reproducible research")]
struct Args {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Doctor,
    Catalog,
    VerifyModel {
        model: PathBuf,
    },
    DownloadModel {
        output: PathBuf,
    },
    InspectTensors {
        model: PathBuf,
    },
    ValidateConfig {
        config: PathBuf,
    },
    PrepareProtocol {
        output: PathBuf,
    },
    VerifyProtocol {
        protocol: PathBuf,
    },
    VerifyReport {
        #[arg(long)]
        run: PathBuf,
        #[arg(long)]
        protocol: PathBuf,
    },
    #[cfg(feature = "inference")]
    Infer {
        #[arg(long)]
        model: PathBuf,
        #[arg(long)]
        prompt: String,
        #[arg(long, default_value_t = 64)]
        max_new_tokens: usize,
        #[arg(long, default_value = "cpu", value_parser = ["cpu", "cuda"])]
        device: String,
        #[arg(long, default_value = "none", value_parser = ["none", "q8_0"])]
        quantization: String,
    },
    #[cfg(feature = "inference")]
    Run {
        #[arg(long)]
        model: PathBuf,
        #[arg(long)]
        protocol: PathBuf,
        #[arg(long)]
        output: PathBuf,
        #[arg(long)]
        config: PathBuf,
    },
}

#[tokio::main(worker_threads = 2)]
async fn main() -> Result<std::process::ExitCode> {
    let output = match Args::parse().command {
        Commands::Doctor => serde_json::json!({
            "version": abliteration_lab::VERSION,
            "build_sha": abliteration_lab::BUILD_SHA,
            "runtime": "Rust",
            "inference_built": cfg!(feature = "inference"),
            "cuda_built": cfg!(feature = "cuda"),
            "python_required": false,
            "engine_revision": abliteration_lab::ENGINE_REVISION,
            "executable_sha256": abliteration_lab::model::sha256_file(&std::env::current_exe()?)?,
            "cargo_lock_sha256": abliteration_lab::model::sha256_bytes(include_bytes!("../../../../Cargo.lock"))
        }),
        Commands::Catalog => serde_json::from_str(abliteration_lab::protocol::CATALOG)?,
        Commands::VerifyModel { model } => {
            serde_json::to_value(abliteration_lab::model::verify_model(&model)?)?
        }
        Commands::DownloadModel { output } => {
            serde_json::to_value(abliteration_lab::model::download_model(&output).await?)?
        }
        Commands::InspectTensors { model } => serde_json::to_value(
            abliteration_lab::model::inspect_safetensors(&model.join("model.safetensors"))?,
        )?,
        Commands::ValidateConfig { config } => {
            serde_json::to_value(abliteration_lab::config::RunConfig::read(&config)?)?
        }
        Commands::PrepareProtocol { output } => {
            serde_json::to_value(abliteration_lab::protocol::prepare(&output).await?)?
        }
        Commands::VerifyProtocol { protocol } => {
            let (_, pin) = abliteration_lab::protocol::read(&protocol)?;
            serde_json::to_value(pin)?
        }
        Commands::VerifyReport { run, protocol } => {
            abliteration_lab::evidence::verify(&run, &protocol)?
        }
        #[cfg(feature = "inference")]
        Commands::Infer {
            model,
            prompt,
            max_new_tokens,
            device,
            quantization,
        } => {
            anyhow::ensure!(
                !prompt.trim().is_empty() && prompt.len() <= 32768,
                "Prompt is empty or oversized"
            );
            let verification = abliteration_lab::model::verify_model(&model)?;
            let config = abliteration_lab::config::RunConfig {
                max_new_tokens,
                experimental: quantization != "none" || device == "cuda",
                device,
                quantization,
                ..Default::default()
            };
            let engine = abliteration_lab::engine::Engine::load(&model, &config).await?;
            let reply = engine.generate(&prompt, "baseline").await?;
            serde_json::json!({
                "reply":reply, "model_id":verification.model_id, "revision":verification.revision,
                "runtime":"Rust/mistral.rs", "engine_revision":abliteration_lab::ENGINE_REVISION,
                "build_sha":abliteration_lab::BUILD_SHA, "python_executed":false, "config":config
            })
        }
        #[cfg(feature = "inference")]
        Commands::Run {
            model,
            protocol,
            output,
            config,
        } => {
            let config = abliteration_lab::config::RunConfig::read(&config)?;
            abliteration_lab::evaluation::run(&model, &protocol, &output, &config).await?
        }
    };
    println!("{}", serde_json::to_string_pretty(&output)?);
    Ok(if output["status"] == "needs_review" {
        std::process::ExitCode::from(2)
    } else {
        std::process::ExitCode::SUCCESS
    })
}
