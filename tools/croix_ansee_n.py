#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# croix_ansee_n.py — les critères de la planche 040 à l'ordre n.
#
# `croix_ansee.py` énumère les croix ansées d'ordre 6 : 64 choix bruts, 8
# appariements cohérents, 8 sous la lecture « lignes seules », 2 sous la lecture
# « lignes et colonnes ». Ce script reprend le même modèle à l'ordre n pair et
# demande ce que devient chaque critère.
#
# LE MODÈLE, INCHANGÉ. Les 2n cases des deux diagonales ne sont pas dessinées.
# Chaque autre case (r, c) a exactement deux partenaires possibles : (r, n−1−c)
# par un trait horizontal, (n−1−r, c) par un trait vertical. Les quatre cases
# {(r,c), (r,n̄c), (r̄,c), (r̄,n̄c)} forment donc une ORBITE qu'on trace soit en
# deux traits horizontaux, soit en deux traits verticaux — un bit par orbite.
# Aucune orbite ne mélange cases diagonales et non diagonales, de sorte que les
# orbites hors diagonales sont au nombre de (n² − 2n)/4 : six à l'ordre 6 (d'où
# les 64 choix bruts), vingt à l'ordre 10.
#
#
# LA SYMÉTRIE CENTRALE EST UN LEMME, PAS UNE CONTRAINTE. Soit (r, c) hors
# diagonales ; son orbite {(r,c), (r,c̄), (r̄,c), (r̄,c̄)} est entièrement hors
# diagonales. Si (r, c) est appariée horizontalement, c'est avec (r, c̄) ; il
# reste (r̄, c) et (r̄, c̄), qui ne peuvent plus s'apparier qu'entre elles, donc
# horizontalement aussi. Même raisonnement pour le vertical. Une orbite est donc
# tout horizontale ou tout verticale, jamais mixte, et toute figure
# satisfaisant la condition I est centralement symétrique — à tout ordre pair. C'est ce que `croix_ansee.py`
# constatait par énumération à l'ordre 6 ; l'argument d'orbite le démontre.
#
# C'est aussi pourquoi l'énumération ci-dessous, qui prend UN bit par orbite,
# présuppose la symétrie au lieu de la tester : elle ne peut donc pas servir à
# l'établir. Et la symétrie n'entraîne pas la parité — à l'ordre 6, les 64
# figures sont toutes centralement symétriques, 8 seulement tiennent la parité
# des lignes et 2 celle des lignes et des colonnes.
#
# LES CRITÈRES. II : chaque ligne porte un nombre impair de traits horizontaux.
# III : au moins un. Lecture (b) : les deux transposés aux colonnes.
#
# CE QUE LA PARITÉ IMPOSE. Une ligne compte n − 2 cases hors diagonales, donc
# porte h traits horizontaux avec 2h ≤ n − 2 :
#
#     ordre 6  : h ∈ {0, 1, 2}     → « impair » force h = 1
#     ordre 10 : h ∈ {0, …, 4}     → « impair » laisse h ∈ {1, 3}
#
# À l'ordre 6 le critère II équivaut donc à « exactement un trait horizontal par
# ligne » ; dès l'ordre 10 il est strictement plus faible, et c'est une vraie
# contrainte à énumérer, non une conséquence.
#
# Usage : cd <racine du dépôt> && python tools/croix_ansee_n.py [--ordre N]

import itertools, os, sys


def diagonales(n):
    return {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}


def orbites(n):
    """Les orbites de quatre cases hors diagonales, une par bit de choix."""
    diag = diagonales(n)
    vues, out = set(), []
    for r in range(n):
        for c in range(n):
            if (r, c) in diag or (r, c) in vues:
                continue
            o = {(r, c), (r, n - 1 - c), (n - 1 - r, c), (n - 1 - r, n - 1 - c)}
            assert not (o & diag), 'une orbite mélange diagonale et hors-diagonale'
            vues |= o
            out.append(sorted(o))
    return out


def traits(n, orbs, bits):
    """bits[i] = 1 : l'orbite i est tracée horizontalement ; 0 : verticalement."""
    t = set()
    for o, b in zip(orbs, bits):
        for (r, c) in o:
            t.add(frozenset({(r, c), (r, n - 1 - c)}) if b
                  else frozenset({(r, c), (n - 1 - r, c)}))
    return t


def par_ligne(t, r):
    return sum(1 for x in t if all(p[0] == r for p in x))


def par_colonne(t, c):
    return sum(1 for x in t if all(p[1] == c for p in x))


def sym_centrale(t, n):
    return all(frozenset({(n - 1 - a, n - 1 - b) for a, b in x}) in t for x in t)


def compte(n):
    orbs = orbites(n)
    k = len(orbs)
    res = {'orbites': k, 'bruts': 2 ** k, 'symetriques': 0,
           'lignes': 0, 'lignes_et_colonnes': 0, 'profils': {}}
    exemples = []
    for bits in itertools.product((0, 1), repeat=k):
        t = traits(n, orbs, bits)
        if sym_centrale(t, n):
            res['symetriques'] += 1
        h = [par_ligne(t, r) for r in range(n)]
        if not all(x % 2 == 1 for x in h):
            continue
        res['lignes'] += 1
        v = [par_colonne(t, c) for c in range(n)]
        if not all(x % 2 == 1 for x in v):
            continue
        res['lignes_et_colonnes'] += 1
        cle = (tuple(sorted(h)), tuple(sorted(v)))
        res['profils'][cle] = res['profils'].get(cle, 0) + 1
        if len(exemples) < 2:
            exemples.append((bits, t, h, v))
    return res, exemples


def dessin(t, n):
    W = 2 * n - 1
    g = [[' '] * W for _ in range(W)]
    for r in range(n):
        for c in range(n):
            g[2 * r][2 * c] = '·'
    for x in t:
        (r1, c1), (r2, c2) = sorted(x)
        if r1 == r2:
            for c in range(2 * c1, 2 * c2 + 1):
                g[2 * r1][c] = '─' if g[2 * r1][c] in ' ·' else '┼'
        else:
            for r in range(2 * r1, 2 * r2 + 1):
                g[r][2 * c1] = '│' if g[r][2 * c1] in ' ·' else '┼'
    return '\n'.join(''.join(l) for l in g)


def main():
    av = sys.argv
    ordres = ([int(av[av.index('--ordre') + 1])] if '--ordre' in av
              else [6, 8, 10])
    for n in ordres:
        res, ex = compte(n)
        print(f'ordre {n} — {res["orbites"]} orbites, {res["bruts"]} choix bruts')
        print(f'  à symétrie centrale                  : {res["symetriques"]}')
        print(f'  nombre impair de traits par ligne    : {res["lignes"]}')
        print(f'  idem lignes ET colonnes              : '
              f'{res["lignes_et_colonnes"]}')
        for (h, v), k in sorted(res['profils'].items()):
            print(f'    {k:4d} × traits par ligne {list(h)}, par colonne {list(v)}')
        for bits, t, h, v in ex:
            print(f'  exemple — horizontaux par ligne {h} :')
            print(dessin(t, n))
        print(flush=True)


if __name__ == '__main__':
    main()
