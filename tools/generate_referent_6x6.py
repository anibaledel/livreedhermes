#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_6x6.py — Génère les 256 référents 6×6 aléatoires (v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Décision de l'auteur (2026-09-12) : 256 référents (au lieu des 10 graines
Carter-Random précédentes), générés par l'algorithme normatif ChaCha20 de
stegano/referent6x6_gen.py (remplace le Mersenne Twister — voir ce module
pour la spécification complète de l'algorithme).

Pas de gros fichier normatif : chaque référent est entièrement déterminé
par son index n in [0,255] et l'algorithme de referent6x6_gen.py — le
recalculer coûte ~5 ms (voir le rapport affiché en fin d'exécution). Ce
script publie donc :
  - data/referents_6x6_v3_hashes.json : SHA-256 de CHACUN des 256
    référents (identité publique, sans le contenu), + le c_pub retenu
    (calibré sur un échantillon, voir tools/calibrate_referent.py) et le
    rapport de performance.
  - data/referent_6x6_index0_v3.json, data/referent_6x6_index1_v3.json :
    JSON complet des référents 0 et 1 SEULEMENT, pour le débogage — les
    254 autres n'existent qu'implicitement (algorithme + hash).

Remplace entièrement l'ancien schéma à 10 graines Carter-Random
(referent_6x6_seed*_v3.json, retirés du dépôt) : ces fichiers étaient un
tirage Mersenne Twister non normatif, incompatible avec la décision
ci-dessus.
"""
import hashlib
import json
import os
import sys
import time

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, 'stegano'))
sys.path.insert(0, REPO_ROOT)
import referent6x6_gen as G  # noqa: E402

OUT_DIR = os.path.join(REPO_ROOT, 'data')
HASHES_PATH = os.path.join(OUT_DIR, 'referents_6x6_v3_hashes.json')
DEBUG_INDICES = (0, 1)

COLORS = ['blue', 'orange', 'green', 'yellow']
STEGANO_COLORS = ['blue', 'orange']


def _full_doc(n, forms):
    core = {
        'format_version': 'referent-v3',
        'referent_kind': 'referent_6x6_chacha',
        'referent_index': n,
        'grid_size': G.GRID_SIZE,
        'colors': COLORS,
        'stegano_colors': STEGANO_COLORS,
        'crypto_color_order': COLORS,
        'forms': [dict(id=i, **{f'{c}_positions': sorted(by_color[c]) for c in COLORS})
                  for i, by_color in enumerate(forms)],
    }
    referent_id = hashlib.sha256(G.canonical_json_bytes(core)).hexdigest()
    doc = dict(core)
    doc['referent_id'] = referent_id
    doc['generator_tool'] = 'tools/generate_referent_6x6.py (stegano/referent6x6_gen.py)'
    doc['n_forms'] = len(forms)
    doc['generation_rule'] = (
        "Genere par HKDF-SHA256(IKM public fixe, salt='Carter-referent6x6-v3', "
        "info=index)  ->  keystream ChaCha20(nonce=0)  ->  256 permutations "
        "Fisher-Yates (36 cases : blue/orange 6 chacune, green/yellow 12 "
        "chacune) par rejet d'octet (sans biais modulo), rejetees et "
        "retirees si une ligne contient 3 cases consecutives de la meme "
        "couleur petite (blue ou orange), ou si la forme duplique une "
        "forme deja retenue dans ce meme referent. Voir "
        "stegano/referent6x6_gen.py pour la specification complete "
        "(normative, a reprendre a l'identique par LH-5)."
    )
    doc['c_pub'] = G.C_PUB_6X6_CHACHA
    return doc


if __name__ == '__main__':
    t_start = time.time()
    hashes = {}
    total_constraint_rejects = 0
    total_duplicate_rejects = 0
    debug_docs = {}

    for n in range(G.N_REFERENTS):
        diag = G._DiagCounters()
        forms = G.generate_referent(n, diag=diag)
        total_constraint_rejects += diag.constraint_rejects
        total_duplicate_rejects += diag.duplicate_rejects
        hashes[str(n)] = G.referent_hash(n, forms)
        if n in DEBUG_INDICES:
            debug_docs[n] = _full_doc(n, forms)

    t_end = time.time()
    per_referent_ms = (t_end - t_start) / G.N_REFERENTS * 1000
    print(f"{G.N_REFERENTS} referents generes en {t_end - t_start:.2f}s "
          f"({per_referent_ms:.2f} ms/referent)")
    print(f"rejets de contrainte (moyenne/referent, sur {G.N_FORMS} formes) : "
          f"{total_constraint_rejects / G.N_REFERENTS:.2f}")
    print(f"rejets de doublon (moyenne/referent) : "
          f"{total_duplicate_rejects / G.N_REFERENTS:.4f}")

    hashes_doc = {
        'format_version': 'referent-256-hashes-v1',
        'referent_kind': 'referent_6x6_chacha',
        'n_referents': G.N_REFERENTS,
        'n_forms_per_referent': G.N_FORMS,
        'generator_tool': 'tools/generate_referent_6x6.py (stegano/referent6x6_gen.py)',
        'c_pub': G.C_PUB_6X6_CHACHA,
        'c_pub_calibration': {
            'method': ('calibre individuellement sur un echantillon de 8 referents '
                       '(voir stegano/referent6x6_gen.py:C_PUB_6X6_CHACHA), variation '
                       'negligeable (390-401) -> une seule valeur commune retenue '
                       '(la plus basse), verifiee a N=8000 sur l\'echantillon.'),
            'sample_indices': [0, 1, 5, 50, 100, 150, 200, 255],
            'sample_calibrated_c_pub': {0: 401, 1: 399, 5: 400, 50: 399,
                                         100: 390, 150: 399, 200: 399, 255: 399},
            'retained_c_pub': G.C_PUB_6X6_CHACHA,
            'verification_n8000_redraw_pct_range': [0.287, 0.500],
        },
        'perf_report': {
            'total_seconds': round(t_end - t_start, 3),
            'ms_per_referent': round(per_referent_ms, 3),
            'mean_constraint_rejects_per_referent': round(
                total_constraint_rejects / G.N_REFERENTS, 3),
            'mean_duplicate_rejects_per_referent': round(
                total_duplicate_rejects / G.N_REFERENTS, 5),
        },
        'hashes': hashes,
    }
    with open(HASHES_PATH, 'w', encoding='utf-8') as f:
        json.dump(hashes_doc, f, indent=2, sort_keys=False)
    print(f"{HASHES_PATH} ecrit ({len(hashes)} hash).")

    for n, doc in debug_docs.items():
        path = os.path.join(OUT_DIR, f'referent_6x6_index{n}_v3.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(doc, f, indent=2)
        print(f"{path} ecrit (debogage) : referent_id={doc['referent_id'][:16]}...")
