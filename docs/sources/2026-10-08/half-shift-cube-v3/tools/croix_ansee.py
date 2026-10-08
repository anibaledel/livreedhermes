#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
croix_ansee.py — Les croix ansées d'ordre 6 : énumération sous les critères
de la planche 040.

Modèle (planches 027 et 040)
----------------------------
Dans un carré magique d'ordre 6, chaque case est appariée à sa
complémentaire (somme 37). Les douze cases des deux diagonales sont
appariées par symétrie centrale et ne sont pas dessinées. Les vingt-quatre
autres cases sont appariées par des TRAITS : un trait relie deux cases
d'une même ligne, ou d'une même colonne, symétriquement opposées par
rapport au centre de cette ligne ou colonne (planche 040, critère III).

Une croix ansée est donc un appariement parfait des 24 cases hors
diagonales par des traits horizontaux et verticaux, soumis à :

  I.   aucun trait n'a pour extrémité une case des diagonales ;
  II.  chaque ligne porte un nombre impair de traits ;
  III. chaque ligne porte au moins un trait horizontal ;
  (et la forme est à symétrie centrale).

Ce script énumère tous les appariements, sans supposer la symétrie, et
teste les critères sous deux lectures du mot « ligne » :
  (a) lignes seulement ;
  (b) lignes et colonnes (II et III transposés aux colonnes).

Résultat : 64 choix bruts, 8 appariements cohérents (tous centralement
symétriques — la symétrie est une conséquence, pas une hypothèse),
8 sous la lecture (a), 2 sous la lecture (b) : les deux croix de la
planche 040, l'une l'image de l'autre par un quart de tour composé avec
l'échange des choix.

Usage
-----
    python tools/croix_ansee.py
"""
import itertools

N = 6
DIAG = {(r, r) for r in range(N)} | {(r, N - 1 - r) for r in range(N)}


def paires_ligne(r):
    """Les paires de colonnes (c, 5-c) hors diagonale disponibles en ligne r."""
    return [(c, N - 1 - c) for c in range(N // 2) if (r, c) not in DIAG]


def appariement(choix):
    """choix[r] = la paire de colonnes tracée horizontalement en ligne r.
    Rend l'ensemble des traits {frozenset({case, case})} ou None si
    l'appariement n'est pas cohérent (une case verticale dont le vis-à-vis
    est horizontal)."""
    traits = set()
    for r in range(N):
        c1, c2 = choix[r]
        traits.add(frozenset({(r, c1), (r, c2)}))
    # cases hors diagonale non horizontales : appariées verticalement
    for r in range(N):
        for c in range(N):
            if (r, c) in DIAG or c in choix[r]:
                continue
            partenaire = (N - 1 - r, c)
            if c in choix[N - 1 - r]:          # le vis-à-vis est déjà pris horizontalement
                return None
            traits.add(frozenset({(r, c), partenaire}))
    return traits


def horizontaux(traits, r):
    return sum(1 for t in traits if all(x[0] == r for x in t))

def verticaux(traits, c):
    return sum(1 for t in traits if all(x[1] == c for x in t))

def sym_centrale(traits):
    return all(frozenset({(N - 1 - a, N - 1 - b) for a, b in t}) in traits for t in traits)


def dessin(traits):
    """Rendu texte : centres des cases sur une grille 11×11."""
    W = 2 * N - 1
    g = [[' '] * W for _ in range(W)]
    for r in range(N):
        for c in range(N):
            g[2 * r][2 * c] = '·'
    for t in traits:
        (r1, c1), (r2, c2) = sorted(t)
        if r1 == r2:
            for c in range(2 * c1, 2 * c2 + 1): g[2 * r1][c] = '─' if g[2 * r1][c] in ' ·' else '┼'
        else:
            for r in range(2 * r1, 2 * r2 + 1): g[r][2 * c1] = '│' if g[r][2 * c1] in ' ·' else '┼'
    return '\n'.join(''.join(row) for row in g)


def main():
    options = [paires_ligne(r) for r in range(N)]
    assert all(len(o) == 2 for o in options)
    bruts = list(itertools.product(*options))
    coherents = [(ch, t) for ch in bruts if (t := appariement(ch)) is not None]
    print(f"choix bruts (2 paires par ligne, 6 lignes) : {len(bruts)}")
    print(f"appariements cohérents                    : {len(coherents)}")
    print(f"  dont à symétrie centrale                : {sum(sym_centrale(t) for _, t in coherents)}")

    def ok_lignes(t):
        return all(horizontaux(t, r) % 2 == 1 and horizontaux(t, r) >= 1 for r in range(N))
    def ok_colonnes(t):
        return all(verticaux(t, c) % 2 == 1 and verticaux(t, c) >= 1 for c in range(N))

    a = [(ch, t) for ch, t in coherents if ok_lignes(t)]
    b = [(ch, t) for ch, t in a if ok_colonnes(t)]
    print(f"critères II–III sur les lignes seules     : {len(a)}")
    print(f"critères II–III sur lignes et colonnes    : {len(b)}")
    print()
    for i, (ch, t) in enumerate(b, 1):
        print(f"croix {i} — traits horizontaux par ligne : {[ch[r] for r in range(N)]}")
        print(dessin(t)); print()


if __name__ == '__main__':
    main()
