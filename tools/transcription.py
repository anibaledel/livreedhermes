#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# transcription.py — la transcription entre les 64 assemblages d'ordre 12 et
# les 64 hexagrammes, par LECTURE des formes et non par leur position.
#
# Le principe, en une phrase : les deux trigrammes sont déjà écrits dans
# l'assemblage, chacun par un procédé à lui, et il suffit de les lire.
#
# LECTURE DU TRIGRAMME INFÉRIEUR — trois bascules
#   On réunit l'assemblage à son décalage d'une demi-période en ligne ET en
#   colonne (la superposition inspir + exhale, page 058), on garde la forme
#   bleue, et on lit ses trois bascules du bord vers le centre. Chaque bascule
#   est une paire d'orbites de quatre cases : la case occupée dit le trait.
#   Le trait du haut est sur l'anneau extérieur de la tuile, celui du milieu
#   sur l'anneau médian, celui du bas au cœur.
#
# LECTURE DU TRIGRAMME SUPÉRIEUR — l'invariant en ligne
#   On garde les cases qui conservent leur couleur sous le décalage d'une
#   demi-période en LIGNE seule, puis, parmi elles, les rouges et les bleues.
#   Il en reste vingt-quatre, et la forme obtenue est l'une de huit.
#   Son trait du haut se lit sans table : l'invariant lui-même ne prend que
#   deux formes, et leurs complémentaires dans le quadrant sont deux croix
#   ansées, transposées l'une de l'autre. Les deux autres traits demandent
#   un point de départ sur le cycle à quatre : c'est la seule convention de
#   toute la transcription, et elle est inscrite dans CYCLE ci-dessous.
#
# L'HEXAGRAMME est le couple des deux trigrammes lus. Il n'y a pas d'étape de
# plus : ni ordre, ni rang, ni numérotation.
#
# LES QUATRE VÉRIFICATIONS — ce qui rend la lecture réfutable
#   1. les deux lectures sont indépendantes (opérations et supports
#      différents) et doivent redonner la case du damier, 64 fois sur 64 ;
#   2. la parité du nombre de jonctions de chaque trigramme lu doit redonner
#      élémental ou manifestation ;
#   3. le caractère unified pattern doit coïncider avec « trigramme inférieur
#      sans jonction », c'est-à-dire ciel ou terre ;
#   4. la constante de ligne du damier 16 × 16 doit valoir
#      v = 6 − (−1)^pied × (3 − 2c).
#
# Usage : cd <racine du dépôt> && python tools/transcription.py
#         --table   imprime la table des 64
#         --json    réécrit data/transcription-64.json s'il est identique au
#                   recalcul ; s'il diffère, le script le laisse intact et
#                   échoue, pour que l'écart reste lisible sur le disque

import json, os, sys, collections

# BASCULES (les trois bascules du trigramme inférieur) et CYCLE (la seule
# convention : le point de départ et le sens du cycle à quatre des deux traits
# du bas du trigramme supérieur) sont dans lldh_commun.py.
from lldh_commun import (BASCULES, CYCLE, ELEMENTAUX, NOM, RACINE, assemblage,
                         carres, jonctions as jonctions_d, superposition)

echecs = []


def jonctions(t):
    return sum(jonctions_d(t))


def lire_inferieur(g):
    """Les trois bascules de la forme bleue de la superposition diagonale."""
    forme = superposition(g, 'bleu')
    tuile = {(i % 6, j % 6) for i, j in forme}
    t = 0
    for poids, yin, yang in BASCULES:
        a, b = bool(tuile & yang), bool(tuile & yin)
        if a == b:
            return None            # bascule illisible : les deux ou aucune
        if a:
            t |= poids
    return t


def lire_superieur(g, cles):
    """La forme des traits bicolores de l'invariant en ligne, décodée."""
    inv = {(i, j) for i in range(12) for j in range(12)
           if g[i][j] == g[(i + 6) % 12][j]}
    forme = frozenset((i, j) for (i, j) in inv if g[i][j] in ('rouge', 'bleu'))
    return cles.get(forme)


def cles_superieur(G):
    """Les huit formes de l'invariant en ligne, avec leur trigramme.

    Le trait du haut est intrinsèque : l'invariant ne prend que deux formes,
    une par moitié du damier. Les deux autres traits suivent CYCLE."""
    cles, moities = {}, {}
    for R in range(8):
        g = assemblage(G, R, 0)
        inv = frozenset((i, j) for i in range(12) for j in range(12)
                        if g[i][j] == g[(i + 6) % 12][j])
        moities.setdefault(inv, len(moities))
    for R in range(8):
        g = assemblage(G, R, 0)
        inv = frozenset((i, j) for i in range(12) for j in range(12)
                        if g[i][j] == g[(i + 6) % 12][j])
        forme = frozenset((i, j) for (i, j) in inv if g[i][j] in ('rouge', 'bleu'))
        haut = moities[inv]
        cles[forme] = (haut << 2) | CYCLE[R % 4]
    return cles


