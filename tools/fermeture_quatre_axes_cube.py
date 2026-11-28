#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
fermeture_quatre_axes_cube.py — les 3 200 formes à quatre axes sur le milieu des cases se ferment-elles sur un cube, comme les 288 entre les cases ? (28 novembre 2026, suite du prompt 271)

Le cube : un couple {A, B = π∘A} et une CARTE de six niveaux (six ensembles de 24 cases, unions d'orbites des quatre axes, invariants par σ) donnent 64 grilles Φ(n, A, B) (le niveau ℓ prend A si le bit ℓ de n vaut 1, B sinon).
Les grilles d'un couple se déduisent les unes des autres par les « unités » : une paire d'orbites {O, σ(O)} dont la teinte x n'est pas la teinte fixe de π ; basculer une unité, c'est remplacer x par π(x) sur O et sur σ(O).
Un niveau bascule toutes les unités qu'il contient. Le cube se ferme donc sur une carte quand tout ensemble de niveaux basculés laisse la grille PARFAITE (lecture binaire du dépôt, tools/formes_quatre_axes_milieu_lecture.mjs).
Si TOUTES les bascules d'unités (2^U sous-ensembles) laissent la grille parfaite, le cube se ferme sur n'importe quelle carte : la carte ne peut que regrouper les unités.

Résultat (nombres dans data/resultats-etablis.json, résultat « formes-quatre-axes-fermeture-cube »), calculé ici :
  - entre les cases (contrôle) : 576 grilles parfaites, toutes fermées sous toutes les bascules ; 5 socles ; 720 cartes possibles, dont la carte du référent (data/referent_360_v3.json) ;
  - sur le milieu des cases : 6 400 grilles parfaites (3 200 formes), TOUTES fermées sous toutes les bascules (8 ou 9 unités : cubes de 256 ou 512 grilles) ; 15 socles ; 50 400 cartes de six niveaux de 24 cases possibles ;
    pour 200 de ces cartes tirées au hasard (graine fixée) et un couple chacune, les 64 grilles Φ(n, A, B) sont toutes parfaites.
Ce que cela ne dit pas : la fermeture est établie pour toute carte dont les niveaux sont des unions d'orbites des quatre axes, de 24 cases, invariantes par σ. Les autres propriétés de la carte actuelle (par exemple la règle du bord
de la proposition sur les niveaux centraux) ne sont pas imposées ici ; aucune de ces 50 400 cartes n'est dans les données du dépôt, et aucune n'a été choisie. Aucun sens n'est attribué aux motifs.

  python3 tools/fermeture_quatre_axes_cube.py            imprime les nombres
  python3 tools/fermeture_quatre_axes_cube.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json
  python3 tools/fermeture_quatre_axes_cube.py --essai    une grille retirée des parfaites, un nombre faussé et un niveau non invariant par σ sont refusés
"""
import copy
import json
import os
import random
import subprocess
import sys
from collections import Counter

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import formes_quatre_axes_enum as enum  # noqa: E402

N = 12
LET = enum.LET
ID = 'formes-quatre-axes-fermeture-cube'


def attendus():
    with open(os.path.join(RACINE, 'data/resultats-etablis.json'), encoding='utf-8') as h:
        for r in json.load(h)['resultats']:
            if r['id'] == ID:
                return r['valeur']
    sys.exit(f'ÉCART : le résultat « {ID} » manque dans data/resultats-etablis.json')


def structure(a):
    """Orbites des quatre réflexions en position a ; oid : case → orbite ; sg : orbite → orbite image par σ."""
    refl = enum.reflexions(a)
    cases = [(r, c) for r in range(N) for c in range(N)]
    idx = {p: i for i, p in enumerate(cases)}
    par = list(range(len(cases)))

    def f(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x
    for p in cases:
        for g in refl:
            u, v = f(idx[p]), f(idx[g(*p)])
            if u != v:
                par[u] = v
    gr = {}
    for p in cases:
        gr.setdefault(f(idx[p]), []).append(p)
    orb = list(gr.values())
    oid = {p: k for k, o in enumerate(orb) for p in o}
    sg = [oid[((o[0][0] + 6) % N, (o[0][1] + 6) % N)] for o in orb]
    return orb, oid, sg


def elements(orb, sg):
    """Les unions d'orbites invariantes par σ les plus petites : (taille, orbites)."""
    out, vus = [], set()
    for k in range(len(orb)):
        if k in vus:
            continue
        if sg[k] == k:
            out.append((len(orb[k]), (k,))); vus.add(k)
        else:
            out.append((len(orb[k]) + len(orb[sg[k]]), (k, sg[k]))); vus.update((k, sg[k]))
    return out


