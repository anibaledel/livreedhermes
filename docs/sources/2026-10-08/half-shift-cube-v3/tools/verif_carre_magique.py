"""
======================================================================
 VÉRIFICATEUR DE CARRÉS MAGIQUES — "La Livrée d'Hermès"
======================================================================
Outil de vérification pour la méthode des carrés solaires (ordre 6,
croix ansée EGO/ALTER) et pour tout carré magique classique (ordre N).

Ce script reprend, sous forme de code réutilisable, les vérifications
faites manuellement en conversation :
  - carré magique (lignes, colonnes, diagonales, associativité)
  - critères I à IV de la croix ansée (p.040)
  - transcription couleur -> nombre par balayage en zigzag (hypothèse
    de travail à confirmer/ajuster — voir section 3)

Usage rapide :
    python verif_carre_magique.py

Pour vérifier VOTRE PROPRE carré :
    from verif_carre_magique import is_magic_square
    is_magic_square([[...], [...], ...])
======================================================================
"""

import numpy as np
from collections import defaultdict


# ============================================================
# 1. VÉRIFICATION D'UN CARRÉ MAGIQUE (numérique, ordre N quelconque)
# ============================================================

def is_magic_square(grid, verbose=True):
    """
    Vérifie si `grid` (liste de listes NxN contenant 1..N²) est un carré
    magique complet (lignes, colonnes, 2 diagonales), et teste en plus
    l'associativité (complémentarité à N²+1 par symétrie centrale).

    Retourne un dict détaillant chaque vérification.
    """
    a = np.array(grid)
    n = a.shape[0]
    assert a.shape[0] == a.shape[1], "Le carré doit être carré (NxN)"
    target = n * (n**2 + 1) // 2

    content_ok = sorted(a.flatten().tolist()) == list(range(1, n * n + 1))
    row_sums = a.sum(axis=1).tolist()
    col_sums = a.sum(axis=0).tolist()
    diag = int(a.trace())
    adiag = int(sum(a[i, n - 1 - i] for i in range(n)))

    rows_ok = all(s == target for s in row_sums)
    cols_ok = all(s == target for s in col_sums)
    diag_ok = diag == target
    adiag_ok = adiag == target

    # Associativité : a[i,j] + a[n-1-i,n-1-j] == n²+1 pour tout i,j
    comp = n ** 2 + 1
    assoc_fail = []
    for i in range(n):
        for j in range(n):
            s = int(a[i, j] + a[n - 1 - i, n - 1 - j])
            if s != comp:
                assoc_fail.append(((i, j), (n - 1 - i, n - 1 - j),
                                    int(a[i, j]), int(a[n - 1 - i, n - 1 - j])))
    associatif = len(assoc_fail) == 0

    result = {
        "ordre": n,
        "constante_attendue": target,
        "contenu_1_a_n2_correct": content_ok,
        "lignes": row_sums, "lignes_ok": rows_ok,
        "colonnes": col_sums, "colonnes_ok": cols_ok,
        "diagonale_principale": diag, "diagonale_ok": diag_ok,
        "anti_diagonale": adiag, "anti_diagonale_ok": adiag_ok,
        "magique": content_ok and rows_ok and cols_ok and diag_ok and adiag_ok,
        "associatif": associatif,
        "paires_non_complementaires": assoc_fail[:10],
    }

    if verbose:
        print(f"--- Vérification carré d'ordre {n} ---")
        print(f"Constante magique attendue : {target}")
        print(f"Contenu = 1..{n*n} : {content_ok}")
        print(f"Lignes correctes : {rows_ok}" + ("" if rows_ok else f"  {row_sums}"))
        print(f"Colonnes correctes : {cols_ok}" + ("" if cols_ok else f"  {col_sums}"))
        print(f"Diagonale principale : {diag} (attendu {target}) -> {diag_ok}")
        print(f"Anti-diagonale : {adiag} (attendu {target}) -> {adiag_ok}")
        print(f"=> CARRÉ MAGIQUE : {result['magique']}")
        print(f"Associatif (complément à {comp} par symétrie centrale) : {associatif}")
        if assoc_fail:
            print(f"   (premières paires non complémentaires : {assoc_fail[:3]})")
        print()

    return result


# ============================================================
# 2. VÉRIFICATION D'UNE CROIX ANSÉE (encodage couleur, ordre 6)
# ============================================================

