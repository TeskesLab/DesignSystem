//! Teske's Lab's canonical tokens and bundled IBM Plex fonts.
//!
//! Tokens and font bytes are dependency-free and `no_std` by default.
//! Enable `egui` or `gpui-kit` for the corresponding adapter, or both.
//! Install fonts once, then apply the adapter's theme when preferences change.
#![cfg_attr(not(any(feature = "egui", feature = "gpui-kit")), no_std)]
#![forbid(unsafe_code)]

pub mod tokens;
pub use tokens::{Density, Metrics, Rgba, Role, Scheme, color, dimensions};

/// Original licensed font bytes, also available without a GUI dependency.
pub mod fonts {
    pub static SANS_REGULAR: &[u8] = include_bytes!("../fonts/IBMPlexSans-Regular.ttf");
    pub static SANS_SEMIBOLD: &[u8] = include_bytes!("../fonts/IBMPlexSans-SemiBold.ttf");
    pub static MONO_REGULAR: &[u8] = include_bytes!("../fonts/IBMPlexMono-Regular.ttf");
    pub const LICENSE: &str = include_str!("../fonts/OFL-IBM-Plex.txt");
}

#[cfg(feature = "egui")]
pub mod egui;

#[cfg(feature = "gpui-kit")]
pub mod gpui;
