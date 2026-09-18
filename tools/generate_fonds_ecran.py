#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_fonds_ecran.py — Générateur de data/fonds_ecran_v1.json

Lit data/referent_360_v3.json (360 cartes, 15 familles × 4 natures × 6
niveaux — la source complète, celle que la note "A Half-Shift Criterion..."
cite en section 8) et reconstruit les 60 couches (union des 6 niveaux de
chaque couple famille/nature — chaque niveau couvre 24 cellules, chaque
teinte 8 par niveau, 48 au total par couche, conforme à (F4)).

Corrige un défaut de fonds_ecran_v1.json découvert le 2026-09-19 : les
quatre familles à une base (YANG, YANG-MUT, YIN, YIN-MUT) y étaient
rangées sous une seule clé "bases", avec une seule couche chacune — la
DIAGONALE seulement (couche "yang" de la famille {YANG}, "yin" de la
famille {YIN}, etc.), jamais les 12 couches hors diagonale (couche "yin"
de la famille {YANG}, par exemple). 12 des 60 couches manquaient, sans
qu'aucun contrôle ne le signale — d'où tools/check_fonds_ecran_completude.py,
ajouté à cette occasion. Conséquence directe : le critère d'unification
(voir tools/cube_edges.py) n'était satisfait que par 6 familles sur les 8
réelles — les deux manquantes, {YANG} et {YANG-MUT}, étaient invisibles
faute de leurs 4 natures complètes.

Validation faite avant d'écrire ce script : la reconstruction (union des 6
niveaux) reproduit EXACTEMENT, sans un seul bit de différence, les 44
couches (11 familles × 4 natures) déjà correctes de l'ancien fichier ; et
l'ancien "bases" correspond exactement à la diagonale des 16 couches
réelles des 4 familles à une base — confirmant à la fois la méthode de
reconstruction et le diagnostic du défaut.

