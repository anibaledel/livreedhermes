#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
check_fiches_unifies.py — les fiches des patterns unifiés (data/patterns-unifies-fiches.json, prompt 250) relues sur le référent 360, sans le prototype 249 ni scipy.

  - le fichier est celui que tools/fiches_unifies.py écrit depuis le référent (jamais retouché à la main) ;
  - 512 patterns, 128 formes de 4 patterns : { n, 63 − n } × { couple YANG, couple YIN }, dans une même famille ; forme = 1 + code7 ; code9 = [phase | yin | couple | n] lu sur les champs ;
  - DÉCODAGE INVERSE 512 / 512 : à partir de la grille seule (aucune information de génération) — la teinte fixe (indicatrice invariante par le décalage de six cases) donne le couple (orange = YANG,
    magenta = YIN) ; pour chaque niveau, les 16 cases mobiles valent la couche A (bit 1) ou B (bit 0) de la famille ; la famille représentante est celle SANS YIN-MUT ; les familles jumelles
    (F et F ∪ {YIN-MUT}) donnent la même grille avec n ⊕ 56 (384 cas) ou n ⊕ 7 (128 cas) ;
  - complément = même forme (même orbite sous D4 × σ × S3 et même numéro de forme) : 512 / 512 ; distance de deux grilles d'une famille = 16 × distance de Hamming ; loi de parité spectrale 512 / 512 ;
  - test NÉGATIF : inversion, échange des trigrammes et hexagramme nucléaire ne donnent la même forme QUE là où ils coïncident avec le complément : aucune relation indépendante n'est annoncée ;
  - le complément « deux teintes échangées » : exact pour les couples (fixe, mut) de ces patterns (permutation globale involutive : 512 / 512), et seulement pour eux (prompt 251).
