# Teske's Lab HTTP status pages

Standalone pages for 403, 404, 429, 500, 502 and 503, with circuit-board illustrations and light/dark themes. Imported from the owner-supplied v1 design package; visual output is preserved.

Build with Python 3, from this directory:

```sh
python3 tools/build.py
python3 -m http.server 4175 --bind 127.0.0.1
```

Open `/dist/index.html` for the review gallery. Deploy `pages/*.html`, not the gallery. Each page embeds its styles, fonts, illustration and optional theme script. Without JavaScript, it remains a usable light page.

Browser language preferences select English or Brazilian Portuguese automatically. Other languages and JavaScript-disabled browsers fall back to English. Edit `src/statuses.json` (English) or `src/pt-BR.json` (Portuguese), then rebuild.

Set `HOME` in `tools/build.py` before deployment; it currently points to `https://lab.teske.live/`. The build updates `pages/` and generates an ignored `dist/` gallery and downloadable source bundle.

See the [integration guide](https://github.com/TeskesLab/DesignSystem/blob/main/docs/17-http-status-pages.md) for status preservation, retries, CSP and validation limits. `design-system.lock.json` records the supplied package's source; `vendor/` is unmodified.

Code: Apache-2.0 (`LICENSE`). Lab-owned artwork and documentation: CC BY-SA 4.0 (`LICENSE-CC-BY-SA-4.0.txt`). IBM Plex fonts: SIL OFL (`vendor/assets/fonts/OFL-IBM-Plex.txt`). Retain these licenses when distributing pages or the source bundle.
