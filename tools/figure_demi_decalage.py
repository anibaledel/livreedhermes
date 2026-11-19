#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# figure_demi_decalage.py — la figure « avant / après la translation » de la galerie des Patterns Unifiés (prompt 208).
#
# Elle montre, pour UNE construction réellement retenue par le critère du demi-décalage (tools/filtre_unified.py), trois grilles de 12 × 12
# côte à côte : la grille g, la même grille décalée de 6 cases en ligne et en colonne (torique : d[r][c] = g[(r-6) % 12][(c-6) % 12]), et la grille
# du même hexagramme aux deux teintes de construction échangées (s). Le critère demande d = s, case par case : la figure ne s'écrit que si c'est vrai.
# Les couleurs sont celles du référent (data/referent_360_v3.json, color_hues_hex) ; aucune case n'est dessinée à la main.
# La construction montrée est la première, dans l'ordre alphabétique des familles puis des couples de teintes, puis des hexagrammes, dont les trois
# grilles sont toutes différentes entre elles sauf d et s (g ≠ d, g ≠ s) : sans cela, la figure ne montrerait rien. Elle est écrite dans <desc> du SVG.
#
# Usage : python3 tools/figure_demi_decalage.py            écrit assets/figures/demi-decalage-patterns-unifies.svg
#         python3 tools/figure_demi_decalage.py --verifie  le fichier est celui que les données produisent (octet pour octet)
#         python3 tools/figure_demi_decalage.py --essai    un fichier faussé d'une case est refusé
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import filtre_unified as fu  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SORTIE = ROOT / "assets/figures/demi-decalage-patterns-unifies.svg"
CELLULE, ECART, MARGE = 14, 44, 16
COULEUR_FOND = "#14141a"
LETTRES = {"V": "violet", "M": "magenta", "O": "orange"}


def choisir(layer_of, familles):
    for fam in sorted(familles):
        for a, b in sorted(fu.EXPECTED_PAIRS):
            for n in range(64):
                g = fu.hexagram_grid(n, familles[fam][a], familles[fam][b], layer_of)
                d = fu.shifted_half_period(g)
                s = fu.hexagram_grid(n, familles[fam][b], familles[fam][a], layer_of)
                if d == s and g != d and g != s:
                    return fam, a, b, n, g, d, s
    sys.exit("figure_demi_decalage.py : aucune construction retenue dont les trois grilles diffèrent")


def svg():
    doc = json.loads(fu.DATA_PATH.read_text(encoding="utf-8"))
    teintes = doc["color_hues_hex"]
    layer_of, familles = fu.familles_depuis_referent_360(doc)
    fam, a, b, n, g, d, s = choisir(layer_of, familles)
    assert fu.is_unified(fam, a, b, n, familles, layer_of), "la construction montrée doit être retenue par le critère"
    changements = sorted({f"{LETTRES[g[r][c]]}>{LETTRES[d[r][c]]}" for r in range(12) for c in range(12) if g[r][c] != d[r][c]})
    cote = 12 * CELLULE
    largeur = 2 * MARGE + 3 * cote + 2 * ECART
    hauteur = 2 * MARGE + cote
    sortie = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}" width="{largeur}" height="{hauteur}" shape-rendering="crispEdges">',
              '<title>Le décalage de six cases d\'une grille, comparé à la même grille aux teintes échangées</title>',
              '<desc>' + json.dumps({"famille": fam, "teinteA": a, "teinteB": b, "hexagramme": n, "grilles": ["g", "d", "s"], "d_egale_s": d == s, "g_vers_d": changements}, ensure_ascii=False, sort_keys=True) + '</desc>',
              f'<rect width="{largeur}" height="{hauteur}" fill="{COULEUR_FOND}"/>']
    for k, grille in enumerate((g, d, s)):
        x0 = MARGE + k * (cote + ECART)
        sortie.append(f'<g transform="translate({x0} {MARGE})">')
        for r in range(12):
            for c in range(12):
                sortie.append(f'<rect x="{c * CELLULE}" y="{r * CELLULE}" width="{CELLULE}" height="{CELLULE}" fill="{teintes[LETTRES[grille[r][c]]]}"/>')
        # les deux axes de la demi-période : le décalage de 6 cases les échange
        sortie.append(f'<path d="M{cote // 2} 0V{cote}M0 {cote // 2}H{cote}" stroke="#ffffff" stroke-opacity=".75" stroke-width="1" fill="none"/>')
        sortie.append('</g>')
    # → entre g et d (décalage de 6 cases), = entre d et s (égalité case par case)
    y = MARGE + cote // 2
    x1 = MARGE + cote + ECART // 2
    sortie.append(f'<path d="M{x1 - 10} {y}H{x1 + 8}M{x1 + 2} {y - 6}L{x1 + 10} {y}L{x1 + 2} {y + 6}" stroke="#ffffff" stroke-width="2" fill="none"/>')
    x2 = MARGE + 2 * cote + ECART + ECART // 2
    sortie.append(f'<path d="M{x2 - 9} {y - 4}H{x2 + 9}M{x2 - 9} {y + 4}H{x2 + 9}" stroke="#ffffff" stroke-width="2" fill="none"/>')
    sortie.append('</svg>')
    return "\n".join(sortie) + "\n", (fam, a, b, n)


def main():
    voulu, choix = svg()
    conforme = lambda contenu: contenu == voulu  # noqa: E731
    if "--essai" in sys.argv:
        faux = voulu.replace('fill="#662d91"', 'fill="#662d92"', 1)
        if faux == voulu:
            sys.exit("figure_demi_decalage.py --essai : rien à fausser")
        ok = conforme(voulu) and not conforme(faux) and not conforme("")
        print("--essai : la figure juste est acceptée, une teinte faussée d'un cran et un fichier vide sont refusés." if ok else "--essai : ÉCHEC, un fichier faux est accepté.")
        sys.exit(0 if ok else 1)
    if "--verifie" in sys.argv:
        if not SORTIE.exists() or not conforme(SORTIE.read_text(encoding="utf-8")):
            print(f"ÉCHEC {SORTIE.relative_to(ROOT)} n'est pas la figure que les données produisent. Relancer : python3 tools/figure_demi_decalage.py", file=sys.stderr)
            sys.exit(1)
        print(f"OK    figure du demi-décalage à jour : famille {choix[0]}, teintes {choix[1]} et {choix[2]}, hexagramme n° {choix[3]} (d = s case par case).")
        return
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(voulu, encoding="utf-8")
    print(f"{SORTIE.relative_to(ROOT)} écrit : famille {choix[0]}, teintes {choix[1]} et {choix[2]}, hexagramme n° {choix[3]}.")


if __name__ == "__main__":
    main()
