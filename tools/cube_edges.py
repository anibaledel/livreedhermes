#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
cube_edges.py — Vérification de la règle d'arête sur le cube.

Reproduit la Proposition 1 et le Théorème 3 de la note
« A Half-Shift Criterion on Three-Colour 12×12 Grids, and Its
Restriction on the Cube ».

Ce que fait ce script
---------------------
1. Reconstruit le corpus : les grilles Φ(n, A, B) telles que
   B = A ∘ σ, où σ est le décalage d'une demi-période (6, 6) modulo 12.
   → 1024 triplets (famille, couple, n) dans 8 familles — celles qui
     contiennent exactement une base de type yang —, 512 grilles
     distinctes (chaque grille apparaît exactement deux fois), 256
     pavages (une grille et son décalé donnent le même pavage).

2. Vérifie que les quatre cases d'angle portent la teinte fixée par
   l'involution π (Corollaire 5), donc que la condition de sommet de la
   Proposition 1 est satisfaite par tout le corpus.

3. Décide, pour chaque grille, s'il existe un habillage du cube — un
   choix d'élément du groupe diédral D4 pour chacune des six faces —
   tel que toute paire de cases adjacentes par une arête porte des
   teintes échangées par π. Il y a 12 arêtes de 12 paires, soit 144
   contraintes, et 8^6 = 262 144 habillages possibles.

   La décision ne les énumère pas : la règle se décompose en 12
   contraintes indépendantes, une par arête, chacune un sous-ensemble
   de D4 × D4. On les calcule (12 × 64 tests de 12 cases), puis on
   résout le problème de satisfaction sur les six variables.

   → 512 triplets, 256 grilles distinctes, 128 pavages, dans exactement
     quatre familles : celles qui contiennent la base « yang ».
   Les familles exclues le sont pour deux raisons distinctes : pour
   {yang_mut} et {yang_mut, yin_mut} aucune arête n'est satisfaisable
   seule (obstruction locale) ; pour {yang_mut, yin} et {yang_mut, yin,
   yin_mut}, chaque arête l'est mais aucun assemblage n'existe
   (obstruction globale). Le script le signale.

4. Vérifie (F1)–(F5) et les hypothèses des Corollaires 4 et 5 sur les
   données, compte les orbites de Γ (128 sur le corpus, 64 sur les
   retenues, chacune rencontrant le corpus en exactement 4 grilles, aucune
   orbite mêlant retenues et exclues), et vérifie que les 16 formes de la Section 7 sont, à un
   renommage de teintes près, des grilles du corpus — toutes dans la
   famille {yang_mut} (et sa jumelle), 8 par couple, en 8 classes à
   permutation de teinte près, aucune n'admettant d'habillage. Il vérifie
   enfin que les 64 formes d'ordre 12 forment 32 classes sous Γ, dont
   aucune ne rencontre les 256 grilles retenues par le cube : les deux
   ensembles de 64 sont disjoints.

5. Vérifie le Lemme 2 : les 8 familles admissibles vont par paires
   (F, F ∪ {β}) avec β une base de type yin, et les grilles de la seconde
   sont celles de la première avec n ↔ n ⊕ 7 (trigramme inférieur) ou
   n ↔ n ⊕ 56 (trigramme supérieur) ; il affiche les quatre paires et
   leur m, et vérifie que le couple de natures est le même des deux côtés.

6. Contrôle d'implémentation du Théorème 2 : les six couples non ordonnés
   sont testés dans chaque famille, et le critère est aussi évalué
   directement sur les 64 indices pour les 12 couples ordonnés des 15
   familles — il vaut pour tous ou pour aucun, jamais en partie.

Usage
-----
    python tools/cube_edges.py
    python tools/cube_edges.py --json rapport.json
    python tools/cube_edges.py --rotations-only   (voir la note ci-dessous)

