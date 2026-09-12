#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
recalibrate_carter_v3.py — Campagne de recalibration C_PUB (câblage v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Recalibre C_PUB pour les SIX variantes migrées vers la nouvelle règle de
lecture (12 positions stégano/bloc au lieu de 6, ou 12/sous-bloc pour
Hybrid MODE_6) : carter256, carter360, cartermix, carterrandom90,
carterrandom360, carterhybrid. Carter-18 n'est PAS recalibré : hors
périmètre du câblage, sa géométrie n'a pas changé.

Méthode IDENTIQUE à celle déjà en place dans crypto_core.py (règle de la
tâche 4) : plus grand C_PUB tel que le taux de REDRAW (pas le taux
d'échec) reste < 1 % sur N clés — mesuré en appelant directement les
fonctions de recherche de grammaire de PRODUCTION
(_find_grammar_with_c_pub et consorts), jamais une réimplémentation,
avec C_PUB temporairement substitué (monkey-patch de crypto_core.C_PUB,
restauré après chaque mesure). Le nombre de tentatives réellement
effectuées est compté via vectors_internal._count_redraw_attempts (déjà
utilisée par le mode vecteurs, aucune duplication).

Usage :
    python tools/recalibrate_carter_v3.py [--n-keys 10000] [--apply]

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


def _measure(module, variant_key, search_fn_for_key, candidate, n_keys):
    """search_fn_for_key(master_key) -> callable() qui appelle la fonction
    de recherche de PRODUCTION et renvoie un tuple dont le DERNIER élément
    est n_pos. Retourne (redraw_pct, fail_pct, mean_cap)."""
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
                caps.append(CC.max_message_for(n_pos))
                if attempts > 1:
                    redraws += 1
            except ValueError:
                fails += 1
        mean_cap = sum(caps) / len(caps) if caps else None
        return (100 * redraws / n_keys, 100 * fails / n_keys, mean_cap)
    finally:
        CC.C_PUB[variant_key] = original


def _calibrate(module, variant_key, search_fn_for_key, n_keys, target_redraw_pct=1.0):
    """Recherche par dichotomie le plus grand candidat tel que
    redraw < target_redraw_pct% et fail == 0%, en bornant la recherche par
    la distribution brute (ctr=0 implicite, via une mesure au candidat
    p1 estimé) -- même méthodologie que tools/calibrate_referent.py."""
    # Bornage initial : mesure à un candidat bas (garanti sans redraw) pour
    # obtenir mean_cap, puis élargit la fenêtre de recherche autour.
    _, _, mean_cap = _measure(module, variant_key, search_fn_for_key, 1, min(n_keys, 500))
    hi = int(mean_cap * 1.5) if mean_cap else 2000
    lo, best = 1, None
    print(f"  [{variant_key}] fenetre de recherche initiale : [1, {hi}]")
    while lo <= hi:
        mid = (lo + hi) // 2
        redraw_pct, fail_pct, mean_cap = _measure(
            module, variant_key, search_fn_for_key, mid, n_keys)
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
    return lambda: CR._find_random_grammar_with_c_pub(gk, 90)

def _sf_carterrandom360(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_random_grammar_with_c_pub(gk, 180)

def _sf_carterhybrid(master_key):
    _, gk = CR._carter_split(master_key)
    return lambda: CR._find_hybrid_grammar_with_c_pub(gk, CR.GRID_SIZE)


VARIANTS = [
    ('carter256',       CT, _sf_carter256),
    ('carter360',       CT, _sf_carter360),
    ('cartermix',       CT, _sf_cartermix),
    ('carterrandom90',  CR, _sf_carterrandom90),
    ('carterrandom360', CR, _sf_carterrandom360),
    ('carterhybrid',    CR, _sf_carterhybrid),
]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--n-keys', type=int, default=10000)
    p.add_argument('--apply', action='store_true',
                    help='ecrit les nouvelles valeurs dans crypto_core.py')
    a = p.parse_args()

    results = {}
    for variant_key, module, sf in VARIANTS:
        print(f"\n=== {variant_key} (actuel C_PUB={CC.C_PUB[variant_key]}) ===")
        new_c_pub = _calibrate(module, variant_key, sf, a.n_keys)
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
