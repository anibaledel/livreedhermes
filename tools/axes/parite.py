#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
parite.py — Des axes à la planche : la couleur d'un triangle (ou d'une case)
est la parité du nombre d'axes qui le séparent d'une origine de référence.

Deux fonctions, le grain est un paramètre, pas une constante :
- parite(axes, grain="C8") : masque de 1152 bits, teinte constante par triangle.
- parite(axes, grain="C1") : masque de 1152 bits aussi (compatibilité de
  format avec plaque.py), mais teinte constante par case (les 8 triangles
  d'une même case portent tous le même bit).

verifie(planche_path, axes, grain) : le test différentiel — deux régions
voisines doivent changer de teinte si et seulement si un axe passe entre
elles. Ne dépend d'aucune convention d'origine ni de polarité : compare des
DIFFÉRENCES, jamais des couleurs absolues.

Convention d'axe (voir data/axes/catalogue.json.convention) :
    H (horizontale) : ligne y = ecart + 6           -> côté = signe(y - (ecart+6))
    V (verticale)   : ligne x = ecart + 6            -> côté = signe(x - (ecart+6))
    D+ (x+y)        : ligne x+y = 2*ecart + 12        -> côté = signe(x+y - (2*ecart+12))
    D- (y-x)        : ligne y-x = 2*ecart             -> côté = signe(y-x - 2*ecart)

La teinte d'un point est le XOR (parité) des côtés sur tous les axes de
l'accord. Un accord vide donne 0 partout (teinte uniforme, aucun axe à
franchir).
"""

import math
import os
import re
import sys

GRID = 12
SECTORS = 8

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plaque import read_plaque, parse_style_colors, parse_polygons, centroid, SOMBRE_HEX, CLAIR_HEX  # noqa: E402


# Période effective de la POSITION (pas de l'écart) pour le test de
# franchissement : H/V position = ecart+6, sur [0,12) — la grille fait
# exactement 12 de large, donc période 12. D+/D- position = 2*ecart(+12),
# sur x+y (ou y-x) qui va jusqu'à 24 pour une grille 12x12 — la période
# géométrique pertinente ici est donc 12 aussi (la moitié d'un tour complet
# de la grille torique dans les deux coordonnées combinées), pas les 6 de
# data/axes/catalogue.json.convention.periode : cette période-6-là canonise
# les ÉCARTS mesurés (repli des valeurs brutes avant dédoublonnage, §2), un
# usage différent du test de franchissement local ici. Vérifié en testant :
# avec période 6, des arêtes purement intérieures à une case (T0 YANG,
# aucun bord de grille en jeu) se signalaient à tort en faux positif — la
# "répétition" de période 6 n'existe pas comme deuxième droite visible dans
# la grille aux écarts fournis (jamais ±6 pour D+/D- dans le catalogue).
_PERIOD = {'H': 12.0, 'V': 12.0, 'D+': 12.0, 'D-': 12.0}


def _coord_et_position(nature, ecart, x, y):
    """(coordonnée scalaire du point, position canonique de l'axe) sur l'axe
    perpendiculaire à `nature` — la paire à comparer pour trouver le côté."""
    if nature == 'H':
        return y, ecart + 6
    if nature == 'V':
        return x, ecart + 6
    if nature == 'D+':
        return x + y, 2 * ecart + 12
    if nature == 'D-':
        return y - x, 2 * ecart
    raise ValueError(f"nature inconnue : {nature}")


def _cote(nature, ecart, x, y):
    coord, pos = _coord_et_position(nature, ecart, x, y)
    v = coord - pos
    if v == 0:
        raise ValueError(f"point ({x},{y}) exactement sur l'axe {nature} {ecart} — point de test mal choisi")
    return 1 if v > 0 else 0


def _teinte(axes, x, y):
    bit = 0
    for a in axes:
        bit ^= _cote(a['nature'], a['ecart'], x, y)
    return bit


def _triangle_point(row, col, sector, r=0.3):
    """Point représentatif du triangle (row,col,sector), à distance r du
    centre de case, au milieu angulaire du secteur (compté depuis le haut,
    sens horaire) — jamais sur un axe générique (r=0.3 n'aligne avec aucune
    position d'axe, toutes à des écarts entiers ou demi-entiers)."""
    cx, cy = col + 0.5, row + 0.5
    mid_angle = math.radians(sector * 45 + 22.5)
    return cx + r * math.sin(mid_angle), cy - r * math.cos(mid_angle)


def parite(axes, grain='C8'):
    """Rend un masque de 1152 bits (index (row*GRID+col)*SECTORS+sector,
    comme plaque.py). grain='C1' : les 8 bits d'une case sont identiques."""
    mask = [0] * (GRID * GRID * SECTORS)
    for row in range(GRID):
        for col in range(GRID):
            if grain == 'C1':
                x, y = col + 0.5, row + 0.5
                bit = _teinte(axes, x, y)
                for sector in range(SECTORS):
                    mask[(row * GRID + col) * SECTORS + sector] = bit
            elif grain == 'C8':
                for sector in range(SECTORS):
                    x, y = _triangle_point(row, col, sector)
                    mask[(row * GRID + col) * SECTORS + sector] = _teinte(axes, x, y)
            else:
                raise ValueError(f"grain inconnu : {grain}")
    return mask


def ecart_triangle(mask_a, mask_b):
    """Nombre de triangles où deux masques diffèrent."""
    return sum(1 for a, b in zip(mask_a, mask_b) if a != b)


# ---------------------------------------------------------------------------
# Le test différentiel (verifie) : indépendant de toute convention d'origine
# ou de polarité — compare des voisinages, jamais des couleurs absolues.
# ---------------------------------------------------------------------------

def _edges_c8():
    """Les 1728 arêtes du grain C8 : (idx_a, idx_b, 'inter'|'intra').

    Secteurs 0..7 = les 8 triangles, dans l'ordre horaire depuis le haut :
    0 = {centre, milieu-haut, coin NE} (moitié droite du bord haut)
    1 = {centre, coin NE, milieu-droit} (moitié haute du bord droit)
    2 = {centre, milieu-droit, coin SE} (moitié basse du bord droit)
    3 = {centre, coin SE, milieu-bas} (moitié droite du bord bas)
    4 = {centre, milieu-bas, coin SO} (moitié gauche du bord bas)
    5 = {centre, coin SO, milieu-gauche} (moitié basse du bord gauche)
    6 = {centre, milieu-gauche, coin NO} (moitié haute du bord gauche)
    7 = {centre, coin NO, milieu-haut} (moitié gauche du bord haut)

    'intra' : les 8 rayons du centre vers chacun des 4 coins et 4 milieux
    d'arête — entre secteurs consécutifs (s, s+1).

    'inter' : chaque bord de case (haut/droit/bas/gauche) est coupé en DEUX
    par son point milieu, donc touché par DEUX triangles, pas un seul — le
    bord droit d'une case (secteurs 1 haut, 2 bas) touche le bord gauche de
    sa voisine de droite (secteurs 6 haut, 5 bas) : 1<->6, 2<->5. Le bord bas
    (secteurs 3 est, 4 ouest) touche le bord haut de la voisine du bas
    (secteurs 0 est, 7 ouest) : 3<->0, 4<->7. Grille torique (le système est
    construit sur le tore — écarts -6 et +6 identifiés) : chaque case a
    toujours une voisine de droite et une voisine du bas, modulo 12. 144
    cases × 2 voisines × 2 sous-arêtes = 576 arêtes inter-case, exactement le
    chiffre attendu.

    Chaque arête est (row_a,col_a,sec_a, row_b,col_b,sec_b, idx_a,idx_b, kind) :
    row_b/col_b NON repliés (peuvent valoir GRID, pas GRID-1) pour que le point
    représentatif de la voisine se calcule dans l'espace déplié, juste après
    le bord — indispensable pour l'arête qui boucle sur le tore (colonne 11 à
    colonne 0, ligne 11 à ligne 0) : sans ça, le point de la case 0 et celui
    de la case 11 sont à des coordonnées brutes aux deux bouts opposés de la
    grille, et le test de franchissement d'axe se trompe (trouvé en testant :
    48 contradictions, toutes sur ce bord, avant cette correction). idx_a/
    idx_b restent repliés (modulo GRID) pour indexer le masque réel."""
    edges = []
    for row in range(GRID):
        for col in range(GRID):
            base = (row * GRID + col) * SECTORS
            for s in range(SECTORS):
                edges.append((row, col, s, row, col, (s + 1) % SECTORS,
                              base + s, base + (s + 1) % SECTORS, 'intra'))

            col_r, row_r = col + 1, row
            right = (row_r * GRID + col_r % GRID) * SECTORS
            edges.append((row, col, 1, row_r, col_r, 6, base + 1, right + 6, 'inter'))
            edges.append((row, col, 2, row_r, col_r, 5, base + 2, right + 5, 'inter'))

            col_b, row_b = col, row + 1
            below = ((row_b % GRID) * GRID + col_b) * SECTORS
            edges.append((row, col, 3, row_b, col_b, 0, base + 3, below + 0, 'inter'))
            edges.append((row, col, 4, row_b, col_b, 7, base + 4, below + 7, 'inter'))
    return edges


_EDGES_C8 = None


def edges_c8():
    global _EDGES_C8
    if _EDGES_C8 is None:
        _EDGES_C8 = _edges_c8()
    return _EDGES_C8


def _axis_crosses(nature, ecart, pa, pb):
    """Un axe passe-t-il entre les points pa et pb ? Une droite d'écart e est
    répétée de période 12 (H/V) ou 6 (D+/D-) — voir data/axes/catalogue.json.
    convention.periode. pa/pb peuvent être en coordonnées dépliées (jusqu'à
    12+ε, pour l'arête qui boucle sur le tore) : on cherche la copie
    périodique de l'axe la plus proche du segment [pa,pb], pas seulement la
    copie canonique — sinon une arête proche du bord du repli (écart ±6) rate
    le franchissement (trouvé en testant : bord T0 YIN, écart -6)."""
    coord_a, pos = _coord_et_position(nature, ecart, *pa)
    coord_b, _ = _coord_et_position(nature, ecart, *pb)
    period = _PERIOD[nature]
    k = round(((coord_a + coord_b) / 2 - pos) / period)
    pos_proche = pos + k * period
    return (coord_a - pos_proche > 0) != (coord_b - pos_proche > 0)


def verifie(planche_path, axes, grain='C8'):
    """Test différentiel : lit la planche réelle, et pour chaque arête du
    grain choisi, vérifie (teinte diffère) <=> (un axe passe entre les deux
    points représentatifs). Rend le nombre de contradictions."""
    plaque = read_plaque(planche_path)
    mask = plaque['mask']

    contradictions = 0
    for row_a, col_a, sec_a, row_b, col_b, sec_b, idx_a, idx_b, kind in edges_c8():
        if grain == 'C1' and kind == 'intra':
            continue  # pas d'arêtes intérieures à une case au grain C1
        pa = _triangle_point(row_a, col_a, sec_a)
        pb = _triangle_point(row_b, col_b, sec_b)  # non replié : voisine dépliée
        axe_franchi = any(_axis_crosses(a['nature'], a['ecart'], pa, pb) for a in axes)
        teinte_diff = mask[idx_a] != mask[idx_b]
        if axe_franchi != teinte_diff:
            contradictions += 1
    return contradictions


if __name__ == '__main__':
    print(__doc__)
