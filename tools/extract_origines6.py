#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
extract_origines6.py — extracteur pour data/ORIGINES 6/ (cellule C4,
voir cellule_c4.py). Ces planches mêlent <polygon> et <polyline>, des
formes fermées et non fermées, et fusionnent des triangles C4 voisins de
même teinte en une seule forme (jusqu'à un quadrilatère de case entière)
— voir cellule_c4.py pour pourquoi. Lit donc PAR POINT, jamais en
comptant les formes par case : pour chacun des 4 triangles C4 de chaque
case, un point intérieur est testé contre TOUTES les formes valides
(classe -> #808285 ou #a7a9ac) dans l'ORDRE DU DOCUMENT, la dernière
forme qui contient le point l'emporte (même règle que raster2.py, dont
c'est la version corrigée — voir ci-dessous pourquoi il trouait deux
planches).

LE BUG DE raster2.py (essai précédent, non versionné, retrouvé dans un
fichier transmis séparément) : `Path(P).contains_points(pts)` de
matplotlib applique la règle du nombre d'enroulement non nul (« nonzero
winding ») aux polygones qui s'auto-croisent. Des sommets qui ne sont
pas dans l'ordre du contour (un vrai risque sur ~40 quadrilatères tracés
à la main) rendent la forme un papillon (bowtie) ; sous cette règle, un
de ses deux lobes peut être considéré comme extérieur bien qu'à
l'intérieur visuel de la forme — un point de sonde qui y tombe ne
rencontre alors AUCUNE forme, d'où un trou. point_dans_polygone()
ci-dessous applique la règle pair-impair (even-odd / ray casting), qui
ne connaît pas cette ambiguïté de sens de parcours.
"""

import re
import sys
import os

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS_DIR)

from cellule_c4 import GRID, PER_CELL_C4, PARTS_C4, interior_point  # noqa: E402

DARK = '#808285'
LIGHT = '#a7a9ac'


def point_dans_polygone(px, py, poly):
    """Règle pair-impair (ray casting) — gère les polygones convexes,
    concaves simples, et donne un résultat défini (sans ambiguïté de
    sens de parcours) pour un polygone auto-croisé."""
    inside = False
    n = len(poly)
    x1, y1 = poly[-1]
    for i in range(n):
        x2, y2 = poly[i]
        if (y1 > py) != (y2 > py):
            xin = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
            if px < xin:
                inside = not inside
        x1, y1 = x2, y2
    return inside


def read_shapes(path):
    """Formes valides (classe -> DARK/LIGHT), dans l'ordre du document,
    quel que soit le nombre de sommets (3, 4, ou plus si fusion multiple)
    et que la forme soit fermée ou non (fermeture implicite pour le test
    point-dans-polygone, qui ne regarde que la liste de sommets)."""
    src = open(path, encoding='utf-8', errors='ignore').read()
    fills = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-f]{6}|none)', src))
    shapes = []
    for tag, cls, pts in re.findall(r'<(polygon|polyline) class="(cls-\d+)" points="([^"]+)"', src):
        fill = fills.get(cls)
        if fill not in (DARK, LIGHT):
            continue
        n = [float(v) for v in pts.replace(',', ' ').split()]
        P = list(zip(n[0::2], n[1::2]))
        if len(P) >= 3:
            shapes.append((P, 1 if fill == DARK else 0))
    return shapes


def bbox_of(shapes):
    xs = [x for P, _ in shapes for x, y in P]
    ys = [y for P, _ in shapes for x, y in P]
    return min(xs), max(xs), min(ys), max(ys)


def extract_dark_bits(path):
    """Bits sombres (1) de la planche, longueur PARTS_C4, index global
    standard (cellule ligne-major x PER_CELL_C4 + secteur). Lève une
    erreur listant les trous si un point de sonde ne rencontre aucune
    forme — ne doit jamais arriver après correction du bug ci-dessus."""
    shapes = read_shapes(path)
    x0, x1, y0, y1 = bbox_of(shapes)
    cell_w = (x1 - x0) / GRID

    bits = [None] * PARTS_C4
    holes = []
    for row in range(GRID):
        for col in range(GRID):
            for sector in range(PER_CELL_C4):
                lx, ly = interior_point(sector)
                px, py = x0 + (col + lx) * cell_w, y0 + (row + ly) * cell_w
                value = None
                for P, b in shapes:  # ordre du document : la dernière forme qui contient le point gagne
                    if point_dans_polygone(px, py, P):
                        value = b
                gi = (row * GRID + col) * PER_CELL_C4 + sector
                if value is None:
                    holes.append((row, col, sector))
                else:
                    bits[gi] = value
    if holes:
        raise SystemExit(f'{path} : {len(holes)} trou(s), ex. {holes[:5]}')
    return bits


if __name__ == '__main__':
    import glob
    src_dir = sys.argv[1] if len(sys.argv) > 1 else r'data/ORIGINES 6'
    for path in sorted(glob.glob(os.path.join(src_dir, '*.svg'))):
        try:
            bits = extract_dark_bits(path)
            dark = sum(bits)
            print(f'{os.path.basename(path):32s} OK  {dark}/{PARTS_C4} sombres')
        except SystemExit as e:
            print(f'{os.path.basename(path):32s} {e}')
