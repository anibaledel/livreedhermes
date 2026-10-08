#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# miroirs_graine.py — la règle des miroirs dépend-elle de l'ordre de la graine ?
#
# La règle a été établie pour les graines d'ordre 6 : en pavant l'ordre 6m avec
# m×m copies, le résultat est magique SI ET SEULEMENT SI
#
#     h(i, j) = h(m−1−i, j)   et   v(i, j) = v(i, m−1−j)
#
# où h et v sont les bits de miroir du bloc (i, j). Maintenant qu'on a des
# graines aux ordres 10, 14, 22, 26, on peut demander si la règle est une
# propriété de l'ordre 6 ou du protocole. Ce script la teste à l'identique sur
# une graine d'ordre quelconque : il énumère TOUS les motifs de miroirs du
# pavage m×m et compare « magique » à « conforme à la règle ».
#
# Usage : python tools/miroirs_graine.py --ordre N [--copies M]

import itertools, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

CLASSES = 'BRVJ'


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def mots_graine(n, limite=120.0):
    """Une graine d'ordre n, par le solveur de contraintes."""
    from graine_sat import cherche
    nom, mots = cherche(n, limite)
    if mots is None:
        raise SystemExit(f'pas de graine d’ordre {n} ({nom})')
    return mots


def bloc(graine, h, v):
    """La graine réfléchie selon les deux bits de miroir — mêmes opérations
    que `pavage_miroirs.py` : des réflexions des étiquettes, sans échange de
    classes (h = miroir gauche-droite, v = miroir haut-bas)."""
    g = [list(l) for l in graine]
    if h:
        g = [l[::-1] for l in g]
    if v:
        g = g[::-1]
    return g


def pave(graine, bits, m):
    """Le pavage m×m, en mots de classes, d'ordre n·m."""
    n = len(graine)
    N = n * m
    out = [[None] * N for _ in range(N)]
    for i in range(m):
        for j in range(m):
            b = bloc(graine, *bits[(i, j)])
            for r in range(n):
                for c in range(n):
                    out[i * n + r][j * n + c] = b[r][c]
    return out


def magique(mots):
    N = len(mots)
    M = N * (N * N + 1) // 2
    g = [[valeur(mots[r][c], r, c, N) for c in range(N)] for r in range(N)]
    return (sorted(v for l in g for v in l) == list(range(1, N * N + 1))
            and all(sum(l) == M for l in g)
            and all(sum(g[r][c] for r in range(N)) == M for c in range(N))
            and sum(g[i][i] for i in range(N)) == M
            and sum(g[i][N - 1 - i] for i in range(N)) == M)


def conforme(bits, m):
    return (all(bits[(i, j)][0] == bits[(m - 1 - i, j)][0]
                for i in range(m) for j in range(m))
            and all(bits[(i, j)][1] == bits[(i, m - 1 - j)][1]
                    for i in range(m) for j in range(m)))


def main():
    a = sys.argv
    n = int(a[a.index('--ordre') + 1]) if '--ordre' in a else 10
    m = int(a[a.index('--copies') + 1]) if '--copies' in a else 2
    graine = mots_graine(n)
    print(f'graine d’ordre {n} :')
    for l in graine:
        print('    ' + ' '.join(l))
    print(f'  magique : {magique(graine)}')
    cases = [(i, j) for i in range(m) for j in range(m)]
    k = len(cases)
    print(f'\npavage {m}×{m} → ordre {n * m} : {4 ** k} motifs de miroirs')
    mag = reg = 0
    desaccord = []
    for choix in itertools.product([(0, 0), (0, 1), (1, 0), (1, 1)], repeat=k):
        bits = dict(zip(cases, choix))
        g, r = magique(pave(graine, bits, m)), conforme(bits, m)
        mag += g
        reg += r
        if g != r:
            desaccord.append((bits, g, r))
    attendu = 2 ** (2 * m * ((m + 1) // 2))
    print(f'  magiques            : {mag}')
    print(f'  conformes à la règle: {reg}   (2^(2m⌈m/2⌉) = {attendu})')
    print(f'  désaccords          : {len(desaccord)}')
    if desaccord:
        bits, g, r = desaccord[0]
        print(f'    premier : {bits}  magique={g} conforme={r}')


if __name__ == '__main__':
    main()
