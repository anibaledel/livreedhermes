#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
tous_croisements.py — L'ensemble complet des grilles qui pavent.

Dénombre toutes les grilles constructibles à partir des 60 couches, sans
restreindre les deux couches à une même famille, et compte celles qui
satisfont la condition de pavage.

Pourquoi ce script
------------------
Le catalogue du système range chaque entrée comme [famille, teinteA,
teinteB, n] : un seul champ pour la famille, donc un couple ne peut y
être écrit que si ses deux couches appartiennent à la même. Cette
restriction vient du format des données et de l'arborescence des fichiers
sources, non d'une nécessité géométrique : la fonction Φ prend deux
grilles 12×12 et un mot de six bits, et ignore d'où elles viennent.

La page creation-motifs-yi-king.html du site, elle, autorise depuis
toujours de choisir deux images dans des catégories différentes. L'outil
couvrait le cas que la formalisation excluait.

Ce script mesure ce que ce cas contient.

Les conditions
--------------
CONDITION DE PAVAGE (celle mesurée ici) — porte sur une grille :

    g ∘ σ = π ∘ g   pour une involution non triviale π des trois teintes.

La jonction des quatre coins reproduit alors le centre, et le pavage
porte un seul motif au lieu de deux alternés.

CONDITION DE COUPLE (la définition du papier, plus forte) :

    Φ(n, A, B) ∘ σ = Φ(n, B, A)   pour les 64 indices,

équivalente à B = A ∘ σ. Elle n'est satisfaite que par 32 couples
ordonnés, tous intra-famille, qui engendrent le corpus catalogué.

Ce que fait ce script
---------------------
1. Reconstruit les 60 couches depuis data/referent_360_v3.json.
2. Parcourt les C(60,2) = 1770 paires non ordonnées × 64 indices, soit
   113 280 constructions, et retient celles qui pavent.
3. Quotiente par Γ = D4 × ⟨σ⟩ × S3, d'ordre 96.
4. Compare au corpus catalogué.

Résultats attendus
------------------
    constructions examinées : 113 280
    grilles conformes       :  16 768   (14,8 %)
    grilles distinctes      :   9 824
    orbites de Γ            :   1 292
    dont corpus             :     128

Le point notable : les 1292 orbites sont déjà toutes atteintes par les
240 paires dont les 64 grilles pavent toutes. Les paires qui ne pavent
que partiellement n'apportent aucune orbite nouvelle — la condition a
une structure, elle ne produit pas de cas isolés.

Le calcul des orbites domine le temps d'exécution : compter quelques
minutes au total.

Usage
-----
    python tools/tous_croisements.py
    python tools/tous_croisements.py --sans-orbites
    python tools/tous_croisements.py --json rapport.json

Données lues
------------
    data/referent_360_v3.json  — les 360 cartes
    data/fonds_ecran_v1.json   — la matrice des niveaux L
"""

import argparse
import itertools
import json
import os
import sys
from collections import Counter, defaultdict

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R360 = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
FONDS = os.path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json')

N = 12
HALF = N // 2
TEINTES = ('V', 'M', 'O')
BASES = ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN')
COULEURS = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}
PERMUTATIONS = [dict(zip(TEINTES, p)) for p in itertools.permutations(TEINTES)]


# ── Couches ────────────────────────────────────────────────────────────

def charge_couches(chemin):
    cartes = json.load(open(chemin, encoding='utf-8'))['calques']
    lay = defaultdict(lambda: [[None] * N for _ in range(N)])
    for c in cartes:
        if c['famille'] == 'BASES':
            t = c['teinte']
            for b in BASES:
                if t.startswith(b + '-'):
                    famille, nature = b, t[len(b) + 1:]
                    break
            else:
                raise ValueError(f"teinte non reconnue : {t}")
        else:
            famille, nature = c['famille'], c['teinte']
        G = lay[(famille, nature)]
        for nom, teinte in COULEURS.items():
            for r, col in c[f'{nom}_positions']:
                G[r][col] = teinte
    lay = {k: tuple(tuple(row) for row in G) for k, G in lay.items()}
    incompletes = [k for k, G in lay.items() if any(x is None for row in G for x in row)]
    if incompletes:
        raise ValueError(f"couches incomplètes : {incompletes[:3]}")
    return lay


# ── Transformations ────────────────────────────────────────────────────

def sigma(g):
    return tuple(tuple(g[(r - HALF) % N][(c - HALF) % N] for c in range(N)) for r in range(N))


def quart_tour(g):
    return tuple(tuple(g[N - 1 - c][r] for c in range(N)) for r in range(N))


def miroir(g):
    return tuple(tuple(row[::-1]) for row in g)


def traits(n):
    bas, haut = n % 8, n // 8
    return (bas & 1, (bas >> 1) & 1, (bas >> 2) & 1,
            haut & 1, (haut >> 1) & 1, (haut >> 2) & 1)


def phi(n, A, B, L):
    t = traits(n)
    return tuple(tuple((A if t[L[r][c] - 1] == 1 else B)[r][c] for c in range(N))
                 for r in range(N))


def pave(g):
    """g ∘ σ = π ∘ g, π involution non triviale des trois teintes."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(s[r][c], g[r][c]) != g[r][c]:
                return False
    if any(m.get(k) is not None and m.get(m[k]) != k for k in m):
        return False
    return any(a != b for a, b in m.items())


