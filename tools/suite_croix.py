#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# suite_croix.py — combien de croix ansées à l'ordre n ?
#
# LA CROIX EST LUE, PAS DESSINÉE. Dans un carré auto-construit, la
# complémentaire de la case (r, c) se trouve à l'une de trois places, et la
# classe de la case partenaire décide laquelle :
#
#     classe en (r, c)   demi-tour (r̄, c̄)   miroir horiz. (r, c̄)   miroir vert. (r̄, c)
#     B                  B                   J                       V
#     R                  R                   V                       J
#     V                  V                   R                       B
#     J                  J                   B                       R
#
# (les quatre valeurs d'une case étant distinctes, exactement un des trois cas
# se produit). Le carré fixe donc le tracé : les traits ne sont pas choisis.
#
# LA CONDITION I DÉTERMINE UNE FIGURE CANDIDATE ; celle-ci est une croix ansée
# au sens de la planche 040 lorsqu'elle satisfait aussi II et III. La condition I
# demande que les paires par demi-tour soient exactement les 2n cases des deux
# diagonales, ce qui devient ici une contrainte sur l'étiquetage :
#
#     case diagonale      : même classe qu'en (r̄, c̄)
#     case hors diagonale : classe différente de celle en (r̄, c̄)
#
# Le script ajoute ces contraintes au modèle magique de `graine_sat.py` et
# énumère les figures distinctes par no-goods successifs.
#
# Usage : cd <racine du dépôt> && python tools/suite_croix.py [--ordres 6,8,10]
#         [--limite S]

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                       # noqa: E402
from graine_sat import CLASSES, valeur, controle               # noqa: E402

H_PARTENAIRE = {'B': 'J', 'J': 'B', 'R': 'V', 'V': 'R'}


def modele(n):
    """Le modèle magique, plus la condition I de la planche 040."""
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
                             x[n - 1 - k, n - 1 - j, 'R'],
                             x[n - 1 - k, j, 'J']])

    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    for r in range(n):
        for c in range(n):
            for k in CLASSES:
                jumeau = x[n - 1 - r, n - 1 - c, k]
                if (r, c) in diag:
                    m.AddImplication(x[r, c, k], jumeau)        # demi-tour exigé
                else:
                    m.AddBoolOr([x[r, c, k].Not(), jumeau.Not()])   # interdit
    return m, x, diag


def figure(mots, n, diag):
    """L'ensemble des traits, lu sur l'étiquetage."""
    traits = set()
    for r in range(n):
        for c in range(n):
            if (r, c) in diag:
                continue
            if mots[r][n - 1 - c] == H_PARTENAIRE[mots[r][c]]:
                traits.add(frozenset({(r, c), (r, n - 1 - c)}))
            else:
                traits.add(frozenset({(r, c), (n - 1 - r, c)}))
    return frozenset(traits)


def criteres(traits, n):
    h = [sum(1 for t in traits if all(p[0] == r for p in t)) for r in range(n)]
    v = [sum(1 for t in traits if all(p[1] == c for p in t)) for c in range(n)]
    return all(e % 2 == 1 for e in h) and all(e % 2 == 1 for e in v), h, v


def enumere(n, limite=300.0, plafond=200):
    m, x, diag = modele(n)
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    figures = []
    while len(figures) < plafond:
        etat = s.Solve(m)
        if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return figures, s.StatusName(etat)
        mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                        for c in range(n)) for r in range(n)]
        _, ok = controle(mots, n)
        f = figure(mots, n, diag)
        tenus, h, v = criteres(f, n)
        figures.append((f, mots, ok, tenus, h, v))
        m.AddBoolOr(interdits(m, x, f, n, diag))   # no-good sur la figure
    return figures, 'PLAFOND'


def interdits(m, x, f, n, diag):
    """Une clause qui exclut exactement la figure f : au moins une case doit
    changer de côté. « (r,c) est tracée horizontalement » s'écrit comme la
    disjonction des quatre conjonctions (classe, classe du miroir) ; on
    introduit un booléen par case pour la nommer."""
    clause = []
    for r in range(n):
        for c in range(n):
            if (r, c) in diag:
                continue
            horiz = frozenset({(r, c), (r, n - 1 - c)}) in f
            b = m.NewBoolVar(f'h{r}_{c}_{len(clause)}')
            paires = []
            for k in CLASSES:
                p = m.NewBoolVar('')
                m.AddBoolAnd([x[r, c, k], x[r, n - 1 - c, H_PARTENAIRE[k]]]
                             ).OnlyEnforceIf(p)
                m.AddBoolOr([x[r, c, k].Not(),
                             x[r, n - 1 - c, H_PARTENAIRE[k]].Not(), p])
                paires.append(p)
            m.AddMaxEquality(b, paires)
            clause.append(b.Not() if horiz else b)
    return clause


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 8, 10])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 300.0
    for n in ordres:
        figures, fin = enumere(n, limite)
        tenus = sum(1 for _, _, _, t, _, _ in figures if t)
        controles = all(ok for _, _, ok, _, _, _ in figures)
        print(f'ordre {n:3d} : {len(figures)} figure(s) distincte(s), '
              f'dont {tenus} tenant les critères II–III ; '
              f'fin = {fin} ; contrôles magiques : {controles}', flush=True)
        for _, _, _, t, h, v in figures[:8]:
            print(f'    traits par ligne {h}, par colonne {v}, '
                  f'critères {"tenus" if t else "non"}')


if __name__ == '__main__':
    main()
