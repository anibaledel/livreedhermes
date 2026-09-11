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
grid_row×16 + grid_col, 0..255).

Couleurs : 4 classes CSS résolues par EFFECTIF (pas par nom a priori) —
2 classes "petites" (6 cases/grille, stégano) et 2 "grandes" (12
cases/grille, crypto seulement). Aucun <radialGradient> dans ce SVG ; les
4 couleurs sont des fills hex directs. L'étiquetage rouge/bleu/vert/jaune
est FIGÉ par la constante CONFIRMED_COLOR_HEX (rouge=#eb6725, bleu=
#316287, vert=#94abbc, jaune=#f1a102 — confirmée par l'auteur le
2026-09-12, indépendante du numéro de classe CSS cls-N, non stable d'un
export Illustrator à l'autre). Cette résolution ne dépend PLUS de
l'ancien data/referent_256.json (retiré comme dépendance de calcul —
ce fichier reste néanmoins en production ailleurs, voir
_optional_legacy_crosscheck ci-dessous) : elle est validée seule, en
vérifiant que les 256 grilles satisfont verif_carre_magique.
check_croix_ansee (critères I-IV) à 256/256 — si le SVG source changeait
au point que la constante ne corresponde plus, cette vérification
échouerait et le script s'arrêterait (ValueError), plutôt que de
retomber silencieusement sur un mauvais étiquetage.

Dualité EGO/ALTER : le critère I de check_croix_ansee (symétrie
rouge/bleu par une diagonale) accepte l'anti-diagonale (EGO) OU la
diagonale principale (ALTER) — bug corrigé dans verif_carre_magique.py
(2026-09-12) après diagnostic sur ces mêmes 256 grilles, qui se
répartissent en damier EXACT 128 EGO / 128 ALTER selon la parité de
(grid_row + grid_col).

