#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_bicolore_c16.py — trame C16·B1, dérivée de C8·B2 (converti en
C16 sans perte — voir cellule_c16.py). C16·B1 n'a pas de planche tracée :
c'est la première trame de ce référent entièrement calculée, pas lue.

LOI DE LECTURE DES BASES (rappel, voir aussi generate_referent_bicolore_
origines.py) : les quatre bases (YIN, YIN-MUT, YANG, YANG-MUT) se lisent
par la couleur de remplissage d'une planche tracée — #808285 = yang —
jamais par le nom de classe SVG. Les onze combinaisons ne se lisent
JAMAIS sur leur propre planche : elles se calculent par ou-exclusif des
bases (familles.py:combine), parce que l'algèbre fait foi sur le dessin
(tranché par Anibal, session du 21 septembre 2026). C16·B1 pousse cette
même loi un cran plus loin : ici, les BASES elles-mêmes n'ont pas de
planche non plus, et se dérivent d'une trame plus grossière — mais
suivant deux règles différentes selon la famille de base, jamais la même
règle pour les deux :

  RÈGLE 1 — bases orthogonales (YIN, YIN-MUT), homothétie par
  application inverse. Le passage d'un bloc au suivant plus fin
  (rapport toujours ½, quels que soient les deux blocs en cause — 3→2 ou
  2→1) N'EST PAS un échantillonnage (garder une case sur deux) : garder
  une case ignore ce qui se passe dans les cases non retenues, justement
  là où une frontière diagonale peut passer, et reconstruit une case
  plate quand la vraie planche est scindée (erreur faite une fois en
  session, avec YIN-MUT). La bonne opération est une application
  inverse, point par point, sans rastérisation intermédiaire : pour
  chaque triangle de la trame d'arrivée, un point intérieur (x,y) en
  coordonnées de case, lu dans la trame de départ au point (2x,2y)
  modulo la taille de la grille.

  RÈGLE 2 — bases diagonales (YANG, YANG-MUT), ou-exclusif avec des
  losanges sur les nœuds libres (la règle du gnomon). B_arrivée =
  B_départ XOR losanges. Un losange de rayon r centré sur un nœud
  (nr,nc) est l'ensemble des points à distance L1 (pavée, modulo la
  grille) <= r de ce nœud. Un nœud d'un réseau de pas donné est "libre"
  si les quatre cases qui le touchent par leur coin portent la même
  teinte à ce coin précis — sinon la frontière de B_départ passe par ce
  nœud (_node_is_free). CONTRAIREMENT À LA RÈGLE 1, le couple (pas du
  réseau, rayon du losange) N'EST PAS fixe d'une transition à l'autre —
  il doit être établi (ou re-vérifié) à chaque fois, jamais réutilisé
  tel quel (erreur faite une fois en session : le couple de B2->B1
  appliqué par erreur à B3->B2). Les deux couples connus à ce jour :
    B3 -> B2 : pas 6, rayon 3, nœuds EXPLICITES (B3 est la planche la
               plus grossière qui existe : pas de réseau plus grossier
               pour les calculer) — YANG : (0,6),(6,0) ; YANG-MUT :
               (0,0),(6,6), une fois réduits modulo la grille.
    B2 -> B1 : pas 3, rayon 1,5, nœuds trouvés par _node_is_free sur B2.

  VALIDATION AVANT D'ÉTENDRE LA RÈGLE 2 (voir validate_b3_to_b2()) :
  puisqu'aucune planche n'existe pour vérifier B2->B1 directement, on
  vérifie le critère de nœud libre LUI-MÊME sur la transition B3->B2,
  qui, elle, a une réponse connue : (a) les nœuds explicites, avec le
  bon (pas, rayon), reproduisent B2 depuis B3 à l'écart nul ; (b)
  _node_is_free, appliqué à B3 sur le réseau de pas 6, retrouve
  EXACTEMENT ces mêmes nœuds. C'est (b), et seulement (b), qui autorise
  à faire confiance à _node_is_free une fois appliqué à B2, où la
  réponse n'est pas connue d'avance. Toute règle 2 future (C4->C4·B2,
  etc.) doit repasser par cette même validation à deux temps avant
  d'être crue sur une transition sans planche.

  POURQUOI LE BLOC DE 1 EXIGE LA CELLULE C16 (et pas C8) : les losanges
  de la règle 2, à B2->B1 (rayon 1,5, pas 3), ont des bords à 45° qui,
  en C8, coupent 192 des 1152 triangles en deux — un triangle ne peut
  pas porter deux teintes. En C16, ces mêmes bords tombent exactement
  sur les diagonales des sous-carrés : 0 triangle coupé sur 2304, parce
  que les diagonales des sous-carrés C16 sont elles-mêmes des droites à
  45° passant par des points à coordonnées demi-entières — la même
  famille de droites que les bords des losanges. Toute trame future dont
  la construction (règle 1 ou 2, ou une nouvelle) produit des frontières
  à 45° à une densité de nœuds plus fine que celle de la cellule en
  cours devra, par le même raisonnement, passer à une cellule plus fine
  encore (voir cellule_c16.py pour le contrat de cellule et comment y
  brancher une nouvelle définition — cellule ronde ou C4 y compris).

