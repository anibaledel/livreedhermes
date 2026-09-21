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
T2 pour C8·B2) : reprise par défaut de la polarité que la planche
ORIGINES (C8·B3) utilise pour la même famille — une hypothèse, pas une
mesure, puisque chaque jeu de planches est tracé indépendamment.

Un contrôle structurel, lui, EST une mesure et ne dépend d'aucune
convention : pour toute famille combinée A+B présente dans le jeu, le
bit sombre extrait de la planche A+B doit être, à une inversion globale
près, le XOR des bits sombres extraits des planches A et B seules — la
combinaison est construite ainsi (tools/familles.py:combine).
measure_pair_parities() mesure les 6 triplets (les 4 bases prises deux à
deux) ; build() compare cette mesure à ce que prédit la polarité
choisie (ORIGINES + --flip) et avertit en cas d'écart — un signal
qu'une planche a sa polarité propre, indépendante de celle d'ORIGINES,
sans dire laquelle des deux membres du triplet est en cause (la mesure
ne contraint que des polarités relatives, pas une polarité absolue,
faute de référent mathématique indépendant côté ORIGINES T2 — voir la
discussion dans la session qui a ajouté ce contrôle).

Vérifié pour ORIGINES T2 (mesure ci-dessus + confirmation d'Anibal par
lecture directe des planches) : la polarité s'inverse pour YIN et
YIN-MUT prises seules, mais pas pour YIN+YIN-MUT (« YIN pur ») — d'où
--flip. Les familles YANG/YANG-MUT montrent un écart similaire qui
n'est PAS couvert par --flip : reste à vérifier à l'œil, comme pour le
triplet YIN.

Usage :
    python3 generate_referent_bicolore_origines.py \\
        --src "data/ORIGINES T2" --trame C8B2 --flip YIN,YIN-MUT \\
        --out data/referent_bicolore_c8b2_v1.json
"""

import argparse
import glob
import itertools
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


def measure_pair_parities(dark_by_key):
    """Pour chaque paire de bases A,B dont la combinaison A+B est aussi
    présente : mesure si dark(A) xor dark(B) égale dark(A+B) (parité 0)
    ou son inverse bit à bit (parité 1) — doit être l'un ou l'autre,
    constant sur les 1152 bits, jamais un mélange, puisque la
    combinaison est construite comme un XOR (familles.py:combine).
    Retourne {(a, b, combo): parité_mesurée}."""
    out = {}
    for a, b in itertools.combinations(F.BASES, 2):
        combo = '+'.join(x for x in F.BASES if x in (a, b))
        if a not in dark_by_key or b not in dark_by_key or combo not in dark_by_key:
            continue
        xor_bits = ''.join('1' if x != y else '0' for x, y in zip(dark_by_key[a], dark_by_key[b]))
        if xor_bits == dark_by_key[combo]:
            out[(a, b, combo)] = 0
        elif xor_bits == ''.join('1' if c == '0' else '0' for c in dark_by_key[combo]):
            out[(a, b, combo)] = 1
        else:
            raise SystemExit(
                f'{a}/{b}/{combo} : dark(A) xor dark(B) ne correspond ni à dark(A+B) '
                'ni à son inverse — planches incohérentes entre elles (pas seulement '
                'une question de polarité).'
            )
    return out


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


def build(src_dir, trame_label, flip=frozenset()):
    files = sorted(glob.glob(os.path.join(src_dir, 'bandes*.svg')))
    if len(files) != 15:
        raise SystemExit(f'{src_dir} : {len(files)} planches au lieu de 15')

    polarity_ref = json.load(open(POLARITY_REF, encoding='utf-8'))['familles']
    unknown_flip = flip - set(polarity_ref)
    if unknown_flip:
        raise SystemExit(f'--flip : famille(s) inconnue(s) {unknown_flip}')

    familles_out = {}
    dark_hex_by_key = {}
    dark_bits_by_key = {}
    layers = None
    used_keys = set()

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
        dark_hex_by_key[key] = dark_hex
        dark_bits_by_key[key] = dark_bits
        light_bits = ''.join('1' if b == '0' else '0' for b in dark_bits)
        light_hex = G._bits_to_hex(light_bits)

        # c=1 : la planche trace en sombre le côté "yin" du champ. Reprise
        # de la convention ORIGINES (YIN_POLARITY_KEYS), inversée pour les
        # familles listées dans --flip.
        c = (key in YIN_POLARITY_KEYS) ^ (key in flip)
        if c:
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

    measured = measure_pair_parities(dark_bits_by_key)
    warnings = []
    for (a, b, combo), measured_parity in measured.items():
        c_a = (a in YIN_POLARITY_KEYS) ^ (a in flip)
        c_b = (b in YIN_POLARITY_KEYS) ^ (b in flip)
        c_combo = (combo in YIN_POLARITY_KEYS) ^ (combo in flip)
        predicted_parity = int(c_a) ^ int(c_b) ^ int(c_combo)
        if predicted_parity != measured_parity:
            warnings.append((a, b, combo))

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
    return doc, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='dossier des 15 planches "bandes*.svg"')
    ap.add_argument('--trame', required=True, help='étiquette de la trame, ex. C8B2')
    ap.add_argument('--out', required=True, help='fichier JSON de sortie')
    ap.add_argument('--flip', default='', help='familles (séparées par des virgules) dont la '
                     'polarité ORIGINES doit être inversée pour ce jeu de planches, ex. YIN,YIN-MUT')
    args = ap.parse_args()

    flip = {k.strip() for k in args.flip.split(',') if k.strip()}
    doc, warnings = build(args.src, args.trame, flip=flip)
    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(args.out) / 1024
    print(f'{args.out} : trame {args.trame}, {len(doc["familles"])} familles, {size_kb:.1f} Ko')
    if flip:
        print(f'Polarité ORIGINES inversée pour : {sorted(flip)}.')
    if warnings:
        print(f'\n{len(warnings)} paire(s) où la parité mesurée sur les planches ne '
              'correspond pas à celle prédite par la polarité choisie (ORIGINES + --flip) '
              '— polarité incertaine pour au moins un des trois, à vérifier à l\'œil :')
        for a, b, combo in warnings:
            print(f'  - {a} / {b} / {combo}')
    print('\nPolarité (yang/yin par famille) : reprise de la convention ORIGINES (C8·B3), '
          'ajustée par --flip — à vérifier à l\'œil sur la page avant diffusion.')


if __name__ == '__main__':
    main()
