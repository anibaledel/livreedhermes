#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
couverture_quatre_axes.py — la couverture spectrale des formes à quatre axes à la lecture binaire (prompt 271) : les 288 formes entre les cases, les 3 200 formes sur le milieu des cases, leur réunion (3 488).

Chaîne : tools/formes_quatre_axes_enum.py (les 76 992 grilles) → tools/formes_quatre_axes_milieu_lecture.mjs --drapeaux (la lecture binaire de assets/lecture-binaire.js : 576 + 6 400 grilles parfaites)
→ les formes (classes à translation torique près) → ici le spectre. Pour chaque forme : P(k) = la somme des puissances de Fourier (fft2) des trois indicatrices de teinte, k ≠ 0 ;
« pics dominants » = les positions k = (min(k1, 12 − k1), min(k2, 12 − k2)), 27 possibles, où P atteint son maximum ; « spectres distincts » = les P (arrondis à 5 décimales) deux à deux différents ;
« centroïde » = Σ P(k)|k| / Σ P(k), avec |k| = √(min(k1, 12 − k1)² + min(k2, 12 − k2)²). Minimum / médiane / maximum sur les formes.
Contrôle de ce que lit data/formes-quatre-axes-288.json (suite de l'ancien spectre_formes_288.py) : 288 formes, 48 / 48 / 48, un seul motif (g∘σ = π∘g), quatre axes, loi de parité
(teinte fixe et somme des deux autres : seulement k1 + k2 pair ; leur différence : seulement k1 + k2 impair), 285 spectres distincts, 12 ensembles de pics ; et ces 288 formes sont celles que la lecture binaire donne ici.
Nombres attendus : lus dans data/resultats-etablis.json (résultat « formes-quatre-axes-milieu »), pas recopiés ici.

Les 3 200 formes sur le milieu des cases ne sont PAS engendrées par la carte des six niveaux actuelle (data/referent_360_v3.json). Leur fermeture sur le cube n'a pas été testée : cet outil ne l'affirme pas.
Aucun sens n'est attribué aux motifs.

  python3 tools/couverture_quatre_axes.py            imprime les nombres
  python3 tools/couverture_quatre_axes.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json ou si l'un des contrôles des 288 formes manque
  python3 tools/couverture_quatre_axes.py --essai    un spectre faussé, un nombre faussé et une forme faussée sont refusés
"""
import copy
import json
import os
import subprocess
import sys
from collections import Counter

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import formes_quatre_axes_enum as enum  # noqa: E402

N = 12
T = 'VMO'
K = np.minimum(np.arange(N), N - np.arange(N))
R = np.sqrt(K[:, None] ** 2 + K[None, :] ** 2)
IMPAIR = (np.add.outer(np.arange(N), np.arange(N)) % 2 == 1)
TOUTES = [(a, b) for a in range(7) for b in range(a, 7) if (a, b) != (0, 0)]  # les 27 positions


def arr(rows):
    return np.array([[T.index(x) for x in r] for r in rows])


def canon(g):
    return min(np.roll(g, (a, b), (0, 1)).tobytes() for a in range(N) for b in range(N))


def analyse(g):
    P = sum(np.abs(np.fft.fft2((g == t).astype(float))) ** 2 for t in range(3))
    P[0, 0] = 0
    mx = P.max()
    pics = tuple(sorted({tuple(sorted(min(a, N - a) for a in (i, j))) for i in range(N) for j in range(N) if abs(P[i, j] - mx) < 1e-6}))
    return pics, float((P * R).sum() / P.sum()), tuple(np.round(P.flatten(), 5))


def formes_lues():
    """{'entre': [analyse…], 'milieu': [analyse…]} — une analyse par forme parfaite."""
    res = enum.toutes()
    out = subprocess.run(['node', os.path.join(RACINE, 'tools/formes_quatre_axes_milieu_lecture.mjs'), '--drapeaux'], capture_output=True, text=True, check=True).stdout
    fl = json.loads(out)
    nombres, formes, classes = {}, {}, {}
    for nom in ('entre', 'milieu'):
        assert len(fl[nom]) == len(res[nom]), nom
        vus = {}
        n = 0
        for (pi, rows), f in zip(res[nom], fl[nom]):
            if not f:
                continue
            n += 1
            g = arr(rows)
            c = canon(g)
            if c not in vus:
                vus[c] = analyse(g)
        nombres[nom] = n
        formes[nom] = list(vus.values())
        classes[nom] = set(vus)
    return nombres, formes, classes


def resume(L):
    pos = {p for pk, _, _ in L for p in pk}
    cs = np.array([c for _, c, _ in L])
    return {
        'formes': len(L), 'positions': len(pos), 'ensembles_de_pics': len({pk for pk, _, _ in L}),
        'spectres': len({s for _, _, s in L}),
        'centroide': [round(float(cs.min()), 2), round(float(np.median(cs)), 2), round(float(cs.max()), 2)],
        'pics_seuls': Counter(pk[0] for pk, _, _ in L if len(pk) == 1), 'positions_atteintes': pos,
    }


def controles_288():
    """Les contrôles de l'ancien spectre_formes_288.py sur data/formes-quatre-axes-288.json. Retourne (classes, analyses, écarts)."""
    with open(os.path.join(RACINE, 'data/formes-quatre-axes-288.json'), encoding='utf-8') as h:
        formes = json.load(h)['formes']
    ecarts, classes, analyses = [], set(), []
    if len(formes) != 288:
        ecarts.append(f'{len(formes)} formes dans data/formes-quatre-axes-288.json')
    for f in formes:
        g = arr(f['tricolore'])
        m = controle_forme(g)
        if m:
            ecarts.append(f'{f["id"]} : {m}')
            continue
        classes.add(canon(g))
        analyses.append(analyse(g))
    return classes, analyses, ecarts


def controle_forme(g):
    if [int((g == t).sum()) for t in range(3)] != [48, 48, 48]:
        return '48 / 48 / 48'
    sg = np.roll(g, (6, 6), (0, 1))
    fixes = [t for t in range(3) if ((sg == t) == (g == t)).all()]
    if len(fixes) != 1:
        return 'une seule teinte fixe par σ'
    fx = fixes[0]
    o = [t for t in range(3) if t != fx]
    pi = {fx: fx, o[0]: o[1], o[1]: o[0]}
    if not all(sg[r, c] == pi[g[r, c]] for r in range(N) for c in range(N)):
        return 'g∘σ = π∘g'
    if not ((g[:, ::-1] == g).all() and (g[::-1, :] == g).all() and (g.T == g).all() and (g[::-1, ::-1].T == g).all()):
        return 'quatre axes'
    F = [np.fft.fft2((g == t).astype(float)) for t in range(3)]
    Ff, Fs, Fd = F[fx], F[o[0]] + F[o[1]], F[o[0]] - F[o[1]]
    if not ((abs(Ff[IMPAIR]) < 1e-9).all() and (abs(Fs[IMPAIR]) < 1e-9).all() and (abs(Fd[~IMPAIR]) < 1e-9).all()):
        return 'loi de parité'
    return None


def ecarts(lus, att, c288):
    """lus = (nombres, formes, classes) ; c288 = (classes, analyses, écarts) des 288 du dépôt. Liste des écarts avec ce que le fichier des résultats attend."""
    nombres, formes, classes = lus
    e = list(c288[2])
    couv = att['couverture']
    lec = att['lecture']
    if nombres['entre'] != lec['grilles_entre_les_cases'] or nombres['milieu'] != lec['grilles_milieu_des_cases']:
        e.append(f'grilles parfaites : {nombres["entre"]} / {nombres["milieu"]}, attendu {lec["grilles_entre_les_cases"]} / {lec["grilles_milieu_des_cases"]}')
    if classes['entre'] != c288[0]:
        e.append('les formes entre les cases lues ici ne sont pas celles de data/formes-quatre-axes-288.json')
    r = {'entre': resume(formes['entre']), 'milieu': resume(formes['milieu']), 'reunion': resume(formes['entre'] + formes['milieu'])}
    for nom, a in couv.items():
        for cle in ('formes', 'positions', 'ensembles_de_pics', 'spectres', 'centroide'):
            if r[nom][cle] != a[cle]:
                e.append(f'{nom} : {cle} = {r[nom][cle]}, attendu {a[cle]}')
        if nom == 'milieu':
            for cle, pos in (('pic_seul_6_6', (6, 6)), ('pic_seul_4_4', (4, 4))):
                if r[nom]['pics_seuls'][pos] != a[cle]:
                    e.append(f'{nom} : {cle} = {r[nom]["pics_seuls"][pos]}, attendu {a[cle]}')
    # les 288 du dépôt : 285 spectres distincts, 12 ensembles de pics
    an = c288[1]
    if len({s for _, _, s in an}) != couv['entre']['spectres'] or len({pk for pk, _, _ in an}) != couv['entre']['ensembles_de_pics']:
        e.append('les 288 formes du dépôt n\'ont pas les spectres et ensembles de pics attendus')
    return e, r


def lignes(r, c288):
    f = lambda x: f'{x:.2f}'.replace('.', ',')  # noqa: E731
    out = [f'OK    les 288 formes de data/formes-quatre-axes-288.json : 48 / 48 / 48, un seul motif, quatre axes, loi de parité ; ce sont les formes que la lecture binaire donne entre les cases.']
    for nom, titre in (('entre', 'entre les cases'), ('milieu', 'sur le milieu des cases'), ('reunion', 'réunion')):
        x = r[nom]
        out.append(f'OK    couverture {titre} : {x["formes"]} formes, {x["positions"]} positions de pic sur 27, {x["ensembles_de_pics"]} ensembles de pics, {x["spectres"]} spectres distincts, centroïde {f(x["centroide"][0])} / {f(x["centroide"][1])} / {f(x["centroide"][2])}.')
    m = r['milieu']['pics_seuls']
    out.append(f'OK    sur le milieu des cases : {m[(6, 6)]} formes avec le seul pic dominant en (6, 6), {m[(4, 4)]} en (4, 4).')
    out.append('OK    positions de pic atteintes seulement sur le milieu des cases : ' + ', '.join(str(p) for p in sorted(r['milieu']['positions_atteintes'] - r['entre']['positions_atteintes'])) + '.')
    return out


def essai(lus, att, c288):
    e, _ = ecarts(lus, att, c288)
    if e:
        sys.exit('ÉCHEC --essai : les nombres vrais ne passent pas : ' + '; '.join(e))
    # 1. un nombre attendu faussé
    faux = copy.deepcopy(att); faux['couverture']['milieu']['spectres'] += 1
    if not ecarts(lus, faux, c288)[0]:
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # 2. une forme faussée (une case changée) : refusée par les contrôles des 288
    with open(os.path.join(RACINE, 'data/formes-quatre-axes-288.json'), encoding='utf-8') as h:
        g = arr(json.load(h)['formes'][0]['tricolore'])
    g[0, 0] = (g[0, 0] + 1) % 3
    if controle_forme(g) is None:
        sys.exit('ÉCHEC --essai : une forme faussée est passée.')
    # 3. un spectre faussé : le spectre d'une forme change, le compte des spectres distincts aussi
    nombres, formes, classes = lus
    f2 = {k: list(v) for k, v in formes.items()}
    pk, c, s = f2['entre'][1]
    f2['entre'][0] = (f2['entre'][0][0], f2['entre'][0][1], s)
    if not any('spectres' in x for x in ecarts((nombres, f2, classes), att, c288)[0]):
        sys.exit('ÉCHEC --essai : un spectre faussé est passé.')
    print('OK    --essai : un nombre faussé, une forme faussée et un spectre faussé sont refusés (3 sur 3).')


def main():
    att = enum.attendus()
    lus = formes_lues()
    c288 = controles_288()
    if '--essai' in sys.argv:
        return essai(lus, att, c288)
    e, r = ecarts(lus, att, c288)
    if '--verifie' in sys.argv and e:
        for x in e:
            print('ÉCART ' + x, file=sys.stderr)
        sys.exit(1)
    for l in lignes(r, c288):
        print(l)
    if e:
        for x in e:
            print('écart avec data/resultats-etablis.json : ' + x)


if __name__ == '__main__':
    main()
