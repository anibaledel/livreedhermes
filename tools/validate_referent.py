#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
validate_referent.py — Validateur générique de référent (format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Format v3 figé, contenu paramétrable : tout référent (le 360 de l'auteur,
le 256 du livre, ou un référent personnalisé futur) doit satisfaire ces
règles GÉNÉRIQUES pour être utilisable par la bibliothèque, indépendamment
de son contenu esthétique :

  1. Un seul niveau (LAYER_OF) par calque -- si le référent en déclare un
     (grid_size=12, référents à niveaux comme le 360). Sans layer_of
     (référent sans notion de niveau, ex. le 6×6), ce contrôle est ignoré.
  2. Cases distinctes -- aucune position (row,col) ne doit apparaître deux
     fois dans un même calque/forme, toutes couleurs confondues (une
     position ne peut porter qu'UNE couleur).
  3. Couleurs du jeu déclaré -- toute position doit être rangée sous une
     couleur listée dans `colors`.
  4. Position stégano garantie (règle révisée, 2026-09-12) : SI le référent
     a une notion de niveau (layer_of présent, calques annotés 'niveau') --
     à CHAQUE niveau distinct, au moins UN calque de ce niveau a des
     positions stégano (l'union des couleurs de `stegano_colors` n'est pas
     vide pour AU MOINS un calque du niveau -- un calque isolé PEUT être
     vide, ce n'est plus une erreur). SINON (référent sans niveau, ex. 6×6)
     : au moins UNE forme du référent entier a des positions stégano.

Les contrôles propres au référent PAR DÉFAUT de cette bibliothèque
(48/48/48 par superposition, règles de couleur YIN/YANG et MUT) sont
INFORMATIFS ici -- rapportés si le référent a la forme attendue (calques
groupés par famille/teinte, 6 niveaux), jamais requis pour un référent
quelconque, qui peut légitimement ne pas les respecter.
"""
import json
import sys
from collections import defaultdict


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def _calque_positions_by_color(calque, colors):
    """Retourne {couleur: set of (row,col)} pour un calque, en devinant le
    schéma de stockage : soit '<couleur>_positions' (référent_360), soit un
    schéma à déterminer pour d'autres formats (ex. référent_256 : 'blue'/
    'orange' directement comme clés)."""
    out = {}
    for color in colors:
        key = f'{color}_positions'
        if key in calque:
            out[color] = set(tuple(p) for p in calque[key])
        elif color in calque:
            out[color] = set(tuple(p) for p in calque[color])
    return out


def _items_key(doc):
    """'calques' (référent 360, à niveaux) ou 'forms' (référent 6×6, sans
    niveau) -- le premier trouvé fait foi."""
    for key in ('calques', 'forms'):
        if key in doc:
            return key
    return None


def _item_label(item, idx):
    if 'niveau' in item:
        return f"{item.get('famille','?')}/{item.get('teinte','?')}/{item['niveau']}"
    return f"forme #{item.get('id', idx)}"


def validate(doc):
    """Retourne (errors, warnings, info) -- errors non vide = référent
    INVALIDE, refusé par la bibliothèque."""
    errors = []
    warnings = []
    info = {}

    for field in ('format_version', 'colors', 'stegano_colors'):
        if field not in doc:
            errors.append(f"champ requis absent : '{field}'")
    items_key = _items_key(doc)
    if items_key is None:
        errors.append("champ requis absent : 'calques' ou 'forms'")
    if errors:
        return errors, warnings, info

    colors = doc['colors']
    stegano_colors = doc['stegano_colors']
    if not set(stegano_colors) <= set(colors):
        errors.append(f"stegano_colors {stegano_colors} contient une couleur hors de colors {colors}")

    layer_of = doc.get('layer_of')
    items = doc[items_key]
    has_niveau = layer_of is not None and all('niveau' in it for it in items)

    n_no_niveau_violation = 0
    n_duplicate_cells = 0
    n_color_hors_jeu = 0
    stegano_count_by_niveau = defaultdict(int)   # niveau -> nb de calques AVEC stegano
    any_stegano_anywhere = False

    for idx, item in enumerate(items):
        by_color = _calque_positions_by_color(item, colors)
        label = _item_label(item, idx)

        # 3. couleurs du jeu déclaré
        declared_keys = set(k for k in item if k.endswith('_positions')) | \
                        (set(item.keys()) & set(colors))
        undeclared_color_keys = [k for k in declared_keys
                                  if k.replace('_positions', '') not in colors]
        if undeclared_color_keys:
            n_color_hors_jeu += 1
            errors.append(f"{label} : clé(s) de couleur hors du jeu déclaré : {undeclared_color_keys}")

        # 2. cases distinctes (toutes couleurs confondues, dans le même item)
        seen = defaultdict(list)
        for color, positions in by_color.items():
            for pos in positions:
                seen[pos].append(color)
        dupes = {pos: cs for pos, cs in seen.items() if len(cs) > 1}
        if dupes:
            n_duplicate_cells += 1
            errors.append(f"{label} : case(s) répétée(s) sous plusieurs couleurs : {dupes}")

        # 1. un seul niveau (si layer_of déclaré et item annonce un niveau)
        if has_niveau:
            niveau = item['niveau']
            bad_layers = set()
            for color, positions in by_color.items():
                for (r, c) in positions:
                    if 0 <= r < len(layer_of) and 0 <= c < len(layer_of[r]):
                        bad_layers.add(layer_of[r][c])
            if bad_layers and bad_layers != {niveau}:
                n_no_niveau_violation += 1
                errors.append(f"{label} : cases hors du niveau {niveau} "
                               f"(niveaux trouvés : {sorted(bad_layers)})")

        # 4. position stégano garantie (regle revisee)
        n_stegano = sum(len(by_color.get(c, ())) for c in stegano_colors)
        if n_stegano > 0:
            any_stegano_anywhere = True
            if has_niveau:
                stegano_count_by_niveau[item['niveau']] += 1
        elif not has_niveau:
            warnings.append(f"{label} : aucune position stégano ({stegano_colors})")

    info['n_items'] = len(items)

    if has_niveau:
        all_niveaux = sorted(set(it['niveau'] for it in items))
        niveaux_sans_stegano = [n for n in all_niveaux if stegano_count_by_niveau.get(n, 0) == 0]
        info['niveaux_sans_aucun_calque_stegano'] = niveaux_sans_stegano
        if niveaux_sans_stegano:
            errors.append(f"niveau(x) {niveaux_sans_stegano} : AUCUN calque de ce niveau n'a de "
                           f"position stégano ({stegano_colors}) -- règle 4 violée.")
    else:
        info['au_moins_une_forme_stegano'] = any_stegano_anywhere
        if not any_stegano_anywhere:
            errors.append(f"aucune forme du référent n'a de position stégano ({stegano_colors}) "
                           f"-- règle 4 violée.")

    # ── Contrôles INFORMATIFS propres au référent 360 PAR DÉFAUT (48/48/48,
    # règles de couleur) -- seulement si le référent a la forme attendue
    # (calques groupés par (famille,teinte), 6 niveaux, 3 couleurs V/M/O).
    if colors == ['violet', 'magenta', 'orange'] and has_niveau:
        by_identity = defaultdict(lambda: defaultdict(int))
        for item in items:
            fam, teinte = item.get('famille'), item.get('teinte')
            by_color = _calque_positions_by_color(item, colors)
            for color in colors:
                by_identity[(fam, teinte)][color] += len(by_color.get(color, ()))
        exceptions_48 = [k for k, v in by_identity.items()
                          if not (v['violet'] == 48 and v['magenta'] == 48 and v['orange'] == 48)]
        info['invariant_48_48_48_exceptions'] = len(exceptions_48)
        info['invariant_48_48_48_ok'] = (len(exceptions_48) == 0)
        if exceptions_48:
            warnings.append(f"(informatif) {len(exceptions_48)} identité(s) hors 48/48/48 : "
                             f"{exceptions_48[:5]}{'...' if len(exceptions_48) > 5 else ''}")

    # ── Contrôle INFORMATIF propre aux référents 6×6 PAR DÉFAUT (6/6/12/12)
    if set(colors) == {'blue', 'orange', 'green', 'yellow'} and not has_niveau:
        expected = {'blue': 6, 'orange': 6, 'green': 12, 'yellow': 12}
        bad = 0
        for item in items:
            by_color = _calque_positions_by_color(item, colors)
            counts = {c: len(by_color.get(c, ())) for c in colors}
            if counts != expected:
                bad += 1
        info['composition_6_6_12_12_exceptions'] = bad
        info['composition_6_6_12_12_ok'] = (bad == 0)
        if bad:
            warnings.append(f"(informatif) {bad} forme(s) hors de la composition 6/6/12/12 attendue")

    return errors, warnings, info


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'data/referent_360_v3.json'
    doc = load(path)
    errors, warnings, info = validate(doc)

    print(f"=== Validation de {path} ===")
    print(f"referent_id : {doc.get('referent_id', '(absent)')}")
    print(f"format_version : {doc.get('format_version', '(absent)')}")
    print()
    print(f"info : {info}")
    print()
    if warnings:
        print(f"=== {len(warnings)} avertissement(s) ===")
        for w in warnings[:20]:
            print(" -", w)
        if len(warnings) > 20:
            print(f"   ... et {len(warnings) - 20} de plus")
    print()
    if errors:
        print(f"=== {len(errors)} ERREUR(S) -- référent INVALIDE ===")
        for e in errors[:20]:
            print(" -", e)
        if len(errors) > 20:
            print(f"   ... et {len(errors) - 20} de plus")
        sys.exit(1)
    else:
        print("Référent VALIDE (aucune erreur).")
