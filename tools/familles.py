#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
familles.py — génère les 15 familles d'axes en bicolore.

Principe
--------
Quatre bases d'axes (YIN, YIN-MUT, YANG, YANG-MUT) partagent la même
découpe : une grille 12x12 dont chaque cellule est coupée en 8 triangles
par ses deux diagonales et ses deux médianes, soit 1152 triangles. Chaque
base assigne à chaque triangle l'une des deux teintes, selon le côté de
sa frontière où tombe le centre du triangle.

Les bases YIN sont orthogonales : leur frontière suit les arêtes des
cellules, et aucune cellule n'est coupée. Les bases YANG sont
diagonales : leur frontière traverse 24 cellules, qui se partagent alors
4 + 4. C'est ce que permettent les huit triangles.

Une famille est une combinaison de bases, et la règle de combinaison est
la parité : un triangle appartenant à un nombre impair de bases prend une
teinte, un nombre pair l'autre. Les quatre bases donnent ainsi
4 + 6 + 4 + 1 = 15 familles.

Usage
-----
    python3 familles.py                    # les 15 familles + les inverses
    python3 familles.py YIN YANG           # une combinaison précise
    python3 familles.py --out dossier/
"""

import argparse
import itertools
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SRC = os.path.join(REPO_ROOT, 'data', 'referent_bicolore_src', 'BASES')

BASES = ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']

FILES = {
    'YIN':      'Untitled-4fond_base_yin_8_tri.svg',
    'YIN-MUT':  'Untitled-4fond_base_yin_mut_8_tri.svg',
    'YANG':     'Untitled-4fond_base_yang_8_tri.svg',
    'YANG-MUT': 'Untitled-4fond_base_yang_mut_8_tri.svg',
}

DARK, LIGHT = '#808285', '#a7a9ac'


def read_base(path):
    """Lit une base : rend {points du triangle: 0 ou 1}, clé = centre."""
    src = open(path, encoding='utf-8', errors='ignore').read()
    fills = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-f]{6})', src))
    out = {}
    for cls, pts in re.findall(r'<polygon class="(cls-\d+)" points="([^"]+)"',
                               src):
        if cls not in fills:
            continue                      # cls sans fill = tracé d'axe
        n = [float(v) for v in pts.replace(',', ' ').split()]
        cx = sum(n[0::2]) / (len(n) // 2)
        cy = sum(n[1::2]) / (len(n) // 2)
        out[(round(cx, 2), round(cy, 2))] = (pts, 1 if fills[cls] == DARK else 0)
    return out


def write_svg(tri, path, size=375.41, invert=False):
    body = []
    for pts, bit in tri.values():
        if invert:
            bit ^= 1
        body.append('<polygon class="%s" points="%s"/>' % ('d' if bit else 'l',
                                                           pts))
    open(path, 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'viewBox="0 0 %.2f %.2f">\n' % (size, size) +
        '<style>.d{fill:%s}.l{fill:%s}</style>\n' % (DARK, LIGHT) +
        '\n'.join(body) + '\n</svg>\n')


def combine(bases, chosen):
    """Parité : un triangle dans un nombre impair de bases prend la teinte 1."""
    ref = bases[chosen[0]]
    out = {}
    for key, (pts, _) in ref.items():
        bit = 0
        for name in chosen:
            bit ^= bases[name][key][1]
        out[key] = (pts, bit)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bases', nargs='*', choices=BASES + [],
                    help='combinaison précise ; sinon les 15 familles')
    ap.add_argument('--src', default=DEFAULT_SRC,
                    help=f'dossier des 4 fonds de base (défaut : {DEFAULT_SRC})')
    ap.add_argument('--out', default='familles', help='dossier de sortie')
    args = ap.parse_args()

    loaded = {}
    for name, fn in FILES.items():
        path = os.path.join(args.src, fn)
        if not os.path.exists(path):
            raise SystemExit('fond manquant : %s' % path)
        loaded[name] = read_base(path)

    keys = set(loaded['YIN'])
    for g in loaded.values():
        if set(g) != keys:
            raise SystemExit('les fonds ne partagent pas la même découpe')

    os.makedirs(args.out, exist_ok=True)

    if args.bases:
        combos = [tuple(args.bases)]
    else:
        combos = [c for n in range(1, 5)
                  for c in itertools.combinations(BASES, n)]

    for combo in combos:
        tri = combine(loaded, combo)
        stem = '+'.join(combo)
        write_svg(tri, os.path.join(args.out, stem + '.svg'))
        write_svg(tri, os.path.join(args.out, stem + '_inv.svg'), invert=True)
        dark = sum(b for _, b in tri.values())
        print('%-28s %4d sombres / %4d claires' % (stem, dark, 1152 - dark))

    print('\n%d familles, %d fichiers dans %s/'
          % (len(combos), 2 * len(combos), args.out))


if __name__ == '__main__':
    main()
