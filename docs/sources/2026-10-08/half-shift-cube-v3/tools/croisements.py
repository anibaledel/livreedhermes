#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
croisements.py — Vérification de la Section 7 (« Beyond the corpus: crossing
families ») : toutes les paires de couches, pavage simple, orbites de Γ,
condition de sommet (Proposition 3), règle d'arête et trichotomie (Théorème 4).

S'appuie sur cube_edges.py (mêmes données, mêmes conventions). La recherche
d'habillage procède par retour arrière sur les six faces, ce qui décide les
~10 000 grilles en quelques minutes.

    python tools/croisements.py
    python tools/croisements.py --json rapport.json
"""
import argparse, itertools, json, os, sys, time
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import cube_edges as ce
except ImportError:
    sys.exit("cube_edges.py introuvable : ce script doit rester dans le même "
              "dossier que cube_edges.py (fourni dans le même paquet).")

N = 12
TRANSPOS = [{'V': 'M', 'M': 'V', 'O': 'O'}, {'V': 'O', 'O': 'V', 'M': 'M'}, {'M': 'O', 'O': 'M', 'V': 'V'}]


def tuple_g(g):
    return tuple(tuple(r) for r in g)


def involutions_pavage(g):
    """Involutions non triviales π avec g ∘ σ = π ∘ g."""
    s = ce.demi_decalage([list(r) for r in g])
    return [p for p in TRANSPOS if all(s[r][c] == p[g[r][c]] for r in range(N) for c in range(N))]


def habillage(g, pi):
    """Retour arrière sur les six faces ; rend True si un habillage existe."""
    R = ce.variantes([list(r) for r in g])
    adm = {}
    for (i, j), cellules in ce.ARETES.items():
        adm[(i, j)] = {(a, b) for a in range(8) for b in range(8)
                       if all(R[b][r2][c2] == pi[R[a][r1][c1]] for (r1, c1), (r2, c2) in cellules)}
        if not adm[(i, j)]:
            return False
    ks = [None] * 6

    def ok(f):
        for (i, j), S in adm.items():
            if f in (i, j) and ks[i] is not None and ks[j] is not None and (ks[i], ks[j]) not in S:
                return False
        return True

    def rec(f):
        if f == 6:
            return True
        for k in range(8):
            ks[f] = k
            if ok(f) and rec(f + 1):
                return True
        ks[f] = None
        return False
    return rec(0)


def orbite(g):
    out = set()
    for h in ce.variantes([list(r) for r in g]):
        for s in (h, ce.demi_decalage(h)):
            for p in itertools.permutations('VMO'):
                m = dict(zip('VMO', p))
                out.add(tuple(tuple(m[x] for x in r) for r in s))
    return frozenset(out)


def main(json_path=None):
    t0 = time.time()
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    couches = [(f, a) for f in sorted(F) for a in ('yang', 'yang_mut', 'yin', 'yin_mut') if a in F[f]]
    print(f"couches : {len(couches)}")
    paires = list(itertools.combinations(range(len(couches)), 2))
    print(f"paires non ordonnées : {len(paires)} ; constructions : {len(paires) * 64}")

    conformes = 0
    grilles = {}                      # grille -> π
    par_paire = Counter()
    for i, j in paires:
        A, B = F[couches[i][0]][couches[i][1]], F[couches[j][0]][couches[j][1]]
        for n in range(64):
            g = tuple_g(ce.phi(n, A, B, L))
            pis = involutions_pavage(g)
            if pis:
                conformes += 1
                par_paire[(i, j)] += 1
                grilles.setdefault(g, pis)
    print(f"constructions qui pavent simplement : {conformes} ; grilles distinctes : {len(grilles)}")
    print(f"grilles à plusieurs involutions possibles : {sum(len(p) > 1 for p in grilles.values())}")
    completes = [p for p, k in par_paire.items() if k == 64]
    reste = Counter(k for p, k in par_paire.items() if k < 64)
    print(f"paires complètes (64/64) : {len(completes)} ; autres paires : {len(paires) - len(completes)}, "
          f"contributions {dict(sorted(reste.items()))}")
    distribution = Counter(par_paire.values())
    distribution[0] += len(paires) - len(par_paire)
    intra = [p for p in completes if couches[p[0]][0] == couches[p[1]][0]]
    print(f"    dont intra-famille : {len(intra)} ; inter-familles : {len(completes) - len(intra)}")

    # corpus
    corpus = set()
    for f, a, b in ce.couples_unifies(F, L):
        for n in range(64):
            corpus.add(tuple_g(ce.phi(n, F[f][a], F[f][b], L)))
    print(f"corpus : {len(corpus)} grilles, toutes dans l'ensemble élargi : {corpus <= set(grilles)}")

    # orbites
    orb_de = {}
    for g in grilles:
        if g not in orb_de:
            o = orbite(g)
            for h in o:
                if h in grilles:
                    orb_de[h] = o
    orbs = set(orb_de.values())
    orbs_corpus = {orb_de[g] for g in corpus}
    print(f"orbites de Γ : {len(orbs)} ; dont corpus : {len(orbs_corpus)}")
    # orbites atteintes par les paires complètes
    g_completes = set()
    for i, j in completes:
        A, B = F[couches[i][0]][couches[i][1]], F[couches[j][0]][couches[j][1]]
        for n in range(64):
            g_completes.add(tuple_g(ce.phi(n, A, B, L)))
    orb_completes = {orb_de[g] for g in g_completes}
    propres = orbs - orb_completes
    print(f"orbites atteintes par les seules paires complètes : {len(orb_completes)}")
    print(f"orbites propres aux paires partielles : {len(propres)}" + ("  ✓ aucune" if not propres else ""))

    # Proposition 3
    coins = [(0, 0), (0, N - 1), (N - 1, 0), (N - 1, N - 1)]
    viol = [g for g, pis in grilles.items() if not any(all(p[g[r][c]] == g[r][c] for r, c in coins) for p in pis)]
    print(f"Proposition 3 — grilles sans teinte π-fixe aux quatre angles : {len(viol)}")

    # règle d'arête sur toutes les grilles
    adm = {}
    for k, (g, pis) in enumerate(grilles.items()):
        adm[g] = any(habillage(g, p) for p in pis)
    hors = [g for g in grilles if g not in corpus]
    print(f"habillables : {sum(adm.values())}/{len(grilles)} ({100 * sum(adm.values()) / len(grilles):.1f} %) ; "
          f"hors corpus : {sum(adm[g] for g in hors)}/{len(hors)} ({100 * sum(adm[g] for g in hors) / len(hors):.1f} %) ; "
          f"corpus : {sum(adm[g] for g in corpus)}/{len(corpus)}")
    mixtes = sum(1 for o in orbs if len({adm[h] for h in o if h in grilles}) > 1)
    hors_orbs = orbs - orbs_corpus
    ok_hors = sum(1 for o in hors_orbs if adm[next(h for h in o if h in grilles)])
    print(f"orbites mixtes : {mixtes} ; orbites hors corpus habillables : {ok_hors}/{len(hors_orbs)} "
          f"({100 * ok_hors / len(hors_orbs):.1f} %)")

    print(f"durée : {time.time() - t0:.0f} s")

    if json_path:
        rapport = {
            'couches': len(couches),
            'paires': len(paires),
            'constructions': len(paires) * 64,
            'conformes': conformes,
            'distinctes': len(grilles),
            'dans_corpus': len(corpus),
            'par_paire': {str(k): v for k, v in sorted(distribution.items())},
            'orbites': {'complet': len(orbs), 'corpus': len(orbs_corpus),
                        'paires_completes': len(orb_completes),
                        'propres_aux_partielles': len(propres)},
        }
        with open(json_path, 'w', encoding='utf-8') as fh:
            json.dump(rapport, fh, ensure_ascii=False, indent=2)
        print(f"rapport écrit : {json_path}")

    return F, L, couches, adm, grilles



def theoreme4(F, L):
    TYPE = {'BASE-YANG': 'yang', 'BASE-YANG-MUT': 'yang_mut', 'PAR2-YANG-YIN-MUT': 'yang',
            'PAR2-YIN-MUT-YANG-MUT': 'yang_mut', 'PAR2-YIN-YANG': 'yang', 'PAR2-YIN-YANG-MUT': 'yang_mut',
            'PAR3-SANS-YANG': 'yang_mut', 'PAR3-SANS-YANG-MUT': 'yang'}
    nat = ('yang', 'yang_mut', 'yin', 'yin_mut')
    blocs = defaultdict(Counter)
    qual_par_paire = Counter()
    ens_indices = defaultdict(Counter)
    for f1, f2 in itertools.combinations(sorted(TYPE), 2):
        cle = 'yang/yang' if TYPE[f1] == TYPE[f2] == 'yang' else \
              'mut/mut' if TYPE[f1] == TYPE[f2] == 'yang_mut' else 'croisé'
        for a in nat:
            for b in nat:
                A, B = F[f1][a], F[f2][b]
                gs = [tuple_g(ce.phi(n, A, B, L)) for n in range(64)]
                pis = [involutions_pavage(g) for g in gs]
                if not all(pis):
                    continue
                qual_par_paire[(f1, f2)] += 1
                okn = frozenset(n for n, (g, p) in enumerate(zip(gs, pis)) if any(habillage(g, q) for q in p))
                blocs[cle][len(okn)] += 1
                if cle == 'croisé':
                    ens_indices['A de type ' + TYPE[f1]][tuple(sorted(okn))] += 1
    print("Théorème 4")
    print(f"    combinaisons qualifiantes par paire de familles : {set(qual_par_paire.values())} "
          f"sur {len(qual_par_paire)} paires ; total {sum(qual_par_paire.values())}")
    for k, c in blocs.items():
        print(f"    bloc {k} : nombre d'indices habillables → {dict(c)}")
    for k, c in ens_indices.items():
        print(f"    {k} : {dict(c)}")


def niveaux(L):
    import math
    for lv in range(1, 7):
        cells = [(r, c) for r in range(N) for c in range(N) if L[r][c] == lv]
        d = sum(math.hypot(r - 5.5, c - 5.5) for r, c in cells) / len(cells)
        bord = sum(1 for r, c in cells if r in (0, 11) or c in (0, 11))
        print(f"    niveau {lv} : distance moyenne au centre {d:.2f}, cases de bord {bord}")


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', metavar='FICHIER', help="écrit un rapport de l'ensemble élargi")
    arg = ap.parse_args()

    F, L, couches, adm, grilles = main(json_path=arg.json)
    print()
    theoreme4(F, L)
    print("Niveaux")
    niveaux(L)
