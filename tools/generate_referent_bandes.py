#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_referent_bandes.py — Générateur de data/referent_bandes_v1.json

VUE GÉNÉRÉE de data/referent_bicolore_v1.json — ne dessine plus les masques
indépendamment. Historique : jusqu'au 2026-09-19, ce fichier était produit à
part, depuis 15 SVG dessinés séparément (alors rangés sous
data/referent_bandes_src/, supprimé depuis — voir plus bas). Les deux dessins
ont divergé sur les 15 gammes pendant plusieurs semaines sans que rien ne le
signale — voir tools/check_referent_bandes_sync.py, le garde-fou ajouté à
cette occasion. Une source unique (le bicolore, déjà généré par combinaison
de 4 bases, tools/generate_referent_bicolore.py) rend cette divergence
structurellement impossible : ce script ne fait plus que regarder dans le
bicolore et retraduire son vocabulaire.

CORRECTION (2026-09-19, après dépôt) : data/referent_bandes_src/ n'était pas
« les 15 SVG ORIGINES » comme l'affirmait ce fichier — c'était une copie de la
géométrie T1 (1152 polygones, 2 tons), sous un nom qui devrait désigner un
troisième tour distinct (T3, des bandes — lignes parallèles, pas des figures
emboîtées autour d'un centre). Le vrai T1 est maintenant versionné à
data/ORIGINES/, le vrai T2 à data/ORIGINES T2/, et la vraie source T3 à
data/referent_bandes_t3_src/ (576 polygones, 2 tons, fournie directement —
non intégrée pour l'instant, aucun script ne la lit encore). L'ancien
data/referent_bandes_src/ a été supprimé : ORIGINES/ porte déjà cette
géométrie sous son vrai nom, le garder en double n'apportait rien.

Ce que ce fichier garde en propre, que le bicolore n'a pas :
  - le vocabulaire des 15 gammes ("yang pur yin mut", "yin yang fix", ...),
    vs les noms de combinaison du bicolore ("YIN-MUT+YANG+YANG-MUT") ;
  - la couche acoustique (f_hz, note, cents, k_pic) — NON FIABLE pour
    l'instant (voir echelle.avertissement dans le JSON produit), en attente
    d'une méthode de calcul établie. `categorie` n'est PAS dans ce cas :
    elle se déduit entièrement du nombre de bases de la combinaison
    (1..4 bases), donc dérivée ici, pas stockée en dur.

Table de correspondance nom -> (combinaison bicolore, polarité)
-----------------------------------------------------------------
NAME_TABLE ci-dessous a deux parties :
  - la combinaison (ex. "YIN-MUT+YANG+YANG-MUT") est RE-DÉRIVÉE du nom par
    combination_of() (règle ci-dessous) et vérifiée contre la table à
    chaque génération (build() lève une erreur si elles divergent) — la
    table n'est donc jamais la seule source de cette partie-là.
  - la polarité (le masque 'yang' de la gamme est-il le champ 'yang' ou
    'yin' de la famille bicolore ?) N'A PAS de forme close connue : deux
    gammes de même taille et composition proche (ex. "yang pur" et
    "yang yin mut", toutes deux à 2 bases) peuvent avoir des polarités
    opposées. Cette moitié de la table reste donc une donnée, établie une
    fois par recoupement bit à bit exact contre les 15 SVG T1
    (data/ORIGINES/ — voir la correction plus haut ; ce script ne les lit
    plus, le recoupement a été fait une fois, pas à chaque génération).

Règle de dérivation de la combinaison (axe, qualificatif) -> bases bicolore :
    (yin,  None) -> {YIN}              (yang, None) -> {YANG}
    (yin,  'mut') -> {YIN-MUT}          (yang, 'mut') -> {YANG-MUT}
    (yin,  'pur') -> {YIN, YIN-MUT}     (yang, 'pur') -> {YANG, YANG-MUT}
"pur" désigne l'union des deux variantes d'un axe, pas la variante non
mutée seule — confirmé par le recoupement (ex. "yin pur" = YIN+YIN-MUT).
Un nom à deux paires (ex. "yang pur yin mut") est l'union des deux
expansions. Les 15 noms couvrent exactement les 15 sous-ensembles non
vides de 4 bases (bijection complète avec les 15 familles bicolore).

Usage :
    python tools/generate_referent_bandes.py                  (écrit le fichier)
    python tools/generate_referent_bandes.py --compare-only    (n'écrit rien,
        affiche l'écart bit à bit avec le fichier actuel)
"""

import argparse
import json
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BICOLORE_JSON = os.path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json')
OUT_JSON = os.path.join(REPO_ROOT, 'data', 'referent_bandes_v1.json')

BASES_ORDER = ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']

AXIS_EXPANSION = {
    ('yin', None): ('YIN',), ('yin', 'mut'): ('YIN-MUT',), ('yin', 'pur'): ('YIN', 'YIN-MUT'),
    ('yang', None): ('YANG',), ('yang', 'mut'): ('YANG-MUT',), ('yang', 'pur'): ('YANG', 'YANG-MUT'),
}

# nom de gamme -> (combinaison bicolore attendue, polarité : quel champ de
# cette famille bicolore porte le masque 'yang' de la gamme)
NAME_TABLE = {
    'yang pur yin pur':  ('YIN+YIN-MUT+YANG+YANG-MUT', 'yang'),
    'yang mut':          ('YANG-MUT', 'yang'),
    'yang':              ('YANG', 'yang'),
    'yin mut':           ('YIN-MUT', 'yang'),
    'yin':               ('YIN', 'yang'),
    'yang mut yin mut':  ('YIN-MUT+YANG-MUT', 'yang'),
    'yang pur':          ('YANG+YANG-MUT', 'yang'),
    'yang yin mut':      ('YIN-MUT+YANG', 'yin'),
    'yin pur':           ('YIN+YIN-MUT', 'yin'),
    'yin yang fix':      ('YIN+YANG', 'yin'),
    'yin yang mut':      ('YIN+YANG-MUT', 'yin'),
    'yang pur yin mut':  ('YIN-MUT+YANG+YANG-MUT', 'yin'),
    'yang pur yin':      ('YIN+YANG+YANG-MUT', 'yin'),
    'yin pur yang mut':  ('YIN+YIN-MUT+YANG-MUT', 'yin'),
    'yin pur yang':      ('YIN+YIN-MUT+YANG', 'yang'),
}

# Couche acoustique : NON FIABLE (voir docstring et echelle.avertissement
# ci-dessous) — préservée telle quelle, identique à ce qui tourne en
# production, en attente d'une méthode de calcul établie sur la bonne
# géométrie. Ne pas recalculer sans revoir ce commentaire.
ACOUSTIQUE = {
    'yang pur yin pur':  {'f_hz': 440.0, 'note': 'la4',  'cents': 1200, 'k_pic': 10.0},
    'yang mut':          {'f_hz': 262.1, 'note': 'do4',  'cents': 303,  'k_pic': 7.81},
    'yang':              {'f_hz': 262.1, 'note': 'do4',  'cents': 303,  'k_pic': 7.81},
    'yin mut':           {'f_hz': 220.0, 'note': 'la3',  'cents': 0,    'k_pic': 7.07},
    'yin':               {'f_hz': 220.0, 'note': 'la3',  'cents': 0,    'k_pic': 7.07},
    'yang mut yin mut':  {'f_hz': 278.2, 'note': 'do#4', 'cents': 406,  'k_pic': 8.06},
    'yang pur':          {'f_hz': 227.4, 'note': 'la#3', 'cents': 57,   'k_pic': 7.21},
    'yang yin mut':      {'f_hz': 278.2, 'note': 'do#4', 'cents': 406,  'k_pic': 8.06},
    'yin pur':           {'f_hz': 440.0, 'note': 'la4',  'cents': 1200, 'k_pic': 10.0},
    'yin yang fix':      {'f_hz': 365.8, 'note': 'fa#4', 'cents': 880,  'k_pic': 9.22},
    'yin yang mut':      {'f_hz': 365.8, 'note': 'fa#4', 'cents': 880,  'k_pic': 9.22},
    'yang pur yin mut':  {'f_hz': 316.1, 'note': 'ré#4', 'cents': 627,  'k_pic': 8.6},
    'yang pur yin':      {'f_hz': 316.1, 'note': 'ré#4', 'cents': 627,  'k_pic': 8.6},
    'yin pur yang mut':  {'f_hz': 384.8, 'note': 'sol4', 'cents': 968,  'k_pic': 9.43},
    'yin pur yang':      {'f_hz': 384.8, 'note': 'sol4', 'cents': 968,  'k_pic': 9.43},
}

ECHELLE = {
    'methode': 'frequence spatiale dominante (FFT 2D), etalee sur une octave',
    'reference': 'k=7.07 -> 220 Hz (la3), k=10.00 -> 440 Hz (la4)',
    'fiable': False,
    'provenance': 'inconnue',
    'avertissement': (
        "k_pic/f_hz/note/cents datent des MASQUES INCORRECTS remplaces le "
        "2026-09-19 (voir tools/generate_referent_bandes.py) et ne decrivent "
        "pas la geometrie des masques yang/yin actuels. Ne pas reutiliser "
        "sans recalcul. Preuve que la methode d'origine est inconnue (pas "
        "une FFT 2D sur grille 12x12) : 4 des 8 valeurs de k_pic (k^2=74, "
        "85, 89, 100) depassent le maximum possible d'une telle FFT, ou les "
        "indices de frequence centres vont de -6 a 6 et k^2 <= 72."
    ),
}


def parse_gamme_name(name):
    """'yang pur yin mut' -> frozenset{('yang','pur'), ('yin','mut')} ; le
    qualificatif pur/mut/fix s'attache à l'axe qui le précède immédiatement."""
    tokens = name.lower().split()
    pairs, i = [], 0
    while i < len(tokens):
        tok = tokens[i]
        if tok in ('yang', 'yin'):
            i += 1
            qual = None
            if i < len(tokens) and tokens[i] in ('pur', 'mut'):
                qual = tokens[i]
                i += 1
            pairs.append((tok, qual))
        elif tok == 'fix':
            i += 1
        else:
            raise ValueError(f'mot inattendu {tok!r} dans {name!r}')
    return frozenset(pairs)


def combination_of(name):
    """Nom de gamme -> nom de combinaison bicolore ("YIN+YANG-MUT", ordre
    BASES_ORDER), par expansion et union (voir docstring du module)."""
    bases = set()
    for pair in parse_gamme_name(name):
        bases.update(AXIS_EXPANSION[pair])
    return '+'.join(b for b in BASES_ORDER if b in bases)


def build():
    bicolore = json.load(open(BICOLORE_JSON, encoding='utf-8'))

    if set(NAME_TABLE) != set(ACOUSTIQUE):
        raise SystemExit("NAME_TABLE et ACOUSTIQUE ne portent pas les mêmes 15 noms")

    used_families = {}
    gammes_out = {}
    for name, (family, polarity) in NAME_TABLE.items():
        derived = combination_of(name)
        if derived != family:
            raise SystemExit(f"{name!r} : combinaison dérivée du nom ({derived!r}) "
                              f"!= combinaison déclarée dans NAME_TABLE ({family!r})")
        if family in used_families:
            raise SystemExit(f"famille bicolore {family!r} utilisée deux fois : "
                              f"{used_families[family]!r} et {name!r} — la bijection est rompue")
        used_families[family] = name
        if family not in bicolore['familles']:
            raise SystemExit(f"{name!r} : famille bicolore {family!r} introuvable dans "
                              f"{BICOLORE_JSON}")

        fam = bicolore['familles'][family]
        other = 'yin' if polarity == 'yang' else 'yang'
        n_bases = family.count('+') + 1
        categorie = f"{n_bases} base" if n_bases == 1 else f"{n_bases} bases"

        gammes_out[name] = {
            'categorie': categorie,
            'yang': fam[polarity],
            'yin': fam[other],
            **ACOUSTIQUE[name],
        }

    if len(used_families) != 15:
        raise SystemExit(f"bijection incomplète : {len(used_families)}/15 familles bicolore couvertes")

    doc = {
        'format': 'gammes-bicolore-v1',
        'decoupe': bicolore['decoupe'],
        'grid': bicolore['grid'],
        'parts': bicolore['parts'],
        'per_cell': bicolore['per_cell'],
        'per_layer': bicolore['per_layer'],
        'source': 'vue generee de data/referent_bicolore_v1.json — voir tools/generate_referent_bandes.py',
        'echelle': ECHELLE,
        'layers': bicolore['layers'],
        'gammes': gammes_out,
    }
    return doc


def hex_to_bits(h):
    return ''.join(format(int(c, 16), '04b') for c in h)


def compare(new_doc, old_doc):
    print(f"{'gamme':20s} {'bits diff (yang)':>18s} {'identique ?':>12s}")
    n_diff, total_diff = 0, 0
    for name in old_doc['gammes']:
        if name not in new_doc['gammes']:
            print(f"{name:20s} {'absent du nouveau':>18s}")
            continue
        a = hex_to_bits(old_doc['gammes'][name]['yang'])
        b = hex_to_bits(new_doc['gammes'][name]['yang'])
        diff = sum(1 for x, y in zip(a, b) if x != y)
        total_diff += diff
        n_diff += diff > 0
        print(f"{name:20s} {diff:18d} {'oui' if diff == 0 else 'non':>12s}")
    print(f"\ngammes différentes : {n_diff}/15")
    print(f"total de bits différents : {total_diff}/{15*1152}")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--compare-only', action='store_true',
                   help="n'écrit rien, compare seulement à data/referent_bandes_v1.json")
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
