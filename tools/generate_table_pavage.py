#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
generate_table_pavage.py — La table des 1770 paires pour la page de
création guidée (creation-motifs-yi-king.html).

Pourquoi ce fichier
--------------------
La page laisse choisir deux images parmi soixante sans aucun retour sur ce
que la paire produit. Deux faits, établis dans la note « A Half-Shift
Criterion on Three-Colour 12×12 Grids, and Its Restriction on the Cube »,
peuvent maintenant l'informer :

  1. Le statut de la paire — combien de ses 64 grilles pavent simplement
     (g ∘ σ = π ∘ g, π involution non triviale) : 0, 1, 2, ou 64/64. Seul
     ce dernier cas (240 paires sur 1770) a un sens pour ce qui suit —
     c'est une donnée, pas une formule, elle est ici.

  2. Pour ces 240 paires, quels hexagrammes (0-63) ferment sur le cube.
     C'est une FORMULE fermée (Théorèmes 3 et 4), pas une table : même
     type (yang/yang) → les 64 ; même type (yang-mut/yang-mut) → aucun ;
     types opposés → exactement {0,2,16,18} ou {45,47,61,63} selon le
     type de la couche jouant le rôle de A (voir creation-motifs-yi-king.html,
     où c'est l'image « Créateur »). Ce script ne stocke donc PAS cette
     information par paire : il calcule et vérifie une seule fois le type
     de chacune des 8 familles admissibles, pour qu'aucune table plus
     grosse ne soit nécessaire côté page.

Source unique : les données embarquées dans creation-motifs-yi-king.html
elle-même (LAYER_COLORS, LAYER_OF), extraites ici par une regex sur le JS
embarqué (lecture seule, même principe que analyse_echiquier_yi_king.py,
non importé pour ne pas lier ce script à un autre fichier déposé
séparément) — pas referent_360_v3.json, pour que la table reflète
exactement ce que la page affiche, pixel pour pixel, quelle que soit la
provenance de ces données. Contrôlé : les clés LAYER_COLORS coïncident avec
les layerKey des 60 entrées d'ASSETS (aussi embarqué), donc le format de
sortie peut réutiliser ces layerKey directement, sans table de
correspondance côté JS.

La géométrie du cube (arêtes, habillage par retour arrière) est celle de
tools/cube_edges.py et tools/spectre_et_cube.py, réécrite ici en propre :
ce script n'a besoin que d'une décision booléenne sur 8×64 = 512 grilles
(un couple par famille admissible), pas de leur API complète, et rester
autonome évite de le lier à l'ordre de fusion d'autres dépôts en cours.

Le type d'une famille est déterminé par le calcul lui-même — le test de
fermeture du Théorème 3 sur son couple (yang, yang_mut) — et non recopié
d'ailleurs : si un jour les données changent, ce script le redécouvre.

Sortie
------
data/paires_1770_v1.json :
    cles      les 60 layerKey, triés — l'ordre qui indexe "paires"
    paires    1770 entiers (0, 1, 2 ou 64), un par paire non ordonnée de
              "cles" dans l'ordre itertools.combinations
    familles  { groupe-de-famille (layerKey sans le dernier ":nature") :
                "yang" | "yang-mut" | null }, 15 entrées — null pour les 7
                familles sans paire unifiée (Théorème 2)

Contrôles
---------
    - exactement 8 familles admissibles, 4 de chaque type ;
    - exactement 240 paires à 64/64 (16 intra-famille + 224 inter-familles) ;
    - AUCUNE des 240 n'implique une famille de type null — sinon la
      formule fermée ne suffirait pas et il faudrait revoir l'interface.

Usage
-----
    python tools/generate_table_pavage.py
"""

import itertools
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
TOOL_HTML = os.path.join(REPO_ROOT, 'creation-motifs-yi-king.html')
OUT_JSON = os.path.join(REPO_ROOT, 'data', 'paires_1770_v1.json')

N = 12
HALF = N // 2
TEINTES = ('V', 'M', 'O')
PERMUTATIONS = [dict(zip(TEINTES, p)) for p in itertools.permutations(TEINTES)]


def load_tool_data():
    """LAYER_COLORS (60 natures) et LAYER_OF, extraits tels quels du JS
    embarqué dans creation-motifs-yi-king.html — lecture seule."""
    html = open(TOOL_HTML, encoding='utf-8').read()
    m = re.search(r'const LAYER_COLORS = (\{.*?\});\n', html)
    if not m:
        sys.exit("LAYER_COLORS introuvable dans " + TOOL_HTML)
    layer_colors = json.loads(m.group(1))
    m2 = re.search(r'const LAYER_OF = (\[\[.*?\]\]);\n', html)
    if not m2:
        sys.exit("LAYER_OF introuvable dans " + TOOL_HTML)
    layer_of = json.loads(m2.group(1))
    if len(layer_colors) != 60:
        sys.exit(f"{len(layer_colors)} natures trouvées, 60 attendues")
    return layer_colors, layer_of


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
    """g ∘ σ = π ∘ g, π involution non triviale — rend π ou None."""
    s = sigma(g)
    m = {}
    for r in range(N):
        for c in range(N):
            if m.setdefault(s[r][c], g[r][c]) != g[r][c]:
                return None
    if any(m.get(m[k]) != k for k in m):
        return None
    return m if any(a != b for a, b in m.items()) else None


# ── Géométrie du cube (retour arrière par arête — cf. cube_edges.py,
# spectre_et_cube.py ; réécrite ici pour rester autonome, voir docstring) ──

NOMS_FACES = ['top', 'bottom', 'front', 'back', 'left', 'right']
FACES = {
    'top':    ((0, 0, 12), (1, 0, 0), (0, 1, 0)),
    'bottom': ((0, 0, 0),  (1, 0, 0), (0, 1, 0)),
    'front':  ((0, 0, 12), (1, 0, 0), (0, 0, -1)),
    'back':   ((0, 12, 12), (1, 0, 0), (0, 0, -1)),
    'left':   ((0, 0, 12), (0, 1, 0), (0, 0, -1)),
    'right':  ((12, 0, 12), (0, 1, 0), (0, 0, -1)),
}


def _aretes_du_cube():
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


ARETES = _aretes_du_cube()


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
    Retour arrière sur les six faces après réduction par arête."""
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


