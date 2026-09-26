#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
accords.py — Le recensement : une planche n'a pas de niveau, elle joue un
accord (un sous-ensemble des 16 familles). Compte les constructions
(sous-ensembles), les dessins distincts (l'union des axes, qui peut
coïncider pour deux accords différents) et, parmi eux, ceux qui contiennent
leur écho (voir echos.py).

Ces comptes sont ceux des TRACÉS D'AXES, pas des motifs, et ne sont pas
quotientés par le groupe du carré (voir prompt-cc-axes.md, "Ce qui n'est
pas dans ce chantier").

Usage : python tools/axes/accords.py
"""

import itertools
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from echos import _axes_set, homothetie, FAMILLES_16  # noqa: E402


def _dessin(combo, fam_sets):
    s = set()
    for n in combo:
        s |= fam_sets[n]
    return frozenset(s)


def recensement(catalogue):
    """Rend { taille: {'combinaisons': int, 'dessins_distincts': int,
    'contiennent_echo': int, 'dessins': set(frozenset)} } pour taille 1..16,
    et le total tous accords confondus."""
    fam_sets = {n: _axes_set(catalogue['familles'][n]) for n in FAMILLES_16}
    par_taille = {}
    tous_dessins = set()
    for r in range(1, len(FAMILLES_16) + 1):
        dessins_taille = set()
        contiennent_echo = 0
        combinaisons = 0
        for combo in itertools.combinations(FAMILLES_16, r):
            combinaisons += 1
            d = _dessin(combo, fam_sets)
            dessins_taille.add(d)
            tous_dessins.add(d)
            img = _axes_set(homothetie([{'nature': n, 'ecart': e} for n, e in d]))
            if img <= d:
                contiennent_echo += 1
        par_taille[r] = {
            'combinaisons': combinaisons,
            'dessins_distincts': len(dessins_taille),
            'contiennent_echo': contiennent_echo,
        }
    return par_taille, tous_dessins


def main():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'AXES', 'catalogue.json')
    with open(path, encoding='utf-8') as f:
        catalogue = json.load(f)

    par_taille, tous_dessins = recensement(catalogue)

    jargon = {2: 'T1', 3: 'T2', 4: 'T3'}
    print(" jargon  familles  combinaisons  dessins distincts  contiennent leur echo")
    for r in (2, 3, 4):
        d = par_taille[r]
        print(f"   {jargon[r]:<4s}    {r:2d}         {d['combinaisons']:5d}"
              f"            {d['dessins_distincts']:5d}                {d['contiennent_echo']:3d}")

    total_combinaisons = sum(d['combinaisons'] for d in par_taille.values())
    print(f"\n sur les 16 familles : {total_combinaisons} accords -> {len(tous_dessins)} dessins distincts")

    r_max = max(par_taille, key=lambda r: par_taille[r]['dessins_distincts'])
    print(f" maximum de diversite a {r_max} familles ({par_taille[r_max]['dessins_distincts']} dessins)")
    croissant = all(par_taille[r]['dessins_distincts'] <= par_taille[r + 1]['dessins_distincts'] for r in range(1, r_max))
    decroissant = all(par_taille[r]['dessins_distincts'] >= par_taille[r + 1]['dessins_distincts'] for r in range(r_max, len(FAMILLES_16)))
    print(f" croissant avant, decroissant apres : {croissant and decroissant}")

    print("\n Ces comptes sont ceux des tracés d'axes, pas des motifs, et ne")
    print(" sont pas quotientés par le groupe du carré.")


if __name__ == '__main__':
    main()