Contrôle facultatif (data/referent_256.json) : l'ancien fichier blue/
orange reste ACTIVEMENT CHARGÉ EN PRODUCTION par stegano_classic.py et
disk_lib.py (pas retiré du dépôt, pas retiré de ces deux modules) — ce
script se contente d'un recoupement FACULTATIF et non bloquant avec lui
(résultat consigné dans MANIFEST.json, jamais utilisé pour décider de
l'étiquetage).
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


# Etiquetage confirme (auteur, 2026-09-12) : identite par fill hex, PAS
# par nom de classe CSS (cls-N est un numero d'export Illustrator
# arbitraire, non stable d'un export a l'autre -- le hex, lui, est la
# couleur elle-meme). rouge=cls-1/bleu=cls-4/vert=cls-9/jaune=cls-10
# confirme a 256/256 (criteres I-IV, dualite EGO/ALTER) SANS dependre de
# l'ancien data/referent_256.json -- ce fichier reste un controle
# FACULTATIF (voir _optional_legacy_crosscheck ci-dessous), jamais une
# source de verite pour cette resolution.
CONFIRMED_COLOR_HEX = {
    '#eb6725': 'rouge',
    '#316287': 'bleu',
    '#94abbc': 'vert',
    '#f1a102': 'jaune',
}


def _resolve_color_labels(grid_color, fill_of_class):
    """Etiquette les classes par leur fill hex via CONFIRMED_COLOR_HEX
    (constante figee, independante de tout fichier externe). Deux
    controles de coherence structurelle avant d'accepter le resultat :
    1. effectif par classe (2 'petites' a 6/grille -- rouge/bleu, 2
       'grandes' a 12/grille -- vert/jaune) ; 2. les 256 grilles
       resultantes verifient check_croix_ansee (criteres I-IV, dualite
       EGO/ALTER) a 256/256. Leve si l'un des deux echoue -- ARRET, la
       constante ne correspond alors plus a ce SVG source."""
    counts = Counter(grid_color.values())
    petites = sorted([c for c, n in counts.items() if n == N_GRIDS * 6])
    grandes = sorted([c for c, n in counts.items() if n == N_GRIDS * 12])
    if len(petites) != 2 or len(grandes) != 2:
        raise ValueError(f"composition inattendue par classe : {dict(counts)} -- ARRET.")

    cls_to_label = {}
    for cls in petites + grandes:
        hexval = fill_of_class.get(cls)
        label = CONFIRMED_COLOR_HEX.get(hexval)
        if label is None:
            raise ValueError(
                f"classe {cls} (fill {hexval}) absente de CONFIRMED_COLOR_HEX "
                f"-- le SVG source a change, la constante doit etre revue, ARRET.")
        cls_to_label[cls] = label
    if set(cls_to_label[c] for c in petites) != {'rouge', 'bleu'} or \
       set(cls_to_label[c] for c in grandes) != {'vert', 'jaune'}:
        raise ValueError(
            f"CONFIRMED_COLOR_HEX assigne rouge/bleu ou vert/jaune au mauvais "
            f"groupe (petites={petites}, grandes={grandes}) -- ARRET.")

    n_ok = 0
    chiralites = {}
    for gid in range(N_GRIDS):
        grid = [[cls_to_label[grid_color[(gid, r, c)]] for c in range(6)] for r in range(6)]
        rep = check_croix_ansee(grid, verbose=False)
        if rep['tous_criteres_ok']:
            n_ok += 1
        chiralites[gid] = rep['critere_I_chiralite']
    if n_ok != N_GRIDS:
        raise ValueError(
            f"CONFIRMED_COLOR_HEX donne seulement {n_ok}/{N_GRIDS} grilles valides "
            f"(256 attendues) -- le SVG source a change, ARRET.")

    return cls_to_label, chiralites


def _optional_legacy_crosscheck(grid_color, cls_to_label):
    """Controle FACULTATIF, PUREMENT INFORMATIF : compare bleu/rouge de
    l'etiquetage retenu (ci-dessus, deja valide independamment) aux
    positions blue/orange de l'actuel data/referent_256.json (fichier
    encore charge en production par stegano_classic.py/disk_lib.py --
    PAS retire, PAS une dependance de cette resolution). N'influence
    jamais le resultat ; sert seulement a consigner la correspondance
    dans MANIFEST.json. Retourne un dict de diagnostic, jamais une
    exception (fichier absent = controle simplement ignore)."""
    if not os.path.exists(LEGACY_REF256_JSON):
        return {'performed': False, 'reason': 'data/referent_256.json absent'}
    with open(LEGACY_REF256_JSON, encoding='utf-8') as f:
        legacy = json.load(f)
    legacy_by_id = {entry['id']: (set(tuple(p) for p in entry['blue']),
                                   set(tuple(p) for p in entry['orange']))
                    for entry in legacy}

    def positions_of(gid, label):
        return set((r, c) for r in range(6) for c in range(6)
                   if cls_to_label[grid_color[(gid, r, c)]] == label)

    n_match = 0
    mismatches = []
    for gid in range(N_GRIDS):
        if gid not in legacy_by_id:
            mismatches.append(gid)
            continue
        blue_legacy, orange_legacy = legacy_by_id[gid]
        if positions_of(gid, 'bleu') == blue_legacy and positions_of(gid, 'rouge') == orange_legacy:
            n_match += 1
        else:
            mismatches.append(gid)
    return {
        'performed': True,
        'legacy_file': os.path.relpath(LEGACY_REF256_JSON, REPO_ROOT).replace(os.sep, '/'),
        'n_grids_matching': n_match,
        'n_grids_total': N_GRIDS,
        'mismatched_grid_ids': mismatches[:20],
        'note': ('blue<->bleu (cls-4), orange<->rouge (cls-1) attendus, meme id -- '
                 'controle historique de la resolution de couleur, plus utilise pour '
                 'la resoudre (voir CONFIRMED_COLOR_HEX).'),
    }


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
        "sur l'echiquier 16x16 de la page 047 (id = row*16+col, 0..255)."
    )
    doc['extraction_rule'] = (
        "Echiquier droit de la page 047 (x>950 sur viewBox 1920x1080), "
        "groupe <g id=\"good\">, cases ~5x5 (a ne pas confondre avec les "
        "cases ~7x7 de l'echiquier gauche, hors sujet). 9216 cases "
        "regroupees par clustering des centres x/y (tolerance 1 unite) "
        "en 96 positions distinctes de chaque cote = 16 grilles x 6 "
        "cases, sans ancrage manuel. 4 couleurs identifiees par effectif "
        "(2x6/grille = petites/stegano, 2x12/grille = grandes/crypto "
        "seulement) puis par fill hex (CONFIRMED_COLOR_HEX, figee) -- "
        "confirme par les 256 grilles sous "
        "verif_carre_magique.check_croix_ansee (criteres I-IV, dualite "
        "EGO/ALTER), independamment de tout autre fichier."
    )
    doc['chiralite_repartition'] = {'EGO': n_ego, 'ALTER': n_alter}
    doc['diag'] = diag
    doc['legacy_crosscheck'] = _optional_legacy_crosscheck(grid_color, cls_to_label)
    doc['c_pub'] = None   # rempli par tools/calibrate_referent.py
    return doc


def populate_committed_src(source_path, legacy_crosscheck=None):
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
        'legacy_crosscheck': legacy_crosscheck,
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
    print(f"Mapping couleurs retenu (CONFIRMED_COLOR_HEX) : {doc['color_hues_hex']}")
    lc = doc['legacy_crosscheck']
    if lc['performed']:
        print(f"Controle facultatif vs {lc['legacy_file']} : "
              f"{lc['n_grids_matching']}/{lc['n_grids_total']} grilles coincident")
    else:
        print(f"Controle facultatif vs data/referent_256.json : ignore ({lc['reason']})")

    manifest = populate_committed_src(source_path, legacy_crosscheck=lc)
    print(f"data/referent_256_src/ peuple : MANIFEST.json ({len(manifest['files'])} fichiers)")

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2, sort_keys=False)
    print(f"{OUT_JSON} ecrit. referent_id={doc['referent_id'][:16]}...")
