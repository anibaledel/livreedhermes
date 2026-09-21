#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_bicolore_c16.py — trame C16·B1, dérivée de C8·B2 (converti en
C16 sans perte — voir cellule_c16.py), pour les quatre bases :

  Orthogonales (YIN, YIN-MUT) : homothétie inverse — même opération que
  derive_bicolore_homothety.py, rejouée en C16 : pour chaque triangle de
  la trame d'arrivée, un point intérieur (x,y) en coordonnées de case,
  lu dans la trame de départ au point (2x,2y) modulo 12.

  Diagonales (YANG, YANG-MUT) : B_départ XOR losanges (règle du gnomon).
  Un losange de rayon r centré sur un nœud (nr,nc) est l'ensemble des
  points à distance L1 (pavée, modulo 12) <= r de ce nœud. Un nœud du
  réseau de pas `pitch` est "libre" si les quatre cases qui le touchent
  par leur coin portent la même teinte à ce coin précis — sinon la
  frontière de la trame de départ passe par ce nœud (_node_is_free).

  Les DEUX paramètres (pas, rayon) changent selon la transition — ce
  n'est PAS le même couple pour les deux étapes, erreur commise une fois
  en session et corrigée par Anibal :
    B3 -> B2 : pas 6, rayon 3, nœuds EXPLICITES (pas de réseau plus
               grossier pour les calculer ; B3 est la planche la plus
               grossière qui existe) :
                 YANG     : (0,6), (6,0)
                 YANG-MUT : (0,0), (6,6)
               (après réduction modulo 12 des doublons de bord — voir
               validate_b3_to_b2()).
    B2 -> B1 : pas 3, rayon 1,5, nœuds trouvés par _node_is_free sur B2
               (aucune réponse connue pour B1 : le critère doit d'abord
               être validé sur la transition B3->B2, qui EST connue).

Validation avant génération (voir validate_b3_to_b2()) :
  1. Les nœuds explicites B3->B2 ci-dessus, avec pas 6 et rayon 3,
     reproduisent B2 depuis B3 à l'écart nul (0/2304).
  2. _node_is_free, appliqué à B3 sur le réseau de pas 6, retrouve
     EXACTEMENT ces mêmes nœuds pour chacune des deux bases — c'est ce
     test, et lui seul, qui autorise à faire confiance au critère pour
     B2 (où la réponse n'est pas connue d'avance).

