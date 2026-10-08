#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_cadres_ordre12.py — « Du centrage pair pair » (livre, page 031) :
# quatre copies d'un même carré d'ordre 6, conformes ou miroirs, dans un cadre
# d'ordre 12, donnent un carré magique d'ordre 12.
#
# Ce que le script établit sur les 256 carrés de data/referent_256_v3.json :
#
#   1. les quatre agencements de la page — miroir à droite, à gauche, en haut,
#      en bas — donnent chacun 256 carrés magiques d'ordre 12 sur 256, de
#      constante 870 ;
#   2. chaque agencement produit 256 grilles distinctes : la correspondance
#      avec les 256 carrés d'ordre 6 est une bijection ;
#   3. les agencements se regroupent deux à deux — droite et gauche donnent le
#      même jeu, haut et bas aussi — et les deux jeux sont disjoints : 512
#      carrés d'ordre 12 en deux familles de 256 ;
#   4. le corpus des 256 est clos par inversion des couleurs (rouge ↔ bleu,
#      gris ↔ jaune). Les huit carrés de la page sont donc les quatre
#      agencements appliqués à un carré et à son inverse, et les deux familles
#      se referment sur elles-mêmes ;
#   5. aucun des 64 assemblages de quatre carrés VOISINS de l'échiquier — ceux
#      de verif_protocole.py et de la galerie Magic quadricolore — n'appartient
#      à ces deux familles. C'est une troisième construction.
#
# Le script échoue si l'un de ces cinq points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_cadres_ordre12.py
# (attend verif_protocole.py et verif_carre_magique.py à côté.)

import json, os, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from verif_protocole import protocole, grille6
from verif_carre_magique import is_magic_square

CONSTANTE_12 = 12 * (12 * 12 + 1) // 2          # 870
INVERSION = {'rouge': 'bleu', 'bleu': 'rouge', 'vert': 'jaune', 'jaune': 'vert'}

ident = lambda P: [r[:] for r in P]
horiz = lambda P: [r[::-1] for r in P]          # miroir gauche-droite
verti = lambda P: P[::-1]                        # miroir haut-bas

AGENCEMENTS = {                                  # (haut-gauche, haut-droite, bas-gauche, bas-droite)
    'miroir à droite': (ident, horiz, ident, horiz),
    'miroir à gauche': (horiz, ident, horiz, ident),
    'miroir en bas':   (ident, ident, verti, verti),
    'miroir en haut':  (verti, verti, ident, ident),
}
echecs = []


def cadre(P, quadrants):
    """Les quatre copies de P dans un cadre d'ordre 12."""
    hg, hd, bg, bd = (t(P) for t in quadrants)
    G = [[None] * 12 for _ in range(12)]
    for r in range(6):
        for c in range(6):
            G[r][c], G[r][c + 6] = hg[r][c], hd[r][c]
            G[r + 6][c], G[r + 6][c + 6] = bg[r][c], bd[r][c]
    return G


def main():
    doc = json.load(open(os.path.join(RACINE, 'data', 'referent_256_v3.json'), encoding='utf-8'))
    formes = {(f['row'], f['col']): f for f in doc['forms']}
    grilles = [grille6(f) for f in doc['forms']]

    familles = {}
    for nom, q in AGENCEMENTS.items():
        magiques, constantes, vues = 0, set(), set()
        for P in grilles:
            g = protocole(cadre(P, q), 12)
            magiques += is_magic_square(g, verbose=False)['magique']
            constantes.add(sum(g[0]))
            vues.add(tuple(map(tuple, g)))
        familles[nom] = vues
        print(f'1. {nom:<16} : {magiques}/256 magiques, constante {sorted(constantes)}, '
              f'{len(vues)} grilles distinctes')
        if magiques != 256:
            echecs.append(f'{nom} : {256 - magiques} cadres non magiques')
        if constantes != {CONSTANTE_12}:
            echecs.append(f'{nom} : constantes {sorted(constantes)} au lieu de {CONSTANTE_12}')
        if len(vues) != 256:
            echecs.append(f'{nom} : {len(vues)} grilles distinctes au lieu de 256')

    paires = [('miroir à droite', 'miroir à gauche'), ('miroir en bas', 'miroir en haut')]
    for a, b in paires:
        if familles[a] != familles[b]:
            echecs.append(f'{a} et {b} ne donnent pas le même jeu')
    fam_h, fam_v = familles['miroir à droite'], familles['miroir en bas']
    print(f'2. droite = gauche et bas = haut : {familles["miroir à droite"] == familles["miroir à gauche"]} '
          f'et {familles["miroir en bas"] == familles["miroir en haut"]}')
    print(f'3. les deux familles sont disjointes : {len(fam_h & fam_v)} grille(s) en commun, '
          f'{len(fam_h | fam_v)} au total')
    if fam_h & fam_v:
        echecs.append('les deux familles se recoupent')

    ensemble = {tuple(map(tuple, g)) for g in grilles}
    inverse = {tuple(tuple(INVERSION[x] for x in ligne) for ligne in g) for g in grilles}
    print(f'4. corpus clos par inversion des couleurs : {ensemble == inverse}')
    if ensemble != inverse:
        echecs.append('le corpus des 256 n’est pas clos par inversion des couleurs')

    voisins = set()
    for R in range(8):
        for C in range(8):
            G = [[None] * 12 for _ in range(12)]
            for dr in range(2):
                for dc in range(2):
                    p = grille6(formes[(2 * R + dr, 2 * C + dc)])
                    for r in range(6):
                        for c in range(6):
                            G[6 * dr + r][6 * dc + c] = p[r][c]
            voisins.add(tuple(map(tuple, protocole(G, 12))))
    communes = len(voisins & (fam_h | fam_v))
    print(f'5. assemblages de quatre carrés voisins : {len(voisins)} distincts, '
          f'{communes} dans les deux familles')
    if len(voisins) != 64 or communes:
        echecs.append(f'assemblages voisins : {len(voisins)} distincts, {communes} en commun')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print(f'\nTrois constructions distinctes d’ordre 12 à la constante {CONSTANTE_12} : '
          '64 par carrés voisins, 256 par miroir horizontal, 256 par miroir vertical.')


if __name__ == '__main__':
    main()
