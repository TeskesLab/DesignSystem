# Sources and evidence

Reviewed 29 October 2026. Standards links explain baseline requirements; design decisions and product patterns in this package are proposals authored for Teske's Lab.

## Existing work

- Teske's Lab Identity v0.3(1), Library ID libfile_0030fc813c6c8191815bb9725eee8ca8. Read local README and brand.css from the supplied archive. Reused original font and signature assets unchanged.
- Librarian wiki redesign v1, Library ID libfile_c9ba01f7d1f88191a778b8c8a74fbc92. Read design-system, audit, and token files. Used as a reading-pattern starting point.
- TVS, LabFI, SuperMagic, and OpenRT809H appear as potential consumers from conversation context. Their current code and full prior design packages were not audited for this release.

## Primary technical references

- [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Qt 6.8 style sheet reference](https://doc.qt.io/qt-6.8/stylesheet-reference.html)
- [Fyne custom themes](https://docs.fyne.io/extend/custom-theme/)
- [Android Compose accessibility defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)

The canonical source.json uses a documented project schema. Generated light.tokens.json and dark.tokens.json export the DTCG color subset with sRGB components and explicit alpha. This does not claim certification by an external DTCG validator, and does not encode a DTCG theme resolver or all layout tokens.
