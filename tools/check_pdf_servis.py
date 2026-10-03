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
# Un fichier tout juste poussé peut répondre 404, ou encore dans son ancienne
# version, le temps que GitHub Pages publie (un commit de 45 Mo a dépassé
# 4 minutes, le 3 octobre 2026) : un fichier en écart est redemandé toutes
# les 30 s pendant ATTENTE secondes avant d'être un échec.
# Usage : python3 tools/check_pdf_servis.py [https://anibal-amiot.com] [--attente 600]
import glob, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--') and not a.isdigit()]
BASE = (args[0] if args else 'https://anibal-amiot.com').rstrip('/')
ATTENTE = int(sys.argv[sys.argv.index('--attente') + 1]) if '--attente' in sys.argv else 600


def verifier(url):
    """Les écarts d'un fichier servi (liste vide : conforme), et la ligne de compte rendu."""
    req = urllib.request.Request(url, headers={'Range': 'bytes=0-1023', 'User-Agent': 'check_pdf_servis'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            statut, h, debut = r.status, r.headers, r.read(4096)
    except Exception as e:
        return [f'{url} : {e}'], f'{url} : {e}'
    ar, cr = h.get('Accept-Ranges', '—'), h.get('Content-Range', '—')
    lin = b'/Linearized' in debut[:1024]
    ecarts = []
    if statut != 206 or not cr.startswith('bytes 0-1023/'): ecarts.append(f'{url} : la requête partielle n\'est pas honorée (HTTP {statut})')
    if ar.lower() != 'bytes': ecarts.append(f'{url} : Accept-Ranges « {ar} », attendu « bytes »')
    if not lin: ecarts.append(f'{url} : le fichier servi n\'est pas linéarisé')
    return ecarts, (f'{url} : HTTP {statut}, Accept-Ranges: {ar}, Content-Range: {cr}, '
                    f'{len(debut)} octets reçus, linéarisé : {"oui" if lin else "NON"}')


echecs = []
fin = time.time() + ATTENTE
for f in sorted(glob.glob(os.path.join(ROOT, 'book-viewer', '*.pdf'))):
    url = f'{BASE}/book-viewer/{os.path.basename(f)}'
    while True:
        ecarts, ligne = verifier(url)
        if not ecarts or time.time() >= fin: break
        print(f'{ecarts[0]} — pas encore publié ? nouvel essai dans 30 s', flush=True)
        time.sleep(30)
    print(ligne, flush=True)
    echecs += ecarts
if echecs:
    print('\n' + '\n'.join(echecs), file=sys.stderr); sys.exit(1)
print(f'\nPDF servis en requêtes partielles et linéarisés sur {BASE}.')
