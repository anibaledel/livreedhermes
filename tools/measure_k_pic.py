#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
measure_k_pic.py — Mesure k_pic (fréquence spatiale dominante) des quinze
gammes, pour les DEUX générations T1 et bandes, depuis les SVG sources.

Jusqu'au 2026-09-21, ce script mesurait depuis les masques hexadécimaux de
data/referent_bandes_v1.json — c'est-à-dire depuis data/referent_bicolore_v1.json
(tools/generate_referent_bandes.py en est une vue générée), qui s'est avéré
porter la géométrie T1 (8 triangles/cellule), pas celle des bandes : le nom
du fichier trompait sur ce qu'il mesurait. Ce script lit maintenant les deux
générations séparément, chacune depuis ses propres SVG :
    T1     : data/ORIGINES/*.svg              (1152 polygones, 8/cellule)
    bandes : data/referent_bandes_t3_src/**/*.svg (576 polygones, 4/cellule)

BUG CORRIGÉ (2026-09-21) — la boîte englobante depuis le CENTROÏDE plutôt
que les SOMMETS
-----------------------------------------------------------------------
Les polygones de ces SVG sont des QUADRILATÈRES, pas des triangles (4
sommets, vérifié sur les 30 fichiers). Une première version de ce script
calculait la boîte englobante d'un fichier à partir des centres de ses
polygones (moyenne de leurs sommets) plutôt que de leurs sommets pris un
par un. Le centre d'un polygone au bord de la grille est mécaniquement
tiré vers l'intérieur — jamais jusqu'au bord réel du dessin — donc une
boîte construite sur des centres est toujours plus petite que la vraie
étendue du dessin. Sur le fichier de test (bandesYANG MUT.svg), l'écart
était uniforme : 4,3 % sur les 144 cellules, dans le même sens partout —
un symptôme qui devrait alerter (une erreur de cellule isolée varie d'une
cellule à l'autre ; une erreur de boîte englobante les biaise toutes du
même facteur). Diagnostiqué en comparant l'aire totale des polygones de
teinte (calculée par la formule du lacet, exacte quel que soit le nombre
de sommets) à l'aire de la boîte englobante : les deux doivent coïncider
si le dessin pave la grille sans trou ni recouvrement — ce qui est vrai
ailleurs dans ce projet (voir tools/generate_referent_bicolore.py) et
donc un bon test de régression pour toute future reprise de ce calcul.
Corrigé en construisant la boîte à partir de TOUS les sommets de TOUS les
polygones de teinte, pas de leurs centres.

Ce n'est pas une erreur isolée : c'est le genre qui repasse. La documenter
ici, avec son symptôme (écart uniforme, pas localisé) et son test (aire
totale = aire de la boîte), vaut mieux que la corriger en silence.

Méthode (par génération, par gamme)
------------------------------------
1. Chaque polygone <polygon class="cls-N" points="..."> dont la classe a
   pour fill #a7a9ac (clair) ou #808285 (sombre) est une teinte ; tout le
   reste (fill:none, lignes de guide) est ignoré. La classe -> couleur
   varie d'un fichier à l'autre (numérotation Illustrator arbitraire) :
   elle est relue depuis le bloc <style> de chaque fichier, jamais supposée.
2. Aire de chaque polygone par la formule du lacet (exacte, quel que soit
   le nombre de sommets) ; boîte englobante sur les sommets réels de tous
   les polygones de teinte du fichier (voir le bug ci-dessus).
3. Grille 12×12 : l'aire sombre de chaque cellule, divisée par l'aire
   totale (sombre + claire) qui y tombe -- une fraction exacte, pas un
   comptage de triangles (le nombre de polygones par cellule n'est PAS
   constant partout : le fichier combinant les 4 bases sous racine de
   data/referent_bandes_t3_src/ a des cellules à 2 et à 8 polygones,
   toutes de la bonne aire totale). Contrôle : l'aire totale de teinte par
   cellule doit être uniforme à 2 % près sur les 144 cellules ; sinon le
   script s'arrête plutôt que de mesurer une géométrie mal comprise.
