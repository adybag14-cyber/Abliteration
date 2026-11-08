# Python reference for the native LFM3 workflow

The active LFM3 runtime, evaluation tools and desktop interface are Rust. Python is retained here as a historical explanation of the earlier experiment, not as a dependency or alternate executable backend for the native toolkit.

The frozen reference is commit [88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd](https://github.com/adybag14-cyber/Abliteration/tree/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd). Its code remains inspectable in Git history:

| Earlier reference | Native implementation | What the correspondence means |
| --- | --- | --- |
| [Model file checks](https://github.com/adybag14-cyber/Abliteration/blob/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd/scripts/model_lock.py) | [Rust model module](../rust/lab/src/model.rs) | Verify exact bytes, tensor extents and model identity before loading. |
| [Dataset preparation](https://github.com/adybag14-cyber/Abliteration/blob/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd/scripts/prepare-lfm3-evaluation.py) | [Rust protocol module](../rust/lab/src/protocol.rs) | Pin source revisions and hashes, select benign rows, and separate calibration from held-out data. |
| [Transformers generation](https://github.com/adybag14-cyber/Abliteration/blob/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd/scripts/run-lfm3-evaluation.py) | [Rust inference module](../rust/lab/src/engine.rs) | Native mistral.rs loads LFM3 and applies the chat template without executing the model repository's Python files. |
| [Screening and selection](https://github.com/adybag14-cyber/Abliteration/blob/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd/scripts/lfm3_evaluation.py) | [Rust metrics module](../rust/lab/src/metrics.rs) | Lexical markers are screening signals; invalid/censored cases cannot become zero-refusal successes. |
| [Aggregate export verification](https://github.com/adybag14-cyber/Abliteration/blob/88ece033d0fd3d3ca2dcaf02671db4f2dfedddcd/scripts/export-lfm3-report.py) | [Rust evidence verifier](../rust/lab/src/evidence.rs) | Recompute evidence and reject incomplete coverage, changed records or test-driven profile selection. |

These are methodological correspondences, not a claim of numerically identical outputs. Runtime kernels, precision, batching and decoding settings differ. The Rust protocol uses its own frozen serialization hash and records its native configuration.

The earlier full Python attempt was stopped when the project switched to Rust. Its partial responses are not a completed benchmark and are not presented as Rust results. Historical MiniCPM and C++ chapters remain available as separate references; their model-specific interventions are not an LFM3 implementation.

Continue with the [native Rust tutorial](lfm3-reproducible-evaluation.md).
