#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
formes_quatre_axes_enum.py — toutes les grilles 12 × 12 à trois teintes qui ont QUATRE axes de miroir, un seul motif (g∘σ = π∘g, σ = (6, 6)) et 48 / 48 / 48 cases (prompt 271).

Deux positions d'axes, à une translation près (les axes sont ramenés à une position normalisée) :
  - ENTRE LES CASES   : c → 11 − c, r → 11 − r, la diagonale (r, c) → (c, r), l'anti-diagonale (r, c) → (11 − c, 11 − r) ;
  - SUR LE MILIEU DES CASES : c → −c mod 12, r → −r mod 12, la diagonale, l'anti-diagonale (r, c) → (−c, −r).
Le groupe des quatre réflexions découpe les 144 cases en orbites ; σ permute les orbites ; une grille est un choix de teinte par paire {orbite, σ(orbite)} (l'une prend x, l'autre π(x)),
les orbites fixes par σ portant la teinte fixe de π ; π est l'une des trois transpositions des teintes (V M, V O, M O), jamais l'identité.

Nombres (data/resultats-etablis.json, résultat « formes-quatre-axes-milieu »), comptés ici : 7 104 grilles entre les cases (ce sont, exactement, les 7 104 couches de data/couches-quatre-axes.json, A et B de ses 3 552 couples),
69 888 grilles sur le milieu des cases, 76 992 en tout. À translation torique près, ces 76 992 grilles forment 38 496 formes, à DEUX grilles par forme (la grille et sa translatée par σ).
Les nombres attendus ne sont pas recopiés dans ce script : ils sont lus dans data/resultats-etablis.json.

Ce que cet outil ne dit pas : les grilles sur le milieu des cases ne sont pas engendrées par la carte des six niveaux actuelle (data/referent_360_v3.json), dont les axes sont entre les cases. Leur fermeture sur le cube n'a pas été testée.
Aucun sens n'est attribué aux motifs.

  python3 tools/formes_quatre_axes_enum.py            imprime les nombres
  python3 tools/formes_quatre_axes_enum.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json, si une grille ne tient pas ses propriétés, ou si les 7 104 ne sont pas les couches de data/couches-quatre-axes.json
  python3 tools/formes_quatre_axes_enum.py --essai    une grille faussée et un nombre faussé sont refusés
  python3 tools/formes_quatre_axes_enum.py --json     écrit sur la sortie standard les grilles (pour tools/formes_quatre_axes_milieu_lecture.mjs)
