#!/usr/bin/env python3
"""Generate six resilient error documents and a separate review gallery."""
from pathlib import Path
import base64, json, shutil, zipfile, hashlib, re
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist';DIST.mkdir(exist_ok=True)
PAGES=ROOT/'pages';PAGES.mkdir(exist_ok=True)
statuses=json.loads((ROOT/'src/statuses.json').read_text())
HOME='https://lab.teske.live/'
arrow='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>'
back='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h17"/></svg>'
download='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>'
icons={
 'route':'<path d="M4 12h5m6 0h5M9 8v8m6-8v8"/><circle cx="2" cy="12" r="1.5"/><circle cx="22" cy="12" r="1.5"/>',
 'lock':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 'pulse':'<path d="M1 14h5l3-8 5 13 3-9 2 4h4"/>',
 'fault':'<path d="m13 2-8 12h6l-1 8 9-13h-7l1-7Z"/>',
 'link':'<path d="m8 15-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m6 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0M9 12h6"/>',
 'pause':'<path d="M8 5v14m8-14v14" stroke-width="4"/>'
}
def art(s):
 code=s['code']
 pins=''.join(f'<rect x="{x}" y="{y}" width="12" height="5" rx="1" class="chip-pin"/>' for x in [127,361] for y in range(142,253,16))
 pins+=''.join(f'<rect x="{x}" y="{y}" width="5" height="12" rx="1" class="chip-pin"/>' for y in [116,269] for x in range(150,352,16))
 routes={404:'<path class="board-active" d="M61 197h35m23 0h8"/><path class="board-fault" d="m99 184 9 7-6 7 9 7"/>',403:'<path class="board-active" d="M61 197h30m20 0h16"/><path class="board-fault" d="M96 183v28m9-28v28"/>',429:'<path class="board-active" d="M61 197h12l5-10 8 20 8-20 8 20 8-10h17"/>',500:'<path class="board-active" d="M61 197h32m19 0h15"/><path class="board-fault" d="m96 188 12 18m0-18-12 18"/>',502:'<path class="board-active" d="M61 197h27m24 0h15"/><path class="board-fault" d="m89 191 7 6-7 6m22-12-7 6 7 6"/>',503:'<path class="board-active" d="M61 197h28m22 0h16"/><path class="board-fault" d="m89 197 19-18"/><circle class="board-pad" cx="90" cy="197" r="3"/>'}
 return f'''<figure class="art" aria-hidden="true"><svg viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg">
 <g transform="translate(3 7) rotate(-5 250 210)"><path class="board-back" d="M60 48h364l24 24v290l-16 16H58l-18-18V68Z"/></g>
 <g transform="rotate(-5 250 210)"><path class="board" d="M56 40h364l24 24v290l-16 16H54l-18-18V60Z"/>
 <g class="board-trace"><path d="M58 108h38l33-33h79v40M58 124h46l33-33h43v24M58 282h40l30 30h60v-31M58 298h31l31 31h85v-48M371 145h28l20-20V92M371 161h35l24-24V92M371 225h24l28 28v74M371 241h16l20 20v66M249 281v40l21 21h87M265 281v32l13 13h79M282 116v-29h92M298 116v-13h76"/>
 <circle cx="58" cy="108" r="3"/><circle cx="58" cy="124" r="3"/><circle cx="58" cy="282" r="3"/><circle cx="58" cy="298" r="3"/><circle cx="419" cy="90" r="3"/><circle cx="430" cy="90" r="3"/><circle cx="423" cy="330" r="3"/><circle cx="407" cy="330" r="3"/>
 </g>
 <path class="board-active" d="M374 195h27l20-20v-16M224 116V70h-50M222 281v60h-59"/>
 <circle class="board-pad" cx="421" cy="155" r="5"/><circle class="board-pad" cx="169" cy="70" r="5"/><circle class="board-pad" cx="158" cy="341" r="5"/>
 {routes[code]}<circle class="board-pad" cx="58" cy="197" r="5"/>
 <g class="board-label"><text x="61" y="65">T/L — RESPONSE MODULE</text><text x="62" y="350">HTTP / {code}</text><text x="366" y="350">REV. 01</text></g>
 {pins}<rect class="chip-face" x="139" y="128" width="222" height="141" rx="8"/>
 <path d="M151 144h8" stroke="#7ed6d4" stroke-width="3" stroke-linecap="round"/>
 <text class="chip-code" x="248" y="222" text-anchor="middle">{code}</text>
 <text class="chip-label" x="250" y="249" text-anchor="middle">{s['board']}</text>
 <g transform="translate(343 294)" class="chip-icon" style="stroke:var(--tl-text-link)">{icons[s['icon']]}</g>
 <g fill="none" stroke="var(--tl-control-border)" stroke-width="1"><circle cx="54" cy="58" r="4"/><path d="m52 56 4 4m-4 0 4-4"/><circle cx="426" cy="350" r="4"/><path d="m424 348 4 4m-4 0 4-4"/></g>
 </g></svg><figcaption class="art-caption">{s['board']}</figcaption></figure>'''
