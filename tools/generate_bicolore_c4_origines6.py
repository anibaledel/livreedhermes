#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_bicolore_c4_origines6.py — trame C4·B3, depuis data/ORIGINES 6/
(cellule C4, voir cellule_c4.py).

LOI (même loi que C16·B1 et C8·B2, voir generate_referent_bicolore_
origines.py et generate_bicolore_c16.py) : les quatre bases se lisent
par la couleur de remplissage (#808285 = yang), jamais par le nom de
classe SVG. Les onze combinaisons se CALCULENT par ou-exclusif des
bases, jamais lues sur leur propre planche.

CONTRÔLE DE PARITÉ (measure_pair_parities) : chaque planche combinée,
TELLE QUE TRACÉE, doit égaler le ou-exclusif calculé de ses bases, ou
son inverse exact, jamais un mélange. Ici ce contrôle sert doublement :
il valide la loi ET l'extraction elle-même — la moindre erreur de
correspondance nom-de-fichier/famille, ou la moindre triangle mal lu
par extract_dark_bits(), aurait de bonnes chances de casser la relation
XOR propre pour au moins une des 11 paires. Zéro mélange sur les 11 est
donc une preuve, pas une formalité.

NOMMAGE PROPRE À data/ORIGINES 6/ — voir cellule_c4.py et
parse_family_key() ci-dessous : codes à deux lettres ya/ay/yi/iy fixés
par Anibal ; « SANS <base> » = la combinaison à trois qui EXCLUT cette
base ; bandesYANG YING MUT.svg porte une coquille (YING pour YIN).

NATURE DE C4·B3 : PAS C8·B3 redessiné dans une cellule plus grossière.
Comparée bit à bit à C8·B3 réduit à C4 (voir tools/cellule_c4.py,
convert_c8_to_c4 — C8·B3 s'y réduit sans perte, aucun mélange), aucune
des 15 familles ne correspond, ni à l'identique ni à l'inverse exact :
un autre dessin. Voir le rapport de session pour la piste retenue
(la construction « bandes » d'un script d'enquête antérieur retrouvé
séparément : bandes(F) = T1(F) xor hachure(F), une hachure de losanges
concentriques dont le réseau de centres correspond exactement, coordonnée
pour coordonnée, à celui déjà validé pour le gnomon de C16·B1 — confirmé
pour les deux bases diagonales seules, pas encore pour les combinaisons
avec les bases orthogonales).
"""

import itertools
import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (BASES)
from generate_referent_360 import LAYER_OF  # noqa: E402  source unique, non dupliquée
from cellule_c4 import GRID, PER_CELL_C4, PARTS_C4  # noqa: E402
from extract_origines6 import extract_dark_bits  # noqa: E402

DATA_DIR = os.path.join(REPO_ROOT, 'data')
SRC_DIR = os.path.join(DATA_DIR, 'ORIGINES 6')
B3_C8_PATH = os.path.join(DATA_DIR, 'referent_bicolore_v1.json')
OUT_PATH = os.path.join(DATA_DIR, 'referent_bicolore_c4b3_v1.json')
PER_LAYER_C4 = (GRID * GRID // 6) * PER_CELL_C4  # 96 (24 cellules/niveau x 4)

POLE_WORDS = {'YIN', 'YING', 'YANG'}
_NORM_POLE = {'YIN': 'YIN', 'YING': 'YIN', 'YANG': 'YANG'}  # YING -> YIN (coquille)


def parse_family_key(fname):
    stem = fname[len('bandes'):-len('.svg')].strip()
    tokens = stem.split()

    if tokens[0] == 'SANS':
        excluded_pole = _NORM_POLE[tokens[1]]
        excluded_is_mut = len(tokens) > 2 and tokens[2] == 'MUT'
        excluded = excluded_pole + ('-MUT' if excluded_is_mut else '')
        return '+'.join(b for b in F.BASES if b != excluded)

    bases = set()
    i = 0
    while i < len(tokens):
        pole = _NORM_POLE[tokens[i]]
        nxt = tokens[i + 1] if i + 1 < len(tokens) else None
        if nxt == 'MUT':
            bases.add(f'{pole}-MUT')
            i += 2
        elif nxt == 'PUR':
            bases.add(pole)
            bases.add(f'{pole}-MUT')
            i += 2
        else:
            bases.add(pole)
            i += 1
    ordered = [b for b in F.BASES if b in bases]
    if not ordered:
        raise SystemExit(f'{fname} : aucune base reconnue')
    return '+'.join(ordered)


def hex_to_bits(hex_str):
    return [int(c, 16) >> (3 - b) & 1 for c in hex_str for b in range(4)]


def bits_to_hex(bits):
    return ''.join(format(int(''.join(map(str, bits[i:i + 4])), 2), 'x')
                    for i in range(0, len(bits), 4))


def load_all():
    """{clé famille: bits sombres tels que tracés (576)} pour les 15
    planches ORIGINES 6."""
    out = {}
    used_keys = set()
    for fname in sorted(os.listdir(SRC_DIR)):
        if not (fname.startswith('bandes') and fname.endswith('.svg')):
            continue
        key = parse_family_key(fname)
        if key in used_keys:
            raise SystemExit(f'{fname} : famille "{key}" déjà vue (nom en double ?)')
        used_keys.add(key)
        out[key] = extract_dark_bits(os.path.join(SRC_DIR, fname))
    if used_keys != set(F.BASES) | {'+'.join(c) for n in range(2, 5) for c in itertools.combinations(F.BASES, n)}:
        raise SystemExit(f'familles manquantes ou en trop : {used_keys}')
    return out


def measure_pair_parities(drawn, computed):
    """Pour chaque famille combinée : la planche tracée doit égaler le
    calcul ou son inverse exact — jamais un mélange. Retourne la liste
    des familles en mélange (devrait toujours être vide, voir docstring)."""
    mixed = []
    for key in computed:
        if key in F.BASES:
            continue
        d, c = drawn[key], computed[key]
        same = d == c
        opposite = all(a == 1 - b for a, b in zip(d, c))
        if not same and not opposite:
            mixed.append(key)
    return mixed


def build_layers():
    layers = {n: [] for n in range(1, 7)}
    for row in range(GRID):
        for col in range(GRID):
            n = LAYER_OF[row][col]
            cell = row * GRID + col
            layers[n].extend(range(cell * PER_CELL_C4, (cell + 1) * PER_CELL_C4))
    for n in range(1, 7):
        layers[n].sort()
        assert len(layers[n]) == PER_LAYER_C4, (n, len(layers[n]))
    seen = set(gi for ks in layers.values() for gi in ks)
    assert seen == set(range(PARTS_C4))
    return layers


def build():
    drawn = load_all()

    computed = {b: drawn[b] for b in F.BASES}
    for size in range(2, 5):
        for combo in itertools.combinations(F.BASES, size):
            key = '+'.join(combo)
            bits = computed[combo[0]]
            for b in combo[1:]:
                bits = [x ^ y for x, y in zip(bits, computed[b])]
            computed[key] = bits

    mixed = measure_pair_parities(drawn, computed)
    if mixed:
        raise SystemExit(f'mélange détecté (planche combinée ni identique ni inverse exact) : {mixed}')

    familles_out = {}
    for key, bits in computed.items():
        familles_out[key] = {'yang': bits_to_hex(bits), 'yin': bits_to_hex([1 - b for b in bits])}

    layers = build_layers()

    doc = {
        'format': 'referent-bicolore-v1',
        'trame': 'C4B3',
        'decoupe': '4 triangles par cellule (coupée par ses deux diagonales), voir tools/cellule_c4.py',
        'source': 'data/ORIGINES 6/ — bases lues par la couleur, onze combinaisons calculées',
        'grid': GRID,
        'parts': PARTS_C4,
        'per_cell': PER_CELL_C4,
        'per_layer': PER_LAYER_C4,
        'layers': {str(n): layers[n] for n in range(1, 7)},
        'familles': familles_out,
    }
    return doc, len(computed) - 4  # nombre de combinaisons contrôlées


if __name__ == '__main__':
    doc, n_checked = build()
    print(f'contrôle de parité : {n_checked} combinaison(s) vérifiée(s) contre leur planche tracée, aucun mélange.')
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    for key, fam in doc['familles'].items():
        dark = sum(hex_to_bits(fam['yang']))
        print(f'{key:<28} : {dark}/{PARTS_C4} sombres')
    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f'\n{OUT_PATH} : trame C4B3, {len(doc["familles"])} familles, {size_kb:.1f} Ko')
