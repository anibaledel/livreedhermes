#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
recalibrate_carter_v3.py — Campagne de recalibration C_PUB (câblage v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Recalibre C_PUB pour les SEPT variantes câblées : carter256, carter360,
cartermix, carterrandom90, carterrandom360, carter18, carterhybrid.
(Historique : lors du câblage de la règle de lecture v3, 12 positions
stégano/bloc au lieu de 6, Carter-18 n'avait pas eu besoin d'être
recalibré -- sa géométrie n'avait pas changé. Le câblage de la cascade
(2026-09-21) change en revanche le seuil de capacité pour TOUTES les
variantes migrées, Carter-18 compris : voir carter_random.py::
_find_carter18_grammar_with_c_pub.)

Méthode IDENTIQUE à celle déjà en place dans crypto_core.py (règle de la
tâche 4) : plus grand C_PUB tel que le taux de REDRAW (pas le taux
d'échec) reste < 1 % sur N clés — mesuré en appelant directement les
fonctions de recherche de grammaire de PRODUCTION
(_find_grammar_with_c_pub et consorts), jamais une réimplémentation,
avec C_PUB temporairement substitué (monkey-patch de crypto_core.C_PUB,
restauré après chaque mesure). Le nombre de tentatives réellement
effectuées est compté via vectors_internal._count_redraw_attempts (déjà
utilisée par le mode vecteurs, aucune duplication).

Câblage cascade (2026-09-21) : chaque variante porte désormais son propre
capacity_fn (VARIANTS ci-dessous) — CC.max_message_for par défaut, ou
CC.max_message_for_cascade pour Carter-256, seule variante migrée vers la
cascade à cette date (voir carter.py::encode_carter, docs/CASCADE_V1.md).
--variants restreint la campagne à une liste de variantes (ex.
--variants carter256) : recalibrer une seule variante n'écrit et ne
mesure QUE celle-là, les autres restent inchangées.

Usage :
    python tools/recalibrate_carter_v3.py [--n-keys 10000] [--apply] [--variants carter256]

Sans --apply : affiche seulement les valeurs recalibrées (dry-run).
Avec --apply : écrit les nouvelles valeurs dans crypto_core.py C_PUB.
"""
import argparse
import os
import re
import secrets
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, 'stegano'))

import crypto_core as CC
import carter as CT
import carter_random as CR
import stegano_classic as SC
from vectors_internal import _count_redraw_attempts

REF256_V3 = SC.load_referent_256_v3()
REF360_V3 = SC.load_referent_360_v3()


def _measure(module, variant_key, search_fn_for_key, candidate, n_keys,
             capacity_fn=None):
    """search_fn_for_key(master_key) -> callable() qui appelle la fonction
    de recherche de PRODUCTION et renvoie un tuple dont le DERNIER élément
    est n_pos. Retourne (redraw_pct, fail_pct, mean_cap).

    capacity_fn (câblage cascade, 2026-09-21) : CC.max_message_for par
    défaut (None) -- Carter-256 passe CC.max_message_for_cascade, pour que
    la mesure reflète la capacité RÉELLEMENT utilisée par
    carter._find_grammar_with_c_pub (son propre capacity_fn, voir
    carter.py) plutôt que celle du format simple."""
    capacity_fn = capacity_fn or CC.max_message_for
    original = CC.C_PUB[variant_key]
    CC.C_PUB[variant_key] = candidate
    try:
        redraws = 0
        fails = 0
        caps = []
        for _ in range(n_keys):
            key = secrets.token_bytes(32)
            try:
                result, attempts = _count_redraw_attempts(module, search_fn_for_key(key))
                n_pos = result[-1]
                caps.append(capacity_fn(n_pos))
                if attempts > 1:
                    redraws += 1
            except ValueError:
                fails += 1
        mean_cap = sum(caps) / len(caps) if caps else None
        return (100 * redraws / n_keys, 100 * fails / n_keys, mean_cap)
    finally:
        CC.C_PUB[variant_key] = original


def _calibrate(module, variant_key, search_fn_for_key, n_keys, target_redraw_pct=1.0,
                capacity_fn=None):
    """Recherche par dichotomie le plus grand candidat tel que
    redraw < target_redraw_pct% et fail == 0%, en bornant la recherche par
    la distribution brute (ctr=0 implicite, via une mesure au candidat
    p1 estimé) -- même méthodologie que tools/calibrate_referent.py."""
    # Bornage initial : mesure à un candidat bas (garanti sans redraw) pour
    # obtenir mean_cap, puis élargit la fenêtre de recherche autour.
    _, _, mean_cap = _measure(module, variant_key, search_fn_for_key, 1, min(n_keys, 500),
                               capacity_fn=capacity_fn)
    hi = int(mean_cap * 1.5) if mean_cap else 2000
    lo, best = 1, None
    print(f"  [{variant_key}] fenetre de recherche initiale : [1, {hi}]")
    while lo <= hi:
        mid = (lo + hi) // 2
        redraw_pct, fail_pct, mean_cap = _measure(
            module, variant_key, search_fn_for_key, mid, n_keys, capacity_fn=capacity_fn)
        print(f"  [{variant_key}] c_pub={mid} -> redraw={redraw_pct:.2f}% "
              f"fail={fail_pct:.3f}% mean_cap={mean_cap:.1f}")
        if redraw_pct < target_redraw_pct and fail_pct == 0.0:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best


# ── Constructeurs de search_fn par variante ─────────────────────────────────

def _sf_carter256(master_key):
    _, gk = CT._carter_split(master_key)
    return lambda: CT._find_grammar_with_c_pub(
        gk, 'carter256',
        lambda k: CT._carter_grammar(k, REF256_V3),
        lambda g: CT._carter_message_positions(g, REF256_V3))

def _sf_carter360(master_key):
    _, gk = CT._carter360_split(master_key)
    return lambda: CT._find_grammar_with_c_pub(
        gk, 'carter360',
        lambda k: CT._carter360_grammar(k, REF360_V3),
        lambda g: CT._carter360_message_positions(g, REF360_V3))

def _sf_cartermix(master_key):
    _, gk = CT._carter_mix_split(master_key)
    return lambda: CT._find_grammar_with_c_pub(
        gk, 'cartermix',
        lambda k: CT._carter_mix_grammar(k, REF256_V3, REF360_V3),
        lambda g: CT._mix_message_positions(g, REF256_V3, REF360_V3))

def _sf_carterrandom90(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_random_grammar_with_c_pub(gk, 90, capacity_fn=CC.max_message_for_cascade)

def _sf_carterrandom360(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_random_grammar_with_c_pub(gk, 180, capacity_fn=CC.max_message_for_cascade)

def _sf_carter18(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_carter18_grammar_with_c_pub(gk, CR.GRID_SIZE, capacity_fn=CC.max_message_for_cascade)

def _sf_carterhybrid(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_hybrid_grammar_with_c_pub(gk, CR.GRID_SIZE, capacity_fn=CC.max_message_for_cascade)


# capacity_fn : None = CC.max_message_for (format simple). Toutes les
# variantes ci-dessous sont désormais câblées sur la cascade (2026-09-21,
# voir carter.py/carter_random.py) -- leur recherche de grammaire utilise
# CC.max_message_for_cascade en production, donc leur recalibration doit
# mesurer la MÊME fonction, pas le format simple. capacity_fn est déjà
# appliqué DANS chaque search_fn ci-dessus (elles passent capacity_fn=
# CC.max_message_for_cascade à leur fonction de recherche de production) ;
# il est répété ici pour que _measure() mesure la même capacité côté
# rapport (mean_cap affiché).
VARIANTS = [
    ('carter256',       CT, _sf_carter256, CC.max_message_for_cascade),
    ('carter360',       CT, _sf_carter360, CC.max_message_for_cascade),
    ('cartermix',       CT, _sf_cartermix, CC.max_message_for_cascade),
    ('carterrandom90',  CR, _sf_carterrandom90, CC.max_message_for_cascade),
    ('carterrandom360', CR, _sf_carterrandom360, CC.max_message_for_cascade),
    ('carter18',        CR, _sf_carter18, CC.max_message_for_cascade),
    ('carterhybrid',    CR, _sf_carterhybrid, CC.max_message_for_cascade),
]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--n-keys', type=int, default=10000)
    p.add_argument('--apply', action='store_true',
                    help='ecrit les nouvelles valeurs dans crypto_core.py')
    p.add_argument('--variants', type=str, default=None,
                    help='liste separee par des virgules (ex. carter256) -- '
                         'toutes par defaut. Recalibrer une seule variante '
                         'ne touche pas C_PUB des autres.')
    a = p.parse_args()

    selected = VARIANTS
    if a.variants:
        wanted = set(a.variants.split(','))
        selected = [v for v in VARIANTS if v[0] in wanted]
        unknown = wanted - {v[0] for v in VARIANTS}
        if unknown:
            raise SystemExit(f"variante(s) inconnue(s) : {sorted(unknown)}")

    results = {}
    for variant_key, module, sf, capacity_fn in selected:
        print(f"\n=== {variant_key} (actuel C_PUB={CC.C_PUB[variant_key]}) ===")
        new_c_pub = _calibrate(module, variant_key, sf, a.n_keys, capacity_fn=capacity_fn)
        results[variant_key] = new_c_pub
        print(f"  -> C_PUB retenu : {new_c_pub} (etait {CC.C_PUB[variant_key]})")

    print("\n=== Résumé ===")
    for variant_key, new_val in results.items():
        print(f"  {variant_key:18s} : {CC.C_PUB[variant_key]:5d} -> {new_val}")

    if a.apply:
        path = os.path.join(REPO_ROOT, 'stegano', 'crypto_core.py')
        with open(path, encoding='utf-8') as f:
            content = f.read()
        for variant_key, new_val in results.items():
            pattern = rf"('{variant_key}':\s*)\d+(,)"
            replacement = rf"\g<1>{new_val}\g<2>"
            new_content, n = re.subn(pattern, replacement, content, count=1)
            if n != 1:
                raise RuntimeError(f"impossible de localiser C_PUB['{variant_key}'] dans {path}")
            content = new_content
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n{path} mis a jour.")
    else:
        print("\n(dry-run : relancer avec --apply pour ecrire ces valeurs dans crypto_core.py)")


if __name__ == '__main__':
    main()
