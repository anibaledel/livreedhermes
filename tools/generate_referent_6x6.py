#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_6x6.py — Générateur de référents 6×6 (format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Composition d'une forme 6×6 (36 cases, décision de l'auteur, 2026-09-12) :
  - 2 couleurs "petites" (6 cases chacune) : blue, orange (= rouge/bleu du
    livre, même forme, autre charte de couleurs — confirmé par l'auteur).
    Stégano = ces 12 cases ensemble, jamais un tirage de l'une ou l'autre.
  - 2 couleurs "grandes" (12 cases chacune) : green, yellow.
    Crypto = les 36 cases (les 4 couleurs).
  Contrainte de génération : dans CHAQUE LIGNE (6 cases), jamais 3 cases
  CONSÉCUTIVES de la MÊME couleur PETITE (blue ou orange, vérifié
  séparément) — les grandes couleurs (green/yellow) sont libres. Vérifiée
  ligne par ligne, PAS sur la séquence aplatie de toute la grille
  (contrairement à l'ancienne contrainte "bariolée" de carter_random.py,
  qui ignorait les frontières de ligne).

Ce script est le générateur "outil" — non normatif. Le port JS et la
bibliothèque Python lisent les JSON produits, ils ne régénèrent jamais.
Les 10 graines Carter-Random restent identiques à avant (mêmes 10
référents "aléatoires").

Référent-256 (carrés magiques du livre) : PAS généré par ce script. Sa
source (new_ech.svg, échiquier 16×16, + verif_carre_magique.py) n'est pas
dans ce dépôt (vérifié, absent) — en attente que l'auteur la fournisse.
data/referent_6x6_seed256_v3.json est un référent ALÉATOIRE de secours
(généré par ce script avec la graine 256, hors des 10 canoniques), PAS le
Référent-256 du livre malgré son nom voisin — à ne pas confondre.
"""
import hashlib
import json
import os
import random
import sys
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, 'data')

CELL_SIZE = 6
N_FORMS = 256
SMALL_COLORS = ['blue', 'orange']     # 6 cases chacune -- stegano
LARGE_COLORS = ['green', 'yellow']    # 12 cases chacune -- crypto seulement
ALL_COLORS = SMALL_COLORS + LARGE_COLORS
COUNTS = {'blue': 6, 'orange': 6, 'green': 12, 'yellow': 12}   # somme = 36

CARTER_RANDOM_SEEDS = [42, 137, 999, 271, 1337, 31415, 27182, 61803, 65537, 99991]
REFERENT_256_SEED = 256   # dedie, hors des 10 graines Carter-Random


def _generate_form(rng):
    """Une forme 6x6 : 36 cases, 6 blue/6 orange/12 green/12 yellow,
    contrainte : par ligne, jamais 3 consecutives de la meme couleur
    PETITE (blue ou orange verifie separement), grandes libres."""
    cells = [(r, c) for r in range(CELL_SIZE) for c in range(CELL_SIZE)]
    for _ in range(5000):
        pool = []
        for color in ALL_COLORS:
            pool += [color] * COUNTS[color]
        rng.shuffle(pool)
        grid = {}
        for pos, color in zip(cells, pool):
            grid[pos] = color

        ok = True
        for r in range(CELL_SIZE):
            for small in SMALL_COLORS:
                run = 0
                for c in range(CELL_SIZE):
                    if grid[(r, c)] == small:
                        run += 1
                        if run > 2:
                            ok = False; break
                    else:
                        run = 0
                if not ok:
                    break
            if not ok:
                break
        if not ok:
            continue

        by_color = {color: [] for color in ALL_COLORS}
        for pos, color in grid.items():
            by_color[color].append(list(pos))
        return by_color
    return None


def _make_forms(seed):
    rng = random.Random(seed)
    forms = []
    while len(forms) < N_FORMS:
        f = _generate_form(rng)
        if f is not None:
            forms.append(f)
    return forms


def canonical_json_bytes(doc):
    return json.dumps(doc, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False).encode('utf-8')


def compute_referent_id(core):
    return hashlib.sha256(canonical_json_bytes(core)).hexdigest()


def build_doc(seed, referent_kind):
    forms = _make_forms(seed)
    forms_out = []
    for i, by_color in enumerate(forms):
        entry = {'id': i}
        for color in ALL_COLORS:
            entry[f'{color}_positions'] = sorted(by_color[color])
        forms_out.append(entry)

    core = {
        'format_version': 'referent-v3',
        'referent_kind': referent_kind,
        'grid_size': CELL_SIZE,
        'colors': ALL_COLORS,
        'stegano_colors': SMALL_COLORS,
        'crypto_color_order': ALL_COLORS,
        'generation_seed': seed,
        'forms': forms_out,
    }
    referent_id = compute_referent_id(core)

    doc = dict(core)
    doc['referent_id'] = referent_id
    doc['generated_at_utc'] = datetime.now(timezone.utc).isoformat()
    doc['generator_tool'] = 'tools/generate_referent_6x6.py'
    doc['n_forms'] = len(forms_out)
    doc['generation_rule'] = (
        "36 cases : blue/orange 6 chacune (couleurs 'petites', stégano — "
        "= rouge/bleu du livre, autre charte de couleurs), green/yellow "
        "12 chacune (couleurs 'grandes', crypto seulement). Par ligne "
        "(6 cases), jamais 3 cases CONSÉCUTIVES de la MÊME couleur petite "
        "(blue ou orange, vérifié séparément) — grandes couleurs libres. "
        "Vérifié ligne par ligne (pas sur la grille aplatie)."
    )
    doc['c_pub'] = None   # rempli par tools/calibrate_referent.py
    return doc


if __name__ == '__main__':
    # Par defaut : les 10 graines canoniques Carter-Random UNIQUEMENT. Le
    # Referent-256 (carres magiques du livre) n'est PAS genere par ce
    # script -- voir le docstring en tete de fichier. Passer 'spare256' en
    # argument pour regenerer le referent aleatoire de secours (graine 256,
    # hors canon) si besoin.
    only = sys.argv[1] if len(sys.argv) > 1 else None

    if only in (None, 'random'):
        for seed in CARTER_RANDOM_SEEDS:
            doc = build_doc(seed, 'referent_6x6_random')
            path = os.path.join(OUT_DIR, f'referent_6x6_seed{seed}_v3.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(doc, f, indent=2)
            print(f"{path} : {doc['n_forms']} formes, referent_id={doc['referent_id'][:16]}...")

    if only == 'spare256':
        doc = build_doc(REFERENT_256_SEED, 'referent_6x6_random')
        path = os.path.join(OUT_DIR, 'referent_6x6_seed256_v3.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(doc, f, indent=2)
        print(f"{path} : {doc['n_forms']} formes, referent_id={doc['referent_id'][:16]}...")
