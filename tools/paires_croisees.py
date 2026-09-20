#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
paires_croisees.py — L'ensemble élargi : condition faible et paires
inter-familles.

Reproduit la Remarque « a wider set » de la Section 6 de la note
« A Half-Shift Criterion on Three-Colour 12×12 Grids, and Its
Restriction on the Cube ».

Deux conditions, à ne pas confondre
-----------------------------------
FORTE (Définition 3, celle du papier) — porte sur un COUPLE de couches :

    Φ(n, A, B) ∘ σ = Φ(n, B, A)   pour les 64 indices,

équivalente par le Théorème 1 à B = A ∘ σ. Aucun couple de familles
différentes ne la satisfait : les 32 couples ordonnés qui la vérifient
sont tous intra-famille.

FAIBLE — porte sur une GRILLE isolée :

    g ∘ σ = π ∘ g   pour une involution non triviale π de T.

C'est la propriété de pavage proprement dite : la jonction des quatre
coins reproduit le centre, donc le pavage porte un seul motif. Par le
Corollaire 1, toute grille du corpus la vérifie ; la réciproque est
fausse, et l'écart est ce que ce script mesure.

Ce que fait ce script
---------------------
1. Reconstruit les 60 couches depuis data/referent_360_v3.json.

2. Parcourt les C(60,2) = 1770 paires non ordonnées, y compris celles
   dont les deux couches appartiennent à des familles différentes — que
   le système n'assemble jamais, et que la Définition 3 exclut donc.
   Pour chacune, compte combien de ses 64 grilles vérifient la condition
   faible.

   → distribution attendue : 378 paires à 0, 896 à 1, 256 à 2, et
     240 paires dont les 64 grilles la vérifient toutes.
   → sur ces 240, 16 sont les paires du Théorème 2 ; les 224 autres
     croisent deux familles.

3. Quotiente par Γ = D4 × ⟨σ⟩ × S3, d'ordre 96, en comparant les
   représentants canoniques.

   → corpus : 512 grilles, 128 orbites.
   → hors corpus : 9312 grilles, 1164 orbites.
   → union : 1292 orbites, intersection vide.

Le calcul des orbites domine le temps d'exécution (96 variantes par
grille, près de dix mille grilles) : compter environ deux minutes.

Usage
-----
    python tools/paires_croisees.py
    python tools/paires_croisees.py --sans-orbites   (étapes 1 et 2 seules)
    python tools/paires_croisees.py --json rapport.json

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
BASES = ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN')      # préfixes les plus longs d'abord
COULEURS = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}


# ── Couches ────────────────────────────────────────────────────────────

def charge_couches(chemin):
    """Les 60 couches : une couche est l'union de ses six cartes."""
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
    lay = dict(lay)
    incompletes = [k for k, G in lay.items() if any(x is None for row in G for x in row)]
    if incompletes:
        raise ValueError(f"couches incomplètes : {incompletes[:3]}")
    return lay


# ── Transformations ────────────────────────────────────────────────────

def sigma(g):
    return [[g[(r - HALF) % N][(c - HALF) % N] for c in range(N)] for r in range(N)]


def quart_tour(g):
    return [[g[N - 1 - c][r] for c in range(N)] for r in range(N)]


def miroir(g):
    return [row[::-1] for row in g]


def traits(n):
    bas, haut = n % 8, n // 8
    return [bas & 1, (bas >> 1) & 1, (bas >> 2) & 1,
            haut & 1, (haut >> 1) & 1, (haut >> 2) & 1]


def phi(n, A, B, L):
    t = traits(n)
    return [[(A if t[L[r][c] - 1] == 1 else B)[r][c] for c in range(N)] for r in range(N)]


