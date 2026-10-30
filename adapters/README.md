# Native starter assets

Read ../docs/06-platforms.md before integrating.

These exports supply values and a starting visual map. They are not tested native component libraries.

- Qt: light.qss / dark.qss, opt-in TLRoot descendants. Focus, sizing, fonts, palette, and complex widgets need product review.
- Android: values/colors.xml and values-night/colors.xml. Map paired roles to the app's existing View or Compose theme.

Regenerate with python3 scripts/build_adapters.py after building tokens. Do not hand-edit generated files. Each native consumer must run its own build, keyboard/screen-reader, text scaling, interaction, and screenshot tests.

Fyne is now a reusable [Go library](../docs/14-go-library.md), not a copied color-map starter. The [Rust/egui library](../docs/15-rust-library.md) is also available. Their generated tokens and bundled fonts come from `python3 scripts/build_native.py`.
