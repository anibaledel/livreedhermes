#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_vichy.py — Générateur de data/referent_vichy_v1.json

Les 15 SVG source (data/referent_vichy_src/, dossier VICHY fourni) sont
retravaillés à la main dans Illustrator, pas des sorties de générateur —
contrairement à referent_bicolore_v1.json. Leur structure interne varie
d'un fichier à l'autre (aplats simples, rectangles tournés à 45°, grilles
de traits-guides), et le nombre de <rect> varie (144-147, cadres résiduels
d'Illustrator). Lire les coordonnées SVG directement serait fragile et
demanderait une règle différente par fichier ; ce script les traite plutôt
comme une SOURCE VISUELLE : chaque fichier est rasterisé à haute résolution
(via tools/_vichy_rasterize.mjs, sharp — aucun rasterizer SVG natif
disponible côté Python sur cette machine), puis chacune des 144 cellules
de la grille 12×12 est échantillonnée en son centre et classée parmi les
trois teintes connues (#a7a9ac clair, #939598 moyen, #808285 sombre) par
plus proche voisin.

Contamination connue : les traits-guides rouges (#a91e22, résiduels de
construction Illustrator) traversent certaines cellules en diagonale. Ils
sont chromatiquement très distincts des trois gris (R≫G≈B, saturation
élevée) et sont donc détectés et exclus — l'échantillon retombe alors sur
la médiane d'un petit voisinage autour du centre plutôt que sur le pixel
exact, pour éviter de retomber sur le même trait.

Usage : python tools/generate_referent_vichy.py
"""

import json
import os
import subprocess
import sys
from statistics import median

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
SRC_DIR = os.path.join(REPO_ROOT, 'data', 'referent_vichy_src')
OUT_JSON = os.path.join(REPO_ROOT, 'data', 'referent_vichy_v1.json')
RASTER_JS = os.path.join(TOOLS_DIR, '_vichy_rasterize.mjs')
SCRATCH_DIR = os.path.join(TOOLS_DIR, '_vichy_scratch')

GRID = 12
RENDER_SIZE = 1200

# Les trois teintes connues (defs des 15 SVG, identiques partout) :
TONES = {
    'clair':  (0xa7, 0xa9, 0xac),
    'moyen':  (0x93, 0x95, 0x98),
    'sombre': (0x80, 0x82, 0x85),
}
TONE_INDEX = {'sombre': 0, 'moyen': 1, 'clair': 2}


def rasterize(svg_path, png_path):
    subprocess.run(
        ['node', RASTER_JS, svg_path, png_path, str(RENDER_SIZE)],
        check=True, cwd=TOOLS_DIR,
    )


def is_guide_pixel(rgb):
    r, g, b = rgb
    # trait-guide #a91e22 : rouge dominant, très éloigné du gris (R>>G,B)
    return (r - g) > 30 and (r - b) > 20


def classify(rgb):
    best, best_d = None, 1e9
    for name, tone in TONES.items():
        d = sum((a - b) ** 2 for a, b in zip(rgb, tone))
        if d < best_d:
            best, best_d = name, d
    return best


def sample_cell(img, row, col, cell_px):
    cx = int(col * cell_px + cell_px / 2)
    cy = int(row * cell_px + cell_px / 2)
    # petit voisinage en croix autour du centre ; on écarte les pixels
    # contaminés par un trait-guide et on prend la médiane du reste.
    offsets = [(0, 0), (-8, 0), (8, 0), (0, -8), (0, 8), (-8, -8), (8, 8)]
    samples = []
    for dx, dy in offsets:
        x, y = cx + dx, cy + dy
        if 0 <= x < img.width and 0 <= y < img.height:
            rgb = img.getpixel((x, y))[:3]
            if not is_guide_pixel(rgb):
                samples.append(rgb)
    if not samples:
        samples = [img.getpixel((cx, cy))[:3]]
    r = int(median(s[0] for s in samples))
    g = int(median(s[1] for s in samples))
    b = int(median(s[2] for s in samples))
    return classify((r, g, b))


def grid_for_file(svg_path):
    base = os.path.splitext(os.path.basename(svg_path))[0]
    png_path = os.path.join(SCRATCH_DIR, base + '.png')
    rasterize(svg_path, png_path)
    img = Image.open(png_path).convert('RGB')
    cell_px = RENDER_SIZE / GRID
    grid = []
    for row in range(GRID):
        for col in range(GRID):
            grid.append(TONE_INDEX[sample_cell(img, row, col, cell_px)])
    return grid


def main():
    os.makedirs(SCRATCH_DIR, exist_ok=True)
    svgs = sorted(f for f in os.listdir(SRC_DIR) if f.endswith('.svg'))
    if len(svgs) != 15:
        print(f"ATTENTION : {len(svgs)} fichiers trouvés dans {SRC_DIR}, 15 attendus.", file=sys.stderr)

    grids = {}
    for f in svgs:
        path = os.path.join(SRC_DIR, f)
        grid = grid_for_file(path)
        grids[f] = grid
        counts = {name: grid.count(i) for name, i in TONE_INDEX.items()}
        print(f"{f:40s} sombre={counts['sombre']:3d} moyen={counts['moyen']:3d} clair={counts['clair']:3d}")

    # Détection de doublons réels (même grille exacte) — distincte d'une
    # simple ressemblance de nom : deux fichiers dont les NOMS se
    # ressemblent ("YANG.svg" / "YANG PUR.svg") peuvent très bien coder
    # deux motifs différents une fois rendus, et deux noms différents
    # peuvent, une fois rendus, produire exactement la même grille.
    print("\n--- doublons exacts détectés (même grille rendue) ---")
    names = list(grids.keys())
    found_dup = False
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            if grids[names[i]] == grids[names[j]]:
                print(f"  {names[i]}  ==  {names[j]}")
                found_dup = True
    if not found_dup:
        print("  (aucun)")

    out = {
        'format': 'referent-vichy-v1',
        'decoupe': 'grille 12x12, 3 teintes par cellule (sombre/moyen/clair)',
        'grid': GRID,
        'parts': GRID * GRID,
        'tones_source': {k: '#%02x%02x%02x' % v for k, v in TONES.items()},
        'fichiers': {f: grid for f, grid in grids.items()},
    }
    with open(OUT_JSON, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
    print(f"\nÉcrit {OUT_JSON} ({os.path.getsize(OUT_JSON)} octets)")
    print("\nPas de correspondance vers les 15 noms de familles bicolore dans ce fichier :")
    print("les noms de fichiers ne s'alignent pas proprement dessus (voir rapport) — à trancher avant intégration UI.")


if __name__ == '__main__':
    main()
