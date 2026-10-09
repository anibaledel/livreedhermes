#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# croix_existence.py — à quels ordres existe-t-il une croix ansée ?
#
# Le modèle est celui de `suite_croix.py` : magique, plus la condition I de la
# planche 040 (les paires par demi-tour sont exactement les 2n cases des
# diagonales). Ce script y ajoute les critères II et III — un nombre impair de
# traits par ligne ET par colonne — et demande la seule existence, sans
# énumérer. Chaque carré trouvé est recontrôlé hors du modèle du solveur.
#
# RÉSULTATS. Croix ansée aux ordres 6, 10, 14, 18, 30 ; AUCUNE aux ordres 8, 12
# et 16, où le solveur conclut à l'impossibilité (l'ordre 16 demande environ
# 40 minutes). Aux cinq ordres tranchés, l'existence suit donc exactement la
# parité singulièrement/doublement paire. Et la généralisation n'est PLUS
# conjecturale : elle est démontrée dans les deux sens — `parite.py` interdit
# tout au doublement pair, `construction.py` réalise toute figure candidate au
# singulièrement pair. La croix ansée est donc bien un objet du singulièrement
# pair, la famille où les méthodes classiques coûtent le plus, et ce script
# n'est plus qu'un contrôle par solveur de cas particuliers de ce théorème.
#
# Usage : cd <racine du dépôt> && python tools/croix_existence.py
#         [--ordres 6,10,14,18] [--limite S]

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                        # noqa: E402
from graine_sat import CLASSES, controle                       # noqa: E402
from suite_croix import modele, figure, criteres, H_PARTENAIRE  # noqa: E402


def horizontal(m, x, r, c, n):
    """Un booléen vrai quand la case (r, c) est tracée horizontalement, c'est
    à dire quand son miroir horizontal porte la classe partenaire."""
    b = m.NewBoolVar(f'h{r}_{c}')
    paires = []
    for k in CLASSES:
        p = m.NewBoolVar('')
        jumeau = x[r, n - 1 - c, H_PARTENAIRE[k]]
        m.AddBoolAnd([x[r, c, k], jumeau]).OnlyEnforceIf(p)
        m.AddBoolOr([x[r, c, k].Not(), jumeau.Not(), p])
        paires.append(p)
    m.AddMaxEquality(b, paires)
    return b


def essai(n, limite=400.0):
    m, x, diag = modele(n)
    H = {(r, c): horizontal(m, x, r, c, n)
         for r in range(n) for c in range(n) if (r, c) not in diag}

    def impair(cases, nom):
        """Les cases données portent un nombre impair de traits : elles sont en
        nombre pair, chaque trait en consommant deux."""
        t = m.NewIntVar(0, n, nom)
        m.Add(2 * t == sum(cases))
        m.AddModuloEquality(1, t, 2)

    for r in range(n):
        impair([H[(r, c)] for c in range(n) if (r, c) not in diag], f't{r}')
    for c in range(n):
        impair([H[(r, c)].Not() for r in range(n) if (r, c) not in diag],
               f'u{c}')

    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    etat = s.Solve(m)
    if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(etat), None, diag
    mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                    for c in range(n)) for r in range(n)]
    return s.StatusName(etat), mots, diag


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 8, 10, 12, 14, 18])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 400.0
    for n in ordres:
        nom, mots, diag = essai(n, limite)
        if mots is None:
            verdict = ('AUCUNE croix ansée' if nom == 'INFEASIBLE'
                       else f'non tranché ({nom})')
            print(f'ordre {n:3d} : {verdict}', flush=True)
            continue
        _, ok = controle(mots, n)
        f = figure(mots, n, diag)
        tenus, h, v = criteres(f, n)
        print(f'ordre {n:3d} : croix ansée — magique {ok}, critères {tenus}, '
              f'traits par ligne {sorted(set(h))}, '
              f'par colonne {sorted(set(v))}', flush=True)
        if not (ok and tenus):
            sys.exit(1)


if __name__ == '__main__':
    main()
