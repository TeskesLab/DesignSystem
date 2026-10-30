# Manual Cargo release

Publish `teskeslab-design-system` version `1.0.0` to crates.io as one crate. Consumers select the optional `egui` and `gpui-kit` features; these are not separate registry packages. The npm organization `@teskeslab` does not reserve or grant ownership of the Cargo package name.

Publication is manual. No registry credentials or automatic publishing workflow are configured by this repository. A dry run does not upload the crate or confirm name availability, ownership or authentication.

## Prepare and verify

Use a reviewed source revision and Rust 1.92 or newer. From the repository root, install the platform dependencies described in the [Rust guide](15-rust-library.md). On NixOS run the Cargo commands inside `nix-shell rust/shell.nix`. Use a local `CARGO_TARGET_DIR` if the checkout filesystem cannot support Rust metadata links.

```sh
python3 scripts/build_native.py --check
cargo fmt --manifest-path rust/Cargo.toml -- --check
cargo test --manifest-path rust/Cargo.toml --no-default-features
cargo test --manifest-path rust/Cargo.toml --features egui
cargo check --manifest-path rust/Cargo.toml --features gpui-kit
cargo check --manifest-path rust/Cargo.toml --features egui,gpui-kit
cargo test --manifest-path rust/Cargo.toml --all-features
cargo clippy --manifest-path rust/Cargo.toml --all-features --all-targets -- -D warnings
cargo doc --manifest-path rust/Cargo.toml --all-features --no-deps
cargo run --manifest-path rust/Cargo.toml --example showcase --features egui-showcase -- --smoke validation/native/egui
cargo run --manifest-path rust/Cargo.toml --example gpui_showcase --features gpui-showcase -- --smoke validation/native/gpui
cargo package --manifest-path rust/Cargo.toml --list
cargo publish --manifest-path rust/Cargo.toml --registry crates-io --locked --dry-run
cargo publish --manifest-path rust/Cargo.toml --registry crates-io --locked --all-features --dry-run
```

The egui smoke needs a display; GPUI offscreen smoke needs a working Vulkan renderer. Inspect the PNGs and retain the verification limits in the integration guide. Dry runs verify the packaged crate, not just the checkout. During local preparation only, add `--allow-dirty` to packaging/dry-run commands; do not use it for the approved release.

The package allowlist includes Rust sources, tests, examples, the Nix shell, manifest/lockfile, package README, bundled fonts and all applicable license texts. It excludes build output and validation captures. Cargo also supplies normalized metadata and, for committed sources, source revision metadata. Inspect the `.crate` archive in `${CARGO_TARGET_DIR:-rust/target}/package/`; verify a clean consumer against its extracted contents with no features, either toolkit alone, and both together. Consumers need neither the repository's token generators nor its web/Go sources.

Record the source commit, version, checks and archive checksum. Commit reviewed source changes before the final dry runs. Cargo publish repackages the source; do not modify source or dependencies between final verification and publication. Update the package and lockfile versions together for later releases, following [versioning rules](07-governance.md).

## Publish only when approved

Confirm availability or ownership of the exact name on [crates.io](https://crates.io/crates/teskeslab-design-system). Authenticate through Cargo's supported credential mechanism using an authorized account; never place a token in source, documentation, shell arguments or CI configuration here.

Preparation of version `1.0.0` was verified on Linux with Rust 1.99.0: default and all-feature publication dry runs passed with `--allow-dirty`, API documentation built with warnings denied, and an isolated consumer ran against the extracted package with no features, egui only, GPUI Kit only, and both. Canonical token/font parity also passed. This verifies the prepared artifact, not registry ownership or a clean release revision; repeat the final checks after review and commit.

After explicit publication approval, from the verified clean revision:

```sh
cargo publish --manifest-path rust/Cargo.toml --registry crates-io --locked --all-features
```

Feature flags control verification, not which source files are uploaded or the defaults consumers receive. The default remains dependency-free tokens/fonts. All adapters ship in the same archive.

After the registry indexes the release, install the exact published version in a separate consumer and repeat its feature checks. Published versions cannot be overwritten; corrections require a new version. Commit, tag, push and registry publication are separate operations and require their own authorization.

Official references: [publishing](https://doc.rust-lang.org/cargo/reference/publishing.html), [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html), and [package metadata](https://doc.rust-lang.org/cargo/reference/manifest.html#the-package-section).
