#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
#
# check_series_pinterest.py — Les quatre séries du corpus Pinterest
# (data/fonds/collections-pinterest.json, « series ») contre leurs images,
# assets/motifs-pinterest/<série>/*.png. Lecture seule : rien n'est produit,
# renommé ni supprimé (des épingles portent ces adresses).
#   1. chaque série a ses 256 fichiers, sous les mêmes noms que les 256
#      lignes de data/motifs-index.csv qui ont une page ;
#   2. format annoncé par le registre (1000 × 1500 pavage, 1500 × 1500 cellule) ;
#   3. palette : une cellule emploie EXACTEMENT les trois couleurs de sa
#      série ; un pavage (lissé aux bords) a pour trois couleurs les plus
#      fréquentes exactement celles de sa série (le reste est le lissage
#      des bords ; la part exacte la plus faible est affichée), et, pour les niveaux de
#      gris, tous ses pixels sont gris (r = g = b) ; aucune image ne porte le
#      crème #efeae0, réservé au bicolore ;
#   4. empreinte de pixels (sha256 du RGB décodé) : 224 images distinctes
#      par série, et chaque doublon est exactement une paire
#      par2-yin-yang-hN = par3-sans-yang-mut-h(N XOR 7) — les grilles
#      identiques de tools/verify_six_formes.mjs, rien d'autre.
# Usage : python3 tools/check_series_pinterest.py
import csv, hashlib, json, os, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREME = (0xef, 0xea, 0xe0)
reg = json.load(open(os.path.join(ROOT, 'data/fonds/collections-pinterest.json'), encoding='utf-8'))['series']
pages = {}
with open(os.path.join(ROOT, 'data/motifs-index.csv'), encoding='utf-8') as f:
    for l in csv.DictReader(f):
        if l['page']:
            pages[l['fichier']] = re.sub(r'^motifs/|\.html$', '', l['page'])
echecs = []
hexa = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
paquet = lambda a: (a[..., 0].astype(np.uint32) << 16) | (a[..., 1].astype(np.uint32) << 8) | a[..., 2]

for nom, s in reg.items():
    dossier = os.path.join(ROOT, 'assets/motifs-pinterest', nom)
    fichiers = sorted(f for f in os.listdir(dossier) if f.endswith('.png'))
    if set(fichiers) != set(pages):
        echecs.append(f"{nom} : {len(set(fichiers) - set(pages))} fichiers hors index, {len(set(pages) - set(fichiers))} manquants")
    if len(fichiers) != s['images']:
        echecs.append(f"{nom} : {len(fichiers)} images, le registre en annonce {s['images']}")
    l, h = (int(x) for x in s['format'].split(' × '))
    pal = np.array([paquet(np.array([hexa(c)], dtype=np.uint8))[0] for c in s['palette']], dtype=np.uint32)
    creme = paquet(np.array([CREME], dtype=np.uint8))[0]
    empreintes, part_min = {}, 1.0
    for f in fichiers:
        im = Image.open(os.path.join(dossier, f)).convert('RGB')
        if im.size != (l, h):
            echecs.append(f"{nom}/{f} : {im.size[0]} × {im.size[1]}, attendu {s['format']}")
        a = np.asarray(im)
        empreintes.setdefault(hashlib.sha256(a.tobytes()).hexdigest(), []).append(f)
        p = paquet(a).ravel()
        dans = np.isin(p, pal)
        part = dans.mean()
        part_min = min(part_min, part)
        if s['grain'] == 'cellule':
            if not dans.all() or len(np.unique(p)) != 3:
                echecs.append(f"{nom}/{f} : une cellule doit employer exactement {s['palette']}")
        else:
            v, n = np.unique(p, return_counts=True)
            if set(v[np.argsort(-n)[:3]].tolist()) != set(pal.tolist()):
                echecs.append(f"{nom}/{f} : ses trois couleurs dominantes ne sont pas {s['palette']}")
            q = a.reshape(-1, 3)
            if s['couleurs'] == 'niveaux de gris' and ((q[:, 0] != q[:, 1]) | (q[:, 1] != q[:, 2])).any():
                echecs.append(f"{nom}/{f} : des pixels qui ne sont pas gris")
        if (p == creme).any():
            echecs.append(f"{nom}/{f} : porte le crème, réservé au bicolore")
    doublons = [g for g in empreintes.values() if len(g) > 1]
    conformes = 0
    for g in doublons:
        sl = sorted(pages[f] for f in g)
        m = [re.fullmatch(r'par2-yin-yang-h(\d+)', x) for x in sl] + [re.fullmatch(r'par3-sans-yang-mut-h(\d+)', x) for x in sl]
        a = next((x for x in m[:len(sl)] if x), None); b = next((x for x in m[len(sl):] if x), None)
        if len(g) == 2 and a and b and int(b.group(1)) == int(a.group(1)) ^ 7:
            conformes += 1
        else:
            echecs.append(f"{nom} : doublon inattendu {' = '.join(sl)}")
    print(f"{nom:32} {len(fichiers)} images {s['format']} · {s['description']} · palette exacte ≥ {part_min:.1%} des pixels (le reste : lissage) · "
          f"{len(empreintes)} distinctes, {conformes} paires hN = h(N XOR 7)")
    if len(empreintes) != 224 or conformes != 32:
        echecs.append(f"{nom} : {len(empreintes)} images distinctes et {conformes} paires, attendu 224 et 32")

if echecs:
    print('\n' + '\n'.join(echecs[:50]), file=sys.stderr)
    sys.exit(1)
print('\nQuatre séries conformes au registre ; le crème n\'y paraît pas ; les seuls doublons sont les 32 paires de grilles identiques.')
