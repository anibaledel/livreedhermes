#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# exhaustif6.py — les 18 432 graines contre les 256 motifs, sans exception.
#
# CE QUE CE SCRIPT RÉPARE. `enum6.py` définissait « pavable » comme « pavable
# par l'alternance de parité », puis n'essayait les 256 motifs que sur les
# graines ainsi retenues. Les 10 240 autres n'étaient donc jamais passées sur
# les 256 motifs : rien n'excluait qu'une graine pave par un motif exotique sans
# paver par l'alternance. Ce script teste les 18 432 × 256 = 4 718 592 couples.
#
# COMMENT, SANS DÉPENDANCE ET SANS Y PASSER L'HEURE. On ne reconstruit pas les
# 4,7 millions de grilles d'ordre 12. Pour chaque position de bloc (i, j) et
# chaque orientation o, on précalcule une fois :
#
#   — les six contributions aux sommes de lignes 6i…6i+5 ;
#   — les six contributions aux sommes de colonnes 6j…6j+5 ;
#   — la contribution aux deux diagonales ;
#   — l'ensemble des 36 valeurs occupées.
#
# Un motif est alors magique si, pour chaque ligne et chaque colonne, la somme
# des deux contributions vaut la constante, si les deux diagonales y valent, et
# si les quatre ensembles de valeurs sont disjoints — leur réunion fait alors
# 144 valeurs distinctes dans 1…144, donc toutes.
#
# Usage : cd <racine du dépôt> && python tools/exhaustif6.py

import json, os, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

ORIENT = ('C', 'H', 'V', 'D')


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def oriente(g, o):
    if o == 'C':
        return [list(l) for l in g]
    if o == 'H':
        return [list(l)[::-1] for l in g]
    if o == 'V':
        return [list(l) for l in g][::-1]
    return [list(l)[::-1] for l in g][::-1]


def profil(g, i, j, o, N=12, t=6):
    """Contributions du bloc (i, j) orienté o, dans la grille d'ordre N."""
    b = oriente(g, o)
    lignes = [0] * t
    colonnes = [0] * t
    d1 = d2 = 0
    vals = []
    for r in range(t):
        for c in range(t):
            R, C = i * t + r, j * t + c
            v = valeur(b[r][c], R, C, N)
            lignes[r] += v
            colonnes[c] += v
            vals.append(v)
            if R == C:
                d1 += v
            if R + C == N - 1:
                d2 += v
    return lignes, colonnes, d1, d2, frozenset(vals)


def main():
    t0 = time.time()
    cache = os.path.join(ICI, 'pavables6.json')
    if not os.path.exists(cache):
        print('pavables6.json manquant : lancer d’abord tools/enum6.py',
              file=sys.stderr)
        sys.exit(2)
    d = json.load(open(cache))
    tous = d['tous']
    pav_alterne = set(map(tuple, d['pavables']))
    N, t = 12, 6
    M = N * (N * N + 1) // 2
    cases = [(i, j) for i in range(2) for j in range(2)]
    motifs = [(a, b, c, e) for a in ORIENT for b in ORIENT
              for c in ORIENT for e in ORIENT]
    print(f'{len(tous)} graines × {len(motifs)} motifs = '
          f'{len(tous) * len(motifs)} couples', flush=True)

    comptes = {}
    for idx, g in enumerate(tous):
        pr = {(i, j, o): profil(g, i, j, o, N, t)
              for (i, j) in cases for o in ORIENT}
        bons = 0
        for mo in motifs:
            p = [pr[(cases[k][0], cases[k][1], mo[k])] for k in range(4)]
            # lignes : bloc (0,0)+(0,1) pour les lignes 0..5, (1,0)+(1,1) ensuite
            if any(p[0][0][r] + p[1][0][r] != M for r in range(t)):
                continue
            if any(p[2][0][r] + p[3][0][r] != M for r in range(t)):
                continue
            if any(p[0][1][c] + p[2][1][c] != M for c in range(t)):
                continue
            if any(p[1][1][c] + p[3][1][c] != M for c in range(t)):
                continue
            if sum(q[2] for q in p) != M or sum(q[3] for q in p) != M:
                continue
            u = p[0][4] | p[1][4] | p[2][4] | p[3][4]
            if len(u) != N * N:
                continue
            bons += 1
        comptes[bons] = comptes.get(bons, 0) + 1
        if (idx + 1) % 2000 == 0:
            print(f'  {idx + 1}/{len(tous)}   [{time.time() - t0:.0f} s]',
                  flush=True)

    print(f'\nmotifs magiques par graine : {dict(sorted(comptes.items()))}')
    attendu = {0: 10240, 16: 8192}
    print(f'attendu                     : {attendu}')
    if comptes != attendu:
        print('ÉCART avec le résultat publié', file=sys.stderr)
        sys.exit(1)
    # et l'ensemble des graines à 16 motifs est-il celui de l'alternance ?
    seize = set()
    print('\ncontrôle : les 8 192 graines à seize motifs sont-elles exactement '
          'celles que l’alternance de parité fait paver ?', flush=True)
    for g in tous:
        pr = {(i, j, o): profil(g, i, j, o, N, t)
              for (i, j) in cases for o in ORIENT}
        mo = ('C', 'H', 'V', 'D')   # l'alternance : (0,0)=C, (0,1)=H, (1,0)=V, (1,1)=D
        p = [pr[(cases[k][0], cases[k][1], mo[k])] for k in range(4)]
        ok = (all(p[0][0][r] + p[1][0][r] == M for r in range(t))
              and all(p[2][0][r] + p[3][0][r] == M for r in range(t))
              and all(p[0][1][c] + p[2][1][c] == M for c in range(t))
              and all(p[1][1][c] + p[3][1][c] == M for c in range(t))
              and sum(q[2] for q in p) == M and sum(q[3] for q in p) == M
              and len(p[0][4] | p[1][4] | p[2][4] | p[3][4]) == N * N)
        if ok:
            seize.add(tuple(g))
    print(f'  alternance : {len(seize)} graines ; cache enum6 : '
          f'{len(pav_alterne)} ; identiques : {seize == pav_alterne}')
    if seize != pav_alterne:
        sys.exit(1)
    print(f'\naucune graine ne pave par un motif exotique sans paver par '
          f'l’alternance.   [{time.time() - t0:.0f} s]')


if __name__ == '__main__':
    main()
