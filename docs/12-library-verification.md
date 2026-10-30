# React library and reference parity

## Inspect the actual library

```sh
npm ci
npm run build:showcase
npm run preview
```

Open <http://127.0.0.1:4173/examples/library/>. The showcase imports the public React entry point; it does not load `web/components.js` or `web/gallery.js`. The original designer reference remains at `/index.html#components`.

Both pages use the canonical generated tokens, the same font files, and the same component baseline CSS. The showcase reuses reference layout CSS only for specimen composition. Component additions live in `web/library.css`, not the showcase stylesheet.

Use `?theme=light&density=comfortable` or `?theme=dark&density=compact` for deterministic comparison URLs. Controls remain interactive after loading. The `#reading` page demonstrates tabs and code; `#extended` demonstrates radio groups, switches, manual tabs, nonmodal inspection, toast timing, and system theme preference. These extended controls have behavioral contracts but no designer screenshot counterpart.

## Verification

```sh
npm run build
npm run build:showcase
npm run test:library
```

The test uses Playwright's Chromium. Install its browser with `node node_modules/playwright/cli.js install chromium`, or set `CHROMIUM_PATH` to an existing compatible Chromium executable. Dependencies include Playwright, pngjs and axe-core. Builds use the public tsup API and do not depend on executable symlinks in `node_modules/.bin`.

The verified run passed **273 checks**:

- Computed styles and 72 image comparisons against the independent static reference at 390 and 1440 px, in both themes and densities. Comparisons include all five component blocks: actions, fields, feedback, disclosure/progress, and search/table. Image dimensions must match; no pixel may differ by more than 24/255 in an RGB channel. This tolerance permits minor text rasterization differences, not layout drift.
- Dialog and drawer geometry, heading and close-button styles; toast styles; reading tabs and code typography. Modal controls use comfortable density as required by the component contract, including on compact pages.
- Form error focus and correction, busy activation suppression, modal focus containment and restoration, initially open StrictMode dialogs, automatic/manual tabs, nonmodal drawer restoration, switch keyboard behavior, toast hover pause/expiry/reopen, persisted appearance/reset/system changes, and mobile navigation focus.
- Additional reflow at 320, 768 and 1024 px for all three showcase pages in both themes. Automated WCAG A/AA-tagged axe scans found no violations on those pages at 1440 px. A 200% root text-size check found no document overflow at that width.

`validation/library/` contains the generated report, paired reference/React crops, showcase images, overlay captures, and accessibility results. It is ignored by Git. Tests compare the current reference and library directly; they do not silently replace a checked-in visual baseline.

The npm tarball was also installed into a separate temporary consumer. Public ESM imports, server rendering, the CSS export and all three bundled WOFF2 font paths were exercised successfully.

## API coverage and boundaries

| Reference contract | React API |
| --- | --- |
| C01–C07 controls and fields | `Button`, `Link`, `TextField`, `Select`, `Checkbox`, `RadioGroup`, `Radio`, `Switch` |
| C08–C09 navigation | `Tabs`, `Navigation` |
| C10 table | `Table` supplies the semantic table and local scroll region; callers supply headers, stable row keys, sorting and pagination |
| C11–C15 feedback and overlays | `StatusBadge`, `Callout`, `Dialog`, modal/nonmodal `Drawer`, `Toast` |
| C16 measured progress | `Progress`; omit `value` for indeterminate progress; backend job lifecycle remains the consumer's responsibility |
| C17–C19 content | `Disclosure`, `EmptyState`, `CodeBlock` |
| Appearance | `ThemeProvider`, `useTheme` |

`Tabs` item IDs must be unique and stable. `Callout` accepts text or React content; the body spacing matches the reference paragraph. Supply decorative icons with `aria-hidden`. Set `initialFocus` for an application-specific dialog focus target. Toasts are noncritical notifications: keep results elsewhere, and use persistent feedback for errors requiring action.

This is not a claim of pixel identity for entire application pages, accessibility certification, or product adoption. C20 tooltips, native implementations, manual screen-reader tasks, real browser zoom/high-contrast testing, and real backend workflows are not validated by these checks. Native mapping files remain integration starters. No consumer application was changed.
