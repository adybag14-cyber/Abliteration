use anyhow::{Context, Result, bail, ensure};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{BufReader, Read, Write};
use std::path::Path;

pub const LOCK_JSON: &str = include_str!("../../../data/models/lfm3-1.7b.json");

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePin {
    pub sha256: String,
    pub bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelLock {
    pub model_id: String,
    pub revision: String,
    pub architecture: String,
    pub model_type: String,
    pub parameters: u64,
    pub files: BTreeMap<String, FilePin>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TensorInfo {
    pub name: String,
    pub dtype: String,
    pub shape: Vec<u64>,
    pub parameters: u64,
    pub bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelVerification {
    pub model_id: String,
    pub revision: String,
    pub parameters: u64,
    pub file_sha256: BTreeMap<String, String>,
    pub tensors: Vec<TensorInfo>,
    pub python_executed: bool,
}

pub fn lock() -> Result<ModelLock> {
    Ok(serde_json::from_str(LOCK_JSON)?)
}

pub fn sha256_bytes(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

pub fn sha256_file(path: &Path) -> Result<String> {
    let mut reader = BufReader::with_capacity(4 * 1024 * 1024, File::open(path)?);
    let mut digest = Sha256::new();
    let mut buffer = vec![0_u8; 4 * 1024 * 1024];
    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        digest.update(&buffer[..read]);
    }
    Ok(hex::encode(digest.finalize()))
}

pub fn verify_files(
    directory: &Path,
    files: &BTreeMap<String, FilePin>,
) -> Result<BTreeMap<String, String>> {
    ensure!(
        !files.is_empty() && files.len() <= 128,
        "Invalid file manifest size"
    );
    let mut result = BTreeMap::new();
    let mut names = std::collections::BTreeSet::new();
    for (name, pin) in files {
        ensure!(
            !name.is_empty()
                && name.len() <= 128
                && !name.starts_with('.')
                && name
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b)),
            "Unsafe model filename"
        );
        ensure!(
            names.insert(name.to_ascii_lowercase()),
            "Filename alias on Windows"
        );
        ensure!(
            pin.bytes > 0 && pin.bytes <= 32 * 1024 * 1024 * 1024,
            "Invalid model file size"
        );
        ensure!(
            pin.sha256.len() == 64
                && pin
                    .sha256
                    .bytes()
                    .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase()),
            "Invalid file digest"
        );
        let path = directory.join(name);
        let metadata =
            fs::symlink_metadata(&path).with_context(|| format!("Missing model file {name}"))?;
        ensure!(
            metadata.file_type().is_file() && !metadata.file_type().is_symlink(),
            "Model file must be a regular file: {name}"
        );
        ensure!(metadata.len() == pin.bytes, "Wrong size: {name}");
        let digest = sha256_file(&path)?;
        ensure!(digest == pin.sha256, "SHA-256 mismatch: {name}");
        result.insert(name.clone(), digest);
    }
    Ok(result)
}

pub fn inspect_safetensors(path: &Path) -> Result<Vec<TensorInfo>> {
    let mut file = File::open(path)?;
    let file_size = file.metadata()?.len();
    let mut prefix = [0_u8; 8];
    file.read_exact(&mut prefix)?;
    let header_len = u64::from_le_bytes(prefix);
    ensure!(
        header_len <= 64 * 1024 * 1024 && header_len > 0,
        "Safetensors header is outside bounds"
    );
    ensure!(file_size >= 8 + header_len, "Truncated safetensors header");
    let mut header = vec![0; header_len as usize];
    file.read_exact(&mut header)?;
    let data: BTreeMap<String, serde_json::Value> = serde_json::from_slice(&header)?;
    ensure!(data.len() <= 100_000, "Too many tensors");
    let mut tensors = Vec::new();
    let mut ranges = Vec::new();
    for (name, tensor) in data {
        if name == "__metadata__" {
            continue;
        }
        let dtype = tensor["dtype"].as_str().context("Missing tensor dtype")?;
        let width = match dtype {
            "BOOL" | "U8" | "I8" | "F8_E4M3" | "F8_E5M2" => 1_u64,
            "BF16" | "F16" | "I16" | "U16" => 2,
            "F32" | "I32" | "U32" => 4,
            "F64" | "I64" | "U64" => 8,
            _ => bail!("Unsupported tensor dtype {dtype}"),
        };
        let shape: Vec<u64> = serde_json::from_value(tensor["shape"].clone())?;
        ensure!(shape.len() <= 16, "Tensor rank exceeds limit");
        let parameters = shape.iter().try_fold(1_u64, |n, d| {
            n.checked_mul(*d).context("Tensor shape overflow")
        })?;
        let offsets: Vec<u64> = serde_json::from_value(tensor["data_offsets"].clone())?;
        ensure!(
            offsets.len() == 2 && offsets[0] <= offsets[1],
            "Invalid tensor offsets"
        );
        let bytes = parameters
            .checked_mul(width)
            .context("Tensor byte count overflow")?;
        ensure!(
            offsets[1] - offsets[0] == bytes && offsets[1] <= file_size - 8 - header_len,
            "Tensor extent is invalid"
        );
        ranges.push((offsets[0], offsets[1]));
        tensors.push(TensorInfo {
            name,
            dtype: dtype.into(),
            shape,
            parameters,
            bytes,
        });
    }
    ranges.sort_unstable();
    let mut end = 0;
    for (start, next) in ranges {
        ensure!(start == end, "Safetensors data contains a gap or overlap");
        end = next;
    }
    ensure!(
        end == file_size - 8 - header_len,
        "Trailing safetensors data"
    );
    Ok(tensors)
}