def canonique(g):
    """Le plus petit des 96 mots de l'orbite sous Γ."""
    base = []
    x = g
    for _ in range(4):
        base.append(x)
        x = quart_tour(x)
    y = miroir(g)
    for _ in range(4):
        base.append(y)
        y = quart_tour(y)
    formes = base + [sigma(f) for f in base]
    meilleur = None
    for f in formes:
        for m in PERMUTATIONS:
            mot = ''.join(m[v] for row in f for v in row)
            if meilleur is None or mot < meilleur:
                meilleur = mot
    return meilleur


# ── Programme principal ────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Tous les croisements de couches.")
    ap.add_argument('--sans-orbites', action='store_true',
                    help="s'arrête avant le quotient par Γ")
    ap.add_argument('--json', metavar='FICHIER', help='écrit un rapport')
    arg = ap.parse_args()

    for chemin in (R360, FONDS):
        if not os.path.exists(chemin):
            sys.exit(f"données introuvables : {chemin}")

    lay = charge_couches(R360)
    L = json.load(open(FONDS, encoding='utf-8'))['layerOf']
    if sigma(tuple(tuple(r) for r in L)) != tuple(tuple(r) for r in L):
        sys.exit("la matrice des niveaux n'est pas invariante par σ")

    cles = sorted(lay)
    familles = sorted({f for f, _ in cles})
    print(f"couches : {len(cles)} dans {len(familles)} familles")
    print(f"paires  : {len(cles) * (len(cles) - 1) // 2}\n")

    # ── le corpus catalogué, pour comparaison ─────────────────────────
    corpus = set()
    for a in cles:
        for b in cles:
            if a[0] == b[0] and a != b and sigma(lay[a]) == lay[b]:
                for n in range(64):
                    corpus.add(phi(n, lay[a], lay[b], L))

    # ── tous les croisements ──────────────────────────────────────────
    total = 0
    conformes = 0
    distinctes = set()
    par_paire = Counter()
    for a, b in itertools.combinations(cles, 2):
        k = 0
        for n in range(64):
            g = phi(n, lay[a], lay[b], L)
            total += 1
            if pave(g):
                k += 1
                conformes += 1
                distinctes.add(g)
        par_paire[k] += 1

    print("Condition de pavage : g ∘ σ = π ∘ g")
    print(f"    constructions examinées : {total:>7}")
    print(f"    conformes               : {conformes:>7}   ({100 * conformes / total:.1f} %)")
    print(f"    grilles distinctes      : {len(distinctes):>7}")
    print(f"    dont dans le corpus     : {len(distinctes & corpus):>7}")
    print(f"    paires par nombre de grilles conformes : {dict(sorted(par_paire.items()))}")
    print()

    if arg.sans_orbites:
        return

    print("Orbites de Γ = D4 × ⟨σ⟩ × S3 (ordre 96) — quelques minutes")
    orb_tout = {canonique(g) for g in distinctes}
    orb_corpus = {canonique(g) for g in corpus}
    print(f"    ensemble complet : {len(orb_tout):>5} orbites")
    print(f"    corpus catalogué : {len(orb_corpus):>5} orbites")
    print(f"    corpus inclus    : {'✓' if orb_corpus <= orb_tout else '✗'}")

    # les paires complètes suffisent-elles à atteindre toutes les orbites ?
    completes = set()
    for a, b in itertools.combinations(cles, 2):
        gs = [phi(n, lay[a], lay[b], L) for n in range(64)]
        if all(pave(g) for g in gs):
            completes.update(gs)
    orb_completes = {canonique(g) for g in completes}
    print(f"    atteintes par les paires entièrement conformes : {len(orb_completes):>5}")
    print(f"    orbites propres aux paires partielles          : {len(orb_tout - orb_completes):>5}"
          + ("  ✓ aucune" if not (orb_tout - orb_completes) else ""))

    if arg.json:
        rapport = {
            'couches': len(cles),
            'paires': len(cles) * (len(cles) - 1) // 2,
            'constructions': total,
            'conformes': conformes,
            'distinctes': len(distinctes),
            'dans_corpus': len(distinctes & corpus),
            'par_paire': {str(k): v for k, v in sorted(par_paire.items())},
            'orbites': {'complet': len(orb_tout), 'corpus': len(orb_corpus),
                        'paires_completes': len(orb_completes),
                        'propres_aux_partielles': len(orb_tout - orb_completes)},
        }
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"\nrapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
