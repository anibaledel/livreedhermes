#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# profils.py — les profils SYMÉTRIQUES (a, a, b, b) réalisables à l'ordre n.
#
# Ce script n'énumère pas tous les profils d'effectifs des étiquetages magiques :
# il explore la sous-famille des profils symétriques, celle où #B = #R et
# #V = #J. Il ne prétend donc rien des autres, et il en existe (voir ci-dessous).
#
# POURQUOI CETTE SOUS-FAMILLE, ET POURQUOI PAS PLUS. Si l'étiquetage respecte LES DEUX égalités
# d'équilibrage — par ligne #B + #V = #R + #J = n/2, par colonne
# #B + #J = #R + #V = n/2 — alors en sommant sur toute la grille :
#
#     B + V = n²/2      B + J = n²/2      ⇒  V = J
#     R + J = n²/2      R + V = n²/2      ⇒  B = R
#
# et le profil est symétrique, (a, a, b, b) avec a + b = n²/2. C'est le cas du
# corpus, et de tous les étiquetages pavables de l'ordre 6.
#
# MAIS L'ÉGALITÉ DE COLONNE N'EST PAS NÉCESSAIRE À LA MAGICITÉ : 10 240 des
# 18 432 étiquetages magiques d'ordre 6 la violent, et le solveur produit à
# l'ordre 18 des carrés magiques de profil (76, 80, 82, 86), qui n'est pas de
# la forme (a, a, b, b). La déduction ci-dessus ne vaut donc QUE pour les
# étiquetages satisfaisant aussi l'égalité de colonne — c'est-à-dire, à
# l'ordre 6, exactement les pavables, ceux qui portent une croix ansée, et le
# corpus parmi eux. Ce script travaille dans cette famille : il impose B = R
# et V = J comme contraintes, et ne prétend rien des étiquetages magiques qui
# sortent de la famille.
#
# DANS CETTE FAMILLE. Les 256 étiquetages du corpus ont tous (12, 12, 6, 6) :
# a = n²/3, b = n²/6 — ce qui exige 6 | n², c'est-à-dire 6 | n. La « proportion
# du tiers » n'est donc arithmétiquement possible qu'aux ordres multiples de 6.
#
# Ce script établit le spectre : pour chaque a, le solveur dit si un étiquetage
# magique d'effectifs (a, a, n²/2 − a, n²/2 − a) existe.
#
# Usage : cd <racine du dépôt> && python tools/profils.py [--ordre N] [--limite S]

import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ortools.sat.python import cp_model                      # noqa: E402
from graine_sat import CLASSES, valeur, controle              # noqa: E402


def cherche(n, a, limite=60.0):
    """Un étiquetage magique d'effectifs B = R = a, V = J = n²/2 − a."""
    M = n * (n * n + 1) // 2
    b = n * n // 2 - a
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
    for k, cible in (('B', a), ('R', a), ('V', b), ('J', b)):
        m.Add(sum(x[r, c, k] for r in range(n) for c in range(n)) == cible)

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
    n = int(av[av.index('--ordre') + 1]) if '--ordre' in av else 10
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 60.0
    demi = n * n // 2
    tiers = n * n / 3
    print(f'ordre {n} — profils symétriques (a, a, {demi}−a, {demi}−a) ;'
          f' les profils non symétriques ne sont pas explorés ici')
    print(f'  le tiers vaudrait a = n²/3 = {tiers:.2f}'
          f' — {"entier" if tiers == int(tiers) else "NON ENTIER : impossible"}')
    for a in range(demi // 2, demi + 1):
        nom, mots = cherche(n, a, limite)
        b = demi - a
        verdict = 'existe' if mots else ('AUCUN' if nom == 'INFEASIBLE'
                                         else f'non tranché ({nom})')
        marque = ''
        if mots:
            _, ok = controle(mots, n)
            marque = '  [contrôle indépendant : ' + ('OK]' if ok else 'ÉCHEC]')
        print(f'  ({a}, {a}, {b}, {b}) : {verdict}{marque}', flush=True)


if __name__ == '__main__':
    main()
