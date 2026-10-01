#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""demi_decalage.py — le Théorème 2 de la note JMA dérivé de la structure d'axes.

Pour chaque famille F du référent 360 : l'image yang translatée de (6,6) est-elle
l'image yang-mut (paires unifiées) ou l'image yang elle-même (invariance) ?
Attendu : yang-mut ssi F contient exactement une base de type yang (8 familles).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
imgs = images()
def shift(g): return [[g[(r-6)%N][(c-6)%N] for c in range(N)] for r in range(N)]
BASES = ('YANG-MUT','YIN-MUT','YANG','YIN')
def parse(k):
    f, t = k
    if f == 'BASES':
        for b in BASES:
            if t.startswith(b+'-'): return b, [b], t[len(b)+1:]
    if f.startswith('PAR2-'):
        s = f[5:]
        for a in BASES:
            if s.startswith(a+'-'): return f, [a, s[len(a)+1:]], t
    if f.startswith('PAR3-SANS-'): return f, [x for x in BASES if x != f[10:]], t
    return f, list(BASES), t
groups = {}
for k, g in imgs.items():
    fam, bases, nat = parse(k); groups.setdefault(fam, {'bases': bases})[nat] = g
unified = invariant = 0
for fam, d in sorted(groups.items()):
    ny = sum(b in ('YANG','YANG-MUT') for b in d['bases'])
    u = shift(d['YANG']) == d['YANG-MUT'] and shift(d['YIN']) == d['YIN-MUT']
    i = shift(d['YANG']) == d['YANG'] and shift(d['YIN']) == d['YIN']
    assert u == (ny == 1) and i == (ny != 1), fam
    unified += u; invariant += i
    print(f"{fam:24s} bases de type yang : {ny}  →  {'paire unifiée' if u else 'invariante'}")
print(f"unifiées {unified}/15 (attendu 8), invariantes {invariant}/15 (attendu 7)")
