#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""verif_protocole.py — vérification indépendante des sections 2, 4 et 5 de « The Ansate Cross ».

Protocole couleur → nombre (section 4.2), lu tel quel : chaque couleur numérote
virtuellement la grille de 1 à n² dans son sens de parcours ; seule la couleur
concernée retient son nombre.
    bleu  : ligne par ligne, de haut en bas, de gauche à droite  → i = n·r + c + 1
    rouge : le sens inverse                                      → n² + 1 − i
    gris  : de haut en bas, de droite à gauche                   → j = n·r + (n−1−c) + 1
    jaune : le sens inverse                                      → n² + 1 − j
(« gris » est nommé « vert » dans les données.)
Données : referent_256_v3.json (les 256 colorations d'ordre 6, avec leur chiralité).

Câblage cascade 2 (2026-09-21, voir stegano/carter.py::_magic_number,
docs/CASCADE_V1.md, docs/REFERENT_FORMAT_V3.md §4) : ce calcul est la
base de l'ordre de lecture par valeur magique du référent 256, remplaçant
le balayage pour cette seule variante. `is_magic_square` est importée du
verif_carre_magique.py du dépôt (identique octet pour octet sur cette
fonction) ; CARRE_REFERENCE/COULEURS_REFERENCE sont propres à ce fichier
(exemple de référence différent, sans rapport avec le pipeline de
génération de referent_256_v3.json, qui dépend de sa propre copie figée
de verif_carre_magique.py et n'est pas touché ici).

Usage :
    cd tools/ && python verif_protocole.py
(attend verif_carre_magique.py à côté, et data/referent_256_v3.json dans
un sous-dossier data/ — ou ajuster le chemin ligne ~32 si placé ailleurs.)
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verif_carre_magique import is_magic_square

def protocole(col, n):
    g = [[0] * n for _ in range(n)]
    for r in range(n):
        for c in range(n):
            i, j = n * r + c + 1, n * r + (n - 1 - c) + 1
            g[r][c] = {'bleu': i, 'rouge': n * n + 1 - i, 'vert': j, 'jaune': n * n + 1 - j}[col[r][c]]
    return g

def grille6(f):
    col = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            col[r][cc] = c
    return col

CARRE_REFERENCE = [
    [6, 32, 3, 34, 35, 1],
    [7, 11, 27, 28, 8, 30],
    [19, 14, 16, 15, 23, 24],
    [18, 20, 22, 21, 17, 13],
    [25, 29, 10, 9, 26, 12],
    [36, 5, 33, 4, 2, 31],
]

COULEURS_REFERENCE = [
    ['jaune', 'vert', 'rouge', 'vert', 'vert', 'jaune'],
    ['rouge', 'jaune', 'vert', 'vert', 'jaune', 'vert'],
    ['vert', 'rouge', 'jaune', 'jaune', 'vert', 'vert'],
    ['bleu', 'rouge', 'jaune', 'jaune', 'vert', 'bleu'],
    ['rouge', 'jaune', 'bleu', 'bleu', 'jaune', 'vert'],
    ['jaune', 'bleu', 'rouge', 'vert', 'bleu', 'jaune'],
]

if __name__ == '__main__':
    _repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    doc = json.load(open(os.path.join(_repo_root, 'data', 'referent_256_v3.json'), encoding='utf-8'))
    formes = {(f['row'], f['col']): f for f in doc['forms']}

    print("§2/§4.2  le protocole reproduit le carré de référence :", protocole(COULEURS_REFERENCE, 6) == CARRE_REFERENCE)

    magiques = 0; diag_compl = 0; rb_compl = 0
    for f in doc['forms']:
        g = protocole(grille6(f), 6)
        magiques += is_magic_square(g, verbose=False)['magique']
        diag_compl += all(g[i][i] + g[5 - i][5 - i] == 37 and g[i][5 - i] + g[5 - i][i] == 37 for i in range(6))
        mir = (lambda r, c: (5 - c, 5 - r)) if f['chiralite'] == 'EGO' else (lambda r, c: (c, r))
        rb_compl += all(g[r][c] + g[mir(r, c)[0]][mir(r, c)[1]] == 37 for r, c in f['rouge_positions'])
    print(f"§5       carrés magiques complets (lignes, colonnes, deux diagonales) : {magiques}/256")
    print(f"§4.1     rouge et bleu complémentaires cellule à cellule (par le miroir) : {rb_compl}/256")
    print(f"§2       cellules diagonales complémentaires par symétrie centrale       : {diag_compl}/256")

    ok12 = 0
    for R in range(8):
        for C in range(8):
            G = [[None] * 12 for _ in range(12)]
            for dr in range(2):
                for dc in range(2):
                    p = grille6(formes[(2 * R + dr, 2 * C + dc)])
                    for r in range(6):
                        for c in range(6):
                            G[6 * dr + r][6 * dc + c] = p[r][c]
            ok12 += is_magic_square(protocole(G, 12), verbose=False)['magique']
    print(f"§5/§7    ordre 12, les 64 assemblages 2×2 sous le même protocole (constante 870) : {ok12}/64")
