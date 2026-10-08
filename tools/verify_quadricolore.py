#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_quadricolore.py — les 64 motifs de la galerie Magic quadricolore sont
# l'échiquier de la page 047, en trois teintes au lieu de quatre.
#
# L'énoncé vérifié, en entier :
#   1. chaque fichier assets/unified-motifs/<n>.svg porte exactement 144
#      rectangles sur une grille 12 × 12, et 48 de chacune des trois teintes ;
#   2. chaque motif est l'assemblage 2 × 2 de quatre carrés d'ordre 6 voisins
#      de data/referent_256_v3.json — mêmes quatre carrés que les 64 grilles
#      d'ordre 12 de verif_protocole.py (constante magique 870) ;
#   3. le passage de quatre couleurs à trois est la fusion du rouge et du bleu
#      en une seule teinte, le gris (nommé « vert » dans les données) et le
#      jaune gardant chacun la leur. C'est le seul regroupement des quatre
#      couleurs qui donne trois parts égales : 6 + 6 = 12, 12, 12 par carré,
#      donc 48 / 48 / 48 par motif ;
#   4. l'affectation des trois teintes est la même dans les 64 fichiers ;
#   5. les 64 motifs correspondent à 64 assemblages distincts : une bijection
#      avec les 8 × 8 blocs de l'échiquier ;
#   6. 16 des 64 sont des « unified patterns » : le motif garde sa forme quand
#      on le décale d'une demi-période en ligne ET en colonne (6 cases dans
#      chaque sens) à une transposition de teinte près. La teinte transposée
#      est toujours celle du rouge-bleu fusionné, contre le gris ou contre le
#      jaune. Ces 16 sont les deux colonnes de côté de l'échiquier, C = 0 et
#      C = 7, huit chacune ; les deux transpositions y découpent des moitiés
#      croisées (rangs 0-3 d'une colonne avec rangs 4-7 de l'autre).
#
# Le script échoue si l'un de ces cinq points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_quadricolore.py
#         --table   écrit en plus la correspondance motif → bloc

import json, os, re, sys, itertools, collections

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = os.path.join(RACINE, 'assets', 'unified-motifs')
REFERENT = os.path.join(RACINE, 'data', 'referent_256_v3.json')
FUSION = {'rouge': 'RB', 'bleu': 'RB', 'vert': 'G', 'jaune': 'J'}
echecs = []


def grille_svg(chemin):
    """Les 144 rectangles d'un motif, rangés en 12 × 12 selon leurs coordonnées."""
    s = open(chemin, encoding='utf-8').read()
    rects = re.findall(r'<rect class="(cls-\d)" x="([\d.]+)" y="([\d.]+)"', s)
    if len(rects) != 144:
        return None, f'{len(rects)} rectangles au lieu de 144'
    xs = [float(r[1]) for r in rects]
    ys = [float(r[2]) for r in rects]
    x0, y0, pas = min(xs), min(ys), (max(xs) - min(xs)) / 11
    g = [[None] * 12 for _ in range(12)]
    for cls, x, y in rects:
        c, r = round((float(x) - x0) / pas), round((float(y) - y0) / pas)
        if not (0 <= r < 12 and 0 <= c < 12) or g[r][c] is not None:
            return None, 'les rectangles ne tombent pas sur une grille 12 × 12'
        g[r][c] = cls
    compte = collections.Counter(v for ligne in g for v in ligne)
    if sorted(compte.values()) != [48, 48, 48]:
        return None, f'teintes mal réparties : {dict(compte)} au lieu de 48 / 48 / 48'
    return g, None


def couleurs6(f):
    col = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            col[r][cc] = c
    return col


def assemblage(formes, R, C):
    """Le bloc 2 × 2 de l'échiquier en (R, C), fusionné en trois teintes."""
    G = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            p = couleurs6(formes[(2 * R + dr, 2 * C + dc)])
            for r in range(6):
                for c in range(6):
                    G[6 * dr + r][6 * dc + c] = FUSION[p[r][c]]
    return G


