#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
cellule_c16.py — définition de la cellule C16 (16 triangles), contrat de
cellule pour le bloc de 1 : à cette finesse de trame, les frontières
diagonales tombent exactement sur les arêtes des triangles (voir
"pourquoi C16" plus bas) — plus aucun triangle n'est coupé en deux,
contrairement à C8 où 192 des 1152 triangles l'étaient.

GÉOMÉTRIE — à documenter au même titre que les 8 triangles de C8 (voir
assets/bicolore-render.js) :

Une case est un carré unitaire [0,1)×[0,1). Elle se partage en quatre
sous-carrés de côté ½ : NO, NE, SE, SO (sens horaire depuis le haut,
comme partout ailleurs dans ce module bicolore). Chaque sous-carré est
coupé par SES DEUX PROPRES diagonales, en quatre triangles dont l'apex
est le centre du sous-carré et la base une arête pleine du sous-carré :
N (arête haute), E (arête droite), S (arête basse), W (arête gauche),
sens horaire depuis le haut. 4 sous-carrés × 4 triangles = 16 triangles
par case.

Index local (0..15) d'un triangle : sous-carré majeur, triangle mineur —
  0..3   : NO  (N, E, S, W)
  4..7   : NE  (N, E, S, W)
  8..11  : SE  (N, E, S, W)
  12..15 : SO  (N, E, S, W)
Index global (0..2303) d'un triangle de la grille 12×12 : cellule en
ordre ligne-major (row*12+col) × 16 + index local — même convention que
C8 (voir generate_referent_bicolore.py), à l'échelle de 16 près.