def groupe(cle):
    """layerKey -> clé de famille (sans le dernier segment ':nature')."""
    return cle.rsplit(':', 1)[0]


def main():
    t0 = time.time()
    layer_colors, L = load_tool_data()
    cles = sorted(layer_colors)
    print(f"{len(cles)} natures (layerKey)")

    groupes = defaultdict(dict)
    for cle in cles:
        g, nature = groupe(cle), cle.rsplit(':', 1)[1]
        groupes[g][nature] = layer_colors[cle]
    print(f"{len(groupes)} familles" + ("  ✓ 15 attendues" if len(groupes) == 15 else "  ✗"))

    # ── type de chaque famille, par le calcul (Théorèmes 2 et 3) ─────────
    familles_type = {}
    for g, natures in groupes.items():
        if 'yang' not in natures or 'yang_mut' not in natures:
            familles_type[g] = None
            continue
        A, B = natures['yang'], natures['yang_mut']
        if sigma(A) != B:
            familles_type[g] = None  # pas de paire unifiée (Théorème 1) : non admissible
            continue
        pi = {}  # B = π∘A pointwise (Corollaire 1) : π se lit directement sur (A, B)
        for r in range(N):
            for c in range(N):
                if pi.setdefault(A[r][c], B[r][c]) != B[r][c]:
                    sys.exit(f"{g} : B n'est pas π∘A pointwise — hypothèse (F5) en défaut")
        fermes = [ferme(phi(n, A, B, L), pi) for n in range(64)]
        if all(fermes):
            familles_type[g] = 'yang'
        elif not any(fermes):
            familles_type[g] = 'yang-mut'
        else:
            sys.exit(f"{g} : fermeture ni totale ni nulle sur (yang,yang_mut) — "
                      f"hypothèse du Théorème 3 en défaut")

    n_admissibles = sum(1 for t in familles_type.values() if t is not None)
    n_yang = sum(1 for t in familles_type.values() if t == 'yang')
    n_yangmut = sum(1 for t in familles_type.values() if t == 'yang-mut')
    print(f"familles admissibles : {n_admissibles} ({n_yang} yang, {n_yangmut} yang-mut)"
          + ("  ✓" if n_admissibles == 8 and n_yang == 4 and n_yangmut == 4 else "  ✗"))
    for g in sorted(familles_type):
        print(f"    {g:24s}  {familles_type[g]}")
    print()

    # ── table des 1770 paires ────────────────────────────────────────────
    paires = []
    par_statut = Counter()
    n_240_verifiees = 0
    for a, b in itertools.combinations(cles, 2):
        A, B = layer_colors[a], layer_colors[b]
        k = sum(1 for n in range(64) if condition_faible(phi(n, A, B, L)) is not None)
        paires.append(k)
        par_statut[k] += 1
        if k == 64:
            n_240_verifiees += 1
            ga, gb = familles_type.get(groupe(a)), familles_type.get(groupe(b))
            if ga is None or gb is None:
                sys.exit(f"{a} × {b} : 64/64 mais famille non typée ({ga}, {gb}) — "
                         f"la formule fermée ne couvre pas ce cas, revoir l'interface")

    print(f"paires (C(60,2) = {len(paires)}) : {dict(sorted(par_statut.items()))}")
    print(f"paires à 64/64 : {par_statut[64]}"
          + ("  ✓ 240 attendues, toutes entre familles typées" if par_statut[64] == 240 else "  ✗"))
    print(f"({time.time() - t0:.0f}s)")

    doc = {
        'format': 'paires-1770-v1',
        'note': ('paires[k] = nombre de grilles/64 qui pavent simplement (g∘σ=π∘g, π non '
                 'triviale) pour la paire non ordonnée cles[i],cles[j] — indexée comme '
                 'itertools.combinations(cles, 2). familles[g] donne le type (yang/yang-mut) '
                 'de la famille g = layerKey sans son dernier segment, ou null si non '
                 'admissible (Théorème 2) ; c’est la seule donnée nécessaire pour appliquer '
                 'la formule fermée des Théorèmes 3 et 4 — voir docstring du générateur.'),
        'cles': cles,
        'paires': paires,
        'familles': familles_type,
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as fh:
        json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
    taille_ko = os.path.getsize(OUT_JSON) / 1024
    print(f"\n{OUT_JSON} : {taille_ko:.1f} Ko")


if __name__ == '__main__':
    main()
