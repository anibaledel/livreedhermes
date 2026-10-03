#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
#
# check_pdf.py — Les PDF du dépôt (suivis par git, hors archives « anciens/ ») :
#   1. aucun ne dépasse POIDS_MAX (25 Mo — à relever si un volume le justifie) :
#      un PDF du livre exporté sans tools/alleger_pdf.py pèse ~80 Mo, les
#      mêmes images y étant réincorporées à chaque page ;
#   2. les PDF servis aux lecteurs du livre (book-viewer/*.pdf) sont
#      LINÉARISÉS (qpdf --check-linearization, et « Optimized: yes »).
# Usage : python3 tools/check_pdf.py
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POIDS_MAX = 25_000_000
fichiers = [f for f in subprocess.run(['git', 'ls-files', '*.pdf'], cwd=ROOT, capture_output=True, text=True).stdout.split('\n')
            if f and '/anciens/' not in f]
echecs = []
for f in fichiers:
    t = os.path.getsize(os.path.join(ROOT, f))
    if t > POIDS_MAX: echecs.append(f'{f} : {t / 1e6:.1f} Mo, au-delà de {POIDS_MAX / 1e6:.0f} Mo — passer tools/alleger_pdf.py')
servis = [f for f in fichiers if f.startswith('book-viewer/')]
for f in servis:
    r = subprocess.run(['qpdf', '--check-linearization', os.path.join(ROOT, f)], capture_output=True, text=True)
    info = subprocess.run(['pdfinfo', os.path.join(ROOT, f)], capture_output=True, text=True).stdout
    opt = next((l.split(':', 1)[1].strip() for l in info.splitlines() if l.startswith('Optimized:')), '?')
    ok = r.returncode == 0 and 'no linearization errors' in r.stdout and opt == 'yes'
    print(f'{f} : {os.path.getsize(os.path.join(ROOT, f)) / 1e6:.1f} Mo, Optimized: {opt}')
    if not ok: echecs.append(f'{f} : pas linéarisé — passer tools/alleger_pdf.py')
print(f'{len(fichiers)} PDF, le plus lourd {max(os.path.getsize(os.path.join(ROOT, f)) for f in fichiers) / 1e6:.1f} Mo (limite {POIDS_MAX / 1e6:.0f} Mo)')
if echecs:
    print('\n' + '\n'.join(echecs), file=sys.stderr); sys.exit(1)
print('PDF légers, et linéarisés là où un lecteur les ouvre.')
