#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_360.py — Générateur de data/referent_360_v3.json
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Lit les 360 calques sources (SVG, un par (famille, teinte, niveau)) et
produit :
  - data/referent_360_src/<famille>/<teinte>/<niveau>.svg  (copie normalisée
    des 360 SVG sources, committée — 16,65 Mo, sans .ai ni zip)
  - data/referent_360_src/MANIFEST.json  (SHA-256 de chaque SVG source)
  - data/referent_360_v3.json            (positions violettes/magenta/orange
    par calque, format consommé par carter.py)

Deux sources possibles, choisies automatiquement :
  1. Matériel brut de l'auteur ("0 KRE-360/MAGIC-CHESS-360-15-MOTIFS/...",
     660 Mo avec les .ai et zips, JAMAIS committé — voir .gitignore) : sert
     UNE FOIS à peupler data/referent_360_src/, sur la machine de l'auteur.
  2. data/referent_360_src/ déjà peuplé (committé) : permet de régénérer
     referent_360_v3.json n'importe où, sans le matériel brut — c'est le
     chemin normal pour CI/tests/relecture.

Règles d'extraction (validées avec l'auteur, 2026-09-12) :
  - Visibilité : un élément est ignoré si lui-même ou un ancêtre <g> est
    masqué (display:none, visibility:hidden, attribut/style, classe CSS du
    bloc <style>, opacité nulle).
  - Couleur : fill hex direct, ou fill:url(#id) vers un gradient — la classe
    CSS est alors associée au gradient par ORDRE D'APPARITION dans le
    document (pas par id, non fiable sur les exports Illustrator de
    l'auteur), couleur prise sur le premier stop.
  - Superposition : la couleur réelle d'une case = l'élément visible le
    plus haut dans la pile (le dernier dessiné dans l'ordre du document)
    qui couvre son centre, tous types d'éléments confondus (rect/path/
    polygon/polyline). Sur les 360 calques réels, 0 conflit trouvé — les
    calques à 2 couleurs (identités YIN-MUT) sont un contenu voulu, pas un
    artefact de superposition (confirmé par l'auteur).
  - Classification : chaque couleur résolue est classée parmi les 3
    couleurs de référence (violet/magenta/orange) par la teinte HSV la
    plus proche.
  - Niveau : chaque case est rattachée à 1 des 6 niveaux via LAYER_OF (la
    même matrice 12×12 que le site, assets/calque-engine.js).

Invariant vérifié sur les 360 calques (voir tests) : 48/48/48 par
superposition (somme sur les 6 niveaux d'une identité famille/teinte) —
56/60 identités à 8 cases violettes/niveau uniformément, 4 identités
"YIN-MUT-*" à transposition 2 couleurs (0 ou 16 cases violettes/niveau).
"""
import colorsys
import hashlib
import json
import os
import re
import shutil
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_SRC = os.path.join(REPO_ROOT, "0 KRE-360", "MAGIC-CHESS-360-15-MOTIFS")
COMMITTED_SRC = os.path.join(REPO_ROOT, "data", "referent_360_src")
OUT_JSON = os.path.join(REPO_ROOT, "data", "referent_360_v3.json")
MANIFEST_PATH = os.path.join(COMMITTED_SRC, "MANIFEST.json")

LAYER_OF = [
    [1,1,3,4,6,6,6,6,4,3,1,1],[1,2,2,5,5,6,6,5,5,2,2,1],
    [3,2,3,4,5,4,4,5,4,3,2,3],[4,5,4,3,2,3,3,2,3,4,5,4],
    [6,5,5,2,2,1,1,2,2,5,5,6],[6,6,4,3,1,1,1,1,3,4,6,6],
    [6,6,4,3,1,1,1,1,3,4,6,6],[6,5,5,2,2,1,1,2,2,5,5,6],
    [4,5,4,3,2,3,3,2,3,4,5,4],[3,2,3,4,5,4,4,5,4,3,2,3],
    [1,2,2,5,5,6,6,5,5,2,2,1],[1,1,3,4,6,6,6,6,4,3,1,1],
]
XS = [110.58,141.74,172.89,204.05,235.21,266.36,297.52,328.68,359.83,390.99,422.15,453.31]
YS = [234.1,265.25,296.41,327.57,358.72,389.88,421.04,452.19,483.35,514.51,545.66,576.82]
CELL_W = 31.16

REF_HUES = {
    'V': colorsys.rgb_to_hsv(0x66/255, 0x2d/255, 0x91/255)[0],   # #662d91 violet
    'M': colorsys.rgb_to_hsv(0xee/255, 0x2a/255, 0x7b/255)[0],   # #ee2a7b magenta
    'O': colorsys.rgb_to_hsv(0xfb/255, 0xb0/255, 0x40/255)[0],   # #fbb040 orange
}
COLOR_NAME = {'V': 'violet', 'M': 'magenta', 'O': 'orange'}


def hex_to_hue(hexcolor):
    hexcolor = hexcolor.lstrip('#')
    r, g, b = int(hexcolor[0:2], 16)/255, int(hexcolor[2:4], 16)/255, int(hexcolor[4:6], 16)/255
    return colorsys.rgb_to_hsv(r, g, b)[0]


def classify_hue(hue):
    best, best_d = None, 1e9
    for label, refhue in REF_HUES.items():
        d = min(abs(hue - refhue), 1 - abs(hue - refhue))
        if d < best_d:
            best, best_d = label, d
    return best, best_d


# ── Parsing SVG : visibilité + gradients par ordre + superposition ─────────

_TAG_RE = re.compile(r'<(/?)([a-zA-Z]+)([^>]*)>')
_NUM_RE = re.compile(r'-?\d+\.?\d*')


def _attrs(attr_str):
    return dict(re.findall(r'([a-zA-Z\-:]+)\s*=\s*"([^"]*)"', attr_str))


def find_hidden_classes(svg):
    hidden = set()
    m = re.search(r'<style>([\s\S]*?)</style>', svg)
    if not m: return hidden
    for selectors, body in re.findall(r'([^{}]+)\{([^}]*)\}', m.group(1)):
        low = body.lower()
        if 'display:none' in low.replace(' ', '') or 'visibility:hidden' in low.replace(' ', '') \
           or re.search(r'opacity:\s*0(?:[^.\d]|$)', low):
            for sel in selectors.split(','):
                sel = sel.strip().lstrip('.')
                if sel: hidden.add(sel)
    return hidden


def find_fill_classes(svg):
    out = {}
    m = re.search(r'<style>([\s\S]*?)</style>', svg)
    if not m: return out
    url_index = 0
    for selectors, body in re.findall(r'([^{}]+)\{([^}]*)\}', m.group(1)):
        fm = re.search(r'fill:\s*(#[0-9a-fA-F]{6})', body)
        um = re.search(r'fill:\s*url\(', body)
        if fm:
            val = ('hex', fm.group(1).lower())
        elif um:
            val = ('url', url_index)
            url_index += 1
        else:
            continue
        for sel in selectors.split(','):
            sel = sel.strip().lstrip('.')
            if sel: out[sel] = val
    return out


def find_gradients_in_order(svg):
    grads = []
    for gm in re.finditer(r'<(radialGradient|linearGradient)\s+id="([^"]+)"[^>]*>([\s\S]*?)</\1>', svg):
        gid, body = gm.group(2), gm.group(3)
        stops = re.findall(r'<stop[^>]*stop-color="(#[0-9a-fA-F]{6})"', body)
        if not stops:
            stops = re.findall(r'<stop[^>]*style="[^"]*stop-color:\s*(#[0-9a-fA-F]{6})', body)
        grads.append((gid, stops[0].lower() if stops else None))
    return grads


def is_hidden_via_attrs(attrs):
    style = attrs.get('style', '')
    if attrs.get('display', '').lower() == 'none': return True
    if attrs.get('visibility', '').lower() == 'hidden': return True
    if 'display:none' in style.replace(' ', ''): return True
    if 'visibility:hidden' in style.replace(' ', ''): return True
    if re.search(r'opacity:\s*0(?:[^.\d]|$)', style): return True
    if attrs.get('opacity', '') == '0': return True
    return False


def _path_bbox(d):
    nums = [float(n) for n in _NUM_RE.findall(d)]
    if len(nums) < 4: return None
    xs = nums[0::2]; ys = nums[1::2]
    if not xs or not ys: return None
    return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)


def parse_svg(path):
    """Retourne (cells, diag). cells = liste de (row, col, label) — UNE
    entrée par case couverte, résolue par la règle de superposition
    (dernier élément visible dans l'ordre du document, tous types
    confondus). label ∈ {'V','M','O'}."""
    with open(path, encoding='utf-8') as f:
        svg = f.read()

    hidden_classes = find_hidden_classes(svg)
    fill_classes = find_fill_classes(svg)
    gradients = find_gradients_in_order(svg)

    diag = Counter()
    candidates = []
    doc_index = 0

    def resolve_color(cls_list):
        for c in cls_list:
            v = fill_classes.get(c)
            if v is None: continue
            if v[0] == 'hex':
                return v[1]
            elif v[0] == 'url':
                idx = v[1]
                if idx < len(gradients):
                    return gradients[idx][1]
            break
        return None

    hidden_stack = [False]
    for m in _TAG_RE.finditer(svg):
        closing, tag, rest = m.group(1), m.group(2), m.group(3)
        if tag == 'g':
            if closing:
                if hidden_stack: hidden_stack.pop()
                continue
            attrs = _attrs(rest)
            cls_hidden = any(c in hidden_classes for c in attrs.get('class', '').split())
            attr_hidden = is_hidden_via_attrs(attrs)
            hidden_stack.append(hidden_stack[-1] or cls_hidden or attr_hidden)
            continue

        if tag not in ('rect', 'path', 'polygon', 'polyline'):
            continue
        attrs = _attrs(rest)
        if tag == 'rect':
            diag['n_total_rects'] += 1
        cls_hidden = any(c in hidden_classes for c in attrs.get('class', '').split())
        attr_hidden = is_hidden_via_attrs(attrs)
        is_hidden = hidden_stack[-1] or cls_hidden or attr_hidden
        doc_index += 1
        if is_hidden:
            diag['n_hidden'] += 1
            continue

        if tag == 'rect':
            try:
                w = float(attrs.get('width', '0')); h = float(attrs.get('height', '0'))
                x = float(attrs.get('x', '0')); y = float(attrs.get('y', '0'))
            except ValueError:
                continue
            if abs(w - CELL_W) > 0.1 or abs(h - CELL_W) > 0.1:
                continue
        else:
            bbox = _path_bbox(attrs.get('d') or attrs.get('points') or '')
            if bbox is None: continue
            x, y, w, h = bbox
            if abs(w - CELL_W) > 0.5 or abs(h - CELL_W) > 0.5:
                continue

        resolved = resolve_color(attrs.get('class', '').split())
        if resolved is None:
            continue
        col = next((i for i, vv in enumerate(XS) if abs(vv - x) < 0.5), -1)
        row = next((i for i, vv in enumerate(YS) if abs(vv - y) < 0.5), -1)
        if row < 0 or col < 0:
            continue
        label, dist = classify_hue(hex_to_hue(resolved))
        candidates.append((doc_index, row, col, label))

    by_pos = defaultdict(list)
    for doc_idx, row, col, label in candidates:
        by_pos[(row, col)].append((doc_idx, label))

    diag['n_positions_with_conflict'] = sum(1 for v in by_pos.values() if len(v) > 1)

    cells = []
    for (row, col), entries in by_pos.items():
        entries.sort(key=lambda e: e[0])
        cells.append((row, col, entries[-1][1]))   # dernier dessiné = visible

    return cells, diag


# ── Découverte : matériel brut (dev, une fois) ──────────────────────────────

def discover_raw_files(scratch_dir):
    """Découvre les 360 SVG depuis le matériel brut de l'auteur. PAR2/PAR3
    sont zippés dans le matériel brut : extraits ici dans scratch_dir
    (jamais dans le dépôt)."""
    out = []

    for p in _glob(RAW_SRC, "KRE-360-BASES", "KRE-360-BASES-96-CARTES", "*", "*", "*.svg"):
        fname = os.path.basename(p)
        mm = re.search(r'-(\d\d)\.svg$', fname)
        if not mm: continue
        niveau = int(mm.group(1))
        subdir = os.path.basename(os.path.dirname(p))
        out.append((p, "BASES", subdir.replace("BASES-", "", 1), niveau))

    par2_zips = _glob(RAW_SRC, "KRE-360-PAR2", "*.zip")
    par3_zip = os.path.join(RAW_SRC, "KRE-360-PAR3.zip")
    os.makedirs(scratch_dir, exist_ok=True)
    for zp in par2_zips + ([par3_zip] if os.path.exists(par3_zip) else []):
        with zipfile.ZipFile(zp) as z:
            for n in z.namelist():
                if n.lower().endswith('.svg'):
                    data = z.read(n)
                    with open(os.path.join(scratch_dir, os.path.basename(n)), 'wb') as f:
                        f.write(data)

    for p in _glob(scratch_dir, "*PAR2-*-X-*.svg"):
        fname = os.path.basename(p)
        mm = re.match(r'(?:KRE|MAGIC-CHESS)-360-PAR2-(.+)-X-(YANG(?:-MUT)?|YING?(?:-MUT)?)-(\d\d)\.svg$', fname)
        if not mm: continue
        out.append((p, "PAR2-" + mm.group(1).replace("YING", "YIN"),
                    mm.group(2).replace("YING", "YIN"), int(mm.group(3))))

    for p in _glob(scratch_dir, "*PAR3-SANS-*-X-*.svg"):
        fname = os.path.basename(p)
        mm = re.match(r'(?:KRE|MAGIC-CHESS)-360-PAR3-(SANS-[A-Z\-]+?)-X-(YANG(?:-MUT)?|YING?(?:-MUT)?)-(\d\d)\.svg$', fname)
        if not mm: continue
        out.append((p, "PAR3-" + mm.group(1).replace("YING", "YIN"),
                    mm.group(2).replace("YING", "YIN"), int(mm.group(3))))

    for p in _glob(RAW_SRC, "KRE-360-YIN&YANG", "KRE360-YIN&YANG-24-CARTES", "*", "*.svg"):
        fname = os.path.basename(p)
        mm = re.search(r'-(\d\d)\.svg$', fname)
        if not mm: continue
        subdir = os.path.basename(os.path.dirname(p))
        out.append((p, "YINYANG", subdir.replace("BASES-YING&YANG-", "", 1), int(mm.group(1))))

    return out


def _glob(*parts):
    import glob
    return glob.glob(os.path.join(*parts))


# ── Découverte : dépôt (committé, chemin normal) ────────────────────────────

def discover_committed_files():
    out = []
    for famille in sorted(os.listdir(COMMITTED_SRC)) if os.path.isdir(COMMITTED_SRC) else []:
        fam_dir = os.path.join(COMMITTED_SRC, famille)
        if not os.path.isdir(fam_dir): continue
        for teinte in sorted(os.listdir(fam_dir)):
            teinte_dir = os.path.join(fam_dir, teinte)
            if not os.path.isdir(teinte_dir): continue
            for fname in sorted(os.listdir(teinte_dir)):
                mm = re.match(r'(\d)\.svg$', fname)
                if not mm: continue
                out.append((os.path.join(teinte_dir, fname), famille, teinte, int(mm.group(1))))
    return out


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()


def populate_committed_src(raw_files):
    """Copie les 360 SVG bruts vers data/referent_360_src/<famille>/<teinte>/<niveau>.svg
    (nom normalisé), et construit MANIFEST.json (sha256 par fichier)."""
    manifest = {}
    for path, famille, teinte, niveau in raw_files:
        dest_dir = os.path.join(COMMITTED_SRC, famille, teinte)
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, f"{niveau}.svg")
        shutil.copyfile(path, dest)
        rel = os.path.relpath(dest, REPO_ROOT).replace(os.sep, '/')
        manifest[rel] = {
            'sha256': sha256_of(dest),
            'famille': famille, 'teinte': teinte, 'niveau': niveau,
            'source_original_path': os.path.relpath(path, REPO_ROOT).replace(os.sep, '/')
                                     if path.startswith(REPO_ROOT) else os.path.basename(path),
        }
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump({
            'format_version': 'referent-360-src-manifest-v1',
            'generated_at_utc': datetime.now(timezone.utc).isoformat(),
            'n_files': len(manifest),
            'files': manifest,
        }, f, indent=2, sort_keys=True)
    return manifest


def verify_manifest(files):
    """Vérifie que chaque fichier committé correspond à son SHA-256 dans
    MANIFEST.json — utilisé par les tests, sans dépendre du matériel brut."""
    with open(MANIFEST_PATH, encoding='utf-8') as f:
        manifest = json.load(f)['files']
    mismatches = []
    for path, famille, teinte, niveau in files:
        rel = os.path.relpath(path, REPO_ROOT).replace(os.sep, '/')
        expected = manifest.get(rel, {}).get('sha256')
        actual = sha256_of(path)
        if expected != actual:
            mismatches.append((rel, expected, actual))
    return mismatches


# ── referent_id = SHA-256 du JSON canonique (clés triées, sans espaces) ────

def canonical_json_bytes(doc_without_id):
    return json.dumps(doc_without_id, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False).encode('utf-8')


def compute_referent_id(doc_without_id):
    return hashlib.sha256(canonical_json_bytes(doc_without_id)).hexdigest()


# ── Génération de data/referent_360_v3.json (format v3 déclaratif) ─────────
# Format figé, contenu paramétrable (2026-09-12) : TOUT référent (celui-ci
# comme un futur référent personnalisé) déclare format_version/grid_size/
# colors/stegano_colors/calques/c_pub -- voir tools/validate_referent.py
# pour les contrôles génériques, et docs/REFERENT_FORMAT_V3.md (à écrire,
# tâche 8) pour la spécification complète. c_pub est laissé null ici :
# tools/calibrate_referent.py le calcule et l'écrit séparément (la
# bibliothèque refuse un référent sans c_pub).

def generate_v3_json(files):
    calques = []
    for path, famille, teinte, niveau in files:
        cells, diag = parse_svg(path)
        by_color = defaultdict(list)
        for row, col, label in cells:
            by_color[label].append([row, col])
        rel = os.path.relpath(path, REPO_ROOT).replace(os.sep, '/')
        calques.append({
            'famille': famille, 'teinte': teinte, 'niveau': niveau,
            'source_file': rel, 'source_sha256': sha256_of(path),
            'violet_positions': sorted(by_color.get('V', [])),
            'magenta_positions': sorted(by_color.get('M', [])),
            'orange_positions': sorted(by_color.get('O', [])),
        })
    calques.sort(key=lambda c: (c['famille'], c['teinte'], c['niveau']))

    # Coeur canonique de l'identité du référent (geometrie/couleurs/calques
    # UNIQUEMENT) : referent_id = SHA-256 de CE sous-document, PAS du
    # document final. c_pub est calibré APRES coup (tools/calibrate_
    # referent.py) et ne doit jamais faire varier referent_id -- sinon
    # calibrer changerait l'identité (et l'info HKDF, et les clés déjà
    # dérivées) du référent. generated_at_utc/generator_tool sont du
    # metadata non-identitaire, exclus pour la même raison (deux
    # regénérations du MEME contenu source doivent donner le MEME
    # referent_id, meme si l'horodatage differe).
    core = {
        'format_version': 'referent-v3',
        'referent_kind': 'referent_360',
        'grid_size': 12,
        'layer_of': LAYER_OF,
        'colors': ['violet', 'magenta', 'orange'],
        'color_hues_hex': {'violet': '#662d91', 'magenta': '#ee2a7b', 'orange': '#fbb040'},
        'stegano_colors': ['violet'],
        'calques': calques,
    }
    referent_id = compute_referent_id(core)

    doc = dict(core)
    doc['referent_id'] = referent_id
    doc['generated_at_utc'] = datetime.now(timezone.utc).isoformat()
    doc['generator_tool'] = 'tools/generate_referent_360.py'
    doc['n_calques'] = len(calques)
    doc['n_identities'] = len(set((c['famille'], c['teinte']) for c in calques))
    doc['extraction_rule'] = (
        "Couleur d'une case = l'élément visible (display/visibility/opacity "
        "non masqués, sur l'élément ou un ancêtre <g>) le plus haut dans la "
        "pile (dernier dessiné dans l'ordre du document) qui couvre son "
        "centre, tous types d'éléments confondus (rect/path/polygon/"
        "polyline). Classe hex→{violet,magenta,orange} par teinte HSV la "
        "plus proche. fill:url(#gradient) résolu par ORDRE D'APPARITION "
        "document, pas par id (non fiable sur les exports source)."
    )
    doc['invariant_48_48_48'] = (
        "Pour chaque identité (famille,teinte), la somme des cases "
        "violettes/magenta/orange sur ses 6 niveaux vaut exactement "
        "48/48/48. 56/60 identités : 8 cases violettes par niveau "
        "uniformément. 4 identités 'YIN-MUT-*' : transposition à 2 "
        "couleurs (0 ou 16 cases violettes par niveau, jamais 8) — "
        "magenta fixe côté YIN, orange fixe côté YANG (axe2)."
    )
    doc['c_pub'] = None   # rempli par tools/calibrate_referent.py
    return doc


if __name__ == '__main__':
    import sys
    scratch = os.path.join(REPO_ROOT, '.tmp_referent360_scratch')
    if os.path.isdir(RAW_SRC):
        print(f"Materiel brut trouve ({RAW_SRC}) -- regeneration complete depuis les SVG sources.")
        raw_files = discover_raw_files(scratch)
        print(f"{len(raw_files)} calques decouverts dans le materiel brut.")
        assert len(raw_files) == 360, f"attendu 360, trouve {len(raw_files)}"
        manifest = populate_committed_src(raw_files)
        print(f"data/referent_360_src/ peuple : {len(manifest)} fichiers + MANIFEST.json")
        shutil.rmtree(scratch, ignore_errors=True)
        files = discover_committed_files()
    else:
        print("Materiel brut absent -- utilisation de data/referent_360_src/ (deja committe).")
        files = discover_committed_files()

    assert len(files) == 360, f"attendu 360 calques, trouve {len(files)}"

    doc = generate_v3_json(files)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2, sort_keys=False)
    print(f"data/referent_360_v3.json ecrit : {doc['n_calques']} calques, "
          f"{doc['n_identities']} identites.")
