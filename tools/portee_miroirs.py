#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# portee_miroirs.py — jusqu'où va la règle des miroirs ?
#
# `pavage_miroirs.py` établit, sur les 256 étiquetages du corpus, que le pavage
# d'ordre 6m est magique SI ET SEULEMENT SI
#
#     h(i, j) = h(m−1−i, j)   et   v(i, j) = v(i, m−1−j)
#
# Ce script demande ce que devient cet énoncé hors du corpus. Il teste, sur
# des graines de plusieurs provenances, les deux implications séparément :
#
#     NÉCESSITÉ   : magique ⇒ conforme     (un contre-exemple l'abat)
#     SUFFISANCE  : conforme ⇒ magique     (un contre-exemple l'abat)
#
# Les graines testées :
#   — le corpus d'ordre 6 (data/referent_256_v3.json) ;
#   — les étiquetages magiques d'ordre 6 HORS corpus, énumérés par enum6.py,
#     dont 8 192 sur 18 432 pavent et 10 240 ne pavent pas du tout ;
#   — des graines d'ordres 10 et 14, obtenues par graine_sat.py.
#
# Usage : cd <racine du dépôt> && python tools/portee_miroirs.py

import itertools, json, os, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from miroirs_graine import magique, pave, conforme   # noqa: E402

LETTRE = {'rouge': 'R', 'bleu': 'B', 'vert': 'V', 'jaune': 'J'}
CASES = [(i, j) for i in range(2) for j in range(2)]
MOTIFS = list(itertools.product([(0, 0), (0, 1), (1, 0), (1, 1)], repeat=4))


def bilan(graine):
    """(magiques, conformes, magiques et conformes) sur les 256 motifs 2 × 2."""
    mag = conf = inter = 0
    for ch in MOTIFS:
        bits = dict(zip(CASES, ch))
        g, c = magique(pave(graine, bits, 2)), conforme(bits, 2)
        mag += g
        conf += c
        inter += g and c
    return mag, conf, inter


def etiquetage(f):
    e = [[None] * 6 for _ in range(6)]
    for coul, l in LETTRE.items():
        for r, c in f[coul + '_positions']:
            e[r][c] = l
    return [''.join(l) for l in e]


def rapport(nom, graines):
    necessite = suffisance = 0
    profils = collections.Counter()
    for g in graines:
        mag, conf, inter = bilan(g)
        profils[(mag, conf)] += 1
        if mag != inter:            # un motif magique non conforme
            necessite += 1
        if conf != inter:           # un motif conforme non magique
            suffisance += 1
    print(f'{nom} — {len(graines)} graine(s)')
    print(f'    nécessité (magique ⇒ conforme)  : '
          f'{"TENUE" if not necessite else f"ABATTUE sur {necessite}"}')
    print(f'    suffisance (conforme ⇒ magique) : '
          f'{"tenue" if not suffisance else f"abattue sur {suffisance}"}')
    for (mag, conf), k in sorted(profils.items()):
        print(f'    {k:5d} graine(s) : {mag:3d} motifs magiques '
              f'sur {conf} conformes')


def main():
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chemin = os.path.join(racine, 'data', 'referent_256_v3.json')
    if not os.path.exists(chemin):
        chemin = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              'repo-lldh', 'data', 'referent_256_v3.json')
    if os.path.exists(chemin):
        doc = json.load(open(chemin, encoding='utf-8'))
        rapport('corpus d’ordre 6', [etiquetage(f) for f in doc['forms']])

    cache = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         'pavables6.json')
    if os.path.exists(cache):
        d = json.load(open(cache))
        pav = set(map(tuple, d['pavables']))
        tous = [tuple(g) for g in d['tous']]
        hors = [list(g) for g in tous if g not in pav][:200]
        dans = [list(g) for g in d['pavables']][:200]
        rapport('ordre 6, pavables (échantillon)', dans)
        rapport('ordre 6, non pavables (échantillon)', hors)

    from graine_sat import cherche
    for n in (10, 14):
        nom, mots = cherche(n, 600.0)
        if mots:
            rapport(f'ordre {n} (solveur)', [mots])


if __name__ == '__main__':
    main()