11 combinaisons : ou-exclusif des quatre bases, comme partout ailleurs.
"""

import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

from cellule_c16 import (  # noqa: E402
    GRID, PER_CELL_C16, PARTS_C16, c16_interior_point, c16_sector_of, convert_c8_to_c16,
)

DATA_DIR = os.path.join(REPO_ROOT, 'data')
B3_PATH = os.path.join(DATA_DIR, 'referent_bicolore_v1.json')
B2_PATH = os.path.join(DATA_DIR, 'referent_bicolore_c8b2_v1.json')

# Nœuds explicites de la transition B3->B2 (pas 6, rayon 3), vérifiés par
# Anibal côté C8 (0/1152) avant transmission — voir docstring du module.
# Listés en coordonnées 0..12 comme reçus, réduits modulo GRID ici (0 et
# 12 désignent le même nœud, une fois le pavage pris en compte).
_B3_TO_B2_NODES_RAW = {
    'YANG': [(0, 6), (6, 0), (12, 6), (6, 12)],
    'YANG-MUT': [(0, 0), (12, 0), (0, 12), (12, 12), (6, 6)],
}


def _dedup_nodes(nodes):
    return sorted({(r % GRID, c % GRID) for r, c in nodes})


B3_TO_B2_NODES = {k: _dedup_nodes(v) for k, v in _B3_TO_B2_NODES_RAW.items()}


def hex_to_bits(hex_str):
    return [int(c, 16) >> (3 - b) & 1 for c in hex_str for b in range(4)]


def bits_to_hex(bits):
    return ''.join(format(int(''.join(map(str, bits[i:i + 4])), 2), 'x')
                    for i in range(0, len(bits), 4))


def load_c16_yang(path, key):
    doc = json.load(open(path, encoding='utf-8'))
    return convert_c8_to_c16(hex_to_bits(doc['familles'][key]['yang']))


# --- homothétie inverse, en C16 (bases orthogonales) ---

def inverse_homothety_c16(src_bits, ratio=2):
    out = [None] * PARTS_C16
    for row in range(GRID):
        for col in range(GRID):
            for sector in range(PER_CELL_C16):
                px, py = c16_interior_point(sector)
                x, y = (col + px) * ratio % GRID, (row + py) * ratio % GRID
                src_col, src_row = int(x), int(y)
                lx, ly = x - src_col, y - src_row
                src_sector = c16_sector_of(lx, ly)
                src_cell = src_row * GRID + src_col
                dst_cell = row * GRID + col
                out[dst_cell * PER_CELL_C16 + sector] = src_bits[src_cell * PER_CELL_C16 + src_sector]
    return out


# --- losanges (bases diagonales) ---

def _node_is_free(bits, node_row, node_col):
    """Un nœud (coordonnées de case) est libre si les quatre cases qui
    le touchent par leur coin portent la même teinte à ce coin précis —
    sinon la frontière de `bits` passe par ce nœud."""
    corner_bits = set()
    for dr, dc, sector_key in ((-1, -1, 'SE'), (-1, 0, 'SW'), (0, -1, 'NE'), (0, 0, 'NW')):
        row = (node_row + dr) % GRID
        col = (node_col + dc) % GRID
        sub_of_corner = {'NW': 0, 'NE': 1, 'SE': 2, 'SW': 3}[sector_key]
        # les deux triangles du sous-carré dont un sommet touche EXACTEMENT
        # ce coin de la case (pas seulement l'intérieur du sous-carré).
        local_pair = {'NW': (0, 3), 'NE': (0, 1), 'SE': (1, 2), 'SW': (2, 3)}[sector_key]
        cell = row * GRID + col
        for local in local_pair:
            sector = sub_of_corner * 4 + local
            corner_bits.add(bits[cell * PER_CELL_C16 + sector])
    return len(corner_bits) == 1


def _in_diamond(px, py, cx, cy, radius):
    """Point (px,py) dans le losange |px-cx| + |py-cy| <= radius (distance
    L1 pavée, modulo GRID sur chaque axe)."""
    def wrap_delta(a, b):
        d = abs(a - b) % GRID
        return min(d, GRID - d)
    return wrap_delta(px, cx) + wrap_delta(py, cy) <= radius


def diamond_mask(nodes, radius):
    """Masque C16 (1 = dans au moins un des losanges donnés)."""
    mask = [0] * PARTS_C16
    for row in range(GRID):
        for col in range(GRID):
            for sector in range(PER_CELL_C16):
                px, py = c16_interior_point(sector)
                X, Y = col + px, row + py
                for (nr, nc) in nodes:
                    if _in_diamond(X, Y, nc, nr, radius):
                        mask[(row * GRID + col) * PER_CELL_C16 + sector] = 1
                        break
    return mask


def free_nodes_of(bits, pitch):
    return [(nr, nc) for nr in range(0, GRID, pitch) for nc in range(0, GRID, pitch)
            if _node_is_free(bits, nr, nc)]


def gnomon(bits_current, nodes, radius):
    mask = diamond_mask(nodes, radius=radius)
    return [b ^ m for b, m in zip(bits_current, mask)]


def validate_b3_to_b2():
    """Les deux vérifications requises avant de faire confiance au
    critère de nœud libre pour B2->B1 : voir docstring du module.
    Lève une erreur si l'une échoue."""
    ok = True
    for key, nodes in B3_TO_B2_NODES.items():
        src = load_c16_yang(B3_PATH, key)
        actual = load_c16_yang(B2_PATH, key)

        predicted = gnomon(src, nodes, radius=3)
        diffs = sum(1 for a, b in zip(predicted, actual) if a != b)
        print(f'{key} : nœuds explicites {nodes}, rayon 3 -> B2, {diffs}/{PARTS_C16} écarts'
              f' [{"OK" if diffs == 0 else "ÉCHEC"}]')
        ok = ok and diffs == 0

        found = sorted(free_nodes_of(src, pitch=6))
        match = found == sorted(nodes)
        print(f'{key} : critère de nœud libre (pas 6, sur B3) -> {found} '
              f'[{"OK, identique aux nœuds attendus" if match else "ÉCHEC, ne correspond pas"}]')
        ok = ok and match
    if not ok:
        raise SystemExit('validation B3->B2 échouée — voir ci-dessus.')
    print()
    return ok


def build_c16b1():
    """Les quatre bases de C16·B1, dérivées de C8·B2 — seulement après
    validate_b3_to_b2()."""
    familles = {}
    for key in ('YIN', 'YIN-MUT'):
        src = load_c16_yang(B2_PATH, key)
        yang = inverse_homothety_c16(src, ratio=2)
        familles[key] = {'yang': bits_to_hex(yang), 'yin': bits_to_hex([1 - b for b in yang])}
    for key in ('YANG', 'YANG-MUT'):
        src = load_c16_yang(B2_PATH, key)
        nodes = free_nodes_of(src, pitch=3)
        yang = gnomon(src, nodes, radius=1.5)
        familles[key] = {'yang': bits_to_hex(yang), 'yin': bits_to_hex([1 - b for b in yang])}
        print(f'{key} : nœuds libres (pas 3, sur B2) = {sorted(nodes)}')
    return familles


if __name__ == '__main__':
    validate_b3_to_b2()
    familles = build_c16b1()
    doc = {
        'format': 'referent-bicolore-v1-partiel',
        'trame': 'C16B1',
        'note': 'Quatre bases seulement (YIN, YIN-MUT, YANG, YANG-MUT) — les onze '
                'combinaisons manquent encore, calculables par ou-exclusif une fois '
                'ces bases confirmées à l\'œil par Anibal.',
        'grid': GRID,
        'parts': PARTS_C16,
        'per_cell': PER_CELL_C16,
        'familles': familles,
    }
    out_path = os.path.join(DATA_DIR, 'referent_bicolore_c16b1_bases_v1.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    for key, fam in familles.items():
        dark = sum(hex_to_bits(fam['yang']))
        print(f'{key} : {dark}/{PARTS_C16} sombres')
    print(f'\n{out_path} : trame C16B1 (partielle), {len(familles)} base(s)')
