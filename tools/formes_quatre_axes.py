#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
formes_quatre_axes.py — y a-t-il plus de formes à quatre axes de miroir que les 32 du corpus ? Oui (suite de tools/corpus_miroir.py et tools/miroir_autres_couches.py).

Le corpus actuel a 64 formes (à translation torique près), dont 32 à quatre axes (vertical, horizontal, les deux diagonales). Ici on cherche des COUCHES nouvelles : une couche A est admise si
  - elle est symétrique par les quatre réflexions de la carte des six niveaux (c → 11 − c, r → 11 − r, la diagonale, l'anti-diagonale) : alors les 64 grilles Φ(n, A, B) ont les quatre axes, pour tout n ;
  - A∘σ = π∘A pour une involution π des teintes (le demi-décalage échange deux teintes : un seul motif au pavage), et B = π∘A ;
  - 48 / 48 / 48 cases par teinte.
Résultat, vérifié ici : 7 104 couches (3 552 couples {A, B}) ; elles forment 3 552 formes à translation torique près ; les 32 formes à quatre axes du corpus y sont toutes.
SOCLES (les cases de la teinte fixe, où A = B) : 336 socles sont théoriquement possibles (unions d'orbites de 48 cases) ; 19 sont réalisés par les 7 104 couches, exhaustivement ; avec la lecture binaire du corpus
il n'en reste que 5 : celui du corpus (8 cases fixes à chaque niveau) et quatre à niveaux inégaux (voir docs/article-parallele-unified-patterns.md).
Ces 7 104 grilles sont ENTRE ELLES les seules grilles que les 3 552 couples engendrent (l'ensemble est fermé : chaque Φ(n, A, B) est encore une couche admise).
Avec la lecture binaire du corpus (lisible, 72 / 72, lecture inversée par le décalage ; assets/lecture-binaire.js, test en JavaScript non repris dans cet outil), il reste 288 couples dont les 64 grilles sont toutes parfaites :
576 grilles, 288 formes, dont les 32 du corpus : 256 formes à quatre axes de plus (docs/captures/quatre-axes-nouvelles-formes.png).

  python3 tools/formes_quatre_axes.py            imprime les nombres
  python3 tools/formes_quatre_axes.py --verifie  échoue s'ils changent
"""
import json
import os
import sys

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import check_note_v6 as note  # noqa: E402
import corpus_miroir as cm  # noqa: E402

N = 12
LET = cm.LET
# les nombres ATTENDUS sont l'énoncé du résultat « formes-quatre-axes » (data/resultats-etablis.json), pas une table recopiée ici
_ENONCE = next(r for r in json.load(open(os.path.join(RACINE, 'data', 'resultats-etablis.json'), encoding='utf-8'))['resultats'] if r['id'] == 'formes-quatre-axes')['valeur']
ATTENDU = {k: _ENONCE[k] for k in ('couches', 'couples', 'formes', 'formes_corpus_a_4_axes', 'formes_corpus_retrouvees', 'socles_realises', 'socles_possibles')}
cells = [(r, c) for r in range(N) for c in range(N)]
cid = {p: i for i, p in enumerate(cells)}
perm = lambda f: np.array([cid[f(r, c)] for r, c in cells])  # noqa: E731
SIGMA = perm(lambda r, c: ((r + 6) % N, (c + 6) % N))
REFLEXIONS = [perm(lambda r, c: (r, N - 1 - c)), perm(lambda r, c: (N - 1 - r, c)), perm(lambda r, c: (c, r)), perm(lambda r, c: (N - 1 - c, N - 1 - r))]
PIS = [(1, 0, 2), (2, 1, 0), (0, 2, 1)]  # (V M), (V O), (M O)
INVOLUTIONS = [np.array(p, np.uint8) for p in PIS]


def socles_possibles():
    """Les unions d'orbites (sous σ et les quatre réflexions de la carte) de 48 cases : les socles qu'une couche admise pourrait avoir, avant les contraintes de teintes."""
    import itertools
    lab, k = orbites(REFLEXIONS + [SIGMA])
    t = np.bincount(lab, minlength=k)
    return sum(1 for r in range(k + 1) for sub in itertools.combinations(range(k), r) if int(t[list(sub)].sum()) == 48)



def orbites(gens):
    parent = list(range(144))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for g in gens:
        for i in range(144):
            a, b = find(i), find(int(g[i]))
            if a != b:
                parent[a] = b
    lab, roots = np.zeros(144, int), {}
    for i in range(144):
        lab[i] = roots.setdefault(find(i), len(roots))
    return lab, len(roots)


def couches():
    """Les couches symétriques par les quatre réflexions de la carte, avec A∘σ = π∘A et 48 / 48 / 48."""
    lab, k = orbites(REFLEXIONS)
    tailles = np.bincount(lab, minlength=k)
    aretes = {(int(lab[i]), int(lab[SIGMA[i]])) for i in range(144)}
    trouvees = {}
    for pi in PIS:
        adj = {i: [] for i in range(k)}
        for u, v in aretes:
            adj[u].append(v)
            adj[v].append(u)
        comp, par, comps = [-1] * k, [0] * k, []
        for s in range(k):
            if comp[s] != -1:
                continue
            comp[s], stack, nodes, impair = len(comps), [s], [s], False
            while stack:
                u = stack.pop()
                for v in adj[u]:
                    if comp[v] == -1:
                        comp[v], par[v] = comp[s], par[u] ^ 1
                        stack.append(v)
                        nodes.append(v)
                    elif par[v] == par[u]:
                        impair = True
            comps.append((nodes, impair))
        fixe = [x for x in range(3) if pi[x] == x][0]
        opts = []
        for nodes, impair in comps:
            o = []
            for c in ([fixe] if impair else range(3)):
                col = {n: (c if par[n] == 0 else pi[c]) for n in nodes}
                cnt = [0, 0, 0]
                for n, cc in col.items():
                    cnt[cc] += int(tailles[n])
                o.append((col, cnt))
            opts.append(o)

        def dfs(i, cnt, choix):
            if any(x > 48 for x in cnt):
                return
            if i == len(opts):
                if cnt == [48, 48, 48]:
                    col = np.zeros(k, np.uint8)
                    for d in choix:
                        for n, cc in d.items():
                            col[n] = cc
                    trouvees[col[lab].astype(np.uint8).tobytes()] = pi
                return
            for col, c in opts[i]:
                dfs(i + 1, [cnt[0] + c[0], cnt[1] + c[1], cnt[2] + c[2]], choix + [col])
        dfs(0, [0, 0, 0], [])
    return [np.frombuffer(b, np.uint8).reshape(N, N) for b in trouvees]


def forme(g):
    return min(np.roll(np.roll(g, dr, 0), dc, 1).tobytes() for dr in range(N) for dc in range(N))


def calculer():
    gs = couches()
    classes = {forme(g) for g in gs}
    corpus = [np.array([[LET.index(x) for x in r] for r in e['tricolore']], np.uint8) for e in json.load(open(os.path.join(RACINE, 'data', 'corpus-256.json'), encoding='utf-8'))['entrees']]
    quatre = {forme(g) for g in corpus if _quatre_axes(g)}
    socles = {tuple(int(x) for x in (g == p[g]).ravel()) for g in gs for p in INVOLUTIONS if np.array_equal(np.roll(np.roll(g, 6, 0), 6, 1), p[g])}
    return {'couches': len(gs), 'couples': len(gs) // 2, 'formes': len(classes), 'formes_corpus_a_4_axes': len(quatre), 'formes_corpus_retrouvees': len(quatre & classes),
            'socles_realises': len(socles), 'socles_possibles': socles_possibles()}


def _quatre_axes(g):
    idx = np.arange(N)
    v = any(np.array_equal(g[:, (d - idx) % N], g) for d in range(N))
    h = any(np.array_equal(g[(d - idx) % N, :], g) for d in range(N))
    d1 = any(np.array_equal(g[(idx[None, :] + a) % N, (idx[:, None] - a) % N], g) for a in range(N))
    d2 = any(np.array_equal(g[(a - idx[None, :]) % N, (a - idx[:, None]) % N], g) for a in range(N))
    return v and h and d1 and d2


def main():
    n = calculer()
    print(n)
    if '--verifie' in sys.argv:
        if n != ATTENDU:
            print(f'ÉCART {n} au lieu de {ATTENDU}', file=sys.stderr)
            sys.exit(1)
        esp = lambda x: f'{x:,}'.replace(',', ' ')  # noqa: E731
        print(f"OK    {esp(n['couches'])} couches à quatre axes ({esp(n['couples'])} couples), {esp(n['formes'])} formes, dont les {n['formes_corpus_a_4_axes']} formes à quatre axes du corpus.")


if __name__ == '__main__':
    main()
