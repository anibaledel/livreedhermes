#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# compte_etiquetages.py — combien d'étiquetages magiques à quatre classes
# existe-t-il à l'ordre n ?
#
# C'est la question ouverte du papier : les trois critères ne suffisent pas,
# la troisième suffit pour la bijection, mais il manque la condition sur les
# sommes de positions qui achèverait la caractérisation. À défaut de la
# connaître, on compte.
#
# LA DÉCOMPOSITION PAR PAIRES DE LIGNES. La condition de bijection apparie les
# lignes r et n−1−r : en notant, pour la ligne r,
#
#     P(r) = { c : classe B } ∪ { n−1−c : classe V }   (indices pris au bloc r)
#     Q(r) = { n−1−c : classe R } ∪ { c : classe J }   (indices pris au bloc n−1−r)
#
# la bijection exige P(k) ⊎ Q(n−1−k) = {0, …, n−1} pour chaque bloc k. Donc,
# une fois la ligne r choisie, les DEUX ensembles de la ligne s = n−1−r sont
# entièrement déterminés : P(s) = complément de Q(r), Q(s) = complément de P(r).
#
# On énumère donc les 4^n mots de la ligne r, on en déduit les contraintes sur
# la ligne s, et on ne garde que les couples dont les deux sommes de ligne
# valent la constante. Les couples retenus sont ensuite combinés sous les
# contraintes de colonnes et de diagonales.
#
# Usage : cd <racine du dépôt> && python tools/compte_etiquetages.py [--ordre N]

import itertools, os, sys, collections

CLASSES = 'BRVJ'


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def profil(mot, r, n):
    """(P, Q, somme de ligne, contributions par colonne) pour une ligne."""
    P, Q, s = [], [], 0
    col = []
    for c, k in enumerate(mot):
        if k == 'B':
            P.append(c)
        elif k == 'V':
            P.append(n - 1 - c)
        elif k == 'R':
            Q.append(n - 1 - c)
        else:
            Q.append(c)
        v = valeur(k, r, c, n)
        s += v
        col.append(v)
    return frozenset(P), frozenset(Q), s, col


def lignes(n, r):
    """Toutes les lignes r, indexées par (P, Q)."""
    par = collections.defaultdict(list)
    for mot in itertools.product(CLASSES, repeat=n):
        P, Q, s, col = profil(mot, r, n)
        if len(P) != len(set(P)) or len(Q) != len(set(Q)):
            continue            # doublon dans un bloc : bijection impossible
        par[(P, Q)].append((mot, s, col))
    return par


def couples(n, r):
    """Les couples (ligne r, ligne n−1−r) compatibles avec la bijection et
    dont les deux sommes de ligne valent la constante."""
    M = n * (n * n + 1) // 2
    s = n - 1 - r
    A, B = lignes(n, r), lignes(n, s)
    plein = frozenset(range(n))
    out = []
    for (P, Q), la in A.items():
        cible = (plein - Q, plein - P)
        if cible not in B:
            continue
        for mota, sa, cola in la:
            if sa != M:
                continue
            for motb, sb, colb in B[cible]:
                if sb != M:
                    continue
                out.append((mota, motb, [x + y for x, y in zip(cola, colb)]))
    return out


def compte(n, verbeux=True):
    """Rencontre au milieu : on combine les paires de lignes en deux moitiés,
    puis on apparie les demi-sommes complémentaires."""
    M = n * (n * n + 1) // 2
    paires = [couples(n, r) for r in range(n // 2)]
    if verbeux:
        for r, p in enumerate(paires):
            print(f'  paire de lignes ({r}, {n - 1 - r}) : {len(p)} couples '
                  f'conformes à la bijection et aux sommes de ligne', flush=True)

    def diagonales(mota, motb, r):
        s = n - 1 - r
        d1 = valeur(mota[r], r, r, n) + valeur(motb[s], s, s, n)
        d2 = valeur(mota[n - 1 - r], r, n - 1 - r, n) \
             + valeur(motb[n - 1 - s], s, n - 1 - s, n)
        return d1, d2

    def accumule(indices):
        """Tous les états (colonnes, d1, d2) atteignables par ces paires."""
        etats = {(tuple([0] * n), 0, 0): 1}
        for i in indices:
            neuf = collections.defaultdict(int)
            for (col, d1, d2), k in etats.items():
                for mota, motb, colab in paires[i]:
                    nc = tuple(x + y for x, y in zip(col, colab))
                    if any(x > M for x in nc):
                        continue
                    a, b = diagonales(mota, motb, i)
                    if d1 + a > M or d2 + b > M:
                        continue
                    neuf[(nc, d1 + a, d2 + b)] += k
            etats = neuf
            if verbeux:
                print(f'    … {len(etats)} états partiels', flush=True)
        return etats

    moitie = (n // 2) // 2 or 1
    gauche = accumule(range(moitie))
    droite = accumule(range(moitie, n // 2))
    if verbeux:
        print(f'  moitiés : {len(gauche)} × {len(droite)} états', flush=True)

    total = 0
    for (col, d1, d2), k in gauche.items():
        cle = (tuple(M - x for x in col), M - d1, M - d2)
        j = droite.get(cle)
        if j:
            total += k * j
    return total, []


def main():
    n = int(sys.argv[sys.argv.index('--ordre') + 1]) if '--ordre' in sys.argv else 6
    print(f'ordre {n} — étiquetages magiques à quatre classes')
    total, _ = compte(n)
    print(f'\n  étiquetages magiques à quatre classes d’ordre {n} : {total}')


if __name__ == '__main__':
    main()
