#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
corpus_miroir.py — la symétrie miroir caractérise EXACTEMENT les 256 grilles du corpus tricolore (couple YANG, YANG-MUT) parmi 16 384 candidates (calcul du 26 novembre 2026, prompt de suite du 261).

Les 96 cases mobiles de chaque grille se découpent en DOUZE blocs de 8 cases, invariants par σ (le demi-décalage) et par le quart de tour. Laisser chaque bloc choisir sa couche (YANG ou YANG-MUT) donne 4 096 grilles
par famille représentante, toutes unifiées (théorème 2 de la note : seule L∘σ = L compte) et à 48 / 48 / 48 cases par teinte. Les quatre familles représentantes ({YANG}, {YANG-MUT}, {YIN,YANG}, {YIN,YANG-MUT})
donnent 16 384 candidates, 8 192 grilles distinctes. Résultat vérifié ici : celles qui ont une vraie ligne de miroir dans le pavage (axe vertical, horizontal ou diagonale, avec une translation perpendiculaire à l'axe ;
un glissement ne compte pas) sont EXACTEMENT les 256 grilles du corpus (data/corpus-256.json), celles où les deux blocs d'un même niveau prennent la même couche — les 64 hexagrammes de chaque famille.
Aucune des 7 936 autres grilles distinctes n'a de miroir.
DÉMONSTRATION pour les miroirs centrés sur la carte : (1) pour chacune des quatre réflexions ρ de la carte, A∘ρ = A ou A∘ρ = B = π∘A ; (2) ρ échange les deux blocs de chaque niveau. Si A∘ρ = A, g∘ρ = g
équivaut à c∘ρ = c sur les cases mobiles (c : le choix de couche, constant sur chaque bloc) ; si A∘ρ = B, g∘(ρσ) = g équivaut à c∘(ρσ) = c (σ fixe chaque bloc). Dans les deux cas le miroir exact exige, d'après (2),
que les deux blocs de chaque niveau prennent la même couche : c'est exactement le corpus. Pour les miroirs situés ailleurs que sur les axes de la carte, la caractérisation est vérifiée par le calcul exhaustif ci-dessus
(tous les axes du pavage sont cherchés), pas démontrée. Le découpage en six niveaux n'est donc pas un choix parmi d'autres : parmi les découpages en douze blocs, c'est celui que la symétrie miroir impose.

  python3 tools/corpus_miroir.py            imprime les nombres
  python3 tools/corpus_miroir.py --essai    un miroir est vu, un glissement et une grille quelconque ne comptent pas
  python3 tools/corpus_miroir.py --verifie  échoue si les grilles à miroir ne sont pas exactement celles du corpus