Sur --rotations-only : restreindre les habillages aux seules rotations
ne donne plus un résultat intrinsèque, puisqu'il dépend de la convention
de repérage des faces choisie ci-dessous. L'option existe pour vérifier
cette dépendance, pas pour produire un résultat publiable. Le groupe
diédral complet, lui, absorbe tout changement de convention.

Données lues
------------
    data/referent_360_v3.json — les 360 cartes (15 familles × 4 natures × 6 niveaux)
    data/fonds_ecran_v1.json  — contrôle : layer_of, et, depuis que le fichier
                                porte les 60 couches, l'identité des couches
"""

import argparse
import itertools
import json
import os
import sys
from collections import Counter, defaultdict

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
DATA_FE = os.path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json')   # ancien format, 48 couches

N = 12                      # côté de la grille
HALF = N // 2               # décalage d'une demi-période
NIVEAUX = 6                 # nombre de niveaux (traits)


# ── Grilles ────────────────────────────────────────────────────────────

def demi_decalage(g):
    """σ : translation de (6, 6) modulo 12."""
    return [[g[(r - HALF) % N][(c - HALF) % N] for c in range(N)] for r in range(N)]


def quart_tour(g):
    """κ : rotation d'un quart de tour."""
    return [[g[N - 1 - c][r] for c in range(N)] for r in range(N)]


def miroir(g):
    return [row[::-1] for row in g]


def traits(n):
    """Mot binaire de n sur six bits ; le bit i gouverne le niveau i+1."""
    bas, haut = n % 8, n // 8
    return [bas & 1, (bas >> 1) & 1, (bas >> 2) & 1,
            haut & 1, (haut >> 1) & 1, (haut >> 2) & 1]


def phi(n, A, B, layer_of):
    """Φ(n, A, B) : A là où le trait du niveau vaut 1, B ailleurs."""
    t = traits(n)
    return [[(A if t[layer_of[r][c] - 1] == 1 else B)[r][c] for c in range(N)]
            for r in range(N)]


def involution(A, B):
    """Si B = π ∘ A pointwise, retourne π ; sinon None."""
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(A[r][c], B[r][c]) != B[r][c]:
                return None
    if any(m.get(m[k]) != k for k in m):      # π doit être une involution
        return None
    return m


def familles_depuis_referent_360(doc):
    """Les 15 familles et leurs 60 couches, depuis referent_360_v3.json.

    Le fichier range les quatre familles à une base sous l'étiquette BASES,
    avec une teinte « BASE-NATURE » ; on les sépare en quatre familles.
    (L'ancien fonds_ecran_v1.json ne gardait que les quatre couches
    « diagonales » BASE-BASE, soit 48 couches sur 60 : les familles à une
    base y étaient absentes, et le Théorème 2 y était incomplet.)"""
    lettre = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}
    couches = defaultdict(lambda: [[None] * N for _ in range(N)])
    for c in doc['calques']:
        for col, l in lettre.items():
            for r, cc in c[col + '_positions']:
                couches[(c['famille'], c['teinte'])][r][cc] = l
    familles = defaultdict(dict)
    for (f, t), g in couches.items():
        assert all(x is not None for row in g for x in row), (f, t)
        if f == 'BASES':
            for b in ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN'):     # ordre : préfixes longs d'abord
                if t.startswith(b + '-'):
                    familles['BASE-' + b][t[len(b) + 1:].lower().replace('-', '_')] = g
                    break
        else:
            familles[f][t.lower().replace('-', '_')] = g
    return doc['layer_of'], dict(familles)


NATURES = ('yang', 'yang_mut', 'yin', 'yin_mut')


def couples_unifies(familles, layer_of):
    """Couples (famille, a, b) avec B = A ∘ σ.

    Les six couples non ordonnés de natures sont testés dans chaque famille
    (σ étant une involution, B = A ∘ σ équivaut à A = B ∘ σ : cela couvre les
    douze couples ordonnés de la preuve du Théorème 2)."""
    out = []
    for f, teintes in familles.items():
        for a, b in itertools.combinations(NATURES, 2):
            if a in teintes and b in teintes and demi_decalage(teintes[a]) == teintes[b]:
                out.append((f, a, b))
    return out


