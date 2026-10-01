#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""espace_F2_4.py — the four T0 bases as a basis of (Z/2)^4, and the half-shift as a linear form.

Prints:
  - rank of the four T0 parity figures on the 96 cells off L        (expected 4)
  - rank of the same four figures together with the all-dark figure  (expected 5)
    => Phi : F -> Pi(F) is injective on (Z/2)^4, even up to complement
  - for each base b, whether Pi(b) o sigma = Pi(b) or its complement (sigma = (6,6))
    => epsilon(b) = 1 exactly for T0 YANG and T0 YANG MUT
  - the 15 non-zero F with epsilon(F) = sum of epsilon(b) mod 2, and the count 8 / 7
"""
import sys, os, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
pts = pts_C1()
B = ['T0 YANG', 'T0 YANG MUT', 'T0 YIN', 'T0 YIN MUT']
L = set()
for r in range(N):
    for c in range(N):
        x, y = c+0.5, r+0.5
        if any(abs(u_of(n,x,y)-c_of(n,e)) < 1e-9 for n,e in FAM['T1 YANG']): L.add((r,c))
off = [i for i,(r,c,_) in enumerate(pts) if (r,c) not in L]
assert len(L) == 48 and len(off) == 96
fig = {b: figure(FAM[b], pts) for b in B}
M = np.array([fig[b][off] for b in B]); ones = np.ones(len(off), dtype=np.uint8)
print(f"rank of the four T0 figures on the 96 cells off L : {gf2_rank(M)} (expected 4)")
print(f"rank with the all-dark figure added               : {gf2_rank(np.vstack([M, ones]))} (expected 5)")
def shift(v):
    g = v.reshape(N, N); return np.array([[g[(r-6)%N][(c-6)%N] for c in range(N)] for r in range(N)], dtype=np.uint8).ravel()
eps = {}
for b in B:
    s = shift(fig[b])
    if np.array_equal(s, fig[b]): eps[b] = 0
    elif np.array_equal(s, fig[b]^1): eps[b] = 1
    else: raise SystemExit(f"{b}: sigma is neither identity nor complement")
    print(f"epsilon({b:12s}) = {eps[b]}   (Pi o sigma = {'complement' if eps[b] else 'Pi'})")
n1 = 0
for k in range(1, 16):
    F = [b for i,b in enumerate(B) if k>>i & 1]
    v = np.zeros(len(pts), dtype=np.uint8)
    for b in F: v ^= fig[b]
    e = sum(eps[b] for b in F) % 2
    assert np.array_equal(shift(v), v ^ e), F
    n1 += e
print(f"Pi(F) o sigma = Pi(F) + epsilon(F)*1 on all 15 F ; epsilon = 1 on {n1}/15 (expected 8), 0 on {15-n1}/15 (expected 7)")
