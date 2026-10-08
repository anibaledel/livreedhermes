#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# protocole_general.py — le protocole en vocabulaire standard, et à tout ordre.
#
# ÉNONCÉ. Soit une grille n × n. On étiquette chacune de ses n² cases par l'une
# de quatre classes, et la case (r, c) reçoit alors l'un des quatre entiers
#
#     B(r, c) = n·r + c + 1                  (lecture ligne par ligne)
#     R(r, c) = n² + 1 − B(r, c)             (son complément)
#     V(r, c) = n·r + (n − 1 − c) + 1        (lecture ligne par ligne, colonnes renversées)
#     J(r, c) = n² + 1 − V(r, c)             (son complément)
#
# selon sa classe. C'est la méthode dite de la table de motifs, ou « criss-cross »,
# portée de deux classes à quatre : la version à deux classes, qui n'emploie que
# B et R, est documentée pour les ordres doublement pairs seulement.
#
# DEUX CONDITIONS NÉCESSAIRES, valables à tout ordre, et qui sont le cœur du
# procédé. Chaque valeur est de la forme α·r + β·c + γ avec
#
#     B : α = +n, β = +1        V : α = +n, β = −1
#     R : α = −n, β = −1        J : α = −n, β = +1
#
# Pour qu'une somme de ligne ne dépende pas de r, il faut que les α s'annulent ;
# pour qu'une somme de colonne ne dépende pas de c, il faut que les β s'annulent.
# D'où, en notant b, ρ, v, j les effectifs des quatre classes :
#
#     dans chaque LIGNE    : b + v = ρ + j = n / 2
#     dans chaque COLONNE  : b + j = ρ + v = n / 2
#
# L'ordre doit donc être pair, et ces deux conditions ne dépendent que des
# effectifs — ni de la forme de l'étiquetage, ni de l'ordre. Elles laissent
# libres les sommes de positions, qui règlent ensuite la constante et les
# diagonales.
#
# Ce script vérifie l'énoncé sur le corpus des 256 carrés d'ordre 6, puis
# contrôle n'importe quel étiquetage fourni, à n'importe quel ordre pair.
#
# Usage : cd <racine du dépôt> && python tools/protocole_general.py
#         --ordre N --etiquettes <fichier>   vérifie un étiquetage d'ordre N
#         (fichier : N lignes de N caractères parmi B R V J)

import json, os, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLASSES = {'bleu': 'B', 'rouge': 'R', 'vert': 'V', 'jaune': 'J'}
echecs = []


def valeur(classe, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[classe]


def grille(etiq, n):
    return [[valeur(etiq[r][c], r, c, n) for c in range(n)] for r in range(n)]


def magique(g, n):
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


def conditions(etiq, n):
    """Les deux conditions d'effectifs, ligne par ligne et colonne par colonne."""
    ok_l = all(sum(1 for c in range(n) if etiq[r][c] in 'BV') == n // 2 for r in range(n))
    ok_c = all(sum(1 for r in range(n) if etiq[r][c] in 'BJ') == n // 2 for c in range(n))
    return ok_l, ok_c


def main():
    if '--ordre' in sys.argv:
        n = int(sys.argv[sys.argv.index('--ordre') + 1])
        chemin = sys.argv[sys.argv.index('--etiquettes') + 1]
        etiq = [ligne.strip() for ligne in open(chemin) if ligne.strip()]
        ok_l, ok_c = conditions(etiq, n)
        m, pourquoi = magique(grille(etiq, n), n)
        print(f'ordre {n} : condition de ligne {ok_l}, condition de colonne {ok_c}, '
              f'magique {m}' + (f' ({pourquoi})' if pourquoi else ''))
        sys.exit(0 if m else 1)

    doc = json.load(open(os.path.join(RACINE, 'data', 'referent_256_v3.json'),
                        encoding='utf-8'))
    n = 6
    mag = lig = col = 0
    for f in doc['forms']:
        etiq = [[None] * n for _ in range(n)]
        for nom, lettre in CLASSES.items():
            for r, c in f[nom + '_positions']:
                etiq[r][c] = lettre
        etiq = [''.join(ligne) for ligne in etiq]
        a, b = conditions(etiq, n)
        lig += a
        col += b
        mag += magique(grille(etiq, n), n)[0]
    print(f'corpus des 256 carrés d’ordre 6')
    print(f'  condition de ligne   (B + V = {n // 2}) : {lig}/256')
    print(f'  condition de colonne (B + J = {n // 2}) : {col}/256')
    print(f'  carrés magiques, diagonales comprises   : {mag}/256')
    if not (lig == col == mag == 256):
        echecs.append('le corpus ne vérifie pas l’énoncé')

    # les deux conditions sont nécessaires : un contre-exemple qui en viole une
    etiq = ['B' * n for _ in range(n)]
    a, b = conditions(etiq, n)
    m, _ = magique(grille(etiq, n), n)
    print(f'  contrôle négatif (tout en B) : conditions {a}, {b} ; magique {m}')
    if m:
        echecs.append('le contrôle négatif est magique, l’énoncé est faux')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nQuatre classes, deux conditions d’effectifs, et l’ordre n’a qu’à être pair.')


if __name__ == '__main__':
    main()