4. FFT 2D de la grille (moyenne retirée), pic dominant hors composante
   continue, k² = fx² + fy² (entier par construction, indices centrés
   dans [-6,6], k² <= 72 au maximum sur une grille 12×12).

Échelles
--------
Ancrage recalé le 2026-09-21 sur la plage réellement mesurée (1 à 72), pas
sur la plage 50-100 supposée par l'ancien ancrage à 2,56 Hz (qui plaçait
alors presque toutes les valeurs sous le seuil audible) :
    proportionnelle : f_hz = 128 × k²           — 128 Hz (k²=1) à 9216 Hz (k²=72)
    ordinale        : les valeurs distinctes de k² de T1 ET bandes réunies
                       (16 au 2026-09-21), étalées par rang sur une octave,
                       f_hz = 128 × 2^(rang / (N-1)), rang 0..N-1 — les
                       valeurs communes aux deux générations partagent le
                       même rang.

Usage
-----
    python tools/measure_k_pic.py                  (mesure, affiche, n'écrit rien)
    python tools/measure_k_pic.py --apply           (écrit dans data/referent_bandes_v1.json :
                                                       ajoute/remplace 'generations' par gamme
                                                       et 'echelle' top-level ; ne touche pas à
                                                       categorie/yang/yin, la géométrie affichée)
"""
import argparse
import glob
import json
import os
import re
import sys

import numpy as np

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T1_DIR = os.path.join(REPO_ROOT, 'data', 'ORIGINES')
BANDES_DIR = os.path.join(REPO_ROOT, 'data', 'referent_bandes_t3_src')
OUT_JSON = os.path.join(REPO_ROOT, 'data', 'referent_bandes_v1.json')

N = 12
LIGHT_HEX = '#a7a9ac'
DARK_HEX = '#808285'
ANCRE_HZ = 128.0
ANCRE_OCTAVE = 3
STYLE_RE = re.compile(r'\.cls-(\d+)\s*\{([^}]*)\}')
POLY_RE = re.compile(r'<polygon\s+class="cls-(\d+)"\s+points="([^"]+)"')
NOTE_NAMES = ['do', 'do#', 'ré', 'ré#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']

# gamme -> fichier T1 (data/ORIGINES/) et fichier bandes
# (data/referent_bandes_t3_src/, chemin relatif) — établi par recoupement
# des identifiants internes des SVG (<g id=... data-name=...>), pas des
# noms de fichiers seuls (qui divergent d'une génération à l'autre :
# "PUR" en T1/T2, parfois "FIX" en bandes pour le même trait non muté).
GAMME_FILES = {
    'yang':              ('bandesYANG.svg',              'bases/bandesb yang.svg'),
    'yang mut':          ('bandesYANG MUT.svg',           'bases/bandesb yang mut.svg'),
    'yin':               ('bandesYIN.svg',                'bases/bandesb yin.svg'),
    'yin mut':           ('bandesYIN MUT.svg',             'bases/bandesb yin mut.svg'),
    'yang pur':          ('bandesYANG PUR.svg',            'par 2/bandesb yang pur.svg'),
    'yin pur':           ('bandesYIN PUR.svg',             'par 2/bandesb yin pur.svg'),
    'yin yang fix':      ('bandesYIN YANG.svg',            'par 2/bandesb yin yang fix.svg'),
    'yin yang mut':      ('bandesYIN YANG MUT.svg',        'par 2/bandesb yin yang mut.svg'),
    'yang mut yin mut':  ('bandesYIN MUT YANG MUT.svg',    'par 2/bandesb yang mut yin mut.svg'),
    'yang yin mut':      ('bandesYANG YIN MUT.svg',        'par 2/bandesb yang yin mut.svg'),
    'yang pur yin':      ('bandesYANG PUR YIN.svg',        'par 3/bandesb yang pur yin.svg'),
    'yang pur yin mut':  ('bandesYANG PUR YIN MUT.svg',    'par 3/bandesb yang pur yin mut.svg'),
    'yin pur yang':      ('bandesYIN PUR YANG.svg',        'par 3/bandesb yin pur yang.svg'),
    'yin pur yang mut':  ('bandesYIN PUR YANG MUT.svg',    'par 3/bandesb yin pur yang mut.svg'),
    'yang pur yin pur':  ('bandesYIN PUR YANG PUR.svg',    'bandesb yang pur yin pur.svg'),
}


def parse_svg(path):
    src = open(path, encoding='utf-8', errors='ignore').read()
    fill_of = {}
    for cls, body in STYLE_RE.findall(src):
        m = re.search(r'fill:\s*(#[0-9a-fA-F]{6}|none)', body)
        fill_of[cls] = m.group(1) if m else None

    polys = []  # (dark:bool, cx, cy, area)
    vx, vy = [], []
    for cls, pts in POLY_RE.findall(src):
        fill = fill_of.get(cls)
        if fill not in (LIGHT_HEX, DARK_HEX):
            continue
        nums = [float(v) for v in pts.replace(',', ' ').split()]
        xs, ys = nums[0::2], nums[1::2]
        vx.extend(xs)
        vy.extend(ys)
        cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
        area = 0.0
        k = len(xs)
        for i in range(k):
            j = (i + 1) % k
            area += xs[i] * ys[j] - xs[j] * ys[i]
        polys.append((fill == DARK_HEX, cx, cy, abs(area) / 2.0))
    if not polys:
        sys.exit(f"{path}: aucun polygone de teinte trouvé (fill {LIGHT_HEX}/{DARK_HEX} absent)")
    return polys, (min(vx), max(vx), min(vy), max(vy))  # bbox sur les SOMMETS, pas les centres


def grid_from_polys(polys, bbox, path):
    x0, x1, y0, y1 = bbox
    cell_w, cell_h = (x1 - x0) / N, (y1 - y0) / N
    dark = np.zeros((N, N))
    total = np.zeros((N, N))
    for is_dark, cx, cy, area in polys:
        col = min(max(int((cx - x0) / cell_w), 0), N - 1)
        row = min(max(int((cy - y0) / cell_h), 0), N - 1)
        total[row, col] += area
        if is_dark:
            dark[row, col] += area
    cell_area = (x1 - x0) * (y1 - y0) / (N * N)
    if not np.allclose(total, cell_area, rtol=0.02):
        bad = [(r, c, round(total[r, c] / cell_area, 3)) for r in range(N) for c in range(N)
               if abs(total[r, c] - cell_area) > 0.02 * cell_area]
        sys.exit(f"{path}: aire par cellule irrégulière (attendu ~1.0x l'aire de cellule) : {bad[:5]}")
    return dark / total


def dominant_k2(grid):
    F = np.fft.fft2(grid - grid.mean())
    P = np.abs(F) ** 2
    P[0, 0] = 0
    kx, ky = np.unravel_index(np.argmax(P), P.shape)
    fx = kx if kx <= N // 2 else kx - N
    fy = ky if ky <= N // 2 else ky - N
    return int(fx * fx + fy * fy)


def k2_de(path):
    polys, bbox = parse_svg(path)
    grid = grid_from_polys(polys, bbox, path)
    return dominant_k2(grid)


def note_tempere(cents):
    demi_tons = round(cents / 100)
    octave = ANCRE_OCTAVE + demi_tons // 12
    return f"{NOTE_NAMES[demi_tons % 12]}{octave}"


def mesurer():
    """{gamme: {'T1': k2, 'bandes': k2}} pour les 15 gammes."""
    out = {}
    for gamme, (f_t1, f_bandes) in GAMME_FILES.items():
        p1 = os.path.join(T1_DIR, f_t1)
        p3 = os.path.join(BANDES_DIR, f_bandes)
        if not os.path.exists(p1):
            sys.exit(f"T1 introuvable pour {gamme!r} : {p1}")
        if not os.path.exists(p3):
            sys.exit(f"bandes introuvable pour {gamme!r} : {p3}")
        out[gamme] = {'T1': k2_de(p1), 'bandes': k2_de(p3)}
    return out


def echelles_de(k2, rang_de):
    k_pic = k2 ** 0.5
    f_prop = ANCRE_HZ * k2
    cents_prop = round(1200 * np.log2(f_prop / ANCRE_HZ))
    rang, n_rangs = rang_de[k2]
    f_ord = ANCRE_HZ * 2 ** (rang / (n_rangs - 1))
    cents_ord = round(1200 * np.log2(f_ord / ANCRE_HZ))
    return {
        'k2': k2, 'k_pic': round(k_pic, 3),
        'echelles': {
            'proportionnelle': {'f_hz': round(f_prop, 1), 'note': note_tempere(cents_prop), 'cents': cents_prop},
            'ordinale': {'f_hz': round(f_ord, 1), 'note': note_tempere(cents_ord), 'cents': cents_ord, 'rang': rang},
        },
    }


def construire_echelle_globale(mesures):
    valeurs_k2 = {
        'T1': sorted({m['T1'] for m in mesures.values()}),
        'bandes': sorted({m['bandes'] for m in mesures.values()}),
    }
    tous_k2 = sorted({v for m in mesures.values() for v in m.values()})
    n = len(tous_k2)
    rang_de = {k2: (rang, n) for rang, k2 in enumerate(tous_k2)}
    echelle = {
        'methode': ("k_pic mesuré directement depuis les fichiers SVG sources (T1 : "
                    "data/ORIGINES/, bandes : data/referent_bandes_t3_src/) par FFT 2D — "
                    "fraction d'aire sombre exacte par cellule (aire des polygones, pas "
                    "un comptage), pic dominant hors composante continue, k² = fx² + fy²."),
        'provenance': {
            'script': 'tools/measure_k_pic.py',
            'date': '2026-09-21',
        },
        'valeurs_k2': valeurs_k2,
        'echelles': {
            'proportionnelle': f"f_hz = 128 x k^2, de {ANCRE_HZ:.0f} Hz (k^2={tous_k2[0]}) "
                                f"a {ANCRE_HZ * tous_k2[-1]:.0f} Hz (k^2={tous_k2[-1]})",
            'ordinale': f"les {n} valeurs distinctes de k^2 (T1 + bandes réunies) étalées par "
                        f"rang sur une octave, 128 x 2^(rang/{n - 1}), rang 0..{n - 1}",
        },
    }
    return echelle, rang_de


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--apply', action='store_true',
                     help="écrit 'generations'/'echelle' dans data/referent_bandes_v1.json")
    arg = ap.parse_args()

    mesures = mesurer()
    echelle, rang_de = construire_echelle_globale(mesures)

    print(f"{'gamme':20s} {'T1 k²':>6s} {'bandes k²':>10s}")
    for gamme, m in mesures.items():
        print(f"{gamme:20s} {m['T1']:6d} {m['bandes']:10d}")
    print(f"\nvaleurs T1 ({len(echelle['valeurs_k2']['T1'])}) : {echelle['valeurs_k2']['T1']}")
    print(f"valeurs bandes ({len(echelle['valeurs_k2']['bandes'])}) : {echelle['valeurs_k2']['bandes']}")

    if not arg.apply:
        print("\n(mesure seulement — relancer avec --apply pour écrire dans le JSON)")
        return

    doc = json.load(open(OUT_JSON, encoding='utf-8'))
    for gamme, m in mesures.items():
        if gamme not in doc['gammes']:
            sys.exit(f"gamme {gamme!r} absente de {OUT_JSON} — géométrie non générée ?")
        for stale in ('k2', 'k_pic', 'echelles'):
            doc['gammes'][gamme].pop(stale, None)  # ancienne couche acoustique à plat, une seule génération
        doc['gammes'][gamme]['generations'] = {
            'T1': echelles_de(m['T1'], rang_de),
            'bandes': echelles_de(m['bandes'], rang_de),
        }
    doc['echelle'] = echelle
    with open(OUT_JSON, 'w', encoding='utf-8') as fh:
        json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
    print(f"\n{OUT_JSON} écrit.")


if __name__ == '__main__':
    main()
