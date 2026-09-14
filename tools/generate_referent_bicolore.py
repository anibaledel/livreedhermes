#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_bicolore.py — Générateur de data/referent_bicolore_v1.json

Lit les 4 fonds de base (data/referent_bicolore_src/BASES/, via
familles.py) et la matrice LAYER_OF (tools/generate_referent_360.py,
source unique, non dupliquée) pour produire les 15 familles au format
plat (masques de bits hexadécimaux) utilisé à la fois côté navigateur et
côté worker — même fichier importé des deux côtés, aucune copie manuelle,
et même format que data/referent_bandes_v1.json (page Cymatique) : les
deux se rendent avec le même module, assets/bicolore-render.js.

Index global d'un triangle (0..1151) : cellules en ordre ligne-major
(row*12+col), puis secteur (0..7) trié par angle depuis le centre de la
cellule, sens horaire depuis le haut (N, NE, E, SE, S, SW, W, NW) —
convention confirmée par recoupement bit-exact contre calques_triangles.json
(donnée de référence livrée indépendamment) ET contre le code du
prototype cymatique.html, qui implémente exactement cette même géométrie.
Voir assets/bicolore-render.js pour le rendu correspondant.

Contrôles :
  - 576/576 sombres/claires par famille (délègue à familles.combine, déjà
    vérifié à la source).
  - 192 triangles par niveau (24 cellules × 8), pour les 6 niveaux.
  - la réunion des 6 niveaux recouvre exactement les 1152 triangles, sans
    chevauchement.
  - la teinte Yin est l'inverse bit à bit exact de la teinte Yang (les
    deux sont stockées explicitement, format calques_triangles.json, pour
    que le module de rendu n'ait aucune logique d'inversion à porter).
"""

import itertools
import json
import math
import os
import re
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (read_base, combine, BASES, FILES, DEFAULT_SRC)
from generate_referent_360 import LAYER_OF  # noqa: E402  source unique, non dupliquée

OUT_JSON = os.path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json')

GRID = 12
PER_CELL = 8
PARTS = GRID * GRID * PER_CELL          # 1152
PER_LAYER = (GRID * GRID // 6) * PER_CELL  # 192 (24 cellules/niveau × 8)

_PTS_RE = re.compile(r'<polygon class="cls-\d+" points="([^"]+)"')


def _triangle_bbox(path):
    """Étendue réelle du dessin (pas le viewBox, qui a une petite marge) :
    min/max des sommets de tous les triangles."""
    src = open(path, encoding='utf-8', errors='ignore').read()
    xs, ys = [], []
    for pts in _PTS_RE.findall(src):
        n = [float(v) for v in pts.replace(',', ' ').split()]
        xs.extend(n[0::2])
        ys.extend(n[1::2])
    return min(xs), max(xs), min(ys), max(ys)


def _cell_of(cx, cy, x0, y0, cell_w):
    col = min(max(int((cx - x0) // cell_w), 0), 11)
    row = min(max(int((cy - y0) // cell_w), 0), 11)
    return row, col


def _global_index_map(keys, x0, y0, cell_w):
    """clé de triangle (centroïde arrondi) -> index global 0..1151 :
    cellules en ordre ligne-major, secteur trié par angle depuis le centre
    de la cellule (sens horaire depuis le haut). Voir docstring du module."""
    cell_keys = {}
    for key in keys:
        rc = _cell_of(key[0], key[1], x0, y0, cell_w)
        cell_keys.setdefault(rc, []).append(key)
    assert len(cell_keys) == GRID * GRID, f'{len(cell_keys)} cellules au lieu de {GRID*GRID}'
    for rc, ks in cell_keys.items():
        assert len(ks) == PER_CELL, f'cellule {rc} : {len(ks)} triangles au lieu de {PER_CELL}'

    index_of = {}
    gi = 0
    for row in range(GRID):
        for col in range(GRID):
            ccx = x0 + (col + 0.5) * cell_w
            ccy = y0 + (row + 0.5) * cell_w

            def angle(key, ccx=ccx, ccy=ccy):
                dx, dy = key[0] - ccx, key[1] - ccy
                return math.atan2(dx, -dy) % (2 * math.pi)

            for key in sorted(cell_keys[(row, col)], key=angle):
                index_of[key] = gi
                gi += 1
    assert gi == PARTS
    return index_of


def _bits_to_hex(bits):
    return ''.join(format(int(bits[i:i + 4], 2), 'x') for i in range(0, len(bits), 4))


def build():
    loaded = {}
    for name, fn in F.FILES.items():
        path = os.path.join(F.DEFAULT_SRC, fn)
        if not os.path.exists(path):
            raise SystemExit('fond manquant : %s' % path)
        loaded[name] = F.read_base(path)

    keys = set(loaded['YIN'])
    for g in loaded.values():
        if set(g) != keys:
            raise SystemExit('les fonds ne partagent pas la même découpe')
    assert len(keys) == PARTS, f'{len(keys)} triangles au lieu de {PARTS}'

    x0, x1, y0, y1 = _triangle_bbox(os.path.join(F.DEFAULT_SRC, F.FILES['YIN']))
    cell_w = (x1 - x0) / GRID

    index_of = _global_index_map(keys, x0, y0, cell_w)

    # niveau -> indices globaux triés (LAYER_OF ne dépend que de la
    # cellule, partagé par les 15 familles)
    layers = {n: [] for n in range(1, 7)}
    for key, gi in index_of.items():
        row, col = _cell_of(key[0], key[1], x0, y0, cell_w)
        layers[LAYER_OF[row][col]].append(gi)
    for n in range(1, 7):
        layers[n].sort()
        assert len(layers[n]) == PER_LAYER, \
            f'niveau {n} : {len(layers[n])} triangles au lieu de {PER_LAYER}'
    seen = set(gi for ks in layers.values() for gi in ks)
    assert seen == set(range(PARTS)), \
        'les 6 niveaux ne recouvrent pas exactement les 1152 triangles'

    combos = [c for size in range(1, 5) for c in itertools.combinations(F.BASES, size)]
    assert len(combos) == 15, f'{len(combos)} familles au lieu de 15'

    familles_out = {}
    for combo in combos:
        tri = F.combine(loaded, combo)
        dark = sum(bit for _, bit in tri.values())
        assert dark == 576, f"{'+'.join(combo)} : {dark} sombres au lieu de 576"

        yang_bits = [None] * PARTS
        for key, (_, bit) in tri.items():
            yang_bits[index_of[key]] = bit
        yang_str = ''.join(str(b) for b in yang_bits)
        yin_str = ''.join('1' if b == '0' else '0' for b in yang_str)

        stem = '+'.join(combo)
        familles_out[stem] = {
            'yang': _bits_to_hex(yang_str),
            'yin': _bits_to_hex(yin_str),
        }

    doc = {
        'format': 'referent-bicolore-v1',
        'decoupe': '8 triangles par cellule, sens horaire depuis le haut',
        'grid': GRID,
        'parts': PARTS,
        'per_cell': PER_CELL,
        'per_layer': PER_LAYER,
        'layers': {str(n): layers[n] for n in range(1, 7)},
        'familles': familles_out,
    }
    return doc


def main():
    doc = build()
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(OUT_JSON) / 1024
    print(f'{OUT_JSON} : {len(doc["familles"])} familles, {size_kb:.1f} Ko')


if __name__ == '__main__':
    main()
