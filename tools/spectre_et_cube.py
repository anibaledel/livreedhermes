#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
spectre_et_cube.py — La fermeture sur le cube a-t-elle une signature spectrale ?

Question posée
--------------
Deux chantiers du projet mesurent les mêmes motifs par deux voies qui n'ont
jamais été reliées :

  — la CYMATIQUE lit la fréquence spatiale dominante d'une trame, c'est-à-dire
    sa périodicité ;
  — le CUBE trie les grilles selon qu'elles se raccordent ou non aux arêtes d'un
    volume, c'est-à-dire selon une propriété de position.

Y a-t-il un lien ? Autrement dit : en regardant seulement le spectre d'une
grille, peut-on dire si elle se referme ?

Ce que l'on sait déjà
---------------------
Sur le CORPUS (512 grilles issues de couples d'une même famille), la réponse
est NON, et nettement. Les grilles qui ferment et celles qui ne ferment pas ont
des signatures rigoureusement identiques : mêmes fréquences dominantes dans les
mêmes proportions, même énergie moyenne sur les axes, et exactement la même
constante de 0,500 sur les diagonales des deux côtés.

La raison est structurelle. Une grille et son décalé d'une demi-période ont le
même spectre — le décalage est une translation, et le module de la transformée
de Fourier y est insensible — or les deux moitiés du corpus se correspondent
précisément par ce genre de transformation.

Ce que ce script ajoute
-----------------------
Le test n'a jamais été fait sur l'ENSEMBLE ÉLARGI : les 9824 grilles qui pavent
simplement, toutes paires de couches confondues, y compris inter-familles. Là,
le tri du cube est plus sélectif — 2064 grilles ferment, soit 21,0 %, au lieu de
la moitié sur le corpus — et rien ne garantit que l'indépendance tienne encore.

Si le spectre séparait les 2064 des 7760 autres, ce serait le premier pont établi
entre la géométrie de raccordement et le contenu fréquentiel. Ce script le
cherche.

Méthode
-------
Pour chaque grille, on calcule la transformée de Fourier 2D de trois images
indicatrices — une par teinte — et on somme les spectres de puissance. La
composante continue est écartée. On en tire :

  k²        le carré de la fréquence spatiale dominante, m² + n²
  (m,n)     le mode correspondant
  E_axes    la part d'énergie portée par les axes horizontal et vertical
  E_diag    la part portée par les deux diagonales
  pic       la part portée par la fréquence dominante seule

Puis on compare la distribution de ces cinq quantités entre les grilles qui
ferment et celles qui ne ferment pas. Si les distributions coïncident, le
spectre est aveugle à la fermeture, et les deux chantiers restent indépendants.

Attention à ne pas conclure trop vite : une différence de moyenne ne suffit pas.
Le script donne aussi les distributions complètes, parce que deux populations
peuvent avoir la même moyenne et des formes différentes, ou l'inverse.

Test de significativité (mode (2,2))
-------------------------------------
Un écart brut entre deux effectifs très inégaux (les grilles qui ferment sont
nettement moins nombreuses que les autres sur l'ensemble élargi) peut n'être
qu'un effet de taille : une valeur rare a mécaniquement moins de chances
d'apparaître dans le petit groupe. Pour trancher, le script teste la
concentration sur le mode (2,2) — le mode le plus fréquent observé — par deux
voies indépendantes :

  1. Un test hypergéométrique EXACT (équivalent au test de Fisher unilatéral) :
     étant donné le nombre total de grilles au mode (2,2) et la taille du
     groupe « ferment », quelle est la probabilité d'en obtenir au moins
     autant par pur hasard ? Calculé en log-espace (math.lgamma), donc valable
     même sur les grands effectifs sans dépendance à scipy.
  2. Un test de permutation : mille tirages (réglable, --tirages) d'un
     sous-ensemble de la même taille que le groupe « ferment », parmi
     l'ensemble complet, pour mesurer empiriquement la même probabilité.

Les deux doivent s'accorder ; sinon, quelque chose ne va pas dans le calcul.

Résultat établi (2026-09-19, sur les 1292 représentants d'orbites, --orbites)
------------------------------------------------------------------------------
290/1292 orbites ferment (22,4 %). Les fermantes sont concentrées sur le mode
(2,2) à 97,2 % (282/290) contre 89,3 % (895/1002) chez les non-fermantes.
Test hypergéométrique exact (= Fisher unilatéral) : p = 3,6 × 10⁻⁶. Test de
permutation, 1000 tirages : p = 0/1000. Les deux s'accordent : ce n'est pas un
effet d'effectif.

À NE PAS lire au-delà de ce que ça dit : c'est une ASSOCIATION significative,
pas un critère. Neuf grilles non fermantes sur dix portent aussi le mode
(2,2) — le spectre ne permet donc pas de prédire la fermeture. L'hypothèse la
plus probable est que les deux propriétés découlent d'une troisième, encore
non identifiée, de nature structurelle : une régularité qui favorise la
fermeture et que le spectre reflète sans la causer. C'est ce qui rend le
résultat intéressant — il y a quelque chose à trouver derrière — mais c'est
aussi pourquoi il ne figure PAS dans le papier « A Half-Shift Criterion... » :
un pont établi n'est pas encore un pont caractérisé.

Coût
----
Le spectre est immédiat. C'est la décision de fermeture qui coûte : compter
plusieurs minutes sur 9824 grilles avec une décision par retour arrière, bien
davantage avec une énumération naïve des 8^6 habillages.

Deux économies possibles, dans cet ordre :

  1. La fermeture est une propriété d'ORBITE sous Γ — vérifié, aucune orbite
     mixte. Il suffit donc de décider sur les 1292 représentants d'orbites et de
     propager. Le spectre, lui, est aussi constant sur l'orbite (les
     transformations de Γ préservent le module de la transformée, à permutation
     des indices près), donc on peut travailler entièrement sur les orbites.
  2. Le fichier de cache évite de tout recalculer entre deux essais.

Usage
-----
    python tools/spectre_et_cube.py
    python tools/spectre_et_cube.py --orbites      (sur les représentants)
    python tools/spectre_et_cube.py --json rapport.json
    python tools/spectre_et_cube.py --cache fermetures.pkl
    python tools/spectre_et_cube.py --orbites --tirages 1000 --seed 0

Dépendances : numpy.

Données lues
------------
    data/referent_360_v3.json  — les 360 cartes
    data/fonds_ecran_v1.json   — la matrice des niveaux L
"""

import argparse
import itertools
import json
import math
import os
import pickle
import sys
from collections import Counter, defaultdict

try:
    import numpy as np
except ImportError:
    sys.exit("numpy est requis : pip install numpy")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R360 = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
FONDS = os.path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json')

N = 12
HALF = N // 2
TEINTES = ('V', 'M', 'O')
BASES = ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN')
COULEURS = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}
PERMUTATIONS = [dict(zip(TEINTES, p)) for p in itertools.permutations(TEINTES)]


# ── Couches et grilles ─────────────────────────────────────────────────

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
    if any(x is None for G in lay.values() for row in G for x in row):
        raise ValueError("couches incomplètes")
    return lay


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


def involution_de(g):
    """π tel que g ∘ σ = π ∘ g, involution non triviale ; None sinon."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(s[r][c], g[r][c]) != g[r][c]:
                return None
    if any(m.get(m[k]) != k for k in m):
        return None
    return m if any(a != b for a, b in m.items()) else None


def canonique(g):
    base = []
    x = g
    for _ in range(4):
        base.append(x)
        x = quart_tour(x)
    y = miroir(g)
    for _ in range(4):
        base.append(y)
        y = quart_tour(y)
    meilleur = None
    for f in base + [sigma(b) for b in base]:
        for m in PERMUTATIONS:
            mot = ''.join(m[v] for row in f for v in row)
            if meilleur is None or mot < meilleur:
                meilleur = mot
    return meilleur


# ── Géométrie du cube ──────────────────────────────────────────────────

NOMS_FACES = ['top', 'bottom', 'front', 'back', 'left', 'right']
FACES = {
    'top':    ((0, 0, 12), (1, 0, 0), (0, 1, 0)),
    'bottom': ((0, 0, 0),  (1, 0, 0), (0, 1, 0)),
    'front':  ((0, 0, 12), (1, 0, 0), (0, 0, -1)),
    'back':   ((0, 12, 12), (1, 0, 0), (0, 0, -1)),
    'left':   ((0, 0, 12), (0, 1, 0), (0, 0, -1)),
    'right':  ((12, 0, 12), (0, 1, 0), (0, 0, -1)),
}


def aretes_du_cube():
    def sommets(face, r, c):
        O, ec, er = FACES[face]
        P = lambda i, j: tuple(O[k] + ec[k] * i + er[k] * j for k in range(3))
        return [P(c, r), P(c + 1, r), P(c + 1, r + 1), P(c, r + 1)]

    segments = defaultdict(list)
    for f in NOMS_FACES:
        for r in range(N):
            for c in range(N):
                v = sommets(f, r, c)
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


def variantes(g):
    out = []
    x = g
    for _ in range(4):
        out.append(x)
        x = quart_tour(x)
    y = miroir(g)
    for _ in range(4):
        out.append(y)
        y = quart_tour(y)
    return out


def ferme(g, pi):
    """Existe-t-il un habillage du cube satisfaisant la règle d'arête ?

    On décompose par arête — chaque contrainte ne lie que deux faces — puis on
    résout par retour arrière sur les six variables. Sortie immédiate dès qu'une
    arête est impossible."""
    R = variantes(g)
    admissibles = {}
    for (i, j), cellules in ARETES.items():
        S = {(k1, k2) for k1 in range(8) for k2 in range(8)
             if all(R[k2][r2][c2] == pi[R[k1][r1][c1]] for (r1, c1), (r2, c2) in cellules)}
        if not S:
            return False
        admissibles[(i, j)] = S

    contraintes = defaultdict(list)
    for (i, j), S in admissibles.items():
        contraintes[i].append((j, S, False))
        contraintes[j].append((i, S, True))

    choix = [None] * 6

    def pose(face):
        if face == 6:
            return True
        for k in range(8):
            ok = True
            for autre, S, inverse in contraintes[face]:
                if autre < face and choix[autre] is not None:
                    paire = (k, choix[autre]) if inverse else (choix[autre], k)
                    if paire not in S:
                        ok = False
                        break
            if ok:
                choix[face] = k
                if pose(face + 1):
                    return True
                choix[face] = None
        return False

    return pose(0)


# ── Spectre ────────────────────────────────────────────────────────────

def spectre(g):
    P = np.zeros((N, N))
    for teinte in TEINTES:
        m = np.array([[1.0 if v == teinte else 0.0 for v in row] for row in g])
        m -= m.mean()
        P += np.abs(np.fft.fft2(m)) ** 2
    P[0, 0] = 0.0
    return P


def signature(g):
    """(k², mode, part sur les axes, part sur les diagonales, part du pic)."""
    P = spectre(g)
    total = P.sum()
    if total == 0:
        return (0, (0, 0), 0.0, 0.0, 0.0)
    i, j = np.unravel_index(np.argmax(P), P.shape)
    fx, fy = min(i, N - i), min(j, N - j)
    axes = P[0, :].sum() + P[:, 0].sum()
    diag = sum(P[t, t] + P[t, (-t) % N] for t in range(1, N))
    plat = np.sort(P.flatten())[::-1]
    return (int(fx * fx + fy * fy), (int(min(fx, fy)), int(max(fx, fy))),
            float(axes / total), float(diag / total), float(plat[:4].sum() / total))


# ── Comparaison ────────────────────────────────────────────────────────

def resume(nom, echantillon):
    if not echantillon:
        print(f"  {nom} : aucun élément")
        return {}
    k2 = Counter(s[0] for s in echantillon)
    modes = Counter(s[1] for s in echantillon)
    ax = np.array([s[2] for s in echantillon])
    di = np.array([s[3] for s in echantillon])
    pic = np.array([s[4] for s in echantillon])
    print(f"  {nom} ({len(echantillon)} grilles)")
    print(f"     k² dominants : {dict(sorted(k2.items()))}")
    print(f"     modes        : {dict(sorted(modes.items())[:6])}")
    print(f"     axes         : moy {ax.mean():.4f}  min {ax.min():.4f}  max {ax.max():.4f}")
    print(f"     diagonales   : moy {di.mean():.4f}  min {di.min():.4f}  max {di.max():.4f}")
    print(f"     pic          : moy {pic.mean():.4f}  min {pic.min():.4f}  max {pic.max():.4f}")
    return {'n': len(echantillon),
            'k2': {str(k): v for k, v in sorted(k2.items())},
            'axes': [float(ax.mean()), float(ax.min()), float(ax.max())],
            'diagonales': [float(di.mean()), float(di.min()), float(di.max())],
            'pic': [float(pic.mean()), float(pic.min()), float(pic.max())]}


# ── Significativité : la concentration sur un mode est-elle réelle ? ────

def _log_choose(n, k):
    if k < 0 or k > n:
        return float('-inf')
    return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)


def hypergeom_p_ge(N_total, K_marques, n_tire, a_obs):
    """P(X >= a_obs) pour X ~ Hypergéométrique(N_total, K_marques, n_tire) —
    la probabilité d'obtenir, par un tirage sans remise de n_tire éléments
    parmi N_total dont K_marques sont « marqués », au moins a_obs marqués.
    Équivalent au p unilatéral du test exact de Fisher sur la table 2x2
    correspondante. Calculé en log-espace (log-sum-exp), donc stable même
    pour N_total dans les milliers, où les C(n,k) bruts débordent un float."""
    k_min = max(0, n_tire - (N_total - K_marques))
    k_max = min(n_tire, K_marques)
    a_obs = max(a_obs, k_min)
    if a_obs > k_max:
        return 0.0
    log_denom = _log_choose(N_total, n_tire)
    logs = [_log_choose(K_marques, k) + _log_choose(N_total - K_marques, n_tire - k) - log_denom
            for k in range(a_obs, k_max + 1)]
    m = max(logs)
    return float(sum(math.exp(x - m) for x in logs) * math.exp(m))


def test_permutation(N_total, K_marques, n_tire, a_obs, tirages, seed):
    """Même question que hypergeom_p_ge, estimée par tirage aléatoire plutôt
    que calculée exactement — sert de contrôle indépendant sur le même
    calcul, pas de méthode alternative en soi."""
    rng = np.random.default_rng(seed)
    pool = np.zeros(N_total, dtype=bool)
    pool[:K_marques] = True
    depasse = 0
    for _ in range(tirages):
        rng.shuffle(pool)
        if pool[:n_tire].sum() >= a_obs:
            depasse += 1
    return depasse / tirages


def teste_concentration(ferment, non, mode_cible, tirages, seed):
    n_f, n_n = len(ferment), len(non)
    N_total = n_f + n_n
    a = sum(1 for s in ferment if s[1] == mode_cible)
    c = sum(1 for s in non if s[1] == mode_cible)
    K = a + c

    print(f"Test de significativité — concentration sur le mode {mode_cible}")
    print(f"    ferment        : {a}/{n_f}  ({100 * a / n_f:.1f} %)" if n_f else "    ferment : —")
    print(f"    ne ferment pas : {c}/{n_n}  ({100 * c / n_n:.1f} %)" if n_n else "    ne ferment pas : —")

    if K == 0 or K == N_total or n_f == 0 or n_n == 0:
        print("    dégénéré (mode absent, universel, ou groupe vide) — test sauté")
        return {'a': a, 'c': c, 'p_fisher': None, 'p_permutation': None}

    p_exact = hypergeom_p_ge(N_total, K, n_f, a)
    p_perm = test_permutation(N_total, K, n_f, a, tirages, seed)
    print(f"    hypergéométrique exact (= Fisher unilatéral) : p = {p_exact:.4g}")
    print(f"    permutation ({tirages} tirages, seed={seed})     : p = {p_perm:.4g}")

    seuil = 0.05
    if p_exact < seuil:
        print(f"    → p < {seuil} : l'écart n'est PAS un simple effet d'effectif — "
              f"la concentration sur {mode_cible} est significative.")
    else:
        print(f"    → p >= {seuil} : compatible avec un effet d'effectif seul — "
              f"pas de preuve d'un lien avec la fermeture.")
    return {'a': a, 'c': c, 'K': K, 'N': N_total, 'p_fisher': p_exact, 'p_permutation': p_perm}


def main():
    ap = argparse.ArgumentParser(description="Le spectre distingue-t-il les grilles qui ferment ?")
    ap.add_argument('--orbites', action='store_true',
                    help="travaille sur les 1292 représentants d'orbites (bien plus rapide)")
    ap.add_argument('--cache', metavar='FICHIER', default=None,
                    help='fichier de cache pour les décisions de fermeture')
    ap.add_argument('--tirages', type=int, default=1000,
                    help='nombre de tirages du test de permutation (défaut 1000)')
    ap.add_argument('--seed', type=int, default=0, help='graine du test de permutation')
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
    print(f"couches : {len(cles)}\n")

    # ── l'ensemble des grilles qui pavent ─────────────────────────────
    grilles = {}
    for a, b in itertools.combinations(cles, 2):
        for n in range(64):
            g = phi(n, lay[a], lay[b], L)
            if g in grilles:
                continue
            pi = involution_de(g)
            if pi is not None:
                grilles[g] = pi
    print(f"grilles qui pavent simplement : {len(grilles)}")

    # ── condition de sommet, pour mémoire ─────────────────────────────
    coins = ((0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1))
    sommets = sum(1 for g, pi in grilles.items() if all(pi[g[r][c]] == g[r][c] for r, c in coins))
    print(f"angles π-fixes : {sommets}/{len(grilles)}"
          + ("  ✓" if sommets == len(grilles) else "  ✗"))
    print()

    # ── réduction éventuelle aux orbites ──────────────────────────────
    if arg.orbites:
        print("réduction aux représentants d'orbites de Γ…")
        par_orbite = {}
        for g in grilles:
            par_orbite.setdefault(canonique(g), g)
        travail = {g: grilles[g] for g in par_orbite.values()}
        print(f"  {len(travail)} représentants\n")
    else:
        travail = grilles

    # ── décision de fermeture ─────────────────────────────────────────
    cache = {}
    if arg.cache and os.path.exists(arg.cache):
        cache = pickle.load(open(arg.cache, 'rb'))
        print(f"cache chargé : {len(cache)} décisions")

    ferment, non = [], []
    fait = 0
    for g, pi in travail.items():
        if g in cache:
            r = cache[g]
        else:
            r = ferme(g, pi)
            cache[g] = r
        (ferment if r else non).append(signature(g))
        fait += 1
        if fait % 500 == 0:
            print(f"  … {fait}/{len(travail)}", flush=True)

    if arg.cache:
        pickle.dump(cache, open(arg.cache, 'wb'))

    total = len(ferment) + len(non)
    print(f"\nfermeture sur le cube : {len(ferment)}/{total}  ({100 * len(ferment) / total:.1f} %)\n")

    print("Signatures spectrales comparées")
    a = resume("ferment", ferment)
    b = resume("ne ferment pas", non)
    print()

    # ── verdict brut (moyennes et k² présents) ─────────────────────────
    identiques = (a.get('k2') == b.get('k2')
                  and abs(a['axes'][0] - b['axes'][0]) < 1e-9
                  and abs(a['diagonales'][0] - b['diagonales'][0]) < 1e-9)
    if identiques:
        print("VERDICT (brut) — les deux populations ont la même signature. Le spectre")
        print("est aveugle à la fermeture : géométrie de raccordement et contenu")
        print("fréquentiel restent indépendants dans ce système.")
        test = None
    else:
        print("VERDICT (brut) — les signatures diffèrent en surface. Avant d'en tirer")
        print("quoi que ce soit, il faut écarter un simple effet d'effectif :")
        print()
        modes_ferment = Counter(s[1] for s in ferment)
        mode_cible = modes_ferment.most_common(1)[0][0] if modes_ferment else None
        test = teste_concentration(ferment, non, mode_cible, arg.tirages, arg.seed) if mode_cible else None
        print()
        if test and test['p_fisher'] is not None and test['p_fisher'] < 0.05:
            print("VERDICT (final) — l'écart resiste au contrôle d'effectif : c'est un lien")
            print("réel entre spectre et fermeture, à caractériser plus avant.")
        else:
            print("VERDICT (final) — l'écart de surface ne resiste pas au contrôle")
            print("d'effectif : rien n'indique un lien entre spectre et fermeture ici.")

    if arg.json:
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump({'grilles': len(grilles), 'sommets_ok': sommets,
                       'travail': len(travail), 'ferment': len(ferment),
                       'signatures': {'ferment': a, 'non': b},
                       'identiques_brut': bool(identiques),
                       'test_concentration': test}, fh, ensure_ascii=False, indent=2)
        print(f"\nrapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
