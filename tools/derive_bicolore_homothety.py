#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
derive_bicolore_homothety.py — dérive une base bicolore orthogonale (YIN,
YIN-MUT) d'une trame plus fine à partir d'une trame existante, par
homothétie de rapport ½, pour les blocs qui n'ont pas de planche tracée
(ex. C8·B1, qui n'existe pas chez Anibal — seuls C8·B3 et C8·B2 sont
tracés).

L'OPÉRATION — établie et vérifiée avec Anibal, à ne pas réinventer :
compresser chaque bloc de 2×2 cases de la trame de départ en une seule
case de la trame d'arrivée n'est PAS un échantillonnage (garder une case
sur deux) : un échantillonnage ignore ce qui se passe à l'intérieur des
cases non retenues, et c'est justement là qu'une frontière diagonale
peut passer — d'où une case reconstruite plate là où la vraie planche
est scindée. La bonne opération est une application inverse, point par
point, sans rastérisation intermédiaire : pour chaque triangle de la
trame d'arrivée, on prend un point intérieur (x, y) en coordonnées de
case (pas en pixels — indépendant de la taille du fichier), et on lit la
teinte de la trame de départ au point (2x, 2y), modulo la taille de la
grille (le pavage). Le point est choisi à mi-hauteur du triangle,
suffisamment loin de ses bords pour ne jamais tomber sur une frontière.

Vérifié bit-exact : appliquée à C8·B3 (data/referent_bicolore_v1.json),
cette opération reproduit C8·B2 (data/referent_bicolore_c8b2_v1.json) à
l'écart nul sur les 1152 triangles, pour YIN, YIN-MUT ET YIN+YIN-MUT
(« YIN pur ») — familles orthogonales et leur combinaison, donc valable
aussi bien sur une base lue que sur une teinte calculée par ou-exclusif,
puisque l'opération ne regarde que la géométrie, pas l'origine de la
teinte. C'est cette reproduction, à zéro écart, qui valide l'opération
avant de l'appliquer à une trame qui n'a pas de planche pour vérifier.

Ne s'applique QUE aux familles orthogonales (YIN, YIN-MUT) : les
familles diagonales (YANG, YANG-MUT) suivent la règle du gnomon, pas
une homothétie simple — voir generate_gnomon_candidates.py.

Usage :
    python3 derive_bicolore_homothety.py \\
        --src data/referent_bicolore_c8b2_v1.json --bases YIN,YIN-MUT \\
        --trame C8B1 --out data/referent_bicolore_c8b1_v1.json
