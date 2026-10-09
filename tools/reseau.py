#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# reseau.py — l'ensemble 𝒟_n des vecteurs d'écarts atteignables, exactement.
#
# LA QUESTION. La croix ansée existe aux ordres 6 et 10, pas aux ordres 8, 12 et
# 16. Un étiquetage satisfaisant la bijection, la condition I et les critères
# II et III a ses sommes de LIGNES magiques si et seulement si son vecteur
#
#       δ_r = S_r − M
#
# est nul — mais ce n'est PAS la magicité : les colonnes restent à contrôler, et
# un témoin d'ordre 6 a δ = 0 avec des colonnes à 101 et 121. δ = 0 est
# nécessaire, et son impossibilité suffit donc à conclure. L'obstruction se dit : 0 ∈ 𝒟_6, 0 ∉ 𝒟_8, 0 ∈ 𝒟_10. La borne
# démontrée décrit l'enveloppe de 𝒟_n ; elle ne dit rien de ses trous. On
# calcule ici 𝒟_n tout entier, sans solveur.
#
# CE QUI REND LE CALCUL POSSIBLE. Les contraintes de bijection se décomposent
# par orbites {(r,c), (r,c̄), (r̄,c), (r̄,c̄)} : la contrainte d'indice (k,j) ne
# porte que sur les quatre cases de l'orbite de (k,j). La condition I est aussi
# locale à l'orbite. Chaque orbite a donc un petit nombre d'états admissibles,
# indépendamment des autres, et le lemme des orbites dit que ses quatre cases
# sont toutes horizontales ou toutes verticales. Il ne reste de global que les
# sommes de lignes et les parités des critères II et III, ce qui se traite par
# programmation dynamique sur
#
#       (δ_0, …, δ_{m−1}, parités de lignes, parités de colonnes),  m = n/2.
#
# L'antisymétrie δ_{n−1−r} = −δ_r, démontrée par la bijection seule, permet de
# ne garder que les m premières coordonnées.
#
# Usage : cd <racine du dépôt> && python tools/reseau.py [--ordres 6,8]
#         [--journal fichier]
#
# Aucune dépendance : Python nu.

import sys, os, math, itertools
from collections import defaultdict

CLASSES = 'BRVJ'
H_PARTENAIRE = {'B': 'J', 'J': 'B', 'R': 'V', 'V': 'R'}


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def orbites(n):
    """Les orbites du groupe {identité, miroirs, demi-tour}, une fois chacune."""
    vues, out = set(), []
    for r in range(n):
        for c in range(n):
            o = frozenset({(r, c), (r, n - 1 - c), (n - 1 - r, c),
                           (n - 1 - r, n - 1 - c)})
            if o not in vues:
                vues.add(o)
                out.append(sorted(o))
    return out


def etats(n, orbite, brut=False):
    """Les affectations de classes admissibles sur une orbite, avec ce qu'elles
    apportent : écarts par ligne, orientation H/V, lignes et colonnes touchées.

    Admissible = bijection (les contraintes d'indice porté par l'orbite) et
    condition I (même classe aux antipodes sur les diagonales, classe
    différente ailleurs)."""
    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    cases = orbite
    out = []
    for mots in itertools.product(CLASSES, repeat=len(cases)):
        cl = dict(zip(cases, mots))

        # condition I
        ok = True
        for (r, c), k in cl.items():
            ant = cl[(n - 1 - r, n - 1 - c)]
            if ((r, c) in diag) != (ant == k):
                ok = False
                break
        if not ok:
            continue

        # bijection : pour chaque (k, j) de l'orbite, exactement une des quatre
        # provenances possibles de la valeur n·k + j + 1
        for (k, j) in cases:
            quatre = [(cl.get((k, j)) == 'B'),
                      (cl.get((k, n - 1 - j)) == 'V'),
                      (cl.get((n - 1 - k, n - 1 - j)) == 'R'),
                      (cl.get((n - 1 - k, j)) == 'J')]
            if sum(1 for b in quatre if b) != 1:
                ok = False
                break
        if not ok:
            continue

        # orientation : horizontale quand le miroir horizontal porte la classe
        # partenaire. Hors diagonale, les quatre cases s'accordent (lemme des
        # orbites) ; sur une diagonale il n'y a pas de trait.
        horiz = None
        for (r, c), k in cl.items():
            if (r, c) in diag:
                continue
            h = (cl[(r, n - 1 - c)] == H_PARTENAIRE[k])
            if horiz is None:
                horiz = h
            elif horiz != h:
                ok = False
                break
        if not ok:
            continue

        # apport aux sommes de lignes
        apport = defaultdict(int)
        for (r, c), k in cl.items():
            apport[r] += valeur(k, r, c, n)
        out.append(dict(cl) if brut else (dict(apport), horiz))
    return out


