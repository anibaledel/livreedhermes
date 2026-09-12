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
    référents (identité publique, sans le contenu) et le rapport de
    performance. c_pub N'EST PAS un champ du référent (décision de
    l'auteur, 2026-09-12) : la capacité publique garantie dépend du
    couple (référent, variante Carter qui le lit), jamais du référent
    seul -- voir crypto_core.C_PUB et tools/calibrate_referent.py.
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

# Réutilise les constantes déclaratives de referent6x6_gen.py (COLORS/
# STEGANO_COLORS/CRYPTO_COLOR_ORDER) plutôt que de les redéfinir ici --
# deux listes locales identiques par coïncidence auraient pu diverger
# silencieusement du jeu de couleurs réellement utilisé par le code de
# production qui génère et lit ces référents (même erreur que celle
# corrigée pour c_pub le 2026-09-12).
COLORS = list(G.COLORS)
STEGANO_COLORS = list(G.STEGANO_COLORS)
CRYPTO_COLOR_ORDER = list(G.CRYPTO_COLOR_ORDER)


def _full_doc(n, forms):
    core = {
        'format_version': 'referent-v3',
        'referent_kind': 'referent_6x6_chacha',
        'referent_index': n,
        'grid_size': G.GRID_SIZE,
        'colors': COLORS,
        'stegano_colors': STEGANO_COLORS,
        'crypto_color_order': CRYPTO_COLOR_ORDER,
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
        "chacune) par rejet d'octet (sans biais modulo), rejetee et retiree "
        "si la forme duplique une forme deja retenue dans ce meme referent "
        "(seule contrainte de rejet depuis le 2026-09-12 -- l'ancienne "
        "contrainte de non-alignement, sans effet cryptographique, a ete "
        "retiree ce jour-la). Voir stegano/referent6x6_gen.py pour la "
        "specification complete (normative, a reprendre a l'identique par LH-5)."
    )
    return doc


if __name__ == '__main__':
    t_start = time.time()
    hashes = {}
    total_duplicate_rejects = 0
    debug_docs = {}

    for n in range(G.N_REFERENTS):
        diag = G._DiagCounters()
        forms = G.generate_referent(n, diag=diag)
        total_duplicate_rejects += diag.duplicate_rejects
        hashes[str(n)] = G.referent_hash(n, forms)
        if n in DEBUG_INDICES:
            debug_docs[n] = _full_doc(n, forms)

    t_end = time.time()
    per_referent_ms = (t_end - t_start) / G.N_REFERENTS * 1000
    print(f"{G.N_REFERENTS} referents generes en {t_end - t_start:.2f}s "
          f"({per_referent_ms:.2f} ms/referent)")
    print(f"rejets de doublon (moyenne/referent) : "
          f"{total_duplicate_rejects / G.N_REFERENTS:.4f}")

    hashes_doc = {
        'format_version': 'referent-256-hashes-v1',
        'referent_kind': 'referent_6x6_chacha',
        'n_referents': G.N_REFERENTS,
        'n_forms_per_referent': G.N_FORMS,
        'generator_tool': 'tools/generate_referent_6x6.py (stegano/referent6x6_gen.py)',
        'perf_report': {
            'total_seconds': round(t_end - t_start, 3),
            'ms_per_referent': round(per_referent_ms, 3),
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
