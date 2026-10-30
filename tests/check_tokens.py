#!/usr/bin/env python3
"""Check semantic parity, contrast contracts, font assets, and generated output drift."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def luminance(color):
    channels = [int(color[i:i+2],16)/255 for i in (1,3,5)]
    linear = [c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in channels]
    return sum(c*w for c,w in zip(linear,[.2126,.7152,.0722]))
def contrast(a,b):
    hi,lo = sorted([luminance(a),luminance(b)],reverse=True)
    return (hi+.05)/(lo+.05)
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    source = json.loads((ROOT/'tokens/source.json').read_text())
    generated = [ROOT/'web/tokens.css',ROOT/'web/tokens.js']+list((ROOT/'tokens').glob('*.resolved.json'))+list((ROOT/'tokens').glob('*.tokens.json'))+[ROOT/'tokens/resolved.json']
    before = {str(p):digest(p) for p in generated}
    subprocess.run([sys.executable,str(ROOT/'scripts/build_tokens.py')],check=True)
    assert all(digest(Path(p))==h for p,h in before.items()), 'Generated token drift: commit regenerated outputs.'
    resolved = json.loads((ROOT/'tokens/resolved.json').read_text())['themes']
    assert resolved['light'].keys()==resolved['dark'].keys(), 'Theme role mismatch'
    pairs=[]
    for mode,c in resolved.items():
        def check(fg,bg,threshold,reason):
            ratio=contrast(c[fg],c[bg])
            pairs.append(dict(theme=mode,foreground=fg,background=bg,ratio=round(ratio,3),minimum=threshold,passed=ratio>=threshold,reason=reason))
        for fg in ['text-primary','text-secondary','text-link']:
            for bg in ['surface-page','surface-raised','surface-sunken','surface-hover','surface-selected']:
                check(fg,bg,4.5,'Normal text')
        for action in ['primary','danger']:
            for state in ['bg','hover','pressed']:
                check('action-'+action+'-text','action-'+action+'-'+state,4.5,'Action label')
        for status in ['success','warning','danger','info','neutral']:
            check('status-'+status+'-text','status-'+status+'-bg',4.5,'Status label and icon')
        for bg in ['surface-page','surface-raised','surface-sunken']:
            check('control-border',bg,3,'Essential boundary')
            check('focus-ring',bg,3,'Focus ring outer adjacency')
        check('nav-text','nav-bg',4.5,'Navigation text')
        check('nav-muted','nav-bg',4.5,'Navigation support')
        check('nav-selected-text','nav-selected-bg',4.5,'Selected navigation text')
        check('nav-focus','nav-bg',3,'Navigation focus')
        check('text-disabled','disabled-bg',4.5,'Voluntary disabled text baseline')
    for font in ['IBMPlexSans-Regular','IBMPlexSans-SemiBold','IBMPlexMono-Regular']:
        assert (ROOT/f'assets/fonts/{font}.woff2').stat().st_size>1000
        assert (ROOT/f'assets/fonts/{font}.ttf').stat().st_size>1000
    failures=[p for p in pairs if not p['passed']]
    report={'version':source['version'],'checks':len(pairs),'passed':len(pairs)-len(failures),'failures':failures,'pairs':pairs,'scope':'Token pairs only; not a product accessibility certification.'}
    (ROOT/'validation/contrast.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'checks':len(pairs),'passed':len(pairs)-len(failures),'failures':failures},indent=2))
    assert not failures,'Contrast contract failed'
if __name__=='__main__': main()