def domaine(n, trace=False, fenetre=None):
    """𝒟_n, exactement : les vecteurs (δ_0, …, δ_{m−1}) atteignables sous
    bijection + I + II + III."""
    m = n // 2
    M = n * (n * n + 1) // 2
    orbs = orbites(n)

    # état : (écarts partiels des m premières lignes, parités de lignes,
    # parités de colonnes). Les parités comptent les orbites horizontales par
    # ligne et les verticales par colonne : h_r et v_c du papier.
    # On traite les orbites par paire de lignes : les m orbites qui rencontrent
    # les lignes r et n−1−r. Dès ce paquet terminé, la somme S_r est complète,
    # donc on élague par la borne démontrée |δ_r| ≤ n(n−2)|u_r|/2 et par le
    # critère II, qui veut h_r impair. C'est ce qui rend l'ordre 8 calculable.
    dp = {((0,) * m, 0, 0): None}
    for r in range(m):
        paquet = [o for o in orbs if any(a == r for a, _ in o)]
        for orbite in paquet:
            lignes = sorted({a for a, _ in orbite if a < m})
            cols = sorted({c for _, c in orbite if c < m})
            opts = etats(n, orbite)
            suiv = {}
            for (ecarts, rp, cp) in dp:
                for apport, horiz in opts:
                    e = list(ecarts)
                    for a in lignes:
                        e[a] += apport[a]
                    nrp, ncp = rp, cp
                    if horiz is True:
                        for a in lignes:
                            nrp ^= 1 << a
                    elif horiz is False:
                        for c in cols:
                            ncp ^= 1 << c
                    suiv[(tuple(e), nrp, ncp)] = None
            dp = suiv
        borne = n * (n - 2) * abs(2 * r - n + 1) // 2
        if fenetre is not None:
            borne = min(borne, fenetre)
        dp = {s: None for s in dp
              if abs(s[0][r] - M) <= borne and (s[1] >> r) & 1}
        if trace:
            print(f'  lignes {r} et {n - 1 - r} closes : {len(dp):10d} états',
                  flush=True)

    plein = (1 << m) - 1
    return sorted({tuple(e[r] - M for r in range(m))
                   for (e, rp, cp) in dp if rp == plein and cp == plein})


def hermite(vecs):
    """Base échelonnée du réseau engendré par les vecteurs donnés (entiers)."""
    base = []
    for v in vecs:
        v = list(v)
        for b in base:
            p = next(i for i, x in enumerate(b) if x)
            if v[p]:
                # élimination d'Euclide, pour rester dans le réseau
                while v[p]:
                    q = v[p] // b[p]
                    v = [a - q * c for a, c in zip(v, b)]
                    if v[p]:
                        v, b[:] = b[:], v
        if any(v):
            base.append(v)
            base.sort(key=lambda b: next(i for i, x in enumerate(b) if x))
    return base


