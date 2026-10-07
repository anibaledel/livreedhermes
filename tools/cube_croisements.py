#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
cube_croisements.py — Le cube sur les paires qui croisent les familles.

Reproduit la Proposition 3 et le Théorème 4 (section 7) de la note
« A Half-Shift Criterion on Three-Colour 12×12 Grids, and Its Restriction
on the Cube ».

Contexte
--------
tools/tous_croisements.py dénombre l'ensemble élargi : 113 280
constructions, 16 768 qui pavent (g ∘ σ = π ∘ g pour une involution non
triviale π), 9 824 grilles distinctes, 1 292 orbites de Γ. Parmi les 1770
paires de couches, 240 pavent intégralement sur leurs 64 indices : les 16
paires intra-famille du Théorème 2 (le corpus catalogué), et 224 qui
croisent les familles. Ce script porte sur ces 240 paires : est-ce
qu'elles ferment sur le cube, et comment ?

π n'est plus tiré d'un couple de couches (B = π∘A, condition FORTE,
Définition 3) : aucune paire inter-familles ne la vérifie. Il est extrait
de chaque grille isolément, via g∘σ = π∘g (condition FAIBLE, section 6) —
c'est ce que fait extrait_pi() ci-dessous. La géométrie du cube (ARETES,
habillage(), angles_fixes()) est importée telle quelle depuis
tools/cube_edges.py : ce sont des fonctions pures en (grille, π),
indépendantes de la provenance de π.

Ce que fait ce script
----------------------
1. Contrôle des hypothèses : la matrice des niveaux L est invariante par
   σ (comme dans tools/tous_croisements.py) ; les familles admissibles du
   Théorème 2 (celles qui contiennent une paire unifiée) sont retrouvées
   par un test opérationnel — pas supposées — et chacune se décompose,
   par son nom (PAR2-X-Y = {X,Y}, PAR3-SANS-X = les quatre bases moins X,
   sinon une base seule — la convention de tools/generate_referent_360.py),
   en un ensemble de bases contenant EXACTEMENT une base de type yang
   (Théorème 2) ; c'est ce qui définit son « type » (yang ou yang-mut).

2. Reconstruit les 224 paires de natures qui croisent les familles et
   pavent sur leurs 64 grilles (comme paires_croisees.py), et pour
   chacune des C(8,2) = 28 paires de familles admissibles, réunit tous
   les couples de natures qualifiants — sur les grilles BRUTES, sans
   exclure celles qui coïncident avec le corpus catalogué : les exclure
   avant de compter viderait les paires dont toute la sortie coïncide
   avec le corpus (deux des 28, rencontrées en pratique).

3. Condition de sommet (Proposition 3) : vérifiée sur toutes les grilles
   distinctes de ces 224 paires — pas seulement les 28 admissibles,
   puisque la proposition porte sur tout ce qui pave, corpus compris.

4. Règle d'arête, par paire de familles : la trichotomie du Théorème 4.
   28 paires suivant leur type (yang/yang-mut) :
       - même type yang       (6 paires) : toutes les grilles ferment ;
       - même type yang-mut   (6 paires) : aucune ne ferme ;
       - types différents    (16 paires) : quatre indices sur 64 par
         couple de natures qualifiant, toujours les mêmes deux ensembles
         {0,2,16,18} ou {45,47,61,63} selon le type de A, et toujours
         équivalents à « les niveaux 1, 3, 4 et 6 vont tous à la couche
         de type yang » — vérifié explicitement ci-dessous, pas
         seulement constaté numériquement.

5. Bilan sur l'ensemble élargi complet (9 824 grilles = 512 du corpus +
   9 312 hors corpus, réunion exacte — vérifiée ci-dessous, pas
   supposée) : condition de sommet et règle d'arête, en reprenant
   l'admissibilité du corpus depuis les mêmes règles que
   tools/cube_edges.py (reconstruites ici, pas importées, pour que ce
   script reste autonome sur cette section du papier) et celle des 224
   paires déjà calculée au point 4. Reproduit le 2 064/9 824 (21,0 %)
   de la section 7, décomposé en 256/512 (corpus) et 1 808/9 312 (hors
   corpus, 19,4 %).

