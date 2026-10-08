#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# graine_sat.py — existe-t-il un étiquetage magique à quatre classes d'ordre n
# lorsque n n'est pas multiple de 6 ?
#
# C'est la question ouverte du papier. Le tirage aléatoire n'avait rien produit
# aux ordres 10 et 14, mais un tirage ne prouve rien. Ici on tranche.
#
# LE MODÈLE. Une inconnue booléenne x[r, c, k] par cellule et par classe, une
# seule classe par cellule. Les sommes de lignes, de colonnes et des deux
# diagonales valent la constante n(n²+1)/2.
#
# LA BIJECTION EST BOOLÉENNE. La valeur nk + j + 1 (bloc k, rang j) ne peut
# venir que de quatre cellules :
#
#     (k,     j)       en classe B        (n−1−k, n−1−j) en classe R
#     (k,     n−1−j)   en classe V        (n−1−k, j)     en classe J
#
# donc « chaque valeur une fois » s'écrit, pour chaque couple (k, j),
#
#     x[k, j, B] + x[k, n−1−j, V] + x[n−1−k, n−1−j, R] + x[n−1−k, j, J] = 1
#
# C'est la condition de bijection du papier, sous sa forme la plus nue : elle
# apparie le bloc k au bloc n−1−k, et c'est de là que vient la réflexion
# r ↔ n−1−r qu'on retrouve dans la règle des miroirs.
#
# Usage : cd <racine du dépôt> && python tools/graine_sat.py [--ordre N] [--limite S]

import sys

from ortools.sat.python import cp_model

CLASSES = 'BRVJ'


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def cherche(n, limite=600.0, graines=1):
    M = n * (n * n + 1) // 2
    m = cp_model.CpModel()
    x = {(r, c, k): m.NewBoolVar(f'x{r}_{c}_{k}')
         for r in range(n) for c in range(n) for k in CLASSES}

    for r in range(n):
        for c in range(n):
            m.AddExactlyOne(x[r, c, k] for k in CLASSES)

    def somme(cellules):
        return sum(valeur(k, r, c, n) * x[r, c, k]
                   for r, c in cellules for k in CLASSES)

    for i in range(n):
        m.Add(somme([(i, c) for c in range(n)]) == M)
        m.Add(somme([(r, i) for r in range(n)]) == M)
    m.Add(somme([(i, i) for i in range(n)]) == M)
    m.Add(somme([(i, n - 1 - i) for i in range(n)]) == M)

    for k in range(n):
        for j in range(n):
            m.AddExactlyOne([x[k, j, 'B'], x[k, n - 1 - j, 'V'],
                             x[n - 1 - k, n - 1 - j, 'R'], x[n - 1 - k, j, 'J']])

    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    if graines > 1:
        s.parameters.enumerate_all_solutions = False
    etat = s.Solve(m)
    nom = s.StatusName(etat)
    if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return nom, None
    mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                    for c in range(n)) for r in range(n)]
    return nom, mots


def controle(mots, n):
    """Contrôle indépendant du modèle : on reconstruit la grille et on vérifie."""
    M = n * (n * n + 1) // 2
    g = [[valeur(mots[r][c], r, c, n) for c in range(n)] for r in range(n)]
    return g, (sorted(v for l in g for v in l) == list(range(1, n * n + 1))
               and all(sum(l) == M for l in g)
               and all(sum(g[r][c] for r in range(n)) == M for c in range(n))
               and sum(g[i][i] for i in range(n)) == M
               and sum(g[i][n - 1 - i] for i in range(n)) == M)


def main():
    a = sys.argv
    n = int(a[a.index('--ordre') + 1]) if '--ordre' in a else 10
    limite = float(a[a.index('--limite') + 1]) if '--limite' in a else 600.0
    print(f'ordre {n} — recherche d’un étiquetage magique à quatre classes')
    nom, mots = cherche(n, limite)
    print(f'  statut du solveur : {nom}')
    if mots is None:
        if nom == 'INFEASIBLE':
            print(f'\n  AUCUN étiquetage magique à quatre classes à l’ordre {n}.')
        else:
            print(f'\n  non tranché en {limite:.0f} s.')
        return
    print('\n  GRAINE :')
    for l in mots:
        print('    ' + ' '.join(l))
    g, ok = controle(mots, n)
    M = n * (n * n + 1) // 2
    print(f'\n  contrôle indépendant : carré magique d’ordre {n}, '
          f'constante {M} : {ok}')
    for l in g:
        print('    ' + ' '.join(f'{v:3d}' for v in l))


if __name__ == '__main__':
    main()
