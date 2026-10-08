#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
cube_croisements.py — La règle d'arête au-delà du corpus (Section 7).

Reproduit la Proposition 3 et le Théorème 4 de la note.

1. Reconstruit l'ensemble élargi : les grilles Φ(n, A, B) qui pavent
   simplement (g ∘ σ = π ∘ g, π involution non triviale), A et B pris
   parmi les 60 couches sans restriction de famille — 9 824 grilles.
2. Proposition 3 : les quatre angles portent la teinte π-fixe sur chacune.
3. Règle d'arête sur chacune (décision par retour arrière sur D4⁶ après
   réduction par arête) : 2 064 grilles admissibles sur 9 824 (21,0 %), dont
   256 dans le corpus et 1 808 hors corpus (19,4 % des 9 312).
   Aucune orbite de Γ n'est mixte ; 226 des 1 164 orbites hors corpus sont
   admissibles.
4. Théorème 4 : sur les 28 paires de familles admissibles, les 224 couples
   de couches qui pavent entièrement se répartissent en
     - même type yang     (6 paires, 48 couples) : les 64 indices ferment ;
     - même type yang-mut (6 paires, 48 couples) : aucun ;
     - types opposés     (16 paires, 128 couples) : exactement 4 indices,
       ceux où les niveaux périphériques {1,3,4,6} vont tous à la couche
       de type YANG — {45,47,61,63} si A est yang, {0,2,16,18} si A est
       yang-mut — les niveaux centraux {2,5} restant libres.

S'appuie sur cube_edges.py (ARETES, variantes — la géométrie du cube et ses
symétries) : ce fichier doit se trouver dans le même dossier.

Usage
-----
    python tools/cube_croisements.py            (quelques minutes)
    python tools/cube_croisements.py --theoreme-4-seulement

Données lues
------------
    data/referent_360_v3.json, data/fonds_ecran_v1.json (matrice des niveaux)
"""
import argparse
import itertools
import json
import os
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import cube_edges as ce         # ARETES, variantes
except ImportError:
    sys.exit("cube_edges.py introuvable : ce script doit rester dans le même "
              "dossier que cube_edges.py (fourni dans le même paquet).")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R360 = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
FONDS = os.path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json')

N = 12
HALF = N // 2
PERIPHERIQUES = (1, 3, 4, 6)
CENTRAUX = (2, 5)
TEINTES = ('V', 'M', 'O')
BASES = ('YANG-MUT', 'YIN-MUT', 'YANG', 'YIN')
COULEURS = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}
PERMUTATIONS = [dict(zip(TEINTES, p)) for p in itertools.permutations(TEINTES)]


# ── Repris de tools/tous_croisements.py (couches, σ, Φ, pave, canonique) ──
# Copié ici plutôt qu'importé : un script du paquet de soumission doit se
# lancer seul, sans dépendre d'un autre fichier du même dossier. Le dépôt,
# lui, garde tous_croisements.py avec cette même définition, côte à côte.

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


def type_famille(f):
    """Le type d'une famille admissible : la base de type yang qu'elle contient."""
    if f.startswith('PAR3-SANS-'):
        return 'yang' if f == 'PAR3-SANS-YANG-MUT' else 'yang-mut'
    return 'yang-mut' if 'YANG-MUT' in f else 'yang'


def pi_de(g):
    """L'involution π telle que g ∘ σ = π ∘ g (g suppose pavante)."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            m.setdefault(s[r][c], g[r][c])
    return m