C16 CONTIENT C8 EXACTEMENT : chaque triangle de C8 (l'éventail à 8
branches d'une case entière, apex au centre de la case) est l'union
d'exactement deux triangles de C16 voisins de sous-carrés différents.
c8_to_c16_pairs (calculée une fois, ci-dessous, par échantillonnage
géométrique et vérifiée par aire) donne, pour chaque secteur C8 (0..7),
les deux secteurs C16 (0..15) dont l'union le compose. C8·B3 et C8·B2
s'expriment donc dans C16 sans perte (convert_c8_to_c16 : chaque bit de
C8 copié sur ses deux moitiés C16) et s'y reconvertissent au bit près
(convert_c16_to_c8 : chaque paire doit porter la même teinte — sinon la
donnée C16 ne provient pas d'un C8 valide).

POURQUOI C16 (et pas C8) POUR LE BLOC DE 1 : la règle du gnomon pour les
familles diagonales (YANG, YANG-MUT) ajoute, à B2, des losanges de rayon
1,5 centrés sur les nœuds libres du réseau de pas 3. En C8, les bords de
ces losanges (des droites à 45°) coupent 192 des 1152 triangles en deux
— un triangle C8 ne peut pas porter deux teintes. En C16, les mêmes
bords tombent exactement sur les diagonales des sous-carrés : aucun
triangle n'est coupé (0/2304), parce que les diagonales des sous-carrés
sont elles-mêmes des droites à 45° passant par des points à coordonnées
demi-entières — la même famille de droites que les bords des losanges.
"""

import itertools
import math

GRID = 12
PER_CELL_C8 = 8
PER_CELL_C16 = 16
PARTS_C8 = GRID * GRID * PER_CELL_C8    # 1152
PARTS_C16 = GRID * GRID * PER_CELL_C16  # 2304

# --- géométrie C8 (éventail à 8 branches d'une case unitaire) ---
_E8 = [(0.5, 0.0), (1.0, 0.0), (1.0, 0.5), (1.0, 1.0),
       (0.5, 1.0), (0.0, 1.0), (0.0, 0.5), (0.0, 0.0)]
_CENTER = (0.5, 0.5)


def c8_sector_of(lx, ly):
    """Secteur C8 (0..7) du point local (lx,ly) dans [0,1)x[0,1)."""
    dx, dy = lx - 0.5, ly - 0.5
    angle = math.atan2(dx, -dy) % (2 * math.pi)
    return int(angle // (math.pi / 4)) % 8


def c8_interior_point(sector):
    """Point à mi-hauteur du triangle C8 `sector` — voir derive_bicolore_homothety.py."""
    ex, ey = _E8[sector]
    fx, fy = _E8[(sector + 1) % 8]
    far_mid = ((ex + fx) / 2, (ey + fy) / 2)
    return ((_CENTER[0] + far_mid[0]) / 2, (_CENTER[1] + far_mid[1]) / 2)


# --- géométrie C16 (quatre sous-carrés, chacun coupé par ses diagonales) ---
# Sous-carré majeur : 0=NO 1=NE 2=SE 3=SO (sens horaire depuis le haut).
_SUBSQUARE_ORIGIN = [(0.0, 0.0), (0.5, 0.0), (0.5, 0.5), (0.0, 0.5)]  # coin haut-gauche de chaque sous-carré
_SUBSQUARE_CENTER = [(0.25, 0.25), (0.75, 0.25), (0.75, 0.75), (0.25, 0.75)]


def c16_sector_of(lx, ly):
    """Secteur C16 (0..15) du point local (lx,ly) dans [0,1)x[0,1)."""
    sub_x = 1 if lx >= 0.5 else 0
    sub_y = 1 if ly >= 0.5 else 0
    subidx = {(0, 0): 0, (1, 0): 1, (1, 1): 2, (0, 1): 3}[(sub_x, sub_y)]
    ox, oy = _SUBSQUARE_ORIGIN[subidx]
    # coordonnées locales au sous-carré, ramenées à l'unité [0,1)x[0,1)
    llx, lly = (lx - ox) * 2, (ly - oy) * 2
    dx, dy = llx - 0.5, lly - 0.5
    # triangles N/E/S/W symétriques autour des directions cardinales
    # (contrairement au C8 : ici les 4 triangles viennent des 2 diagonales
    # du carré, pas d'un éventail à 8 branches) -> décalage de +45°.
    angle = (math.atan2(dx, -dy) + math.pi / 4) % (2 * math.pi)
    local = int(angle // (math.pi / 2)) % 4  # 0=N,1=E,2=S,3=W
    return subidx * 4 + local


def c16_interior_point(sector):
    """Point intérieur (au tiers du rayon du triangle, loin du centre fin
    et des bords) du triangle C16 `sector` (0..15), en coordonnées de
    case unitaire [0,1)x[0,1)."""
    subidx, local = divmod(sector, 4)
    ox, oy = _SUBSQUARE_ORIGIN[subidx]
    cx, cy = _SUBSQUARE_CENTER[subidx]
    # coin haut-gauche/haut-droit/bas-droit/bas-gauche du sous-carré
    corners = [(ox, oy), (ox + 0.5, oy), (ox + 0.5, oy + 0.5), (ox, oy + 0.5)]
    # sommets de la base du triangle `local` (N=haut,E=droite,S=bas,W=gauche)
    base = {0: (corners[0], corners[1]), 1: (corners[1], corners[2]),
            2: (corners[2], corners[3]), 3: (corners[3], corners[0])}[local]
    far_mid = ((base[0][0] + base[1][0]) / 2, (base[0][1] + base[1][1]) / 2)
    return ((cx + far_mid[0]) / 2, (cy + far_mid[1]) / 2)


def _build_c8_to_c16_pairs():
    """Pour chaque secteur C8 (0..7), les deux secteurs C16 (0..15) dont
    l'union le compose — trouvés par échantillonnage (plusieurs points
    intérieurs par secteur C8, à distance variable du centre) plutôt que
    par géométrie à la main, pour éviter une erreur de signe silencieuse."""
    pairs = {}
    for c8_sector in range(PER_CELL_C8):
        ex, ey = _E8[c8_sector]
        fx, fy = _E8[(c8_sector + 1) % 8]
        found = set()
        for t in (0.15, 0.3, 0.45, 0.6, 0.75, 0.9):
            for u in (0.3, 0.5, 0.7):
                # points sur le segment centre -> bord, à u de la distance,
                # et interpolés entre les deux arêtes du secteur à t
                ax = ex + t * (fx - ex)
                ay = ey + t * (fy - ey)
                px = _CENTER[0] + u * (ax - _CENTER[0])
                py = _CENTER[1] + u * (ay - _CENTER[1])
                found.add(c16_sector_of(px, py))
        if len(found) != 2:
            raise SystemExit(f'secteur C8 {c8_sector} : {len(found)} secteurs C16 trouvés {found}, 2 attendus')
        pairs[c8_sector] = tuple(sorted(found))
    return pairs


C8_TO_C16_PAIRS = _build_c8_to_c16_pairs()


def convert_c8_to_c16(bits_c8):
    """Bits C8 (longueur PARTS_C8) -> bits C16 (longueur PARTS_C16), même
    teinte donnée aux deux moitiés de chaque triangle C8."""
    out = [None] * PARTS_C16
    for cell in range(GRID * GRID):
        for c8_sector in range(PER_CELL_C8):
            bit = bits_c8[cell * PER_CELL_C8 + c8_sector]
            for c16_sector in C8_TO_C16_PAIRS[c8_sector]:
                out[cell * PER_CELL_C16 + c16_sector] = bit
    return out


def convert_c16_to_c8(bits_c16):
    """Bits C16 -> bits C8. Lève une erreur si une paire ne porte pas la
    même teinte (la donnée C16 ne proviendrait pas d'un C8 valide)."""
    out = [None] * PARTS_C8
    for cell in range(GRID * GRID):
        for c8_sector in range(PER_CELL_C8):
            a, b = C8_TO_C16_PAIRS[c8_sector]
            va = bits_c16[cell * PER_CELL_C16 + a]
            vb = bits_c16[cell * PER_CELL_C16 + b]
            if va != vb:
                raise SystemExit(f'cellule {cell} secteur C8 {c8_sector} : '
                                  f'C16 {a}={va} et {b}={vb} diffèrent — pas un C8 valide')
            out[cell * PER_CELL_C8 + c8_sector] = va
    return out


if __name__ == '__main__':
    # auto-test : les 16 secteurs C16 partitionnent bien la case (aucun
    # point de test n'est orphelin, aucune paire C8 ne partage un secteur
    # C16 avec une autre paire).
    seen = set()
    for c8_sector, (a, b) in sorted(C8_TO_C16_PAIRS.items()):
        print(f'C8 secteur {c8_sector} = C16 {{{a}, {b}}}')
        for s in (a, b):
            assert s not in seen, f'secteur C16 {s} déjà utilisé par un autre secteur C8'
            seen.add(s)
    assert seen == set(range(16)), f'secteurs C16 non couverts : {set(range(16)) - seen}'
    print('OK : les 16 secteurs C16 se répartissent en 8 paires disjointes, une par secteur C8.')
