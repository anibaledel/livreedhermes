#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
releve.py — Lit un PDF de planche d'axes (dossier « axes seul sur gris
median ») et en sort les droites {nature, ecart}.

Ce module lit le PDF via PyMuPDF (pdftocairo n'est pas installé dans cet
environnement) — les pièges de pdftocairo (ordre des attributs d/transform)
ne s'appliquent donc pas ici tels quels, mais le piège de fond, lui, est le
même quelle que soit la bibliothèque : un TRAIT dessiné peut porter
plusieurs segments qui ne sont PAS colinéaires à l'écran (un axe diagonal
qui atteint un bord de la grille repart en sens inverse — le chevron « < »
qu'on voit dans les données brutes — parce que la grille est torique et
l'export ne « déplie » pas le trait). Fusionner par colinéarité écran
échouerait donc. La bonne unité est le SEGMENT, classé individuellement par
la formule d'écart (H/V/D+/D-) — deux segments d'un même trait replié
retombent alors sur le même (nature, écart) canonique et se fusionnent
naturellement lors du dédoublonnage, sans avoir à détecter le repli.

Calibration : la grille (12x12) est calibrée sur l'étendue des CASES DE
FOND remplies (144 rectangles gris), jamais sur le cadre ni les traits
(pitfall : « la boîte englobante se prend sur les formes remplies, pas sur
les traits » — le cadre a une épaisseur de trait qui décale légèrement son
rectangle de la vraie grille).