Usage
-----
    python tools/cube_croisements.py
    python tools/cube_croisements.py --json rapport.json

Données lues
------------
    data/referent_360_v3.json — les 360 cartes
    data/fonds_ecran_v1.json  — la matrice des niveaux L
"""

import argparse
import itertools
import json
import os
import sys
import time
from collections import defaultdict

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

from paires_croisees import (  # noqa: E402  source unique, non dupliquée
    N, R360, FONDS, charge_couches, sigma, phi, condition_faible, canonique,
)
from cube_edges import habillage, angles_fixes  # noqa: E402  idem

TOUTES_BASES = {'YANG', 'YANG-MUT', 'YIN', 'YIN-MUT'}
H = frozenset({0, 2, 16, 18})           # sous-groupe engendré par les niveaux 2 et 5
COSET_A_YANG = frozenset({45, 47, 61, 63})    # H translaté par 45 = 101101_2


def bases_de(famille):
    """Le sous-ensemble de bases qu'encode le nom de la famille, selon la
    convention de tools/generate_referent_360.py : PAR2-X-Y = {X, Y},
    PAR3-SANS-X = les quatre bases moins X, sinon une base seule."""
    if famille.startswith('PAR3-SANS-'):
        return TOUTES_BASES - {famille[len('PAR3-SANS-'):]}
    if famille.startswith('PAR2-'):
        reste = famille[len('PAR2-'):]
        for b in sorted(TOUTES_BASES, key=len, reverse=True):
            if reste.startswith(b + '-') and reste[len(b) + 1:] in TOUTES_BASES:
                return {b, reste[len(b) + 1:]}
        raise ValueError(f"PAR2 mal segmenté : {famille!r}")
    if famille in TOUTES_BASES:
        return {famille}
    raise ValueError(f"famille non reconnue : {famille!r}")


def type_de(famille):
    """Le type (base de type yang) d'une famille admissible — exactement
    une par le Théorème 2, vérifié ici plutôt que supposé."""
    bases = bases_de(famille)
    yang = bases & {'YANG', 'YANG-MUT'}
    if len(yang) != 1:
        raise ValueError(f"{famille} : {len(yang)} base(s) de type yang (1 attendue) — "
                          f"n'est pas une famille admissible du Théorème 2")
    return yang.pop()


def extrait_pi(g):
    """π tel que g∘σ = π∘g, involution non triviale — ou None. Variante de
    condition_faible() (paires_croisees.py) qui rend l'application plutôt
    qu'un booléen : même calcul, même critère."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(s[r][c], g[r][c]) != g[r][c]:
                return None
    if any(m.get(m[k]) != k for k in m):
        return None
    if all(a == b for a, b in m.items()):
        return None
    return m


def famille_de(cle):
    return cle[0]


