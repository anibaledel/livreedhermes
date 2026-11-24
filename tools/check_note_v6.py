#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
check_note_v6.py — les trois faits de la note « half-shift » (v6), relus sur data/referent_360_v3.json (prompt 242).

Vocabulaire : les 4 BASES (YIN, YIN-MUT, YANG, YANG-MUT) ; une FAMILLE est un sous-ensemble non vide des 4 bases (15 familles) ; chaque famille porte une couche par base
(les « teintes » du référent). D = YANG, D* = YANG-MUT, P = YIN, P* = YIN-MUT ; MUT = décalée d'une demi-période (6 cases sur 12).

Faits contrôlés (rien n'est supposé : tout est recalculé case par case) :
  1. ANTIPODE. Dans les 15 familles, les 4 couches ont la même partition des 144 cases en 3 classes de 48 ; elles ne diffèrent que par une permutation de teintes :
     yang → yang_mut = (V M), yang → yin_mut = (M O), yang → yin = (V O M) (V→O, O→M, M→V), les mêmes dans toutes les familles.
  2. COMPLÉMENT D'HEXAGRAMME. Pour n̄ = 63 − n : Φ(n̄, A, B) = π∘Φ(n, A, B) dans les 15 familles, pour les 2 couples (fixe, mut) = (yang, yang_mut) et (yin, yin_mut) :
     1 920 contrôles sur 1 920 (15 × 2 × 64). Φ(n̄) = Φ(n)∘σ (σ : décalage de 6 en lignes et en colonnes) dans 1 024 cas sur 1 920, ceux des 8 familles unifiées seulement.
  3. RÈGLE DE PARITÉ. Une famille est unifiée (Φ(n̄) = Φ(n)∘σ pour ses deux couples et les 64 n) si et seulement si elle contient EXACTEMENT UNE base de type yang (YANG ou YANG-MUT,
     pas les deux, pas aucune). Les 8 : {YANG}, {YANG-MUT}, {YANG,YIN}, {YANG,YIN-MUT}, {YANG-MUT,YIN}, {YANG-MUT,YIN-MUT}, {YANG,YIN,YIN-MUT}, {YANG-MUT,YIN,YIN-MUT}.
     Dans les 7 autres, la couche fixe est déjà invariante par σ et MUT n'en est que l'échange de deux teintes.
Φ(n, A, B) : la grille dont la case (r, c) est celle de A si le trait de niveau layer_of[r][c] de n vaut 1, de B sinon (n % 8 : trois traits du bas, n // 8 : trois du haut, poids faible d'abord,
comme hexagramGrid de galerie-patterns-unifies.html).

Usage : python3 tools/check_note_v6.py [--essai]     --essai : une couche faussée, une famille déclarée à tort unifiée et un n̄ faux doivent être refusés
"""
import json
import os
import sys
from collections import Counter, defaultdict

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = 12
BASES = ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']
TYPE_YANG = {'YANG', 'YANG-MUT'}
ESSAI = '--essai' in sys.argv
echecs = []


def ko(msg):
    echecs.append(msg)


def charger():
    d = json.load(open(os.path.join(RACINE, 'data', 'referent_360_v3.json'), encoding='utf-8'))
    L = d['layer_of']
    G = defaultdict(lambda: [[None] * N for _ in range(N)])
    for x in d['calques']:
        g = G[(x['famille'], x['teinte'])]
        for lab, cle in (('V', 'violet_positions'), ('M', 'magenta_positions'), ('O', 'orange_positions')):
            for r, c in x[cle]:
                g[r][c] = lab
    fam, bases = {}, {}
    for (f, t), g in G.items():
        if f == 'BASES':  # « YANG-MUT-YANG » : la famille d'une seule base (YANG-MUT), sa couche YANG
            cand = [(F, T) for F in BASES for T in BASES if F + '-' + T == t]
            assert len(cand) == 1, (t, cand)
            F, T = cand[0]
            cle, ens = '{' + F + '}', {F}
        elif f == 'YINYANG':
            cle, ens, T = f, set(BASES), t
        elif f.startswith('PAR3-SANS-'):
            cle, ens, T = f, set(BASES) - {f[len('PAR3-SANS-'):]}, t
        elif f.startswith('PAR2-'):
            reste = f[len('PAR2-'):]
            cand = [(a, b) for a in BASES for b in BASES if a != b and a + '-' + b == reste]
            assert len(cand) == 1, (f, cand)
            cle, ens, T = f, set(cand[0]), t
        else:
            raise SystemExit(f'famille inconnue : {f}')
        fam.setdefault(cle, {})[T] = g
        bases[cle] = ens
    return L, fam, bases


def classes(g):
    return frozenset(tuple(i for i in range(N * N) if g[i // N][i % N] == c) for c in 'VMO')


def permutation(A, B):
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(A[r][c], B[r][c]) != B[r][c]:
                return None
    return m


def phi(n, A, B, L):
    col, row = n % 8, n // 8
    traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1]
    return [[A[r][c] if traits[L[r][c] - 1] == 1 else B[r][c] for c in range(N)] for r in range(N)]


def decale(g):
    return [[g[(r + N // 2) % N][(c + N // 2) % N] for c in range(N)] for r in range(N)]


def appliquer(m, g):
    return [[m[x] for x in row] for row in g]


def mesurer(L, fam, bases, n_bar=lambda n: 63 - n):
    res = {'familles': len(fam), 'partitions': 0, 'permutations': Counter(), 'complement': 0, 'sur': 0, 'shift': 0, 'unifiees': set(), 'par_famille': {}}
    for f, ls in fam.items():
        if len({classes(g) for g in ls.values()}) == 1 and all(sorted(len(c) for c in classes(g)) == [48, 48, 48] for g in ls.values()):
            res['partitions'] += 1
        for t in ('YANG-MUT', 'YIN-MUT', 'YIN'):
            m = permutation(ls['YANG'], ls[t])
            res['permutations'][(t, tuple(sorted(m.items())) if m else None)] += 1
        tout_shift = True
        for a, b in (('YANG', 'YANG-MUT'), ('YIN', 'YIN-MUT')):
            A, B = ls[a], ls[b]
            pi = permutation(A, B)
            invol = pi is not None and all(pi[pi[x]] == x for x in pi)
            for n in range(64):
                F, Fb = phi(n, A, B, L), phi(n_bar(n), A, B, L)
                res['sur'] += 1
                if invol and Fb == appliquer(pi, F):
                    res['complement'] += 1
                if Fb == decale(F):
                    res['shift'] += 1
                else:
                    tout_shift = False
        if tout_shift:
            res['unifiees'].add(f)
    return res


def main():
    L, fam, bases = charger()
    r = mesurer(L, fam, bases)
    # 1. antipode
    if r['familles'] != 15:
        ko(f'{r["familles"]} familles au lieu de 15')
    if r['partitions'] != 15:
        ko(f'partition en 3 classes de 48 commune aux 4 couches : {r["partitions"]} familles sur 15')
    attendu = {('YANG-MUT', (('M', 'V'), ('O', 'O'), ('V', 'M'))): 15, ('YIN-MUT', (('M', 'O'), ('O', 'M'), ('V', 'V'))): 15, ('YIN', (('M', 'V'), ('O', 'M'), ('V', 'O'))): 15}
    if dict(r['permutations']) != attendu:
        ko(f'permutations de teintes : {dict(r["permutations"])} au lieu de yang→yang_mut = (V M), yang→yin_mut = (M O), yang→yin = (V O M) dans les 15 familles')
    # 2. complément d'hexagramme
    if (r['complement'], r['sur']) != (1920, 1920):
        ko(f'Φ(n̄) = π∘Φ(n) : {r["complement"]} contrôles sur {r["sur"]} (1 920 sur 1 920 attendus)')
    if r['shift'] != 1024:
        ko(f'Φ(n̄) = Φ(n)∘σ : {r["shift"]} sur {r["sur"]} (1 024 attendus)')
    # 3. règle de parité
    parite = {f for f, ens in bases.items() if len(ens & TYPE_YANG) == 1}
    if r['unifiees'] != parite or len(parite) != 8:
        ko(f'règle de parité : unifiées {sorted(r["unifiees"])} ; une seule base yang {sorted(parite)}')
    attendues = [{'YANG'}, {'YANG-MUT'}, {'YANG', 'YIN'}, {'YANG', 'YIN-MUT'}, {'YANG-MUT', 'YIN'}, {'YANG-MUT', 'YIN-MUT'}, {'YANG', 'YIN', 'YIN-MUT'}, {'YANG-MUT', 'YIN', 'YIN-MUT'}]
    if sorted(map(sorted, (bases[f] for f in r['unifiees']))) != sorted(map(sorted, attendues)):
        ko('les 8 familles unifiées ne sont pas celles de la note')
    if not ESSAI:
        if echecs:
            for e in echecs:
                print('ÉCHEC', e, file=sys.stderr)
            sys.exit(1)
        print(f'OK    note v6 : 15 familles, partition commune (3 × 48) et permutations (V M) · (M O) · (V O M) dans les 15 ; complément Φ(n̄) = π∘Φ(n) : {r["complement"]} / {r["sur"]} ; '
              f'Φ(n̄) = Φ(n)∘σ : {r["shift"]} / {r["sur"]} ; unifiées = exactement une base yang : {len(r["unifiees"])} familles.')
        return
    # --essai : trois falsifications doivent être vues
    vus = 0
    import copy
    f0 = sorted(fam)[0]
    faux = copy.deepcopy(fam)
    faux[f0]['YIN'][0][0] = 'V' if faux[f0]['YIN'][0][0] != 'V' else 'M'
    if mesurer(L, faux, bases)['permutations'] != r['permutations'] or mesurer(L, faux, bases)['complement'] != 1920:
        vus += 1
    if mesurer(L, fam, bases, n_bar=lambda n: 62 - n)['complement'] == 1920:
        print('ÉCHEC --essai : un n̄ faux n\'est pas vu', file=sys.stderr)
        sys.exit(1)
    vus += 1
    fausses = dict(bases)
    fausses[sorted(r['unifiees'])[0]] = set(BASES)  # une famille unifiée déclarée à tort à quatre bases : la règle de parité ne la retrouverait plus
    if {f for f, ens in fausses.items() if len(ens & TYPE_YANG) == 1} != r['unifiees']:
        vus += 1
    if vus != 3:
        print(f'ÉCHEC --essai : {vus} falsification(s) vue(s) sur 3', file=sys.stderr)
        sys.exit(1)
    print('OK    --essai : une couche faussée, un n̄ faux et une famille déclarée à tort sont refusés (3 sur 3).')


if __name__ == "__main__":
    main()
