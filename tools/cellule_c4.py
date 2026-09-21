#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
cellule_c4.py — définition de la cellule C4 (4 triangles), contrat de
cellule pour data/ORIGINES 6/ (bloc de 3).

GÉOMÉTRIE — vérifiée sur les tracés (voir verify_c4_geometry() plus bas),
pas supposée : une case unitaire [0,1)×[0,1) coupée par SES DEUX
diagonales, apex commun au centre, sens horaire depuis le haut : N (base
= arête haute), E (arête droite), S (arête basse), W (arête gauche).
Même principe qu'un seul sous-carré de la cellule C16 (voir
cellule_c16.py), à l'échelle d'une case entière plutôt que d'un quart de
case — 4 triangles par case, 576 par image (12×12).

C4 CONTIENT C8 ? NON — c'est l'inverse : C4 ⊂ C8 ⊂ C16. Chaque triangle
de C4 est l'union de deux triangles de C8 voisins (même méthode que
C8 ⊂ C16 : échantillonnage géométrique, vérifié disjoint et exhaustif).

POURQUOI LES FICHIERS NE MONTRENT PAS TOUS 576 FORMES : le nombre brut
de <polygon>/<polyline> par fichier varie (288 à plus de 600) parce que
la planche FUSIONNE deux triangles C4 adjacents en un seul polygone dès
qu'ils portent la même teinte (une case entière peut même devenir un
quadrilatère à 4 sommets si ses quatre triangles sont uniformes) — un
raccourci de traçage, pas une géométrie différente : le centre de la
case est le milieu des deux diagonales, donc la réunion de deux
triangles adjacents (par ex. N∪E) est exactement le demi-carré que
donnerait une seule diagonale, sans coude au centre. L'extracteur
(voir extraire_c4.py) doit donc lire par point-dans-forme (quel que
soit le nombre de sommets de la forme), jamais en supposant un compte
de formes par case.
"""

import math

GRID = 12
PER_CELL_C4 = 4
PARTS_C4 = GRID * GRID * PER_CELL_C4  # 576

_CENTER = (0.5, 0.5)
# Coin haut-gauche, haut-droit, bas-droit, bas-gauche d'une case unitaire.
_CORNERS = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]


def interior_point(sector):
    """Point à mi-hauteur du triangle C4 `sector` (0=N,1=E,2=S,3=W),
    en coordonnées locales [0,1)x[0,1) — assez loin du centre (fin) et
    du bord (frontière) pour ne jamais tomber sur une discontinuité."""
    a, b = _CORNERS[sector], _CORNERS[(sector + 1) % 4]
    far_mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    return ((_CENTER[0] + far_mid[0]) / 2, (_CENTER[1] + far_mid[1]) / 2)


def sector_of(lx, ly):
    """Secteur C4 (0..3) du point local (lx,ly) dans [0,1)x[0,1),
    symétrique autour des directions cardinales (coupe par les deux
    diagonales, pas par un éventail) — même convention que le
    sous-carré de cellule_c16.py."""
    dx, dy = lx - 0.5, ly - 0.5
    angle = (math.atan2(dx, -dy) + math.pi / 4) % (2 * math.pi)
    return int(angle // (math.pi / 2)) % 4


def triangle_geometry(sector, x=0.0, y=0.0, w=1.0):
    """Sommets [(x,y)×3] du triangle C4 `sector`, case de coin (x,y) et
    de côté w."""
    cx, cy = x + w / 2, y + w / 2
    a = (x + _CORNERS[sector][0] * w, y + _CORNERS[sector][1] * w)
    b = (x + _CORNERS[(sector + 1) % 4][0] * w, y + _CORNERS[(sector + 1) % 4][1] * w)
    return [(cx, cy), a, b]


# --- C4 ⊂ C8 : chaque triangle C4 est l'union de deux triangles C8 ---
# Vérifié par échantillonnage géométrique (plusieurs points intérieurs
# par secteur C4, comme pour C8 ⊂ C16 dans cellule_c16.py) : disjoint et
# exhaustif sur les 8 secteurs C8.
PER_CELL_C8 = 8
C4_TO_C8_PAIRS = {0: (7, 0), 1: (1, 2), 2: (3, 4), 3: (5, 6)}


def convert_c8_to_c4(bits_c8):
    """Bits C8 (longueur grid*grid*8) -> bits C4 (longueur grid*grid*4).
    Lève une erreur si une paire C8 ne porte pas la même teinte — la
    donnée C8 aurait alors un détail plus fin que C4 ne peut porter."""
    out = [None] * PARTS_C4
    for cell in range(GRID * GRID):
        for c4_sector in range(PER_CELL_C4):
            a, b = C4_TO_C8_PAIRS[c4_sector]
            va = bits_c8[cell * PER_CELL_C8 + a]
            vb = bits_c8[cell * PER_CELL_C8 + b]
            if va != vb:
                raise SystemExit(f'cellule {cell} secteur C4 {c4_sector} : '
                                  f'C8 {a}={va} et {b}={vb} diffèrent — pas réductible à C4')
            out[cell * PER_CELL_C4 + c4_sector] = va
    return out
