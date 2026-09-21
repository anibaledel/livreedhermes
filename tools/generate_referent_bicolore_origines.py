#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_bicolore_origines.py — variante C8·Bn du référent
bicolore, depuis un dossier de 15 planches tracées "bandes<FAMILLE>.svg"
(une par famille) — à la différence de generate_referent_bicolore.py, qui
lit ses 4 fonds de base dans data/referent_bicolore_src/BASES/.

RÈGLE DE LECTURE — à respecter pour toute trame future (C4, cellule
ronde, etc.) : les quatre bases (YIN, YIN-MUT, YANG, YANG-MUT) SEULES se
lisent dans le dessin, par la couleur de remplissage — #808285 (sombre)
= yang, #a7a9ac (clair) = yang=0 — jamais par le nom de classe SVG, qui
varie d'une planche à l'autre sans rapport avec la couleur qu'il porte.
Mesuré sur les 15 planches ORIGINES (C8·B3) : les 4 bases sont uniformes,
sombre = yang, 4 sur 4, sans exception.

Les ONZE COMBINAISONS ne sont PAS lues dans leur planche : « peindre en
sombre le ou-exclusif de ses bases » n'est pas la seule route qui plaisait
au pinceau, et huit des onze planches combinées d'ORIGINES peignent en
sombre l'inverse de ce ou-exclusif plutôt que le ou-exclusif lui-même —
mesuré, pas supposé (mêmes 15 planches, comparées à
data/referent_bicolore_v1.json avant que cette règle ne soit fixée). Une
planche combinée reste une trace utile — pour vérifier que le tracé est
géométriquement cohérent avec ses deux bases (measure_pair_parities), pas
pour lire une teinte — mais la teinte qui fait foi est celle que calcule
l'algèbre : bit(A+B+...) = bit(A) xor bit(B) xor ... (familles.py:combine,
même définition, même ordre F.BASES). C'est un choix délibéré tranché
par Anibal : « c'est de l'arithmogéométrie que l'on souhaite » — la
combinaison est une opération sur les CHAMPS, pas une chose qu'on peint
puis relit.

Géométrie (grille 12×12, 8 triangles par cellule, 1152 parts) et
algorithme d'indexation — bbox, cellule, secteur trié par angle — repris
tels quels de generate_referent_bicolore.py (_triangle_bbox,
_global_index_map, _bits_to_hex).

Vérifié bit-exact : appliquée aux 15 planches ORIGINES, cette règle (4
bases lues par couleur + 11 combinaisons calculées) reproduit exactement
data/referent_bicolore_v1.json (C8·B3) — la preuve que C8·B3 et C8·B2
suivent une seule et même convention, aucune polarité par planche à
retenir nulle part.

Contrôle structurel (measure_pair_parities) : pour toute paire de bases
A,B dont la planche combinée A+B est aussi présente, dark(A) xor dark(B)
doit égaler dark(A+B) TELLE QUE TRACÉE, ou son inverse bit à bit, jamais
un mélange des deux — sinon la planche combinée n'est géométriquement
pas cohérente avec ses deux bases (une planche mal recalée, par exemple),
ce qui serait un vrai défaut à signaler. Un inverse exact, en revanche,
est normal et attendu (voir ci-dessus : huit des onze le sont) : il ne
signale rien à corriger, puisque la planche combinée ne sert plus qu'au
contrôle, pas à la donnée.

Usage :
    python3 generate_referent_bicolore_origines.py \\
        --src "data/ORIGINES T2" --trame C8B2 \\
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


def extract_dark_bits(path):
    """Bits sombres (1 = #808285) d'une planche, en chaîne '0'/'1', index
    global 0..1151 — même algorithme que generate_referent_bicolore.build().
    Le sens de ce bit (yang, pour les 4 bases) est décidé par l'appelant,
    pas ici : cette fonction ne fait que lire la couleur."""
    tri = F.read_base(path)
    if len(tri) != G.PARTS:
        raise SystemExit(f'{path} : {len(tri)} triangles au lieu de {G.PARTS}')
    x0, x1, y0, y1 = G._triangle_bbox(path)
    cell_w = (x1 - x0) / G.GRID
    index_of = G._global_index_map(set(tri), x0, y0, cell_w)
    bits = [None] * G.PARTS
    for key, (_, bit) in tri.items():
        bits[index_of[key]] = bit
    return ''.join(str(b) for b in bits), index_of