css=(ROOT/'vendor/web/tokens.css').read_text()+'\n'+(ROOT/'vendor/web/components.css').read_text()+'\n'+(ROOT/'src/status.css').read_text()
for f in (ROOT/'vendor/assets/fonts').glob('*.woff2'):
 css=css.replace('../assets/fonts/'+f.name,'data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode())
translations=json.loads((ROOT/'src/pt-BR.json').read_text())
script=(ROOT/'src/status.js').read_text().replace('/* LOCALIZATION */', 'const translations = '+json.dumps(translations,ensure_ascii=False)+';')
logos={}
for mode,color in [('light','ink'),('dark','paper')]:
 logo=(ROOT/f'vendor/marks/signature-{color}.svg').read_text()
 logo=re.sub(r'role="img" aria-label="[^"]+"',f'class="brand-mark brand-{mode}" aria-hidden="true"',logo)
 logos[mode]=logo

def page(s,preview=False):
 code=s['code']
 action=f'<a class="tl-button primary" href="{HOME}">{s["action"]}{arrow}</a>'
 secondary=''
 if s['retry']:
  action=f'<a class="tl-button primary" href="">{s["action"]}{arrow}</a>'
  secondary=f'<a class="tl-button quiet" href="{HOME}">Back to the lab</a>'
 elif code==429:
  secondary='<a class="tl-button quiet" href="">Try again</a>'
 tray=''
 if preview:
  links=''.join(f'<a href="{"index.html" if item["code"]==404 else "preview-"+str(item["code"])+".html"}" aria-label="{item["code"]} {item["name"]}"'+(' aria-current="page"' if item['code']==code else '')+f'>{item["code"]}</a>' for item in statuses)
  tray=f'<aside class="preview-bar" aria-label="Design preview controls"><span class="preview-label">PAGE PREVIEW</span><nav class="page-picker" aria-label="HTTP status pages">{links}</nav><a class="download" href="downloads/Teske-Lab-HTTP-Status-Pages-v1.zip" download>{download}Download pages</a></aside>'
 return f'''<!doctype html>
<html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><meta name="description" content="{code} {s['name']} — Teske’s Lab."><title>{code} · {s['name']} — Teske’s Lab</title><style>{css}</style></head>
<body class="{'preview' if preview else 'standalone'}"><a class="skip" href="#main">Skip to message</a><div class="page">
<header class="masthead"><a class="identity" href="{HOME}" aria-label="Teske’s Lab homepage"><span class="identity-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h4l3-6 4 12 3-6h4"/></svg></span>{logos['light']}{logos['dark']}</a><div class="header-right"><span class="header-label">EXPLORE / BUILD / DISCOVER</span><button class="theme-toggle" type="button" aria-label="Switch to dark theme" hidden><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></svg></button></div></header>
<main id="main" class="hero" tabindex="-1"><section class="copy" aria-labelledby="heading"><div class="status-line"><span class="status-number">HTTP {code}</span><span>{s['name']}</span></div><h1 id="heading">{s['headline']}</h1><p class="description">{s['description']}</p><div class="actions">{action}{secondary}</div></section>{art(s)}</main>
<footer class="page-footer"><span class="footer-label">Teske’s Lab</span><span class="footer-code">{code} / {s['name'].upper()}</span></footer></div>{tray}<script>{script}</script></body></html>'''
for s in statuses:
 document=page(s)
 (PAGES/f'{s["code"]}.html').write_text(document)
 (DIST/f'{s["code"]}.html').write_text(document)
 (DIST/('index.html' if s['code']==404 else f'preview-{s["code"]}.html')).write_text(page(s,True))
(DIST/'downloads').mkdir(exist_ok=True)
with zipfile.ZipFile(DIST/'downloads/Teske-Lab-HTTP-Status-Pages-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
 for s in statuses:z.write(DIST/f'{s["code"]}.html',f'pages/{s["code"]}.html')
 for p in [ROOT/'README.md',ROOT/'LICENSE',ROOT/'LICENSE-CC-BY-SA-4.0.txt',ROOT/'design-system.lock.json',ROOT/'vendor/assets/fonts/OFL-IBM-Plex.txt',ROOT/'tools/build.py',*sorted((ROOT/'src').glob('*'))]:
  if p.exists():z.write(p,str(p.relative_to(ROOT)))
 for p in (ROOT/'vendor').rglob('*'):
  if p.is_file() and p.name!='OFL-IBM-Plex.txt':z.write(p,str(p.relative_to(ROOT)))
print('Built 6 standalone pages, 6 preview pages and offline source package.')