Usage : python3 tools/check_fiches_unifies.py [--essai]
"""
import json
import os
import sys
from collections import Counter

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import fiches_unifies as fu  # noqa: E402

N = 12
ESSAI = '--essai' in sys.argv
echecs = []
controles = 0


def ok(cond, msg):
    global controles
    controles += 1
    if not cond:
        echecs.append(msg)


def canon(g):
    return min(e.tobytes() for e in fu.elements_orbite(g))


def main():
    L, FAM, _ = fu.note.charger()
    Lm = np.array(L)
    doc = fu.construire()
    attendu = fu.serialiser(doc)
    chemin = fu.SORTIE
    ok(os.path.exists(chemin) and open(chemin, encoding='utf-8').read() == attendu, 'data/patterns-unifies-fiches.json est celui que le référent donne (python3 tools/fiches_unifies.py)')
    fiches = json.load(open(chemin, encoding='utf-8')) if os.path.exists(chemin) else doc
    P = fiches['patterns']
    ok(len(P) == 512 and len({p['id'] for p in P}) == 512, '512 patterns, identifiants distincts')
    ok(len(fiches['formes']) == 128 and all(len(f['patterns']) == 4 for f in fiches['formes']), '128 formes de 4 patterns')
    par_id = {p['id']: p for p in P}
    forme_ok = True
    for f in fiches['formes']:
        ps = [par_id[i] for i in f['patterns']]
        forme_ok &= len({p['famille'] for p in ps}) == 1 and {p['couple'] for p in ps} == {'YANG', 'YIN'} and {p['n'] for p in ps} == {ps[0]['n'], 63 - ps[0]['n']}
        forme_ok &= all(p['forme'] == f['forme'] and p['code7'] == f['code7'] for p in ps) and f['forme'] == 1 + int(f['code7'], 2)
    ok(forme_ok, 'chaque forme = { n, 63 − n } × { couple YANG, couple YIN } dans une famille ; forme = 1 + code7')
    ok(all(p['code9'] == p['code7'][:2] + ('0' if p['couple'] == 'YANG' else '1') + format(p['n'], '06b') and p['complement']['n'] == 63 - p['n'] and p['lignes_bas_haut'] == fu.lignes(p['n']) for p in P),
       'code9 = [phase | yin | couple | n] ; complément 63 − n ; lignes de bas en haut')
    ok(all(p['teinte_fixe'] == ('O' if p['couple'] == 'YANG' else 'M') and p['king_wen'] > 0 for p in P), 'teinte fixe orange (YANG) ou magenta (YIN) ; numéro King Wen avec n')

    g_ = fiches['galerie']
    ok(len(g_) == 1024 and len(set(g_.values())) == 512 and set(Counter(g_.values()).values()) == {2} and set(g_.values()) <= set(par_id),
       'galerie : les 1 024 constructions de la galerie et des fonds d\'écran désignent chacune un des 512 patterns, deux par pattern (familles jumelles)')
    # les grilles, relues du référent (sans passer par la fiche)
    REP = {nom: cle for cle, nom, _, _ in fu.REPS}
    grilles = {}
    for p in P:
        a, b = ('YANG', 'YANG-MUT') if p['couple'] == 'YANG' else ('YIN', 'YIN-MUT')
        grilles[p['id']] = fu.phi(p['n'], FAM[REP[p['famille']]][a], FAM[REP[p['famille']]][b], L)

    # décodage inverse : la grille seule
    def decoder(g):
        fixes = [c for c in 'VMO' if np.array_equal(fu.shift(g == c), g == c)]
        sols = []
        for cle in FAM:
            for a, b, cn in (('YANG', 'YANG-MUT', 'YANG'), ('YIN', 'YIN-MUT', 'YIN')):
                A, B = np.array(FAM[cle][a]), np.array(FAM[cle][b])
                n, bon = 0, True
                for lev in range(1, 7):
                    m = Lm == lev
                    if np.array_equal(g[m], A[m]):
                        n |= 1 << (lev - 1)
                    elif not np.array_equal(g[m], B[m]):
                        bon = False
                        break
                if bon:
                    sols.append((cle, cn, n))
        return fixes, sols

    decodes = 0
    jumeaux = Counter()
    FAMILLES_REP = {cle: nom for cle, nom, _, _ in fu.REPS}
    JUMELLE = {'{YANG}': 'PAR2-YANG-YIN-MUT', '{YANG-MUT}': 'PAR2-YIN-MUT-YANG-MUT', 'PAR2-YIN-YANG': 'PAR3-SANS-YANG-MUT', 'PAR2-YIN-YANG-MUT': 'PAR3-SANS-YANG'}
    for p in P:
        g = grilles[p['id']]
        fixes, sols = decoder(g)
        reps = [s for s in sols if s[0] in FAMILLES_REP]
        couple = 'YANG' if fixes == ['O'] else 'YIN' if fixes == ['M'] else None
        bon = len(reps) == 1 and reps[0][1] == p['couple'] == couple and reps[0][2] == p['n'] and FAMILLES_REP[reps[0][0]] == p['famille']
        decodes += bon
        cle = REP[p['famille']]
        tw = [s for s in sols if s[0] == JUMELLE[cle]]
        if len(tw) == 1:
            jumeaux[tw[0][2] ^ p['n']] += 1
    ok(decodes == 512, f'décodage inverse (grille seule) : {decodes} / 512')
    ok(dict(jumeaux) == {56: 384, 7: 128}, f'familles jumelles : même grille avec n ⊕ 56 (384) ou n ⊕ 7 (128) : {dict(jumeaux)}')

    # complément = même forme ; deux teintes échangées (fixe, mut) ; distance = 16 × Hamming ; parité
    canons = {i: canon(g) for i, g in grilles.items()}
    memes = sum(canons[p['id']] == canons[f"{p['famille']}-{p['couple']}-{63 - p['n']:02d}"] and par_id[f"{p['famille']}-{p['couple']}-{63 - p['n']:02d}"]['forme'] == p['forme'] for p in P)
    ok(memes == 512, f'complément = même forme : {memes} / 512')
    echanges = 0
    for p in P:
        g, gb = grilles[p['id']], grilles[f"{p['famille']}-{p['couple']}-{63 - p['n']:02d}"]
        m = {}
        bon = True
        for x, y in zip(g.ravel().tolist(), gb.ravel().tolist()):
            bon &= m.setdefault(x, y) == y
        echanges += bon and all(m.get(m[x]) == x for x in m)
    ok(echanges == 512, f'complément = les mêmes cases à deux teintes échangées (permutation involutive) : {echanges} / 512')
    dist = True
    for nom in {p['famille'] for p in P}:
        for c in ('YANG', 'YIN'):
            gs = [grilles[f'{nom}-{c}-{n:02d}'] for n in range(64)]
            dist &= all(int((gs[n] != gs[m]).sum()) == 16 * bin(n ^ m).count('1') for n in range(64) for m in range(64))
    ok(dist, 'distance de deux grilles d\'une famille = 16 × distance de Hamming des hexagrammes (8 jeux)')
    parite = 0
    for g in grilles.values():
        S = fu.spectre(g)
        fixes = [c for c in 'VMO' if np.array_equal(fu.shift(g == c), g == c)]
        o = fixes[0]
        u, v = [c for c in 'VMO' if c != o]
        somme, diff = S[u] + S[v], S[u] - S[v]
        parite += all((abs(S[o][a, b]) < 1e-9 and abs(somme[a, b]) < 1e-9) if (a + b) % 2 else abs(diff[a, b]) < 1e-9 for a in range(N) for b in range(N))
    ok(parite == 512, f'loi de parité spectrale : {parite} / 512')

    # test négatif : aucune relation du Yi Jing autre que le complément
    ligne = lambda n, i: (n >> (i - 1)) & 1
    rel = {
        'inversion': lambda n: int(format(n, '06b')[::-1], 2),
        'échange des trigrammes': lambda n: ((n & 7) << 3) | (n >> 3),
        'nucléaire': lambda n: sum(v << i for i, v in enumerate([ligne(n, 2), ligne(n, 3), ligne(n, 4), ligne(n, 3), ligne(n, 4), ligne(n, 5)])),
    }
    independantes = {}
    for nom, fn in rel.items():
        indep = 0
        for p in P:
            m = fn(p['n'])
            if m != p['n'] and m != 63 - p['n'] and canons[f"{p['famille']}-{p['couple']}-{m:02d}"] == canons[p['id']]:
                indep += 1
        independantes[nom] = indep
    ok(all(v == 0 for v in independantes.values()), f'aucune relation du Yi Jing autre que le complément : formes égales hors complément {independantes}')

    if not ESSAI:
        if echecs:
            for e in echecs:
                print('ÉCHEC', e, file=sys.stderr)
            sys.exit(1)
        print(f'OK    fiches des patterns unifiés : {controles} contrôles — 512 patterns, 128 formes de 4, décodage inverse {decodes} / 512, complément = même forme {memes} / 512 (deux teintes échangées {echanges} / 512), '
              f'distance = 16 × Hamming, parité spectrale {parite} / 512, aucune relation du Yi Jing hors complément.')
        return
    # --essai : trois falsifications doivent être vues
    vus = 0
    faux = fu.construire()
    faux['patterns'][0]['n'] ^= 1
    if fu.serialiser(faux) != attendu:
        vus += 1
    g = grilles[P[0]['id']].copy()
    g[0, 0] = 'V' if g[0, 0] != 'V' else 'M'
    if len([s for s in decoder(g)[1] if s[0] in FAMILLES_REP]) != 1 or decoder(g)[1] != decoder(grilles[P[0]['id']])[1]:
        vus += 1
    if any(canon(grilles[p['id']]) != canon(grilles[f"{p['famille']}-{p['couple']}-{62 - p['n'] if p['n'] < 62 else 0:02d}"]) for p in P[:8]):
        vus += 1
    if vus != 3:
        print(f'ÉCHEC --essai : {vus} falsification(s) vue(s) sur 3', file=sys.stderr)
        sys.exit(1)
    print('OK    --essai : un n faussé dans la fiche, une case faussée dans la grille et un faux complément sont refusés (3 sur 3).')


main()