def measure_pair_parities(dark_bits_by_key):
    """Pour chaque paire de bases A,B dont la planche combinée A+B est
    aussi présente : mesure si dark(A) xor dark(B) égale dark(A+B) TELLE
    QUE TRACÉE (parité 0, « même sens ») ou son inverse bit à bit (parité
    1, « inverse exact » — normal, voir docstring du module). Lève une
    erreur seulement si c'est NI L'UN NI L'AUTRE (un mélange, signe d'une
    planche géométriquement incohérente avec ses bases). Retourne
    {(a, b, combo): parité_mesurée}, pour information seulement — ne pèse
    plus sur la teinte écrite en sortie, qui est calculée, pas lue."""
    out = {}
    for a, b in itertools.combinations(F.BASES, 2):
        combo = '+'.join(x for x in F.BASES if x in (a, b))
        if a not in dark_bits_by_key or b not in dark_bits_by_key or combo not in dark_bits_by_key:
            continue
        xor_bits = ''.join('1' if x != y else '0'
                            for x, y in zip(dark_bits_by_key[a], dark_bits_by_key[b]))
        if xor_bits == dark_bits_by_key[combo]:
            out[(a, b, combo)] = 0
        elif xor_bits == ''.join('1' if c == '0' else '0' for c in dark_bits_by_key[combo]):
            out[(a, b, combo)] = 1
        else:
            raise SystemExit(
                f'{a}/{b}/{combo} : dark(A) xor dark(B) ne correspond ni à dark(A+B) tracée '
                'ni à son inverse — un mélange, signe que la planche combinée n\'est pas '
                'géométriquement cohérente avec ses deux bases (mauvais recalage, grille '
                'différente...). À examiner avant de continuer.'
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


def build(src_dir, trame_label):
    files = sorted(glob.glob(os.path.join(src_dir, 'bandes*.svg')))
    if len(files) != 15:
        raise SystemExit(f'{src_dir} : {len(files)} planches au lieu de 15')

    polarity_ref = json.load(open(POLARITY_REF, encoding='utf-8'))['familles']

    dark_bits_by_key = {}
    index_of_by_key = {}
    used_keys = set()

    for path in files:
        fname = os.path.basename(path)
        key = parse_family_key(fname)
        if key in used_keys:
            raise SystemExit(f'{fname} : famille "{key}" déjà vue (nom en double ?)')
        if key not in polarity_ref:
            raise SystemExit(f'{fname} : famille "{key}" absente de {POLARITY_REF}')
        used_keys.add(key)
        dark_bits, index_of = extract_dark_bits(path)
        dark_bits_by_key[key] = dark_bits
        index_of_by_key[key] = index_of

    if used_keys != set(polarity_ref):
        raise SystemExit(f'familles manquantes : {set(polarity_ref) - used_keys}')

    missing_bases = set(F.BASES) - set(dark_bits_by_key)
    if missing_bases:
        raise SystemExit(f'planches de base manquantes : {missing_bases}')

    # Géométrie canonique de la trame : celle des 4 bases, qui doivent
    # être identiques entre elles (même grille, mêmes axes).
    layers = None
    for base in F.BASES:
        index_of = index_of_by_key[base]
        # x0/y0/cell_w ne sont pas conservés par extract_dark_bits ; on
        # les recalcule depuis le même fichier pour compute_layers.
        path = next(p for p in files if parse_family_key(os.path.basename(p)) == base)
        x0, x1, y0, y1 = G._triangle_bbox(path)
        cell_w = (x1 - x0) / G.GRID
        this_layers = compute_layers(index_of, x0, y0, cell_w)
        if layers is None:
            layers = this_layers
        elif layers != this_layers:
            raise SystemExit(f'{base} : niveaux incohérents avec les autres bases — '
                              'les 4 planches de base ne partagent pas la même grille.')

    # Teinte : les 4 bases sont lues (sombre = yang) ; les 11 combinaisons
    # sont CALCULÉES par ou-exclusif des bases, jamais lues sur leur
    # propre planche — voir docstring du module.
    familles_out = {}
    for key in sorted(polarity_ref):
        bases_in_key = key.split('+')
        yang_bits = dark_bits_by_key[bases_in_key[0]]
        for b in bases_in_key[1:]:
            yang_bits = ''.join('1' if x != y else '0'
                                 for x, y in zip(yang_bits, dark_bits_by_key[b]))
        yin_bits = ''.join('1' if c == '0' else '0' for c in yang_bits)
        familles_out[key] = {
            'yang': G._bits_to_hex(yang_bits),
            'yin': G._bits_to_hex(yin_bits),
        }

    # Contrôle structurel sur les planches TELLES QUE TRACÉES (y compris
    # les 11 combinées, lues ici uniquement pour ce contrôle) : aucune ne
    # doit être un mélange par rapport au ou-exclusif de ses bases.
    parities = measure_pair_parities(dark_bits_by_key)

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
    return doc, parities


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='dossier des 15 planches "bandes*.svg"')
    ap.add_argument('--trame', required=True, help='étiquette de la trame, ex. C8B2')
    ap.add_argument('--out', required=True, help='fichier JSON de sortie')
    args = ap.parse_args()

    doc, parities = build(args.src, args.trame)
    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(args.out) / 1024
    print(f'{args.out} : trame {args.trame}, {len(doc["familles"])} familles, {size_kb:.1f} Ko')

    n_same = sum(1 for v in parities.values() if v == 0)
    n_opp = sum(1 for v in parities.values() if v == 1)
    print(f'\nContrôle de parité sur les {len(parities)} paires : {n_same} planche(s) combinée(s) '
          f'peignent en sombre le même sens que le ou-exclusif de leurs bases, {n_opp} peignent '
          'l\'inverse exact — aucun mélange (sinon le script aurait déjà arrêté). '
          'La teinte écrite en sortie est calculée, pas lue : ces deux cas sont normaux.')


if __name__ == '__main__':
    main()
