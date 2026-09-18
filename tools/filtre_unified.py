#!/usr/bin/env python3
# ============================================================
# Reproduit le Théorème 2 de la note « A Half-Shift Criterion on
# Three-Colour 12×12 Grids, and Its Restriction on the Cube » : construit
# les candidats (famille, teinteA, teinteB, n) pour les 15 familles, les
# deux couples (yang,yang_mut) et (yin,yin_mut), et les 64 hexagrammes, et
# ne retient que ceux qui satisfont le critère, vérifié par l'auteur :
#
#   Pour un candidat [famille, teinteA, teinteB, n] :
#     g = hexagramGrid(n, families[famille][teinteA], families[famille][teinteB])
#     d = g decalee de 6 cases en ligne et 6 en colonne, torique :
#         d[r][c] = g[(r-6)%12][(c-6)%12]
#     s = hexagramGrid(n, families[famille][teinteB], families[famille][teinteA])
#         (les deux teintes echangees)
#     Le candidat est retenu si d == s case par case (egalite stricte).
#
# hexagramGrid() est reprise a l'identique de fonds-ecran.html:519 — meme
# boucle, meme indexation LAYER_OF/traits. La reconstruction des familles
# depuis referent_360_v3.json est une redite volontaire de celle de
# tools/cube_edges.py — deux implementations independantes du meme calcul,
# pas une source partagee : c'est leur convergence qui vaut preuve.
#
# Jusqu'au 2026-09-19, ce script lisait data/fonds_ecran_v1.json, dont les
# quatre familles a une base etaient incompletes (12 couches sur 60
# manquantes, voir tools/generate_fonds_ecran.py) — le resultat attendu
# etait alors 768 sur 6 familles. Corrige pour lire directement
# data/referent_360_v3.json (la source complete, 15 familles x 4 natures) :
# 1024 sur 8 familles.
#
# Ce script ne modifie plus aucun fichier — c'est une verification, pas un
# generateur (data/fonds_ecran_v1.json est produit par
# tools/generate_fonds_ecran.py, seule source de ce fichier).
#
# Usage : python tools/filtre_unified.py
# ============================================================
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "referent_360_v3.json"

EXPECTED_COUNT = 1024
EXPECTED_FAMILIES = {
    "BASE-YANG", "BASE-YANG-MUT",
    "PAR2-YANG-YIN-MUT", "PAR2-YIN-MUT-YANG-MUT", "PAR2-YIN-YANG", "PAR2-YIN-YANG-MUT",
    "PAR3-SANS-YANG", "PAR3-SANS-YANG-MUT",
}
EXPECTED_PAIRS = {("yang", "yang_mut"), ("yin", "yin_mut")}


def familles_depuis_referent_360(doc):
    """Les 15 familles et leurs 60 couches, depuis referent_360_v3.json.

    Le fichier range les quatre familles à une base sous l'étiquette BASES,
    avec une teinte « BASE-NATURE » ; on les sépare en quatre familles."""
    lettre = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}
    couches = defaultdict(lambda: [[None] * 12 for _ in range(12)])
    for c in doc['calques']:
        for col, l in lettre.items():
            for r, cc in c[col + '_positions']:
                couches[(c['famille'], c['teinte'])][r][cc] = l
    familles = defaultdict(dict)
    for (f, t), g in couches.items():
        if any(x is None for row in g for x in row):
            sys.exit(f"couche incomplète après union des 6 niveaux : {f}/{t}")
        if f == 'BASES':
            for b in ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN'):  # ordre : préfixes longs d'abord
                if t.startswith(b + '-'):
                    familles['BASE-' + b][t[len(b) + 1:].lower().replace('-', '_')] = g
                    break
        else:
            familles[f][t.lower().replace('-', '_')] = g
    return doc['layer_of'], dict(familles)


def hexagram_grid(n, grid_a, grid_b, layer_of):
    col, row = n % 8, n // 8
    bits_col = [col & 1, (col >> 1) & 1, (col >> 2) & 1]
    bits_row = [row & 1, (row >> 1) & 1, (row >> 2) & 1]
    traits = bits_col + bits_row
    grid = []
    for r in range(12):
        row_arr = []
        for c in range(12):
            pos = layer_of[r][c]
            bit = traits[pos - 1]
            row_arr.append(grid_a[r][c] if bit == 1 else grid_b[r][c])
        grid.append(row_arr)
    return grid


def shifted_half_period(g):
    return [[g[(r - 6) % 12][(c - 6) % 12] for c in range(12)] for r in range(12)]


def is_unified(fam, a, b, n, families, layer_of):
    g = hexagram_grid(n, families[fam][a], families[fam][b], layer_of)
    d = shifted_half_period(g)
    s = hexagram_grid(n, families[fam][b], families[fam][a], layer_of)
    return d == s


def main():
    doc = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    layer_of, families = familles_depuis_referent_360(doc)
    print(f"familles : {len(families)} ; couches : {sum(len(v) for v in families.values())}")

    candidats = [(fam, a, b, n) for fam in families for a, b in EXPECTED_PAIRS for n in range(64)]
    print(f"Candidats (15 familles x 2 couples x 64 hexagrammes) : {len(candidats)}")

    kept = [[fam, a, b, n] for fam, a, b, n in candidats
            if is_unified(fam, a, b, n, families, layer_of)]

    print(f"Retenus (critère appliqué, n contrôlé un par un plutôt que par le "
          f"raccourci B=A∘σ) : {len(kept)}")

    by_family = {}
    for fam, a, b, n in kept:
        by_family.setdefault(fam, []).append((a, b, n))
    for fam in sorted(by_family):
        pairs = {(a, b) for a, b, n in by_family[fam]}
        print(f"  {fam:28s} {len(by_family[fam]):4d} entrees, couples {sorted(pairs)}")

    ok = True

    if len(kept) != EXPECTED_COUNT:
        print(f"ECHEC : {len(kept)} entrees retenues, {EXPECTED_COUNT} attendues.")
        ok = False

    kept_families = set(by_family.keys())
    if kept_families != EXPECTED_FAMILIES:
        print(f"ECHEC : familles retenues {sorted(kept_families)} != attendues {sorted(EXPECTED_FAMILIES)}")
        ok = False

    for fam in sorted(kept_families & EXPECTED_FAMILIES):
        pairs = {(a, b) for a, b, n in by_family[fam]}
        if pairs != EXPECTED_PAIRS:
            print(f"ECHEC : {fam} a les couples {sorted(pairs)}, attendus {sorted(EXPECTED_PAIRS)}")
            ok = False
        ns = sorted(n for a, b, n in by_family[fam] if (a, b) in EXPECTED_PAIRS)
        expected_ns = sorted(list(range(64)) * 2)
        if ns != expected_ns:
            print(f"ECHEC : {fam} n'a pas exactement les 64 hexagrammes pour chacun des deux couples.")
            ok = False

    if not ok:
        print("\nLe compte ou la composition ne correspond pas à la spécification.")
        sys.exit(1)

    print(f"\nOK : {EXPECTED_COUNT} triplets, composition conforme au Théorème 2.")


if __name__ == "__main__":
    main()