def controle_64_indices(familles, layer_of):
    """Contrôle d'implémentation (preuve du Théorème 2) : le critère testé
    directement sur les 64 indices, pour les 12 couples ordonnés de chaque
    famille. Rend (nb tout-vrai, nb tout-faux, nb mixtes)."""
    tout, rien, mixte = 0, 0, 0
    for teintes in familles.values():
        for a, b in itertools.permutations(NATURES, 2):
            A, B = teintes[a], teintes[b]
            k = sum(demi_decalage(phi(n, A, B, layer_of)) == phi(n, B, A, layer_of) for n in range(64))
            tout += k == 64; rien += k == 0; mixte += 0 < k < 64
    return tout, rien, mixte


# ── Géométrie du cube ──────────────────────────────────────────────────
#
# Cube [0,12]³. Chaque face est repérée par une origine et deux vecteurs :
# la case (r, c) occupe le carré unité O + c·ec + r·er. Cette convention
# est arbitraire ; travailler avec le groupe diédral complet la rend sans
# effet sur le résultat (voir la docstring).

NOMS_FACES = ['top', 'bottom', 'front', 'back', 'left', 'right']

FACES = {
    'top':    ((0, 0, 12), (1, 0, 0), (0, 1, 0)),
    'bottom': ((0, 0, 0),  (1, 0, 0), (0, 1, 0)),
    'front':  ((0, 0, 12), (1, 0, 0), (0, 0, -1)),
    'back':   ((0, 12, 12), (1, 0, 0), (0, 0, -1)),
    'left':   ((0, 0, 12), (0, 1, 0), (0, 0, -1)),
    'right':  ((12, 0, 12), (0, 1, 0), (0, 0, -1)),
}


def _sommets(face, r, c):
    O, ec, er = FACES[face]
    P = lambda i, j: tuple(O[k] + ec[k] * i + er[k] * j for k in range(3))
    return [P(c, r), P(c + 1, r), P(c + 1, r + 1), P(c, r + 1)]


def aretes_du_cube():
    """Les 12 arêtes, chacune donnée par ses 12 paires de cases adjacentes.

    Deux cases de faces différentes sont adjacentes si elles partagent un
    segment unité en 3D — critère géométrique, indépendant de la
    convention de repérage."""
    segments = defaultdict(list)
    for f in NOMS_FACES:
        for r in range(N):
            for c in range(N):
                v = _sommets(f, r, c)
                for i in range(4):
                    segments[frozenset((v[i], v[(i + 1) % 4]))].append((f, r, c))

    par_arete = defaultdict(list)
    for cellules in segments.values():
        if len(cellules) == 2 and cellules[0][0] != cellules[1][0]:
            (f1, r1, c1), (f2, r2, c2) = cellules
            i, j = NOMS_FACES.index(f1), NOMS_FACES.index(f2)
            if i < j:
                par_arete[(i, j)].append(((r1, c1), (r2, c2)))
            else:
                par_arete[(j, i)].append(((r2, c2), (r1, c1)))
    return dict(par_arete)


ARETES = aretes_du_cube()


# ── Habillages ─────────────────────────────────────────────────────────

def variantes(g, rotations_seules=False):
    """Les images de g sous D4 (ou sous les seules rotations)."""
    out = []
    x = g
    for _ in range(4):
        out.append(x)
        x = quart_tour(x)
    if rotations_seules:
        return out
    y = miroir(g)
    for _ in range(4):
        out.append(y)
        y = quart_tour(y)
    return out