pub fn verify_model(directory: &Path) -> Result<ModelVerification> {
    let pin = lock()?;
    let file_sha256 = verify_files(directory, &pin.files)?;
    let config: serde_json::Value =
        serde_json::from_reader(File::open(directory.join("config.json"))?)?;
    ensure!(
        config["model_type"] == pin.model_type && config["architectures"][0] == pin.architecture,
        "Wrong model architecture"
    );
    let tensors = inspect_safetensors(&directory.join("model.safetensors"))?;
    let parameters = tensors.iter().try_fold(0_u64, |total, tensor| {
        total
            .checked_add(tensor.parameters)
            .context("Parameter count overflow")
    })?;
    ensure!(
        parameters == pin.parameters,
        "Parameter count differs from lock"
    );
    Ok(ModelVerification {
        model_id: pin.model_id,
        revision: pin.revision,
        parameters,
        file_sha256,
        tensors,
        python_executed: false,
    })
}

pub async fn download_model(directory: &Path) -> Result<ModelVerification> {
    let pin = lock()?;
    fs::create_dir_all(directory)?;
    let client = reqwest::Client::builder()
        .https_only(true)
        .timeout(std::time::Duration::from_secs(900))
        .user_agent("Abliteration-Rust-Studio/0.1")
        .build()?;
    for (name, expected) in &pin.files {
        let target = directory.join(name);
        if target.exists() {
            let single = BTreeMap::from([(name.clone(), expected.clone())]);
            verify_files(directory, &single)?;
            continue;
        }
        let temporary = directory.join(format!("{name}.{}.partial", std::process::id()));
        let mut file = File::options()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        let url = format!(
            "https://huggingface.co/{}/resolve/{}/{}",
            pin.model_id, pin.revision, name
        );
        let downloaded: Result<()> = async {
            let mut response = client.get(url).send().await?.error_for_status()?;
            let mut bytes = 0_u64;
            let mut digest = Sha256::new();
            while let Some(chunk) = response.chunk().await? {
                bytes += chunk.len() as u64;
                ensure!(bytes <= expected.bytes, "Download exceeds pinned size");
                digest.update(&chunk);
                file.write_all(&chunk)?;
            }
            ensure!(
                bytes == expected.bytes && hex::encode(digest.finalize()) == expected.sha256,
                "Downloaded file differs from its pin"
            );
            file.sync_all()?;
            Ok(())
        }
        .await;
        drop(file);
        if let Err(error) = downloaded {
            let _ = fs::remove_file(&temporary);
            return Err(error.context(format!("Downloading {name}")));
        }
        // A hard link refuses to overwrite a file created by another process.
        fs::hard_link(&temporary, &target)?;
        fs::remove_file(&temporary)?;
    }
    verify_model(directory)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pinned_model_identity_and_runtime_files_are_explicit() {
        let pin = lock().unwrap();
        assert_eq!(pin.model_id, "LiquidAI/LFM3-1.7B");
        assert_eq!(pin.parameters, 1_728_801_536);
        assert_eq!(pin.files.len(), 11);
    }

    #[test]
    fn altered_files_and_path_traversal_are_rejected() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("config.json");
        fs::write(&path, b"{}").unwrap();
        let pin = FilePin {
            bytes: 2,
            sha256: sha256_bytes(b"{}"),
        };
        verify_files(
            directory.path(),
            &BTreeMap::from([("config.json".into(), pin.clone())]),
        )
        .unwrap();
        fs::write(&path, b"[]").unwrap();
        assert!(
            verify_files(
                directory.path(),
                &BTreeMap::from([("config.json".into(), pin.clone())])
            )
            .is_err()
        );
        assert!(
            verify_files(
                directory.path(),
                &BTreeMap::from([("../config.json".into(), pin)])
            )
            .is_err()
        );
    }
}
