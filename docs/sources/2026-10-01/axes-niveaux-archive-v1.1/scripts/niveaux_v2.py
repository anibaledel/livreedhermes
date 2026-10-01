#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""niveaux_v2.py — the second diagonal cut (V2): one generator per node of the doubling tree.

Reads axes-v2.json (the twelve elements YA1..YA6, AY1..AY6 as unit segments) and
catalogue-axes.json (the sixteen families). Prints, every number by computation:
  1. partition: 12 disjoint elements, 288 cell diagonals, 4095 distinct drawings
  2. level of each element: cos(pi*c/6), c the signed offset (x+y = 12+c, y-x = c)
  3. keys: YA_k and AY_(6-k) carry the same band systems (k = 1..5)
  4. YA_k U AY_(6-k) tiles its level lines exactly (ends + middles), 7 levels
  5. mutation: shifting the lines of YA_k by 6 in c gives the lines of AY_k
  6. the doubling tree on levels, and where the old diagonal families sit on it
  7. codes on C8 and C1 (canonical keys, continuity rule): rank, words, distance,
     relations, all-dark word, containment of the old code
  8. among the 4095 segment chords, the unions of complete level sets: 2^7 - 1
"""
import json, math, itertools, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from common import FAM, gf2_rank, pts_C1, pts_C8
import codes_cles as K

V2 = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'axes-v2.json')))['elements']
NAMES = [f'YA{k}' for k in range(1, 7)] + [f'AY{k}' for k in range(1, 7)]
def seg_line(s):
    x1, y1, x2, y2 = s
    if (x2 - x1) * (y2 - y1) > 0: return ('D-', (y1 - x1))          # slope +1 : y - x = c
    return ('D+', (x1 + y1) - 12)                                    # slope -1 : x + y = 12 + c
def norm(s): x1, y1, x2, y2 = s; return tuple(sorted([(x1, y1), (x2, y2)]))
theta = lambda c: round(math.degrees(math.acos(max(-1, min(1, math.cos(math.pi * c / 6))))))
key = lambda nat, c: (nat, ((c / 2 + 3) % 6) - 3)                    # c = 2e ; key = e mod 6 in (-3,3]

# 1. partition
segs = {n: {norm(s) for s in V2[n]} for n in NAMES}
allseg = set().union(*segs.values())
disj = sum(len(v) for v in segs.values()) == len(allseg)
cell_diags = {norm((c, r, c + 1, r + 1)) for r in range(12) for c in range(12)} | {norm((c, r + 1, c + 1, r)) for r in range(12) for c in range(12)}
print(f"1. sizes {[len(segs[n]) for n in NAMES]}; disjoint {disj}; union = the {len(cell_diags)} cell diagonals: {allseg == cell_diags}")
print(f"   distinct drawings over the 4095 non-empty subsets: {len({frozenset().union(*[segs[n] for n in ch]) for r in range(1,13) for ch in itertools.combinations(NAMES, r)})}")
# 2. levels
lines = {n: {seg_line(s) for s in V2[n]} for n in NAMES}
lev = {}
for n in NAMES:
    th = {theta(c) for _, c in lines[n]}; assert len(th) == 1, (n, th); lev[n] = th.pop()
print("2. levels:", {n: lev[n] for n in NAMES})
# 3. keys
keys = {n: {key(nat, c) for nat, c in lines[n]} for n in NAMES}
print("3. YA_k and AY_(6-k) same keys:", all(keys[f'YA{k}'] == keys[f'AY{6-k}'] for k in range(1, 6)),
      "; distinct key sets:", len({frozenset(v) for v in keys.values()}))
# 4. tiling of complete level lines
def full_line(nat, c):
    out = set()
    for r in range(12):
        for col in range(12):
            for s in ((col, r, col + 1, r + 1), (col, r + 1, col + 1, r)):
                if seg_line(s) == (nat, c): out.add(norm(s))
    return out
ok4 = []
for k in range(0, 7):
    th = 30 * k
    grp = [n for n in NAMES if lev[n] == th]
    U = set().union(*[segs[n] for n in grp])
    level_lines = {(nat, c) for nat in ('D+', 'D-') for c in range(-11, 12) if theta(c) == th and full_line(nat, c)}
    full = set().union(*[full_line(*l) for l in level_lines])
    ok4.append((th, '+'.join(grp), U == full))
print("4. each level tiled exactly by its elements:", ok4)
# 5. mutation as a shift by 6 in c (3 in offset e)
def shift6(L): return {(nat, c + 6 if c + 6 <= 11 else c - 6) for nat, c in L} | {(nat, c - 6) for nat, c in L if -11 <= c - 6}
mut = []
for k in range(1, 7):
    a, b = lines[f'YA{k}'], lines[f'AY{k}']
    sh = {(nat, cc) for nat, c in a for cc in (c + 6, c - 6) if -11 <= cc <= 11 and full_line(nat, cc)}
    mut.append((k, sh == b, lev[f'YA{k}'], lev[f'AY{k}']))
print("5. lines(YA_k) shifted by 6 in c == lines(AY_k), with levels theta, 180-theta:", mut)
# 6. doubling tree and old families
f = lambda t: min((2 * t) % 360, 360 - (2 * t) % 360)
print("6. doubling on levels:", {t: f(t) for t in range(0, 181, 30)})
oldkeys = {n: {K.key(a) for a in FAM[n]} for n in FAM if 'YANG' in n}
levkeys = {th: set().union(*[keys[n] for n in NAMES if lev[n] == th]) for th in range(0, 181, 30)}
for n, ks in oldkeys.items():
    print(f"   {n:12s} = levels {[th for th, lk in levkeys.items() if lk <= ks]}  exact union: {ks == set().union(*[lk for lk in levkeys.values() if lk <= ks])}")
# 7. codes
for label, pts in (('C8', pts_C8()), ('C1', pts_C1())):
    KV = {k: K.key_vec(k, pts) for k in K.KEYS}
    assert all(k in KV for lk in levkeys.values() for k in lk)
    gens = [(f'L{th}', np.bitwise_xor.reduce([KV[k] for k in lk])) for th, lk in sorted(levkeys.items())]
    gens += [(n, np.bitwise_xor.reduce([KV[k] for k in K.FAMK[n]])) for n in K.names if 'YIN' in n]
    n = len(gens); M = np.array([g for _, g in gens]); r = gf2_rank(M)
    fi = [int(''.join(map(str, g)), 2) for _, g in gens]; full = (1 << len(pts)) - 1
    W = [0] * (1 << n)
    for m in range(1, 1 << n):
        low = m & -m; W[m] = W[m ^ low] ^ fi[low.bit_length() - 1]
    nm = lambda m: ' + '.join(gens[i][0] for i in range(n) if m >> i & 1)
    d = min(bin(w).count('1') for w in W[1:] if w)
    minw = sorted({W[m] for m in range(1, 1 << n) if W[m] and bin(W[m]).count('1') == d})
    shortest = lambda target: min((m for m in range(1, 1 << n) if W[m] == target), key=lambda m: bin(m).count('1'))
    rel = [nm(m) for m in range(1, 1 << n) if W[m] == 0]
    old = np.array([np.bitwise_xor.reduce([KV[k] for k in K.FAMK[x]]) for x in K.names])
    print(f"7. {label}: [{len(pts)}, {r}, {d}]  (diagonal {gf2_rank(M[:7])} + orthogonal {gf2_rank(M[7:])}); "
          f"non-zero words {len(set(W[1:]) - {0})}; relations {rel}; "
          f"minimum-weight words {len(minw)}: {[nm(shortest(w)) for w in minw]}; "
          f"all-dark {'= ' + nm(shortest(full)) if full in W else 'not in span'}; old code contained: {gf2_rank(np.vstack([M, old])) == r}")
# 8. the 4095 segment chords that are unions of complete level sets
lvl_of = {th: set().union(*[segs[n] for n in NAMES if lev[n] == th]) for th in range(0, 181, 30)}
cnt = 0
for r_ in range(1, 13):
    for ch in itertools.combinations(NAMES, r_):
        U = set().union(*[segs[n] for n in ch])
        if all(U >= L or not (U & L) for L in lvl_of.values()): cnt += 1
print(f"8. segment chords that are unions of complete level sets: {cnt} (2^7 - 1 = 127)")
