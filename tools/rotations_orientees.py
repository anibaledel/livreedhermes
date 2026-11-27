#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: voir LICENSE
"""
rotations_orientees.py — le cube habillé par des panneaux posés « endroit dehors » : chaque face reçoit g tournée d'un multiple de 90°, vue de l'EXTÉRIEUR, sans jamais la retourner.

C'est le cas d'un panneau brodé ou imprimé sur une seule face : on le tourne, on ne le retourne pas. Le résultat est intrinsèque : il ne dépend d'aucune convention de repérage, parce que chaque face est
repérée par un repère DIRECT vu de l'extérieur (u × v pointe hors du cube) ; pour une face dont le repère de cube_edges.py est indirect, on échange ses deux axes. L'adjacence des cases est relue de la géométrie
(deux cases de faces différentes sont voisines si elles partagent un segment unité), pas des cartes de cube_edges.py : c'est un recalcul indépendant de `habillage(..., rotations_seules=True)`.

Résultat (vérifié ici sur les 1 024 triplets) : les mêmes quatre familles que le groupe diédral complet admettent un habillage, soit 256 grilles et 128 pavages modulo σ ; interdire le retournement ne retire rien.
(Avec les repères indirects de cube_edges.py laissés tels quels, le calcul « rotations seules » mélange des faces vues de dehors et de dedans : il donne deux familles, mais ce nombre est un artefact du repérage.)

Usage : python3 tools/rotations_orientees.py [--echantillon]     --echantillon : un indice sur neuf seulement (quelques secondes) ; sans option : les 64 indices de chaque couple (quelques minutes)
Le script doit rester dans le même dossier que cube_edges.py.
"""
import itertools
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce  # noqa: E402

N = 12


def directe(nom):
    """Vrai si (ec, er) de la face, dans cube_edges.FACES, est direct vu de l'extérieur : ec × er pointe hors du cube (centre en (6, 6, 6))."""
    O, ec, er = ce.FACES[nom]
    n = (ec[1] * er[2] - ec[2] * er[1], ec[2] * er[0] - ec[0] * er[2], ec[0] * er[1] - ec[1] * er[0])
    centre = tuple(O[k] + 6 * ec[k] + 6 * er[k] - 6 for k in range(3))
    return sum(n[k] * centre[k] for k in range(3)) > 0


def repere(nom):
    O, ec, er = ce.FACES[nom]
    return (O, ec, er) if directe(nom) else (O, er, ec)


def aretes():
    """Les 12 arêtes : { {face1, face2} : 12 paires de cases ((face, ligne, colonne), (face, ligne, colonne)) } dans le repère direct de chaque face."""
    seg = {}
    for f in ce.NOMS_FACES:
        O, ec, er = repere(f)
        P = lambda i, j: tuple(O[k] + ec[k] * i + er[k] * j for k in range(3))
        for a in range(N):
            for b in range(N):
                v = [P(b, a), P(b + 1, a), P(b + 1, a + 1), P(b, a + 1)]
                for i in range(4):
                    seg.setdefault(frozenset((v[i], v[(i + 1) % 4])), []).append((f, a, b))
    out = {}
    for cs in seg.values():
        if len(cs) == 2 and cs[0][0] != cs[1][0]:
            out.setdefault(frozenset((cs[0][0], cs[1][0])), []).append(tuple(sorted(cs, key=lambda c: ce.NOMS_FACES.index(c[0]))))
    assert len(out) == 12 and all(len(v) == 12 for v in out.values())
    return out


EDGES = aretes()


def tourne(g):
    return [[g[N - 1 - c][r] for c in range(N)] for r in range(N)]


def habillable(g, pi):
    """Vrai s'il existe, pour les six faces, des rotations de g (0, 90, 180, 270°) telles que toutes les paires de cases voisines portent des teintes échangées par π."""
    R = [g]
    for _ in range(3):
        R.append(tourne(R[-1]))
    admis = {}
    for fs, paires in EDGES.items():
        fa, fb = sorted(fs, key=ce.NOMS_FACES.index)
        S = {(ka, kb) for ka in range(4) for kb in range(4)
             if all(R[kb][a2][b2] == pi[R[ka][a1][b1]] for (_, a1, b1), (_, a2, b2) in paires)}
        if not S:
            return False                       # obstruction locale
        admis[(ce.NOMS_FACES.index(fa), ce.NOMS_FACES.index(fb))] = S
    return any(all((ks[i], ks[j]) in S for (i, j), S in admis.items()) for ks in itertools.product(range(4), repeat=6))


def main():
    pas = 9 if '--echantillon' in sys.argv else 1
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    par_famille, grilles = {}, set()
    for f, a, b in ce.couples_unifies(F, L):
        A, B = F[f][a], F[f][b]
        pi = ce.involution(A, B)
        for n in range(0, 64, pas):
            g = ce.phi(n, A, B, L)
            ok = habillable(g, pi)
            par_famille.setdefault(f, [0, 0])[0] += ok
            par_famille[f][1] += 1
            if ok:
                grilles.add(tuple(tuple(r) for r in g))
    print(f"faces repérées vues de l'extérieur : {[f for f in ce.NOMS_FACES if directe(f)]} ont déjà un repère direct, les autres ont leurs axes échangés")
    for f in sorted(par_famille):
        print(f"    {f:24s} {par_famille[f][0]:3d} / {par_famille[f][1]:3d} triplets habillables")
    admises = sorted(f for f, (k, _) in par_famille.items() if k)
    print(f"familles habillables en rotations seules, vues de l'extérieur : {len(admises)} ({', '.join(admises)})")
    print(f"grilles distinctes habillables : {len(grilles)}")


if __name__ == '__main__':
    main()
