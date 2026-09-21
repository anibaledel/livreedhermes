#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
render_bicolore_c16.py — rendu SVG autonome d'une famille au format C16
(voir cellule_c16.py), pour vérification visuelle. bicolore-render.js ne
sait rendre que C8 pour l'instant ; ce script n'a pas vocation à
remplacer un futur rendu C16 côté page, seulement à produire une image
de contrôle pendant qu'une trame C16 est encore en cours de dérivation.

Usage :
    python3 render_bicolore_c16.py --src data/referent_bicolore_c16b1_bases_v1.json \\
        --famille YANG --teinte yang --out /tmp/yang.svg
"""

import argparse
import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS_DIR)

from cellule_c16 import GRID, PER_CELL_C16, _SUBSQUARE_CENTER, _SUBSQUARE_ORIGIN  # noqa: E402


def hex_to_bits(hex_str):
    return [int(c, 16) >> (3 - b) & 1 for c in hex_str for b in range(4)]


def _triangle_points(row, col, sector, size):
    cw = size / GRID
    x0, y0 = col * cw, row * cw
    subidx, local = divmod(sector, 4)
    ox, oy = _SUBSQUARE_ORIGIN[subidx]
    cx, cy = _SUBSQUARE_CENTER[subidx]
    corners = [(ox, oy), (ox + 0.5, oy), (ox + 0.5, oy + 0.5), (ox, oy + 0.5)]
    base = {0: (corners[0], corners[1]), 1: (corners[1], corners[2]),
            2: (corners[2], corners[3]), 3: (corners[3], corners[0])}[local]
    pts = [(cx, cy), base[0], base[1]]
    return [(x0 + px * cw, y0 + py * cw) for px, py in pts]


def render(bits, palette, size=500):
    c0, c1 = palette
    body = []
    for row in range(GRID):
        for col in range(GRID):
            for sector in range(PER_CELL_C16):
                bit = bits[(row * GRID + col) * PER_CELL_C16 + sector]
                pts = _triangle_points(row, col, sector, size)
                cls = 'b' if bit else 'a'
                pts_str = ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
                body.append(f'<polygon class="{cls}" points="{pts_str}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">\n'
            f'<style>.a{{fill:{c0}}}.b{{fill:{c1}}}</style>\n' + '\n'.join(body) + '\n</svg>\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='fichier referent_bicolore JSON (format C16)')
    ap.add_argument('--famille', required=True)
    ap.add_argument('--teinte', default='yang', choices=['yang', 'yin'])
    ap.add_argument('--out', required=True)
    ap.add_argument('--size', type=int, default=500)
    ap.add_argument('--palette', default='#f2f2f0,#e0261b', help='clair,sombre')
    args = ap.parse_args()

    doc = json.load(open(args.src, encoding='utf-8'))
    familles = doc.get('familles', doc)  # tolère un fichier {familles:{...}} ou {NOM:{...}} direct
    bits = hex_to_bits(familles[args.famille][args.teinte])
    palette = args.palette.split(',')
    svg = render(bits, palette, size=args.size)
    open(args.out, 'w', encoding='utf-8').write(svg)
    print('écrit :', args.out)


if __name__ == '__main__':
    main()