def habillage_existe(g, pi):
    """Règle d'arête : existe-t-il un choix d'élément de D4 par face ?
    Réduction par arête (cube_edges), puis retour arrière sur les six faces."""
    R = ce.variantes([list(r) for r in g])
    d = len(R)
    adm = {}
    for (i, j), cells in ce.ARETES.items():
        S = {(k1, k2) for k1 in range(d) for k2 in range(d)
             if all(R[k2][r2][c2] == pi[R[k1][r1][c1]] for (r1, c1), (r2, c2) in cells)}
        if not S:
            return False
        adm[(i, j)] = S

    def bt(ks):
        f = len(ks)
        if f == 6:
            return True
        return any(bt(ks + [k]) for k in range(d)
                   if all((ks[i], k) in adm[(i, f)] for i in range(f) if (i, f) in adm))
    return bt([])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--theoreme-4-seulement', action='store_true')
    arg = ap.parse_args()

    lay = charge_couches(R360)
    L = json.load(open(FONDS, encoding='utf-8'))['layerOf']
    cles = sorted(lay)

    # ── Théorème 4 ────────────────────────────────────────────────────
    admissibles = {}
    for f in sorted({f for f, _ in cles}):
        ks = [k for k in cles if k[0] == f]
        if any(sigma(lay[a]) == lay[b] for a in ks for b in ks if a != b):
            admissibles[f] = type_famille(f)
    print(f"familles admissibles : {len(admissibles)} "
          f"({sum(1 for t in admissibles.values() if t == 'yang')} yang, "
          f"{sum(1 for t in admissibles.values() if t == 'yang-mut')} yang-mut)")

    blocs = defaultdict(Counter)
    n_couples = Counter()
    for F, G in itertools.combinations(sorted(admissibles), 2):
        tF, tG = admissibles[F], admissibles[G]
        bloc = 'yang/yang' if tF == tG == 'yang' else 'yang-mut/yang-mut' if tF == tG else 'opposés'
        for a in [k for k in cles if k[0] == F]:
            for b in [k for k in cles if k[0] == G]:
                gs = [phi(n, lay[a], lay[b], L) for n in range(64)]
                if not all(pave(g) for g in gs):
                    continue
                n_couples[bloc] += 1
                idx = tuple(sorted(n for n, g in enumerate(gs) if habillage_existe(g, pi_de(g))))
                # les niveaux périphériques vont-ils tous à la couche yang ?
                couche_yang_est_A = (tF == 'yang')
                attendu = tuple(sorted(n for n in range(64)
                                       if all(((n >> (l - 1)) & 1) == (1 if couche_yang_est_A else 0)
                                              for l in PERIPHERIQUES))) if bloc == 'opposés' else None
                cle = ('tous' if len(idx) == 64 else 'aucun' if not idx else idx)
                blocs[bloc][(cle, 'conforme' if bloc != 'opposés' or idx == attendu else 'NON conforme')] += 1

    print("\nThéorème 4 — couples de couches pavant entièrement, par bloc")
    for bloc in ('yang/yang', 'yang-mut/yang-mut', 'opposés'):
        print(f"    {bloc:<18} {n_couples[bloc]:>4} couples : "
              + ', '.join(f"{k[0]} ×{v} [{k[1]}]" for k, v in sorted(blocs[bloc].items(), key=str)))
    ok4 = (all(k[0] == 'tous' for k in blocs['yang/yang']) and all(k[0] == 'aucun' for k in blocs['yang-mut/yang-mut'])
           and all(k[1] == 'conforme' and len(k[0]) == 4 for k in blocs['opposés']))
    print(f"    trichotomie : {'✓' if ok4 else '✗'}  (périphériques → couche yang ; centraux libres)")

    if arg.theoreme_4_seulement:
        return

    # ── Ensemble élargi, Proposition 3, règle d'arête ─────────────────
    corpus = set()
    for a in cles:
        for b in cles:
            if a[0] == b[0] and a != b and sigma(lay[a]) == lay[b]:
                for n in range(64):
                    corpus.add(phi(n, lay[a], lay[b], L))
    grilles = set()
    for a, b in itertools.combinations(cles, 2):
        for n in range(64):
            g = phi(n, lay[a], lay[b], L)
            if pave(g):
                grilles.add(g)
    print(f"\nEnsemble élargi : {len(grilles)} grilles, dont {len(grilles & corpus)} du corpus")

    coins = 0
    adm = set()
    for g in grilles:
        pi = pi_de(g)
        coins += all(pi[g[r][c]] == g[r][c] for r, c in ((0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1)))
        if habillage_existe(g, pi):
            adm.add(g)
    print(f"Proposition 3 — angles π-fixes : {coins}/{len(grilles)}" + ("  ✓" if coins == len(grilles) else "  ✗"))
    hors = grilles - corpus
    print("Règle d'arête (Section 7)")
    print(f"    admissibles : {len(adm)}/{len(grilles)} ({100 * len(adm) / len(grilles):.1f} %)")
    print(f"    dans le corpus : {len(adm & corpus)}/{len(corpus)} ; hors corpus : {len(adm & hors)}/{len(hors)} ({100 * len(adm & hors) / len(hors):.1f} %)")

    orb = defaultdict(set)
    for g in grilles:
        orb[canonique(g)].add(g)
    orb_corpus = {canonique(g) for g in corpus}
    mixtes = sum(1 for o in orb.values() if 0 < sum(g in adm for g in o) < len(o))
    dehors = [k for k in orb if k not in orb_corpus]
    adm_dehors = sum(1 for k in dehors if next(iter(orb[k])) in adm)
    print(f"    orbites de Γ : {len(orb)} ; mixtes : {mixtes} ; hors corpus : {len(dehors)} ; "
          f"admissibles hors corpus : {adm_dehors} ({100 * adm_dehors / len(dehors):.1f} %)")


if __name__ == '__main__':
    main()
