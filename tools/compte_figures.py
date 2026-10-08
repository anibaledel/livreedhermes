#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# compte_figures.py — combien de figures candidates à l'ordre n, et pourquoi
# c'est toujours une puissance de deux.
#
# LES CRITÈRES DE PARITÉ SONT UN SYSTÈME LINÉAIRE. Par le lemme d'orbite, une
# figure se code par un bit par orbite : 1 = tracée horizontalement, 0 =
# verticalement, et il y a k = n(n−2)/4 orbites hors diagonales. Une orbite de
# bit 1 crée exactement UN trait horizontal dans la ligne r et un dans la ligne
# n−1−r ; une orbite de bit 0 crée un trait vertical dans la colonne c et un
# dans n−1−c. Donc, en notant O(r) les orbites touchant la ligne r et O'(c)
# celles touchant la colonne c, les critères II et III s'écrivent
#
#     Σ_{i ∈ O(r)}  b_i  ≡ 1   (mod 2)      pour chaque ligne r
#     Σ_{i ∈ O'(c)} b_i  ≡ |O'(c)| − 1      pour chaque colonne c
#
# — un système AFFINE sur GF(2) en les k inconnues b_i. Le nombre de figures
# candidates est donc 0 si le système est incompatible, et 2^(k − rang) sinon.
# C'est une démonstration, non une énumération : elle vaut à tout ordre pair, et
# elle explique pourquoi les comptes obtenus par force brute — 2, 32, 2 048 —
# sont des puissances de deux.
#
# LE RANG VAUT n − 1, ET C'EST DÉMONTRÉ. Posons n = 2m. Une orbite est déterminée
# par la paire de lignes {r, n−1−r} et la paire de colonnes {c, n−1−c} qu'elle
# occupe, soit par un couple (i, j) avec i, j ∈ {0, …, m−1} ; et elle est
# diagonale exactement quand i = j, car c = r et c = n−1−r donnent la même paire
# de colonnes. Les orbites hors diagonales sont donc les couples (i, j) avec
# i ≠ j : ce sont les ARÊTES DU GRAPHE BIPARTI K(m, m) PRIVÉ D'UN COUPLAGE
# PARFAIT, au nombre de m(m−1) = n(n−2)/4.
#
# Les lignes r et n−1−r touchent les mêmes orbites, donc donnent la MÊME
# équation : il n'y a que m équations de ligne distinctes, et m de colonne. Et
# les orbites touchant la ligne de paire i sont exactement les arêtes incidentes
# au sommet gauche i. Le système est donc le système d'incidence de ce graphe,
# aux 2m sommets.
#
# Sur F2, la matrice d'incidence d'un graphe CONNEXE a pour rang (nombre de
# sommets) − 1, sa seule dépendance étant la somme de toutes les lignes, qui
# compte chaque arête deux fois. K(m, m) privé d'un couplage parfait est connexe
# dès m ≥ 3 ; donc rang = 2m − 1 = n − 1 pour n ≥ 6.
#
# La compatibilité suit du même calcul : la somme de tous les seconds membres
# vaut m·1 + m·(m−2) = m(m−1), toujours pair, donc la dépendance est satisfaite
# et le système admet des solutions. D'où
#
#     #figures candidates = 2^(m(m−1) − (2m−1)) = 2^(m² − 3m + 1),
#
# soit 2^((n² − 6n + 4)/4) :
#
#     ordre  6 : 2^1  = 2            ordre 14 : 2^29
#     ordre  8 : 2^5  = 32           ordre 16 : 2^41
#     ordre 10 : 2^11 = 2 048        ordre 18 : 2^55
#     ordre 12 : 2^19 = 524 288      ordre 30 : 2^181
#
# Les trois premières valeurs sont retrouvées indépendamment par l'énumération
# exhaustive de `croix_ansee_n.py` et de `compte_croix.py`.
#
# L'ORDRE 4 EST L'EXCEPTION, et elle confirme l'argument : pour m = 2, K(2, 2)
# privé d'un couplage parfait est fait de deux arêtes disjointes, donc NON
# connexe ; le rang tombe à 2m − 2 = 2, le système devient incompatible, et il
# n'y a aucune figure candidate. La formule vaut pour n ≥ 6.
#
# CE QUE CE SCRIPT NE DIT PAS. Une figure candidate n'est une croix ansée que si
# un étiquetage magique auto-construit la RÉALISE. À l'ordre 6 les deux
# candidates le sont ; à l'ordre 8 aucune des 32 ne l'est ; c'est
# `compte_croix.py` qui tranche, figure par figure. Le compte ci-dessous est
# donc un majorant du nombre de croix ansées, pas ce nombre.
#
# Usage : cd <racine du dépôt> && python tools/compte_figures.py [--ordres 6,8,10]

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from croix_ansee_n import orbites                        # noqa: E402