Les onze combinaisons : ou-exclusif des quatre bases dérivées ci-dessus,
jamais lues (aucune planche n'existe de toute façon pour C16·B1).
"""

import itertools
import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (BASES)
from cellule_c16 import (  # noqa: E402
    GRID, PER_CELL_C16, PARTS_C16, c16_interior_point, c16_sector_of, convert_c8_to_c16,
)
from generate_referent_360 import LAYER_OF  # noqa: E402  source unique, non dupliquée
from generate_referent_bicolore import PER_LAYER as PER_LAYER_C8  # noqa: E402

DATA_DIR = os.path.join(REPO_ROOT, 'data')
B3_PATH = os.path.join(DATA_DIR, 'referent_bicolore_v1.json')
B2_PATH = os.path.join(DATA_DIR, 'referent_bicolore_c8b2_v1.json')
OUT_PATH = os.path.join(DATA_DIR, 'referent_bicolore_c16b1_v1.json')

PER_LAYER_C16 = PER_LAYER_C8 * (PER_CELL_C16 // 8)  # 384 (24 cellules/niveau x 16)

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


# --- règle 1 : homothétie inverse (bases orthogonales) ---

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


# --- règle 2 : ou-exclusif avec des losanges (bases diagonales) ---

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


def build_bases():
    """Les quatre bases de C16·B1, dérivées de C8·B2 — seulement après
    validate_b3_to_b2()."""
    bases = {}
    for key in ('YIN', 'YIN-MUT'):
        src = load_c16_yang(B2_PATH, key)
        bases[key] = inverse_homothety_c16(src, ratio=2)
    for key in ('YANG', 'YANG-MUT'):
        src = load_c16_yang(B2_PATH, key)
        nodes = free_nodes_of(src, pitch=3)
        bases[key] = gnomon(src, nodes, radius=1.5)
        print(f'{key} : nœuds libres (pas 3, sur B2) = {sorted(nodes)}')
    return bases


def build_layers():
    layers = {n: [] for n in range(1, 7)}
    for row in range(GRID):
        for col in range(GRID):
            n = LAYER_OF[row][col]
            cell = row * GRID + col
            layers[n].extend(range(cell * PER_CELL_C16, (cell + 1) * PER_CELL_C16))
    for n in range(1, 7):
        layers[n].sort()
        assert len(layers[n]) == PER_LAYER_C16, (n, len(layers[n]))
    seen = set(gi for ks in layers.values() for gi in ks)
    assert seen == set(range(PARTS_C16))
    return layers


def measure_pair_parities(dark_by_key):
    """Même contrôle que generate_referent_bicolore_origines.py : pour
    toute paire de bases A,B, dark(A) xor dark(B) doit égaler dark(A+B)
    — ici toujours vrai par construction puisque les combinaisons SONT
    ce calcul, jamais lues sur une planche (voir docstring du module) ;
    le contrôle reste exécuté pour détecter une erreur de code, pas une
    ambiguïté de polarité comme côté ORIGINES."""
    problems = []
    for a, b in itertools.combinations(F.BASES, 2):
        combo = '+'.join(x for x in F.BASES if x in (a, b))
        xor_bits = [x ^ y for x, y in zip(dark_by_key[a], dark_by_key[b])]
        if xor_bits != dark_by_key[combo]:
            problems.append((a, b, combo))
    return problems


def build_c16b1():
    validate_b3_to_b2()
    bases = build_bases()

    familles_bits = dict(bases)
    for size in range(2, 5):
        for combo in itertools.combinations(F.BASES, size):
            key = '+'.join(combo)
            bits = familles_bits[combo[0]]
            for b in combo[1:]:
                bits = [x ^ y for x, y in zip(bits, familles_bits[b])]
            familles_bits[key] = bits
    assert len(familles_bits) == 15, len(familles_bits)

    mixed = measure_pair_parities(familles_bits)
    if mixed:
        raise SystemExit(f'mélange détecté (ne devrait jamais arriver, combinaisons calculées) : {mixed}')
    print(f'contrôle de parité : {len(familles_bits) - 4} combinaison(s) vérifiée(s), aucun mélange.')

    familles_out = {}
    for key, bits in familles_bits.items():
        familles_out[key] = {'yang': bits_to_hex(bits), 'yin': bits_to_hex([1 - b for b in bits])}

    layers = build_layers()

    doc = {
        'format': 'referent-bicolore-v1',
        'trame': 'C16B1',
        'decoupe': '16 triangles par cellule (4 sous-carrés x 4), voir tools/cellule_c16.py',
        'source': 'dérivée de data/referent_bicolore_c8b2_v1.json — aucune planche tracée',
        'grid': GRID,
        'parts': PARTS_C16,
        'per_cell': PER_CELL_C16,
        'per_layer': PER_LAYER_C16,
        'layers': {str(n): layers[n] for n in range(1, 7)},
        'familles': familles_out,
    }
    return doc


if __name__ == '__main__':
    doc = build_c16b1()
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    for key, fam in doc['familles'].items():
        dark = sum(hex_to_bits(fam['yang']))
        print(f'{key:28s} : {dark}/{PARTS_C16} sombres')
    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f'\n{OUT_PATH} : trame C16B1, {len(doc["familles"])} familles, {size_kb:.1f} Ko')
