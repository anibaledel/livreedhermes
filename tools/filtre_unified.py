#!/usr/bin/env python3
# ============================================================
# Filtre le catalogue data/fonds_ecran_v1.json (clé "entries") selon le
# critere de forme unifiee, verifie par l'auteur :
#
#   Pour une entree [famille, teinteA, teinteB, n] :
#     g = hexagramGrid(n, families[famille][teinteA], families[famille][teinteB])
#     d = g decalee de 6 cases en ligne et 6 en colonne, torique :
#         d[r][c] = g[(r-6)%12][(c-6)%12]
#     s = hexagramGrid(n, families[famille][teinteB], families[famille][teinteA])
#         (les deux teintes echangees)
#     L'entree est retenue si d == s case par case (egalite stricte).
#
# hexagramGrid() est reprise a l'identique de fonds-ecran.html:519 — meme
# boucle, meme indexation LAYER_OF/traits.
#
# Le fichier actuel n'a jamais ete filtre : c'est une enumeration, pas une
# selection (884 entrees). Resultat attendu : 768 exactement — le script
# echoue (exit 1, rien ecrit) si ce n'est pas le cas, plutot que d'ecrire
# un resultat qui contredirait la specification.
#
# Usage : python tools/filtre_unified.py [--check-only]
# ============================================================
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "fonds_ecran_v1.json"

EXPECTED_COUNT = 768
EXPECTED_FAMILIES = {
    "par2:yang+yin_mut", "par2:yin+yang", "par2:yin+yang_mut",
    "par2:yin_mut+yang_mut", "par3:sans_yang", "par3:sans_yang_mut",
}
EXPECTED_PAIRS = {("yang", "yang_mut"), ("yin", "yin_mut")}


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
    check_only = "--check-only" in sys.argv

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    layer_of = data["layerOf"]
    families = data["families"]
    entries = data["entries"]

    print(f"Entrees avant filtrage : {len(entries)}")

    kept = []
    for fam, a, b, n in entries:
        if is_unified(fam, a, b, n, families, layer_of):
            kept.append([fam, a, b, n])

    print(f"Entrees retenues (critere applique) : {len(kept)}")

    # Repartition par famille, pour comparer a la specification.
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
        print("\nLe compte ou la composition ne correspond pas a la specification.")
        print("Rien n'est ecrit — fichier de donnees inchange.")
        sys.exit(1)

    print(f"\nOK : {EXPECTED_COUNT} entrees, composition conforme a la specification.")

    if check_only:
        print("(--check-only : fichier de donnees non modifie)")
        return

    data["entries"] = kept
    DATA_PATH.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Ecrit : {DATA_PATH}")


if __name__ == "__main__":
    main()
