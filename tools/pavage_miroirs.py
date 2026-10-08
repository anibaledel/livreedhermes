#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# pavage_miroirs.py — la méthode : un carré d'ordre 6 pavé par miroirs alternés
# donne un carré magique d'ordre 6m, pour tout m.
#
# ÉNONCÉ. Soit E un étiquetage d'ordre 6 du corpus, et m ≥ 1. On pave une grille
# d'ordre 6m avec m × m copies de E, la copie du bloc (i, j) étant
#
#     E               si i et j sont pairs
#     miroir gauche-droite de E   si j est impair et i pair
#     miroir haut-bas de E        si i est impair et j pair
#     demi-tour de E              si i et j sont impairs
#
# — autrement dit : un miroir par parité, dans chaque sens. On applique ensuite
# le protocole à l'ordre n = 6m. Le résultat est un carré magique, diagonales
# comprises.
#
# VÉRIFIÉ. 256/256 aux ordres 12, 18, 24 et 30 ; 12/12 sur échantillon aux
# ordres 36, 42, 48 et 60. Les quatre agencements de la page 031 sont le cas
# m = 2 de cette règle.
#
# LE MOTIF DE MIROIRS N'EST PAS LIBRE. À l'ordre 12, sur les 256 façons de
# choisir l'une des quatre orientations dans chacun des quatre blocs, 16
# seulement donnent un carré magique. L'alternance par parité en fait partie.
#
# Usage : cd <racine du dépôt> && python tools/pavage_miroirs.py [--jusqua M]

import json, os, sys, itertools, random

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LETTRE = {'rouge': 'R', 'bleu': 'B', 'vert': 'V', 'jaune': 'J'}
echecs = []

ident = lambda e: [r[:] for r in e]
horiz = lambda e: [r[::-1] for r in e]
verti = lambda e: e[::-1]
demi = lambda e: [r[::-1] for r in e[::-1]]
OPS = {'C': ident, 'H': horiz, 'V': verti, 'D': demi}


def etiquetage(f):
    e = [[None] * 6 for _ in range(6)]
    for coul, l in LETTRE.items():
        for r, c in f[coul + '_positions']:
            e[r][c] = l
    return e


def valeur(k, r, c, n):
    B = n * r + c + 1
    W = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': W, 'J': n * n + 1 - W}[k]


def magique(e, n):
    M = n * (n * n + 1) // 2
    g = [[valeur(e[r][c], r, c, n) for c in range(n)] for r in range(n)]
    if sorted(x for ligne in g for x in ligne) != list(range(1, n * n + 1)):
        return False
    return (all(sum(g[i]) == M for i in range(n))
            and all(sum(g[r][i] for r in range(n)) == M for i in range(n))
            and sum(g[i][i] for i in range(n)) == M
            and sum(g[i][n - 1 - i] for i in range(n)) == M)


def alterne(m):
    """Le motif de miroirs : un miroir par parité, dans chaque sens."""
    return [[('C', 'H', 'V', 'D')[(1 if j % 2 else 0) + (2 if i % 2 else 0)]
             for j in range(m)] for i in range(m)]


def pave(base, m, motif):
    n = 6 * m
    e = [[None] * n for _ in range(n)]
    for i in range(m):
        for j in range(m):
            b = OPS[motif[i][j]](base)
            for r in range(6):
                for c in range(6):
                    e[6 * i + r][6 * j + c] = b[r][c]
    return e


def main():
    doc = json.load(open(os.path.join(RACINE, 'data', 'referent_256_v3.json'),
                         encoding='utf-8'))
    bases = [etiquetage(f) for f in doc['forms']]
    jusqua = int(sys.argv[sys.argv.index('--jusqua') + 1]) if '--jusqua' in sys.argv else 5

    for m in range(1, jusqua + 1):
        n = 6 * m
        ok = sum(1 for b in bases if magique(pave(b, m, alterne(m)), n))
        print(f'ordre {n:3d} ({m} × {m} blocs) : {ok}/256 magiques')
        if ok != 256:
            echecs.append(f'ordre {n} : {256 - ok} carrés non magiques')

    random.seed(1)
    ech = random.sample(bases, 12)
    for m in (7, 8, 10):
        n = 6 * m
        ok = sum(1 for b in ech if magique(pave(b, m, alterne(m)), n))
        print(f'ordre {n:3d} ({m} × {m} blocs) : {ok}/12 sur échantillon')
        if ok != 12:
            echecs.append(f'ordre {n} : échantillon non magique')

    bons = sum(1 for motif in itertools.product('CHVD', repeat=4)
               if magique(pave(bases[0], 2, [[motif[0], motif[1]], [motif[2], motif[3]]]), 12))
    print(f'\nmotifs de miroirs donnant un carré magique à l’ordre 12 : {bons}/256')
    if bons != 16:
        echecs.append(f'{bons} motifs valides au lieu de 16')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nUn carré d’ordre 6, un pavage par miroirs alternés, et l’ordre 6m suit.')


if __name__ == '__main__':
    main()
