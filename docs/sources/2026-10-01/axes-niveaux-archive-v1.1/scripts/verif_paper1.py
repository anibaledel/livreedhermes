#!/usr/bin/env python3
"""verif_paper1.py — chaque nombre de la note [A], imprime par un script.

Entrees : catalogue-axes.json, regle_parite.py (regle canonique des cles).
Aucune dependance externe. Duree : ~2 min (les balayages sur 2^16 accords).

Couverture : Theoremes 1 et 2 (cloture), §2.1 (les quatre familles T0),
§3 (tableau des preimages, deux tours, Proposition 1), Theoreme 3 (fleches et
egalites, familles fixes), Theoreme 4 (critere de fuite) et son corollaire,
§5.1 (droites contre systemes), Theoremes 6 et 7 (code), Theoreme 8 (periodes).
"""
import json, math, itertools
from collections import defaultdict
from regle_parite import cle, u_de

FAM = json.load(open('catalogue-axes.json'))['familles']
NOMS = list(FAM)
ORTHO = ('H', 'V')

def fold(v):
    v = (v + 6) % 12 - 6
    return 6.0 if abs(v + 6) < 1e-9 else round(v, 6)

def ecarts(nom, natures):
    return sorted({fold(a['ecart']) for a in FAM[nom] if a['nature'] in natures})

G = sorted({fold(-6 + 0.5 * i) for i in range(1, 25)})      # demi-grille, 24 ecarts
SIG = {e: fold(2 * e) for e in G}

def titre(t): print('\n' + t + '\n' + '-' * len(t))

# --- Theoremes 1 et 2 : la cloture par doublement inverse -------------------
def cloture(origine):
    S = {fold(e) for e in origine}; tailles = [len(S)]
    while True:
        new = S | {f for f in G if SIG[f] in S}
        if new == S: return tailles, sorted(S)
        S = new; tailles.append(len(S))

titre('Theoremes 1 et 2 — cloture par sigma^-1 des niveaux fixes')
O = {n: ecarts(n, ORTHO) for n in NOMS if ecarts(n, ORTHO)}
D = {n: ecarts(n, ('D+', 'D-')) for n in NOMS if ecarts(n, ('D+', 'D-'))}
print('  niveaux fixes orthogonaux : T0 YIN', O['T0 YIN'], '| T2 YIN MUT', O['T2 YIN MUT'])
print('  niveaux fixes diagonaux   : T0 YANG', D['T0 YANG'], '| T2 YANG', D['T2 YANG'])
to, So = cloture(O['T0 YIN'] + O['T2 YIN MUT'])
td, Sd = cloture(D['T0 YANG'] + D['T2 YANG'])
print(f'  orthogonal : tailles {to} -> {len(So)} ecarts')
print(f'  diagonal   : tailles {td} -> {len(Sd)} ecarts, losange 6 present : {6.0 in Sd}')
print('  orthogonal = reunion des huit familles YIN :',
      So == sorted({e for v in O.values() for e in v}))
print('  diagonal   = reunion des huit familles YANG + {6} :',
      So == sorted(set(Sd)) and sorted(set(Sd) - {6.0}) == sorted({e for v in D.values() for e in v}))
for nom, orig in (('0deg orthogonal', O['T0 YIN']), ('0deg diagonal', D['T0 YANG']),
                  ('120deg orthogonal', O['T2 YIN MUT']), ('120deg diagonal', D['T2 YANG'])):
    t, S = cloture(orig); print(f'  seul, {nom:18s}: tailles {t} -> {len(S)}')
for nat, orig, plein in (('orthogonal', O['T0 YIN'] + O['T2 YIN MUT'], So),
                         ('diagonal', D['T0 YANG'] + D['T2 YANG'], Sd)):
    S = {fold(e) for e in orig} - {6.0}
    while True:
        new = (S | {f for f in G if SIG[f] in S}) - {6.0}
        if new == S: break
        S = new
    print(f'  sans le 6, {nat:10s}: {len(S)} ecarts ; perdus {sorted(set(plein) - S)}')

# --- §3 : preimages, deux tours, mutation ----------------------------------
titre('§3 — preimages, deux tours, Proposition 1')
def preim(s): return sorted({f for f in G if SIG[f] in s})
for n, v in O.items():
    p = preim(v)
    cov = [m for m, w in O.items() if set(w) <= set(p)]
    print(f'  sigma^-1({n:14s}) = ' + (' U '.join(cov) if cov else 'vide'))