def habillage(g, pi, rotations_seules=False):
    """Retourne un habillage satisfaisant la règle d'arête, ou None.

    La règle se décompose par arête : pour chaque paire de faces (i, j),
    on calcule l'ensemble des (k_i, k_j) admissibles, puis on cherche un
    choix global compatible."""
    R = variantes(g, rotations_seules)
    d = len(R)

    admissibles = {}
    for (i, j), cellules in ARETES.items():
        S = {(k1, k2) for k1 in range(d) for k2 in range(d)
             if all(R[k2][r2][c2] == pi[R[k1][r1][c1]] for (r1, c1), (r2, c2) in cellules)}
        admissibles[(i, j)] = S
    aretes_ok = sum(1 for S in admissibles.values() if S)
    if aretes_ok < len(admissibles):
        return None, aretes_ok               # au moins une arête impossible : obstruction locale

    for ks in itertools.product(range(d), repeat=6):
        if all((ks[i], ks[j]) in admissibles[(i, j)] for (i, j) in admissibles):
            return ks, aretes_ok
    return None, aretes_ok                    # toutes les arêtes possibles, aucun assemblage : obstruction globale


def angles_fixes(g, pi):
    """Condition de sommet (Proposition 1) : les quatre angles portent une
    teinte fixée par π."""
    return all(pi[g[r][c]] == g[r][c]
               for r, c in ((0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1)))


# ── Programme principal ────────────────────────────────────────────────

