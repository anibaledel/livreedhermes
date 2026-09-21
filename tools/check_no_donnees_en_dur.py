#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
check_no_donnees_en_dur.py — Garde-fou : aucun script de tools/ ne porte de
table de données codée en dur (mesures, fréquences, comptes) parallèle à ce
qui existe déjà dans data/. Appelé par
.github/workflows/check-no-donnees-en-dur.yml sur chaque push/PR.

Pourquoi ce garde-fou existe : jusqu'au 2026-09-21, tools/generate_referent_bandes.py
portait une table ACOUSTIQUE codée en dur (f_hz/note/cents/k_pic pour les 15
gammes) et un dict ECHELLE (fiable=False, échelle 220/440 Hz) — les valeurs
NON FIABLES d'avant la mesure du 2026-09-19, jamais mises à jour depuis, alors
que data/referent_bandes_v1.json portait déjà les bonnes, écrites par un autre
chemin (tools/measure_k_pic.py). Relancer generate_referent_bandes.py sans
--compare-only aurait silencieusement écrasé les bonnes valeurs par les
fausses. C'est le même mécanisme qui avait fait diverger
data/referent_bandes_v1.json et data/referent_bicolore_v1.json avant le
passage à une vue générée (tools/check_referent_bandes_sync.py) : une copie
de la donnée dans le code, oubliée, qui l'emporte au prochain passage.

