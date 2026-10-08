#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# croix_auto.py — la croix ansée n'est pas un dessin libre : le carré la donne.
#
# CE QUE LE CARRÉ IMPOSE. Dans un carré auto-construit, la complémentaire d'une
# case (somme n²+1) se trouve toujours à l'une de trois places : le demi-tour
# (r, c) ↔ (n−1−r, n−1−c), le miroir horizontal (r, c) ↔ (r, n−1−c), le miroir
# vertical (r, c) ↔ (n−1−r, c). Le carré décide laquelle, case par case. Donc le
# tracé des traits n'est pas choisi : il est LU sur le carré.
#
# À l'ordre 6, sur les 256 étiquetages du corpus, le partage est exactement par
# tiers — 12 cases en demi-tour, 12 en miroir horizontal, 12 en miroir vertical,
# et les 12 du demi-tour sont précisément les deux diagonales. C'est ce qui rend
# la planche 040 possible : les 24 cases hors diagonales se répartissent en six
# traits horizontaux et six traits verticaux, un par ligne et un par colonne.
#
#
# LA SYMÉTRIE CENTRALE EST UN LEMME, PAS UNE CONTRAINTE. Soit (r, c) hors
# diagonales ; son orbite {(r,c), (r,c̄), (r̄,c), (r̄,c̄)} est entièrement hors
# diagonales. Si (r, c) est appariée horizontalement, c'est avec (r, c̄) ; il
# reste (r̄, c) et (r̄, c̄), qui ne peuvent plus s'apparier qu'entre elles, donc
# horizontalement aussi. Même raisonnement pour le vertical. Une orbite est donc
# tout horizontale ou tout verticale, jamais mixte, et toute figure
# satisfaisant la condition I est centralement symétrique — à tout ordre pair. C'est ce que `croix_ansee.py`
# constatait par énumération à l'ordre 6 ; l'argument d'orbite le démontre.
#
# C'est aussi pourquoi l'énumération ci-dessous, qui prend UN bit par orbite,
# présuppose la symétrie au lieu de la tester : elle ne peut donc pas servir à
# l'établir. Et la symétrie n'entraîne pas la parité — à l'ordre 6, les 64
# figures sont toutes centralement symétriques, 8 seulement tiennent la parité
# des lignes et 2 celle des lignes et des colonnes.
#
# LA CONDITION I DÉTERMINE UNE FIGURE CANDIDATE : les paires par demi-tour sont
# exactement les 2n cases des diagonales. Cette figure est une CROIX ANSÉE au
# sens de la planche 040 lorsqu'elle satisfait aussi les critères II et III —
# un nombre impair de traits par ligne et par colonne. À l'ordre 6 les deux
# coïncident, et ce script l'affiche ; dès l'ordre 10 non (voir parite_suit.py),
# de sorte que l'assertion d'équivalence porte ici sur I + II + III.
#
# Ce script compte, à l'ordre n, combien d'étiquetages magiques y satisfont et
# combien de figures distinctes en sortent.
#
# Usage : cd <racine du dépôt> && python tools/croix_auto.py [--ordre N]

import collections, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

LETTRE = {'rouge': 'R', 'bleu': 'B', 'vert': 'V', 'jaune': 'J'}


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def places(g, n):
    """Pour chaque case, où est sa complémentaire : 'T' demi-tour,
    'H' miroir horizontal, 'V' miroir vertical, '?' ailleurs."""
    val = {(r, c): valeur(g[r][c], r, c, n)
           for r in range(n) for c in range(n)}
    pos = {v: rc for rc, v in val.items()}
    out = {}
    for (r, c), v in val.items():
        r2, c2 = pos[n * n + 1 - v]
        if (r2, c2) == (n - 1 - r, n - 1 - c):
            out[(r, c)] = 'T'
        elif (r2, c2) == (r, n - 1 - c):
            out[(r, c)] = 'H'
        elif (r2, c2) == (n - 1 - r, c):
            out[(r, c)] = 'V'
        else:
            out[(r, c)] = '?'
    return out


def figure(g, n):
    """La figure de traits lue sur le carré, ou None si les paires par
    demi-tour ne sont pas exactement les deux diagonales."""
    p = places(g, n)
    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    for rc, k in p.items():
        if k == '?':
            return None
        if (k == 'T') != (rc in diag):
            return None
    traits = set()
    for (r, c), k in p.items():
        if k == 'H':
            traits.add(frozenset({(r, c), (r, n - 1 - c)}))
        elif k == 'V':
            traits.add(frozenset({(r, c), (n - 1 - r, c)}))
    return frozenset(traits)


def criteres(traits, n):
    """Les critères II et III de la planche 040, lignes et colonnes."""
    h = [sum(1 for t in traits if all(x[0] == r for x in t)) for r in range(n)]
    v = [sum(1 for t in traits if all(x[1] == c for x in t)) for c in range(n)]
    return (all(x % 2 == 1 for x in h), all(x % 2 == 1 for x in v),
            tuple(h), tuple(v))


