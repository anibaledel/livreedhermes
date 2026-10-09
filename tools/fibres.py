#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# fibres.py — combien d'étiquetages réalisent UNE figure donnée.
#
# LA QUESTION. La classification dit quelles figures sont réalisables : toutes,
# dès que m = n/2 est impair. Elle ne dit rien de leur fibre — le nombre
# d'étiquetages magiques qui réalisent une figure donnée. La projection
#
#       étiquetage  ↦  figure qu'il porte
#
# est surjective sur les figures candidates ; ce script mesure ses fibres.
#
# CE QU'IL TROUVE, et ce n'était pas prévisible :
#
#   ordre 6  : les 2 figures ont la MÊME fibre, 4 096 chacune. La projection
#              est uniforme, et 2 × 4 096 = 8 192.
#
#   ordre 10 : les 2 048 figures ont TROIS tailles de fibre distinctes,
#
#                  260 919 263 232   pour   648 figures
#                  289 910 292 480   pour  1 136 figures
#                  322 122 547 200   pour   264 figures
#
#              et leur somme vaut exactement 583 454 127 292 416, le total que
#              `recollement.py` calcule par un chemin entièrement différent —
#              par paires de lignes, sans jamais séparer les figures. C'est un
#              contrôle croisé fort : deux décompositions indépendantes du même
#              ensemble.
#
# LA STRUCTURE, ET CE QU'ELLE LAISSE OUVERT. Les trois tailles sont
#
#       3 · 2³⁰ · 81,      3 · 2³⁰ · 90,      3 · 2³⁰ · 100,
#
# soit un facteur commun multiplié par 9², 9·10 et 10². La fibre se factorise
# donc en deux facteurs valant chacun 9 ou 10. Quel invariant de la figure
# décide de ces deux facteurs n'est pas déterminé ici : les multiplicités
# 648 / 1 136 / 264 ne sont pas celles de deux indicateurs indépendants, donc
# les deux facteurs sont corrélés. C'est le premier invariant connu qui
# distingue les figures entre elles — la classification, elle, les met toutes
# à égalité.
#
# COMMENT. Pour une figure fixée, l'orientation de chaque orbite hors diagonale
# est imposée, et le recollement de `recollement.py` s'applique tel quel avec
# ses états filtrés et son élagage par atteignabilité. Les profils d'une ligne
# quotient ne dépendent de la figure que par les orientations de CETTE ligne,
# soit au plus 2^(m−1) motifs : on les précalcule une fois, et chaque figure
# n'est plus qu'un recollement sur des objets déjà calculés. Sans ce partage,
# l'ordre 10 demanderait des heures ; avec, quelques minutes.
#
# Usage : cd <racine du dépôt> && python tools/fibres.py [--ordres 6,10]
#
# Aucune dépendance : Python nu.

import sys, os, collections, itertools

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from recollement import cellules, trois_nombres                   # noqa: E402
from construction import figures                                  # noqa: E402

TOTAUX = {6: 8192, 10: 583454127292416}   # ce que donne recollement.py


def profils(n, g, r, masque):
    """Les apports aux colonnes d'une paire de lignes d'écart nul, quand les
    orientations des orbites hors diagonale de la ligne r sont imposées."""
    m, M = n // 2, n * (n * n + 1) // 2
    hors = [c for c in range(m) if c != r]
    dp = {(0, ()): 1}
    for c in range(m):
        suiv = collections.defaultdict(int)
        etats = trois_nombres(n, g[r][c], r, c)
        if c != r:
            etats = [e for e in etats
                     if e[2] is (masque[hors.index(c)] == 1)]
        for (s, ap), w in dp.items():
            for a, b, _ in etats:
                suiv[(s + a, ap + (b,))] += w
        dp = suiv
    out = collections.defaultdict(int)
    for (s, ap), w in dp.items():
        if s == M:
            out[ap] += w
    return dict(out)


def table_profils(n):
    m, g = n // 2, cellules(n)
    return {(r, msk): profils(n, g, r, msk)
            for r in range(m)
            for msk in itertools.product((0, 1), repeat=m - 1)}


def fibre(n, f, table):
    """Le nombre d'étiquetages magiques réalisant exactement la figure f."""
    m, M = n // 2, n * (n * n + 1) // 2
    hors = {r: [c for c in range(m) if c != r] for r in range(m)}
    P = [table[(r, tuple(f[(r, c)] for c in hors[r]))] for r in range(m)]
    mini = [[min(ap[c] for ap in P[r]) for c in range(m)] for r in range(m)]
    maxi = [[max(ap[c] for ap in P[r]) for c in range(m)] for r in range(m)]
    rmin = [[sum(mini[q][c] for q in range(r, m)) for c in range(m)]
            for r in range(m + 1)]
    rmax = [[sum(maxi[q][c] for q in range(r, m)) for c in range(m)]
            for r in range(m + 1)]
    dp = {(0,) * m: 1}
    for r in range(m):
        suiv = collections.defaultdict(int)
        bas, haut = rmin[r + 1], rmax[r + 1]
        for col, w in dp.items():
            for ap, k in P[r].items():
                nc = tuple(col[c] + ap[c] for c in range(m))
                if any(nc[c] + bas[c] > M or nc[c] + haut[c] < M
                       for c in range(m)):
                    continue
                suiv[nc] += w * k
        dp = suiv
    return dp.get((M,) * m, 0)


def distribution(n):
    table = table_profils(n)
    d = collections.Counter()
    for f in figures(n // 2):
        d[fibre(n, f, table)] += 1
    return d


if __name__ == '__main__':
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 10])
    echec = 0
    print('les fibres de la projection « étiquetage ↦ figure »\n')
    for n in ordres:
        d = distribution(n)
        tot = sum(v * k for v, k in d.items())
        print(f'=== ordre {n} ===')
        for v in sorted(d):
            print(f'  fibre {v:>18d}  pour {d[v]:6d} figure(s)')
        print(f'  figures : {sum(d.values())}   '
              f'(formule 2^(m²−3m+1) = {2 ** ((n//2)**2 - 3*(n//2) + 1)})')
        print(f'  somme des fibres : {tot}')
        if n in TOTAUX:
            bon = tot == TOTAUX[n]
            echec += not bon
            print(f'  total de recollement.py : {TOTAUX[n]} — accord : {bon}')
        print(f'  projection uniforme : {len(d) == 1}')
        print()
    print('à l\'ordre 6 la projection est uniforme ; à l\'ordre 10 elle ne '
          'l\'est pas,\net les trois tailles sont entre elles comme '
          '81 : 90 : 100, soit 9², 9·10, 10².')
    sys.exit(1 if echec else 0)
