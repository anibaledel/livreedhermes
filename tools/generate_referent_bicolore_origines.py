#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_bicolore_origines.py — variante C8·Bn du référent
bicolore, depuis un dossier de 15 planches tracées "bandes<FAMILLE>.svg"
(une par famille, déjà combinée) — à la différence de
generate_referent_bicolore.py, qui recompose les 15 familles par parité à
partir de 4 fonds de base.

Même géométrie (grille 12×12, 8 triangles par cellule, 1152 parts) et même
algorithme d'indexation — bbox, cellule, secteur trié par angle — repris
tels quels de generate_referent_bicolore.py (_triangle_bbox,
_global_index_map, _bits_to_hex) : "le même extracteur", appliqué
directement à chaque planche de famille au lieu de recomposer par parité.

Vérifié bit-exact : les 15 fichiers de data/ORIGINES/, passés par cet
algorithme, reproduisent exactement les 15 familles de
data/referent_bicolore_v1.json (C8·B3) — 8 sur le champ "yang", 7 sur le
champ "yin" (la polarité, sombre = yang ou sombre = yin, est un choix par
planche, pas une règle déductible).

Le nom de fichier encode la famille par tokens, ordre indifférent :
"<PÔLE>" seul → {PÔLE} ; "<PÔLE> MUT" → {PÔLE-MUT} ; "<PÔLE> PUR" →
{PÔLE, PÔLE-MUT}. PÔLE ∈ {YIN, YANG}.

