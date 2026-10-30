# Run validation

Token checks use Python's standard library:

    python3 scripts/build_tokens.py
    python3 scripts/build_adapters.py
    python3 tests/check_tokens.py

Browser checks need Node.js, Playwright, and Chromium. Install them in your normal development environment, then:

    node tests/browser.cjs --capture

Optional environment variables:

- PLAYWRIGHT_MODULE: absolute path to the Playwright package directory if it is not locally installed.
- CHROMIUM_PATH: executable path to a compatible Chromium.
- AXE_MODULE: absolute package directory of axe-core; enables WCAG-tagged automated scans.

The script uses local file URLs, tests the specimen, and can refresh reference images. It does not touch a backend or hardware. Review screenshots before accepting baseline changes.

See validation/browser.json and contrast.json for actual results. Tests cover reflow, font loading, form feedback, search/sort, tabs, modal focus, cancellation, failure, lost connection, reconciliation, download size, mobile controls, and reduced motion.

Manual product checks remain: screen reader task completion, 200% text resize, 400% browser zoom, OS high contrast, native platform builds, real backend states, actual source permissions/revisions, and large-data behavior.

## React library parity

Run `npm ci`, `npm run build:showcase`, then `npm run test:library`.
Set `CHROMIUM_PATH` for a system Chromium or install Playwright's browser with
`node node_modules/playwright/cli.js install chromium`.

This suite compares the actual React showcase with the original reference, checks
interaction and reflow behavior, and runs axe. Reports and images go to the ignored
`validation/library/` directory. See [coverage and limits](../docs/12-library-verification.md).

## Native libraries

Generation requires Python 3.10+, `gofmt` and `rustfmt`:

```sh
python3 scripts/build_native.py --check
(cd go && go test ./...)
cargo test --manifest-path rust/Cargo.toml
cargo test --manifest-path rust/Cargo.toml --no-default-features
cargo test --manifest-path rust/Cargo.toml --features egui
cargo test --manifest-path rust/Cargo.toml --features gpui-kit
cargo test --manifest-path rust/Cargo.toml --features egui,gpui-kit
cargo test --manifest-path rust/Cargo.toml --all-features
cargo clippy --manifest-path rust/Cargo.toml --all-features --all-targets -- -D warnings
```

Run real toolkit rendering separately:

```sh
(cd go && go run ./cmd/render -output ../validation/native/fyne)
cargo run --manifest-path rust/Cargo.toml --example showcase --features egui-showcase -- --smoke validation/native/egui
cargo run --manifest-path rust/Cargo.toml --example gpui_showcase --features gpui-showcase -- --smoke validation/native/gpui
```

The Fyne command uses its software painter; eframe needs a working native graphics/display environment. Both capture light/dark × comfortable/compact and exercise guarded actions. Review the generated PNGs in ignored `validation/native/`. See [Go details](../docs/14-go-library.md) and [Rust display/headless setup](../docs/15-rust-library.md). These checks do not certify OS accessibility or migrate a consumer.

GPUI Kit uses a separate Vulkan rendering path. On NixOS use `nix-shell rust/shell.nix --run 'cargo test --manifest-path rust/Cargo.toml --all-features'` for its native dependencies; the shell uses the caller's Rust toolchain. Launch its desktop example with `nix-shell rust/shell.nix --run 'cargo run --manifest-path rust/Cargo.toml --example gpui_showcase --features gpui-showcase'`. A functioning Vulkan driver and display session are required for the interactive example; software Mesa rendering is acceptable for smoke checks. Token-only and core egui tests need no native dependency shell.

Verified on Linux with Rust 1.99.0: dependency-free defaults, each adapter independently, both adapters together, nine all-feature tests, warning-free Clippy, canonical generation parity, and standalone Cargo package verification. Native smoke exercised input, keyboard focus, guarded actions and retained state, producing eight GPUI Kit and four egui captures; representative light/dark, compact and touch renders were inspected. GPUI captures advance the simulated clock before painting to settle native animations. Earlier Go/Fyne verification used Go 1.26.5; this Rust feature change does not alter Go. OS assistive-technology and production consumer validation remain separate.
