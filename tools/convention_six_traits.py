#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
convention_six_traits.py — la convention des six traits du site (prompt 250, point 5), relue sur la carte des niveaux du référent 360.

Convention : le trait k d'un hexagramme est le niveau k de la carte `layer_of` (data/referent_360_v3.json). Le trait 1 est le niveau 1, qui contient le centre
de la cellule 12×12 ; le trait 6 est le niveau 6, le plus périphérique. Les traits 1 à 3 forment le trigramme inférieur (que la tradition nomme « intérieur »), les traits 4 à 6
le trigramme supérieur (« extérieur »). Rien ici n'est un choix de lecture : la distance minimale au centre de chaque niveau est strictement croissante.

  python3 tools/convention_six_traits.py            imprime le tableau
  python3 tools/convention_six_traits.py --verifie  échoue si le tableau n'est pas celui du prompt 250 : 0,71 ; 2,12 ; 2,55 ; 3,54 ; 3,81 ; 4,53 et 12, 0, 8, 8, 0, 16 cases au bord
  python3 tools/convention_six_traits.py --essai    fausse la carte (le centre passe au niveau 6) et montre que la vérification refuse
"""
import json
import math
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = 12
# les valeurs ATTENDUES sont l'énoncé du résultat « convention-six-traits » (data/resultats-etablis.json), pas une table recopiée ici : le script les compare à ce qu'il calcule
_ENONCE = next(r for r in json.load(open(os.path.join(RACINE, 'data', 'resultats-etablis.json'), encoding='utf-8'))['resultats'] if r['id'] == 'convention-six-traits')['valeur']
ATTENDU_DIST = _ENONCE['distance_minimale_au_centre']
ATTENDU_BORD = _ENONCE['cases_au_bord']


def lire():
    doc = json.load(open(os.path.join(RACINE, 'data', 'referent_360_v3.json'), encoding='utf-8'))
    return doc['layer_of']


def tableau(L):
    sortie = []
    for niv in range(1, 7):
        cases = [(r, c) for r in range(N) for c in range(N) if L[r][c] == niv]
        dmin = min(math.hypot(c + 0.5 - N / 2, r + 0.5 - N / 2) for r, c in cases)
        bord = sum(1 for r, c in cases if r in (0, N - 1) or c in (0, N - 1))
        sortie.append((niv, len(cases), round(dmin, 2), bord))
    return sortie


def verifier(L):
    t = tableau(L)
    mal = []
    if [x[2] for x in t] != ATTENDU_DIST:
        mal.append(f'distances {[x[2] for x in t]} au lieu de {ATTENDU_DIST}')
    if [x[3] for x in t] != ATTENDU_BORD:
        mal.append(f'cases au bord {[x[3] for x in t]} au lieu de {ATTENDU_BORD}')
    if not all(t[i][2] < t[i + 1][2] for i in range(5)):
        mal.append('distances non strictement croissantes')
    if any(x[1] != 24 for x in t):
        mal.append('un niveau n\'a pas 24 cases')
    return t, mal


def main():
    L = lire()
    t, mal = verifier(L)
    if '--essai' in sys.argv:
        L2 = [r[:] for r in L]
        for r, c in ((5, 5), (5, 6), (6, 5), (6, 6)):  # les quatre cases du centre passent au niveau 6
            L2[r][c] = 6
        if not verifier(L2)[1]:
            print('ÉCHEC --essai : une carte faussée est acceptée', file=sys.stderr)
            sys.exit(1)
        print('OK    --essai : une carte où les quatre cases du centre passent au niveau 6 est refusée.')
        return
    print('niveau (trait)  cases  distance minimale au centre  cases sur le bord du 12×12')
    for niv, n, d, b in t:
        print(f'{niv}  {n}  {d:.2f}  {b}')
    if '--verifie' in sys.argv:
        if mal:
            for m in mal:
                print('ÉCART', m, file=sys.stderr)
            sys.exit(1)
        print('OK    six traits : distances 0,71 ; 2,12 ; 2,55 ; 3,54 ; 3,81 ; 4,53 (strictement croissantes), cases au bord 12, 0, 8, 8, 0, 16 (les traits 2 et 5 seuls ne touchent pas le bord), 24 cases par niveau.')


main()