Ce que ce script contrôle
--------------------------
Pour chaque tools/*.py : toute affectation de module (nom en MAJUSCULES, la
convention déjà en usage pour les constantes de ce dépôt — ACOUSTIQUE,
NAME_TABLE, BASES_ORDER...) dont la valeur est un littéral dict ou list/tuple
d'au moins SEUIL_ENTREES entrées, où au moins SEUIL_NUMERIQUE de leurs valeurs
terminales (récursivement, y compris dans des dicts imbriqués) sont des
nombres (int/float), est signalée. Un nombre de mesure (f_hz, k_pic, un
compte de grilles ou de familles) n'a normalement pas sa place dans un
littéral Python de tools/ : soit il est calculé, soit il est lu depuis
data/. Les tables de NOMS ou de CHEMINS (chaînes, tuples de chaînes — voir
NAME_TABLE, GAMME_FILES) ne sont pas concernées : ce contrôle ne regarde que
la part numérique des valeurs terminales.

Une table légitime (rare — ce garde-fou doit rester bruyant, pas juste
verbeux) s'exempte en l'ajoutant à ALLOWLIST ci-dessous, avec la raison :
l'exemption est alors visible dans le diff qui l'introduit, pas cachée dans
un commentaire local facile à ajouter sans y penser.

Usage :
    python tools/check_no_donnees_en_dur.py
"""

import ast
import glob
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)

SEUIL_ENTREES = 5      # en dessous, une table de constantes structurelles est plausible
SEUIL_NUMERIQUE = 0.5  # fraction des valeurs terminales qui doivent être numériques

# (fichier relatif à tools/, nom de variable) -> raison de l'exemption.
# Toute entrée ici doit être justifiée en revue de code, pas ajoutée pour
# faire taire le contrôle.
ALLOWLIST = {
    ('cube_edges.py', 'FACES'): (
        "géométrie du cube (origine + deux vecteurs d'arête par face, coordonnées "
        "12x12x12) — une définition, pas une mesure ; rien dans data/ ne la porte. "
        "Dupliquée à l'identique dans generate_table_pavage.py et spectre_et_cube.py : "
        "une duplication de CODE entre scripts, pas de données entre code et data/ — "
        "hors du périmètre de CE garde-fou. La dérive entre les trois copies est "
        "couverte séparément par tools/check_faces_geometrie_sync.py."),
    ('generate_table_pavage.py', 'FACES'): "même géométrie que ('cube_edges.py', 'FACES') ci-dessus, voir cette entrée.",
    ('spectre_et_cube.py', 'FACES'): "même géométrie que ('cube_edges.py', 'FACES') ci-dessus, voir cette entrée.",
    ('generate_referent_360.py', 'LAYER_OF'): (
        "la matrice des niveaux ELLE-MÊME — la définition d'origine, pas une copie. "
        "Explicitement documentée comme source unique ailleurs (voir "
        "generate_referent_bicolore.py : 'from generate_referent_360 import LAYER_OF "
        "— source unique, non dupliquée')."),
    ('generate_referent_360.py', 'XS'): (
        "coordonnées pixel mesurées une fois sur le SVG source brut (0 KRE-360/), pour "
        "localiser les cellules de la grille lors du parsing — une calibration, pas une "
        "mesure du contenu. Resterait à vérifier par recoupement contre le fichier "
        "source si ce script est repris (même prudence que le bug du centroïde de "
        "measure_k_pic.py), mais hors du périmètre de cette revue."),
    ('generate_referent_360.py', 'YS'): "même calibration que ('generate_referent_360.py', 'XS') ci-dessus, voir cette entrée.",
    ('verif_carre_magique.py', 'CARRE_REFERENCE'): (
        "l'exemple de référence ('carré 666') vérifié à la main en conversation, "
        "documenté comme tel dans le docstring du module — un exemple d'usage sous "
        "if __name__ == '__main__', jamais lu par un pipeline de génération."),
    ('verif_protocole.py', 'CARRE_REFERENCE'): (
        "même raison que ('verif_carre_magique.py', 'CARRE_REFERENCE') ci-dessus : "
        "l'exemple de référence ('carré 666', p.040 du livre), utilisé uniquement "
        "sous if __name__ == '__main__' pour une sanity-check optionnelle — la "
        "vérification qui compte (256/256 carrés magiques) porte sur "
        "data/referent_256_v3.json, jamais sur cette table."),
    ('verif_protocole.py', 'COULEURS_REFERENCE'): "même raison que ('verif_protocole.py', 'CARRE_REFERENCE') ci-dessus, voir cette entrée.",
    ('derive_bicolore_homothety.py', '_EDGE'): (
        "géométrie du triangle-éventail d'une case unitaire (8 points d'arête, sens "
        "horaire depuis le haut) — une définition, pas une mesure ; rien dans data/ ne "
        "la porte. Même géométrie, à l'échelle près, que cellTriangles() dans "
        "assets/bicolore-render.js."),
}


def valeurs_terminales(node):
    """Toutes les constantes terminales d'un littéral dict/list/tuple,
    récursivement à travers les dicts imbriqués (pas les appels de fonction :
    une valeur calculée n'est pas une donnée codée en dur)."""
    if isinstance(node, ast.Constant):
        yield node.value
    elif isinstance(node, ast.Dict):
        for v in node.values:
            yield from valeurs_terminales(v)
    elif isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        for elt in node.elts:
            yield from valeurs_terminales(elt)


def entrees(node):
    """Nombre d'entrées de premier niveau d'un littéral dict/list/tuple."""
    if isinstance(node, ast.Dict):
        return len(node.keys)
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        return len(node.elts)
    return 0


def suspect(node):
    n = entrees(node)
    if n < SEUIL_ENTREES:
        return None
    vals = list(valeurs_terminales(node))
    if not vals:
        return None
    numeriques = sum(1 for v in vals if isinstance(v, (int, float)) and not isinstance(v, bool))
    fraction = numeriques / len(vals)
    if fraction >= SEUIL_NUMERIQUE:
        return f"{n} entrées, {numeriques}/{len(vals)} valeurs terminales numériques ({fraction:.0%})"
    return None


def check_fichier(path):
    src = open(path, encoding='utf-8').read()
    try:
        tree = ast.parse(src, filename=path)
    except SyntaxError as e:
        return [f"{path}: erreur de syntaxe, non analysé ({e})"]

    problemes = []
    rel = os.path.relpath(path, TOOLS_DIR).replace(os.sep, '/')
    for node in ast.iter_child_nodes(tree):  # niveau module seulement
        if not isinstance(node, ast.Assign):
            continue
        if not (isinstance(node.value, (ast.Dict, ast.List, ast.Tuple, ast.Set))):
            continue
        for target in node.targets:
            if not (isinstance(target, ast.Name) and target.id.isupper()):
                continue
            if (rel, target.id) in ALLOWLIST:
                continue
            diag = suspect(node.value)
            if diag:
                problemes.append(
                    f"{rel}:{node.lineno}: {target.id} — {diag} — ressemble à une table de "
                    f"mesures (fréquences, comptes, k_pic...) codée en dur plutôt que lue "
                    f"depuis data/ ou calculée. Si c'est légitime, ajouter "
                    f"('{rel}', '{target.id}') à ALLOWLIST avec la raison ; sinon, faire lire "
                    f"cette table depuis data/ ou la calculer.")
    return problemes


def main():
    fichiers = sorted(glob.glob(os.path.join(TOOLS_DIR, '*.py')))
    problemes = []
    for path in fichiers:
        if os.path.basename(path) == os.path.basename(__file__):
            continue
        problemes.extend(check_fichier(path))

    if problemes:
        print(f"ÉCHEC : {len(problemes)} table(s) de données codées en dur trouvée(s) "
              f"dans tools/ :\n", file=sys.stderr)
        for p in problemes:
            print(f"  - {p}", file=sys.stderr)
        sys.exit(1)

    print(f"OK : aucune table de données suspecte dans les {len(fichiers)} scripts de tools/.")


if __name__ == '__main__':
    main()
