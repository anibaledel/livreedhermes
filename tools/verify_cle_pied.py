#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_cle_pied.py — la cinquième clef, et le pied rendu aux deux axes.
#
# Notations. Pour un trigramme t, ses trois traits sont haut = (t >> 2) & 1,
# milieu = (t >> 1) & 1, bas = t & 1. Ses deux JONCTIONS sont
#   d1 = (haut ≠ milieu)   la jonction tête-cœur,
#   d2 = (milieu ≠ bas)    la jonction cœur-ventre,
# et c = d1 + d2 est le nombre de changements. Le complément d'un trigramme
# (tous ses traits échangés, t → 7 − t) laisse d1 et d2 inchangés : les
# jonctions sont ce qui survit au complément.
#
# 1. LA CINQUIÈME CLEF. Sur le damier 8 × 8, dans la superposition inhale +
#    exhale du pied androgyne (page 059), la forme BLEUE de la colonne C est la
#    forme ROUGE de la colonne 7 − C. Exactement, case pour case, sur les
#    quatre couples de colonnes opposées. Rouge et bleu d'une même colonne sont
#    par ailleurs disjoints, 48 cases chacun.
#
#    Les quatre couples de colonnes opposées sont les quatre couples de
#    trigrammes complémentaires, et ce sont donc exactement LES QUATRE VALEURS
#    DU COUPLE DE JONCTIONS (d1, d2) :
#
#        (0, 0)  terre, ciel          (0, 1)  tonnerre, vent
#        (1, 1)  eau, feu             (1, 0)  lac, montagne
#
#    La cinquième clef lit donc les deux jonctions. Elle est strictement plus
#    fine que la constante de ligne, qui ne lit que leur somme c et confond
#    tonnerre-vent avec lac-montagne.
#
# 2. LA JONCTION DU BAS, SUR LE CARRÉ D'ORDRE 6. Sur le damier 16 × 16, la
#    forme bleue d'un carré et son décalage d'une demi-période (3, 3) se
#    recouvrent sur 0 case si d2 = 0, sur 2 cases si d2 = 1 — d2 étant la
#    jonction du trigramme de la colonne. Même chose pour le rouge. La mesure
#    ne dépend pas du pied.
#
# 3. LE PIED, RENDU AUX DEUX AXES. C'est l'orientation qui le porte :
#
#        changer le pied de la COLONNE  =  miroir gauche-droite du carré
#        changer le pied de la LIGNE    =  miroir haut-bas du carré
#
#    256 carrés sur 256, dans les deux cas, et chaque miroir n'agit que sur son
#    axe. Le trigramme est porté par la forme, le pied par l'orientation.
#
# Avec la constante de ligne (verify_pont_formes.py), la correspondance est
# complète sur les deux axes : la forme donne les traits, le miroir donne le
# pied.
#
# Le script échoue si l'un de ces trois points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_cle_pied.py

import json, os, sys, collections

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT = os.path.join(RACINE, 'data', 'referent_256_v3.json')
NOM = {0b111: 'ciel', 0b101: 'feu', 0b010: 'eau', 0b000: 'terre',
       0b110: 'vent', 0b100: 'montagne', 0b011: 'lac', 0b001: 'tonnerre'}
INVERSION = {'rouge': 'bleu', 'bleu': 'rouge', 'vert': 'jaune', 'jaune': 'vert'}
echecs = []


def carre(f):
    g = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            g[r][cc] = c
    return g


def jonctions(t):
    h, m, b = (t >> 2) & 1, (t >> 1) & 1, t & 1
    return int(h != m), int(m != b)


def assemblage(G, R, C):
    g = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            p = G[(2 * R + dr, 2 * C + dc)]
            for r in range(6):
                for c in range(6):
                    g[6 * dr + r][6 * dc + c] = p[r][c]
    return g


def superposee(g, couleur):
    """La forme d'une couleur dans inhale + exhale (page 059)."""
    return frozenset((i, j) for i in range(12) for j in range(12)
                     if g[i][j] == couleur or g[(i + 6) % 12][(j + 6) % 12] == couleur)


def main():
    doc = json.load(open(REFERENT, encoding='utf-8'))
    G = {(f['row'], f['col']): carre(f) for f in doc['forms']}

    # 1. la cinquième clef
    bleu, rouge = {}, {}
    constantes = 0
    for C in range(8):
        fb = {superposee(assemblage(G, R, C), 'bleu') for R in range(8)}
        fr = {superposee(assemblage(G, R, C), 'rouge') for R in range(8)}
        constantes += len(fb) == 1 and len(fr) == 1
        bleu[C], rouge[C] = next(iter(fb)), next(iter(fr))
    echange = sum(1 for C in range(8) if bleu[C] == rouge[7 - C])
    disjoints = all(not (bleu[C] & rouge[C]) for C in range(8))
    print(f'1. formes constantes par colonne : {constantes}/8 ; '
          f'bleu(C) = rouge(7 − C) : {echange}/8 ; rouge et bleu disjoints : {disjoints}')
    if constantes != 8 or echange != 8 or not disjoints:
        echecs.append('la cinquième clef ne se vérifie pas sur les huit colonnes')

    groupes = collections.defaultdict(list)
    for C in range(8):
        groupes[jonctions(C)].append(NOM[C])
    quatre = len(groupes) == 4 and all(len(v) == 2 for v in groupes.values())
    print(f'   les colonnes opposées forment les 4 couples de jonctions : {quatre}')
    for (d1, d2), noms in sorted(groupes.items()):
        print(f'     (d1={d1}, d2={d2})  {noms[0]} / {noms[1]}')
    if not quatre:
        echecs.append('les colonnes opposées ne donnent pas les quatre couples de jonctions')

    # 2. le recouvrement au demi-décalage lit d2
    lecture = 0
    for c in range(16):
        tailles = set()
        for (r, cc), g in G.items():
            if cc != c:
                continue
            tailles.add(len({(i, j) for i in range(6) for j in range(6)
                             if g[i][j] == 'bleu' and g[(i + 3) % 6][(j + 3) % 6] == 'bleu'}))
        attendu = {0} if jonctions(c >> 1)[1] == 0 else {2}
        lecture += tailles == attendu
    print(f'2. recouvrement au demi-décalage (3, 3) : 0 case si d2 = 0, 2 si d2 = 1 — '
          f'{lecture}/16 colonnes')
    if lecture != 16:
        echecs.append(f'le recouvrement ne lit pas d2 : {lecture}/16')

    # 3. le pied est l'orientation
    miroir_h = lambda g: [r[::-1] for r in g]
    miroir_v = lambda g: g[::-1]
    col = sum(1 for (r, c) in G if miroir_h(G[(r, c)]) == G[(r, c ^ 1)])
    lig = sum(1 for (r, c) in G if miroir_v(G[(r, c)]) == G[(r ^ 1, c)])
    croise_a = sum(1 for (r, c) in G if miroir_h(G[(r, c)]) == G[(r ^ 1, c)])
    croise_b = sum(1 for (r, c) in G if miroir_v(G[(r, c)]) == G[(r, c ^ 1)])
    print(f'3. pied de la colonne = miroir gauche-droite : {col}/256 ; '
          f'pied de la ligne = miroir haut-bas : {lig}/256')
    print(f'   les axes ne se croisent pas : {croise_a}/256 et {croise_b}/256')
    if col != 256 or lig != 256 or croise_a or croise_b:
        echecs.append(f'le pied n’est pas l’orientation : {col}, {lig}, {croise_a}, {croise_b}')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLe trigramme est porté par la forme, le pied par l’orientation.')


if __name__ == '__main__':
    main()