def systeme(n):
    """Le système affine sur GF(2) : une équation par ligne et par colonne,
    chaque inconnue étant le bit d'une orbite."""
    orbs = orbites(n)
    eqs = []
    for r in range(n):
        v = 0
        for i, o in enumerate(orbs):
            if any(a == r for (a, b) in o):
                v |= 1 << i
        eqs.append((v, 1))
    for c in range(n):
        v, m = 0, 0
        for i, o in enumerate(orbs):
            if any(b == c for (a, b) in o):
                v |= 1 << i
                m += 1
        eqs.append((v, (m - 1) % 2))
    return len(orbs), eqs


def compte(n):
    """(orbites, rang, nombre de figures candidates)."""
    k, rows = systeme(n)
    rows = list(rows)
    rang = 0
    for col in range(k):
        p = next((i for i in range(rang, len(rows))
                  if rows[i][0] >> col & 1), None)
        if p is None:
            continue
        rows[rang], rows[p] = rows[p], rows[rang]
        pv, pc = rows[rang]
        for i in range(len(rows)):
            if i != rang and (rows[i][0] >> col & 1):
                rows[i] = (rows[i][0] ^ pv, rows[i][1] ^ pc)
        rang += 1
    if any(v == 0 and c == 1 for v, c in rows):
        return k, rang, 0
    return k, rang, 2 ** (k - rang)


def resout(n):
    """Une solution particulière et une base du noyau, sur GF(2).

    C'est la traduction du théorème en algorithme : au lieu de parcourir les
    2^k configurations pour en retenir 2^(k−rang), on paramètre directement
    l'espace des solutions. À l'ordre 12 cela fait 524 288 figures au lieu de
    2^30, à l'ordre 14 2^29 au lieu de 2^42.

    Rend (k, rang, particuliere, base) en masques de bits, ou None si le
    système est incompatible."""
    k, rows = systeme(n)
    rows = list(rows)
    rang = 0
    pivots = []
    for col in range(k):
        p = next((i for i in range(rang, len(rows))
                  if rows[i][0] >> col & 1), None)
        if p is None:
            continue
        rows[rang], rows[p] = rows[p], rows[rang]
        pv, pc = rows[rang]
        for i in range(len(rows)):
            if i != rang and (rows[i][0] >> col & 1):
                rows[i] = (rows[i][0] ^ pv, rows[i][1] ^ pc)
        pivots.append(col)
        rang += 1
    if any(v == 0 and c == 1 for v, c in rows):
        return None
    libres = [c for c in range(k) if c not in set(pivots)]
    # forme échelonnée réduite : chaque pivot est seul dans sa colonne
    particuliere = 0
    for i, col in enumerate(pivots):
        if rows[i][1]:
            particuliere |= 1 << col
    base = []
    for libre in libres:
        v = 1 << libre
        for i, col in enumerate(pivots):
            if rows[i][0] >> libre & 1:
                v |= 1 << col
        base.append(v)
    return k, rang, particuliere, base


def vecteur(r, masque):
    """La figure candidate de rang `masque` : solution particulière plus la
    combinaison des vecteurs de la base que ce masque désigne.

    Le coût est celui du nombre de bits du masque, non du rang : on atteint
    donc directement la milliardième figure sans produire les précédentes.
    C'est ce qui rend `--depart` utilisable à l'ordre 14."""
    k, rang, part, base = r
    v = part
    i = 0
    while masque:
        if masque & 1:
            v ^= base[i]
        masque >>= 1
        i += 1
    return [(v >> j) & 1 for j in range(k)]


def engendre(n, depart=0, combien=None):
    """Les vecteurs de bits des figures candidates, de `depart` inclus à
    `depart + combien` exclu — 2^(k−rang) en tout, au lieu de 2^k. L'accès est
    direct : un départ loin dans l'espace ne fabrique pas ce qui le précède."""
    r = resout(n)
    if r is None:
        return
    total = 1 << len(r[3])
    fin = total if combien is None else min(total, depart + combien)
    for masque in range(depart, fin):
        yield vecteur(r, masque)


ATTENDU = {6: 2, 8: 32, 10: 2048, 12: 524288, 14: 2 ** 29}


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 8, 10, 12, 14, 16, 18, 22, 30, 42])
    ecarts = []
    for n in ordres:
        k, rang, nb = compte(n)
        formule = 2 ** ((n * n - 6 * n + 4) // 4)
        marque = '' if nb == formule else '   ÉCART AVEC LA FORMULE'
        print(f'ordre {n:3d} : {k:4d} orbites, rang {rang:3d}, '
              f'{nb} figures candidates{marque}')
        if nb != formule or rang != n - 1:
            ecarts.append(n)
        if n in ATTENDU and nb != ATTENDU[n]:
            ecarts.append(n)
    if ecarts:
        print('écart avec la formule ou avec les comptes connus aux ordres '
              + ', '.join(map(str, sorted(set(ecarts)))), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