"""
import itertools
import json
import os
import sys

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import check_note_v6 as note  # noqa: E402

N = 12
REPS = [('{YANG}', '{YANG}'), ('{YANG-MUT}', '{YANG-MUT}'), ('PAR2-YIN-YANG', '{YIN,YANG}'), ('PAR2-YIN-YANG-MUT', '{YIN,YANG-MUT}')]
LET = 'VMO'
S3 = list(itertools.permutations(range(3)))
sig = lambda p: ((p[0] + 6) % N, (p[1] + 6) % N)  # noqa: E731
rot = lambda p: (p[1], N - 1 - p[0])  # noqa: E731
idx = np.arange(N)


def vrai_miroir(g):
    """Le premier axe du pavage qui est une vraie ligne de miroir (pas un glissement), ou None."""
    for d in range(N):
        if np.array_equal(g[:, (d - idx) % N], g):
            return 'vertical'
        if np.array_equal(g[(d - idx) % N, :], g):
            return 'horizontal'
    for a in range(N):
        if np.array_equal(g[(idx[None, :] + a) % N, (idx[:, None] - a) % N], g):
            return 'diagonale'
        if np.array_equal(g[(a - idx[None, :]) % N, (a - idx[:, None]) % N], g):
            return 'anti-diagonale'
    return None


def transformees(g):
    """Les 96 transformées de Γ = D4 × <σ> × S3."""
    out = []
    for h in (g, g[:, ::-1]):
        k = h
        for _ in range(4):
            for hh in (k, np.roll(np.roll(k, 6, 0), 6, 1)):
                for p in S3:
                    out.append(np.array(p, np.uint8)[hh])
            k = np.rot90(k)
    return out


def lignes(g):
    return [''.join(LET[x] for x in r) for r in g.tolist()]


def blocs_mobiles(A, B):
    M = [(r, c) for r in range(N) for c in range(N) if A[r, c] != B[r, c]]
    assert len(M) == 96
    vus, orbs = set(), []
    for p in M:
        if p in vus:
            continue
        o, fr = {p}, [p]
        while fr:
            q = fr.pop()
            for g in (sig, rot):
                x = g(q)
                if x not in o:
                    o.add(x)
                    fr.append(x)
        vus |= o
        orbs.append(sorted(o))
    assert len(orbs) == 12 and all(len(o) == 8 for o in orbs)
    return sorted(orbs, key=lambda o: o[0])


def construire():
    L, FAM, _ = note.charger()
    corpus = json.load(open(os.path.join(RACINE, 'data', 'corpus-256.json'), encoding='utf-8'))
    ancien = {'/'.join(e['tricolore']): e for e in corpus['entrees']}
    blocs_ref = None
    retenues = {}
    distinctes = set()
    candidates = 0
    for cle, nom in REPS:
        A = np.array([[LET.index(x) for x in r] for r in FAM[cle]['YANG']], np.uint8)
        B = np.array([[LET.index(x) for x in r] for r in FAM[cle]['YANG-MUT']], np.uint8)
        blocs = blocs_mobiles(A, B)
        if blocs_ref is None:
            blocs_ref = blocs
        assert blocs == blocs_ref, 'les quatre familles représentantes ont les mêmes blocs mobiles'
        masques = []
        for o in blocs:
            m = np.zeros((N, N), bool)
            for r, c in o:
                m[r, c] = True
            masques.append(m)
        for s in range(4096):
            m = np.zeros((N, N), bool)
            for k in range(12):
                if (s >> k) & 1:
                    m |= masques[k]
            g = np.where(m, A, B)
            candidates += 1
            distinctes.add(g.tobytes())
            mir = vrai_miroir(g)
            if mir is None:
                continue
            cle_g = g.tobytes()
            if cle_g in retenues:
                retenues[cle_g]['familles'].append(nom)
                continue
            retenues[cle_g] = {'g': g, 'familles': [nom], 'blocs': s, 'miroir': mir}
    entrees = []
    for e in retenues.values():
        g = e['g']
        t = lignes(g)
        a = ancien.get('/'.join(t))
        classe = min(x.tobytes() for x in transformees(g))
        entrees.append({'_classe': classe, 'familles': e['familles'], 'blocs_12_bits': format(e['blocs'], '012b'), 'miroir': e['miroir'], 'ancien': a is not None,
                        'id_corpus_256': a['id'] if a else None, 'kingwen_par_famille': a['kingwen_par_famille'] if a else None, 'tricolore': t})
    classes = {c: i + 1 for i, c in enumerate(sorted({e['_classe'] for e in entrees}))}
    entrees.sort(key=lambda e: (classes[e['_classe']], not e['ancien'], e['blocs_12_bits']))
    for i, e in enumerate(entrees):
        e['id'] = f'miroir-{i + 1:03d}'
        e['forme'] = classes[e.pop('_classe')]
    return {'nombres': {'candidates': candidates, 'distinctes': len(distinctes), 'grilles': len(entrees), 'anciennes': sum(e['ancien'] for e in entrees),
                        'nouvelles': sum(not e['ancien'] for e in entrees), 'formes': len({e['forme'] for e in entrees})}}


def lemme():
    """Les deux faits sur lesquels repose la démonstration de la caractérisation (miroirs centrés sur la carte), vérifiés sur les quatre familles représentantes :
    (1) chacune des quatre réflexions de la carte ρ (c → 11 − c, r → 11 − r, la diagonale, l'anti-diagonale) vérifie A∘ρ = A ou A∘ρ = B (B = π∘A), jamais autre chose ;
    (2) ρ échange les deux blocs de 8 cases de CHAQUE niveau, n'en fixe aucun et ne mélange pas les niveaux."""
    L, FAM, _ = note.charger()
    Lm = np.array(L)
    refl = {'v': lambda r, c: (r, N - 1 - c), 'h': lambda r, c: (N - 1 - r, c), 'd': lambda r, c: (c, r), 'a': lambda r, c: (N - 1 - c, N - 1 - r)}
    img = {'v': lambda g: g[:, ::-1], 'h': lambda g: g[::-1, :], 'd': lambda g: g.T, 'a': lambda g: g[::-1, ::-1].T}
    for cle, _ in REPS:
        A = np.array([[LET.index(x) for x in r] for r in FAM[cle]['YANG']], np.uint8)
        B = np.array([[LET.index(x) for x in r] for r in FAM[cle]['YANG-MUT']], np.uint8)
        blocs = blocs_mobiles(A, B)
        bid = {p: i for i, o in enumerate(blocs) for p in o}
        for nom, f in refl.items():
            if not (np.array_equal(img[nom](A), A) or np.array_equal(img[nom](A), B)):
                return False
            for i, o in enumerate(blocs):
                autres = {bid[f(*p)] for p in o}
                if len(autres) != 1 or autres == {i} or Lm[blocs[autres.copy().pop()][0]] != Lm[o[0]]:
                    return False
    return True


def essai():
    rng = np.random.default_rng(7)
    h = rng.integers(0, 3, (N, N // 2)).astype(np.uint8)
    miroir = np.concatenate([h, h[:, ::-1]], axis=1)  # axe vertical
    glissement = rng.integers(0, 3, (N, N)).astype(np.uint8)
    for r in range(1, 6):  # glissement : (r, c) -> (−r, c + 3), sans ligne de miroir
        glissement[(-r) % N] = np.roll(glissement[r], 3)
    glissement[0], glissement[6] = 0, 1
    sans = rng.integers(0, 3, (N, N)).astype(np.uint8)
    vus = (vrai_miroir(miroir) is not None) + (vrai_miroir(glissement) is None) + (vrai_miroir(sans) is None)
    if vus != 3:
        print(f'ÉCHEC --essai : {vus} cas sur 3', file=sys.stderr)
        sys.exit(1)
    print('OK    --essai : un miroir vertical est vu ; un glissement et une grille quelconque ne comptent pas (3 sur 3).')


def main():
    if '--essai' in sys.argv:
        return essai()
    doc = construire()
    n = doc['nombres']
    ok = n['grilles'] == 256 and n['anciennes'] == 256 and n['nouvelles'] == 0 and n['formes'] == 128
    print(f"{n['candidates']} candidates ({n['distinctes']} distinctes) : {n['grilles']} ont un miroir, dont {n['anciennes']} sont dans le corpus ({n['formes']} formes) ; {n['nouvelles']} n'y sont pas.")
    if '--verifie' in sys.argv:
        if not lemme():
            print('ÉCART le lemme des réflexions (A∘ρ ∈ {A, B} ; ρ échange les deux blocs de chaque niveau) ne tient plus', file=sys.stderr)
            sys.exit(1)
        if not ok:
            print('ÉCART les grilles à miroir ne sont pas exactement celles du corpus (256 grilles, 128 formes, 0 nouvelle)', file=sys.stderr)
            sys.exit(1)
        print('OK    la symétrie miroir caractérise exactement les 256 grilles du corpus parmi les candidates à douze blocs.')


if __name__ == '__main__':
    main()
