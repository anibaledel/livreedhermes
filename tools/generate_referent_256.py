#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_256.py — Générateur de data/referent_256_v3.json
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Lit l'échiquier droit de la page 047 du livre (256 carrés magiques 6×6,
croix ansée) depuis le SVG source fourni par l'auteur, et produit :
  - data/referent_256_src/source.svg   (copie du SVG source, committée)
  - data/referent_256_src/MANIFEST.json (SHA-256 du SVG source, du script
    de génération, et du vérificateur verif_carre_magique.py)
  - data/referent_256_v3.json          (256 formes, format v3 déclaratif)

Repérage (validé avec l'auteur, 2026-09-12) : le groupe <g id="good"> du
SVG contient 18 688 <rect>, exactement 64×144 (échiquier gauche, hors
sujet ici) + 256×36 (échiquier droit, cible) + 256 (cadres de décor,
~42×42, ignorés). Les deux échiquiers se distinguent par la coordonnée x
(page 047, viewBox 1920×1080) : gauche x<950, droite x>950. Les cases de
l'échiquier droit mesurent ~5×5 (à ne pas confondre avec celles de
l'échiquier gauche, ~7×7, hors sujet). Aucun ancrage manuel : les 9216
cases droites sont regroupées par clustering de leurs centres x/y
(tolérance 1 unité, absorbe le jitter d'export Illustrator) en 96
positions x et 96 positions y distinctes = 16 grilles × 6 colonnes (resp.
16 grilles × 6 lignes), confirmé par l'écart régulier entre positions
(≈5.25 en case, ≈21/28.5 en saut de grille). Les 256 grilles sont
numérotées ligne par ligne, haut-gauche → bas-droite (grid_id =
grid_row×16 + grid_col, 0..255) — convention confirmée par la
correspondance exacte (256/256, même id) avec les positions "blue"/
"orange" de l'actuel data/referent_256.json.

Couleurs : 4 classes CSS résolues par EFFECTIF (pas par nom a priori) —
2 classes "petites" (6 cases/grille, stégano) et 2 "grandes" (12
cases/grille, crypto seulement). Aucun <radialGradient> dans ce SVG ; les
4 couleurs sont des fills hex directs. L'étiquetage rouge/bleu/vert/jaune
est déterminé en testant les 4 permutations possibles (2 pour les
petites × 2 pour les grandes) contre verif_carre_magique.check_croix_ansee.
Depuis la correction EGO/ALTER du critère I, EXACTEMENT 2 des 4
permutations donnent 256/256 : la retenue, et son "miroir" par
inversion GLOBALE et SIMULTANÉE rouge<->bleu et vert<->jaune (une
simple renommage des 4 couleurs, invariant pour les critères I-IV qui
ne distinguent pas l'identité absolue d'une couleur). Cette ambiguïté
est levée par recoupement avec l'actuel data/referent_256.json (blue/
orange, déjà en production, validé par l'auteur sur le site) : la
permutation retenue est celle dont les positions "bleu"/"rouge"
coïncident EXACTEMENT (256/256 grilles, même id) avec ses positions
"blue"/"orange" — confirmée par l'auteur : rouge=cls-1, bleu=cls-4,
vert=cls-9, jaune=cls-10.

Dualité EGO/ALTER : le critère I de check_croix_ansee (symétrie
rouge/bleu par une diagonale) accepte l'anti-diagonale (EGO) OU la
diagonale principale (ALTER) — bug corrigé dans verif_carre_magique.py
(2026-09-12) après diagnostic sur ces mêmes 256 grilles, qui se
répartissent en damier EXACT 128 EGO / 128 ALTER selon la parité de
(grid_row + grid_col).
"""
import hashlib
import json
import os
import re
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from itertools import permutations

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)
from verif_carre_magique import check_croix_ansee  # noqa: E402

RAW_SVG_CANDIDATES = [
    os.path.join(REPO_ROOT, "LLDH CARRELONG 4TRAD 2026 JUILLET-047.svg"),
]
COMMITTED_SRC = os.path.join(REPO_ROOT, "data", "referent_256_src")
COMMITTED_SVG = os.path.join(COMMITTED_SRC, "source.svg")
MANIFEST_PATH = os.path.join(COMMITTED_SRC, "MANIFEST.json")
OUT_JSON = os.path.join(REPO_ROOT, "data", "referent_256_v3.json")
VERIF_SCRIPT = os.path.join(REPO_ROOT, "verif_carre_magique.py")
LEGACY_REF256_JSON = os.path.join(REPO_ROOT, "data", "referent_256.json")

N_GRIDS = 256
GRID_COLS = 16   # 16x16 grilles sur l'echiquier droit
CELL_SIZE = 6
CLUSTER_TOL = 1.0
RIGHT_X_MIN = 950   # separe echiquier gauche (x<950) / droit (x>950), page 047


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()


def _find_source_svg():
    for p in RAW_SVG_CANDIDATES:
        if os.path.exists(p):
            return p
    if os.path.exists(COMMITTED_SVG):
        return COMMITTED_SVG
    raise FileNotFoundError(
        "SVG source introuvable (ni a la racine du depot, ni dans "
        "data/referent_256_src/source.svg). Voir RAW_SVG_CANDIDATES.")


def _style_fill_classes(svg):
    """{classe_css: '#rrggbb'} pour les regles a fill hex direct."""
    m = re.search(r'<style>([\s\S]*?)</style>', svg)
    if not m:
        return {}
    out = {}
    for selectors, body in re.findall(r'([^{}]+)\{([^}]*)\}', m.group(1)):
        fm = re.search(r'fill:\s*(#[0-9a-fA-F]{6})', body)
        if not fm:
            continue
        for sel in selectors.split(','):
            sel = sel.strip().lstrip('.')
            if sel:
                out[sel] = fm.group(1).lower()
    return out


def _cluster(vals, tol=CLUSTER_TOL):
    """Regroupe des valeurs 1D par ecart <= tol. Retourne une liste de
    listes d'indices (dans l'ordre croissant des valeurs)."""
    order = sorted(range(len(vals)), key=lambda i: vals[i])
    clusters = []
    cur = [order[0]]
    for i in order[1:]:
        if vals[i] - vals[cur[-1]] <= tol:
            cur.append(i)
        else:
            clusters.append(cur)
            cur = [i]
    clusters.append(cur)
    return clusters


def parse_svg(path):
    """Retourne (grid_color, fill_of_class, diag) :
    grid_color[(grid_id, row, col)] = classe CSS ('cls-N') de la case,
    grid_id = grid_row*16+grid_col, numerotation ligne par ligne."""
    with open(path, encoding='utf-8') as f:
        svg = f.read()

    fill_of_class = _style_fill_classes(svg)

    idx = svg.find('<g id="good">')
    if idx < 0:
        raise ValueError('groupe <g id="good"> introuvable dans le SVG source')
    sub = svg[idx:]
    rects = re.findall(
        r'<rect class="(cls-\d+)" x="([\d.]+)" y="([\d.]+)" '
        r'width="([\d.]+)" height="([\d.]+)"', sub)

    cells = [(cls, float(x), float(y), float(w), float(h))
             for cls, x, y, w, h in rects
             if float(x) > RIGHT_X_MIN and 4 < float(w) < 5.5 and 4 < float(h) < 5.5]

    diag = {'n_total_rects': len(rects), 'n_right_cells': len(cells)}
    expected = N_GRIDS * CELL_SIZE * CELL_SIZE
    if len(cells) != expected:
        raise ValueError(
            f"echiquier droit : {len(cells)} cases trouvees, {expected} attendues "
            f"(256 grilles x 36 cases) -- geometrie source a verifier, ARRET.")

    xs = [x + w / 2 for cls, x, y, w, h in cells]
    ys = [y + h / 2 for cls, x, y, w, h in cells]
    cx = _cluster(xs)
    cy = _cluster(ys)
    if len(cx) != GRID_COLS * CELL_SIZE or len(cy) != GRID_COLS * CELL_SIZE:
        raise ValueError(
            f"clustering : {len(cx)} colonnes / {len(cy)} lignes distinctes trouvees, "
            f"{GRID_COLS * CELL_SIZE} attendues des deux cotes -- ARRET.")

    x_rank = {}
    for ci, members in enumerate(cx):
        for i in members:
            x_rank[i] = ci
    y_rank = {}
    for ci, members in enumerate(cy):
        for i in members:
            y_rank[i] = ci

    grid_color = {}
    for i, (cls, x, y, w, h) in enumerate(cells):
        grid_col, cell_col = divmod(x_rank[i], CELL_SIZE)
        grid_row, cell_row = divmod(y_rank[i], CELL_SIZE)
        gid = grid_row * GRID_COLS + grid_col
        key = (gid, cell_row, cell_col)
        if key in grid_color:
            raise ValueError(f"case {key} assignee deux fois -- clustering ambigu, ARRET.")
        grid_color[key] = cls

    return grid_color, fill_of_class, diag


def _load_legacy_petite_positions():
    """Positions 'blue'/'orange' de l'actuel data/referent_256.json (deja
    en production), indexees par id de grille -- sert a lever
    l'ambiguite du miroir global rouge<->bleu / vert<->jaune (voir
    docstring du module). Retourne None si le fichier est absent."""
    if not os.path.exists(LEGACY_REF256_JSON):
        return None
    with open(LEGACY_REF256_JSON, encoding='utf-8') as f:
        legacy = json.load(f)
    return {entry['id']: (set(tuple(p) for p in entry['blue']),
                           set(tuple(p) for p in entry['orange']))
            for entry in legacy}


def _resolve_color_labels(grid_color, fill_of_class):
    """Determine par EFFECTIF les 2 classes 'petites' (6/grille -- stegano)
    et 2 'grandes' (12/grille -- crypto), puis teste les 4 etiquetages
    rouge/bleu/vert/jaune possibles contre check_croix_ansee sur les 256
    grilles. Depuis la correction EGO/ALTER, EXACTEMENT 2 permutations
    donnent 256/256 -- un miroir global (rouge<->bleu ET vert<->jaune
    simultanement, un simple renommage sans effet sur les criteres I-IV).
    Cette paire est departagee par recoupement avec l'actuel
    data/referent_256.json (blue/orange, deja en production) : la
    permutation retenue est celle dont bleu/rouge coincident EXACTEMENT
    avec blue/orange (meme id). Leve si aucune, ou plusieurs, ne
    correspond -- ARRET, pas de decision unilaterale."""
    counts = Counter(grid_color.values())
    petites = sorted([c for c, n in counts.items() if n == N_GRIDS * 6])
    grandes = sorted([c for c, n in counts.items() if n == N_GRIDS * 12])
    if len(petites) != 2 or len(grandes) != 2:
        raise ValueError(f"composition inattendue par classe : {dict(counts)} -- ARRET.")

    def grids_of(cls_to_label):
        for gid in range(N_GRIDS):
            yield gid, [[cls_to_label[grid_color[(gid, r, c)]] for c in range(6)]
                        for r in range(6)]

    def positions_of(cls_to_label, gid, label):
        return set((r, c) for r in range(6) for c in range(6)
                   if cls_to_label[grid_color[(gid, r, c)]] == label)

    winners = []
    for p_perm in permutations(['rouge', 'bleu']):
        petite_map = dict(zip(petites, p_perm))
        for g_perm in permutations(['vert', 'jaune']):
            grande_map = dict(zip(grandes, g_perm))
            cls_to_label = {**petite_map, **grande_map}
            n_ok = 0
            chiralites = {}
            for gid, grid in grids_of(cls_to_label):
                rep = check_croix_ansee(grid, verbose=False)
                if rep['tous_criteres_ok']:
                    n_ok += 1
                chiralites[gid] = rep['critere_I_chiralite']
            if n_ok == N_GRIDS:
                winners.append((cls_to_label, chiralites))

    if len(winners) == 1:
        return winners[0]

    if len(winners) == 0:
        raise ValueError(
            f"0 etiquetage ne donne 256/256 -- ARRET. classes petites={petites}, "
            f"grandes={grandes}, fills={ {c: fill_of_class.get(c) for c in petites+grandes} }")

    # >1 gagnant (attendu : exactement 2, le miroir global) -- departage
    # par recoupement avec l'actuel data/referent_256.json.
    legacy = _load_legacy_petite_positions()
    if legacy is None:
        raise ValueError(
            f"{len(winners)} etiquetages donnent 256/256 (miroir global attendu) et "
            f"{LEGACY_REF256_JSON} est absent pour departager -- ARRET.")

    matches = []
    for cls_to_label, chiralites in winners:
        all_match = True
        for gid in range(N_GRIDS):
            if gid not in legacy:
                all_match = False
                break
            blue_legacy, orange_legacy = legacy[gid]
            bleu_ext = positions_of(cls_to_label, gid, 'bleu')
            rouge_ext = positions_of(cls_to_label, gid, 'rouge')
            if blue_legacy != bleu_ext or orange_legacy != rouge_ext:
                all_match = False
                break
        if all_match:
            matches.append((cls_to_label, chiralites))

    if len(matches) != 1:
        raise ValueError(
            f"{len(winners)} etiquetages a 256/256, {len(matches)} coincident avec "
            f"{LEGACY_REF256_JSON} (1 attendu) -- ambigu, ARRET.")

    return matches[0]


def canonical_json_bytes(doc_without_id):
    return json.dumps(doc_without_id, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False).encode('utf-8')


def compute_referent_id(core):
    return hashlib.sha256(canonical_json_bytes(core)).hexdigest()


def generate_v3_json(source_path):
    grid_color, fill_of_class, diag = parse_svg(source_path)
    cls_to_label, chiralites = _resolve_color_labels(grid_color, fill_of_class)

    colors = ['rouge', 'bleu', 'vert', 'jaune']
    forms = []
    for gid in range(N_GRIDS):
        by_color = {c: [] for c in colors}
        for r in range(6):
            for c in range(6):
                label = cls_to_label[grid_color[(gid, r, c)]]
                by_color[label].append([r, c])
        entry = {'id': gid, 'row': gid // GRID_COLS, 'col': gid % GRID_COLS,
                 'chiralite': chiralites[gid]}
        for color in colors:
            entry[f'{color}_positions'] = sorted(by_color[color])
        forms.append(entry)

    n_ego = sum(1 for v in chiralites.values() if v == 'EGO')
    n_alter = sum(1 for v in chiralites.values() if v == 'ALTER')

    core = {
        'format_version': 'referent-v3',
        'referent_kind': 'referent_256_book',
        'grid_size': CELL_SIZE,
        'colors': colors,
        'color_hues_hex': {c: fill_of_class[cls] for cls, c in cls_to_label.items()},
        'stegano_colors': ['rouge', 'bleu'],
        'crypto_color_order': colors,
        'forms': forms,
    }
    referent_id = compute_referent_id(core)

    doc = dict(core)
    doc['referent_id'] = referent_id
    doc['generated_at_utc'] = datetime.now(timezone.utc).isoformat()
    doc['generator_tool'] = 'tools/generate_referent_256.py'
    doc['n_forms'] = len(forms)
    doc['numbering_rule'] = (
        "256 grilles numerotees ligne par ligne, haut-gauche -> bas-droite "
        "sur l'echiquier 16x16 de la page 047 (id = row*16+col, 0..255) -- "
        "confirme par correspondance exacte (256/256, meme id) avec les "
        "positions blue/orange de l'actuel data/referent_256.json."
    )
    doc['extraction_rule'] = (
        "Echiquier droit de la page 047 (x>950 sur viewBox 1920x1080), "
        "groupe <g id=\"good\">, cases ~5x5 (a ne pas confondre avec les "
        "cases ~7x7 de l'echiquier gauche, hors sujet). 9216 cases "
        "regroupees par clustering des centres x/y (tolerance 1 unite) "
        "en 96 positions distinctes de chaque cote = 16 grilles x 6 "
        "cases, sans ancrage manuel. 4 couleurs identifiees par effectif "
        "(2x6/grille = petites/stegano, 2x12/grille = grandes/crypto "
        "seulement) ; etiquetage rouge/bleu/vert/jaune retenu = seul des "
        "4 possibles a faire passer les 256 grilles sous "
        "verif_carre_magique.check_croix_ansee (criteres I-IV, dualite "
        "EGO/ALTER)."
    )
    doc['chiralite_repartition'] = {'EGO': n_ego, 'ALTER': n_alter}
    doc['diag'] = diag
    doc['c_pub'] = None   # rempli par tools/calibrate_referent.py
    return doc


def populate_committed_src(source_path):
    os.makedirs(COMMITTED_SRC, exist_ok=True)
    if os.path.abspath(source_path) != os.path.abspath(COMMITTED_SVG):
        shutil.copyfile(source_path, COMMITTED_SVG)
    manifest = {
        'format_version': 'referent-256-src-manifest-v1',
        'generated_at_utc': datetime.now(timezone.utc).isoformat(),
        'files': {
            'data/referent_256_src/source.svg': {
                'sha256': sha256_of(COMMITTED_SVG),
                'description': ('SVG source fourni par l\'auteur — LLDH CARRELONG '
                                 '4TRAD 2026 JUILLET-047.svg (page 047, echiquier '
                                 'droit = 256 carres magiques 6x6 du livre).'),
            },
            'tools/generate_referent_256.py': {
                'sha256': sha256_of(os.path.abspath(__file__)),
            },
            'verif_carre_magique.py': {
                'sha256': sha256_of(VERIF_SCRIPT),
                'description': ('Fourni par l\'auteur ; critere I corrige le '
                                 '2026-09-12 (dualite EGO/ALTER, commit separe).'),
            },
        },
    }
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    return manifest


if __name__ == '__main__':
    source_path = _find_source_svg()
    print(f"Source SVG : {source_path}")

    doc = generate_v3_json(source_path)
    print(f"{doc['n_forms']} grilles extraites, toutes valides "
          f"(criteres I-IV) -- repartition chiralite : {doc['chiralite_repartition']}")
    print(f"Mapping couleurs retenu : {doc['color_hues_hex']}")

    manifest = populate_committed_src(source_path)
    print(f"data/referent_256_src/ peuple : MANIFEST.json ({len(manifest['files'])} fichiers)")

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2, sort_keys=False)
    print(f"{OUT_JSON} ecrit. referent_id={doc['referent_id'][:16]}...")