def niveaux_constants(S, positions):
    """S est-il exactement {n : les bits de `positions` valent tous v},
    v libre parmi les deux, les autres bits variant librement ? Rend v ou
    None."""
    for v in (0, 1):
        attendu = set()
        autres = [b for b in range(6) if b not in positions]
        for combo in itertools.product((0, 1), repeat=len(autres)):
            n = 0
            for b in positions:
                n |= v << b
            for b, bit in zip(autres, combo):
                n |= bit << b
            attendu.add(n)
        if S == attendu:
            return v
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                  formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--json', metavar='FICHIER', help='écrit un rapport détaillé')
    arg = ap.parse_args()

    for chemin in (R360, FONDS):
        if not os.path.exists(chemin):
            sys.exit(f"données introuvables : {chemin}")

    t0 = time.time()
    lay = charge_couches(R360)
    L = json.load(open(FONDS, encoding='utf-8'))['layerOf']
    cles = sorted(lay)

    # ── hypothèses ───────────────────────────────────────────────────────
    # sigma() (paires_croisees.py) rend une liste de listes, comme L
    # lui-même tel que chargé du JSON : ne pas convertir avant de comparer.
    if sigma(L) != L:
        sys.exit("hypothèse en défaut : la matrice des niveaux n'est pas invariante par σ")

    familles = sorted({f for f, _ in cles})
    admissibles_fam = []
    for f in familles:
        natures_f = [k for k in cles if k[0] == f]
        if any(a != b and sigma(lay[a]) == lay[b] for a in natures_f for b in natures_f):
            admissibles_fam.append(f)
    admissibles_fam.sort()
    types = {f: type_de(f) for f in admissibles_fam}
    if len(admissibles_fam) != 8:
        sys.exit(f"hypothèse en défaut : {len(admissibles_fam)} familles admissibles (8 attendues)")
    n_yang = sum(1 for t in types.values() if t == 'YANG')
    if n_yang != 4 or len(types) - n_yang != 4:
        sys.exit(f"hypothèse en défaut : {n_yang} familles de type yang, "
                  f"{len(types) - n_yang} de type yang-mut (4 et 4 attendues)")
    print(f"familles admissibles (Théorème 2) : {len(admissibles_fam)}")
    for f in admissibles_fam:
        print(f"    {f:22s}  type {types[f]}")
    print(f"({time.time() - t0:.0f}s)")
    print()

    # ── les 224 paires de natures inter-familles qui pavent intégralement ──
    t0 = time.time()
    croisees = []
    for a, b in itertools.combinations(cles, 2):
        if a[0] == b[0]:
            continue
        grilles = [phi(n, lay[a], lay[b], L) for n in range(64)]
        if all(condition_faible(g) for g in grilles):
            croisees.append((a, b))
    print(f"paires de natures inter-familles qui pavent intégralement : {len(croisees)}"
          + ("  ✓ 224 attendues" if len(croisees) == 224 else "  ✗"))
    print(f"({time.time() - t0:.0f}s)")
    print()

    # grilles brutes par paire de FAMILLES — union sur les couples de
    # natures qualifiants, corpus inclus (voir docstring, point 2)
    par_famille = defaultdict(set)
    couples_de_natures = defaultdict(list)
    for a, b in croisees:
        fp = (famille_de(a), famille_de(b))
        couples_de_natures[fp].append((a, b))
        for n in range(64):
            par_famille[fp].add(tuple(tuple(r) for r in phi(n, lay[a], lay[b], L)))
    if len(par_famille) != 28:
        sys.exit(f"hypothèse en défaut : {len(par_famille)} paires de familles (28 attendues)")

    # ── 3. condition de sommet (Proposition 3) ──────────────────────────
    t0 = time.time()
    toutes_grilles = set()
    for gs in par_famille.values():
        toutes_grilles.update(gs)
    n_sommet_ok = 0
    pis = {}
    for g in toutes_grilles:
        pi = extrait_pi(g)
        assert pi is not None, "grille de l'ensemble élargi sans π — hypothèse en défaut"
        pis[g] = pi
        if angles_fixes([list(r) for r in g], pi):
            n_sommet_ok += 1
    print("3. Condition de sommet (Proposition 3)")
    print(f"    angles de teinte π-fixe : {n_sommet_ok}/{len(toutes_grilles)}"
          + ("  ✓ 100%" if n_sommet_ok == len(toutes_grilles) else "  ✗"))
    print(f"    ({time.time() - t0:.0f}s)")
    print()

    # ── 4. règle d'arête et trichotomie (Théorème 4) ────────────────────
    t0 = time.time()
    admissible = {}
    for g in toutes_grilles:
        ks, _ = habillage([list(r) for r in g], pis[g])
        admissible[g] = ks is not None
    print(f"grilles distinctes testées : {len(toutes_grilles)}  ({time.time() - t0:.0f}s)")
    print()

    fermantes, jamais, quatre_indices = [], [], []
    for fp, gs in sorted(par_famille.items()):
        n_ok = sum(admissible[g] for g in gs)
        if n_ok == len(gs):
            fermantes.append(fp)
        elif n_ok == 0:
            jamais.append(fp)
        else:
            quatre_indices.append(fp)

    print("Théorème 4 — trichotomie sur les 28 paires de familles admissibles")
    print(f"    même type yang      : {len(fermantes)} paires — toutes les grilles ferment")
    for fp in fermantes:
        t = (types[fp[0]], types[fp[1]])
        assert t == ('YANG', 'YANG'), f"{fp} : types {t}, attendu (YANG, YANG)"
    print(f"    même type yang-mut   : {len(jamais)} paires — aucune ne ferme")
    for fp in jamais:
        t = (types[fp[0]], types[fp[1]])
        assert t == ('YANG-MUT', 'YANG-MUT'), f"{fp} : types {t}, attendu (YANG-MUT, YANG-MUT)"
    print(f"    types différents     : {len(quatre_indices)} paires — quatre indices par couple de natures")
    print()

    ok28 = len(fermantes) == 6 and len(jamais) == 6 and len(quatre_indices) == 16
    print(f"6 + 6 + 16 = 28 : {'✓' if ok28 else '✗ (' + str(len(fermantes)) + ' + ' + str(len(jamais)) + ' + ' + str(len(quatre_indices)) + ')'}")
    print()

    # ── vérification fine du troisième bloc ─────────────────────────────
    print("Détail des 16 paires à types différents")
    NIVEAUX_PERIPHERIQUES = {0, 2, 3, 5}    # niveaux 1, 3, 4, 6 (bit = niveau - 1)
    tous_h_ou_coset = True
    tous_equiv_niveaux = True
    for fp in quatre_indices:
        fa, fb = fp
        indices_par_couple = []
        for a, b in couples_de_natures[fp]:
            S = set()
            for n in range(64):
                g = tuple(tuple(r) for r in phi(n, lay[a], lay[b], L))
                if admissible[g]:
                    S.add(n)
            indices_par_couple.append(S)
        # les huit couples qualifiants d'une paire de familles donnent
        # tous le même ensemble d'indices admissibles (vérifié)
        distincts = {frozenset(S) for S in indices_par_couple}
        if len(distincts) != 1:
            tous_h_ou_coset = False
            print(f"    {fa} × {fb} : PAS UN ENSEMBLE UNIQUE — {sorted(distincts)}")
            continue
        S = set(next(iter(distincts)))
        attendu = H if types[fa] == 'YANG-MUT' else COSET_A_YANG
        est_attendu = S == set(attendu)
        v = niveaux_constants(S, NIVEAUX_PERIPHERIQUES)
        equiv_niveaux = v is not None
        tous_h_ou_coset &= est_attendu
        tous_equiv_niveaux &= equiv_niveaux
        print(f"    {fa} (type {types[fa]}) × {fb} (type {types[fb]})   "
              f"{len(S)}/64 par couple de natures ({len(couples_de_natures[fp])} couples)   "
              f"S={sorted(S)}   "
              f"= {'{0,2,16,18}' if S == set(H) else '{45,47,61,63}' if S == set(COSET_A_YANG) else '?'}"
              f"  {'✓' if est_attendu else '✗'}   "
              f"niveaux 1,3,4,6 constants à {v if equiv_niveaux else '?'}  {'✓' if equiv_niveaux else '✗'}")

    print()
    print(f"toutes les 16 paires donnent {{0,2,16,18}} ou {{45,47,61,63}} selon le type de A : "
          + ('✓' if tous_h_ou_coset else '✗'))
    print(f"cela équivaut, pour les 16, à « les niveaux 1, 3, 4 et 6 vont tous à la couche de type yang » : "
          + ('✓' if tous_equiv_niveaux else '✗'))
    print()

    # ── 5. ensemble élargi complet : 9 824 = corpus (512) + hors corpus ────
    t0 = time.time()
    corpus = set()
    for a in cles:
        for b in cles:
            if a[0] == b[0] and a != b and sigma(lay[a]) == lay[b]:
                for n in range(64):
                    corpus.add(tuple(tuple(r) for r in phi(n, lay[a], lay[b], L)))

    for g in corpus - toutes_grilles:
        pi = extrait_pi(g)
        assert pi is not None, "grille du corpus sans π — hypothèse en défaut"
        pis[g] = pi
        ks, _ = habillage([list(r) for r in g], pi)
        admissible[g] = ks is not None

    ensemble = toutes_grilles | corpus
    print("5. Ensemble élargi complet (corpus + hors corpus)")
    print(f"    grilles : {len(ensemble)}" + ("  ✓ 9824 attendues" if len(ensemble) == 9824 else "  ✗"))
    n_sommet_total = sum(1 for g in ensemble if angles_fixes([list(r) for r in g], pis[g]))
    print(f"    Proposition 3, angles π-fixes : {n_sommet_total}/{len(ensemble)}"
          + ("  ✓ 100%" if n_sommet_total == len(ensemble) else "  ✗"))
    n_adm_corpus = sum(admissible[g] for g in corpus)
    hors = ensemble - corpus
    n_adm_hors = sum(admissible[g] for g in hors)
    n_adm_total = n_adm_corpus + n_adm_hors
    print(f"    règle d'arête, corpus     : {n_adm_corpus}/{len(corpus)} "
          f"({100 * n_adm_corpus / len(corpus):.1f} %)")
    print(f"    règle d'arête, hors corpus : {n_adm_hors}/{len(hors)} "
          f"({100 * n_adm_hors / len(hors):.1f} %)")
    print(f"    règle d'arête, ensemble    : {n_adm_total}/{len(ensemble)} "
          f"({100 * n_adm_total / len(ensemble):.1f} %)")

    orb_hors = defaultdict(set)
    for g in hors:
        orb_hors[canonique([list(r) for r in g])].add(g)
    mixtes = sum(1 for o in orb_hors.values() if len({admissible[g] for g in o}) > 1)
    orb_adm = sum(1 for o in orb_hors.values() if all(admissible[g] for g in o))
    print(f"    orbites hors corpus : {len(orb_hors)} ; mixtes : {mixtes}"
          + ("  ✓ aucune" if not mixtes else "  ✗")
          + f" ; admissibles : {orb_adm} ({100 * orb_adm / len(orb_hors):.1f} %)")
    print(f"    ({time.time() - t0:.0f}s)")

    if arg.json:
        rapport = {
            'familles_admissibles': {f: types[f] for f in admissibles_fam},
            'paires_croisees_completes': len(croisees),
            'grilles_distinctes': len(toutes_grilles),
            'sommet': {'ok': n_sommet_ok, 'total': len(toutes_grilles)},
            'trichotomie': {
                'fermantes': [list(p) for p in fermantes],
                'jamais': [list(p) for p in jamais],
                'quatre_indices': [list(p) for p in quatre_indices],
            },
            'coset_et_niveaux_verifies': tous_h_ou_coset and tous_equiv_niveaux,
            'ensemble_elargi': {
                'grilles': len(ensemble),
                'sommet_ok': n_sommet_total,
                'aretes': {'corpus': [n_adm_corpus, len(corpus)],
                           'hors_corpus': [n_adm_hors, len(hors)],
                           'total': [n_adm_total, len(ensemble)]},
                'orbites_hors_corpus': {'total': len(orb_hors), 'mixtes': mixtes,
                                        'admissibles': orb_adm},
            },
        }
        with open(arg.json, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"\nrapport écrit : {arg.json}")


if __name__ == '__main__':
    main()