ok = True
for n, v in O.items():
    base, mut = (n, n + ' MUT') if not n.endswith('MUT') else (n[:-4], n)
    if mut in O and base in O:
        dec = sorted({fold((e + 3) % 6 if (e + 3) % 6 <= 3 else (e + 3) % 6 - 6) for e in O[base]})
        got = sorted({round(e % 6 if e % 6 <= 3 else e % 6 - 6, 6) for e in O[mut]})
        exp = sorted({round(e % 6 if e % 6 <= 3 else e % 6 - 6, 6) for e in dec})
        if got != exp: ok = False; print('   ECHEC', n, got, exp)
print('  Proposition 1 (e -> e+3 mod 6) sur les quatre niveaux orthogonaux :', ok)

# --- Theoreme 3 : fleches, egalites, familles fixes ------------------------
titre('Theoreme 3 — images, egalites, familles fixes')
ALL = {n: (O.get(n), D.get(n)) for n in NOMS}
def img(s): return sorted({fold(2 * e) for e in s})
fixes, egal = [], []
for n in NOMS:
    nat = O if n in O else D
    v = nat[n]; i = img(v)
    host = sorted([m for m, w in nat.items() if set(i) <= set(w)], key=lambda m: len(nat[m]))
    if not host: print(f'  {n:14s} -> HORS DU VOCABULAIRE {i}'); continue
    h = host[0]; eq = set(i) == set(nat[h])
    if h == n: fixes.append(n)
    if eq: egal.append(f'{n} = {h}')
    print(f'  {n:14s} -> {h:14s} {"(egalite)" if eq else ""}')
print('  familles fixes :', fixes)
print('  egalites       :', egal)

# --- Theoreme 4 : critere de fuite, et cloture harmonique ------------------
titre('Theoreme 4 — ou la descente sort du vocabulaire')
# la fuite se juge contre les familles TRACEES : le losange 6 est dans la
# cloture mais n est pas trace, et c est par lui que la descente sort.
VOC = {'o': {e for v in O.values() for e in v},
       'd': {e for v in D.values() for e in v}}
def sort_du_voc(chord):
    for n in chord:
        nat, voc = (O, VOC['o']) if n in O else (D, VOC['d'])
        if not set(img(nat[n])) <= voc: return True
    return False
fuite = crit = 0
for m in range(1, 1 << 16):
    ch = [NOMS[i] for i in range(16) if (m >> i) & 1]
    f = sort_du_voc(ch)
    c = ('T0 YANG MUT' in ch) or ('T1 YANG' in ch)
    fuite += f
    crit += (f == c)
print(f'  accords dont l image sort : {fuite}')
print(f'  accord sort  <=>  contient T0 YANG MUT ou T1 YANG : {crit}/65535')
clos = 0
for m in range(1, 1 << 16):
    ch = [NOMS[i] for i in range(16) if (m >> i) & 1]
    ok2 = True
    for n in ch:
        nat = O if n in O else D
        u = set(img(nat[n]))
        if not any(u <= set(nat[p]) for p in ch if (p in O) == (n in O)): ok2 = False; break
    clos += ok2
print(f'  accords harmoniquement clos (sigma(A) inclus dans A) : {clos}')

# --- §5.1 : droites contre systemes ----------------------------------------
titre('§5.1 — droites tracees et systemes de bandes')
tot_l = {(a['nature'], round(a['ecart'], 6)) for n in NOMS for a in FAM[n]}
tot_k = {cle(a['nature'], a['ecart']) for n in NOMS for a in FAM[n]}
part = sum(1 for d in tot_l if sum(1 for n in NOMS
           if d in {(a['nature'], round(a['ecart'], 6)) for a in FAM[n]}) > 1)
print(f'  segments tracés distincts : {len(tot_l)} ; partages par deux familles : {part}')
print(f'  systemes de bandes (cles) : {len(tot_k)}')
for n in NOMS:
    l = len({(a['nature'], round(a['ecart'], 6)) for a in FAM[n]})
    k = len({cle(a['nature'], a['ecart']) for a in FAM[n]})
    if k < l: print(f'    {n:14s} {l:2d} droites -> {k} systemes')

# --- Theoremes 6 et 7 : le code --------------------------------------------
titre('Theoremes 6 et 7 — parametres du code')
C1 = [(x + .5, y + .5) for y in range(12) for x in range(12)]
def triangles():
    p = []
    for cy in range(12):
        for cx in range(12):
            c = (cx + .5, cy + .5)
            co = [(cx, cy), (cx + 1, cy), (cx + 1, cy + 1), (cx, cy + 1)]
            mi = [(cx + .5, cy), (cx + 1, cy + .5), (cx + .5, cy + 1), (cx, cy + .5)]
            for i in range(4):
                for m in (mi[i - 1], mi[i]):
                    q = co[i]; p.append(((c[0]+q[0]+m[0])/3., (c[1]+q[1]+m[1])/3.))
    return p
