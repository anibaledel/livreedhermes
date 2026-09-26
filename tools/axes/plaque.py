#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
plaque.py — Lit une planche SVG (grille 12x12, cellule C8 : deux diagonales et
deux médianes, 8 triangles par case, 1152 triangles) et rend un masque de
1152 bits (1 = sombre).

Géométrie C8 : le secteur d'un triangle est le quadrant de 45° autour du
centre de case, compté depuis le haut dans le sens horaire —
secteur = floor(angle / 45). Ce n'est PAS un binning centré sur 22.5° : les
triangles ne sont pas équirépartis en angle (médiane et diagonale n'ont pas
la même longueur depuis le centre), leurs centroïdes tombent à ±26.57° et
±63.43° du bord du secteur — mesurer l'angle du sommet du triangle opposé au
centre donnerait un résultat faux ; on mesure l'angle du CENTROÏDE.

Le sombre se lit à la couleur de remplissage #808285, jamais au nom de
classe (cls-N n'est pas stable d'un fichier à l'autre) ; le clair est
#a7a9ac. Un triangle dont le fill n'est ni l'un ni l'autre (ex. cls du
cadre, fill: none) est ignoré.

Contrôle obligatoire : collisions == 0 — les 1152 triangles doivent occuper
les 1152 emplacements (rangée, colonne, secteur), un et un seul.

Usage :
    python tools/axes/plaque.py <fichier.svg> [<fichier2.svg> ...]
    python tools/axes/plaque.py --dir data/ORIGINES