Polarité pour un jeu de planches sans référent JSON propre (ex. ORIGINES
T2 pour C8·B2) : reprise de la polarité que la planche ORIGINES (C8·B3)
utilise pour la même famille, sur l'hypothèse que les deux jeux suivent la
même convention. C'est une hypothèse, pas une mesure — à vérifier à l'œil
sur la page une fois le fichier chargé (--polarity-check l'annonce dans la
sortie pour qu'elle ne passe pas inaperçue).

Usage :
    python3 generate_referent_bicolore_origines.py \\
        --src "data/ORIGINES T2" --trame C8B2 \\
        --out data/referent_bicolore_c8b2_v1.json
"""

import argparse
import glob
import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

import familles as F  # noqa: E402  (read_base, BASES)
import generate_referent_bicolore as G  # noqa: E402
from generate_referent_360 import LAYER_OF  # noqa: E402  source unique, non dupliquée

POLARITY_REF = os.path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json')
POLE_WORDS = {'YIN', 'YANG'}

# Familles où la planche ORIGINES (C8·B3) trace en sombre le côté "yin" du
# champ, et non le côté "yang" — mesuré une fois par comparaison bit à bit
# contre data/referent_bicolore_v1.json (les 8 autres familles tracent en
# sombre le côté "yang"). Pas une règle déductible du nom : une propriété
# de chaque planche, reprise ici pour l'appliquer aux jeux sans référent
# JSON propre (ex. ORIGINES T2). Voir docstring du module.
YIN_POLARITY_KEYS = {
    'YIN+YIN-MUT', 'YIN+YIN-MUT+YANG-MUT', 'YIN+YANG', 'YIN+YANG-MUT',
    'YIN-MUT+YANG', 'YIN+YANG+YANG-MUT', 'YIN-MUT+YANG+YANG-MUT',
}


def parse_family_key(fname):
    """'bandesYIN PUR YANG MUT.svg' -> 'YIN+YIN-MUT+YANG-MUT' (tokens
    d'un même pôle groupés, ordre du nom de fichier indifférent — voir
    docstring du module)."""
    stem = fname[len('bandes'):-len('.svg')].strip()
    tokens = stem.split()
    bases = set()
    i = 0
    while i < len(tokens):
        pole = tokens[i]
        if pole not in POLE_WORDS:
            raise SystemExit(f'{fname} : jeton inattendu "{pole}"')
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


def extract_dark_hex(path):
    """Bits sombres (1) d'une planche, en hex, index global 0..1151 —
    même algorithme que generate_referent_bicolore.build()."""
    tri = F.read_base(path)
    if len(tri) != G.PARTS:
        raise SystemExit(f'{path} : {len(tri)} triangles au lieu de {G.PARTS}')
    x0, x1, y0, y1 = G._triangle_bbox(path)
    cell_w = (x1 - x0) / G.GRID
    index_of = G._global_index_map(set(tri), x0, y0, cell_w)
    bits = [None] * G.PARTS
    for key, (_, bit) in tri.items():
        bits[index_of[key]] = bit
    bit_str = ''.join(str(b) for b in bits)
    return G._bits_to_hex(bit_str), index_of


def compute_layers(index_of, x0, y0, cell_w):
    layers = {n: [] for n in range(1, 7)}
    for key, gi in index_of.items():
        row, col = G._cell_of(key[0], key[1], x0, y0, cell_w)
        layers[LAYER_OF[row][col]].append(gi)
    for n in range(1, 7):
        layers[n].sort()
        if len(layers[n]) != G.PER_LAYER:
            raise SystemExit(f'niveau {n} : {len(layers[n])} triangles au lieu de {G.PER_LAYER}')
    seen = set(gi for ks in layers.values() for gi in ks)
    if seen != set(range(G.PARTS)):
        raise SystemExit('les 6 niveaux ne recouvrent pas exactement les 1152 triangles')
    return layers


def build(src_dir, trame_label):
    files = sorted(glob.glob(os.path.join(src_dir, 'bandes*.svg')))
    if len(files) != 15:
        raise SystemExit(f'{src_dir} : {len(files)} planches au lieu de 15')

    polarity_ref = json.load(open(POLARITY_REF, encoding='utf-8'))['familles']

    familles_out = {}
    layers = None
    used_keys = set()
    yin_polarity_count = 0

    for path in files:
        fname = os.path.basename(path)
        key = parse_family_key(fname)
        if key in used_keys:
            raise SystemExit(f'{fname} : famille "{key}" déjà vue (nom en double ?)')
        if key not in polarity_ref:
            raise SystemExit(f'{fname} : famille "{key}" absente de {POLARITY_REF}')
        used_keys.add(key)

        dark_hex, index_of = extract_dark_hex(path)
        dark_bits = ''.join(format(int(c, 16), '04b') for c in dark_hex)
        light_bits = ''.join('1' if b == '0' else '0' for b in dark_bits)
        light_hex = G._bits_to_hex(light_bits)

        if key in YIN_POLARITY_KEYS:
            familles_out[key] = {'yang': light_hex, 'yin': dark_hex}
        else:
            familles_out[key] = {'yang': dark_hex, 'yin': light_hex}

        x0, x1, y0, y1 = G._triangle_bbox(path)
        cell_w = (x1 - x0) / G.GRID
        this_layers = compute_layers(index_of, x0, y0, cell_w)
        if layers is None:
            layers = this_layers
        elif layers != this_layers:
            raise SystemExit(f'{fname} : niveaux incohérents avec les planches précédentes')

    if used_keys != set(polarity_ref):
        raise SystemExit(f'familles manquantes : {set(polarity_ref) - used_keys}')

    doc = {
        'format': 'referent-bicolore-v1',
        'trame': trame_label,
        'decoupe': '8 triangles par cellule, sens horaire depuis le haut',
        'source': os.path.relpath(src_dir, REPO_ROOT).replace('\\', '/'),
        'grid': G.GRID,
        'parts': G.PARTS,
        'per_cell': G.PER_CELL,
        'per_layer': G.PER_LAYER,
        'layers': {str(n): layers[n] for n in range(1, 7)},
        'familles': familles_out,
    }
    return doc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='dossier des 15 planches "bandes*.svg"')
    ap.add_argument('--trame', required=True, help='étiquette de la trame, ex. C8B2')
    ap.add_argument('--out', required=True, help='fichier JSON de sortie')
    args = ap.parse_args()

    doc = build(args.src, args.trame)
    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(args.out) / 1024
    print(f'{args.out} : trame {args.trame}, {len(doc["familles"])} familles, {size_kb:.1f} Ko')
    print('Polarité (yang/yin par famille) reprise de la convention ORIGINES (C8·B3) — '
          'à vérifier à l\'œil sur la page avant diffusion.')


if __name__ == '__main__':
    main()
