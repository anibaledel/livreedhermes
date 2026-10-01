#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""verif_images_axes.py — les 60 images du référent 360 sont des figures de parité d'axes.

Théorème (vérifié 60/60) : chaque image (famille F, nature ν) est
  - sur les 48 cases dont le centre est sur un axe de T1 YANG (offsets 0, ±3, deux sens) :
    une teinte de « lignes » ;
  - sur les 96 autres cases : la figure de parité de la réunion des familles T0
    nommées par F (15 parties non vides de {YANG, YANG MUT, YIN, YIN MUT} = 15 familles) ;
  - la nature ν fixe la permutation des teintes :
      YANG : lignes O, parité V/M ; YANG MUT = YANG avec V↔M ;
      YIN  = YANG avec (V→O, M→V, O→M) ; YIN MUT = YIN avec V↔O.
Ces trois permutations sont les involutions π de (F5) de la note JMA, ici construites.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from collections import Counter
imgs = images(); pts = pts_C1()
T0 = {'YANG':'T0 YANG','YANG-MUT':'T0 YANG MUT','YIN':'T0 YIN','YIN-MUT':'T0 YIN MUT'}
X = set()
for r in range(N):
    for c in range(N):
        x, y = c+0.5, r+0.5
        if any(abs(u_of(n,x,y)-c_of(n,e)) < 1e-9 for n,e in FAM['T1 YANG']): X.add((r,c))
assert len(X) == 48
chords = {}
for k in range(1,16):
    bs = [b for i,b in enumerate(['YANG','YANG-MUT','YIN','YIN-MUT']) if k>>i&1]
    axes = set(); [axes.update(FAM[T0[b]]) for b in bs]
    chords['+'.join(bs)] = figure(axes, pts)
ones = np.ones(len(pts), dtype=np.uint8); ok = 0
for key, g in sorted(imgs.items()):
    tints = Counter(g[r][c] for (r,c) in X)
    assert len(tints) == 1, key
    lines = next(iter(tints)); others = [t for t in 'VMO' if t != lines]
    v = np.array([1 if g[r][c]==others[0] else 0 for r in range(N) for c in range(N)], dtype=np.uint8)
    mask = np.array([0 if (r,c) in X else 1 for r in range(N) for c in range(N)], dtype=np.uint8)
    match = [nm for nm,f in chords.items() if np.array_equal(f&mask, v&mask) or np.array_equal((f^ones)&mask, v&mask)]
    assert len(match) == 1, (key, match)
    ok += 1
print(f"images = lignes(T1 YANG) + parité(accord T0) : {ok}/60")
def perm(g,p): return [[p.get(x,x) for x in row] for row in g]
groups = {}
for k,g in imgs.items():
    if k[0]=='BASES':
        for b in ('YANG-MUT','YIN-MUT','YANG','YIN'):
            if k[1].startswith(b+'-'): base,nat = b, k[1][len(b)+1:]; break
    else: base,nat = k[0], k[1]
    groups.setdefault(base,{})[nat] = g
a=b=c=0
for d in groups.values():
    a += d['YANG'] == perm(d['YANG-MUT'],{'V':'M','M':'V'})
    b += d['YIN']  == perm(d['YIN-MUT'],{'V':'O','O':'V'})
    c += d['YIN']  == perm(d['YANG'],{'V':'O','M':'V','O':'M'})
print(f"YANG MUT = YANG∘(V↔M) : {a}/15 ; YIN MUT = YIN∘(V↔O) : {b}/15 ; YIN = YANG∘(V→O,M→V,O→M) : {c}/15")
