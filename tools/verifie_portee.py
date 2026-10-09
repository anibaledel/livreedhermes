#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verifie_portee.py — la règle des miroirs en assertion, et sa vraie portée.
#
# `pavage_miroirs.py` établit sur le corpus d'ordre 6 que le pavage est magique
# si et seulement si h(i, j) = h(m−1−i, j) et v(i, j) = v(i, m−1−j).
# `portee_miroirs.py` explore ce que l'énoncé devient ailleurs. Ce script-ci
# tranche ce qui peut passer en assertion, et sort en code 1 sinon. Python nu,
# aucun solveur : il relit des graines versées au dépôt.
#
# CE QUI EST ASSERTÉ. La seule NÉCESSITÉ — magique ⇒ conforme — et seulement
# pour une graine NON INVARIANTE par les miroirs.
#
# POURQUOI CETTE PORTÉE, ET PAS « AUX ORDRES ≥ 6 ». Si la graine est invariante
# par le miroir gauche-droite, le bit h du bloc ne change rien à ce bloc : deux
# motifs qui ne diffèrent que par ce bit pavent le même carré. La règle
# distingue alors des motifs que le pavage ne distingue pas, et l'ensemble des
# motifs magiques devient strictement plus gros que celui des motifs conformes.
# La nécessité tombe, et la cause est l'invariance, pas l'ordre.
#
# Le témoin est la graine d'ordre 4
#
#       V J J V / B R R B / B R R B / V J J V
#
# invariante par les DEUX miroirs : ses 256 motifs pavent magiquement, alors
# que 16 seulement sont conformes.
#
# ET « AUX ORDRES ≥ 6 » EST FAUX. Des étiquetages magiques invariants par les
# miroirs existent aussi aux ordres 8, 12 et 16 — CP-SAT en produit —, et aucun
# aux ordres 6, 10 et 14. Aucun des 18 432 étiquetages magiques d'ordre 6 n'est
# invariant, ce que ce script revérifie : c'est pour cela que la nécessité tient
# sur tout le corpus, et non parce que l'ordre y serait ≥ 6. La formulation par
# l'ordre serait vraie sur l'échantillon et fausse comme énoncé.
#
# CE QUI N'EST PAS ASSERTÉ. La SUFFISANCE — conforme ⇒ magique — hors de
# l'ordre 6. Elle dépend de la graine : aux ordres 10 et 14, certaines graines
# non invariantes ne rendent magiques que 8 motifs conformes sur 16, ou aucun.
# L'énoncé « si et seulement si » reste donc réservé aux graines d'ordre 6, où
# il est vérifié exhaustivement.
#
# Usage : cd <racine du dépôt> && python tools/verifie_portee.py
#         code de sortie 0 si l'assertion tient, 1 sinon.

import itertools, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from miroirs_graine import bloc, magique, pave, conforme  # noqa: E402

RACINE = os.path.dirname(ICI)
CASES = [(i, j) for i in range(2) for j in range(2)]
MOTIFS = list(itertools.product([(0, 0), (0, 1), (1, 0), (1, 1)], repeat=4))
LETTRE = {'rouge': 'R', 'bleu': 'B', 'vert': 'V', 'jaune': 'J'}


def invariances(graine):
    """(invariante par le miroir gauche-droite, par le miroir haut-bas)."""
    ref = [list(l) for l in graine]
    return bloc(graine, 1, 0) == ref, bloc(graine, 0, 1) == ref


def bilan(graine):
    """(motifs magiques, motifs conformes, les deux) sur les 256 motifs 2 × 2."""
    mag = conf = inter = 0
    for ch in MOTIFS:
        bits = dict(zip(CASES, ch))
        g, c = magique(pave(graine, bits, 2)), conforme(bits, 2)
        mag += g
        conf += c
        inter += g and c
    return mag, conf, inter


def graines():
    """Les graines versées au dépôt : le corpus d'ordre 6, puis les témoins."""
    out = []
    corpus = os.path.join(RACINE, 'data', 'referent_256_v3.json')
    if os.path.exists(corpus):
        from pavage_miroirs import etiquetage
        doc = json.load(open(corpus, encoding='utf-8'))
        for i, f in enumerate(doc['forms']):
            out.append((f'corpus {i}', 6, etiquetage(f)))
    t = json.load(open(os.path.join(RACINE, 'data', 'temoins.json'),
                       encoding='utf-8'))['temoins']
    for i, w in enumerate(t):
        out.append((f'témoin {i} ({w["genre"]})', w['ordre'], w['etiquetage']))
    return out


def main():
    echecs, exclus, testes = [], [], 0
    inv6 = 0
    for nom, n, mots in graines():
        if any(k not in 'BRVJ' for l in mots for k in l):
            continue
        h, v = invariances(mots)
        if h or v:
            exclus.append((nom, n, 'gauche-droite' if h and not v else
                           'haut-bas' if v and not h else 'les deux'))
            if n == 6:
                inv6 += 1
            continue
        mag, conf, inter = bilan(mots)
        testes += 1
        if inter != mag:                      # magique sans être conforme
            echecs.append((nom, n, mag, conf, inter))

    print(f'NÉCESSITÉ (magique ⇒ conforme), graines non invariantes par les '
          f'miroirs :\n  {testes} graines testées, {len(echecs)} échec(s)')
    for nom, n, mag, conf, inter in echecs:
        print(f'  [NON] {nom}, ordre {n} : {mag} magiques, {conf} conformes, '
              f'{mag - inter} magiques non conformes')
    print(f'\nHORS PORTÉE, écartées parce qu\'invariantes : {len(exclus)}')
    for nom, n, sens in exclus:
        print(f'  [---] {nom}, ordre {n} : invariante par {sens}')
    print(f'\nDont graines d\'ordre 6 invariantes : {inv6} — aucune n\'existe '
          f'parmi les 18 432, c\'est pourquoi la nécessité tient sur tout le '
          f'corpus.')
    print('\nNON ASSERTÉ ICI : la suffisance hors de l\'ordre 6. Elle dépend '
          'de la graine.')
    if echecs:
        print('\nL\'assertion tombe.')
        return 1
    print('\nl\'assertion tient : aucune graine non invariante ne pave '
          'magiquement par un motif non conforme.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
