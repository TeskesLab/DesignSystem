# HTTP status pages

`examples/http-status/` contains the owner-supplied v1 design for **403, 404, 429, 500, 502 and 503**, replacing the first 404 composition. Each page pairs a status-specific circuit-board illustration with recovery text and actions. The design uses the formal Teske's Lab signature, not the jagged logo.

## Build and preview

From the repository root:

```sh
python3 examples/http-status/tools/build.py
python3 -m http.server 4175 --bind 127.0.0.1
```

Open <http://127.0.0.1:4175/examples/http-status/dist/index.html>. The gallery has a page selector, theme toggle and download link. The selector and download link do not appear in production pages.

- `src/`: editable composition CSS, theme script and status-specific copy.
- `tools/build.py`: page generator; set `HOME` here for a different public homepage. The supplied destination, `https://lab.teske.live/`, is retained.
- `vendor/`: unmodified bundled web styles, signature SVGs and IBM Plex WOFF2 fonts.
- `design-system.lock.json`: the designer's supplied source declaration (version 1.1.0, commit `8f276dd435ed01aaf6ac95fc3d0d2a1555f61eb3`). This is provenance, not a change to this repository's npm version. Bundled styles, fonts and signatures match their corresponding checkout files byte-for-byte.
- `pages/`: generated, deployable standalone HTML, included in source control.
- `dist/`: ignored generated gallery, production copies and downloadable source ZIP. Neither the input ZIP nor the generated ZIP is included in source control.

Rebuild after editing source. The builder updates both production directories. Each HTML document embeds its CSS, fonts, SVG illustration and theme script; it needs no framework, CDN or application API. The optional script uses a saved light/dark preference, otherwise the system preference. Without JavaScript the page uses light mode and hides the theme control.

## Language selection

All six pages and the review gallery support English and Brazilian Portuguese. The script uses the first supported entry in `navigator.languages`, falling back to `navigator.language` when the list is empty. Any Portuguese locale, including `pt-PT`, uses `pt-BR`; any English locale uses English. Unsupported-only preferences fall back to English. This is client-side browser preference detection, not IP geolocation or server-side `Accept-Language` negotiation.

English is the initial HTML and the fallback when JavaScript is disabled or blocked by CSP. Portuguese copy is bundled from `src/pt-BR.json`, with no translation request. Localization updates headings, descriptions, actions, illustration captions, document title/metadata, accessibility labels and `html lang`. It leaves HTTP codes, links, retry behavior and theme preferences unchanged. Edit `src/statuses.json` for English copy and `src/pt-BR.json` for Portuguese, then rebuild.


## Reverse proxy deployment

Deploy `pages/*.html` as error response bodies. Preserve the original **4xx/5xx status**, response security/cache headers and HTML content type. Do not redirect to an error document or rewrite its status to 200. Static preview responses return 200 and do not prove proxy error handling.

For Nginx, copy the production HTML to `/srv/teske-errors/` and configure the relevant server block:

```nginx
error_page 403 /_errors/403.html;
error_page 404 /_errors/404.html;
error_page 429 /_errors/429.html;
error_page 500 /_errors/500.html;
error_page 502 /_errors/502.html;
error_page 503 /_errors/503.html;

location ^~ /_errors/ {
    internal;
    alias /srv/teske-errors/;
}
```

Enable `proxy_intercept_errors on;` only for intended HTML proxy routes when replacing upstream error bodies. Do not replace API JSON errors indiscriminately. Verify the actual status, content type and headers with your deployment configuration.

If the host sends a Content Security Policy, permit `data:` fonts and the embedded stylesheet. Permit the theme script via a CSP hash if desired; blocking scripts leaves the light page usable. Inline SVGs are embedded directly. No external asset origin is required. Generate CSP hashes from the final built document, and apply the policy to error responses too.

“Try again” is an ordinary same-URL GET navigation, not an automatic reload or a repeated POST. For failed non-GET operations, use a safe return destination if retrying with GET is not meaningful. A displayed error does not prove that a mutation failed: reconcile with the backend before retrying it. Keep real `Retry-After` headers for 429/503; the pages invent no delay, repair ETA or countdown. Do not put stack traces, secrets, query strings or internal hostnames into public error bodies.

## Rights and validation

Code is Apache-2.0; lab-owned artwork and documentation are CC BY-SA 4.0; IBM Plex retains SIL OFL. The source package includes the applicable license files, also included by the gallery's generated download.

Before localization, all six generated production pages matched the supplied archive's HTML byte-for-byte. Subsequent localization adds English/pt-BR selection without changing the design or vendor files. The build updates `pages/` and includes repository licenses in the download.

Local Chromium checks covered all six pages in light/dark at 1440px, all six at 320px for horizontal overflow, and the 404 visual layout at 320px with and without JavaScript. The settled desktop themes had no axe WCAG A/AA violations; theme transitions must finish before scanning contrast. Theme persistence, visible keyboard skip navigation, gallery page selection and same-URL GET retry were exercised. No production proxy configuration, screen-reader audit or complete deployment accessibility audit was performed.

Localization checks exercised all six Portuguese pages in both themes at 320px: no horizontal overflow or axe WCAG A/AA violations were observed. Browser preference checks covered `pt-BR`, English-first ordering, unsupported languages, a supported secondary `pt-PT` preference, and an empty language list. Portuguese theme labels and same-URL retry worked; disabling JavaScript restored English.

The brand heuristic checker flags the designer's radial-gradient dot grid/mask and the preserved em-dash separators in titles and board labels. These are intentional parts of the supplied treatment, not accessibility findings; localization keeps that punctuation and visual design.
