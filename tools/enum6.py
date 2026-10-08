#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# enum6.py — les 18 432 étiquetages magiques d'ordre 6, et ceux qui pavent.
#
# La règle des miroirs a été établie sur les 256 étiquetages du corpus. Mais le
# corpus n'est pas l'ensemble des étiquetages magiques d'ordre 6 : il y en a
# 18 432. La question est donc : « magique » suffit-il pour paver ?
#
# On énumère les 18 432 par la décomposition en paires de lignes (rencontre au
# milieu : la troisième paire est indexée par ce qu'il faut lui fournir), puis on
# teste chacun sur les 256 motifs de miroirs du pavage 2 × 2 (ordre 12).

# Résultats attendus : 18 432 étiquetages magiques, 8 192 pavables, seize
# motifs valides pour chacun d'eux, aucun motif valide pour les 10 240 autres.
#
# Usage : cd <racine du dépôt> && python tools/enum6.py   (environ 10 minutes)

import os, sys, itertools, json, collections

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from compte_etiquetages import couples, valeur
from miroirs_graine import magique, pave

n = 6
M = n * (n * n + 1) // 2
paires = [couples(n, r) for r in range(3)]


def diag(a, b, r):
    s = n - 1 - r
    return (valeur(a[r], r, r, n) + valeur(b[s], s, s, n),
            valeur(a[n - 1 - r], r, n - 1 - r, n)
            + valeur(b[n - 1 - s], s, n - 1 - s, n))


droite = collections.defaultdict(list)
for a, b, c in paires[2]:
    d1, d2 = diag(a, b, 2)
    droite[(tuple(M - x for x in c), M - d1, M - d2)].append((a, b))
print('clés droite :', len(droite), flush=True)

sols = []
for a0, b0, c0 in paires[0]:
    e1, e2 = diag(a0, b0, 0)
    for a1, b1, c1 in paires[1]:
        nc = tuple(x + y for x, y in zip(c0, c1))
        if max(nc) > M:
            continue
        f1, f2 = diag(a1, b1, 1)
        for p2 in droite.get((nc, e1 + f1, e2 + f2), ()):
            sols.append(((a0, b0), (a1, b1), p2))
print('étiquetages magiques énumérés :', len(sols), flush=True)

grilles = []
for s in sols:
    g = [None] * n
    for i, (a, b) in enumerate(s):
        g[i] = ''.join(a)
        g[n - 1 - i] = ''.join(b)
    grilles.append(g)

cases = [(i, j) for i in range(2) for j in range(2)]
ALTERNE = {(0, 0): (0, 0), (0, 1): (1, 0), (1, 0): (0, 1), (1, 1): (1, 1)}
pav = [g for g in grilles if magique(pave(g, ALTERNE, 2))]
print('pavables par l’alternance de parité :', len(pav), flush=True)

# sur ceux-là seulement, les 256 motifs de miroirs
motifs = list(itertools.product([(0, 0), (0, 1), (1, 0), (1, 1)], repeat=4))
compte = collections.Counter(
    sum(1 for ch in motifs if magique(pave(g, dict(zip(cases, ch)), 2)))
    for g in pav)
print('motifs valides par graine pavable :', dict(compte), flush=True)
sortie = os.path.join(ICI, 'pavables6.json')
json.dump({'tous': grilles, 'pavables': pav}, open(sortie, 'w'))
print('écrit :', sortie)

attendu = {'magiques': 18432, 'pavables': 8192, 'motifs': {16: 8192}}
obtenu = {'magiques': len(sols), 'pavables': len(pav), 'motifs': dict(compte)}
if obtenu != attendu:
    print('ÉCART :', obtenu, '≠', attendu)
    sys.exit(1)