def main():
    doc = json.load(open(REFERENT, encoding='utf-8'))
    formes = {(f['row'], f['col']): f for f in doc['forms']}

    # point 3, sur les données : la répartition 6 / 6 / 12 / 12 est constante
    effectifs = {tuple(len(f[k + '_positions']) for k in ('rouge', 'bleu', 'vert', 'jaune'))
                 for f in doc['forms']}
    print(f'1. répartition des couleurs sur les 256 carrés : {effectifs.pop() if len(effectifs) == 1 else effectifs}')
    if effectifs:
        echecs.append('la répartition des couleurs n’est pas constante sur les 256 carrés')

    cibles = {(R, C): assemblage(formes, R, C) for R in range(8) for C in range(8)}
    classes = ['cls-1', 'cls-2', 'cls-3']

    trouve, illisibles = {}, []
    for n in range(1, 65):
        chemin = os.path.join(SVG, f'{n}.svg')
        if not os.path.exists(chemin):
            illisibles.append((n, 'fichier absent')); continue
        g, err = grille_svg(chemin)
        if g is None:
            illisibles.append((n, err)); continue
        for perm in itertools.permutations(classes):
            m = dict(zip(('RB', 'G', 'J'), perm))
            for k, t in cibles.items():
                if all(g[r][c] == m[t[r][c]] for r in range(12) for c in range(12)):
                    trouve[n] = (k, m); break
            if n in trouve: break

    print(f'2. motifs lus en 12 × 12, 48 par teinte : {64 - len(illisibles)}/64')
    for n, err in illisibles:
        echecs.append(f'{n}.svg : {err}')

    print(f'3. motifs retrouvés dans le référent, case par case : {len(trouve)}/64')
    if len(trouve) != 64:
        echecs.append(f'{64 - len(trouve)} motifs sans assemblage correspondant')

    teintes = {tuple(sorted(m.items())) for _, m in trouve.values()}
    print(f'4. affectations de teintes distinctes : {len(teintes)}')
    if len(teintes) > 1:
        echecs.append('l’affectation des teintes n’est pas la même dans tous les fichiers')
    elif teintes:
        print('   ' + ', '.join(f'{k} → {v}' for k, v in sorted(teintes.pop())))

    blocs = {k for k, _ in trouve.values()}
    print(f'5. assemblages distincts : {len(blocs)}/64')
    if len(blocs) != len(trouve):
        echecs.append('deux motifs renvoient au même assemblage')

    # 6. les unified patterns : invariance par demi-décalage diagonal
    def unifie(G, m):
        return all(G[(r + 6) % 12][(c + 6) % 12] == m[G[r][c]]
                   for r in range(12) for c in range(12))
    avec_gris  = {k for k, t in cibles.items() if unifie(t, {'RB': 'G', 'G': 'RB', 'J': 'J'})}
    avec_jaune = {k for k, t in cibles.items() if unifie(t, {'RB': 'J', 'J': 'RB', 'G': 'G'})}
    unifies = avec_gris | avec_jaune
    colonnes = collections.Counter(C for _, C in unifies)
    print(f'6. unified patterns (demi-décalage diagonal, une teinte transposée) : {len(unifies)}/64')
    print(f'   RB ↔ gris : {len(avec_gris)}, RB ↔ jaune : {len(avec_jaune)}, '
          f'les deux : {len(avec_gris & avec_jaune)}')
    print(f'   colonnes de l’échiquier : {dict(sorted(colonnes.items()))}')
    if len(unifies) != 16 or avec_gris & avec_jaune or sorted(colonnes) != [0, 7]:
        echecs.append(f'unified patterns : {len(unifies)} au lieu de 16, '
                      f'colonnes {sorted(colonnes)} au lieu de [0, 7]')

    if '--table' in sys.argv:
        print('\nmotif → bloc de l’échiquier (R, C)')
        for n in sorted(trouve):
            (R, C), _ = trouve[n]
            print(f'   {n:2d}.svg  →  R={R} C={C}   (carrés {2*R}-{2*R+1} × {2*C}-{2*C+1})')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLes 64 motifs de Magic quadricolore sont l’échiquier de la page 047, '
          'rouge et bleu fondus en une teinte ; 16 d’entre eux sont des unified patterns.')


if __name__ == '__main__':
    main()