def check_croix_ansee(color_grid, verbose=True):
    """
    color_grid : liste de listes 6x6, chaque case contenant une des 4
                 couleurs 'rouge', 'bleu', 'vert', 'jaune'.
    Vérifie les critères I à IV définis p.040 de la Livrée d'Hermès.
    """
    n = 6
    g = color_grid

    diag_main = [(i, i) for i in range(n)]
    diag_anti = [(i, n - 1 - i) for i in range(n)]
    diag_cells = set(diag_main) | set(diag_anti)

    # Critère II : rouge et bleu absents des diagonales
    rouge_bleu_on_diag = [(i, j) for (i, j) in diag_cells if g[i][j] in ('rouge', 'bleu')]

    # Critère I : rouge et bleu symétriques par rapport à UNE des deux
    # diagonales -- anti-diagonale (chiralité EGO) OU diagonale principale
    # (chiralité ALTER). BUG CORRIGÉ (2026-09-12) : la version précédente
    # ne testait que l'anti-diagonale, ce qui rejetait à tort tous les
    # carrés ALTER. Diagnostiqué lors de l'extraction du référent-256 du
    # livre (LLDH CARRELONG 4TRAD 2026 JUILLET-047.svg) : sur les 256
    # carrés de l'échiquier, exactement 128 vérifient l'anti-diagonale et
    # 128 la diagonale principale, réparties en damier parfait selon la
    # parité de (ligne_grille + colonne_grille) -- la dualité EGO/ALTER
    # attendue, pas une erreur d'extraction.
    rouge_pos = [(i, j) for i in range(n) for j in range(n) if g[i][j] == 'rouge']
    bleu_pos = [(i, j) for i in range(n) for j in range(n) if g[i][j] == 'bleu']
    bleu_set = set(bleu_pos)
    rouge_reflected_anti = set((n - 1 - j, n - 1 - i) for (i, j) in rouge_pos)
    rouge_reflected_main = set((j, i) for (i, j) in rouge_pos)
    symetrie_anti = (rouge_reflected_anti == bleu_set)   # EGO
    symetrie_main = (rouge_reflected_main == bleu_set)   # ALTER
    if symetrie_anti:
        chiralite = 'EGO'
    elif symetrie_main:
        chiralite = 'ALTER'
    else:
        chiralite = None

    # Critère III : au moins une case rouge ou bleue par ligne
    lignes_sans_rb = [i for i in range(n) if not any(g[i][j] in ('rouge', 'bleu') for j in range(n))]

    # Critère IV : autant de (rouge+jaune) que de (vert+bleu) par ligne
    lignes_desequilibrees = []
    for i in range(n):
        grands = sum(1 for j in range(n) if g[i][j] in ('rouge', 'jaune'))
        petits = sum(1 for j in range(n) if g[i][j] in ('vert', 'bleu'))
        if grands != petits:
            lignes_desequilibrees.append((i, grands, petits))

    report = {
        "critere_I_symetrie_rouge_bleu": (symetrie_anti or symetrie_main),
        "critere_I_chiralite": chiralite,
        "nb_rouge": len(rouge_pos), "nb_bleu": len(bleu_pos),
        "critere_II_rouge_bleu_hors_diagonales": (len(rouge_bleu_on_diag) == 0),
        "violations_critere_II": rouge_bleu_on_diag,
        "critere_III_au_moins_1_par_ligne": (len(lignes_sans_rb) == 0),
        "lignes_en_defaut_III": lignes_sans_rb,
        "critere_IV_equilibre_grand_petit": (len(lignes_desequilibrees) == 0),
        "lignes_en_defaut_IV": lignes_desequilibrees,
    }
    report["tous_criteres_ok"] = all([
        report["critere_I_symetrie_rouge_bleu"],
        report["critere_II_rouge_bleu_hors_diagonales"],
        report["critere_III_au_moins_1_par_ligne"],
        report["critere_IV_equilibre_grand_petit"],
    ])

    if verbose:
        print("--- Vérification croix ansée ---")
        print(f"Critère I  (symétrie rouge/bleu, EGO ou ALTER) : {report['critere_I_symetrie_rouge_bleu']}  "
              f"(chiralité={report['critere_I_chiralite']}, rouge={report['nb_rouge']}, bleu={report['nb_bleu']})")
        print(f"Critère II (rouge/bleu absents des diagonales)        : {report['critere_II_rouge_bleu_hors_diagonales']}")
        if report["violations_critere_II"]:
            print(f"   violations : {report['violations_critere_II']}")
        print(f"Critère III (>=1 rouge/bleu par ligne)                : {report['critere_III_au_moins_1_par_ligne']}")
        if report["lignes_en_defaut_III"]:
            print(f"   lignes en défaut : {report['lignes_en_defaut_III']}")
        print(f"Critère IV (équilibre grand/petit par ligne)          : {report['critere_IV_equilibre_grand_petit']}")
        if report["lignes_en_defaut_IV"]:
            print(f"   lignes en défaut : {report['lignes_en_defaut_IV']}")
        print(f"=> TOUS LES CRITÈRES RESPECTÉS : {report['tous_criteres_ok']}")
        print()

    return report


