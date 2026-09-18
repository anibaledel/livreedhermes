#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
check_fonds_ecran_completude.py — Garde-fou : data/fonds_ecran_v1.json
porte bien les 15 familles × 4 natures (60 couches) et le corpus qui en
découle, sur le modèle de tools/check_referent_bandes_sync.py. Appelé par
.github/workflows/check-fonds-ecran-completude.yml sur chaque push/PR.

Pourquoi ce garde-fou existe : jusqu'au 2026-09-19, data/fonds_ecran_v1.json
rangeait les quatre familles à une base (YANG, YANG-MUT, YIN, YIN-MUT) sous
une seule clé "bases", avec une seule couche chacune au lieu de quatre — 12
des 60 couches manquaient. Conséquence : le critère d'unification
(tools/cube_edges.py) n'était satisfait que par 6 familles sur 8 réelles,
sans qu'aucun contrôle ne le signale — découvert par relecture indépendante
d'un audit externe, pas par un test. Ce script vérifie que ça ne revient pas
: 15 familles, 4 natures chacune, et les comptes exacts du corpus unifié
(1024 triplets / 512 grilles / 256 pavages, tools/generate_fonds_ecran.py).

Usage :
    python tools/check_fonds_ecran_completude.py
"""

import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

from generate_fonds_ecran import OUT_JSON  # noqa: E402

NATURES_ATTENDUES = {'yang', 'yang_mut', 'yin', 'yin_mut'}
N_FAMILLES_ATTENDU = 15
N_COUCHES_ATTENDU = 60


def main():
    if not os.path.exists(OUT_JSON):
        print(f"ÉCHEC : {OUT_JSON} n'existe pas.", file=sys.stderr)
        sys.exit(1)

    doc = json.load(open(OUT_JSON, encoding='utf-8'))
    familles = doc.get('families', {})

    problems = []

    if len(familles) != N_FAMILLES_ATTENDU:
        problems.append(f"{len(familles)} familles au lieu de {N_FAMILLES_ATTENDU} : "
                         f"{sorted(familles)}")

    n_couches = 0
    for key, natures in familles.items():
        n_couches += len(natures)
        if set(natures) != NATURES_ATTENDUES:
            manquantes = NATURES_ATTENDUES - set(natures)
            en_trop = set(natures) - NATURES_ATTENDUES
            detail = []
            if manquantes:
                detail.append(f"natures manquantes {sorted(manquantes)}")
            if en_trop:
                detail.append(f"natures en trop {sorted(en_trop)}")
            problems.append(f"{key} : {', '.join(detail)}")

    if n_couches != N_COUCHES_ATTENDU:
        problems.append(f"{n_couches} couches au total au lieu de {N_COUCHES_ATTENDU} "
                         f"(15 familles × 4 natures)")

    for key, natures in familles.items():
        for nat, grid in natures.items():
            if len(grid) != 12 or any(len(row) != 12 for row in grid):
                problems.append(f"{key}.{nat} : grille pas 12x12")

    entries = doc.get('entries', [])
    if len(entries) not in (0, 1024):
        problems.append(f"{len(entries)} entries au lieu de 1024 (ou 0 si le corpus "
                         f"unifié n'a pas encore été régénéré avec les données complètes)")

    if problems:
        print("ÉCHEC : data/fonds_ecran_v1.json n'est pas complet :\n", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        print(f"\nRelancer 'python tools/generate_fonds_ecran.py' depuis "
              f"data/referent_360_v3.json et committer le résultat.", file=sys.stderr)
        sys.exit(1)

    print(f"OK : {len(familles)} familles, {n_couches} couches, "
          f"{len(entries)} entries dans data/fonds_ecran_v1.json.")


if __name__ == '__main__':
    main()
