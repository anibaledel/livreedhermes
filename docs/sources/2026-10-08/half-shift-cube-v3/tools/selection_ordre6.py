#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
selection_ordre6.py — Des 256 carrés d'ordre 6 aux premières formes unifiées.

Reproduit la Section 7 de la note « A Half-Shift Criterion on Three-Colour
12×12 Grids, and Its Restriction on the Cube ».

Ce que fait ce script
---------------------
1. Lit les 256 carrés d'ordre 6 (data/referent_256_v3.json), chacun donné
   par les positions de ses quatre couleurs et sa place (row, col) dans un
   damier 16 × 16. Vérifie la composition 6/6/12/12 sur chacun.

2. Les regroupe quatre à quatre — les blocs 2 × 2 du damier — en 64 formes
   d'ordre 12, l'ordre 12 étant doublement pair, où la symétrie centrale
   redevient disponible.

3. Fusionne les deux couleurs à six cases (rouge et bleu), ce qui laisse
   trois couleurs. Vérifie que la composition devient 48/48/48.

4. Applique le critère de la Section 3 : le décalage d'une demi-période
   doit donner la même forme à permutation de teinte près, la permutation
   étant non triviale.

   → 16 formes retenues sur 64, dans les colonnes 0 et 7 du damier 8 × 8,
     soit 8 à permutation de teinte près.

Usage
-----
    python tools/selection_ordre6.py
    python tools/selection_ordre6.py --json rapport.json

Données lues
------------
    data/referent_256_v3.json
"""

import argparse
import json
import os
import sys
from collections import Counter

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO_ROOT, 'data', 'referent_256_v3.json')

COULEURS = ('rouge', 'bleu', 'vert', 'jaune')
PETITES = ('rouge', 'bleu')          # les deux formes à six cases
COMPOSITION_6 = {'rouge': 6, 'bleu': 6, 'vert': 12, 'jaune': 12}


def grille6(forme):
    """Un carré d'ordre 6 comme grille 6 × 6 de noms de couleur."""
    G = [[None] * 6 for _ in range(6)]
    for couleur in COULEURS:
        for r, c in forme[f'{couleur}_positions']:
            G[r][c] = couleur
    return G


def fusion(couleur):
    """Rouge et bleu deviennent une seule couleur après la traversée."""
    return 'RB' if couleur in PETITES else couleur


def assemble(formes, R, C):
    """Les quatre carrés du bloc 2 × 2 en (R, C) dans un cadre d'ordre 12."""
    G = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            petit = grille6(formes[(2 * R + dr, 2 * C + dc)])
            for r in range(6):
                for c in range(6):
                    G[6 * dr + r][6 * dc + c] = fusion(petit[r][c])
    return G


def demi_decalage(G):
    return [[G[(r - 6) % 12][(c - 6) % 12] for c in range(12)] for r in range(12)]


def permutation(A, B):
    """Si B s'obtient de A par une permutation de teinte, la retourne."""
    m = {}
    for r in range(12):
        for c in range(12):
            if m.setdefault(A[r][c], B[r][c]) != B[r][c]:
                return None
    return m


def unifiee(G):
    """Critère de la Section 3, appliqué à une forme d'ordre 12."""
    p = permutation(demi_decalage(G), G)
    if p is None:
        return None
    if all(a == b for a, b in p.items()):      # permutation triviale : refusée
        return None
    return p


def main():
    ap = argparse.ArgumentParser(description="Section 7 : des 256 aux 16 formes retenues.")
    ap.add_argument('--json', metavar='FICHIER', help='écrit un rapport détaillé')
    arg = ap.parse_args()

    if not os.path.exists(DATA):
        sys.exit(f"données introuvables : {DATA}")
    doc = json.load(open(DATA, encoding='utf-8'))
    formes = {(f['row'], f['col']): f for f in doc['forms']}

    if len(formes) != 256:
        sys.exit(f"{len(formes)} carrés au lieu de 256")
    lignes = max(r for r, _ in formes) + 1
    cols = max(c for _, c in formes) + 1
    print(f"carrés d'ordre 6 : {len(formes)}, disposés en {lignes} × {cols}")

    # composition 6/6/12/12
    mauvais = [k for k, f in formes.items()
               if {c: len(f[f'{c}_positions']) for c in COULEURS} != COMPOSITION_6]
    print(f"composition 6/6/12/12 : {len(formes) - len(mauvais)}/{len(formes)}"
          + ("  ✓" if not mauvais else f"  ✗ {mauvais[:5]}"))

    chiralites = Counter(f['chiralite'] for f in formes.values())
    print(f"chiralités : {dict(chiralites)}")
    print()

    # regroupement par quatre
    ordre12 = {(R, C): assemble(formes, R, C) for R in range(8) for C in range(8)}
    print(f"formes d'ordre 12 obtenues : {len(ordre12)}")

    equilibre = sum(1 for G in ordre12.values()
                    if sorted(Counter(x for row in G for x in row).values()) == [48, 48, 48])
    print(f"composition 48/48/48 après fusion : {equilibre}/{len(ordre12)}"
          + ("  ✓" if equilibre == len(ordre12) else "  ✗"))
    print()

    # critère
    retenues = {k: p for k, G in ordre12.items() if (p := unifiee(G))}
    colonnes = sorted({C for _, C in retenues})
    print("Critère de la Section 3")
    print(f"    formes retenues : {len(retenues)}/64")
    print(f"    colonnes occupées : {colonnes}"
          + ("  ✓ (première et dernière)" if colonnes == [0, 7] else "  ✗"))
    print(f"    soit à permutation de teinte près : {len(retenues) // 2}")
    print()

    perms = Counter(tuple(sorted(p.items())) for p in retenues.values())
    print("Permutations rencontrées")
    for p, n in perms.most_common():
        fixe = [a for a, b in p if a == b]
        print(f"    {dict(p)}  ({n} formes, teinte fixe : {fixe[0] if fixe else 'aucune'})")

    if arg.json:
        rapport = {
            'carres_ordre6': len(formes),
            'composition_6_6_12_12_ok': not mauvais,
            'formes_ordre12': len(ordre12),
            'composition_48_48_48_ok': equilibre == len(ordre12),
            'retenues': len(retenues),
            'colonnes': colonnes,
            'positions': sorted(list(k) for k in retenues),
        }
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"\nrapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