def main():
    G = carres()
    blocs = {(R, C): assemblage(G, R, C) for R in range(8) for C in range(8)}
    cles = cles_superieur(G)

    lus, table = 0, []
    for (R, C), g in sorted(blocs.items()):
        bas = lire_inferieur(g)
        haut = lire_superieur(g, cles)
        if bas is None or haut is None:
            echecs.append(f'assemblage ({R}, {C}) illisible')
            continue
        lus += (haut, bas) == (R, C)
        table.append({
            'rang': R, 'colonne': C,
            'trigramme_superieur': NOM[haut], 'trigramme_inferieur': NOM[bas],
            'hexagramme': 8 * haut + bas,
            'fond': ('gris' if NOM[haut] in ELEMENTAUX and NOM[bas] in ELEMENTAUX else
                     'ciel' if NOM[haut] not in ELEMENTAUX and NOM[bas] not in ELEMENTAUX else
                     'nuit' if NOM[haut] in ELEMENTAUX else 'bleu foncé'),
            'tetragramme': ((haut >> 1) << 2) | (bas >> 1),
            'unified_pattern': jonctions(bas) == 0,
        })
    print(f'1. lectures redonnant la case du damier : {lus}/64')
    if lus != 64:
        echecs.append(f'{64 - lus} assemblages mal lus')
    print(f'   (le trigramme inférieur se lit sans convention ; celui du '
          f'supérieur suit CYCLE = {[f"{v:02b}" for v in CYCLE]}, point de '
          f'départ du cycle à quatre — un autre choix renumérote les huit '
          f'formes de ligne et fait tomber ce 64/64)')

    # 2. parité des jonctions = élémental ou manifestation
    bons = sum(1 for e in table
               if (e['trigramme_superieur'] in ELEMENTAUX) ==
                  (jonctions([k for k, v in NOM.items() if v == e['trigramme_superieur']][0]) % 2 == 0)
               and (e['trigramme_inferieur'] in ELEMENTAUX) ==
                  (jonctions([k for k, v in NOM.items() if v == e['trigramme_inferieur']][0]) % 2 == 0))
    print(f'2. parité des jonctions = élémental / manifestation : {bons}/{len(table)}')
    if bons != len(table):
        echecs.append('la parité des jonctions ne redonne pas les élémentaux')

    # 3. unified pattern
    def unifie(g, m):
        F = {'rouge': 'RB', 'bleu': 'RB', 'vert': 'G', 'jaune': 'J'}
        q = [[F[g[i][j]] for j in range(12)] for i in range(12)]
        return all(q[(r + 6) % 12][(c + 6) % 12] == m[q[r][c]]
                   for r in range(12) for c in range(12))
    mesure = {(e['rang'], e['colonne']) for e in table if e['unified_pattern']}
    reel = {k for k, g in blocs.items()
            if unifie(g, {'RB': 'G', 'G': 'RB', 'J': 'J'})
            or unifie(g, {'RB': 'J', 'J': 'RB', 'G': 'G'})}
    print(f'3. unified patterns prédits par la lecture : {len(mesure)}, '
          f'observés : {len(reel)}, identiques : {mesure == reel}')
    if mesure != reel:
        echecs.append('les unified patterns prédits ne sont pas les observés')

    # 4. la constante de ligne du damier 16 × 16
    mes = collections.defaultdict(set)
    for (r, c), g in G.items():
        mes[r].add(sum(1 for i in range(3) for j in range(6)
                       if g[i][j] in ('rouge', 'bleu')))
    exacts = sum(1 for r in range(16) if len(mes[r]) == 1
                 and next(iter(mes[r])) == 6 - (-1) ** (r & 1) * (3 - 2 * jonctions(r >> 1)))
    print(f'4. constante de ligne conforme à la formule : {exacts}/16')
    if exacts != 16:
        echecs.append('la constante de ligne ne suit pas la formule')

    if '--table' in sys.argv:
        print('\nR C  trigrammes            hex  tétra  fond        unified')
        for e in table:
            print(f'{e["rang"]} {e["colonne"]}  {e["trigramme_superieur"]:>9s} / '
                  f'{e["trigramme_inferieur"]:<9s} {e["hexagramme"]:3d}  {e["tetragramme"]:04b}   '
                  f'{e["fond"]:<10s}  {"oui" if e["unified_pattern"] else ""}')

    if '--json' in sys.argv:
        cible = os.path.join(RACINE, 'data', 'transcription-64.json')
        doc = {
            '_doc': "La transcription entre les 64 assemblages d'ordre 12 et les 64 "
                    "hexagrammes, obtenue en LISANT les deux trigrammes sur les formes : "
                    "les trois bascules de la forme bleue de la superposition diagonale "
                    "pour le trigramme inférieur, les traits bicolores de l'invariant en "
                    "ligne pour le supérieur. Écrit et vérifié par tools/transcription.py --json.",
            'source': 'data/referent_256_v3.json',
            'convention': "Le sens du cycle à quatre des deux traits du bas du trigramme "
                          "supérieur ; tout le reste est contraint.",
            'assemblages': table,
        }
        rendu = json.dumps(doc, ensure_ascii=False, indent=1) + '\n'
        if os.path.exists(cible) and open(cible, encoding='utf-8').read() != rendu:
            # On n'écrit PAS : écraser effacerait l'écart qu'on vient de constater.
            echecs.append(f'{cible} diffère de ce que le script recalcule ; '
                          f'fichier laissé intact')
            print(f'\n{cible} diffère du recalcul — fichier NON réécrit')
        else:
            open(cible, 'w', encoding='utf-8').write(rendu)
            print(f'\n{len(table)} assemblages écrits dans data/transcription-64.json')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLes deux trigrammes se lisent sur l’assemblage, et leur couple est l’hexagramme.')


if __name__ == '__main__':
    main()
