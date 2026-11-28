#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
orbites_produits_quatre_axes.py — les orbites, la loi sur les niveaux et les produits des formes à quatre axes à la lecture binaire (28 novembre 2026, suite de tools/fermeture_quatre_axes_cube.py).
Trois questions, sur les 576 grilles parfaites entre les cases (contrôle : le corpus et ses 256 formes nouvelles) et les 6 400 grilles parfaites sur le milieu des cases (3 200 formes) :

1. LES ORBITES. Le groupe des bascules de niveaux (Z/2)^6 d'une carte de six niveaux agit sur les grilles (n ↦ Φ(n, A, B) ; la bascule des six niveaux est le décalage σ, car B = A∘σ). Un cube (une famille de grilles de même teinte fixe et même socle) est une
   réunion d'orbites ; l'orbite d'une grille a 2^k grilles, k = le nombre de niveaux qui portent au moins une unité de bascule du cube. Ici : cubes, orbites selon la carte du référent (entre les cases) et selon les cartes possibles
   (tools/fermeture_quatre_axes_cube.py), et combien de cartes ont toutes leurs orbites de 64 grilles.
2. LA LOI SUR LES NIVEAUX. Dans chaque cube, la lecture binaire (144 cases × 4 bits) est AFFINE sur l'hypercube des unités : v(m) ⊕ v(0) est somme des v(e_i) ⊕ v(0), pour les bits i de m. Comme tout niveau bascule un ensemble d'unités, la lecture de Φ(n, A, B) est
   alors affine en n pour toute carte : la même loi sur les six niveaux agit sur les formes entre les cases et sur celles du milieu des cases.
3. LES PRODUITS. a ⊕ b (XOR) et son complément (XNOR) de deux lectures sont-ils la lecture d'une forme de l'ensemble ? Et la loi du cube, a ⊕ b ⊕ c, sur les bases de trois cubes ?

Nombres attendus : lus dans data/resultats-etablis.json (résultat « formes-quatre-axes-orbites-produits »), pas recopiés ici. Aucun sens n'est attribué aux motifs. Les 3 200 formes ne sont pas engendrées par la carte des six niveaux actuelle : voir tools/fermeture_quatre_axes_cube.py.

  python3 tools/orbites_produits_quatre_axes.py            imprime les nombres
  python3 tools/orbites_produits_quatre_axes.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json
  python3 tools/orbites_produits_quatre_axes.py --essai    un nombre faussé et une lecture faussée (une grille à lecture non affine) sont refusés