# ============================================================
# 3. TRANSCRIPTION COULEUR -> NOMBRE (zigzag boustrophédon)
# ============================================================
#
# HYPOTHÈSE DE TRAVAIL, PAS ENCORE CONFIRMÉE — à ajuster.
# Déduite de la page 027 (le tracé "vert" descend en boustrophédon,
# ligne par ligne, sens alterné). La règle de rebouclage précise pour
# les 4 couleurs (rouge/bleu/jaune/vert) reste à valider avec l'auteur.
# Modifiez cette fonction et comparez le résultat à CARRE_REFERENCE
# (déjà vérifié) pour tester une hypothèse.

def zigzag_transcribe(cells, start_value, start_from_bottom=True):
    """
    Transcrit un ensemble de cases (une couleur) en nombres consécutifs
    selon un parcours en boustrophédon (zigzag ligne par ligne, sens
    alterné), en partant de la ligne du bas ou du haut.

    cells : liste de tuples (i,j) (indices 0..5) à numéroter
    start_value : première valeur à placer
    start_from_bottom : True pour partir de la dernière ligne (comme le
                         tracé "vert" observé p.027)
    """
    by_row = defaultdict(list)
    for (i, j) in cells:
        by_row[i].append(j)

    rows_sorted = sorted(by_row.keys(), reverse=start_from_bottom)

    result = {}
    val = start_value
    for idx, i in enumerate(rows_sorted):
        cols = sorted(by_row[i])
        if idx % 2 == 1:
            cols = cols[::-1]
        for j in cols:
            result[(i, j)] = val
            val += 1
    return result


# ============================================================
# 4. EXEMPLE DE RÉFÉRENCE : le carré "666" déjà vérifié en conversation
# ============================================================

CARRE_REFERENCE = [
    [6, 32, 3, 34, 35, 1],
    [7, 11, 27, 28, 8, 30],
    [19, 14, 16, 15, 23, 24],
    [18, 20, 22, 21, 17, 13],
    [25, 29, 10, 9, 26, 12],
    [36, 5, 33, 4, 2, 31],
]

# Encodage couleur correspondant, extrait par analyse de pixels (page 040)
COULEURS_REFERENCE = [
    ['vert', 'jaune', 'bleu', 'jaune', 'jaune', 'vert'],
    ['bleu', 'vert', 'jaune', 'jaune', 'vert', 'jaune'],
    ['jaune', 'bleu', 'vert', 'vert', 'jaune', 'jaune'],
    ['rouge', 'bleu', 'vert', 'vert', 'jaune', 'rouge'],
    ['bleu', 'vert', 'rouge', 'rouge', 'vert', 'jaune'],
    ['vert', 'rouge', 'bleu', 'jaune', 'rouge', 'vert'],
]


# ============================================================
# 5. PROGRAMME PRINCIPAL — exemple d'utilisation
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print(" VÉRIFICATION DU CARRÉ DE RÉFÉRENCE (666)")
    print("=" * 60 + "\n")

    is_magic_square(CARRE_REFERENCE)
    check_croix_ansee(COULEURS_REFERENCE)

    print("=" * 60)
    print(" POUR VÉRIFIER VOS PROPRES CARRÉS")
    print("=" * 60)
    print("""
1. Carré numérique (n'importe quel ordre) :

    from verif_carre_magique import is_magic_square
    mon_carre = [[..], [..], ...]   # NxN, valeurs 1..N²
    is_magic_square(mon_carre)

2. Encodage couleur (ordre 6, croix ansée) :

    from verif_carre_magique import check_croix_ansee
    mes_couleurs = [['rouge','bleu',...], ...]  # 6x6
    check_croix_ansee(mes_couleurs)

3. Pour vérifier PLUSIEURS carrés d'un coup (ex. les 256 encodages,
   ou les 64 variantes d'ordre 12), placez-les dans une liste et
   bouclez :

    resultats = [is_magic_square(c, verbose=False) for c in mes_carres]
    nb_valides = sum(1 for r in resultats if r["magique"])
    print(f"{nb_valides} / {len(mes_carres)} carrés valides")
""")
