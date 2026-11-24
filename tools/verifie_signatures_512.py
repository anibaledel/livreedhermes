#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
verifie_signatures_512.py — re-vérifie les résultats du prompt 246 (signatures des 512 patterns unifiés, relations avec le Yi Jing) sur data/referent_360_v3.json, sans le prototype 247.

Les 512 patterns : les 4 familles représentantes {YANG}, {YANG-MUT}, {YIN,YANG}, {YIN,YANG-MUT} × 2 couples (yang, yang_mut) et (yin, yin_mut) × 64 hexagrammes (n : ligne 1 = bas = bit 0, bit à 1 = trait plein).
Contrôles : 512 grilles distinctes ; loi de parité spectrale (teinte fixe et somme des deux autres : k1 + k2 pairs ; différence : impairs) 512 / 512 ; orbites sous D4 × <σ> × S3 : 128 de 4 grilles,
chacune { n, 63 − n } × { couple YANG, couple YIN } ; complément = même forme 512 / 512 ; distance de deux grilles = 16 × distance de Hamming dans les 8 jeux ; 16 cases par ligne sur 24 ; teinte fixe
orange (couple YANG) ou magenta (couple YIN) ; relations du Yi Jing (inversion, échange des trigrammes, nucléaire) comparées au hasard ; et, si un fichier de fiches est donné en argument, sa cohérence
(512 lignes, numéros King Wen de la page de création, compléments, orbites). Usage : python3 tools/verifie_signatures_512.py [fiches.csv]
"""
import csv
import itertools
import os
import random
import re
import sys
from collections import Counter, defaultdict

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import check_note_v6 as note  # noqa: E402  (charger() : le référent 360 en 15 familles de 4 couches)

N = 12
L, FAM, BASES_DE = note.charger()
REPS = [('{YANG}', 'BASE-YANG'), ('{YANG-MUT}', 'BASE-YANG-MUT'), ('PAR2-YIN-YANG', 'PAR2-YIN-YANG'), ('PAR2-YIN-YANG-MUT', 'PAR2-YIN-YANG-MUT')]
COUPLES = [('YANG', 'YANG-MUT', 'YANG'), ('YIN', 'YIN-MUT', 'YIN')]
Lm = np.array(L)
echecs = []
controles = 0


def ok(cond, msg):
    global controles
    controles += 1
    if not cond:
        echecs.append(msg)


def phi(n, A, B):
    return np.array([[(A if (n >> (L[r][c] - 1)) & 1 else B)[r][c] for c in range(N)] for r in range(N)])


rows = []
for cle, nom in REPS:
    for a, b, cname in COUPLES:
        A, B = FAM[cle][a], FAM[cle][b]
        for n in range(64):
            rows.append(dict(f=nom, c=cname, n=n, A=A, B=B, g=phi(n, A, B)))
ok(len(rows) == 512 and len({r['g'].tobytes() for r in rows}) == 512, '512 patterns, 512 grilles distinctes')

S3 = [dict(zip('VMO', p)) for p in itertools.permutations('VMO')]
shift = lambda g: np.roll(np.roll(g, 6, 0), 6, 1)


def orbite(g):
    out = []
    for h in (g, g[:, ::-1]):
        k = h
        for _ in range(4):
            for hh in (k, shift(k)):
                for p in S3:
                    out.append(np.array([[p[x] for x in r] for r in hh]).tobytes())
            k = np.rot90(k)
    return min(out)


for r in rows:
    r['canon'] = orbite(r['g'])
orb = defaultdict(list)
for r in rows:
    orb[r['canon']].append((r['f'], r['c'], r['n']))
ok(len(orb) == 128 and Counter(len(v) for v in orb.values()) == {4: 128}, f'128 orbites de 4 grilles ({len(orb)} ; tailles {dict(Counter(len(v) for v in orb.values()))})')
ok(all(len({(f, n if n < 63 - n else 63 - n) for f, c, n in v}) == 1 and {c for f, c, n in v} == {'YANG', 'YIN'} and {n for f, c, n in v} == {v[0][2], 63 - v[0][2]} for v in orb.values()),
   'chaque orbite = { n, 63 − n } × { couple YANG, couple YIN } (même famille)')
idx = {(r['f'], r['c'], r['n']): r for r in rows}
ok(all(idx[(f, c, 63 - n)]['canon'] == idx[(f, c, n)]['canon'] for (f, c, n) in idx), 'complément = même forme : 512 / 512')

# loi de parité spectrale
def spectre(g):
    return {c: np.fft.fft2((g == c).astype(float)) for c in 'VMO'}


parite = 0
for r in rows:
    g, S = r['g'], spectre(r['g'])
    fixes = [c for c in 'VMO' if np.array_equal(shift(g == c), g == c)]
    if len(fixes) != 1:
        continue
    o = fixes[0]
    u, v = [c for c in 'VMO' if c != o]
    somme, diff = S[u] + S[v], S[u] - S[v]
    bon = True
    for k1 in range(N):
        for k2 in range(N):
            if (k1 + k2) % 2:
                bon &= abs(S[o][k1, k2]) < 1e-9 and abs(somme[k1, k2]) < 1e-9
            else:
                bon &= abs(diff[k1, k2]) < 1e-9
    parite += bon
    r['fixe'] = o
ok(parite == 512, f'loi de parité spectrale : {parite} / 512')
ok(all(r['fixe'] == ('O' if r['c'] == 'YANG' else 'M') for r in rows if 'fixe' in r) and sum('fixe' in r for r in rows) == 512, 'teinte fixe : orange pour le couple YANG, magenta pour le couple YIN')

# localité : distance = 16 × Hamming ; 16 cases par ligne sur 24 ; 48 cases de la teinte fixe ne changent jamais
loc = True
for f, c in {(r['f'], r['c']) for r in rows}:
    gs = [idx[(f, c, n)]['g'] for n in range(64)]
    loc &= all(int((gs[n] != gs[m]).sum()) == 16 * bin(n ^ m).count('1') for n in range(64) for m in range(64))
    A, B = idx[(f, c, 0)]['A'], idx[(f, c, 0)]['B']
    loc &= all(int(((np.array(A) != np.array(B)) & (Lm == lev)).sum()) == 16 for lev in range(1, 7))
    constantes = np.all(np.stack(gs) == gs[0], axis=0)
    loc &= int(constantes.sum()) == 48 and set(gs[0][constantes].tolist()) == {('O' if c == 'YANG' else 'M')}
ok(loc, 'distance de deux grilles = 16 × distance de Hamming (8 jeux) ; 16 cases par ligne sur 24 ; 48 cases de la teinte fixe ne changent jamais')

# relations du Yi Jing
line = lambda n, i: (n >> (i - 1)) & 1
rel = {
    'complément': lambda n: 63 - n,
    'inversion': lambda n: int(format(n, '06b')[::-1], 2),
    'échange des trigrammes': lambda n: ((n & 7) << 3) | (n >> 3),
    'nucléaire': lambda n: sum(v << i for i, v in enumerate([line(n, 2), line(n, 3), line(n, 4), line(n, 3), line(n, 4), line(n, 5)])),
}
random.seed(1)
cles = list(idx)
res = {}
for nom, fn in rel.items():
    mem = tot = 0
    for (f, c, n) in cles:
        m = fn(n)
        if m != n:
            tot += 1
            mem += idx[(f, c, m)]['canon'] == idx[(f, c, n)]['canon']
    refs = []
    for _ in range(100):
        s = t = 0
        for (f, c, n) in cles:
            m = random.randrange(64)
            if m != n:
                t += 1
                s += idx[(f, c, m)]['canon'] == idx[(f, c, n)]['canon']
        refs.append(s / t)
    res[nom] = (mem, tot, sum(refs) / len(refs), max(refs))
attendu = {'complément': (512, 512), 'inversion': (64, 448), 'échange des trigrammes': (64, 448), 'nucléaire': (16, 496)}
for nom, (mem, tot, moy, mx) in res.items():
    ok((mem, tot) == attendu[nom], f'{nom} : {mem} / {tot} de même forme (attendu {attendu[nom][0]} / {attendu[nom][1]}) ; hasard {100 * moy:.1f} % (max {100 * mx:.1f} %)')
# l'inversion et l'échange des trigrammes ne coïncident avec le complément que là où ils lui sont égaux
for nom in ('inversion', 'échange des trigrammes'):
    fn = rel[nom]
    egaux = all((fn(n) == 63 - n) for (f, c, n) in cles if idx[(f, c, fn(n))]['canon'] == idx[(f, c, n)]['canon'] and fn(n) != n)
    ok(egaux, f'{nom} : de même forme seulement quand il coïncide avec le complément')

# fiches (optionnel)
if len(sys.argv) > 1:
    kw = eval(re.search(r'const KINGWEN_BY_CHRONO = (\[[^\]]*\])', open(os.path.join(RACINE, 'creation-motifs-yi-king.html'), encoding='utf-8').read()).group(1))
    fiches = list(csv.DictReader(open(sys.argv[1], encoding='utf-8')))
    ok(len(fiches) == 512, f'fiches : {len(fiches)} lignes (512 attendues)')
    ok(all(int(x['king_wen']) == kw[int(x['n'])] and int(x['complement_n']) == 63 - int(x['n']) and int(x['complement_king_wen']) == kw[63 - int(x['n'])] for x in fiches), 'fiches : numéros King Wen de la page de création et compléments')
    ok(len({x['orbite_Gamma'] for x in fiches}) == 128, 'fiches : 128 orbites')
    ok(all(x['teinte_fixe'] == ('O' if x['couple'] == 'YANG' else 'M') for x in fiches), 'fiches : teinte fixe')
    # centroïde spectral : moyenne de k1² + k2² (fréquences repliées) pondérée par l'énergie, sans la composante continue
    ecart = 0.0
    cles_fam = {'{YANG}': 'BASE-YANG', '{YANG-MUT}': 'BASE-YANG-MUT', '{YIN,YANG}': 'PAR2-YIN-YANG', '{YIN,YANG-MUT}': 'PAR2-YIN-YANG-MUT'}
    for x in fiches:
        r = idx[(cles_fam[x['famille']], x['couple'], int(x['n']))]
        S = spectre(r['g']); P = sum(np.abs(S[c]) ** 2 for c in 'VMO'); num = tot = 0.0
        for k1 in range(N):
            for k2 in range(N):
                if k1 == 0 and k2 == 0:
                    continue
                e = P[k1, k2]; r2 = min(k1, N - k1) ** 2 + min(k2, N - k2) ** 2
                tot += e; num += e * r2
        ecart = max(ecart, abs(num / tot - float(x['centroide_spectral'])))
    ok(ecart < 1e-3, f'fiches : centroïde spectral recalculé, écart maximal {ecart:.4f}')

for nom, (mem, tot, moy, mx) in res.items():
    print(f'  {nom:24s} {mem:3d} / {tot:3d} de même forme ; hasard {100 * moy:.1f} % (max {100 * mx:.1f} %)')
if echecs:
    for e in [e for e in echecs if e]:
        print('ÉCHEC', e, file=sys.stderr)
    sys.exit(1)
print(f'OK    signatures des 512 patterns : {controles} contrôles — 512 grilles distinctes, parité spectrale 512 / 512, 128 orbites de 4, complément = même forme, distance = 16 × Hamming, relations du Yi Jing comparées au hasard.')
