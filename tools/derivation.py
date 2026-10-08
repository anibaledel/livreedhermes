#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# derivation.py — ce qui se démontre, et ce qui s'observe.
#
# POURQUOI CE SCRIPT. Les autres vérificateurs répondent « 256/256 ». C'est une
# vérification exhaustive, ce n'est pas une démonstration : le corpus n'est pas
# engendré par une règle dont on pourrait déduire les énoncés, il est LU sur le
# SVG de la planche 047 (voir generate_referent_256.py). Il n'y a donc pas de
# règle génératrice d'où partir.
#
# Mais il y a une STRUCTURE, et elle se vérifie en une ligne. Une fois posée,
# certaines clefs en découlent par simple déduction, et n'ont plus à être
# comptées. Ce script sépare les deux.
#
# L'HYPOTHÈSE H1 — les voisins sont des miroirs.
#
#     Sur le damier 16 × 16, le carré de la colonne impaire est le miroir
#     gauche-droite de son voisin de gauche, et celui de la ligne impaire est
#     le miroir haut-bas de son voisin du dessus.
#
#     128/128 dans chaque sens. C'est un fait sur le corpus, et c'est le SEUL
#     qu'on suppose ici.
#
# CE QUI EN DÉCOULE, sans rien compter :
#
#   D1. « Le pied est l'orientation. » Le pied de la colonne est la parité de
#       C, celui de la ligne la parité de R. H1 dit exactement que passer à
#       C ^ 1 est le miroir gauche-droite et que passer à R ^ 1 est le miroir
#       haut-bas. La clef n'est donc pas un énoncé de plus : c'est H1 réécrite.
#       Le 256/256 de verify_cle_pied.py mesure H1, pas autre chose.
#
#   D2. « Les deux axes ne se croisent jamais. » Le miroir gauche-droite change
#       C et laisse R, le miroir haut-bas l'inverse : c'est la même phrase lue
#       dans l'autre sens. Le 0/256 est automatique.
#
#   D3. « La chute du pied. » Les quatre carrés d'un bloc 2 × 2 sont, par H1,
#       un carré et ses trois miroirs. L'assemblage est donc entièrement
#       déterminé par n'importe lequel des quatre : il ne dépend pas des deux
#       pieds, et le damier 8 × 8 est bien le 16 × 16 quotienté par eux. La
#       chute du pied cesse d'être un fait de numérotation.
#
#   D4. Un bloc 2 × 2 a un GÉNÉRATEUR, et toute propriété de l'assemblage est
#       une propriété de ce générateur. Les 256 carrés sont 64 générateurs à
#       quatre orientations, et non 256 objets indépendants.
#
# CE QUI NE S'EN DÉDUIT PAS, et reste une observation sur ce corpus-là :
#
#   O1. la forme bleue de la superposition, constante sur chaque colonne du
#       damier 8 × 8, et ses huit valeurs distinctes ;
#   O2. la constante de ligne et sa formule fermée ;
#   O3. l'échange bleu / rouge entre colonnes opposées ;
#   O4. le caractère unified pattern et sa coïncidence avec c = 0.
#
#   Toutes les quatre portent sur la PLACE des 64 générateurs sur le damier
#   8 × 8, et H1 ne dit rien de cette place : le script le montre en cherchant
#   une relation entre blocs voisins, et n'en trouve aucune qui vaille pour
#   tous.
#
# CE QUE ÇA CHANGE. L'article annonçait cinq mesures indépendantes qui tombent
# d'accord. Il en reste quatre : la cinquième était la structure elle-même.
# C'est une perte apparente et un gain réel — un énoncé démontré vaut mieux
# qu'un énoncé compté, et les quatre autres sont d'autant plus remarquables
# qu'elles ne découlent de rien.
#
# Usage : cd <racine du dépôt> && python tools/derivation.py

import json, os, sys, collections

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT = os.path.join(RACINE, 'data', 'referent_256_v3.json')
echecs = []

