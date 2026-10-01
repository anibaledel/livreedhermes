"""Table de reference : figures de parite distinctes par taille d'accord.

Autonome sauf catalogue-axes.json et regle_parite.py (regle canonique :
cle = (nature, u mod 12), XOR sur l'ENSEMBLE des cles).

Sortie attendue (figures NON NULLES, tailles 1..16) :
  C8 : 14, 91, 377, 1091, 2365, 4004, 5433, 6006, 5434, 4004, 2366, 1092, 378, 92, 14, 1
  C1 : 14, 91, 377, 1056, 2099, 3080, 3571, 3667, 3572, 3079, 2099, 1056, 377, 92, 13, 1
  noyau C8 : 7 mots non nuls, tailles 2,2,3,4,5,5,7        (dim 3)
  noyau C1 : 15 mots non nuls, + 8,10,10,11,12,13,13,15    (dim 4)
  total distinct non nul : 8191 (C8), 4095 (C1)
"""
import json, math
from regle_parite import cle, u_de

fam = json.load(open('catalogue-axes.json'))['familles']
names = list(fam)

C1 = [(x + 0.5, y + 0.5) for y in range(12) for x in range(12)]

def triangles():
    pts = []
    for cy in range(12):
        for cx in range(12):
            c = (cx + 0.5, cy + 0.5)
            corners = [(cx, cy), (cx + 1, cy), (cx + 1, cy + 1), (cx, cy + 1)]
            mids = [(cx + .5, cy), (cx + 1, cy + .5), (cx + .5, cy + 1), (cx, cy + .5)]
            for i in range(4):
                for m in (mids[i - 1], mids[i]):
                    p = corners[i]
                    pts.append(((c[0] + p[0] + m[0]) / 3., (c[1] + p[1] + m[1]) / 3.))
    return pts

C8 = triangles()
assert len(C8) == 1152 and len(C1) == 144

def figure(axes, points):
    S = {cle(a['nature'], a['ecart']) for a in axes}
    v = 0
    for i, (x, y) in enumerate(points):
        b = 0
        for nat, c in S:
            b ^= int(math.floor((u_de(nat, x, y) - c) / 12.)) & 1
        if b:
            v |= 1 << i
    return v

for label, pts in (('C8', C8), ('C1', C1)):
    gen = [figure(fam[n], pts) for n in names]
    bysize, kern = {}, []
    for m in range(1, 1 << 16):
        s = bin(m).count('1')
        v, mm, i = 0, m, 0
        while mm:
            if mm & 1:
                v ^= gen[i]
            mm >>= 1
            i += 1
        if v == 0:
            kern.append(s)
        else:
            bysize.setdefault(s, set()).add(v)
    allf = set()
    for s in bysize:
        allf |= bysize[s]
    print(label, 'non nulles par taille :', [len(bysize.get(s, ())) for s in range(1, 17)])
    print(label, 'total distinct non nul :', len(allf))
    print(label, 'noyau : sizes', sorted(kern), '-> dim', (len(kern) + 1).bit_length() - 1)