"""

import glob
import math
import os
import re
import sys

GRID = 12
SECTORS = 8
SOMBRE_HEX = '#808285'
CLAIR_HEX = '#a7a9ac'


def parse_style_colors(svg_text):
    """cls-N -> couleur de fill en minuscules, ou None si fill absent/'none'."""
    colors = {}
    style_match = re.search(r'<style>(.*?)</style>', svg_text, re.S)
    if not style_match:
        return colors
    for block in re.finditer(r'\.(cls-\d+)\s*\{([^}]*)\}', style_match.group(1)):
        cls, body = block.group(1), block.group(2)
        m = re.search(r'fill:\s*(#[0-9a-fA-F]{6})', body)
        colors[cls] = m.group(1).lower() if m else None
    return colors


def parse_polygons(svg_text):
    """Liste de (classe, [(x,y), ...]) pour chaque <polygon>."""
    out = []
    for m in re.finditer(r'<polygon\s+class="(cls-\d+)"\s+points="([^"]+)"', svg_text):
        cls = m.group(1)
        nums = [float(v) for v in re.split(r'[\s,]+', m.group(2).strip())]
        pts = list(zip(nums[0::2], nums[1::2]))
        out.append((cls, pts))
    return out


def centroid(pts):
    n = len(pts)
    return (sum(p[0] for p in pts) / n, sum(p[1] for p in pts) / n)


class PlaqueError(Exception):
    pass


def read_plaque(path):
    """Rend {'mask': [0/1]*1152, 'collisions': int, 'sombre': int, 'clair': int,
    'ignores': int} — mask[idx] avec idx = (row*GRID+col)*SECTORS + secteur."""
    with open(path, encoding='utf-8') as f:
        svg_text = f.read()

    fill_of = parse_style_colors(svg_text)
    polys = parse_polygons(svg_text)

    # Calibration : cadre de la grille = étendue de tous les points des
    # triangles colorés (sombre/clair) eux-mêmes — pas une constante supposée,
    # pas une lecture du rect de cadre (qui peut avoir une marge différente
    # de la grille utile selon les fichiers).
    xs, ys = [], []
    for cls, pts in polys:
        fill = fill_of.get(cls)
        if fill not in (SOMBRE_HEX, CLAIR_HEX):
            continue
        for x, y in pts:
            xs.append(x)
            ys.append(y)
    if not xs:
        raise PlaqueError(f"{path} : aucun triangle sombre/clair trouvé")
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    px_per_unit_x = (max_x - min_x) / GRID
    px_per_unit_y = (max_y - min_y) / GRID

    mask = [None] * (GRID * GRID * SECTORS)
    collisions = 0
    sombre = clair = ignores = 0

    for cls, pts in polys:
        fill = fill_of.get(cls)
        if fill not in (SOMBRE_HEX, CLAIR_HEX):
            ignores += 1
            continue
        cx, cy = centroid(pts)
        u = (cx - min_x) / px_per_unit_x
        v = (cy - min_y) / px_per_unit_y
        col = min(GRID - 1, max(0, int(math.floor(u))))
        row = min(GRID - 1, max(0, int(math.floor(v))))
        local_x = u - col
        local_y = v - row
        dx, dy = local_x - 0.5, local_y - 0.5
        # depuis le haut (0°), sens horaire : atan2(dx, -dy)
        bearing = math.degrees(math.atan2(dx, -dy)) % 360
        sector = int(math.floor(bearing / 45.0)) % SECTORS
        idx = (row * GRID + col) * SECTORS + sector
        bit = 1 if fill == SOMBRE_HEX else 0
        if mask[idx] is not None:
            collisions += 1
        mask[idx] = bit
        if fill == SOMBRE_HEX:
            sombre += 1
        else:
            clair += 1

    n_vides = sum(1 for b in mask if b is None)
    return {
        'mask': [b if b is not None else 0 for b in mask],
        'collisions': collisions,
        'vides': n_vides,
        'sombre': sombre,
        'clair': clair,
        'ignores': ignores,
    }


DOSSIERS_CORPUS = ['data/ORIGINES', 'data/ORIGINES T2']


def controle_corpus(dossiers=DOSSIERS_CORPUS):
    """Lance le contrôle de collisions sur TOUT le corpus (les 30 planches
    d'ORIGINES + ORIGINES T2, pas seulement à l'entrée d'un fichier isolé) :
    c'est ce balayage complet, pas une vérification au cas par cas, qui a
    trouvé le vrai défaut d'ORIGINES T2/bandesYIN MUT.svg (232 emplacements
    en collision, un défaut géométrique — pas les « 50 triangles clairs à
    corriger » d'une première description, fausse ; le fichier a depuis été
    remplacé, pas retouché). Rend (total_ok, total) et imprime le tableau."""
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
    total_ok, total = 0, 0
    for dossier in dossiers:
        chemin = os.path.join(root, dossier)
        paths = sorted(glob.glob(os.path.join(chemin, '*.svg')))
        print(f"--- {dossier} ({len(paths)} planches) ---")
        for path in paths:
            total += 1
            try:
                r = read_plaque(path)
            except PlaqueError as e:
                print(f"{os.path.basename(path):40s} ERREUR — {e}")
                continue
            sain = (r['collisions'] == 0 and r['vides'] == 0)
            statut = 'sain' if sain else f"HORS TRAME (collisions={r['collisions']} vides={r['vides']})"
            print(f"{os.path.basename(path):40s} sombre={r['sombre']:4d}/1152  {statut}")
            if sain and r['sombre'] == 576:
                total_ok += 1
    print(f"\n{total_ok}/{total} planches saines à 576/1152, sur tout le corpus.")
    return total_ok, total


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    if args[0] == '--corpus':
        controle_corpus()
        return
    if args[0] == '--dir':
        paths = sorted(glob.glob(os.path.join(args[1], '*.svg')))
    else:
        paths = args

    total_ok = 0
    for path in paths:
        try:
            r = read_plaque(path)
        except PlaqueError as e:
            print(f"{os.path.basename(path)} : ERREUR — {e}")
            continue
        sain = (r['collisions'] == 0 and r['vides'] == 0)
        statut = 'sain' if sain else f"HORS TRAME (collisions={r['collisions']} vides={r['vides']})"
        print(f"{os.path.basename(path):40s} sombre={r['sombre']:4d}/1152  {statut}")
        if sain and r['sombre'] == 576:
            total_ok += 1
    print(f"\n{total_ok}/{len(paths)} planches saines à 576/1152.")


if __name__ == '__main__':
    main()