Nommage des 15 familles (inchangé pour les 11 déjà correctes ; nouveau
pour les 4 familles à une base, qui n'existaient pas séparément avant) :
    bases:yang, bases:yang_mut, bases:yin, bases:yin_mut   (nouveau)
    par2:<base1>+<base2>                                    (6, inchangé)
    par3:sans_<base>                                        (4, inchangé)
    par4                                                    (1, inchangé)
Le préfixe "bases:" réutilise la catégorie déjà câblée côté galerie
(catLabel.bases, filtre "bases") — aucun changement requis côté HTML/JS
pour que les 4 familles y apparaissent.

'entries' (le corpus des triplets unifiés, voir tools/cube_edges.py) est
reconstruit sur toutes les 15 familles au lieu de 6 : 8 l'admettent
désormais (au lieu de 6), le corpus passe de 768 à 1024 triplets — mais
les grilles distinctes restent 512 et les pavages 256, les deux familles
retrouvées étant les jumelles de familles déjà présentes (voir le
contrôle dans build(), qui échoue si ces trois nombres ne sont pas
exactement 1024/512/256).

Usage :
    python tools/generate_fonds_ecran.py                  (écrit le fichier)
    python tools/generate_fonds_ecran.py --compare-only    (n'écrit rien,
        affiche l'écart avec le fichier actuel)
"""

import argparse
import json
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R360_PATH = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
OUT_JSON = os.path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json')

N = 12
HALF = N // 2
BASE_TOKENS = ['YANG-MUT', 'YANG', 'YIN-MUT', 'YIN']  # plus long d'abord, pour le segmenteur
LETTER = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}


def norm(tok):
    return tok.lower().replace('-', '_')


def segment(s):
    """'YANG-YANG-MUT' -> ['YANG', 'YANG-MUT'] : découpe en tokens de
    BASE_TOKENS par plus long préfixe, seule segmentation possible car
    aucun token n'est préfixe d'un autre sauf YANG/YANG-MUT (d'où l'ordre)."""
    out = []
    while s:
        for tok in BASE_TOKENS:
            if s == tok or s.startswith(tok + '-'):
                out.append(tok)
                s = s[len(tok) + 1:] if s.startswith(tok + '-') else ''
                break
        else:
            raise ValueError(f'segment impossible : {s!r}')
    return out


def build_grid(calques6):
    grid = [[None] * N for _ in range(N)]
    for c in calques6:
        for color in ('violet', 'magenta', 'orange'):
            for r, col in c[color + '_positions']:
                grid[r][col] = LETTER[color]
    if any(v is None for row in grid for v in row):
        raise SystemExit('couche incomplète après union des 6 niveaux')
    return grid


def familles_from_r360(r360):
    by_famille_teinte = {}
    for c in r360['calques']:
        by_famille_teinte.setdefault((c['famille'], c['teinte']), []).append(c)

    familles = {}
    for (fam_raw, teinte), calques in by_famille_teinte.items():
        if len(calques) != 6:
            raise SystemExit(f'{fam_raw}/{teinte} : {len(calques)} niveaux au lieu de 6')
        grid = build_grid(calques)

        if fam_raw == 'BASES':
            base = next(t for t in BASE_TOKENS
                        if teinte.startswith(t + '-') and teinte[len(t) + 1:] in BASE_TOKENS)
            key, nature = 'bases:' + norm(base), teinte[len(base) + 1:]
        elif fam_raw == 'YINYANG':
            key, nature = 'par4', teinte
        elif fam_raw.startswith('PAR2-'):
            toks = segment(fam_raw[len('PAR2-'):])
            if len(toks) != 2:
                raise SystemExit(f'PAR2 mal segmenté : {fam_raw!r} -> {toks}')
            key, nature = 'par2:' + '+'.join(norm(t) for t in toks), teinte
        elif fam_raw.startswith('PAR3-SANS-'):
            toks = segment(fam_raw[len('PAR3-SANS-'):])
            if len(toks) != 1:
                raise SystemExit(f'PAR3 mal segmenté : {fam_raw!r} -> {toks}')
            key, nature = 'par3:sans_' + norm(toks[0]), teinte
        else:
            raise SystemExit(f'famille referent_360 non reconnue : {fam_raw!r}')

        familles.setdefault(key, {})[norm(nature)] = grid

    if len(familles) != 15:
        raise SystemExit(f'{len(familles)} familles construites au lieu de 15')
    for key, natures in familles.items():
        if set(natures) != {'yang', 'yang_mut', 'yin', 'yin_mut'}:
            raise SystemExit(f'{key} : natures incomplètes {sorted(natures)}')
    return familles


# ── corpus unifié (voir tools/cube_edges.py, même définition) ──────────────

def demi_decalage(g):
    return [[g[(r - HALF) % N][(c - HALF) % N] for c in range(N)] for r in range(N)]


def couples_unifies(familles):
    out = []
    for f, teintes in familles.items():
        for a, b in (('yang', 'yang_mut'), ('yin', 'yin_mut')):
            if demi_decalage(teintes[a]) == teintes[b]:
                out.append((f, a, b))
    return out


def traits(n):
    bas, haut = n % 8, n // 8
    return [bas & 1, (bas >> 1) & 1, (bas >> 2) & 1, haut & 1, (haut >> 1) & 1, (haut >> 2) & 1]


def phi(n, A, B, layer_of):
    t = traits(n)
    return [[(A if t[layer_of[r][c] - 1] == 1 else B)[r][c] for c in range(N)] for r in range(N)]


def build_entries(familles, layer_of):
    couples = couples_unifies(familles)
    entries = [[f, a, b, n] for f, a, b in couples for n in range(64)]

    grilles = [tuple(tuple(r) for r in phi(n, familles[f][a], familles[f][b], layer_of))
               for f, a, b, n in entries]

    def pavage_key(g):
        gl = [list(r) for r in g]
        return frozenset((g, tuple(tuple(r) for r in demi_decalage(gl))))

    n_familles = len({f for f, _, _, _ in entries})
    n_grilles = len(set(grilles))
    n_pavages = len({pavage_key(g) for g in grilles})

    print(f"corpus unifié : {len(entries)} triplets, {n_familles} familles, "
          f"{n_grilles} grilles distinctes, {n_pavages} pavages distincts")
    if (len(entries), n_grilles, n_pavages) != (1024, 512, 256):
        raise SystemExit(
            f"attendu 1024 triplets / 512 grilles / 256 pavages, obtenu "
            f"{len(entries)} / {n_grilles} / {n_pavages}")

    return entries


def build():
    r360 = json.load(open(R360_PATH, encoding='utf-8'))
    familles = familles_from_r360(r360)
    entries = build_entries(familles, r360['layer_of'])
    return {
        'layerOf': r360['layer_of'],
        'families': familles,
        'entries': entries,
    }


def compare(new_doc, old_doc):
    old_fam = set(old_doc.get('families', {}))
    new_fam = set(new_doc['families'])
    print(f"familles : {len(old_fam)} -> {len(new_fam)} "
          f"(nouvelles : {sorted(new_fam - old_fam)})")
    print(f"entries  : {len(old_doc.get('entries', []))} -> {len(new_doc['entries'])}")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--compare-only', action='store_true',
                   help="n'écrit rien, compare seulement à data/fonds_ecran_v1.json")
    a = p.parse_args()

    new_doc = build()

    if os.path.exists(OUT_JSON):
        old_doc = json.load(open(OUT_JSON, encoding='utf-8'))
        compare(new_doc, old_doc)

    if a.compare_only:
        print("\n(--compare-only : rien écrit)")
        return

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(new_doc, f, ensure_ascii=False, separators=(',', ':'))
    print(f"\n{OUT_JSON} écrit.")


if __name__ == '__main__':
    main()