def cartes(items):
    """Toutes les partitions en six niveaux de 24 cases (non ordonnées), unions d'éléments."""
    items = sorted(items, key=lambda x: -x[0])
    sols = set()

    def rec(i, groups, mem):
        if i == len(items):
            if all(g == 24 for g in groups):
                sols.add(frozenset(frozenset(items[j][1] for j in m) for m in mem))
            return
        s = items[i][0]
        vide = False
        for j in range(6):
            if groups[j] + s > 24:
                continue
            if groups[j] == 0:
                if vide:
                    continue
                vide = True
            groups[j] += s; mem[j].append(i); rec(i + 1, groups, mem); mem[j].pop(); groups[j] -= s
    rec(0, [0] * 6, [[] for _ in range(6)])
    return sols


def parfaites():
    res = enum.toutes()
    fl = json.loads(subprocess.run(['node', os.path.join(RACINE, 'tools/formes_quatre_axes_milieu_lecture.mjs'), '--drapeaux'], capture_output=True, text=True, check=True).stdout)
    return {nom: {tuple(rows): pi for (pi, rows), f in zip(res[nom], fl[nom]) if f} for nom in res}


def fermeture(nom, a, P):
    """(grilles fermées sous toutes les bascules, nombre de grilles, ensemble des (U), socles, cartes)."""
    orb, oid, sg = structure(a)
    fermees, us, socles = 0, Counter(), set()
    for rows, pi in P.items():
        col = [LET.index(rows[orb[k][0][0]][orb[k][0][1]]) for k in range(len(orb))]
        fx = [t for t in range(3) if pi[t] == t][0]
        units = [(k, sg[k]) for k in range(len(orb)) if sg[k] > k and col[k] != fx]
        us[len(units)] += 1
        socles.add((fx, tuple(sorted((r, c) for r in range(N) for c in range(N) if rows[r][c] == LET[fx]))))
        ok = True
        for m in range(1 << len(units)):
            c = list(col)
            for i in range(len(units)):
                if m >> i & 1:
                    k, k2 = units[i]; c[k], c[k2] = c[k2], c[k]
            if tuple(''.join(LET[c[oid[(r, cc)]]] for cc in range(N)) for r in range(N)) not in P:
                ok = False; break
        fermees += ok
    return fermees, len(P), dict(us), len(socles)


def niveaux_valides(level, orb, sg):
    """Une carte (case → niveau 0..5) : six niveaux de 24 cases, invariants par σ."""
    if Counter(v for r in level for v in r) != Counter({j: 24 for j in range(6)}):
        return False
    return all(level[(r + 6) % N][(c + 6) % N] == level[r][c] for r in range(N) for c in range(N))


def carte_vers_niveaux(carte, orb):
    level = [[None] * N for _ in range(N)]
    for j, g in enumerate(sorted(carte, key=lambda x: sorted(x))):
        for ks in g:
            for k in ks:
                for (r, c) in orb[k]:
                    level[r][c] = j
    return level


def referent_dans(cartes_set, orb, a):
    with open(os.path.join(RACINE, 'data/referent_360_v3.json'), encoding='utf-8') as h:
        L = json.load(h)['layer_of']
    classes = {}
    for r in range(N):
        for c in range(N):
            classes.setdefault(L[r][c], set()).add(next(k for k, o in enumerate(orb) if (r, c) in o))
    # la carte du référent, comme partition des orbites ; chaque élément (orbite ou paire) doit être entier dans un niveau
    cible = frozenset(frozenset(c) for c in classes.values())
    return any(frozenset(frozenset(k for ks in g for k in ks) for g in carte) == cible for carte in cartes_set)


