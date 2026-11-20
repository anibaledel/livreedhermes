#!/usr/bin/env python3
"""Pour chacun des 64 représentants de data/corpus-256.json : comportement de la lecture binaire (4 triangles N,E,S,O par case)
sous les 8 isométries du carré. '=' couleurs conservées, 'i' couleurs inversées (1<->0), 'x' pas de symétrie.
Isométries (ordre) : 0 identité, 1 rot 90° (r,c)->(c,11-r), 2 rot 180°, 3 rot 270°, 4 miroir vertical (r,c)->(r,11-c),
5 miroir horizontal (r,c)->(11-r,c), 6 diagonale (r,c)->(c,r), 7 antidiagonale (r,c)->(11-c,11-r).
Usage : python3 check_symetries_binaire.py data/corpus-256.json > symetries-64.json"""
import json, sys
from collections import Counter
d = json.load(open(sys.argv[1])); E = {e['id']: e for e in d['entrees']}; n = 12
F = [lambda r,c:(r,c), lambda r,c:(c,n-1-r), lambda r,c:(n-1-r,n-1-c), lambda r,c:(n-1-c,r),
     lambda r,c:(r,n-1-c), lambda r,c:(n-1-r,c), lambda r,c:(c,r), lambda r,c:(n-1-c,n-1-r)]
D = {'N':(-1,0),'E':(0,1),'S':(1,0),'O':(0,-1)}; inv = {v:k for k,v in D.items()}; order = 'NESO'
def mapdir(f, dv):
    b = f(0,0); a = f(1,0); c = f(0,1)
    return (dv[0]*(a[0]-b[0]) + dv[1]*(c[0]-b[0]), dv[0]*(a[1]-b[1]) + dv[1]*(c[1]-b[1]))
out = {}
for cl in d['niveaux']['64']:
    rid = cl['representant']['id']; bits = E[rid]['binaire_144x4_NESO']
    T = {(r,c): bits[r*12+c] for r in range(n) for c in range(n)}; s = []
    for f in F:
        new = {}
        for (r,c), b in T.items():
            t = ['0']*4
            for i, ch in enumerate(order): t[order.index(inv[mapdir(f, D[ch])])] = b[i]
            new[f(r,c)] = ''.join(t)
        comp = lambda x: ''.join('1' if y == '0' else '0' for y in x)
        s.append('=' if all(new[p] == T[p] for p in T) else 'i' if all(new[p] == comp(T[p]) for p in T) else 'x')
    out[rid] = ''.join(s)
print(json.dumps(out, indent=1, ensure_ascii=False))
print(dict(Counter(out.values())), file=sys.stderr)