def main():
    import time
    t0 = time.time()
    p = argparse.ArgumentParser(description="Vérifie la règle d'arête sur le cube.")
    p.add_argument('--json', metavar='FICHIER', help='écrit un rapport détaillé')
    p.add_argument('--rotations-only', action='store_true',
                   help='restreint les habillages aux rotations (résultat non intrinsèque)')
    arg = p.parse_args()

    if not os.path.exists(DATA):
        sys.exit(f"données introuvables : {DATA}")
    doc = json.load(open(DATA, encoding='utf-8'))
    layer_of, familles = familles_depuis_referent_360(doc)
    print(f"familles : {len(familles)} ; couches : {sum(len(v) for v in familles.values())}")
    if os.path.exists(DATA_FE):
        fe = json.load(open(DATA_FE, encoding='utf-8'))
        if fe['layerOf'] != layer_of:
            sys.exit("layer_of diffère entre referent_360_v3.json et fonds_ecran_v1.json")
        def cle(s):
            s = s.upper().replace(':', '-').replace('+', '-').replace('_', '-').replace('BASES-', 'BASE-')
            return 'YINYANG' if s == 'PAR4' else s
        fams_fe = {cle(f): v for f, v in fe['families'].items()}
        n_fe = sum(len(v) for v in fams_fe.values())
        if n_fe == 60:
            ecarts = [(f, k) for f in familles for k in familles[f]
                      if fams_fe.get(f, {}).get(k) != familles[f][k]]
            print(f"fonds_ecran_v1.json : 60 couches, identiques au référent 360 : "
                  + ("✓" if not ecarts else f"✗ {ecarts[:4]}"))
        else:
            print(f"fonds_ecran_v1.json : {n_fe} couches (format incomplet) — seul layer_of est contrôlé")

    # (F1) : sans l'invariance de L par σ, le Théorème 1 tombe
    if demi_decalage(layer_of) != layer_of:
        sys.exit("la matrice des niveaux n'est pas invariante par σ — hypothèse (F1) en défaut")

    # (F2)–(F4) : symétries de L et des couches, composition
    rho = lambda g: [[g[N - 1 - r][N - 1 - c] for c in range(N)] for r in range(N)]
    kappa = lambda g: [[g[c][N - 1 - r] for c in range(N)] for r in range(N)]
    toutes = [(f, k, g) for f in familles for k, g in familles[f].items()]
    if rho(layer_of) != layer_of or kappa(layer_of) != layer_of:
        sys.exit("L n'est pas invariante par ρ ou κ — hypothèses (F2)/(F3) en défaut")
    if any(rho(A) != A for _, _, A in toutes):
        sys.exit("une couche n'est pas centralement symétrique — hypothèse (F2) en défaut")
    def tau_de(A):
        m, K = {}, kappa(A)
        for r in range(N):
            for c in range(N):
                if m.setdefault(A[r][c], K[r][c]) != K[r][c]:
                    return None
        return m
    taus = {(f, k): tau_de(A) for f, k, A in toutes}
    if any(t is None for t in taus.values()):
        sys.exit("une couche n'est pas κ-symétrique à permutation près — hypothèse (F3) en défaut")
    if Counter(x for row in layer_of for x in row) != {l: 24 for l in range(1, NIVEAUX + 1)} or \
       any(sorted(Counter(x for row in A for x in row).values()) != [48, 48, 48] for _, _, A in toutes):
        sys.exit("composition 24 par niveau / 48 par teinte en défaut — hypothèse (F4)")
    print("hypothèses (F1)–(F4) : ✓")

    couples = couples_unifies(familles, layer_of)
    familles_unifiees = sorted({f for f, _, _ in couples})
    print(f"couples unifiés (6 couples testés par famille) : {len(couples)} dans {len(familles_unifiees)} familles")
    for f in familles_unifiees:
        print(f"    {f} : {[(a, b) for g, a, b in couples if g == f]}")
    tout, rien, mixte = controle_64_indices(familles, layer_of)
    print(f"contrôle direct sur les 64 indices (15 familles × 12 couples ordonnés) : "
          f"{tout} tout-vrai, {rien} tout-faux, {mixte} mixte" + ("  ✓" if mixte == 0 else "  ✗"))
    print()

    triplets = []          # (famille, a, b, n, angles_ok, habillage)
    for f, a, b in couples:
        A, B = familles[f][a], familles[f][b]
        pi = involution(A, B)
        if pi is None:
            sys.exit(f"{f} ({a}, {b}) : B n'est pas π ∘ A — hypothèse (F5) en défaut")
        if taus[(f, a)] != taus[(f, b)] or not (all(k == v for k, v in taus[(f, a)].items()) or taus[(f, a)] == pi):
            sys.exit(f"{f} ({a}, {b}) : τ_A ≠ τ_B ou τ_A ∉ {{id, π}} — hypothèse du Corollaire 4 en défaut")
        diag = [(0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1)] + [(i, i) for i in range(N)] + [(i, N - 1 - i) for i in range(N)]
        if any(A[r][c] != B[r][c] or pi[A[r][c]] != A[r][c] for r, c in diag):
            sys.exit(f"{f} ({a}, {b}) : coins/diagonales — hypothèse du Corollaire 5 en défaut")
        for n in range(64):
            g = phi(n, A, B, layer_of)
            ks, aretes_ok = habillage(g, pi, arg.rotations_only)
            triplets.append({
                'famille': f, 'teintes': [a, b], 'hexagramme': n,
                'grille': tuple(tuple(r) for r in g),
                'angles_fixes': angles_fixes(g, pi),
                'habillage': list(ks) if ks else None,
                'aretes_satisfaisables': aretes_ok,
            })

    def pavage(cle):
        g = [list(r) for r in cle]
        return frozenset((cle, tuple(tuple(r) for r in demi_decalage(g))))

    # ── corpus ────────────────────────────────────────────────────────
    grilles = [t['grille'] for t in triplets]
    print("Corpus (Théorème 2)")
    print(f"    triplets           : {len(triplets)}")
    print(f"    grilles distinctes : {len(set(grilles))}")
    print(f"    pavages distincts  : {len({pavage(g) for g in grilles})}")
    print()

    # ── sommets ───────────────────────────────────────────────────────
    n_sommets = sum(t['angles_fixes'] for t in triplets)
    print("Condition de sommet (Proposition 1)")
    print(f"    angles de teinte π-fixe : {n_sommets}/{len(triplets)}"
          + ("  ✓" if n_sommets == len(triplets) else "  ✗"))
    print()

    # ── arêtes ────────────────────────────────────────────────────────
    ok = [t for t in triplets if t['habillage'] is not None]
    fam_ok = sorted({t['famille'] for t in ok})
    print("Règle d'arête (Théorème 3)")
    print(f"    triplets admissibles : {len(ok)}/{len(triplets)}")
    print(f"    grilles distinctes   : {len({t['grille'] for t in ok})}")
    print(f"    pavages distincts    : {len({pavage(t['grille']) for t in ok})}")
    print(f"    familles             : {len(fam_ok)}")
    for f in fam_ok:
        k = sum(1 for t in ok if t['famille'] == f)
        print(f"        {f}  ({k} triplets)")
    print()

    # ── nature de l'obstruction pour les exclus ──────────────────────
    exclus = [t for t in triplets if t['habillage'] is None]
    if exclus:
        print("Familles exclues : arêtes individuellement satisfaisables (sur 12)")
        for f in sorted({t['famille'] for t in exclus}):
            vals = sorted({t['aretes_satisfaisables'] for t in exclus if t['famille'] == f})
            nature = 'locale (aucune arête ne passe)' if vals == [0] else \
                     'globale (chaque arête passe, pas d\'assemblage)' if vals == [12] else 'mixte'
            print(f"        {f}: {vals}  → obstruction {nature}")
        print()

    # ── lemme de duplication (troisième base) ────────────────────────
    par_grille = defaultdict(list)
    for t in triplets:
        par_grille[t['grille']].append((t['famille'], t['teintes'][0], t['hexagramme']))
    doublons = [sorted(v) for v in par_grille.values() if len(v) == 2]
    xor7 = all((v[0][2] ^ v[1][2]) in (7, 56) for v in doublons) and len(doublons) * 2 == len(triplets)
    print("Duplication (Lemme 2)")
    print(f"    grilles en double : {len(doublons)}/{len(par_grille)} (chaque grille exactement deux fois) ; correspondance n ↔ n⊕7 ou n⊕56 : {'✓' if xor7 else '✗'}")
    jumelles = Counter((v[0][0], v[1][0], v[0][2] ^ v[1][2]) for v in doublons)
    for (f1, f2, m), k in sorted(jumelles.items()):
        print(f"        {f1} ↔ {f2} : m = {m}  ({k} grilles)")
    meme_couple = all(v[0][1] == v[1][1] for v in doublons)
    print(f"    même couple de natures dans les deux familles : {'✓' if meme_couple else '✗'}")
    print()

    # ── orbites de Γ = <σ, D4, S3> ────────────────────────────────────
    # σ commute avec D4 sur le tore Z12 × Z12 (le conjugué de la translation
    # (6, 6) par un quart de tour est (6, −6) = (6, 6)) ; Γ est donc le
    # produit D4 × <σ> × S3, d'ordre 96, et ses éléments sont les h, σh.
    def orbite(g):
        out = set()
        for h in variantes([list(r) for r in g]):
            for s_ in (h, demi_decalage(h)):
                for perm in itertools.permutations('VMO'):
                    m = dict(zip('VMO', perm))
                    out.add(tuple(tuple(m[x] for x in row) for row in s_))
        return frozenset(out)
    corpus = set(grilles)
    retenues_g = {t['grille'] for t in ok}
    O_corpus = {orbite(g) for g in corpus}
    O_ret = {orbite(g) for g in retenues_g}
    O_exc = {orbite(g) for g in corpus - retenues_g}
    traces = Counter(len(o & corpus) for o in O_corpus)
    print("Orbites de Γ (Section 4 et Remarque de la Section 6)")
    print(f"    corpus   : {len(O_corpus)} orbites ; grilles du corpus par orbite : {dict(traces)}")
    print(f"    retenues : {len(O_ret)} ; exclues : {len(O_exc)} ; orbites mixtes : {len(O_ret & O_exc)}"
          + ("  ✓ (l'habillabilité est constante sur les orbites)" if not O_ret & O_exc else "  ✗"))
    print()

    # ── Section 7 : les 16 premières formes unifiées dans le corpus ──
    try:
        import selection_ordre6 as so
        doc6 = json.load(open(so.DATA, encoding='utf-8'))
        formes6 = {(f['row'], f['col']): f for f in doc6['forms']}
        ordre12 = {(R, C): so.assemble(formes6, R, C) for R in range(8) for C in range(8)}
        retenues = {k: G for k, G in ordre12.items() if so.unifiee(G)}
        index = {}
        for t in triplets:
            index.setdefault(t['grille'], []).append(t)
        renommage = {'RB': 'V', 'vert': 'M', 'jaune': 'O'}
        trouvees = Counter(); cube = 0
        for k, G in retenues.items():
            g = tuple(tuple(renommage[x] for x in row) for row in G)
            if g in index:
                for t in index[g]:
                    trouvees[t['famille']] += 1
                    cube += t['habillage'] is not None
        print("Section 7 : formes d'ordre 6 dans le corpus (renommage RB→V, vert→M, jaune→O)")
        print(f"    formes retenues : {len(retenues)} ; présentes dans le corpus : "
              f"{sum(1 for G in retenues.values() if tuple(tuple(renommage[x] for x in row) for row in G) in index)}/{len(retenues)}")
        for f, k in sorted(trouvees.items()):
            print(f"        {f} : {k} triplets")
        print(f"    admettant un habillage du cube : {cube}")
        # détail de la Proposition 2
        couples7 = Counter(t['teintes'][0] for G in retenues.values()
                           for t in index.get(tuple(tuple(renommage[x] for x in row) for row in G), [])
                           if t['famille'] == 'BASE-YANG-MUT')
        print(f"    couples dans {{yang_mut}} : {dict(couples7)}")
        def canon(g):
            return min(tuple(tuple(dict(zip('VMO', p))[x] for x in row) for row in g)
                       for p in itertools.permutations('VMO'))
        g16 = [tuple(tuple(renommage[x] for x in row) for row in G) for G in retenues.values()]
        print(f"    classes à permutation de teinte près : {len({canon(g) for g in g16})}")
        print(f"    à symétrie centrale : {sum(g == tuple(tuple(row[::-1]) for row in g[::-1]) for g in g16)}/16")
        # les deux ensembles de 64 : relation effective
        O64 = {orbite(tuple(tuple(renommage[x] for x in row) for row in G)) for G in ordre12.values()}
        print(f"    les 64 formes d'ordre 12 : {len(O64)} classes sous Γ ; "
              f"rencontrant le corpus : {len(O64 & O_corpus)} ; rencontrant les retenues du cube : {len(O64 & O_ret)}")
        print()
    except (ImportError, FileNotFoundError):
        print("Section 7 : selection_ordre6.py ou referent_256_v3.json absents — étape sautée")
        print()

    print(f"durée totale : {time.time() - t0:.0f} s")
    if arg.rotations_only:
        print("note : --rotations-only donne un résultat dépendant de la convention")
        print("       de repérage des faces ; il ne figure pas dans la note.")

    if arg.json:
        rapport = {
            'corpus': {'triplets': len(triplets),
                       'grilles': len(set(grilles)),
                       'pavages': len({pavage(g) for g in grilles})},
            'sommets_ok': n_sommets,
            'aretes': {'triplets': len(ok),
                       'grilles': len({t['grille'] for t in ok}),
                       'pavages': len({pavage(t['grille']) for t in ok}),
                       'familles': fam_ok},
            'detail': [{k: v for k, v in t.items() if k != 'grille'} for t in triplets],
        }
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"rapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
