#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# parite_suit.py — les critères II et III suivent-ils de la condition I ?
#
# Dans le modèle GÉOMÉTRIQUE (`croix_ansee_n.py`), où chaque orbite de quatre
# cases est tracée librement, toutes les figures sont centralement symétriques —
# 64 sur 64 à l'ordre 6 — et pourtant 8 seulement tiennent la parité des lignes
# et 2 celle des lignes et des colonnes. La symétrie centrale n'entraîne donc
# pas la parité dans ce modèle.
#
# Sur un carré AUTO-CONSTRUIT, c'est autre chose. La condition I — les paires
# par demi-tour sont exactement les 2n cases des diagonales — est une contrainte
# sur l'étiquetage, et non un choix de tracé. Ce script demande au solveur s'il
# existe un carré magique à condition I dont une ligne, ou une colonne, porte un
# nombre PAIR de traits. Chaque INFEASIBLE dit que la parité de cette ligne est
# une conséquence de la condition I, pas une hypothèse supplémentaire.
#
# RÉSULTATS. À l'ordre 6, la parité suit de la condition I sur toutes les lignes
# et toutes les colonnes, et l'énumération exhaustive des 18 432 le confirme d'un
# autre côté : 8 192 vérifient la condition I, et ce sont les mêmes 8 192 qui
# tiennent II et III (voir `croix_auto.py`). À l'ordre 10 l'implication tient
# hors de la bande centrale et TOMBE au centre — contre-exemples magiques
# recontrôlés hors du modèle en ligne 4 et en colonne 2. Les critères de parité
# ne sont donc pas partout une conséquence, et la définition de la croix ansée
# par I + II + III n'est pas redondante dès l'ordre 10.
#
# La symétrie centrale n'y est pour rien : dans le modèle géométrique toutes les
# figures sont centralement symétriques et la parité y est rare.
#
# Usage : cd <racine du dépôt> && python tools/parite_suit.py
#         [--ordres 6,10,14] [--limite S]

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                  # noqa: E402
from graine_sat import CLASSES, controle              # noqa: E402
from suite_croix import modele                           # noqa: E402
from croix_existence import horizontal                   # noqa: E402


def contre_exemple(n, sens, indice, limite=120.0):
    """Un carré magique à condition I dont la ligne (ou la colonne) donnée
    porte un nombre pair de traits, s'il en existe."""
    m, x, diag = modele(n)
    H = {(r, c): horizontal(m, x, r, c, n)
         for r in range(n) for c in range(n) if (r, c) not in diag}
    if sens == 'ligne':
        cases = [H[(indice, c)] for c in range(n) if (indice, c) not in diag]
    else:
        cases = [H[(r, indice)].Not() for r in range(n)
                 if (r, indice) not in diag]
    t = m.NewIntVar(0, n, 't')
    m.Add(2 * t == sum(cases))
    m.AddModuloEquality(0, t, 2)
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    etat = s.Solve(m)
    if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(etat), None
    mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                    for c in range(n)) for r in range(n)]
    return s.StatusName(etat), mots


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 10, 14])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 120.0
    for n in ordres:
        print(f'ordre {n} — la parité suit-elle de la condition I ?')
        for sens in ('ligne', 'colonne'):
            for i in range(n // 2):
                nom, mots = contre_exemple(n, sens, i, limite)
                if mots is None:
                    verdict = ('la parité suit de la condition I'
                               if nom == 'INFEASIBLE'
                               else f'non tranché ({nom})')
                else:
                    g, ok = controle(mots, n)
                    verdict = ('CONTRE-EXEMPLE, contrôle indépendant '
                               + ('OK' if ok else 'ÉCHEC'))
                    if not ok:
                        print('  le contre-exemple n’est pas magique',
                              file=sys.stderr)
                        sys.exit(1)
                print(f'  {sens} {i} : {verdict}', flush=True)


if __name__ == '__main__':
    main()
