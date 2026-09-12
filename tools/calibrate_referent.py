#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
calibrate_referent.py — Calibre C_PUB pour un (référent, variante)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réécrit le 2026-09-12 : la version précédente de ce script calibrait un
« c_pub » et l'écrivait DANS le fichier JSON du référent. C'était une
erreur de conception -- la capacité publique garantie ne dépend pas du
référent seul, mais du COUPLE (référent, variante Carter qui le lit) : le
même référent 6×6 vaut C_PUB=399 sous Carter-256, 415 sous
Carter-Random-90, 2144 sous Carter-Random-360 (la grammaire de blocs,
donc le nombre de positions message lues par clé, diffère selon la
variante). Un champ unique dans le référent ne peut donc jamais être
correct pour toutes ses variantes -- voir docs/REFERENT_FORMAT_V3.md.

Ce script calibre maintenant un COUPLE (référent, variante) à la fois, en
appelant directement les fonctions de recherche de grammaire de
PRODUCTION (jamais une réimplémentation -- même principe et même code que
tools/recalibrate_carter_v3.py, dont les closures _sf_carter256/360/mix
sont réutilisées ici, généralisées pour accepter un référent explicite
plutôt que le référent par défaut chargé au niveau module). Règle de la
tâche 4 (inchangée) : C_PUB est la plus grande valeur telle que le taux
de redraw (MAX_REDRAWS=10 tentatives) reste < 1 % sur N clés.

Variantes couvertes : carter256, carter360, cartermix -- les trois seules
variantes qui reçoivent un référent EXPLICITE en paramètre (Ref256 et/ou
Ref360). carterrandom90/360, carterhybrid et carter18 sélectionnent leur
référent PAR CLÉ parmi un pool (256 référents 6×6, ou 10 graines 18×18) :
il n'y a pas de « référent unique » à calibrer pour elles -- leur C_PUB
se calibre en pool, avec tools/recalibrate_carter_v3.py (inchangé).

Usage :
    # Calibre les 3 variantes pour le référent par défaut (celui chargé
    # par la production), affiche un tableau (référent × variante) :
    python tools/calibrate_referent.py

    # Une seule variante :
    python tools/calibrate_referent.py --variant carter256

    # Un référent candidat (hypothétique, pas encore celui chargé par
    # défaut) -- calibration exploratoire, --apply refusé :
    python tools/calibrate_referent.py --ref256 /tmp/candidat_256.json

    # Écrit les valeurs calibrées dans crypto_core.py C_PUB (refusé si
    # les référents donnés ne sont pas ceux effectivement chargés par
    # défaut par la production -- une valeur C_PUB n'a de sens que pour
    # le référent qui sera réellement utilisé) :
    python tools/calibrate_referent.py --apply
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
from vectors_internal import _count_redraw_attempts

DEFAULT_REF256_PATH = os.path.join(REPO_ROOT, 'data', 'referent_256_v3.json')
DEFAULT_REF360_PATH = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')


def _measure(module, variant_key, search_fn_for_key, candidate, n_keys):
    """Même mesure que tools/recalibrate_carter_v3.py::_measure -- voir ce
    module pour la justification de la méthode (monkey-patch temporaire de
    crypto_core.C_PUB, restauré après chaque mesure, jamais persistant)."""
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
    """Recherche par dichotomie -- identique à
    tools/recalibrate_carter_v3.py::_calibrate."""
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


# ── Constructeurs de search_fn, paramétrés par le référent EXPLICITE ────────
# Généralisation de tools/recalibrate_carter_v3.py::_sf_carter256/360/mix
# (qui fermaient sur REF256_V3/REF360_V3 au niveau module) -- ici le
# référent est un paramètre, pour pouvoir calibrer un référent candidat.

def _sf_carter256(ref256):
    def make(master_key):
        _, gk = CT._carter_split(master_key)
        return lambda: CT._find_grammar_with_c_pub(
            gk, 'carter256',
            lambda k: CT._carter_grammar(k, ref256),
            lambda g: CT._carter_message_positions(g, ref256))
    return make

def _sf_carter360(ref360):
    def make(master_key):
        _, gk = CT._carter360_split(master_key)
        return lambda: CT._find_grammar_with_c_pub(
            gk, 'carter360',
            lambda k: CT._carter360_grammar(k, ref360),
            lambda g: CT._carter360_message_positions(g, ref360))
    return make

