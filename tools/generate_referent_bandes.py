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
  - `categorie`, dérivée ici (pas stockée en dur) du nombre de bases de la
    combinaison (1..4 bases).

SÉPARATION DES RESPONSABILITÉS (2026-09-21) : ce script ne touche plus à la
couche acoustique (k_pic/k2/echelles, sous 'generations' dans chaque gamme,
et le champ top-level 'echelle'). Il y a eu ici, jusqu'à cette date, une
table ACOUSTIQUE et un dict ECHELLE codés en dur, portant encore les valeurs
fiable=False d'avant le 2026-09-19 (échelle 220/440 Hz sur un k_pic
7.07-10, provenance inconnue) — alors même que le fichier réellement en
production avait déjà été mis à jour par un autre chemin (mesure directe,
voir tools/measure_k_pic.py) avec une échelle et des k_pic différents.
Personne ne l'avait remarqué : relancer ce script sans --compare-only
aurait silencieusement écrasé les bonnes valeurs par les fausses. C'est
la même classe d'erreur que la confusion T1/T3 sur les sources SVG — deux
générateurs qui écrivent le même champ sans se coordonner. build() lit
maintenant le fichier existant et RECOPIE tel quel tout ce qui est sous
'generations' (par gamme) et 'echelle' (top-level) : ce script ne les
écrit jamais, seulement tools/measure_k_pic.py --apply le fait.

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

    # Couche acoustique existante (si le fichier a déjà été écrit par
    # tools/measure_k_pic.py --apply) : recopiée telle quelle, jamais
    # recalculée ici — voir la note de séparation des responsabilités
    # dans la docstring du module.
    old_doc = json.load(open(OUT_JSON, encoding='utf-8')) if os.path.exists(OUT_JSON) else {}
    old_gammes = old_doc.get('gammes', {})
    old_echelle = old_doc.get('echelle')

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
        }
        if name in old_gammes and 'generations' in old_gammes[name]:
            gammes_out[name]['generations'] = old_gammes[name]['generations']

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
        'layers': bicolore['layers'],
        'gammes': gammes_out,
    }
    if old_echelle is not None:
        doc['echelle'] = old_echelle
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
