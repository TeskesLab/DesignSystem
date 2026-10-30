# Teske's Lab design system

Canonical semantic colors, density metrics and bundled IBM Plex fonts, with optional native egui and GPUI Kit adapters. Requires Rust 1.92 or newer.

## Use

After publication to crates.io:

```toml
[dependencies]
teskeslab-design-system = { version = "1.0.0", features = ["gpui-kit"] }
```

Choose `egui`, `gpui-kit`, or both. With no features, the crate is dependency-free and `no_std`, exposing only tokens and font bytes. Toolkit dependencies are optional; enabling one does not enable the other. For development before publication, replace `version` with a path to this repository's `rust` directory.

```rust
use teskeslab_design_system::{Density, Role, Scheme, color, dimensions};

let background = color(Scheme::Dark, Role::SurfacePage);
let targets = dimensions(Density::Compact, true); // Touch restores comfortable sizes.
assert_eq!(targets.control_height, 44.0);
assert_eq!(background.a, 255);
```

The adapters are `teskeslab_design_system::egui` (egui 0.33) and `teskeslab_design_system::gpui` (GPUI Kit 0.8.1). Install fonts once and apply themes when preferences change. Native controls preserve toolkit interaction; application state and jobs remain consumer-owned. GPUI Kit needs its platform build dependencies and a working graphics backend.

See the [integration guide](https://github.com/TeskesLab/DesignSystem/blob/main/docs/15-rust-library.md) for initialization, controls, density, native examples and platform requirements, and the [release guide](https://github.com/TeskesLab/DesignSystem/blob/main/docs/16-cargo-release.md) for manual bootstrap and approved tag releases.

## Licenses

- Code: Apache-2.0 (`LICENSE`).
- IBM Plex fonts: OFL-1.1 (`fonts/OFL-IBM-Plex.txt`).
- Documentation: CC-BY-SA-4.0 (`LICENSE-CC-BY-SA-4.0.txt`), attributed to Teske's Lab and this repository.

The combined package license expression describes these separate materials, not alternative licenses for the code.
