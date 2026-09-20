#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
check_faces_geometrie_sync.py — Garde-fou : la géométrie du cube (FACES —
origine et deux vecteurs d'arête par face) est copiée à l'identique dans
tools/cube_edges.py, tools/generate_table_pavage.py et
tools/spectre_et_cube.py. Chacun de ces scripts doit rester lisible et
exécutable seul (le paquet de soumission qui en tire cube_edges.py
interdit justement d'importer entre scripts — voir tools/measure_k_pic.py,
tools/croisements.py) : la géométrie ne peut donc pas être factorisée en
un import commun. Ce script vérifie l'autre moitié du problème — que les
trois copies coïncident — sans réintroduire la dépendance qu'on a refusée.

Pourquoi ce garde-fou existe : trouvé par relecture (voir la revue de
tools/check_no_donnees_en_dur.py, 2026-09-21) — FACES n'est pas une donnée
mesurée codée en dur au sens de ce contrôle-là (c'est une définition, pas
une mesure), mais sa triplication reste un risque : si la géométrie du
cube est corrigée dans un seul des trois fichiers, rien ne le signale.

Usage :
    python tools/check_faces_geometrie_sync.py
"""

import ast
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))

FICHIERS = ['cube_edges.py', 'generate_table_pavage.py', 'spectre_et_cube.py']


def lit_faces(nom_fichier):
    path = os.path.join(TOOLS_DIR, nom_fichier)
    if not os.path.exists(path):
        sys.exit(f"ÉCHEC : {path} introuvable.")
    tree = ast.parse(open(path, encoding='utf-8').read(), filename=path)
    for node in ast.iter_child_nodes(tree):
        if (isinstance(node, ast.Assign) and isinstance(node.value, ast.Dict)
                and any(isinstance(t, ast.Name) and t.id == 'FACES' for t in node.targets)):
            return ast.literal_eval(node.value)
    sys.exit(f"ÉCHEC : aucune affectation de module 'FACES = {{...}}' trouvée dans {path}.")


def main():
    valeurs = {f: lit_faces(f) for f in FICHIERS}
    reference = valeurs[FICHIERS[0]]
    divergentes = [f for f in FICHIERS[1:] if valeurs[f] != reference]

    if divergentes:
        print(f"ÉCHEC : FACES diverge entre {FICHIERS[0]} et {', '.join(divergentes)}.\n"
              f"Les trois copies doivent rester identiques (voir la docstring de ce "
              f"script sur pourquoi elles ne sont pas un import commun) — corriger "
              f"la géométrie dans les trois fichiers, pas un seul.", file=sys.stderr)
        for f in divergentes:
            print(f"\n  {FICHIERS[0]} :\n    {reference}", file=sys.stderr)
            print(f"  {f} :\n    {valeurs[f]}", file=sys.stderr)
        sys.exit(1)

    print(f"OK : FACES identique dans {', '.join(FICHIERS)}.")


if __name__ == '__main__':
    main()