"""

import argparse
import json
import math
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (BASES)
import generate_referent_bicolore as G  # noqa: E402

GRID = G.GRID
PER_CELL = G.PER_CELL
PARTS = G.PARTS

# Huit points "arête" du triangle-éventail d'une case unitaire [0,1)x[0,1),
# même géométrie que cellTriangles() dans assets/bicolore-render.js (sens
# horaire depuis le haut : N, NE, E, SE, S, SW, W, NW).
_EDGE = [(0.5, 0.0), (1.0, 0.0), (1.0, 0.5), (1.0, 1.0),
         (0.5, 1.0), (0.0, 1.0), (0.0, 0.5), (0.0, 0.0)]
_CENTER = (0.5, 0.5)


def _interior_point(sector):
    """Point à mi-hauteur du triangle `sector` (0..7) d'une case unitaire —
    assez loin du centre (fin) et du bord (frontière) pour ne jamais
    tomber sur une discontinuité de teinte."""
    ex, ey = _EDGE[sector]
    fx, fy = _EDGE[(sector + 1) % 8]
    far_mid = ((ex + fx) / 2, (ey + fy) / 2)
    return ((_CENTER[0] + far_mid[0]) / 2, (_CENTER[1] + far_mid[1]) / 2)


def _sector_of(lx, ly):
    """Secteur (0..7) du point local (lx,ly) dans [0,1)x[0,1) — même
    convention d'angle que generate_referent_bicolore._global_index_map
    (sens horaire depuis le haut)."""
    dx, dy = lx - 0.5, ly - 0.5
    angle = math.atan2(dx, -dy) % (2 * math.pi)
    return int(angle // (math.pi / 4)) % 8


def inverse_homothety(src_bits, ratio=2):
    """bits (liste 0/1, longueur PARTS, index global standard) de la
    trame de départ -> bits de la trame d'arrivée, par application
    inverse point par point (voir docstring du module)."""
    out = [None] * PARTS
    for row in range(GRID):
        for col in range(GRID):
            for sector in range(PER_CELL):
                px, py = _interior_point(sector)
                x, y = (col + px) * ratio % GRID, (row + py) * ratio % GRID
                src_col, src_row = int(x), int(y)
                lx, ly = x - src_col, y - src_row
                src_sector = _sector_of(lx, ly)
                src_cell = src_row * GRID + src_col
                dst_cell = row * GRID + col
                out[dst_cell * PER_CELL + sector] = src_bits[src_cell * PER_CELL + src_sector]
    return out


def hex_to_bits(hex_str):
    return [int(c, 16) >> (3 - b) & 1 for c in hex_str for b in range(4)]


def bits_to_hex(bits):
    return ''.join(format(int(''.join(map(str, bits[i:i + 4])), 2), 'x')
                    for i in range(0, len(bits), 4))


def self_test():
    """Vérifie que l'homothétie inverse reproduit C8·B2 depuis C8·B3 à
    l'écart nul, pour YIN, YIN-MUT et YIN+YIN-MUT (« YIN pur ») — la
    preuve avant d'appliquer l'opération à une trame sans planche de
    contrôle (C8·B1). Lève une erreur si un seul triangle diffère."""
    b3 = json.load(open(os.path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json'), encoding='utf-8'))
    b2 = json.load(open(os.path.join(REPO_ROOT, 'data', 'referent_bicolore_c8b2_v1.json'), encoding='utf-8'))
    for key in ('YIN', 'YIN-MUT', 'YIN+YIN-MUT'):
        src_bits = hex_to_bits(b3['familles'][key]['yang'])
        predicted = inverse_homothety(src_bits, ratio=2)
        actual = hex_to_bits(b2['familles'][key]['yang'])
        diffs = sum(1 for a, b in zip(predicted, actual) if a != b)
        status = 'OK' if diffs == 0 else 'ÉCHEC'
        print(f'auto-test {key} : C8·B3 -> C8·B2 par homothétie inverse, {diffs}/{PARTS} écarts [{status}]')
        if diffs:
            raise SystemExit(f'auto-test échoué pour {key} : {diffs} triangles différents')
    print('auto-test : les trois familles se reproduisent à l\'écart nul — opération validée.\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', help='fichier referent_bicolore JSON de la trame de départ')
    ap.add_argument('--bases', help='bases orthogonales à dériver, séparées par des virgules (ex. YIN,YIN-MUT)')
    ap.add_argument('--trame', help='étiquette de la trame dérivée, ex. C8B1')
    ap.add_argument('--out', help='fichier JSON de sortie (bases dérivées seulement)')
    ap.add_argument('--ratio', type=int, default=2, help='rapport de l\'homothétie inverse (défaut 2)')
    ap.add_argument('--self-test', action='store_true',
                     help='vérifie l\'opération contre C8·B3/C8·B2 (voir self_test()) puis quitte')
    args = ap.parse_args()

    if args.self_test:
        self_test()
        if not args.src:
            return

    if not (args.src and args.bases and args.trame and args.out):
        raise SystemExit('--src, --bases, --trame et --out sont requis (sauf --self-test seul)')

    src_doc = json.load(open(args.src, encoding='utf-8'))
    bases = [b.strip() for b in args.bases.split(',') if b.strip()]

    out_familles = {}
    for base in bases:
        if base not in F.BASES:
            raise SystemExit(f'{base} : pas une base ({F.BASES})')
        if base not in src_doc['familles']:
            raise SystemExit(f'{base} : absente de {args.src}')
        src_bits = hex_to_bits(src_doc['familles'][base]['yang'])
        yang_bits = inverse_homothety(src_bits, ratio=args.ratio)
        yin_bits = [1 - b for b in yang_bits]
        out_familles[base] = {'yang': bits_to_hex(yang_bits), 'yin': bits_to_hex(yin_bits)}
        dark = sum(yang_bits)
        print(f'{base} : {dark} sombres / {PARTS - dark} claires (attendu 576/576)')

    doc = {
        'format': 'referent-bicolore-v1-partiel',
        'trame': args.trame,
        'note': 'Bases orthogonales seulement, dérivées par homothétie inverse depuis '
                + os.path.relpath(args.src, REPO_ROOT).replace('\\', '/')
                + '. Bases diagonales (YANG, YANG-MUT) et les onze combinaisons manquent '
                  'encore — voir generate_gnomon_candidates.py.',
        'grid': GRID,
        'parts': PARTS,
        'per_cell': PER_CELL,
        'familles': out_familles,
    }
    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    print(f'\n{args.out} : trame {args.trame} (partielle), {len(out_familles)} base(s)')


if __name__ == '__main__':
    main()
