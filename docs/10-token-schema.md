# Token schema and export contract

Canonical file: tokens/source.json. Schema version: 1. Package version: 1.0.0.

## Project source fields

| Field | Meaning |
| --- | --- |
| schemaVersion | Integer identifying this source format |
| version | Design-system release version |
| description | Human-readable scope |
| brand | Named hex sRGB primitives |
| themes.light / themes.dark | Semantic color names to hex values or $brand.name references |
| common | Nested role groups; values are CSS-ready strings or unitless numbers |
| density | Per-mode geometry in logical pixel numbers |

Only direct $brand.name references are supported. There is no recursive alias resolution, formula language, or implicit theme inheritance. Every theme supplies every semantic color role. RGB values use six-digit hex; alpha is not used for tokenized semantic surfaces.

The builder flattens common keys with hyphens and prefixes CSS variables with --tl-. For example, common.space.4 becomes --tl-space-4. Theme keys are already flat; text-primary becomes --tl-text-primary. Density values gain px in CSS; native consumers interpret logical units deliberately.

## Exports

- web/tokens.css: common roles, explicit light/dark selectors, density selectors, coarse-pointer/narrow-screen overrides.
- web/tokens.js: standalone global TL_TOKENS for the offline gallery.
- tokens/resolved.json: resolved themes plus common/density data.
- tokens/light.resolved.json and dark.resolved.json: color-only maps.
- tokens/light.tokens.json and dark.tokens.json: DTCG 2025.10 color subset with $type color, sRGB components, alpha 1, and hex.
- adapters/: generated Qt and Android starter values.
- go/tokens_generated.go and rust/src/tokens.rs: typed, immutable semantic lookup APIs and numeric logical-unit constants.
- go/fonts/ and rust/fonts/: byte-identical canonical TTFs and their OFL, with package-local code/asset licenses.
- Rust's optional `egui` and `gpui-kit` adapters both consume these same generated tokens/fonts. The empty default feature set keeps them available without GUI dependencies; do not create toolkit-specific generated palettes.

DTCG color export is an exchange convenience. The project source schema remains authoritative. No external token compiler or service is required. Native source generation uses `gofmt` and `rustfmt` from the Go/Rust toolchains; it reads `tokens/source.json` directly, reusing the existing resolution/flattening functions. The release does not claim an external schema certification.

## Change process

Edit source.json -> build_tokens.py -> build_adapters.py and build_native.py -> token/native checks -> inspect affected screens -> update approved references -> release notes.

Run `python3 scripts/build_native.py` to update both native packages. `python3 scripts/build_native.py --check` fails on source, font or license drift without writing. Native numeric values use logical pixels (rem × 16), milliseconds and unitless weights/leading; toolkit adapters document mappings that cannot be expressed as a single global style setting. Role names are semantic identifiers; do not persist enum ordinals.

Do not patch generated CSS to fix a contrast issue. Change the semantic source value and re-run checks. Add a new semantic role only when its meaning differs from existing roles. Keep application-specific geometry in application styles.

## Porting examples

| Semantic role | CSS | Native key |
| --- | --- | --- |
| surface-page | var(--tl-surface-page) | surface-page / tl_surface_page |
| text-primary | var(--tl-text-primary) | text-primary / tl_text_primary |
| action-primary-text | var(--tl-action-primary-text) | action-primary-text / tl_action_primary_text |
| focus-ring | var(--tl-focus-ring) | focus-ring / tl_focus_ring |

Native adapters must map paired roles together and respect text/layout scaling. A token converter cannot supply keyboard behavior or accessible semantics.