def paire(n, r):
    """Les configurations d'une seule paire de lignes (r, n−1−r) qui annulent
    son écart, sous bijection + condition I + critère II.

    C'est le cœur de l'obstruction : à l'ordre 8, aucune configuration de la
    SEULE paire de lignes (0, 7) ne donne S_0 = M. L'impossibilité de la croix
    ansée magique y est donc locale, et ne demande ni les colonnes, ni les
    autres lignes, ni de solveur. Renvoie (nombre de configurations, nombre de
    valeurs d'écart atteignables)."""
    m, M = n // 2, n * (n * n + 1) // 2
    orbs = [o for o in orbites(n) if any(a == r for a, _ in o)]
    # Le DP compte les CONFIGURATIONS : chaque état porte sa multiplicité. Sans
    # elle, on compterait des états fusionnés, ce qui n'a aucun sens combinatoire.
    dp = {(0, 0, 0): 1}             # (somme partielle, h_r, masque colonnes)
    for orbite in orbs:
        opts = etats(n, orbite)
        cols = sorted({c for _, c in orbite if c < m})
        suiv = {}
        for (s, h, cp), poids in dp.items():
            for apport, horiz in opts:
                ncp = cp
                if horiz is False:
                    for c in cols:
                        ncp ^= 1 << c
                cle = (s + apport[r], h + (1 if horiz else 0), ncp)
                suiv[cle] = suiv.get(cle, 0) + poids
        dp = suiv
    nuls = sum(p for k, p in dp.items() if k[0] == M and k[1] % 2 == 1)
    atteints = {k[0] - M for k in dp if k[1] % 2 == 1}
    return nuls, len(atteints)


def rapport(n, trace=False, fenetre=None):
    D = domaine(n, trace, fenetre)
    m = n // 2
    if fenetre is None:
        print(f'\nordre {n} : |𝒟_{n}| = {len(D)} vecteurs '
              f'(m = {m} coordonnées, les m suivantes par antisymétrie)')
    else:
        print(f'\nordre {n} : {len(D)} vecteurs d\'écarts avec '
              f'|δ_r| ≤ {fenetre} pour tout r')
    if not D:
        print('  aucun étiquetage ne satisfait bijection + I + II + III '
              'dans cette fenêtre.')
        return D
    zero = tuple([0] * m)
    print(f'  0 ∈ 𝒟_{n} : {zero in D}'
          + ('   → les sommes de lignes magiques sont atteignables ; '
             'les colonnes restent à contrôler' if zero in D else
             '   → aucun carré magique de ce type'))
    for r in range(m):
        col = [d[r] for d in D]
        print(f'  δ_{r} : de {min(col)} à {max(col)}, '
              f'{len(set(col))} valeurs distinctes')
    if len(D) > 1:
        base = hermite([[a - b for a, b in zip(d, D[0])] for d in D[1:]])
        print(f'  réseau des différences : rang {len(base)} sur {m}')
        for b in base:
            print('    ', b)
    pgcd = 0
    for d in D:
        for x in d:
            pgcd = x if pgcd == 0 else math.gcd(pgcd, abs(x))
    print(f'  pgcd de toutes les coordonnées : {pgcd}')
    return D


if __name__ == '__main__':
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 8])
    trace = '--trace' in av
    fen = (int(av[av.index('--fenetre') + 1]) if '--fenetre' in av else None)
    if '--paire0' in av:
        print('la PREMIÈRE paire de lignes, seule : combien de configurations '
              'annulent son écart ?\n')
        for n in ordres:
            nuls, atteints = paire(n, 0)
            verdict = ('écart nul possible' if nuls else
                       'ÉCART NUL IMPOSSIBLE')
            print(f'  ordre {n:3d} (n/2 = {n // 2:2d}, '
                  f'{"impair" if (n // 2) % 2 else "pair":6s}) : '
                  f'{nuls:8d} configurations, {atteints:6d} écarts '
                  f'atteignables — {verdict}', flush=True)
        sys.exit(0)
    for n in ordres:
        print(f'=== ordre {n} ==='
              + (f'  (fenêtre |δ_r| ≤ {fen})' if fen is not None else ''),
              flush=True)
        rapport(n, trace, fen)
