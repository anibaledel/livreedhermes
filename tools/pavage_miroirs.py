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
# VÉRIFIÉ. 256/256 aux ordres 6, 12, 18, 24 et 30 ; 12/12 sur échantillon aux
# ordres 42, 48 et 60 — les trois ordres que ce script teste, et aucun autre. Les quatre agencements de la page 031 sont le cas
# m = 2 de cette règle.
#
# LE MOTIF DE MIROIRS N'EST PAS LIBRE. À l'ordre 12, sur les 256 façons de
# choisir l'une des quatre orientations dans chacun des quatre blocs, 16
# seulement donnent un carré magique. L'alternance par parité en fait partie.
#
# L'UNITÉ DU PAVAGE N'EST PAS LE CARRÉ D'ORDRE 6 mais le bloc de 3 × 3 — les
# quatre sous-ensembles de la page 034. On pave une grille d'ordre 6m avec
# 2m × 2m blocs de 3, le bloc (I, J) prenant le sous-ensemble (I mod 2, J mod 2).
# Le résultat est magique. Sur les 256 règles d'orientation par bloc, deux
# seulement passent : tout conforme, et tout demi-tour.
#
# Le décompte de la page 034 en découle : à l'ordre 30, la grille compte
# 10 × 10 blocs de trois, et chacun des quatre sous-ensembles y paraît
# exactement vingt-cinq fois.
#
# Usage : cd <racine du dépôt> && python tools/pavage_miroirs.py [--jusqua M]

import sys, itertools, random, collections

from lldh_commun import etiquetage, lire_referent, magique as magique_grille, protocole

echecs = []

ident = lambda e: [r[:] for r in e]
horiz = lambda e: [r[::-1] for r in e]
verti = lambda e: e[::-1]
demi = lambda e: [r[::-1] for r in e[::-1]]
OPS = {'C': ident, 'H': horiz, 'V': verti, 'D': demi}


def magique(e, n):
    """L'étiquetage e d'ordre n donne-t-il, par le protocole, un carré magique ?"""
    return magique_grille(protocole(e, n), n)[0]


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


def sousblocs(e):
    """Les quatre sous-ensembles 3 × 3 de la page 034."""
    return {(a, b): [[e[3 * a + i][3 * b + j] for j in range(3)] for i in range(3)]
            for a in range(2) for b in range(2)}


def pave3(base, m, regle):
    """Ordre 6m en blocs de 3 : le bloc (I, J) prend le sous-ensemble
    (I mod 2, J mod 2), orienté par regle."""
    sb = sousblocs(base)
    n = 6 * m
    e = [[None] * n for _ in range(n)]
    for I in range(2 * m):
        for J in range(2 * m):
            b = OPS[regle[(I // 2) % 2][(J // 2) % 2]](sb[(I % 2, J % 2)])
            for i in range(3):
                for j in range(3):
                    e[3 * I + i][3 * J + j] = b[i][j]
    return e


def blocs_de_trois(bases, ech):
    """L'unité du pavage est le bloc de 3, pas le carré d'ordre 6."""
    print('\nà l’échelle du bloc de 3 (page 034)')
    bons = [[[r[0], r[1]], [r[2], r[3]]] for r in itertools.product('CHVD', repeat=4)
            if all(magique(pave3(b, 2, [[r[0], r[1]], [r[2], r[3]]]), 12)
                   for b in bases[:40])]
    noms = sorted(''.join(r[0] + r[1]) for r in bons)
    print(f'  règles d’orientation par bloc valides à l’ordre 12 : {len(bons)}/256'
          f'  ({", ".join(noms)} — tout conforme, tout demi-tour)')
    if noms != ['CCCC', 'DDDD']:
        echecs.append(f'règles d’orientation par bloc de 3 : {noms} au lieu de CCCC et DDDD')

    for regle in bons:
        nom = regle[0][0] * 4
        for m, lot, total in ((2, bases, 256), (3, bases, 256),
                              (5, ech, len(ech)), (7, ech, len(ech))):
            ok = sum(1 for b in lot if magique(pave3(b, m, regle), 6 * m))
            print(f'  {nom} — ordre {6 * m:3d} : {ok}/{total}')
            if ok != total:
                echecs.append(f'blocs de 3, règle {nom}, ordre {6 * m} : {total - ok} échecs')

    # le décompte de la page 034 : chaque sous-ensemble 25 fois à l'ordre 30
    vus = collections.Counter((I % 2, J % 2) for I in range(10) for J in range(10))
    print(f'  ordre 30, 10 × 10 blocs de trois : chaque sous-ensemble '
          f'{sorted(set(vus.values()))[0]} fois')
    if set(vus.values()) != {25}:
        echecs.append('le décompte de la page 034 ne donne pas 25 par sous-ensemble')


def main():
    doc = lire_referent()
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
    ech20 = random.sample(bases, 20)
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

    blocs_de_trois(bases, ech20)

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nUn carré d’ordre 6, un pavage par miroirs alternés, et l’ordre 6m suit.')


if __name__ == '__main__':
    main()
