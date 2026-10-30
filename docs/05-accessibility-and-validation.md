# Accessibility and validation

Target WCAG 2.2 AA for web consumers, plus platform accessibility conventions. A token set or screenshot cannot certify a product.

## Baseline

- Normal text >=4.5:1; large text >=3:1 under WCAG's size/weight definition. This system voluntarily checks all selected text roles at 4.5:1.
- Essential control/state boundaries and meaningful graphics >=3:1 against adjacent colors.
- Keyboard focus is visible, not clipped or hidden by sticky regions. Reference: 2 px ring, 3 px gap; evaluate the actual focused surface.
- Web touch target preference is 44 x 44 CSS px. Compact pointer controls may be 32 px. WCAG 2.2 AA target size is generally 24 x 24 CSS px with defined exceptions; our larger default is a design choice.
- Android interactive targets >=48 x 48 dp. Do not overlap invisible expanded hit regions.
- Do not use color alone to express status, selection, or chart meaning.
- Respect reduced motion, platform text scaling, and high-contrast/forced-color settings.

Standards sources are linked in docs/09-sources.md.

## Interaction checks

Test only with the keyboard: navigate sections, activate links/buttons, fill/submit forms, select tabs, open and dismiss overlays, and operate the main workflow. Dialog focus stays inside, Escape closes, focus returns. Modal background is inert. No positive tabindex.

Give every control a name. Connect helpers/errors to fields. Use real headings and landmarks. Use one main page heading. Decorative SVGs have aria-hidden. Live announcements report meaningful transitions, not every progress tick.

## Responsive and content checks

Test 320, 390, 768, 1024, and 1440 CSS px widths. The document must not scroll horizontally; code/table regions may scroll locally. Test 200% text resize and 400% zoom/reflow, Portuguese labels, long filenames, long UUIDs, missing images, and empty/error/loading states.

The included browser tests cover the reference, not these product checks by implication. Native testing requires real target toolkit builds and assistive technology.

## Quality gates

| Gate | Automated | Human review |
| --- | --- | --- |
| Token consistency | Same role set in themes; generated files clean | Role meaning and naming |
| Contrast | Listed foreground/background pairs | Final adjacency, images, diagrams, disabled rationale |
| Behavior | Keyboard tabs/dialogs, search, job transitions | Workflow clarity and focus visibility |
| Layout | Overflow checks and screenshots at named sizes | Readability, hierarchy, meaningful grouping |
| Typography | Bundled assets and loading | Native glyph fallback and scaling |
| Accessibility | Semantic assertions; optional axe scan | Screen-reader task completion and platform scaling |
| Safety of operations | Duplicate dispatch / cancel / reconciliation checks | Exact target and consequence clarity |

## Required release evidence

Record browser/tool versions, commands, date, passed/failed checks, screenshots, and limitations. Fix failures before calling a component ready. Do not convert “not tested” into “passed”. Regression screenshots are references, not a substitute for testing real interactions.

Before production adoption, manually run NVDA or VoiceOver on web; platform screen readers for each native implementation; OS scaling; forced colors; and actual long-running backend jobs.
