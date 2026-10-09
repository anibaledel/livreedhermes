#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# congruences.py — l'obstruction est-elle une CONGRUENCE, et à quel module ?
#
# On remplace les sommes de lignes entières par leurs réductions modulo q, en
# gardant la bijection, la condition I et les deux critères de parité. Si le
# modèle reste satisfaisable pour un q donné, aucune obstruction congruentielle
# à ce module n'existe ; s'il devient impossible, une obstruction modulo q
# suffit.
#
# ATTENTION, ET C'EST LE POINT MÉTHODOLOGIQUE : la satisfaisabilité modulo q
# n'est PAS monotone en q. Tester quelques valeurs ne donne donc aucun « seuil ».
# C'est pourquoi `--balayage` parcourt TOUS les modules de 2 à n², et c'est le
# seul mode dont on puisse tirer « le plus petit module obstructif ».
#
# Usage : cd <racine du dépôt> && python tools/congruences.py [--ordres 6,8]
#         [--limite S]      temps par module
#         --balayage        tous les modules de 2 à n², et non quelques valeurs
#         --modules 2,4,19,64   exactement ces modules, dans cet ordre
#
# Les trois verdicts sont tenus séparés : satisfaisable, impossible, et NON
# TRANCHÉ. Un non-tranché n'est jamais compté comme une impossibilité, et s'il
# en reste un seul, le script dit que le plus petit module obstructif n'est pas
# établi.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortools.sat.python import cp_model
from graine_sat import CLASSES, valeur
from croix_existence import horizontal

def essai(n, q, limite=120.0):
    M = n*(n*n+1)//2
    m = cp_model.CpModel()
    x = {(r,c,k): m.NewBoolVar('') for r in range(n) for c in range(n) for k in CLASSES}
    for r in range(n):
        for c in range(n): m.AddExactlyOne(x[r,c,k] for k in CLASSES)
    for k in range(n):
        for j in range(n):
            m.AddExactlyOne([x[k,j,'B'], x[k,n-1-j,'V'], x[n-1-k,n-1-j,'R'], x[n-1-k,j,'J']])
    diag = {(r,r) for r in range(n)} | {(r,n-1-r) for r in range(n)}
    for r in range(n):
        for c in range(n):
            for k in CLASSES:
                j = x[n-1-r,n-1-c,k]
                if (r,c) in diag: m.AddImplication(x[r,c,k], j)
                else: m.AddBoolOr([x[r,c,k].Not(), j.Not()])
    H = {(r,c): horizontal(m,x,r,c,n) for r in range(n) for c in range(n) if (r,c) not in diag}
    def impair(cases, nom):
        t = m.NewIntVar(0,n,nom); m.Add(2*t == sum(cases)); m.AddModuloEquality(1,t,2)
    for r in range(n): impair([H[(r,c)] for c in range(n) if (r,c) not in diag], f't{r}')
    for c in range(n): impair([H[(r,c)].Not() for r in range(n) if (r,c) not in diag], f'u{c}')
    # sommes de lignes : entieres si q est None, sinon congruence modulo q
    for i in range(n):
        S = sum(valeur(k,i,c,n)*x[i,c,k] for c in range(n) for k in CLASSES)
        if q is None:
            m.Add(S == M)
        else:
            haut = n*n*n
            v = m.NewIntVar(0, haut, f'S{i}'); m.Add(v == S)
            m.AddModuloEquality(M % q, v, q)
    s = cp_model.CpSolver(); s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    return s.StatusName(s.Solve(m))

if __name__ == '__main__':
    av = sys.argv
    ordres = [int(o) for o in av[av.index('--ordres')+1].split(',')] if '--ordres' in av else [6,8]
    limite = float(av[av.index('--limite')+1]) if '--limite' in av else 60.0
    balayage = '--balayage' in av
    choisis = ([None if o in ('None', 'aucun', '0') else int(o)
                for o in av[av.index('--modules') + 1].split(',')]
               if '--modules' in av else None)
    for n in ordres:
        if choisis is not None:
            print(f'ordre {n} — modules demandés', flush=True)
            for q in choisis:
                nom = essai(n, q, limite)
                etq = 'entier (= M)' if q is None else f'mod {q}'
                print(f'  {etq:14s} : {nom}', flush=True)
            continue
        if not balayage:
            ligne = f'ordre {n:3d} :'
            for q in (2, 4, 8, 16, 32, n * n // 2, n * n, None):
                nom = essai(n, q, limite)
                etq = 'entier' if q is None else f'mod {q}'
                ligne += f'  [{etq}] {nom}'
            print(ligne, flush=True)
            continue

        print(f'ordre {n} — balayage de tous les modules de 2 à n² = {n * n}',
              flush=True)
        sat, insat, flou = [], [], []
        for q in range(2, n * n + 1):
            nom = essai(n, q, limite)
            (sat if nom in ('OPTIMAL', 'FEASIBLE')
             else insat if nom == 'INFEASIBLE' else flou).append(q)
            print(f'  mod {q:4d} : {nom}', flush=True)
        nom = essai(n, None, limite)
        print(f'  entier   : {nom}')
        print(f'\n  satisfaisables : {len(sat)} modules')
        print(f'  impossibles    : {len(insat)} modules'
              + (f' — le plus petit est {min(insat)}' if insat else ''))
        if flou:
            print(f'  non tranchés   : {len(flou)} modules : {flou}')
            print('  le plus petit module obstructif n’est donc pas établi')
        elif insat:
            m = min(insat)
            print(f'\n  plus petit module obstructif : {m}'
                  + (f' = n²' if m == n * n else
                     f' = n²/{n * n // m}' if n * n % m == 0 else ''))