def _sf_cartermix(ref256, ref360):
    def make(master_key):
        _, gk = CT._carter_mix_split(master_key)
        return lambda: CT._find_grammar_with_c_pub(
            gk, 'cartermix',
            lambda k: CT._carter_mix_grammar(k, ref256, ref360),
            lambda g: CT._mix_message_positions(g, ref256, ref360))
    return make


VARIANTS_NEEDING = {
    'carter256': ('ref256',),
    'carter360': ('ref360',),
    'cartermix': ('ref256', 'ref360'),
}


def _build_search_fn(variant_key, ref256, ref360):
    if variant_key == 'carter256':
        return CT, _sf_carter256(ref256)
    if variant_key == 'carter360':
        return CT, _sf_carter360(ref360)
    if variant_key == 'cartermix':
        return CT, _sf_cartermix(ref256, ref360)
    raise ValueError(f"variante inconnue ou hors périmètre de ce script : {variant_key!r} "
                      f"(carterrandom90/360, carterhybrid, carter18 : voir "
                      f"tools/recalibrate_carter_v3.py, calibration en pool)")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--ref256', default=DEFAULT_REF256_PATH,
                   help=f"chemin du référent 256 (défaut : {DEFAULT_REF256_PATH})")
    p.add_argument('--ref360', default=DEFAULT_REF360_PATH,
                   help=f"chemin du référent 360 (défaut : {DEFAULT_REF360_PATH})")
    p.add_argument('--variant', choices=['carter256', 'carter360', 'cartermix', 'all'],
                   default='all', help="variante à calibrer (défaut : les trois)")
    p.add_argument('--n-keys', type=int, default=10000)
    p.add_argument('--apply', action='store_true',
                   help="écrit les valeurs calibrées dans crypto_core.py C_PUB -- "
                        "refusé si --ref256/--ref360 ne sont pas les référents "
                        "effectivement chargés par défaut en production")
    a = p.parse_args()

    # load_referent_256_v3()/360_v3() ne prennent pas de chemin -- on charge
    # directement via json, comme ces fonctions le font en interne, pour
    # pouvoir pointer sur un référent candidat arbitraire.
    import json
    with open(a.ref256, encoding='utf-8') as f:
        ref256 = json.load(f)
    with open(a.ref360, encoding='utf-8') as f:
        ref360 = json.load(f)

    is_default = (os.path.abspath(a.ref256) == os.path.abspath(DEFAULT_REF256_PATH) and
                  os.path.abspath(a.ref360) == os.path.abspath(DEFAULT_REF360_PATH))
    if a.apply and not is_default:
        print("--apply refusé : --ref256/--ref360 ne sont pas les référents "
              f"chargés par défaut en production ({DEFAULT_REF256_PATH}, "
              f"{DEFAULT_REF360_PATH}). Une valeur C_PUB n'a de sens que pour "
              "le référent réellement utilisé -- calibrer un référent candidat "
              "sans --apply pour l'évaluer, puis relancer sans --ref256/--ref360 "
              "une fois qu'il a remplacé le référent par défaut.")
        sys.exit(1)

    variants = ['carter256', 'carter360', 'cartermix'] if a.variant == 'all' else [a.variant]

    print(f"référent 256 : {a.ref256}  (referent_id={ref256.get('referent_id', '?')[:16]}...)")
    print(f"référent 360 : {a.ref360}  (referent_id={ref360.get('referent_id', '?')[:16]}...)")
    if not is_default:
        print("(référent CANDIDAT, pas celui chargé par défaut -- calibration "
              "exploratoire, --apply indisponible)")

    results = {}
    for variant_key in variants:
        module, sf = _build_search_fn(variant_key, ref256, ref360)
        print(f"\n=== {variant_key} (actuel C_PUB={CC.C_PUB[variant_key]}) ===")
        new_c_pub = _calibrate(module, variant_key, sf, a.n_keys)
        results[variant_key] = new_c_pub
        print(f"  -> C_PUB retenu : {new_c_pub} (etait {CC.C_PUB[variant_key]})")

    print(f"\n=== Tableau (référent × variante) ===")
    print(f"  {'variante':16s} {'C_PUB actuel':>14s} {'C_PUB calibré':>14s}")
    for variant_key, new_val in results.items():
        print(f"  {variant_key:16s} {CC.C_PUB[variant_key]:14d} {new_val:14d}")

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