H = lambda g: [r[::-1] for r in g]
V = lambda g: g[::-1]
D = lambda g: [r[::-1] for r in g[::-1]]
T = lambda g: [[g[j][i] for j in range(6)] for i in range(6)]


def carre(f):
    g = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            g[r][cc] = c
    return g


def assemblage(G, R, C):
    g = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            p = G[(2 * R + dr, 2 * C + dc)]
            for r in range(6):
                for c in range(6):
                    g[6 * dr + r][6 * dc + c] = p[r][c]
    return g


def permutation(a, b):
    """La permutation de couleurs qui envoie a sur b, ou None."""
    m = {}
    for i in range(6):
        for j in range(6):
            x, y = a[i][j], b[i][j]
            if m.setdefault(x, y) != y:
                return None
    return tuple(sorted(m.items()))


def main():
    doc = json.load(open(REFERENT, encoding='utf-8'))
    G = {(f['row'], f['col']): carre(f) for f in doc['forms']}

    # H1
    h = sum(1 for R in range(16) for C in range(0, 16, 2)
            if G[(R, C + 1)] == H(G[(R, C)]))
    v = sum(1 for C in range(16) for R in range(0, 16, 2)
            if G[(R + 1, C)] == V(G[(R, C)]))
    print(f'H1  colonne paire → impaire = miroir gauche-droite : {h}/128')
    print(f'H1  ligne  paire → impaire = miroir haut-bas       : {v}/128')
    if h != 128 or v != 128:
        echecs.append('H1 est fausse : le reste de ce script ne tient plus')

    # D3 / D4 : l'assemblage est déterminé par son générateur seul
    reconstruits = 0
    for R in range(8):
        for C in range(8):
            g = G[(2 * R, 2 * C)]
            attendu = [[None] * 12 for _ in range(12)]
            for (dr, dc), op in (((0, 0), lambda x: x), ((0, 1), H),
                                 ((1, 0), V), ((1, 1), D)):
                b = op(g)
                for r in range(6):
                    for c in range(6):
                        attendu[6 * dr + r][6 * dc + c] = b[r][c]
            reconstruits += (attendu == assemblage(G, R, C))
    print(f'D3  assemblage reconstruit à partir du seul générateur : '
          f'{reconstruits}/64')
    if reconstruits != 64:
        echecs.append('l’assemblage ne se déduit pas du générateur : D3 tombe')

    # D4 : 64 générateurs, et les 256 carrés sont leurs orientations
    gen = {(R, C): G[(2 * R, 2 * C)] for R in range(8) for C in range(8)}
    distincts = len({tuple(map(tuple, g)) for g in gen.values()})
    print(f'D4  générateurs distincts : {distincts}/64 — les 256 carrés sont '
          f'{distincts} formes à quatre orientations')
    if distincts != 64:
        echecs.append('les générateurs ne sont pas distincts')

    # ce qui ne se déduit pas : aucune relation uniforme entre blocs voisins
    ops = {'identité': lambda g: g, 'miroir h': H, 'miroir v': V,
           'demi-tour': D, 'transposition': T}
    rel = collections.Counter()
    paires = 0
    for R in range(8):
        for C in range(7):
            paires += 1
            for nom, op in ops.items():
                p = permutation(op(gen[(R, C)]), gen[(R, C + 1)])
                if p:
                    rel[nom] += 1
    best = max(rel.values()) if rel else 0
    print(f'O   relation uniforme entre blocs voisins : la meilleure vaut '
          f'{best}/{paires} — il n’y en a aucune')
    if best >= paires:
        echecs.append('une relation uniforme existe : O1 à O4 pourraient se déduire')

    print()
    print('Démontré à partir de H1 : le pied est l’orientation, les deux axes ne')
    print('se croisent pas, la chute du pied, et les 64 générateurs.')
    print('Observé, et déduit de rien : la forme de colonne, la constante de')
    print('ligne, l’échange entre colonnes opposées, les unified patterns.')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
