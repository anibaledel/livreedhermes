#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
#
# check_pdf_servis.py — Sur le SITE DÉPLOYÉ (ce qui marche en local peut ne
# pas marcher en ligne) : chaque PDF des lecteurs du livre
# (book-viewer/*.pdf du dépôt) est demandé par une requête PARTIELLE
# (Range: bytes=0-1023). Exigé :
#   - 206 Partial Content, Content-Range, et Accept-Ranges: bytes — sans
#     requêtes partielles, la linéarisation ne sert à rien : le navigateur
#     télécharge tout avant d'afficher la première page ;
#   - « /Linearized » dans les premiers octets servis : le fichier en ligne
#     est bien le fichier linéarisé.
# Usage : python3 tools/check_pdf_servis.py [https://anibal-amiot.com]
import glob, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://anibal-amiot.com').rstrip('/')
echecs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'book-viewer', '*.pdf'))):
    url = f'{BASE}/book-viewer/{os.path.basename(f)}'
    req = urllib.request.Request(url, headers={'Range': 'bytes=0-1023', 'User-Agent': 'check_pdf_servis'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            statut, h, debut = r.status, r.headers, r.read(4096)
    except Exception as e:
        echecs.append(f'{url} : {e}'); continue
    ar, cr = h.get('Accept-Ranges', '—'), h.get('Content-Range', '—')
    lin = b'/Linearized' in debut[:1024]
    print(f'{url} : HTTP {statut}, Accept-Ranges: {ar}, Content-Range: {cr}, {len(debut)} octets reçus, linéarisé : {"oui" if lin else "NON"}')
    if statut != 206 or not cr.startswith('bytes 0-1023/'): echecs.append(f'{url} : la requête partielle n\'est pas honorée (HTTP {statut})')
    if ar.lower() != 'bytes': echecs.append(f'{url} : Accept-Ranges « {ar} », attendu « bytes »')
    if not lin: echecs.append(f'{url} : le fichier servi n\'est pas linéarisé (pas encore déployé ?)')
if echecs:
    print('\n' + '\n'.join(echecs), file=sys.stderr); sys.exit(1)
print(f'\nPDF servis en requêtes partielles et linéarisés sur {BASE}.')
