# Validation performed

Design date: 29 October 2026. Release: 1.0.0.

## Observed results

- 74 of 74 specified semantic color-pair contrast checks passed.
- 65 browser checks passed using Chromium 153.0.8010.0.
- Automated axe-core checks found no violations of the selected WCAG A/AA tags across five reference pages in light and dark themes.
- Reflow checks covered 320, 390, 768, 1024, and 1440 CSS px widths in both themes.
- Checked font loading, field errors/focus, search/no-results/sort, tab keyboard behavior, modal focus/escape/return, source drawer, job cancel/failure/disconnection/reconciliation/success, 128-byte export, narrow-screen targets, and reduced motion.
- No JavaScript exceptions or remote network requests were observed in the reference.
- Eleven reference images were generated from the working HTML and visually reviewed.
- Native library verification is recorded in [tests/README.md](../tests/README.md#native-libraries).

See contrast.json for exact pair ratios and browser.json for browser/library versions, individual checks, and screenshot metadata.

## Corrections made during validation

- Darkened the light-theme link role for selected/sunken surface contrast while preserving the Teal brand primitive.
- Strengthened control boundaries and disabled supporting text.
- Fixed a grid minimum-width issue on a 320 px screen.
- Prevented hovered primary/danger variants from overriding disabled styling.
- Widened the narrow-screen density selector and reduced the theme control's visible label at the narrowest width.

## Still required in consumers

Manual assistive-technology task completion, OS/high-contrast behavior, browser zoom and platform text scaling, real backend state/cancellation semantics, large data, source permissions/revision correctness, actual toolkit builds, and native visual comparison.

These results describe the bundled reference. They do not certify any existing product or constitute a complete accessibility audit.
