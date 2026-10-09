#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# localise.py — quelles équations de magicité créent l'obstruction ?
#
# On garde la condition I, les deux critères de parité et la bijection, et on
# ajoute les sommes de lignes seules, puis les sommes de colonnes seules.
#
# RÉSULTAT. À l'ordre 6 les trois états sont satisfaisables. À l'ordre 8, le
# modèle sans sommes est satisfaisable, et il devient impossible dès qu'on
# ajoute les sommes de LIGNES seules — les sommes de colonnes ne sont donc pas
# nécessaires à l'obstruction.
#
# CE QUE CELA NE DIT PAS. Qu'une ligne isolée soit contradictoire. Le modèle
# conserve la condition I, les deux critères et la bijection, qui couplent les
# lignes entre elles ; le certificat est donc porté par ce couplage, et non par
# une ligne prise à part.
#
# Usage : cd <racine du dépôt> && python tools/localise.py [--ordres 6,8]
#         [--limite S]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortools.sat.python import cp_model
from graine_sat import CLASSES, valeur
from croix_existence import horizontal

def essai(n, lignes, colonnes, limite=120.0):
    M = n*(n*n+1)//2
    m = cp_model.CpModel()
    x = {(r,c,k): m.NewBoolVar('') for r in range(n) for c in range(n) for k in CLASSES}
    for r in range(n):
        for c in range(n): m.AddExactlyOne(x[r,c,k] for k in CLASSES)
    S = lambda cs: sum(valeur(k,r,c,n)*x[r,c,k] for r,c in cs for k in CLASSES)
    # bijection
    for k in range(n):
        for j in range(n):
            m.AddExactlyOne([x[k,j,'B'], x[k,n-1-j,'V'], x[n-1-k,n-1-j,'R'], x[n-1-k,j,'J']])
    # condition I
    diag = {(r,r) for r in range(n)} | {(r,n-1-r) for r in range(n)}
    for r in range(n):
        for c in range(n):
            for k in CLASSES:
                j = x[n-1-r,n-1-c,k]
                if (r,c) in diag: m.AddImplication(x[r,c,k], j)
                else: m.AddBoolOr([x[r,c,k].Not(), j.Not()])
    # criteres II-III
    H = {(r,c): horizontal(m,x,r,c,n) for r in range(n) for c in range(n) if (r,c) not in diag}
    def impair(cases, nom):
        t = m.NewIntVar(0,n,nom); m.Add(2*t == sum(cases)); m.AddModuloEquality(1,t,2)
    for r in range(n): impair([H[(r,c)] for c in range(n) if (r,c) not in diag], f't{r}')
    for c in range(n): impair([H[(r,c)].Not() for r in range(n) if (r,c) not in diag], f'u{c}')
    # sommes, au choix
    if lignes:
        for i in range(n): m.Add(S([(i,c) for c in range(n)]) == M)
    if colonnes:
        for i in range(n): m.Add(S([(r,i) for r in range(n)]) == M)
    s = cp_model.CpSolver(); s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    return s.StatusName(s.Solve(m))

if __name__ == '__main__':
    av = sys.argv
    ordres = [int(o) for o in av[av.index('--ordres')+1].split(',')] if '--ordres' in av else [6,8,10]
    limite = float(av[av.index('--limite')+1]) if '--limite' in av else 120.0
    for n in ordres:
        a = essai(n, False, False, limite)
        b = essai(n, True, False, limite)
        c = essai(n, False, True, limite)
        print(f'ordre {n:3d} : I+II+III seuls {a:12s} | + sommes de LIGNES {b:12s} '
              f'| + sommes de COLONNES {c:12s}', flush=True)