def echantillon(P, a, cs, n_cartes, graine, orb):
    """Pour n_cartes cartes tirées (graine fixée) et un couple chacune : combien des 64 grilles Φ(n, A, B) sortent des grilles parfaites."""
    rnd = random.Random(graine)
    liste = sorted(cs, key=lambda c: sorted(sorted(g) for g in c))
    couples = sorted(P.items())
    hors = tests = 0
    for _ in range(n_cartes):
        carte = liste[rnd.randrange(len(liste))]
        level = carte_vers_niveaux(carte, orb)
        rows, pi = couples[rnd.randrange(len(couples))]
        perm = {LET[t]: LET[pi[t]] for t in range(3)}
        for n in range(64):
            g = tuple(''.join(rows[r][c] if (n >> level[r][c]) & 1 else perm[rows[r][c]] for c in range(N)) for r in range(N))
            tests += 1
            hors += g not in P
    return tests, hors


def calcule():
    P = parfaites()
    out = {}
    for nom, a in enum.POSITIONS:
        orb, oid, sg = structure(a)
        cs = cartes(elements(orb, sg))
        fer, n, us, socles = fermeture(nom, a, P[nom])
        tests, hors = echantillon(P[nom], a, cs, 200, 1, orb)
        out[nom] = {'grilles_parfaites': n, 'grilles_fermees': fer, 'unites': {str(u): c for u, c in sorted(us.items())}, 'socles': socles, 'cartes': len(cs), 'echantillon_grilles': tests, 'echantillon_hors': hors,
                    'carte_du_referent': referent_dans(cs, orb, a) if nom == 'entre' else None}
    return out


def ecarts(o, att):
    e = []
    for nom in ('entre', 'milieu'):
        for cle, v in att[nom].items():
            if o[nom][cle] != v:
                e.append(f'{nom} : {cle} = {o[nom][cle]}, attendu {v}')
    return e


def lignes(o):
    out = []
    for nom, titre in (('entre', 'entre les cases (contrôle)'), ('milieu', 'sur le milieu des cases')):
        x = o[nom]
        out.append(f'OK    cube {titre} : {x["grilles_fermees"]} grilles parfaites sur {x["grilles_parfaites"]} fermées sous toutes les bascules d\'unités (unités par grille : {", ".join(f"{u} pour {c}" for u, c in x["unites"].items())}), {x["socles"]} socles, {x["cartes"]} cartes de six niveaux possibles.')
    x = o['milieu']
    out.append(f'OK    sur le milieu des cases : 200 cartes tirées, un couple chacune : {x["echantillon_grilles"]} grilles Φ(n, A, B) testées, {x["echantillon_hors"]} hors des grilles parfaites.')
    out.append(f'OK    entre les cases : la carte du référent est l\'une des {o["entre"]["cartes"]} cartes possibles : {"oui" if o["entre"]["carte_du_referent"] else "non"}.')
    return out


def essai(o, att):
    if ecarts(o, att):
        sys.exit('ÉCHEC --essai : les nombres vrais ne passent pas : ' + '; '.join(ecarts(o, att)))
    f = copy.deepcopy(att); f['milieu']['cartes'] += 1
    if not ecarts(o, f):
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # une grille retirée des parfaites : la fermeture de son cube casse
    P = parfaites()['milieu']
    orb, oid, sg = structure(0)
    sous = dict(P)
    sous.pop(sorted(sous)[0])
    fer, n, _, _ = fermeture('milieu', 0, sous)
    if fer == n:
        sys.exit('ÉCHEC --essai : une grille retirée n\'a pas cassé la fermeture.')
    # un niveau non invariant par σ est refusé
    level = [[(r // 2) % 6 for _ in range(N)] for r in range(N)]
    if niveaux_valides(level, orb, sg):
        sys.exit('ÉCHEC --essai : une carte non invariante par σ est passée.')
    print('OK    --essai : un nombre faussé, une grille retirée et une carte non invariante par σ sont refusés (3 sur 3).')


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
