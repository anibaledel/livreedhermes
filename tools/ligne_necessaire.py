#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# ligne_necessaire.py — à quelles lignes l'égalité d'effectifs est-elle forcée ?
#
# L'ANCIENNE DÉRIVATION ÉTAIT FAUSSE. Annuler les coefficients des coordonnées
# donne les deux égalités d'équilibrage, et cela SUFFIT à rendre la somme
# indépendante du rang ; cela ne prouve pas qu'elles soient nécessaires. Le
# calcul exhaustif de l'ordre 6 montre que celle de colonne ne l'est pas
# (10 240 des 18 432 étiquetages magiques la violent), et le solveur montre ici
# que celle de ligne ne l'est pas non plus — mais seulement au centre.
#
# L'INÉGALITÉ. Les cases de classe B ou V de la ligne r prennent leurs valeurs
# dans le bloc r, celles de classe R ou J dans le bloc n−1−r. Si la ligne compte
# b cases des deux premières classes, sa somme vaut
#
#     n[(n−b)(n−1) + r(2b−n)] + T,     n ≤ T ≤ n²,
#
# chaque valeur dépassant le début de son bloc d'au moins 1 et d'au plus n. En
# posant d = b − n/2 et u = 2r − n + 1, l'égalité de cette somme à n(n²+1)/2
# impose
#
#     |d·u| ≤ (n−1)/2.
#
# C'est démontré, et c'est dissymétrique : dans B = nr + c + 1 le rang de ligne
# entre avec le coefficient n, la colonne avec le coefficient 1, de sorte qu'il
# n'y a pas d'inégalité analogue pour les colonnes.
#
# CONSÉQUENCES. Pour toute ligne hors de la bande centrale — |2r−n+1| > (n−1)/2,
# en particulier la première et la dernière — l'inégalité force d = 0. Au centre
# elle ne force rien, et le solveur y trouve des carrés magiques avec d ≠ 0 aux
# ordres 10, 14 et 18. À l'ordre 6, aucune ligne n'admet d ≠ 0, ce que
# l'énumération exhaustive des 18 432 confirme indépendamment.
#
# Usage : cd <racine du dépôt> && python tools/ligne_necessaire.py
#         [--ordres 6,10,14] [--limite S]

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                 # noqa: E402
from graine_sat import CLASSES, valeur, controle        # noqa: E402


def essai(n, ligne, b, limite=120.0):
    """Un étiquetage magique dont la ligne donnée compte b cases B ou V."""
    M = n * (n * n + 1) // 2
    m = cp_model.CpModel()
    x = {(r, c, k): m.NewBoolVar('')
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
    m.Add(sum(x[ligne, c, k] for c in range(n) for k in 'BV') == b)

    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    etat = s.Solve(m)
    if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(etat), None
    return s.StatusName(etat), [
        ''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                for c in range(n)) for r in range(n)]


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 10, 14])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 120.0
    for n in ordres:
        borne = (n - 1) // 2
        print(f'ordre {n} — l’inégalité démontrée : |d·u| ≤ {borne}')
        for ligne in range(n // 2):
            u = 2 * ligne - n + 1
            for d in (1, 2):
                b = n // 2 + d
                permis = abs(d * u) <= borne
                nom, mots = essai(n, ligne, b, limite)
                if mots is None:
                    etat = ('aucun' if nom == 'INFEASIBLE'
                            else f'non tranché ({nom})')
                    magique = ''
                else:
                    _, ok = controle(mots, n)
                    etat = 'EXISTE'
                    magique = f', contrôle indépendant {ok}'
                    if not ok:
                        print('  contrôle indépendant en échec', file=sys.stderr)
                        sys.exit(1)
                    if not permis:
                        print('  un carré viole l’inégalité démontrée',
                              file=sys.stderr)
                        sys.exit(1)
                print(f'  ligne {ligne:2d} (u = {u:4d}), b = {b:2d}, d = {d} : '
                      f'l’inégalité {"permet" if permis else "interdit"} ; '
                      f'{etat}{magique}', flush=True)


if __name__ == '__main__':
    main()
