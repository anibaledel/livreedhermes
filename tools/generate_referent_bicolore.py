#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_bicolore.py — Générateur de data/referent_bicolore_v1.json

Lit les 4 fonds de base (data/referent_bicolore_src/BASES/, via
familles.py) et la matrice LAYER_OF (tools/generate_referent_360.py,
source unique, non dupliquée) pour produire les 180 calques (15 familles
× 2 teintes × 6 niveaux) au format JSON compact utilisé à la fois côté
navigateur et côté worker (export-bicolore) — même fichier importé des
deux côtés, aucune copie manuelle.

Économie de représentation : les 192 triangles d'un niveau occupent la
même géométrie pour les 15 familles (LAYER_OF ne dépend que de la
cellule, pas de la famille) ; seule la teinte de chaque triangle varie.
On stocke donc, par niveau, la géométrie une seule fois (6 × 192 = 1152
triangles, la totalité de la base), puis pour chaque (famille, niveau)
un masque de bits de 192 positions alignées sur cet ordre. La teinte
Yin n'est jamais stockée séparément : c'est l'inverse bit à bit exact de
la teinte Yang, appliqué au rendu.

Contrôles (voir prompt_page_bicolore.md) :
  - 576/576 sombres/claires par famille (delegue a familles.combine, deja
    verifie a la source).
  - 192 triangles par calque, pour les 6 niveaux et les 15 familles.
  - la superposition des 6 niveaux redonne l'image complète (1152
    triangles, chacun dans exactement un niveau).
  - la teinte Yin est l'inverse exact de la teinte Yang (garanti par
    construction : jamais stockée séparément).
"""

import itertools
import json
import os
import re
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (read_base, combine, BASES, FILES, DEFAULT_SRC)
from generate_referent_360 import LAYER_OF  # noqa: E402  source unique, non dupliquée

OUT_JSON = os.path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json')

TRIANGLES_PER_CELL = 8
CELLS_PER_NIVEAU = 24
TRIANGLES_PER_NIVEAU = TRIANGLES_PER_CELL * CELLS_PER_NIVEAU  # 192
TRIANGLES_TOTAL = 12 * 12 * TRIANGLES_PER_CELL  # 1152

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
    assert len(keys) == TRIANGLES_TOTAL, \
        f'{len(keys)} triangles au lieu de {TRIANGLES_TOTAL}'

    x0, x1, y0, y1 = _triangle_bbox(
        os.path.join(F.DEFAULT_SRC, F.FILES['YIN']))
    cell_w = (x1 - x0) / 12

    # cellule -> triangles de cette cellule (les 8 triangles restent dans
    # la boîte englobante de leur cellule, aucun ne la traverse)
    cell_keys = {}
    for key in keys:
        rc = _cell_of(key[0], key[1], x0, y0, cell_w)
        cell_keys.setdefault(rc, []).append(key)
    assert len(cell_keys) == 144, f'{len(cell_keys)} cellules au lieu de 144'
    for rc, ks in cell_keys.items():
        assert len(ks) == TRIANGLES_PER_CELL, \
            f'cellule {rc} : {len(ks)} triangles au lieu de {TRIANGLES_PER_CELL}'

    # niveau -> ordre canonique des clés de triangle de ce niveau (partagé
    # par les 15 familles : LAYER_OF ne dépend que de la cellule)
    niveau_keys = {n: [] for n in range(1, 7)}
    for (row, col), ks in sorted(cell_keys.items()):
        niveau_keys[LAYER_OF[row][col]].extend(sorted(ks))

    seen = set()
    for n, ks in niveau_keys.items():
        assert len(ks) == TRIANGLES_PER_NIVEAU, \
            f'niveau {n} : {len(ks)} triangles au lieu de {TRIANGLES_PER_NIVEAU}'
        seen.update(ks)
    assert seen == keys, 'les 6 niveaux ne recouvrent pas exactement les 1152 triangles'
    assert sum(len(v) for v in niveau_keys.values()) == TRIANGLES_TOTAL, \
        'un triangle apparaît dans plus d\'un niveau'

    points_of = {key: loaded['YIN'][key][0] for key in keys}

    niveaux_out = [
        {'n': n, 'triangles': [points_of[k] for k in niveau_keys[n]]}
        for n in range(1, 7)
    ]

    combos = [c for size in range(1, 5) for c in itertools.combinations(F.BASES, size)]
    assert len(combos) == 15, f'{len(combos)} familles au lieu de 15'

    familles_out = {}
    for combo in combos:
        tri = F.combine(loaded, combo)
        dark = sum(bit for _, bit in tri.values())
        assert dark == 576, f"{'+'.join(combo)} : {dark} sombres au lieu de 576"

        stem = '+'.join(combo)
        familles_out[stem] = {}
        for n in range(1, 7):
            bits = ''.join(str(tri[k][1]) for k in niveau_keys[n])
            assert len(bits) == TRIANGLES_PER_NIVEAU
            familles_out[stem][str(n)] = bits

    doc = {
        'meta': {
            'triangles_total': TRIANGLES_TOTAL,
            'cells': 144,
            'triangles_par_calque': TRIANGLES_PER_NIVEAU,
            'niveaux': 6,
            'familles': 15,
            'teintes': 2,
            'calques': 15 * 2 * 6,
        },
        'view_box': [0, 0, 375.41, 375.3],
        'dark': '#808285',
        'light': '#a7a9ac',
        'niveaux': niveaux_out,
        'familles': familles_out,
    }
    return doc


def main():
    doc = build()
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(OUT_JSON) / 1024
    print(f'{OUT_JSON} : {len(doc["familles"])} familles, '
          f'{doc["meta"]["calques"]} calques, {size_kb:.1f} Ko')


if __name__ == '__main__':
    main()
