#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verifie_portee.py — la portée de la règle des miroirs, en assertion, SANS
# SOLVEUR.
#
# `portee_miroirs.py` cherche ses graines d'ordres 10 et 14 par CP-SAT : son
# bilan dépend de la graine que le solveur rend, et il n'a pas de code de
# retour. Ici, sur le patron de `verifie_temoins.py`, on n'asserte pas une
# recherche : on revérifie des graines STOCKÉES — le corpus
# (data/referent_256_v3.json) et les témoins magiques de data/temoins.json,
# aux ordres 4 à 26 — avec la bibliothèque standard seule. Même entrée, même
# sortie, sur n'importe quelle machine.
#
# Pour chaque graine, les 256 motifs de miroirs du pavage 2 × 2 (fonctions de
# `portee_miroirs.py` et `miroirs_graine.py`, qui n'importent pas ortools) :
#
#     NÉCESSITÉ   : tout motif magique est conforme à la règle
#                   h(i, j) = h(m−1−i, j), v(i, j) = v(i, m−1−j)
#     SUFFISANCE  : tout motif conforme est magique
#
# Le script SORT EN ERREUR si :
#   — la nécessité tombe sur une seule graine, quelle qu'elle soit ;
#   — un étiquetage du corpus n'a pas ses seize motifs conformes magiques ;
#   — avec le cache d'enum6.py (tools/pavables6.json), une graine pavable de
#     l'échantillon n'a pas 16/16, ou une non pavable a un motif magique.
# Les nombres de motifs magiques par témoin (8 sur 16 pour la graine d'ordre 10,
# 16 sur 16 pour sa croix ansée…) sont imprimés, non assertés ici : la CI les
# fige en citant les lignes (check_sorties_ci.mjs).
#
# Usage : python tools/verifie_portee.py
#         code de retour 0 si tout tient, 1 sinon

import json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from portee_miroirs import bilan, etiquetage   # noqa: E402

RACINE = os.path.dirname(ICI)


def main():
    echecs = []

    doc = json.load(open(os.path.join(RACINE, 'data', 'referent_256_v3.json'),
                         encoding='utf-8'))
    corpus = [bilan(etiquetage(f)) for f in doc['forms']]
    conformes = sum(1 for b in corpus if b == (16, 16, 16))
    print(f'corpus d’ordre 6 : {conformes}/{len(corpus)} graines à 16 motifs '
          f'magiques sur 16 conformes')
    if conformes != len(corpus):
        echecs.append('corpus : une graine n’a pas ses seize motifs')

    cache = os.path.join(ICI, 'pavables6.json')
    if os.path.exists(cache):
        d = json.load(open(cache))
        pav = set(map(tuple, d['pavables']))
        dans = [list(g) for g in d['pavables']][:200]
        hors = [list(g) for g in d['tous'] if tuple(g) not in pav][:200]
        b_dans = [bilan(g) for g in dans]
        b_hors = [bilan(g) for g in hors]
        ok_dans = sum(1 for b in b_dans if b == (16, 16, 16))
        ok_hors = sum(1 for b in b_hors if b[0] == 0)
        print(f'ordre 6, pavables (200 premières) : {ok_dans}/{len(dans)} '
              f'à 16 motifs magiques sur 16 conformes')
        print(f'ordre 6, non pavables (200 premières) : {ok_hors}/{len(hors)} '
              f'sans aucun motif magique')
        if ok_dans != len(dans):
            echecs.append('pavables : une graine n’a pas 16/16')
        if ok_hors != len(hors):
            echecs.append('non pavables : un motif magique')
        for b in b_dans + b_hors:
            if b[0] != b[2]:
                echecs.append('ordre 6 hors corpus : nécessité abattue')
                break
    else:
        print('cache tools/pavables6.json absent (python tools/enum6.py) : '
              'les deux familles d’ordre 6 hors corpus ne sont pas contrôlées')

    t = json.load(open(os.path.join(RACINE, 'data', 'temoins.json'),
                       encoding='utf-8'))['temoins']
    magiques = [x for x in t if x['magique']]
    print(f'\n{len(magiques)} témoins magiques de data/temoins.json, '
          f'256 motifs chacun :')
    for x in magiques:
        mag, conf, inter = bilan(x['etiquetage'])
        necessite = mag == inter
        print(f'  ordre {x["ordre"]:3d}  {x["genre"]:22s} : {mag:3d} motifs '
              f'magiques sur {conf} conformes ; nécessité '
              f'{"tenue" if necessite else "ABATTUE"}')
        if not necessite:
            echecs.append(f'ordre {x["ordre"]} {x["genre"]} : un motif '
                          f'magique non conforme')

    print()
    if echecs:
        for e in echecs:
            print(f'ÉCHEC : {e}', file=sys.stderr)
        sys.exit(1)
    print('la règle des miroirs est nécessaire sur toutes les graines '
          'relues ; suffisante sur le corpus et les pavables d’ordre 6.')


if __name__ == '__main__':
    main()
