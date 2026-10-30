#!/usr/bin/env python3
"""Generate Qt and Android starter values; behavior belongs to each toolkit."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
themes=json.loads((ROOT/'tokens/resolved.json').read_text())['themes']
for mode,c in themes.items():
    qss=f"""/* GENERATED starter, scoped to TLRoot descendants. See docs/06-platforms.md. */
QWidget#TLRoot {{ background: {c['surface-page']}; color: {c['text-primary']}; }}
QWidget#TLRoot QLabel {{ color: {c['text-primary']}; }}
QWidget#TLRoot QPushButton {{
  color: {c['text-primary']}; background: {c['surface-raised']};
  border: 1px solid {c['control-border']}; border-radius: 4px;
  padding: 8px 16px; min-height: 26px;
}}
QWidget#TLRoot QPushButton:hover {{ background: {c['surface-hover']}; }}
QWidget#TLRoot QPushButton:pressed {{ background: {c['surface-selected']}; }}
QWidget#TLRoot QPushButton[tlRole="primary"] {{
  color: {c['action-primary-text']}; background: {c['action-primary-bg']};
  border-color: {c['action-primary-bg']};
}}
QWidget#TLRoot QPushButton[tlRole="primary"]:hover {{ background: {c['action-primary-hover']}; }}
QWidget#TLRoot QPushButton[tlRole="primary"]:pressed {{ background: {c['action-primary-pressed']}; }}
QWidget#TLRoot QPushButton[tlRole="danger"] {{
  color: {c['action-danger-text']}; background: {c['action-danger-bg']};
  border-color: {c['action-danger-bg']};
}}
QWidget#TLRoot QPushButton[tlRole="danger"]:hover {{ background: {c['action-danger-hover']}; }}
QWidget#TLRoot QPushButton[tlRole="danger"]:pressed {{ background: {c['action-danger-pressed']}; }}
QWidget#TLRoot QLineEdit, QWidget#TLRoot QTextEdit {{
  background: {c['surface-raised']}; color: {c['text-primary']};
  border: 1px solid {c['control-border']}; border-radius: 4px; padding: 8px;
  selection-background-color: {c['surface-selected']}; selection-color: {c['text-primary']};
}}
QWidget#TLRoot QPushButton:focus, QWidget#TLRoot QLineEdit:focus, QWidget#TLRoot QTextEdit:focus {{
  border: 2px solid {c['focus-ring']};
}}
QWidget#TLRoot QPushButton[tlRole="primary"]:focus {{ border: 2px solid {c['action-primary-text']}; }}
QWidget#TLRoot QPushButton[tlRole="danger"]:focus {{ border: 2px solid {c['action-danger-text']}; }}
QWidget#TLRoot QPushButton:disabled, QWidget#TLRoot QPushButton[tlRole="primary"]:disabled, QWidget#TLRoot QPushButton[tlRole="danger"]:disabled, QWidget#TLRoot QLineEdit:disabled {{
  background: {c['disabled-bg']}; color: {c['text-disabled']}; border-color: {c['disabled-bg']};
}}
QWidget#TLRoot QProgressBar {{ border: 1px solid {c['control-border']}; background: {c['surface-sunken']}; color: {c['text-primary']}; }}
QWidget#TLRoot QProgressBar::chunk {{ background: {c['text-link']}; }}
"""
    (ROOT/f'adapters/qt/{mode}.qss').write_text(qss)
    folder=ROOT/'adapters/android'/('values' if mode=='light' else 'values-night')
    folder.mkdir(exist_ok=True)
    xml=['<?xml version="1.0" encoding="utf-8"?>','<!-- GENERATED semantic color resources. -->','<resources>']
    xml.extend(f'    <color name="tl_{name.replace("-","_")}">{value}</color>' for name,value in c.items())
    xml.append('</resources>')
    (folder/'colors.xml').write_text('\n'.join(xml)+'\n')
print('Generated Qt starters and Android resources.')