Le cadre (rectangle de bord, tracé en 's' avec un item 're') encode les
DEUX axes de bord H et V en même temps (l'écart -6, replié sur +6) — pas un
axe séparé par côté.

Écarts : orthogonales, position - 6. Diagonales, (x+y-12)/2 pour D+ et
(y-x)/2 pour D-. La nature d'un segment (H, V, D+ ou D-) est celle pour
laquelle cette formule reste CONSTANTE sur les deux extrémités du segment —
la même méthode marche pour tous les segments, droits ou repliés en
chevron.

Usage :
    python tools/axes/releve.py <fichier.pdf>
    python tools/axes/releve.py --catalogue <dossier de PDF>
"""

import glob
import json
import os
import sys

import fitz  # PyMuPDF

GRID = 12
TOL = 0.02  # tolérance, en cases, pour juger une formule "constante" sur un segment


def _grid_calibration(page):
    """(min_x, min_y, px_par_unite) depuis l'étendue des cases de fond
    remplies (type 'f'), jamais du cadre ni des traits."""
    xs, ys = [], []
    for d in page.get_drawings():
        if d['type'] != 'f':
            continue
        r = d['rect']
        xs += [r.x0, r.x1]
        ys += [r.y0, r.y1]
    if not xs:
        raise ValueError("aucune case de fond trouvée pour calibrer la grille")
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    return min_x, min_y, (max_x - min_x) / GRID, (max_y - min_y) / GRID


def _classifie_segment(p1, p2):
    """(nature, ecart) pour un segment (p1,p2) en coordonnées UNITÉ (cases,
    0..12) — la formule qui reste constante aux deux bouts, à TOL près.
    Rend None si aucune des 4 formules n'est constante (segment non-axe)."""
    x1, y1 = p1
    x2, y2 = p2
    candidats = [
        ('H', y1 - 6, y2 - 6),
        ('V', x1 - 6, x2 - 6),
        ('D+', (x1 + y1 - 12) / 2, (x2 + y2 - 12) / 2),
        ('D-', (y1 - x1) / 2, (y2 - x2) / 2),
    ]
    for nature, e1, e2 in candidats:
        if abs(e1 - e2) < TOL:
            return nature, round((e1 + e2) / 2, 3)
    return None


def _replie_et_arrondi(ecart):
    """Replie un écart mesuré dans (-6, 6], et l'arrondit au multiple de 0,5
    le plus proche — tous les écarts réels du système en sont (voir
    catalogue.json), la mesure PDF n'est jamais exacte au dernier bit
    (trouvé en testant : des valeurs comme -1.001 ou 0.997, à quelques
    millièmes du 0,5 attendu, ne se dédoublonnaient pas avec la vraie
    valeur sous un simple round(x,3))."""
    e = ((ecart + 6.0) % 12.0) - 6.0
    if e <= -6.0 + 1e-6:
        e = -6.0
    return round(e * 2) / 2.0


def _rect_edges(rect):
    """Les 4 côtés d'un rectangle, comme 2 segments H (haut/bas) et 2
    segments V (gauche/droite) — un rectangle n'encode pas forcément le
    cadre ±6 : chez T0 YIN MUT c'est le carré ±3 (trouvé en testant)."""
    return [
        ((rect.x0, rect.y0), (rect.x1, rect.y0)),  # haut : H
        ((rect.x0, rect.y1), (rect.x1, rect.y1)),  # bas : H
        ((rect.x0, rect.y0), (rect.x0, rect.y1)),  # gauche : V
        ((rect.x1, rect.y0), (rect.x1, rect.y1)),  # droite : V
    ]


def _quad_edges(quad):
    """Les 4 côtés d'un quadrilatère (le losange inscrit, tracé comme un
    'qu' PyMuPDF, pas une ligne) — un edge par paire de sommets consécutifs,
    dans l'ordre ul, ur, ll, lr de PyMuPDF (le losange a ses sommets aux
    quatre milieux de bord de la grille, dans cet ordre en tournant)."""
    ul, ur, ll, lr = quad.ul, quad.ur, quad.ll, quad.lr
    ordre = [ul, ur, lr, ll]
    return [((ordre[i].x, ordre[i].y), (ordre[(i + 1) % 4].x, ordre[(i + 1) % 4].y)) for i in range(4)]


def releve_fichier(path):
    """Rend la liste dédoublonnée de {nature, ecart} tracés dans le PDF."""
    doc = fitz.open(path)
    page = doc[0]
    min_x, min_y, ppu_x, ppu_y = _grid_calibration(page)

    def to_unit(xy):
        x, y = xy
        return (x - min_x) / ppu_x, (y - min_y) / ppu_y

    axes = set()
    n_segments = 0
    n_chemins = 0
    for d in page.get_drawings():
        if d['type'] != 's':
            continue
        n_chemins += 1
        segments_bruts = []
        for item in d['items']:
            if item[0] == 'l':
                segments_bruts.append(((item[1].x, item[1].y), (item[2].x, item[2].y)))
            elif item[0] == 're':
                segments_bruts.extend(_rect_edges(item[1]))
            elif item[0] == 'qu':
                segments_bruts.extend(_quad_edges(item[1]))
            # autres types (courbes 'c', etc.) : aucun rencontré dans ce
            # corpus — non gérés plutôt que mal gérés en silence.

        for p1_px, p2_px in segments_bruts:
            p1, p2 = to_unit(p1_px), to_unit(p2_px)
            res = _classifie_segment(p1, p2)
            if res is None:
                continue  # segment non reconnu comme axe (ex. un côté de cadre décoratif hors grille)
            nature, ecart = res
            n_segments += 1
            axes.add((nature, _replie_et_arrondi(ecart)))

    return sorted(axes), n_chemins, n_segments


# Correspondance nom de fichier -> nom de famille du catalogue.
_FICHIER_VERS_FAMILLE = {
    'bandesT0 YIN': 'T0 YIN', 'bandesT0 YIN MUT': 'T0 YIN MUT',
    'bandesT0 YANG': 'T0 YANG', 'bandesT0 YANG MUT': 'T0 YANG MUT',
    'bandesT1 YIN': 'T1 YIN', 'bandesT1 YIN MUT': 'T1 YIN MUT',
    'bandesT1 YANG': 'T1 YANG', 'bandesT1 YANG MUT': 'T1 YANG MUT',
    'bandesT2 YIN': 'T2 YIN', 'bandesT2 YIN MUT': 'T2 YIN MUT',
    'bandesT2 YANG': 'T2 YANG', 'bandesT2 YANG MUT': 'T2 YANG MUT',
    'bandesT3 YIN': 'T3 YIN', 'bandesT3 YIN MUT': 'T3 YIN MUT',
    'bandesT3 YANG': 'T3 YANG', 'bandesT3 YANG MUT': 'T3 YANG MUT',
}


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    if args[0] == '--catalogue':
        dossier = args[1]
        cat_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'AXES', 'catalogue.json')
        with open(cat_path, encoding='utf-8') as f:
            catalogue = json.load(f)

        ok, total = 0, 0
        for stem, famille in _FICHIER_VERS_FAMILLE.items():
            path = os.path.join(dossier, stem + '.pdf')
            if not os.path.exists(path):
                print(f"{stem}.pdf : INTROUVABLE")
                continue
            total += 1
            axes, n_chemins, n_segments = releve_fichier(path)
            attendu = sorted((a['nature'], round(a['ecart'], 3)) for a in catalogue['familles'][famille])
            statut = 'OK' if axes == attendu else f'DIFFÈRE (relevé {len(axes)} axes, attendu {len(attendu)})'
            if axes == attendu:
                ok += 1
            print(f"{famille:14s} {n_chemins:2d} chemins {n_segments:2d} segments -> {len(axes):2d} droites  {statut}")
            if axes != attendu:
                print(f"    relevé  : {axes}")
                print(f"    attendu : {attendu}")
        print(f"\n{ok}/{total} familles conformes au catalogue.")
    else:
        for path in args:
            axes, n_chemins, n_segments = releve_fichier(path)
            print(f"{os.path.basename(path)} : {n_chemins} chemins, {n_segments} segments -> {len(axes)} droites")
            for nature, ecart in axes:
                print(f"  {nature} {ecart}")


if __name__ == '__main__':
    main()
