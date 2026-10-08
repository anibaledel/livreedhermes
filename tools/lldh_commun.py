#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# lldh_commun.py — ce que les vérificateurs des carrés d'ordre 6 partagent :
# la lecture du référent, le protocole, le carré, l'assemblage, le test
# magique, et les conventions des trigrammes. Rien ici n'énonce de résultat :
# chaque énoncé reste dans l'en-tête du script qui le vérifie.
#
# Importé par protocole_general.py, pavage_miroirs.py, verify_cle_damier.py,
# verify_pont_formes.py, verify_cle_pied.py, verify_invariants.py et
# transcription.py, lancés depuis la racine du dépôt (python tools/<script>.py).

import json, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT = os.path.join(RACINE, 'data', 'referent_256_v3.json')

# Trigramme : indice t, trait du bas = t & 1, milieu = (t >> 1) & 1,
# haut = (t >> 2) & 1 — la convention de assets/vue-fond-ecran.js.
NOM = {0b111: 'ciel', 0b101: 'feu', 0b010: 'eau', 0b000: 'terre',
       0b110: 'vent', 0b100: 'montagne', 0b011: 'lac', 0b001: 'tonnerre'}
ELEMENTAUX = {'ciel', 'feu', 'eau', 'terre'}

# Les quatre classes du protocole, par couleur du référent.
CLASSES = {'bleu': 'B', 'rouge': 'R', 'vert': 'V', 'jaune': 'J'}

# Les trois bascules du trigramme inférieur, du bord vers le centre :
# (poids du trait, cases si yin, cases si yang) dans la tuile de 6 × 6.
BASCULES = [
    (4, {(0, 2), (0, 3), (5, 2), (5, 3)}, {(2, 0), (2, 5), (3, 0), (3, 5)}),
    (2, {(1, 0), (1, 5), (4, 0), (4, 5)}, {(0, 1), (0, 4), (5, 1), (5, 4)}),
    (1, {(2, 1), (2, 4), (3, 1), (3, 4)}, {(1, 2), (1, 3), (4, 2), (4, 3)}),
]

# La seule convention de la transcription : le point de départ et le sens du
# cycle à quatre que parcourent les deux traits du bas du trigramme supérieur.
CYCLE = [0b00, 0b01, 0b10, 0b11]


def lire_referent():
    """Le référent des 256 carrés d'ordre 6, tel qu'il est versé."""
    return json.load(open(REFERENT, encoding='utf-8'))


def carre(f):
    """Le carré d'ordre 6 d'une forme du référent, en noms de couleurs."""
    g = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            g[r][cc] = c
    return g


def carres(doc=None):
    """Les 256 carrés, rangés par leur place (ligne, colonne) sur le damier 16 × 16."""
    doc = doc or lire_referent()
    return {(f['row'], f['col']): carre(f) for f in doc['forms']}


def etiquetage(f):
    """Le carré d'ordre 6 d'une forme, en classes du protocole (B, R, V, J)."""
    e = [[None] * 6 for _ in range(6)]
    for coul, l in CLASSES.items():
        for r, c in f[coul + '_positions']:
            e[r][c] = l
    return e


def assemblage(G, R, C, fusion=None):
    """Le bloc 2 × 2 du damier en (R, C), d'ordre 12 ; fusion, si donnée,
    renomme les couleurs (par exemple rouge et bleu en une seule teinte)."""
    g = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            p = G[(2 * R + dr, 2 * C + dc)]
            for r in range(6):
                for c in range(6):
                    g[6 * dr + r][6 * dc + c] = fusion[p[r][c]] if fusion else p[r][c]
    return g


def valeur(classe, r, c, n):
    """L'entier que le protocole donne à la case (r, c) d'ordre n selon sa classe."""
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[classe]


def protocole(etiq, n):
    """La grille d'entiers qu'un étiquetage d'ordre n reçoit du protocole."""
    return [[valeur(etiq[r][c], r, c, n) for c in range(n)] for r in range(n)]


def magique(g, n):
    """(True, None) si la grille est magique, diagonales comprises ; sinon
    (False, ce qui manque)."""
    M = n * (n * n + 1) // 2
    if sorted(x for ligne in g for x in ligne) != list(range(1, n * n + 1)):
        return False, 'les n² entiers ne sont pas tous présents une fois'
    for i in range(n):
        if sum(g[i]) != M:
            return False, f'ligne {i}'
        if sum(g[r][i] for r in range(n)) != M:
            return False, f'colonne {i}'
    if sum(g[i][i] for i in range(n)) != M:
        return False, 'diagonale'
    if sum(g[i][n - 1 - i] for i in range(n)) != M:
        return False, 'antidiagonale'
    return True, None


def jonctions(t):
    """Les deux jonctions du trigramme t : (tête-cœur, cœur-ventre)."""
    h, m, b = (t >> 2) & 1, (t >> 1) & 1, t & 1
    return int(h != m), int(m != b)


def superposition(g, couleur):
    """La forme d'une couleur dans inhale + exhale : le bloc réuni à son
    décalage d'une demi-période en ligne et en colonne (pages 058, 059)."""
    return frozenset((i, j) for i in range(12) for j in range(12)
                     if g[i][j] == couleur or g[(i + 6) % 12][(j + 6) % 12] == couleur)
