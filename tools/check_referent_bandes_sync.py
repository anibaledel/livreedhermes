#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
check_referent_bandes_sync.py — Garde-fou : data/referent_bandes_v1.json est
une vue générée de data/referent_bicolore_v1.json (tools/generate_referent_bandes.py) ;
ce script échoue si les masques du fichier en place divergent de ce que le
générateur produirait. Sur le modèle de scripts/check-no-gk2net.js, appelé
par .github/workflows/check-referent-bandes-sync.yml sur chaque push/PR.

Pourquoi ce garde-fou existe : les deux fichiers ont été dessinés
indépendamment jusqu'au 2026-09-19 et ont divergé sur les 15 gammes pendant
plusieurs semaines sans que rien ne le signale — découvert par relecture
manuelle, pas par un contrôle. Le passage à une vue générée (au lieu de deux
dessins parallèles) rend la divergence par édition normale impossible ; ce
script couvre le seul cas qui reste : une édition MANUELLE de
data/referent_bandes_v1.json qui ne repasse pas par le générateur.

Usage :
    python tools/check_referent_bandes_sync.py
"""

import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

from generate_referent_bandes import build, OUT_JSON  # noqa: E402


def main():
    expected = build()

    if not os.path.exists(OUT_JSON):
        print(f"ÉCHEC : {OUT_JSON} n'existe pas — lancer "
              f"'python tools/generate_referent_bandes.py'.", file=sys.stderr)
        sys.exit(1)

    actual = json.load(open(OUT_JSON, encoding='utf-8'))

    problems = []
    if set(actual.get('gammes', {})) != set(expected['gammes']):
        problems.append(
            f"noms de gammes différents : fichier a "
            f"{sorted(set(actual.get('gammes', {})) ^ set(expected['gammes']))}")
    else:
        for name, exp_g in expected['gammes'].items():
            act_g = actual['gammes'][name]
            for field in ('yang', 'yin'):
                if act_g.get(field) != exp_g[field]:
                    diff = sum(1 for a, b in zip(act_g.get(field, ''), exp_g[field]) if a != b)
                    problems.append(f"{name!r} champ {field!r} : diverge du bicolore "
                                     f"({diff} caractères hex différents)")

    if problems:
        print("ÉCHEC : data/referent_bandes_v1.json ne correspond plus à ce que "
              "tools/generate_referent_bandes.py produirait depuis "
              "data/referent_bicolore_v1.json :\n", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        print(f"\nRelancer 'python tools/generate_referent_bandes.py' et committer le "
              f"résultat. Si c'est le bicolore qui a changé volontairement, c'est "
              f"attendu — regénérer et committer suffit. Si data/referent_bandes_v1.json "
              f"a été édité à la main, c'est exactement ce que ce garde-fou existe pour "
              f"détecter.", file=sys.stderr)
        sys.exit(1)

    print("OK : data/referent_bandes_v1.json correspond exactement à la vue générée "
          "depuis data/referent_bicolore_v1.json.")


if __name__ == '__main__':
    main()
