# Cargo releases

Publish `teskeslab-design-system` to crates.io as one crate. Consumers select the optional `egui` and `gpui-kit` features; these are not separate registry packages. The npm organization `@teskeslab` does not reserve or grant ownership of the Cargo package name.

Bootstrap the initial `1.0.0` publication manually, then use the tag-triggered GitHub workflow `.github/workflows/publish-cargo.yml` for later versions. The first crates.io publication **requires an API token**; trusted publishing cannot create the initial crate. A dry run does not upload the crate or confirm name availability, ownership or authentication. These instructions do not assert that a registry artifact exists or that cloud execution has succeeded.

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

## Bootstrap: manual first publication

Confirm availability or ownership of the exact name on [crates.io](https://crates.io/crates/teskeslab-design-system). If `1.0.0` is already published, do not publish it again: configure trust and bump the version before the first automated release.

For the initial publication, create an appropriately scoped crates.io API token with an authorized account and authenticate locally through Cargo's supported credential mechanism, such as interactive `cargo login`. Never place the token in source, documentation, shell arguments or CI configuration. Prefer a secure OS credential provider; the default `cargo:token` provider stores credentials in plaintext. Revoke the bootstrap token after it is no longer needed.

Preparation of version `1.0.0` was verified on Linux with Rust 1.99.0: default and all-feature publication dry runs passed with `--allow-dirty`, API documentation built with warnings denied, and an isolated consumer ran against the extracted package with no features, egui only, GPUI Kit only, and both. Canonical token/font parity also passed. This verifies the prepared artifact, not registry ownership or a clean release revision; repeat the final checks after review and commit.

After explicit publication approval, from the verified clean revision:

```sh
cargo publish --manifest-path rust/Cargo.toml --registry crates-io --locked
```

Feature flags control verification, not which source files are uploaded or the defaults consumers receive. The default remains dependency-free tokens/fonts. All adapters ship in the same archive.

After the registry indexes the release, install the exact published version in a separate consumer and repeat its feature checks. Published versions cannot be overwritten or reused, including after yanking. Commit, tag, push and registry publication are separate operations and require their own authorization.

## Configure trusted publishing

After the manual first publication establishes the crate and ownership, configure
a GitHub Actions trusted publisher in the crate's crates.io settings:

| Setting | Value |
| --- | --- |
| Repository owner | `TeskesLab` |
| Repository name | `DesignSystem` |
| Workflow filename | `publish-cargo.yml` (filename only) |
| Environment | `release` |

The shared GitHub environment `release` must require release approval and permit
the **tag** patterns `rust/v*` and `npm/v*`. A `main`-only deployment branch rule
does not allow tag-triggered publishing. Confirm those policies on the existing
environment before creating a release tag. The publishing job alone receives
`id-token: write`; the crates.io authentication action exchanges OIDC for a
short-lived publishing token. Do not configure a long-lived Cargo registry token
as a CI secret.

## Subsequent releases through Gitea

Gitea is the source of truth and mirrors branches and tags to
[GitHub `TeskesLab/DesignSystem`](https://github.com/TeskesLab/DesignSystem).
Do not push directly to GitHub.

1. Update `rust/Cargo.toml`, its lockfile package version, and the changelog to a
   new, unpublished version. An already manually published `1.0.0` cannot be the
   first automated publication: bump the version first.
2. Review and commit the release changes and workflow, push the branch to Gitea,
   and wait for synchronization to GitHub. Registry trust and `release` tag
   policies must be ready before tagging.
3. The maintainer creates a signed, immutable `rust/v<version>` tag on the reviewed
   release commit and pushes the tag to Gitea for mirroring. The suffix must
   exactly equal `rust/Cargo.toml`'s package version. The workflow also requires
   that the tagged commit belongs to the mirrored `main` history. Do not move or
   reuse the tag.
4. `publish-cargo.yml` runs its read-only checks on GitHub-hosted Ubuntu with Nix
   and `rust/shell.nix`. It checks the independent and combined adapters, runs
   all-feature tests, Clippy, Rust documentation, packaging and publication dry
   runs. GPU/display screenshot smoke checks remain local checks, not CI claims.
5. Inspect the successful checks and exact tagged revision before approving the
   pending `release` environment deployment. Tests precede approval; approval
   authorizes publication and does not replace test review.
6. The publishing job checks out the exact tagged SHA, performs a default-feature
   publication dry run, authenticates via OIDC, and runs `cargo publish` with
   default features. All optional adapter sources still ship in that one crate;
   feature flags change verification, not the uploaded source selection.
7. Inspect the indexed version and repeat clean-consumer feature checks. Existing
   versions cause publication to fail; the workflow does not silently skip them.
   Fix source or version mistakes in a new reviewed commit and new version/tag,
   not by rewriting a release tag.

These workflows do not configure registry trust, create tags, or grant publication
approval by themselves.

Official references: [publishing](https://doc.rust-lang.org/cargo/reference/publishing.html), [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html), [registry authentication](https://doc.rust-lang.org/cargo/reference/registry-authentication.html), and [crates.io trusted publishing](https://crates.io/docs/trusted-publishing).