def condition_faible(g):
    """g ∘ σ = π ∘ g avec π involution non triviale."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(s[r][c], g[r][c]) != g[r][c]:
                return False
    if any(m.get(m[k]) != k for k in m):          # π doit être une involution
        return False
    return any(a != b for a, b in m.items())      # et non triviale


def canonique(g):
    """Représentant canonique sous Γ : le plus petit des 96 mots."""
    base = [list(row) for row in g]
    formes = []
    for depart in (base, miroir(base)):
        x = depart
        for _ in range(4):
            formes.append(x)
            x = quart_tour(x)
    formes = formes + [sigma(f) for f in formes]
    meilleur = None
    for f in formes:
        for p in itertools.permutations(TEINTES):
            m = dict(zip(TEINTES, p))
            mot = ''.join(m[v] for row in f for v in row)
            if meilleur is None or mot < meilleur:
                meilleur = mot
    return meilleur


# ── Programme principal ────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="L'ensemble élargi : paires inter-familles.")
    ap.add_argument('--sans-orbites', action='store_true',
                    help='saute le calcul des orbites (étapes 1 et 2 seules)')
    ap.add_argument('--json', metavar='FICHIER', help='écrit un rapport détaillé')
    arg = ap.parse_args()

    for chemin in (R360, FONDS):
        if not os.path.exists(chemin):
            sys.exit(f"données introuvables : {chemin}")

    lay = charge_couches(R360)
    L = json.load(open(FONDS, encoding='utf-8'))['layerOf']
    if sigma(L) != L:
        sys.exit("la matrice des niveaux n'est pas invariante par σ — hypothèse (F1) en défaut")

    cles = sorted(lay)
    familles = sorted({f for f, _ in cles})
    print(f"couches : {len(cles)} dans {len(familles)} familles\n")

    # ── condition forte : aucun couple inter-familles ──────────────────
    forts = [(a, b) for a in cles for b in cles if a != b and sigma(lay[a]) == lay[b]]
    croises_forts = [(a, b) for a, b in forts if a[0] != b[0]]
    print("Condition FORTE (Définition 3) : B = A ∘ σ")
    print(f"    couples ordonnés    : {len(forts)}")
    print(f"    dont inter-familles : {len(croises_forts)}"
          + ("  ✓ aucun" if not croises_forts else "  ✗"))
    print()

    # ── condition faible sur les 1770 paires ──────────────────────────
    distribution = Counter()
    completes = []
    for a, b in itertools.combinations(cles, 2):
        grilles = [phi(n, lay[a], lay[b], L) for n in range(64)]
        k = sum(condition_faible(g) for g in grilles)
        distribution[k] += 1
        if k == 64:
            completes.append((a, b))

    meme = [p for p in completes if p[0][0] == p[1][0]]
    croisees = [p for p in completes if p[0][0] != p[1][0]]
    print("Condition FAIBLE (Section 6) : g ∘ σ = π ∘ g")
    print(f"    paires examinées : {sum(distribution.values())}  (C(60,2) = {len(cles)*(len(cles)-1)//2})")
    print(f"    distribution     : {dict(sorted(distribution.items()))}")
    print(f"    paires complètes : {len(completes)}")
    print(f"        même famille : {len(meme)}   inter-familles : {len(croisees)}")
    print()

    if arg.sans_orbites:
        return

    # ── orbites ───────────────────────────────────────────────────────
    corpus = set()
    for a, b in forts:
        if a[0] != b[0]:
            continue
        for n in range(64):
            corpus.add(tuple(tuple(r) for r in phi(n, lay[a], lay[b], L)))

    nouvelles = set()
    for a, b in croisees:
        for n in range(64):
            nouvelles.add(tuple(tuple(r) for r in phi(n, lay[a], lay[b], L)))
    nouvelles -= corpus

    print(f"Orbites de Γ = D4 × ⟨σ⟩ × S3 (ordre 96) — environ deux minutes")
    orb_corpus = {canonique(g) for g in corpus}
    orb_nouv = {canonique(g) for g in nouvelles}
    communes = orb_corpus & orb_nouv

    print(f"    corpus          : {len(corpus):>5} grilles, {len(orb_corpus):>5} orbites")
    print(f"    hors corpus     : {len(nouvelles):>5} grilles, {len(orb_nouv):>5} orbites")
    print(f"    union           : {len(orb_corpus | orb_nouv):>5} orbites")
    print(f"    intersection    : {len(communes):>5}"
          + ("  ✓ disjointes" if not communes else "  ✗"))

    if arg.json:
        rapport = {
            'couches': len(cles),
            'forts': {'couples': len(forts), 'inter_familles': len(croises_forts)},
            'faible': {'distribution': {str(k): v for k, v in sorted(distribution.items())},
                       'completes': len(completes),
                       'meme_famille': len(meme),
                       'inter_familles': len(croisees)},
            'orbites': {'corpus': len(orb_corpus), 'nouvelles': len(orb_nouv),
                        'union': len(orb_corpus | orb_nouv), 'communes': len(communes)},
        }
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"\nrapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
