#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
check_jeu_unifie.py — le jeu unifié (96 plaques, prompts 243 et 257) relu en entier.

  - data/jeu-unifie-96.json est celui que tools/jeu_unifie.py écrit depuis le référent 360 ; 96 plaques, 96 empreintes distinctes (SHA-256) ;
  - le mapping : chaque plaque (famille, couche, niveau) a les mêmes cases que la couche du référent (tools/check_note_v6.py : familles, niveaux), sur les quatre familles représentantes ;
  - les 512 grilles se reconstruisent à partir de ces SEULES plaques (4 familles × 2 couples × 64 hexagrammes), toutes distinctes, en 256 paires {n, 63 − n} ;
  - les quatre familles jumelles (TWINS) donnent exactement les mêmes grilles ;
  - le complément : Φ(63 − n) est Φ(n) à deux teintes échangées (une permutation involutive, deux teintes changées) ET décalé d'une demi-période — le décalage (6, 6) SEUL (prompt 257 : (0, 6) et (6, 0) ne sont pas acceptés) ;
  - les 512 grilles sont celles de la galerie tricolore (data/fonds_ecran_v1.json, correspondance de data/patterns-unifies-fiches.json), cellule par cellule.
Usage : python3 tools/check_jeu_unifie.py [--essai]
"""
import json
import os
import re
import sys

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from jeu_unifie import DATA, FAMILIES, TWINS, LAYERS, manifest, plates  # noqa: E402
import check_note_v6 as note  # noqa: E402

ESSAI = '--essai' in sys.argv
CLE_NOTE = {'YANG': '{YANG}', 'YANG-MUT': '{YANG-MUT}', 'YIN+YANG': 'PAR2-YIN-YANG', 'YIN+YANG-MUT': 'PAR2-YIN-YANG-MUT'}  # famille du jeu → famille du référent lue par la note
NOM_FICHES = {'YANG': '{YANG}', 'YANG-MUT': '{YANG-MUT}', 'YIN+YANG': '{YIN,YANG}', 'YIN+YANG-MUT': '{YIN,YANG-MUT}'}  # famille du jeu → nom dans data/patterns-unifies-fiches.json
TEINTE = {'violet': 'V', 'magenta': 'M', 'orange': 'O'}


def grilles(data, pp):
    """Les 512 grilles (famille, couple, n) → matrice 12×12 de lettres V/M/O, depuis les seules plaques pp."""
    cases = {}
    for p in pp:
        cases[(p['famille'], p['couche'], p['niveau'])] = {(r, c): TEINTE[col] for col in data['colors'] for r, c in p[col + '_positions']}
    assert len(cases) == 96 and all(len(v) == 24 for v in cases.values())
    niv = data['layer_of']
    assert {x for ligne in niv for x in ligne} == set(range(1, 7))
    out = {}
    for f in sorted({p['famille'] for p in pp}):
        for k in range(2):
            for n in range(64):
                out[(f, k, n)] = np.array([[cases[(f, LAYERS[2 * k + (0 if (n >> (niv[r][c] - 1)) & 1 else 1)], niv[r][c])][(r, c)] for c in range(12)] for r in range(12)])
    return out


def main():
    echecs = []
    ctrl = 0

    def ok(cond, msg):
        nonlocal ctrl
        ctrl += 1
        if not cond:
            echecs.append(msg)

    src = json.load(open(os.path.join(DATA, 'referent_360_v3.json'), encoding='utf-8'))
    chemin = os.path.join(DATA, 'jeu-unifie-96.json')
    data = json.load(open(chemin, encoding='utf-8'))
    ok(data == manifest(src), 'data/jeu-unifie-96.json est celui que le référent donne (python3 tools/jeu_unifie.py)')
    ok(len(data['plaques']) == 96 and len({p['source_sha256'] for p in data['plaques']}) == 96 and all(re.fullmatch('[0-9a-f]{64}', p['source_sha256']) for p in data['plaques']), '96 plaques, 96 empreintes distinctes')
    ok(set(FAMILIES) == {'YANG', 'YANG-MUT', 'YIN+YANG', 'YIN+YANG-MUT'}, 'quatre familles représentantes')

    # le mapping, relu sur le référent par la note (sans passer par les noms du référent)
    L, FAM, _ = note.charger()
    Lm = np.array(L)
    mapping_ok = True
    for p in data['plaques']:
        couche = FAM[CLE_NOTE[p['famille']]][p['couche']]
        voulu = {(r, c): couche[r][c] for r in range(12) for c in range(12) if Lm[r][c] == p['niveau']}
        lu = {(r, c): TEINTE[col] for col in data['colors'] for r, c in p[col + '_positions']}
        mapping_ok &= voulu == lu
    ok(mapping_ok, 'mapping : chacune des 96 plaques a les cases de sa couche et de son niveau dans le référent (famille, couche, niveau)')

    g = grilles(data, data['plaques'])
    ok(len(g) == 512 and len({v.tobytes() for v in g.values()}) == 512, '512 grilles reconstruites depuis les seules plaques, toutes distinctes')
    t = grilles(src, plates(src, TWINS))
    ok(set(g) == set(t) and all({g[c].tobytes() for c in g if c[0] == f} == {t[c].tobytes() for c in t if c[0] == f} for f in FAMILIES),
       'les quatre familles jumelles donnent exactement les mêmes 128 grilles chacune (avec un n différent : n ⊕ 56 ou n ⊕ 7, lemme 1 de la note)')

    echange = demi = 0
    for (f, k, n), a in g.items():
        b = g[(f, k, 63 - n)]
        perm = {}
        bien = True
        for x, y in zip(a.ravel().tolist(), b.ravel().tolist()):
            bien &= perm.setdefault(x, y) == y
        echange += bien and all(perm.get(perm[x]) == x for x in perm) and sum(x != y for x, y in perm.items()) == 2
        demi += np.array_equal(np.roll(np.roll(a, 6, 0), 6, 1), b)
    ok(echange == 512, f'complément = deux teintes échangées (permutation involutive, deux teintes changées) : {echange} / 512')
    ok(demi == 512, f'complément = décalé de (6, 6) SEUL (ni (0, 6) ni (6, 0)) : {demi} / 512')
    autres = sum(any(np.array_equal(np.roll(np.roll(a, dr, 0), dc, 1), g[(f, k, 63 - n)]) for dr, dc in ((0, 6), (6, 0))) for (f, k, n), a in g.items())
    ok(autres == 0, f'aucun complément n’est obtenu par (0, 6) ou (6, 0) : {autres}')
    ok(len({min(g[(f, k, n)].tobytes(), g[(f, k, 63 - n)].tobytes()) for (f, k, n) in g}) == 256 and len({min(n, 63 - n) for n in range(64)}) == 32, '256 paires {n, 63 − n}')

    # la galerie tricolore : les mêmes grilles, cellule par cellule
    fiches = json.load(open(os.path.join(DATA, 'patterns-unifies-fiches.json'), encoding='utf-8'))
    fe = json.load(open(os.path.join(DATA, 'fonds_ecran_v1.json'), encoding='utf-8'))
    Lfe = fe['layerOf']
    premiere = {}
    for cle, pid in fiches['galerie'].items():
        premiere.setdefault(pid, cle)
    memes = 0
    for (f, k, n), a in g.items():
        pid = f"{NOM_FICHES[f]}-{'YANG' if k == 0 else 'YIN'}-{n:02d}"
        fam, sa, n_site = premiere[pid].split('|')
        n_site = int(n_site)
        sb = {'yang': 'yang_mut', 'yin': 'yin_mut'}[sa]
        A, B = np.array(fe['families'][fam][sa]), np.array(fe['families'][fam][sb])
        s = np.array([[(A if (n_site >> (Lfe[r][c] - 1)) & 1 else B)[r][c] for c in range(12)] for r in range(12)])
        memes += np.array_equal(s, a)
    ok(memes == 512, f'les 512 grilles du jeu sont celles de la galerie tricolore, cellule par cellule : {memes} / 512')

    if not ESSAI:
        if echecs:
            for e in echecs:
                print('ÉCHEC', e, file=sys.stderr)
            sys.exit(1)
        print(f'OK    jeu unifié : {ctrl} contrôles — 96 plaques • 4 familles • 512 grilles distinctes • 256 paires ; complément = deux teintes échangées et décalage (6, 6) seul sur 512 / 512 ; mapping des plaques ; familles jumelles ; galerie {memes} / 512.')
        return
    vus = 0
    faux = json.loads(json.dumps(data))
    faux['plaques'][0]['violet_positions'], faux['plaques'][0]['magenta_positions'] = faux['plaques'][0]['magenta_positions'], faux['plaques'][0]['violet_positions']
    if faux != manifest(src):
        vus += 1
    a = g[('YANG', 0, 5)]
    if not np.array_equal(np.roll(a, 6, 1), g[('YANG', 0, 58)]):  # un décalage (0, 6) n'est pas le complément
        vus += 1
    b = g[('YANG', 0, 58)].copy()
    b[0, 0] = 'V' if b[0, 0] != 'V' else 'M'
    if not np.array_equal(np.roll(np.roll(a, 6, 0), 6, 1), b):  # une case faussée casse le décalage
        vus += 1
    if vus != 3:
        print(f'ÉCHEC --essai : {vus} falsification(s) vue(s) sur 3', file=sys.stderr)
        sys.exit(1)
    print('OK    --essai : une plaque faussée, un décalage (0, 6) et une case faussée dans le complément sont refusés (3 sur 3).')


main()
