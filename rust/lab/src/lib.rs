//! Native research contracts. Python reference code is never invoked.

pub mod config;
#[cfg(feature = "inference")]
pub mod engine;
#[cfg(feature = "inference")]
pub mod evaluation;
pub mod evidence;
pub mod metrics;
pub mod model;
pub mod protocol;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const ENGINE_REVISION: &str = "addea2961deaafe59ab3d8894303a9ff2eca1204";
pub const BUILD_SHA: &str = match option_env!("ABLITERATION_BUILD_SHA") {
    Some(value) => value,
    None => "development",
};