"""
import copy
import json
import os
import subprocess
import sys
from collections import Counter, defaultdict

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import formes_quatre_axes_enum as enum  # noqa: E402
import fermeture_quatre_axes_cube as ferm  # noqa: E402

N = 12
LET = enum.LET
ID = 'formes-quatre-axes-orbites-produits'
PLEIN = (1 << 576) - 1


def attendus():
    with open(os.path.join(RACINE, 'data/resultats-etablis.json'), encoding='utf-8') as h:
        for r in json.load(h)['resultats']:
            if r['id'] == ID:
                return r['valeur']
    sys.exit(f'ÉCART : le résultat « {ID} » manque dans data/resultats-etablis.json')


def lectures():
    out = subprocess.run(['node', os.path.join(RACINE, 'tools/formes_quatre_axes_milieu_lecture.mjs'), '--lectures'], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return {nom: {tuple(e['g']): (tuple(e['pi']), int(e['bits'], 2)) for e in d[nom]} for nom in d}


def cubes_de(P, orb, sg):
    cubes = defaultdict(list)
    for rows, (pi, _) in P.items():
        fx = [t for t in range(3) if pi[t] == t][0]
        cubes[(fx, tuple((r, c) for r in range(N) for c in range(N) if rows[r][c] == LET[fx]))].append(rows)
    unites = {}
    for key, L in cubes.items():
        rows = L[0]
        col = [LET.index(rows[orb[k][0][0]][orb[k][0][1]]) for k in range(len(orb))]
        unites[key] = [(k, sg[k]) for k in range(len(orb)) if sg[k] > k and col[k] != key[0]]
    return cubes, unites


def orbites(cubes, unites, orb, sg, cs, referent):
    def tailles(niv):
        t = Counter()
        for key, L in cubes.items():
            k = len({niv[u[0]] for u in unites[key]})
            t[2 ** k] += len(L) // 2 ** k
        return t
    sous = Counter()
    for carte in cs:
        niv = {k: j for j, g in enumerate(carte) for ks in g for k in ks}
        sous[sum(n for s, n in tailles(niv).items() if s < 64)] += 1
    out = {'cartes_toutes_orbites_64': sous.get(0, 0), 'orbites_sous_64_min': min(sous), 'orbites_sous_64_max': max(sous)}
    if referent:
        with open(os.path.join(RACINE, 'data/referent_360_v3.json'), encoding='utf-8') as h:
            L = json.load(h)['layer_of']
        niv = {}
        for r in range(N):
            for c in range(N):
                niv[next(k for k, o in enumerate(orb) if (r, c) in o)] = L[r][c]
        out['orbites_referent'] = {str(s): n for s, n in sorted(tailles(niv).items())}
    return out


def affine(P, cubes, unites, orb):
    oid = {p: k for k, o in enumerate(orb) for p in o}
    ok = 0
    for key, L in cubes.items():
        rows = L[0]
        col = [LET.index(rows[orb[k][0][0]][orb[k][0][1]]) for k in range(len(orb))]
        U = unites[key]

        def grille(m):
            c = list(col)
            for i, (k, k2) in enumerate(U):
                if m >> i & 1:
                    c[k], c[k2] = c[k2], c[k]
            return tuple(''.join(LET[c[oid[(r, cc)]]] for cc in range(N)) for r in range(N))
        v = [P[grille(m)][1] for m in range(1 << len(U))]
        e = [v[1 << i] ^ v[0] for i in range(len(U))]
        bon = True
        for m in range(1 << len(U)):
            x = v[0]
            for i in range(len(U)):
                if m >> i & 1:
                    x ^= e[i]
            if x != v[m]:
                bon = False; break
        ok += bon
    return ok


def produits(P, cubes):
    S = {v for _, v in P.values()}
    V = sorted(S)
    xor = xnor = pairs = 0
    for i, a in enumerate(V):
        for b in V[i:]:
            x = a ^ b
            pairs += 1
            xor += x in S
            xnor += (x ^ PLEIN) in S
    # a ⊕ b ⊕ c pour trois cubes DISTINCTS (avec un cube répété, a ⊕ a ⊕ c = c : sans objet) : les bases (première grille de chaque cube, ordre alphabétique), puis la première ET la dernière grille de chaque cube
    cl = sorted(cubes.items())
    bases = [[P[sorted(L)[0]][1]] for _, L in cl]
    extremes = [[P[sorted(L)[0]][1], P[sorted(L)[-1]][1]] for _, L in cl]
    res = {}
    for nom, jeu in (('bases', bases), ('extremes', extremes)):
        triples = dans = 0
        n = len(jeu)
        for i in range(n):
            for j in range(n):
                for k in range(n):
                    if len({i, j, k}) < 3:
                        continue
                    for a in jeu[i]:
                        for b in jeu[j]:
                            for c in jeu[k]:
                                triples += 1
                                dans += (a ^ b ^ c) in S
        res[nom] = (triples, dans)
    return {'paires': pairs, 'paires_xor_dans': xor, 'paires_xnor_dans': xnor, 'triples_bases': res['bases'][0], 'triples_bases_dans': res['bases'][1], 'triples_extremes': res['extremes'][0], 'triples_extremes_dans': res['extremes'][1]}


def calcule():
    L = lectures()
    out = {}
    for nom, a in enum.POSITIONS:
        orb, oid, sg = ferm.structure(a)
        cs = ferm.cartes(ferm.elements(orb, sg))
        P = L[nom]
        cubes, unites = cubes_de(P, orb, sg)
        o = {'grilles': len(P), 'cubes': len(cubes), 'cartes': len(cs)}
        o.update(orbites(cubes, unites, orb, sg, cs, nom == 'entre'))
        o['cubes_affines'] = affine(P, cubes, unites, orb)
        o.update(produits(P, cubes))
        out[nom] = o
    return out


def ecarts(o, att):
    e = []
    for nom in ('entre', 'milieu'):
        for cle, v in att[nom].items():
            if o[nom].get(cle) != v:
                e.append(f'{nom} : {cle} = {o[nom].get(cle)}, attendu {v}')
    return e


def lignes(o):
    out = []
    for nom, titre in (('entre', 'entre les cases (contrôle)'), ('milieu', 'sur le milieu des cases')):
        x = o[nom]
        out.append(f'OK    orbites {titre} : {x["grilles"]} grilles en {x["cubes"]} cubes ; sur {x["cartes"]} cartes de six niveaux, {x["cartes_toutes_orbites_64"]} ont toutes leurs orbites de 64 grilles, le nombre d\'orbites de moins de 64 grilles va de {x["orbites_sous_64_min"]} à {x["orbites_sous_64_max"]}.')
        if 'orbites_referent' in x:
            out.append('OK    orbites avec la carte du référent : ' + ', '.join(f'{n} de {s} grilles' for s, n in x['orbites_referent'].items()) + '.')
        out.append(f'OK    loi sur les niveaux {titre} : la lecture binaire est affine sur l\'hypercube des unités dans {x["cubes_affines"]} cubes sur {x["cubes"]}.')
        out.append(f'OK    produits {titre} : {x["paires"]} paires de lectures, XOR dans l\'ensemble pour {x["paires_xor_dans"]}, XNOR pour {x["paires_xnor_dans"]} ; a ⊕ b ⊕ c de trois cubes distincts : {x["triples_bases_dans"]} sur {x["triples_bases"]} pour les bases, {x["triples_extremes_dans"]} sur {x["triples_extremes"]} avec la première et la dernière grille de chaque cube, dans l\'ensemble.')
    return out


def essai(o, att):
    if ecarts(o, att):
        sys.exit('ÉCHEC --essai : les nombres vrais ne passent pas : ' + '; '.join(ecarts(o, att)))
    f = copy.deepcopy(att); f['milieu']['cubes_affines'] -= 1
    if not ecarts(o, f):
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # une lecture faussée (un bit change dans une grille) : le cube concerné n'est plus affine
    L = lectures()['milieu']
    orb, oid, sg = ferm.structure(0)
    cubes, unites = cubes_de(L, orb, sg)
    faux = dict(L)
    g = sorted(L)[0]
    faux[g] = (L[g][0], L[g][1] ^ 1)
    if affine(faux, cubes, unites, orb) >= len(cubes):
        sys.exit('ÉCHEC --essai : une lecture faussée est passée.')
    print('OK    --essai : un nombre faussé et une lecture faussée sont refusés (2 sur 2).')


if __name__ == '__main__':
    att = attendus()
    o = calcule()
    if '--essai' in sys.argv:
        essai(o, att)
    else:
        e = ecarts(o, att)
        if '--verifie' in sys.argv and e:
            for x in e:
                print('ÉCART ' + x, file=sys.stderr)
            sys.exit(1)
        for l in lignes(o):
            print(l)
        for x in e:
            print('écart avec data/resultats-etablis.json : ' + x)
