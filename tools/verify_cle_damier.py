#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_cle_damier.py — la transcription entre les 16 tétragrammes et les
# 64 hexagrammes, lue sur les clefs de positionnement du damier.
#
# Les deux damiers et leurs deux constantes :
#
#   A. Le damier 16 × 16 des 256 carrés d'ordre 6 (page 047). Ligne et colonne
#      y valent chacune un tétragramme. LA LIGNE PORTE UN NOMBRE : le nombre de
#      cases rouge ou bleue dans la moitié haute du carré est constant sur
#      chacune des 16 lignes, et sur aucune colonne. C'est la mesure « haut
#      contre bas » qui sépare les figures géomantiques Fixes et Mobiles
#      (page 065).
#
#   B. Le damier 8 × 8 des 64 assemblages d'ordre 12 (Magic quadricolore,
#      pages 053 à 058). Ligne et colonne y valent chacune un trigramme, donc
#      le couple vaut un hexagramme. LA COLONNE PORTE UNE FORME : la forme
#      bleue de la superposition inhale + exhale — l'assemblage réuni à son
#      décalage d'une demi-période en ligne ET en colonne, page 058 — est la
#      même sur chacune des 8 colonnes, et sur aucune ligne. Huit colonnes,
#      huit formes distinctes.
#
#   C. Cette forme EST le trigramme, écrit en position. Elle est 6-périodique :
#      une tuile de 6 × 6 répétée quatre fois, 12 cases par tuile, réparties en
#      trois paires d'orbites de 4 cases. Chaque paire est une bascule commandée
#      par un trait du trigramme inférieur, du bord vers le centre :
#
#         trait du haut  (poids 4) : bande haute et basse  (yin)
#                                    bandes latérales      (yang)
#         trait du milieu (poids 2) : coins de la bande haute et basse (yang)
#                                    extrémités des rangs 1 et 4       (yin)
#         trait du bas   (poids 1) : centre des rangs 1 et 4 (yang)
#                                    cœur des rangs 2 et 3   (yin)
#
#      Trois traits, trois bascules, huit formes : la colonne du damier et le
#      trigramme inférieur sont la même chose écrite deux fois.
#
#   D. Ce que la bascule suppose : la forme bleue et son décalage d'une
#      demi-période ne se recouvrent jamais. 0 case commune sur les 64
#      assemblages, et leur réunion en fait exactement 48, soit le double.
#      C'est ce qui permet de lire la réunion comme une forme et non comme une
#      somme — et c'est la même demi-période que celle des unified patterns.
#
#   E. Le pont tétragramme → trigramme est la chute du pied : les poids
#      géomantiques sont tête 8, cœur 4, ventre 2, pied 1 (page 066) ; les
#      poids de l'hexagramme sont 32/16/08 pour le trigramme supérieur et
#      04/02/01 pour l'inférieur (page 067). Retirer le pied d'un tétragramme
#      laisse ses trois traits de poids 8/4/2, qui sont le trigramme.
#      Le damier 16 × 16 porte donc les tétragrammes, le damier 8 × 8 les
#      trigrammes, et le second est le premier amputé du pied : deux carrés
#      voisins d'ordre 6 qui ne diffèrent que par le pied donnent le même
#      bloc d'ordre 12. Le script le vérifie.
#
# Le script échoue si l'un de ces points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_cle_damier.py
#         --formes   dessine en plus les huit formes de colonne

import sys, collections

from lldh_commun import BASCULES, assemblage, carres, superposition

echecs = []


def tuile_du_trigramme(t):
    """Les 12 cases de la tuile 6 × 6 que le trigramme t (0 à 7) commande."""
    cases = set()
    for poids, yin, yang in BASCULES:
        cases |= yang if t & poids else yin
    return cases


