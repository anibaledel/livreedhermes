#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_pont_formes.py — la transcription entre les formes et les figures.
#
# Les deux constantes du damier se traduisent en traits, et elles se traduisent
# par le même invariant : le nombre de changements entre traits voisins d'un
# trigramme.
#
#   c = 0   le trigramme est uniforme        ☰ ciel, ☷ terre
#   c = 1   il change une fois               ☳ tonnerre, ☱ lac, ☶ montagne, ☴ vent
#   c = 2   il alterne                       ☵ eau, ☲ feu
#
# La parité de c est la clef IV : c pair, le trigramme est élémental ; c impair,
# c'est une manifestation. Le critère de palindrome et celui du changement sont
# le même critère, lu à deux finesses.
#
# 1. LA CONSTANTE DE LIGNE, EN TRAITS. Sur le damier 16 × 16, la ligne r vaut un
#    tétragramme : son trigramme t = r // 2 (tête, cœur, ventre) et son pied
#    p = r & 1. Le nombre de cases rouge ou bleue dans la moitié haute du carré
#    vaut alors, sur les 16 lignes :
#
#        v = 6 − (−1)^p × (3 − 2c)
#
#    soit 3 ou 9 quand le trigramme est uniforme, 5 ou 7 sinon, le pied
#    décidant lequel des deux. C'est une formule fermée : elle n'énumère pas,
#    elle calcule.
#
# 2. LES UNIFIED PATTERNS, EN TRAITS. Sur le damier 8 × 8, un assemblage est un
#    unified pattern si et seulement si son trigramme inférieur est le ciel ou
#    la terre, c'est-à-dire si et seulement si c = 0 pour ce trigramme. 16 sur
#    16, sans exception. Les colonnes 0 et 7 ne sont pas deux colonnes de bord :
#    ce sont ☷ et ☰.
#
# 3. LA TRANSPOSITION DE TEINTE, EN TRAITS. Parmi ces 16, la transposition est
#    rouge-bleu ↔ gris quand le trait du haut de l'hexagramme s'accorde avec la
#    valeur uniforme du trigramme inférieur, et rouge-bleu ↔ jaune quand il s'y
#    oppose. Huit de chaque.
#
# Le script échoue si l'un de ces trois points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_pont_formes.py

import sys, collections

from lldh_commun import NOM, assemblage, carres, jonctions

FUSION = {'rouge': 'RB', 'bleu': 'RB', 'vert': 'G', 'jaune': 'J'}
echecs = []


def changements(t):
    """Le nombre de changements entre traits voisins du trigramme t."""
    return sum(jonctions(t))


def unifie(g, m):
    return all(g[(r + 6) % 12][(c + 6) % 12] == m[g[r][c]]
               for r in range(12) for c in range(12))


def main():
    G = carres()

    # 0. la parité du nombre de changements est le critère d'élémental
    palindrome = lambda t: (t & 1) == ((t >> 2) & 1)
    accord = all(palindrome(t) == (changements(t) % 2 == 0) for t in range(8))
    print(f'0. c pair ⟺ trigramme élémental, sur les 8 trigrammes : {accord}')
    if not accord:
        echecs.append('la parité du nombre de changements ne redonne pas les élémentaux')

    # 1. la constante de ligne suit la formule fermée
    mesures = collections.defaultdict(set)
    for (r, c), g in G.items():
        mesures[r].add(sum(1 for i in range(3) for j in range(6)
                           if g[i][j] in ('rouge', 'bleu')))
    constantes = sum(1 for r in mesures if len(mesures[r]) == 1)
    exacts = 0
    for r in range(16):
        if len(mesures[r]) != 1:
            continue
        t, p = r >> 1, r & 1
        exacts += next(iter(mesures[r])) == 6 - (-1) ** p * (3 - 2 * changements(t))
    print(f'1. constante de ligne : {constantes}/16 lignes constantes, '
          f'{exacts}/16 conformes à v = 6 − (−1)^p × (3 − 2c)')
    if constantes != 16 or exacts != 16:
        echecs.append(f'constante de ligne : {constantes} constantes, {exacts} conformes')

    # 2. les unified patterns sont les colonnes ciel et terre
    unifies, gris, jaune = set(), set(), set()
    for R in range(8):
        for C in range(8):
            g = assemblage(G, R, C, FUSION)
            if unifie(g, {'RB': 'G', 'G': 'RB', 'J': 'J'}):
                gris.add((R, C))
            if unifie(g, {'RB': 'J', 'J': 'RB', 'G': 'G'}):
                jaune.add((R, C))
    unifies = gris | jaune
    attendus = {(R, C) for R in range(8) for C in range(8) if changements(C) == 0}
    print(f'2. unified patterns : {len(unifies)}/64, et ce sont exactement les '
          f'assemblages dont le trigramme inférieur a c = 0 : {unifies == attendus}')
    print(f'   colonnes concernées : '
          f'{", ".join(NOM[C] for C in sorted({C for _, C in unifies}))}')
    if unifies != attendus or gris & jaune:
        echecs.append('les unified patterns ne sont pas les colonnes de c = 0')

    # 3. la transposition suit le trait du haut de l'hexagramme
    bons = 0
    for (R, C) in unifies:
        uniforme = C & 1                      # la valeur commune des trois traits
        haut = (R >> 2) & 1                   # le trait du haut du trigramme supérieur
        attendu = gris if haut == uniforme else jaune
        bons += (R, C) in attendu
    print(f'3. transposition RB ↔ gris quand le trait du haut s’accorde avec le '
          f'trigramme inférieur : {bons}/{len(unifies)}')
    print(f'   RB ↔ gris : {len(gris)}, RB ↔ jaune : {len(jaune)}')
    if bons != len(unifies) or len(gris) != 8 or len(jaune) != 8:
        echecs.append(f'transposition : {bons}/{len(unifies)} conformes')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLes deux constantes du damier se lisent sur les traits, et elles se '
          'lisent par le même invariant.')


if __name__ == '__main__':
    main()
