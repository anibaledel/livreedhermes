#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_invariants.py — les invariants de l'inspir et de l'expir (page 049),
# et la forme que porte la LIGNE du damier.
#
# Un assemblage d'ordre 12 se répète de période 12 dans les deux sens. On
# appelle invariant d'un décalage l'ensemble des cases qui gardent leur couleur
# sous ce décalage. Il y en a trois à une demi-période :
#
#   inv(6, 0)   l'invariant en ligne       96 cases
#   inv(0, 6)   l'invariant en colonne     96 cases
#   inv(6, 6)   l'invariant diagonal       48 cases
#
# 1. L'INVARIANT DES INVARIANTS NE PORTE RIEN. inv(6, 0) ∩ inv(0, 6) = inv(6, 6),
#    et cet invariant diagonal est LE MÊME sur les 64 assemblages : une seule
#    forme de 48 cases, moitié grise, moitié jaune, sans une seule case rouge
#    ni bleue. Croiser les deux invariants efface donc toute l'information.
#    C'est pourquoi elle se cherche dans les traits bicolores isolés à
#    l'intérieur d'un SEUL invariant, et non dans leur intersection.
#
# 2. L'INVARIANT EN LIGNE LIT UN TRAIT. inv(6, 0) est constant sur chacune des
#    8 lignes du damier, et ne prend que DEUX formes : l'une sur les lignes
#    0 à 3, l'autre sur les lignes 4 à 7. C'est le trait du haut du trigramme
#    supérieur, et rien d'autre. inv(0, 6) donne les deux mêmes formes,
#    échangées.
#
# 3. LES TRAITS BICOLORES DE CET INVARIANT LISENT LE TRIGRAMME ENTIER. Les cases
#    rouges ou bleues contenues dans inv(6, 0) forment un ensemble de 24 cases,
#    constant sur chacune des 8 lignes du damier, et les huit formes sont
#    distinctes. La ligne porte donc une forme, exactement comme la colonne.
#
#    C'est le pendant de la constante de colonne, et il lève la dissymétrie
#    qu'on croyait structurelle : la ligne ne porte pas seulement un nombre.
#
# 4. MAIS ELLE NE L'ÉCRIT PAS DE LA MÊME FAÇON. La forme de colonne est faite de
#    trois bascules indépendantes, une par trait. La forme de ligne est faite
#    d'un noyau fixe par moitié, plus quatre orbites appariées selon le cycle
#    00 → 01 → 10 → 11 → 00 des deux traits du bas. La colonne écrit le
#    trigramme en trois interrupteurs ; la ligne le place sur un cadran.
#
# Le script échoue si l'un de ces quatre points cesse d'être vrai.
#
# Usage : cd <racine du dépôt> && python tools/verify_invariants.py
#         --formes   dessine en plus les huit formes de ligne

import sys, collections

from lldh_commun import NOM, assemblage, carres

echecs = []


def invariant(g, dr, dc):
    """Les cases qui gardent leur couleur sous le décalage (dr, dc)."""
    return frozenset((i, j) for i in range(12) for j in range(12)
                     if g[i][j] == g[(i + dr) % 12][(j + dc) % 12])


def constantes(blocs, mesure, axe):
    """Les 8 valeurs de la mesure, si elle est constante sur chaque ligne (axe 0)
    ou chaque colonne (axe 1) du damier ; sinon None."""
    par = collections.defaultdict(set)
    for (R, C), g in blocs.items():
        par[(R, C)[axe]].add(mesure(g))
    if any(len(v) != 1 for v in par.values()):
        return None
    return {k: next(iter(v)) for k, v in par.items()}


def main():
    G = carres()
    blocs = {(R, C): assemblage(G, R, C) for R in range(8) for C in range(8)}

    # 1. l'invariant des invariants
    croise = all(invariant(g, 6, 0) & invariant(g, 0, 6) == invariant(g, 6, 6)
                 for g in blocs.values())
    diag = {invariant(g, 6, 6) for g in blocs.values()}
    couleurs = collections.Counter(g[i][j] for g in blocs.values()
                                   for i, j in invariant(g, 6, 6))
    print(f'1. inv(6,0) ∩ inv(0,6) = inv(6,6) : {croise} ; '
          f'formes diagonales distinctes sur les 64 : {len(diag)} '
          f'({len(next(iter(diag)))} cases)')
    print(f'   couleurs de l’invariant diagonal : {dict(sorted(couleurs.items()))}')
    if not croise or len(diag) != 1 or {'rouge', 'bleu'} & set(couleurs):
        echecs.append('l’invariant diagonal n’est pas universel et sans bicolore')

    # 2. l'invariant en ligne lit le trait du haut
    for dr, dc, nom in ((6, 0, 'inv(6,0)'), (0, 6, 'inv(0,6)')):
        par_ligne = constantes(blocs, lambda g: invariant(g, dr, dc), 0)
        par_col = constantes(blocs, lambda g: invariant(g, dr, dc), 1)
        n = len(set(par_ligne.values())) if par_ligne else 0
        moities = par_ligne and len({par_ligne[R] for R in range(4)}) == 1 \
            and len({par_ligne[R] for R in range(4, 8)}) == 1
        print(f'2. {nom} : constant par ligne {bool(par_ligne)}, par colonne '
              f'{bool(par_col)} ; {n} forme(s), séparant les deux moitiés : {bool(moities)}')
        if not par_ligne or par_col or n != 2 or not moities:
            echecs.append(f'{nom} ne lit pas le trait du haut du trigramme supérieur')

    # 3. les traits bicolores de l'invariant en ligne
    def bicolore(g):
        return frozenset((i, j) for (i, j) in invariant(g, 6, 0)
                         if g[i][j] in ('rouge', 'bleu'))
    formes = constantes(blocs, bicolore, 0)
    par_col = constantes(blocs, bicolore, 1)
    distinctes = len(set(formes.values())) if formes else 0
    tailles = {len(s) for s in formes.values()} if formes else set()
    print(f'3. traits bicolores de inv(6,0) : constants par ligne {bool(formes)}, '
          f'par colonne {bool(par_col)} ; {distinctes} formes distinctes de '
          f'{sorted(tailles)} cases')
    if not formes or distinctes != 8 or par_col or tailles != {24}:
        echecs.append('les traits bicolores de l’invariant ne lisent pas le trigramme')

    # 4. la structure des orbites
    if formes:
        cases = {p for s in formes.values() for p in s}
        orbites = collections.defaultdict(list)
        for p in cases:
            orbites[tuple(R for R in range(8) if p in formes[R])].append(p)
        noyaux = [k for k in orbites if len(k) == 4]
        paires = sorted(k for k in orbites if len(k) == 2)
        print(f'4. orbites : {len(orbites)} au total, dont {len(noyaux)} noyaux de '
              f'moitié et {len(paires)} paires')
        print(f'   paires de la moitié haute : {[k for k in paires if max(k) < 4]}')
        attendu = [(0, 1), (0, 3), (1, 2), (2, 3)]
        if [k for k in paires if max(k) < 4] != attendu:
            echecs.append('les paires de la moitié haute ne suivent pas le cycle attendu')

    if '--formes' in sys.argv and formes:
        for R in range(8):
            print(f'\nligne {R} — {NOM[R]} ({R:03b}), {len(formes[R])} cases')
            for i in range(6):
                print('   ' + ''.join('██' if (i, j) in formes[R] else '··'
                                      for j in range(12)))

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nLa ligne porte une forme elle aussi : les traits bicolores isolés '
          'dans son invariant.')


if __name__ == '__main__':
    main()
