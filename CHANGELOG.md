# Changelog

## Unreleased

- Add the supplied six-page HTTP status design (403, 404, 429, 500, 502 and 503), with circuit-board illustrations, light/dark themes, standalone documents and a separate review gallery. See [HTTP status pages](docs/17-http-status-pages.md).
- Detect browser language preferences for English or Brazilian Portuguese across all status pages, with localized accessibility labels and an English no-JavaScript fallback.

## npm 1.0.2 - 2026-10-30

- Fix local tarball resolution in the npm publishing job: use an explicit `./` prefix instead of GitHub repository shorthand.
- npm `1.0.1` failed before registry authentication or publication. Its signed tag is retained; Cargo remains on its independent `1.0.1` release.

## 1.0.1 - 2026-10-30

- Release-pipeline verification patch for npm and Cargo; no component, token, or native API changes.
- Use the signed `npm/v1.0.1` and `rust/v1.0.1` tags for the first environment-approved OIDC publications.
- Establish the unchanged Go module's initial `go/v1.0.0` release tag.

## Package releases 1.0.0 - 2026-10-30

- Added a React web package for shared controls, navigation, overlays, and feedback.
- Documented library-first adoption before consumer migration.
- Added a live React showcase and automated visual comparisons with the designer reference.
- Matched callout spacing and overlay controls; fixed modal focus cycling, StrictMode setup, and toast timeout resets.
- Added reference disclosure, table, progress, empty-state and code primitives.
- Prepared `@teskeslab/design-system` for manual public npm releases, with registry metadata, bundled documentation, and release checks.
- Added reusable Go/Fyne 2.8.2 and Rust/egui 0.33 libraries with canonical tokens, bundled fonts, themes, density/touch support, guarded native actions and paired status helpers.
- Replaced the Fyne color-map starter with the Go module; added deterministic native generation and drift checks.
- Added native showcases, light/dark × comfortable/compact captures, keyboard/state regression coverage and separated action focus rings.
- Added optional GPUI Kit 0.8.1 alongside egui, sharing canonical generated tokens/fonts. Rust defaults now expose only dependency-free `no_std` tokens/fonts; select additive `egui` and/or `gpui-kit` features.
- Renamed Rust's public `native` module to `egui` without a compatibility alias and its eframe feature to `egui-showcase`; added the `gpui` adapter and `gpui-showcase` example feature. Raised the crate's Rust minimum to 1.92 for GPUI Kit's Linux dependency graph.
- Added GPUI Kit native input/focus regression coverage, eight offscreen rendering variants and a shared Nix development shell; verified egui rendering with both adapters enabled.
- Prepared the Rust crate for manual crates.io releases with registry restrictions, package-local usage documentation, explicit packaged files and a dry-run release procedure.
- Set public npm/Cargo source links and the Go module/import path to `github.com/TeskesLab/DesignSystem`.
- Removed designer handoff archives, ticket drafts, duplicate guide exports, stale handoff metadata and their obsolete packaging scripts; kept maintained libraries, documentation and visual references.
- Added separate npm (`npm/v*`) and Cargo (`rust/v*`) GitHub release workflows with manifest/tag equality guards, pre-approval checks, and `release`-gated OIDC publishing; documented manual first-publication bootstrap, exact registry trust settings, and Gitea-to-GitHub tag mirroring.

## Design reference 1.0.0 - 2026-10-29

- Consolidated the Teske's Lab identity and Librarian UI foundations.
- Added 42 semantic color roles in light/dark, density, typography, spacing, motion, and focus roles.
- Added offline component and two-layout reference with synthetic data.
- Added native mapping contracts and generated starter assets.
- Added keyboard/state checks, contrast reports, adoption tickets, and release rules.

This is the first shared-system release. Native adapter integration and production consumer validation remain work for their repositories.