def main():
    G = carres()

    # A. la constante de ligne sur le damier 16 × 16
    lignes, colonnes = collections.defaultdict(set), collections.defaultdict(set)
    for (r, c), g in G.items():
        n = sum(1 for i in range(3) for j in range(6) if g[i][j] in ('rouge', 'bleu'))
        lignes[r].add(n)
        colonnes[c].add(n)
    nl = sum(1 for r in lignes if len(lignes[r]) == 1)
    nc = sum(1 for c in colonnes if len(colonnes[c]) == 1)
    print(f'A. rouge + bleu dans la moitié haute : constant sur {nl}/16 lignes, {nc}/16 colonnes')
    print('   ' + ' '.join(f'{next(iter(lignes[r])):2d}' for r in range(16)))
    if nl != 16 or nc != 0:
        echecs.append(f'constante de ligne : {nl}/16 lignes, {nc}/16 colonnes')

    # D. la forme bleue et son décalage ne se recouvrent pas
    blocs = {(R, C): assemblage(G, R, C) for R in range(8) for C in range(8)}
    recouvrements = set()
    reunions = set()
    for g in blocs.values():
        b = {(i, j) for i in range(12) for j in range(12) if g[i][j] == 'bleu'}
        d = {((i + 6) % 12, (j + 6) % 12) for i, j in b}
        recouvrements.add(len(b & d))
        reunions.add(len(b | d))
    print(f'D. inhale ∩ exhale sur le bleu : {sorted(recouvrements)} case(s) ; '
          f'réunion : {sorted(reunions)} cases')
    if recouvrements != {0} or reunions != {48}:
        echecs.append('inhale et exhale se recouvrent sur le bleu')

    # B. la constante de colonne sur le damier 8 × 8
    formes_col, formes_lig = collections.defaultdict(set), collections.defaultdict(set)
    for (R, C), g in blocs.items():
        s = superposition(g, 'bleu')
        formes_col[C].add(s)
        formes_lig[R].add(s)
    nc = sum(1 for C in formes_col if len(formes_col[C]) == 1)
    nl = sum(1 for R in formes_lig if len(formes_lig[R]) == 1)
    distinctes = len({next(iter(formes_col[C])) for C in range(8) if len(formes_col[C]) == 1})
    print(f'B. forme bleue de inhale + exhale : constante sur {nc}/8 colonnes '
          f'({distinctes} formes distinctes), {nl}/8 lignes')
    if nc != 8 or distinctes != 8 or nl != 0:
        echecs.append(f'constante de colonne : {nc}/8 colonnes, {distinctes} distinctes, {nl}/8 lignes')

    # C. la forme est le trigramme inférieur
    bons = 0
    for C in range(8):
        if len(formes_col[C]) != 1:
            continue
        tuile = tuile_du_trigramme(C)
        pavage = frozenset((i, j) for i in range(12) for j in range(12)
                           if (i % 6, j % 6) in tuile)
        bons += pavage == next(iter(formes_col[C]))
    print(f'C. la forme de la colonne C est le trigramme C écrit en position : {bons}/8')
    if bons != 8:
        echecs.append(f'lecture du trigramme : {bons}/8 colonnes')

    # E. le pont tétragramme → trigramme est la chute du pied
    # deux colonnes du damier 16 × 16 qui ne diffèrent que par le pied (poids 1,
    # donc c et c ^ 1) tombent dans le même bloc d'ordre 12, de colonne c // 2.
    apparies = all((c ^ 1) // 2 == c // 2 for _, c in G)
    print(f'E. deux colonnes ne différant que par le pied tombent dans le même '
          f'bloc : {apparies} — 16 tétragrammes pour 8 trigrammes')
    if not apparies:
        echecs.append('l’appariement des colonnes n’est pas la chute du pied')

    if '--formes' in sys.argv:
        for C in range(8):
            t = tuile_du_trigramme(C)
            print(f'\ncolonne {C} — trigramme {C:03b} (haut → bas : '
                  f'{"yang" if C & 4 else "yin"}, {"yang" if C & 2 else "yin"}, '
                  f'{"yang" if C & 1 else "yin"})')
            for i in range(6):
                print('   ' + ''.join('██' if (i, j) in t else '··' for j in range(6)))

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLa ligne du damier porte un nombre, la colonne porte une forme, '
          'et cette forme est le trigramme.')


if __name__ == '__main__':
    main()
