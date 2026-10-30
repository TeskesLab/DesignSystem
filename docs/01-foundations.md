# Foundations

Version 1.0.0, 29 October 2026. Scope: Teske's Lab interfaces. TVS and project brands may adopt the behavior contracts later with separately reviewed themes; they are not automatically recolored.

## Principles

1. **Content leads.** Use titles, hierarchy, spacing, and a useful summary before adding containers. Diagnostics belong beside the task they explain.
2. **State is explicit.** Name the state and the next available action. Color, a spinner, or an icon alone is insufficient.
3. **Precision stays human.** Keep units, identifiers, code, provenance, and raw data available. Put useful meaning before the internal identifier.
4. **Consistency follows behavior.** Destructive actions and source drawers should feel familiar. Wikis and hex workspaces need different layouts.
5. **Progressive disclosure preserves depth.** Show the task first; make technical details discoverable in one predictable place.

## Brand and semantic colors

Preserved primitives: Ink #101F25, Paper #F3F0E6, Teal #00767D, Signal #7ED6D4, Coral #E16A5B, Panel #17333C.

Applications consume semantic names: surface-page, text-primary, action-primary-bg, status-warning-text. Exact values live in tokens/source.json; resolved exports contain full mappings. Names are public API.

- Light uses Paper, an almost-white raised surface, and Teal actions.
- Dark uses Ink, Panel raised surfaces, and Signal actions.
- Navigation has its own dark-surface roles in both themes. Use nav-focus inside it.
- Coral is editorial. Danger has independently tested foreground/background pairs.
- border-subtle separates known regions; control-border identifies required control boundaries.
- Selection includes a visible active indicator or label in addition to fill.
- Use each status foreground with its matching background, within the same theme.
- Do not invert images or uniformly lighten colors to create dark mode.
- chart-a/b/c are starting series colors. Use labels, shapes/dashes, a data table, and verify adjacency.

Checked pairs are in validation/contrast.json. Final screen composition still needs review.

## Typography

| Role | Face / weight | Desktop size / leading | Narrow screens |
| --- | --- | --- | --- |
| Landing display | Plex Sans 600 | 56-64 px / 1.05-1.15 | 40-44 px |
| Page title | Plex Sans 600 | 40 px / 1.15 | 32-34 px |
| Section | Plex Sans 600 | 26 px / 1.3 | 24 px |
| Subheading | Plex Sans 600 | 18 px / 1.4 | 18 px |
| Article | Plex Sans 400 | 17 px / 1.75 | 16 px / 1.75 |
| General body | Plex Sans 400 | 16 px / 1.5 | 16 px |
| Controls / dense tables | Plex Sans 400/600 | 14 px / 1.5 | 14 px; fields 16 px |
| Metadata | Plex Sans 400 | 13 px / 1.5 | 13 px |
| Section labels | Plex Sans 600 | 12 px / 1.5 | 12 px |
| Code / data | Plex Mono 400 | 13-14 px / 1.6-1.9 | 13 px, local scrolling |

Only Sans 400/600 and Mono 400 are bundled. Disable font synthesis. Use weight, structure, and labels for emphasis; do not fake italics or mono bold. Body tracking stays normal; title tracking stays within -.025em. Specimens may exaggerate display scale, never product control text.

Use tabular numerals for changing values and right-align comparable numeric columns. Keep units visible. Localize dates and numbers; preserve exact hexadecimal addresses and IDs. Test Portuguese accents and technical symbols against the shipped fonts. Missing scientific glyphs need a tested fallback.

## Geometry and density

Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96 px. Prefer 8/16 within components, 24/32 between groups, 40/48 between sections.

| Measure | Comfortable | Compact |
| --- | --- | --- |
| Web control minimum height | 44 px | 32 px |
| Row minimum height | 48 px | 36 px |
| Control horizontal padding | 16 px | 12 px |
| UI text | 14 px | 14 px |
| Prose | Unchanged | Unchanged |

Compact is for pointer/keyboard work. Coarse pointers and widths <=760 px restore comfortable targets. Test hybrid-device touch; honor larger-control preferences. Android retains >=48 dp hit regions. Web 44 px is our touch target choice, not the WCAG AA minimum.

Radii: controls 4 px, panels 6 px. Pills are exceptional compact labels, not every surface's default. Group with thin rules and whitespace. Reserve elevation for layer changes.

Reference layouts: 224 px rail, up to 740 px reading width, up to 1600 px workspace. These are pattern values. Native panes resize within meaningful minimums; web layouts follow available content width.

## Icons and character

Use one outline family per product, 18-20 px, roughly 1.5-2 px stroke. Included SVG symbols are reference icons using currentColor. Hide decorative icons from assistive technology. Name icon-only actions and provide discoverable tooltips. Critical status pairs icons with text.

Keep existing signature artwork intact. MisterMal may appear in onboarding, empty states, attribution, and editorial content. Character dialogue never replaces errors, status, or confirmation. Avoid a mascot in every panel. This release creates no character masters and changes no jagged logo.

## Motion

120 ms control feedback; 180 ms small transitions; 240 ms starting upper value for reveals. Motion must aid orientation. Reduced-motion mode removes movement while retaining status text. Never rely on shimmering, animated values, or cosmetic delays to explain work.