"""
import copy
import json
import os
import sys

N = 12
LET = 'VMO'
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ID_RESULTAT = 'formes-quatre-axes-milieu'
POSITIONS = (('entre', 11), ('milieu', 0))  # nom, a : les réflexions sont c → a − c, r → a − r
# les trois involutions des teintes, comme images de (V, M, O)
PIS = [(1, 0, 2), (2, 1, 0), (0, 2, 1)]


def attendus():
    with open(os.path.join(RACINE, 'data/resultats-etablis.json'), encoding='utf-8') as h:
        for r in json.load(h)['resultats']:
            if r['id'] == ID_RESULTAT:
                return r['valeur']
    sys.exit(f'ÉCART : le résultat « {ID_RESULTAT} » manque dans data/resultats-etablis.json')


def reflexions(a):
    return [lambda r, c: (r, (a - c) % N), lambda r, c: ((a - r) % N, c),
            lambda r, c: (c, r), lambda r, c: ((a - c) % N, (a - r) % N)]


def enumerer(a):
    """Toutes les grilles (π, lignes de lettres) à quatre axes en position a."""
    refl = reflexions(a)
    cases = [(r, c) for r in range(N) for c in range(N)]
    idx = {p: i for i, p in enumerate(cases)}
    parent = list(range(len(cases)))

    def trouve(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for p in cases:
        for f in refl:
            u, v = trouve(idx[p]), trouve(idx[f(*p)])
            if u != v:
                parent[u] = v
    groupes = {}
    for p in cases:
        groupes.setdefault(trouve(idx[p]), []).append(p)
    orbites = list(groupes.values())
    oid = {p: k for k, o in enumerate(orbites) for p in o}
    sg = [oid[((o[0][0] + 6) % N, (o[0][1] + 6) % N)] for o in orbites]
    sortie = []
    for pi in PIS:
        fixe = [t for t in range(3) if pi[t] == t][0]
        paires, fixes, vus = [], [], set()
        for k in range(len(orbites)):
            if k in vus:
                continue
            if sg[k] == k:
                fixes.append(k); vus.add(k)
            else:
                paires.append((k, sg[k])); vus.update((k, sg[k]))
        base = [0, 0, 0]
        base[fixe] += sum(len(orbites[k]) for k in fixes)
        if base[fixe] > 48:
            continue
        tailles = [len(orbites[k]) for k, _ in paires]
        solutions = []

        def rec(i, cnt, choix):
            if i == len(paires):
                if cnt == [48, 48, 48]:
                    solutions.append(tuple(choix))
                return
            for x in range(3):
                c2 = list(cnt); c2[x] += tailles[i]; c2[pi[x]] += tailles[i]
                if max(c2) > 48:
                    continue
                rec(i + 1, c2, choix + [x])
        rec(0, base, [])
        for s in solutions:
            col = [None] * len(orbites)
            for k in fixes:
                col[k] = fixe
            for (k, k2), x in zip(paires, s):
                col[k] = x; col[k2] = pi[x]
            sortie.append((pi, [''.join(LET[col[oid[(r, c)]]] for c in range(N)) for r in range(N)]))
    return sortie


def toutes():
    return {nom: enumerer(a) for nom, a in POSITIONS}


def ecart_grille(rows, a, pi):
    """None si la grille tient ses propriétés, sinon la première qui manque (contrôle indépendant de l'énumération)."""
    g = [[LET.index(x) for x in r] for r in rows]
    if [sum(row.count(t) for row in g) for t in range(3)] != [48, 48, 48]:
        return '48 / 48 / 48'
    for r in range(N):
        for c in range(N):
            v = g[r][c]
            if not (g[r][(a - c) % N] == v and g[(a - r) % N][c] == v and g[c][r] == v and g[(a - c) % N][(a - r) % N] == v):
                return 'quatre axes'
            if g[(r + 6) % N][(c + 6) % N] != pi[v]:
                return 'g∘σ = π∘g'
    if sorted(pi) != [0, 1, 2] or sum(pi[t] == t for t in range(3)) != 1 or any(pi[pi[t]] != t for t in range(3)):
        return 'π : une involution à un seul point fixe'
    return None


def couches_du_depot():
    with open(os.path.join(RACINE, 'data/couches-quatre-axes.json'), encoding='utf-8') as h:
        couples = json.load(h)['couples']
    out = set()
    for c in couples:
        perm = {'V': c['pi'][0], 'M': c['pi'][1], 'O': c['pi'][2]}
        out.add(tuple(c['A']))
        out.add(tuple(''.join(perm[x] for x in r) for r in c['A']))
    return out


def classes(grilles):
    """Nombre de classes à translation torique près."""
    def canon(rows):
        return min('/'.join(rows[(r + dr) % N][dc:] + rows[(r + dr) % N][:dc] for r in range(N)) for dr in range(N) for dc in range(N))
    return len({canon(rows) for _, rows in grilles})


def controle(res, att):
    """Liste des écarts entre ce que l'énumération donne et ce que le fichier des résultats attend."""
    ecarts = []
    e = att['enumeration']
    a_b = dict(POSITIONS)
    for nom in ('entre', 'milieu'):
        for pi, rows in res[nom]:
            m = ecart_grille(rows, a_b[nom], pi)
            if m:
                ecarts.append(f'une grille ({nom}) ne tient pas : {m}'); break
    n_e, n_m = len(res['entre']), len(res['milieu'])
    if n_e != e['grilles_entre_les_cases']:
        ecarts.append(f'grilles entre les cases : {n_e}, attendu {e["grilles_entre_les_cases"]}')
    if n_m != e['grilles_milieu_des_cases']:
        ecarts.append(f'grilles sur le milieu des cases : {n_m}, attendu {e["grilles_milieu_des_cases"]}')
    if n_e + n_m != e['grilles_total']:
        ecarts.append(f'total : {n_e + n_m}, attendu {e["grilles_total"]}')
    return ecarts


def lignes_sortie(res, nb_classes=None):
    """Les lignes imprimées : les nombres CALCULÉS (le contrôle les a comparés aux attendus avant)."""
    n_e, n_m = len(res['entre']), len(res['milieu'])
    out = [f'OK    énumération à quatre axes, un seul motif, 48 / 48 / 48 : {n_e} grilles entre les cases, {n_m} grilles sur le milieu des cases, {n_e + n_m} en tout.']
    if nb_classes is not None:
        out.append(f'OK    à translation torique près : {nb_classes} formes, {(n_e + n_m) // nb_classes} grilles par forme.')
    return out


def verifie():
    att = attendus()
    res = toutes()
    ecarts = controle(res, att)
    deposees = couches_du_depot()
    entre = {tuple(rows) for _, rows in res['entre']}
    if entre != deposees:
        ecarts.append(f'les {len(entre)} grilles entre les cases ne sont pas les {len(deposees)} couches de data/couches-quatre-axes.json')
    tout = res['entre'] + res['milieu']
    nb = classes(tout)
    e = att['enumeration']
    if nb != e['formes_a_translation_pres']:
        ecarts.append(f'formes à translation près : {nb}, attendu {e["formes_a_translation_pres"]}')
    if len(tout) != nb * e['grilles_par_forme']:
        ecarts.append(f'{len(tout)} grilles ≠ {nb} formes × {e["grilles_par_forme"]}')
    if ecarts:
        for x in ecarts:
            print('ÉCART ' + x, file=sys.stderr)
        sys.exit(1)
    for l in lignes_sortie(res, nb):
        print(l)
    print(f'OK    les {len(entre)} grilles entre les cases sont exactement les couches A et B de data/couches-quatre-axes.json.')


def essai():
    att = attendus()
    res = toutes()
    # 1. une cellule changée dans une grille : refusée
    faux = {k: list(v) for k, v in res.items()}
    pi, rows = faux['milieu'][0]
    r0 = list(rows[0]); r0[0] = LET[(LET.index(r0[0]) + 1) % 3]
    faux['milieu'][0] = (pi, [''.join(r0)] + rows[1:])
    if not any('ne tient pas' in x for x in controle(faux, att)):
        sys.exit('ÉCHEC --essai : une grille faussée est passée.')
    # 2. un nombre attendu faussé : refusé
    f2 = copy.deepcopy(att); f2['enumeration']['grilles_milieu_des_cases'] += 1
    if not any('attendu' in x for x in controle(res, f2)):
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # 3. une grille de moins : refusée
    faux = {k: list(v) for k, v in res.items()}; faux['entre'].pop()
    if not any('attendu' in x for x in controle(faux, att)):
        sys.exit('ÉCHEC --essai : une grille manquante est passée.')
    print('OK    --essai : une grille faussée, un nombre faussé et une grille manquante sont refusés (3 sur 3).')


if __name__ == '__main__':
    if '--essai' in sys.argv:
        essai()
    elif '--verifie' in sys.argv:
        verifie()
    elif '--json' in sys.argv:
        res = toutes()
        json.dump({k: [{'pi': list(pi), 'g': rows} for pi, rows in v] for k, v in res.items()}, sys.stdout)
    else:
        res = toutes()
        for l in lignes_sortie(res):
            print(l)
        for nom in ('entre', 'milieu'):
            print(f'{nom} : {len(res[nom])} grilles')