C8 = triangles()
def keyfig(k, pts):
    nat, c = k; v = 0
    for i, (x, y) in enumerate(pts):
        if int(math.floor((u_de(nat, x, y) - c) / 12.)) & 1: v |= 1 << i
    return v
def rang(vs):
    b = []
    for v in vs:
        for p in b: v = min(v, v ^ p)
        if v: b.append(v); b.sort(reverse=True)
    return len(b)
for lab, pts in (('C8', C8), ('C1', C1)):
    KF = {k: keyfig(k, pts) for k in sorted(tot_k)}
    i0 = min(range(len(pts)), key=lambda i: pts[i][0] ** 2 + pts[i][1] ** 2)   # region d angle
    ONE = (1 << len(pts)) - 1
    gen = []
    for n in NOMS:
        v = 0
        for k in {cle(a['nature'], a['ecart']) for a in FAM[n]}: v ^= KF[k]
        if (v >> i0) & 1: v ^= ONE
        gen.append(v)
    nul = [k for k, v in KF.items() if v == 0]
    mots = {}
    for m in range(1, 1 << 16):
        v = 0; mm = m; i = 0
        while mm:
            if mm & 1: v ^= gen[i]
            mm >>= 1; i += 1
        if v and (v not in mots or bin(m).count('1') < bin(mots[v]).count('1')): mots[v] = m
    dmin = min(bin(v).count('1') for v in mots)
    mini = [v for v in mots if bin(v).count('1') == dmin]
    ker = [m for m in range(1, 1 << 16)
           if not [0 for _ in ()] and (lambda mm: True)(m)]
    kern = []
    for m in range(1, 1 << 16):
        v = 0; mm = m; i = 0
        while mm:
            if mm & 1: v ^= gen[i]
            mm >>= 1; i += 1
        if v == 0: kern.append(sorted(NOMS[i] for i in range(16) if (m >> i) & 1))
    print(f'  {lab} : cles {len(KF)}, nulles {len(nul)}, rang des cles {rang(list(KF.values()))}')
    print(f'       rang des familles {rang(gen)} ; [{len(pts)}, {rang(gen)}] dmin {dmin} ;'
          f' mots de poids min {len(mini)}')
    for v in mini:
        m = mots[v]; print('       mot minimal =', ' + '.join(NOMS[i] for i in range(16) if (m >> i) & 1))
    print(f'       mots non nuls {len(mots)} ; noyau : {len(kern)} mots, tailles '
          f'{sorted(len(w) for w in kern)}')
    if lab == 'C1':
        for w in kern:
            if len(w) == 8: print('       relation supplementaire :', ' + '.join(w))
        base = [g for g in gen]
        t = ONE
        b = []
        for v in base:
            for p in b: v = min(v, v ^ p)
            if v: b.append(v); b.sort(reverse=True)
        for p in b: t = min(t, t ^ p)
        print('       tout-sombre dans l espace engendre :', t == 0)
        brut = []
        for n in NOMS:
            v = 0
            for k in {cle(a['nature'], a['ecart']) for a in FAM[n]}: v ^= KF[k]
            brut.append(v)
        print(f'       sans ancrage (polarite de la regle) : rang {rang(brut)}')
        print(f'       avec ancrage (region de reference claire) : rang {rang(gen)}')
        print('       la dimension perdue est l inversion globale :'
              ' T1 YANG + T1 YANG MUT + T2 YANG + T2 YANG MUT')

# --- Theoreme 8 : les periodes ---------------------------------------------
titre('Theoreme 8 — quelles periodes')
def descente(N):
    niv = {min(j, N - j) for j in range(N)}
    s = {j: min((2 * j) % N, (-2 * j) % N) for j in niv}
    cyc = False
    for j in niv:
        vu, x = [], j
        for _ in range(64):
            if x in vu: cyc = cyc or (len(vu) - vu.index(x) > 1); break
            vu.append(x); x = s[x]
    fixes = [j for j in niv if s[j] == j and j != 0]
    a = 0; M = N
    while M % 2 == 0: M //= 2; a += 1
    return (not cyc), fixes, a, M
print('   N   sans cycle   niveaux fixes non nuls   profondeur   M impair')
for N in (6, 8, 10, 12, 16, 18, 24, 48):
    sc, fx, a, M = descente(N)
    print(f'  {N:3d}   {str(sc):10s}   {str(fx):22s}   {a:^10d}   {M}')
bons = [N for N in range(2, 49, 2) if descente(N)[0]]
print('  sans cycle, N <= 48 :', bons)
attendu = sorted({2**a for a in range(1, 7) if 2 <= 2**a <= 48} |
                 {3 * 2**a for a in range(1, 5) if 3 * 2**a <= 48})
print('  = {2^a} U {3.2^a}, N pair :', bons == attendu)
print('\nfin.')