def dessin(traits, n):
    W = 2 * n - 1
    g = [[' '] * W for _ in range(W)]
    for r in range(n):
        for c in range(n):
            g[2 * r][2 * c] = '·'
    for t in traits:
        (r1, c1), (r2, c2) = sorted(t)
        if r1 == r2:
            for c in range(2 * c1, 2 * c2 + 1):
                g[2 * r1][c] = '─' if g[2 * r1][c] in ' ·' else '┼'
        else:
            for r in range(2 * r1, 2 * r2 + 1):
                g[r][2 * c1] = '│' if g[r][2 * c1] in ' ·' else '┼'
    return '\n'.join(''.join(l) for l in g)


def rapport(nom, grilles, n):
    """Compte séparément ce que la condition I donne et ce que I + II + III
    donne : à l'ordre 6 les deux coïncident, mais `parite_suit.py` montre que
    dès l'ordre 10 la condition I n'entraîne plus la parité."""
    figures, sans, profils = collections.Counter(), 0, collections.Counter()
    croix = 0
    for g in grilles:
        f = figure(g, n)
        if f is None:
            sans += 1
            continue
        a, b, h, v = criteres(f, n)
        figures[f] += 1
        if a and b:
            croix += 1
        profils[(a and b, tuple(sorted(h)), tuple(sorted(v)))] += 1
    print(f'{nom} — {len(grilles)} étiquetage(s)')
    print(f'    sans figure candidate (condition I non satisfaite) : {sans}')
    print(f'    avec figure candidate (condition I satisfaite)     : '
          f'{sum(figures.values())}')
    print(f'    dont croix ansées (I + II + III)                   : {croix}')
    print(f'    figures distinctes                                 : '
          f'{len(figures)}')
    for (ok, h, v), k in sorted(profils.items()):
        print(f'      {k:6d} : critères {"tenus" if ok else "non tenus"}, '
              f'traits par ligne {list(h)}, par colonne {list(v)}')
    return figures


def corpus6():
    for chemin in (os.path.join(os.path.dirname(ICI), 'data',
                                'referent_256_v3.json'),
                   os.path.join(ICI, 'repo-lldh', 'data',
                                'referent_256_v3.json')):
        if os.path.exists(chemin):
            doc = json.load(open(chemin, encoding='utf-8'))
            out = []
            for f in doc['forms']:
                e = [[None] * 6 for _ in range(6)]
                for coul, l in LETTRE.items():
                    for r, c in f[coul + '_positions']:
                        e[r][c] = l
                out.append([''.join(x) for x in e])
            return out
    return []


def main():
    av = sys.argv
    n = int(av[av.index('--ordre') + 1]) if '--ordre' in av else 6
    if n == 6:
        c = corpus6()
        if c:
            figs = rapport('corpus d’ordre 6', c, 6)
            for f in figs:
                print(dessin(f, 6))
                print()
        cache = os.path.join(ICI, 'pavables6.json')
        if os.path.exists(cache):
            d = json.load(open(cache))
            rapport('tous les étiquetages magiques d’ordre 6', d['tous'], 6)
            equivalence(d)
        return
    autre_ordre(n)


def equivalence(d, n=6):
    """L'équivalence triple, vérifiée ensemble par ensemble et non en cardinal :
    condition d'effectifs par colonne ⟺ porte une croix ansée ⟺ pave.

    « Porte une croix ansée » est pris ici au sens exact de la planche 040 :
    la condition I (les paires par demi-tour sont celles des diagonales) ET les
    critères II–III de parité, lignes et colonnes. L'assertion porte donc sur la
    définition publiée, et non sur la seule condition I."""
    colonne, croix, un_seul = set(), set(), 0
    for g in d['tous']:
        t = tuple(g)
        if all(sum(1 for r in range(n) if g[r][c] in 'BJ') == n // 2
               for c in range(n)):
            colonne.add(t)
        f = figure(g, n)
        if f is None:
            continue
        un_seul += 1
        ligne_ok, colonne_ok, _, _ = criteres(f, n)
        if ligne_ok and colonne_ok:
            croix.add(t)
    print(f'    condition I seule                 : {un_seul}')
    pave = set(map(tuple, d['pavables']))
    print(f'\néquivalence à l’ordre {n}, sur {len(d["tous"])} étiquetages :')
    print(f'    condition d’effectifs par colonne : {len(colonne)}')
    print(f'    croix ansée au sens I + II + III  : {len(croix)}')
    print(f'    pavent                            : {len(pave)}')
    print(f'    colonne = croix ansée             : {colonne == croix}')
    print(f'    colonne = pavable                 : {colonne == pave}')
    print(f'    condition I ⟺ I + II + III        : {un_seul == len(croix)}')
    if not (colonne == croix == pave):
        sys.exit(1)


def autre_ordre(n):
    """À un ordre autre que 6, une graine par solveur et sa figure."""
    from graine_sat import cherche
    nom, mots = cherche(n, 600.0)
    if mots:
        rapport(f'une graine d’ordre {n} (solveur)', [mots], n)
    else:
        print(f'pas de graine d’ordre {n} ({nom})')


if __name__ == '__main__':
    main()
