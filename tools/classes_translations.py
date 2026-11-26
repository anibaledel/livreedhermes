#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
classes_translations.py — ce que comptent « 512 », « 256 » et « 128 » dans la note half-shift, avec les seules fonctions de cube_edges.py.

  1. les 1 024 triplets (famille, couple, n) du critère et leurs 512 grilles distinctes ;
  2. leurs classes modulo <σ> (le demi-décalage) : 256 ; modulo les 144 translations du pavage de période 12 : 128 classes de quatre grilles ;
  3. parmi les 256 grilles qui admettent un habillage du cube (décidé ici par cube_edges.habillage), les mêmes classes : 128 modulo <σ> et 128 modulo les translations —
     (6, 0) et (0, 6) envoient une grille admise sur une grille exclue : l'admissibilité au cube n'est pas invariante par ces translations.

Usage : python3 tools/classes_translations.py     (dans le même dossier que cube_edges.py ; moins d'une minute)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce  # noqa: E402

N = ce.N


def roule(g, a, b):
    return tuple(tuple(g[(r - a) % N][(c - b) % N] for c in range(N)) for r in range(N))


def main():
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    grilles = {}
    for f, a, b in ce.couples_unifies(F, L):
        for n in range(64):
            g = tuple(tuple(r) for r in ce.phi(n, F[f][a], F[f][b], L))
            if g not in grilles:
                grilles[g] = ce.habillage([list(r) for r in g], ce.involution(F[f][a], F[f][b]))[0] is not None
    G = list(grilles)
    admises = [g for g in G if grilles[g]]            # celles pour lesquelles cube_edges.habillage trouve un habillage
    sigma = lambda g: roule(g, N // 2, N // 2)
    mod_sigma = lambda E: len({min(g, sigma(g)) for g in E})
    mod_transl = lambda E: len({min(roule(g, a, b) for a in range(N) for b in range(N)) for g in E})
    print(f'grilles distinctes du corpus                : {len(G)}')
    print(f'    classes modulo <σ>                      : {mod_sigma(G)}')
    print(f'    classes modulo les 144 translations     : {mod_transl(G)}')
    print(f'grilles admises par le cube                 : {len(admises)}')
    print(f'    classes modulo <σ>                      : {mod_sigma(admises)}')
    print(f'    classes modulo les 144 translations     : {mod_transl(admises)}')
    ens = set(admises)
    print(f'grilles admises dont l\'image par (6, 0) est admise : {sum(roule(g, 6, 0) in ens for g in admises)}')


main()
