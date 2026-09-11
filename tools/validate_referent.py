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
     (référent sans notion de niveau, ex. le 256), ce contrôle est ignoré.
  2. Cases distinctes -- aucune position (row,col) ne doit apparaître deux
     fois dans un même calque, toutes couleurs confondues (une position ne
     peut porter qu'UNE couleur).
  3. Couleurs du jeu déclaré -- toute position doit être rangée sous une
     couleur listée dans `colors`.
  4. Au moins une position stégano par calque -- l'union des positions
     listées sous les couleurs de `stegano_colors` ne doit jamais être vide
     pour un calque donné.

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


def validate(doc):
    """Retourne (errors, warnings, info) -- errors non vide = référent
    INVALIDE, refusé par la bibliothèque."""
    errors = []
    warnings = []
    info = {}

    for field in ('format_version', 'colors', 'stegano_colors', 'calques'):
        if field not in doc:
            errors.append(f"champ requis absent : '{field}'")
    if errors:
        return errors, warnings, info

    colors = doc['colors']
    stegano_colors = doc['stegano_colors']
    if not set(stegano_colors) <= set(colors):
        errors.append(f"stegano_colors {stegano_colors} contient une couleur hors de colors {colors}")

    layer_of = doc.get('layer_of')
    calques = doc['calques']

    n_no_niveau_violation = 0
    n_duplicate_cells = 0
    n_color_hors_jeu = 0
    n_no_stegano_position = 0

    for idx, calque in enumerate(calques):
        by_color = _calque_positions_by_color(calque, colors)

        # 3. couleurs du jeu déclaré
        declared_keys = set(k for k in calque if k.endswith('_positions')) | \
                        (set(calque.keys()) & set(colors))
        undeclared_color_keys = [k for k in declared_keys
                                  if k.replace('_positions', '') not in colors]
        if undeclared_color_keys:
            n_color_hors_jeu += 1
            errors.append(f"calque #{idx} ({calque.get('famille','?')}/{calque.get('teinte','?')}"
                           f"/{calque.get('niveau','?')}) : clé(s) de couleur hors du jeu déclaré : "
                           f"{undeclared_color_keys}")

        # 2. cases distinctes (toutes couleurs confondues, dans le même calque)
        seen = defaultdict(list)
        for color, positions in by_color.items():
            for pos in positions:
                seen[pos].append(color)
        dupes = {pos: cs for pos, cs in seen.items() if len(cs) > 1}
        if dupes:
            n_duplicate_cells += 1
            errors.append(f"calque #{idx} ({calque.get('famille','?')}/{calque.get('teinte','?')}"
                           f"/{calque.get('niveau','?')}) : case(s) répétée(s) sous plusieurs "
                           f"couleurs : {dupes}")

        # 1. un seul niveau (si layer_of déclaré et calque annonce un niveau)
        if layer_of is not None and 'niveau' in calque:
            niveau = calque['niveau']
            bad_layers = set()
            for color, positions in by_color.items():
                for (r, c) in positions:
                    if 0 <= r < len(layer_of) and 0 <= c < len(layer_of[r]):
                        bad_layers.add(layer_of[r][c])
            if bad_layers and bad_layers != {niveau}:
                n_no_niveau_violation += 1
                errors.append(f"calque #{idx} ({calque.get('famille','?')}/{calque.get('teinte','?')}"
                               f"/{calque.get('niveau','?')}) : cases hors du niveau {niveau} "
                               f"(niveaux trouvés : {sorted(bad_layers)})")

        # 4. au moins une position stégano
        n_stegano = sum(len(by_color.get(c, ())) for c in stegano_colors)
        if n_stegano == 0:
            n_no_stegano_position += 1
            warnings.append(f"calque #{idx} ({calque.get('famille','?')}/{calque.get('teinte','?')}"
                             f"/{calque.get('niveau','?')}) : AUCUNE position stégano "
                             f"(couleurs {stegano_colors})")

    info['n_calques'] = len(calques)
    info['n_calques_sans_position_stegano'] = n_no_stegano_position
    if n_no_stegano_position:
        errors.append(f"{n_no_stegano_position} calque(s) sans AUCUNE position stégano "
                       f"({stegano_colors}) -- règle 4 violée. Voir avertissements pour le détail.")

    # ── Contrôles INFORMATIFS propres au référent par défaut (48/48/48,
    # règles de couleur) -- seulement si le référent a la forme attendue
    # (calques groupés par (famille,teinte), 6 niveaux, 3 couleurs V/M/O).
    if colors == ['violet', 'magenta', 'orange'] and layer_of is not None:
        by_identity = defaultdict(lambda: defaultdict(int))
        for calque in calques:
            fam, teinte, niv = calque.get('famille'), calque.get('teinte'), calque.get('niveau')
            by_color = _calque_positions_by_color(calque, colors)
            for color in colors:
                by_identity[(fam, teinte)][color] += len(by_color.get(color, ()))
        exceptions_48 = [k for k, v in by_identity.items()
                          if not (v['violet'] == 48 and v['magenta'] == 48 and v['orange'] == 48)]
        info['invariant_48_48_48_exceptions'] = len(exceptions_48)
        info['invariant_48_48_48_ok'] = (len(exceptions_48) == 0)
        if exceptions_48:
            warnings.append(f"(informatif) {len(exceptions_48)} identité(s) hors 48/48/48 : "
                             f"{exceptions_48[:5]}{'...' if len(exceptions_48) > 5 else ''}")

    return errors, warnings, info


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'data/referent_360_v3.json'
    doc = load(path)
    errors, warnings, info = validate(doc)

    print(f"=== Validation de {path} ===")
    print(f"referent_id : {doc.get('referent_id', '(absent)')}")
    print(f"format_version : {doc.get('format_version', '(absent)')}")
    print(f"c_pub : {doc.get('c_pub')}")
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
        if doc.get('c_pub') is None:
            print("ATTENTION : c_pub absent -- la bibliothèque refusera ce référent tant que "
                  "tools/calibrate_referent.py n'a pas été exécuté.")
