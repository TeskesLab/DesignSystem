#!/usr/bin/env python3
"""Build all token exports from source.json. Python 3.10+, standard library only."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tokens/source.json'

def resolve(value, source):
    if isinstance(value, str) and value.startswith('$brand.'):
        return source['brand'][value.split('.')[1]]
    return value

def flatten(obj, prefix=''):
    result = {}
    for key, value in obj.items():
        name = f'{prefix}-{key}' if prefix else key
        if isinstance(value, dict):
            result.update(flatten(value, name))
        else:
            result[name] = value
    return result

def dtcg_color(value):
    return {'$type': 'color', '$value': {'colorSpace': 'srgb', 'components': [int(value[i:i+2],16)/255 for i in (1,3,5)], 'alpha': 1, 'hex': value}}

def build():
    source = json.loads(SOURCE.read_text())
    resolved = {}
    common = flatten(source['common'])
    css = ['/* GENERATED. Edit tokens/source.json; run python3 scripts/build_tokens.py. */', ':root {']
    for key, value in common.items():
        css.append(f'  --tl-{key}: {value};')
    css.append('}')
    for mode, values in source['themes'].items():
        colors = {key: resolve(value, source) for key, value in values.items()}
        resolved[mode] = colors
        selector = ':root, [data-theme="light"]' if mode == 'light' else '[data-theme="dark"]'
        css.append(selector+' {')
        css.append(f'  color-scheme: {mode};')
        css.extend(f'  --tl-{key}: {value};' for key, value in colors.items())
        css.append('}')
        (ROOT/f'tokens/{mode}.resolved.json').write_text(json.dumps(colors,indent=2)+'\n')
        tokens = {'$description': f'Teske’s Lab 1.0.0, {mode}. DTCG 2025.10 color subset; layout exports are project-specific.', 'color': {key:dtcg_color(value) for key,value in colors.items()}}
        (ROOT/f'tokens/{mode}.tokens.json').write_text(json.dumps(tokens,indent=2)+'\n')
    for density, values in source['density'].items():
        selector = ':root, [data-density="comfortable"]' if density == 'comfortable' else '[data-density="compact"]'
        css.append(selector+' {')
        css.extend(f'  --tl-{key}: {value}px;' for key,value in values.items())
        css.append('}')
    css.append('@media (pointer: coarse), (max-width: 760px) { :root, [data-density] { --tl-control-height: 44px; --tl-row-height: 48px; --tl-control-px: 16px; --tl-control-py: 10px; } }')
    (ROOT/'web/tokens.css').write_text('\n'.join(css)+'\n')
    (ROOT/'web/tokens.js').write_text('// GENERATED; no network or imports required.\nwindow.TL_TOKENS = '+json.dumps({'version':source['version'],'themes':resolved,'common':common,'density':source['density']},indent=2)+';\n')
    (ROOT/'tokens/resolved.json').write_text(json.dumps({'version':source['version'],'themes':resolved,'common':source['common'],'density':source['density']},indent=2)+'\n')
    print(f'Built {len(resolved["light"])} semantic color roles in two themes.')

if __name__ == '__main__':
    build()
