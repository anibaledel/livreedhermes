#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_echelle.py — les énoncés chiffrés de l'article que les autres scripts
# ne couvraient pas : les six classes d'invariance de la page 059, les
# huit transversales, les quatre rosaces et leurs orbites, la connexité inégale
# des deux jonctions, et les décalages (6, 0) et (0, 6) pris séparément.
#
# Pour les croix ansées de la page 040, voir tools/croix_ansee.py : elles sont
# un autre objet, et il n'y en a que deux.
#
# 1. LES SIX CLASSES D'INVARIANCE (page 059). Dans la superposition inspir +
#    expir, une case rouge ou bleue se classe par la façon dont sa couleur varie
#    d'une colonne du damier à l'autre. Il y a SIX comportements, soit six
#    classes de seize cases, et ce sont trois paires complémentaires, une par
#    trait du trigramme inférieur :
#
#        RRRRBBBB / BBBBRRRR   le trait du haut
#        RRBBRRBB / BBRRBBRR   le trait du milieu
#        RBRBRBRB / BRBRBRBR   le trait du bas
#
#    Chaque classe pose exactement quatre cases dans chacun des quatre
#    quadrants de 6 × 6.
#
# 2. LES HUIT ÉLÉMENTS SONT DES TRANSVERSALES. Les huit éléments relevés sur la
#    page 052 — INHALE k et EXHALE k, six cases chacun, dans
#    data/elements-052.json — prennent exactement une case dans chacune des six
#    classes. Et EXHALE k est le demi-tour d'INHALE k, pour les quatre k.
#
#    Ces huit formes sont une donnée de la planche, non une conséquence du
#    corpus : aucune forme rouge ou bleue des 256 carrés n'est une transversale
#    des six classes. Le script le vérifie dans les deux sens, pour qu'on ne
#    puisse pas confondre les deux objets.
#
# 3. LES QUATRE ROSACES. Une rosace est la réunion INHALE k ∪ EXHALE k : douze
#    cases d'un 6 × 6, deux par ligne et deux par colonne, aucune sur une
#    diagonale, à symétrie centrale. Il y en a quatre dans le livre ; fermées
#    sous les huit symétries du carré elles donnent HUIT figures en QUATRE
#    orbites de deux, et leur support est exactement les vingt-quatre cases
#    hors diagonales, chacune couverte deux fois par les quatre rosaces.
#
#    ROSACE N'EST PAS CROIX ANSÉE, et ce script n'emploie pas le second mot.
#    La croix ansée de la page 040 est un APPARIEMENT des vingt-quatre cases
#    hors diagonales par des traits horizontaux et verticaux, soumis aux trois
#    contraintes de la planche, et il n'y en a QUE DEUX. C'est tools/croix_ansee.py
#    qui l'établit, et c'est lui qui fait foi sur ce point. Confondre les deux
#    objets — douze cases d'un côté, douze traits sur vingt-quatre cases de
#    l'autre — est l'erreur que ce commentaire est là pour empêcher.
#
# 4. LA CONNEXITÉ LIT LES JONCTIONS, MAIS INÉGALEMENT. Les formes bicolores de
#    colonne, rangées par couple de jonctions, ne donnent pas le même nombre
#    d'adjacences ni de composantes connexes. C'est la question ouverte de la
#    section « Ce qui manque » : le poids des deux jonctions est inégal, et
#    la direction privilégiée n'a pas d'explication.
#
# 5. SEUL LE DÉCALAGE DIAGONAL DONNE LA CONSTANTE. La forme bleue de la
#    superposition est constante sur chaque colonne du damier pour le décalage
#    (6, 6), et pour lui seul : les décalages (6, 0) et (0, 6) pris séparément
#    ne donnent de constante ni par colonne ni par ligne. La forme se lit sur
#    le 12 × 12 entier ; la replier sur 6 × 6 efface la distinction.
#
# 6. À QUOI SERT UNE ROSACE : À LIRE LE TRIGRAMME, DEUX FOIS. Une demi-rosace
#    prend une case dans chacune des six classes, donc un témoin de chaque
#    façon de varier. Lire ses six cases sur une ligne du damier distingue les
#    huit colonnes — 8 éléments × 8 lignes, 64 fois sur 64. Et TROIS cases
#    suffisent, une par trait : les six sont trois traits lus deux fois, une
#    fois par chaque membre de la paire complémentaire. C'est une lecture
#    redondante, non une lecture longue, et c'est ce qui donne sa raison d'être
#    au découpage en inspir et expir : un élément lit déjà le trigramme, la
#    rosace l'apparie à son demi-tour pour que les deux respirations soient ses
#    deux moitiés.
#
# Usage : cd <racine du dépôt> && python tools/verify_echelle.py

import json, os, sys, collections, itertools

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT = os.path.join(RACINE, 'data', 'referent_256_v3.json')
ELEMENTS = os.path.join(RACINE, 'data', 'elements-052.json')
TRAIT = {'RRRRBBBB': 'haut', 'BBBBRRRR': 'haut',
         'RRBBRRBB': 'milieu', 'BBRRBBRR': 'milieu',
         'RBRBRBRB': 'bas', 'BRBRBRBR': 'bas'}
echecs = []


def carre(f):
    g = [[None] * 6 for _ in range(6)]
    for c in ('rouge', 'bleu', 'vert', 'jaune'):
        for r, cc in f[c + '_positions']:
            g[r][cc] = c
    return g


def assemblage(G, R, C):
    g = [[None] * 12 for _ in range(12)]
    for dr in range(2):
        for dc in range(2):
            p = G[(2 * R + dr, 2 * C + dc)]
            for r in range(6):
                for c in range(6):
                    g[6 * dr + r][6 * dc + c] = p[r][c]
    return g


def figure(g, dr=6, dc=6):
    """La superposition inspir + expir : rouge, bleu, ou rien."""
    def t(i, j):
        a, b = g[i][j], g[(i + dr) % 12][(j + dc) % 12]
        return 'R' if 'rouge' in (a, b) else 'B' if 'bleu' in (a, b) else '.'
    return {(i, j): t(i, j) for i in range(12) for j in range(12)}


def classes(FC):
    """Les cases bicolores, groupées par leur comportement sur les 8 colonnes."""
    s = collections.defaultdict(set)
    for i in range(12):
        for j in range(12):
            k = ''.join(FC[C][(i, j)] for C in range(8))
            if set(k) != {'.'}:
                s[k].add((i, j))
    return dict(s)


def adjacences(s):
    return sum(1 for (i, j) in s for (di, dj) in ((0, 1), (1, 0))
               if ((i + di) % 6, (j + dj) % 6) in s)


def composantes(s):
    vus, n = set(), 0
    for p in s:
        if p in vus:
            continue
        n += 1
        pile = [p]
        while pile:
            q = pile.pop()
            if q in vus:
                continue
            vus.add(q)
            for di, dj in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                r = ((q[0] + di) % 6, (q[1] + dj) % 6)
                if r in s and r not in vus:
                    pile.append(r)
    return n


def jonctions(t):
    b = [(t >> 2) & 1, (t >> 1) & 1, t & 1]
    return int(b[0] != b[1]), int(b[1] != b[2])


def symetries(s):
    """Les images de s sous les huit symétries du carré."""
    return {frozenset(f(a, b) for a, b in s) for f in (
        lambda i, j: (i, j), lambda i, j: (i, 5 - j),
        lambda i, j: (5 - i, j), lambda i, j: (5 - i, 5 - j),
        lambda i, j: (j, i), lambda i, j: (j, 5 - i),
        lambda i, j: (5 - j, i), lambda i, j: (5 - j, 5 - i))}


def orbites(ens):
    reste, out = set(ens), []
    while reste:
        o = symetries(next(iter(reste))) & reste
        out.append(o)
        reste -= o
    return out


def main():
    doc = json.load(open(REFERENT, encoding='utf-8'))
    G = {(f['row'], f['col']): carre(f) for f in doc['forms']}
    FC = {C: figure(assemblage(G, 0, C)) for C in range(8)}

    # 1. les six classes
    CL = classes(FC)
    quadrants = {k: sorted(collections.Counter((i // 6, j // 6) for i, j in v).values())
                 for k, v in CL.items()}
    paires = sum(1 for k in CL if k.translate(str.maketrans('RB', 'BR')) in CL)
    traits = collections.Counter(TRAIT.get(k, '?') for k in CL)
    print(f'1. classes d’invariance : {len(CL)}, de '
          f'{sorted({len(v) for v in CL.values()})} cases ; '
          f'complémentaires deux à deux : {paires}/{len(CL)}')
    print(f'   un trait par paire : {dict(sorted(traits.items()))} ; '
          f'cases par quadrant de 6 × 6 : {sorted({tuple(v) for v in quadrants.values()})}')
    if (len(CL) != 6 or {len(v) for v in CL.values()} != {16} or paires != 6
            or dict(traits) != {'haut': 2, 'milieu': 2, 'bas': 2}
            or {tuple(v) for v in quadrants.values()} != {(4, 4, 4, 4)}):
        echecs.append('les six classes d’invariance ne sont pas celles annoncées')

    # 2. les huit éléments de la page 052 sont des transversales
    def transversale(s, cl):
        return len(s) == 6 and all(len(s & v) == 1 for v in cl.values())

    quadrant = {k: frozenset((i, j) for i, j in v if i < 6 and j < 6)
                for k, v in CL.items()}
    el = {k: frozenset(tuple(p) for p in v) for k, v in
          json.load(open(ELEMENTS, encoding='utf-8'))['elements'].items()}
    tr = sum(1 for v in el.values() if transversale(v, quadrant))
    demi_tour = sum(1 for k in range(1, 5)
                    if el[f'EXHALE-{k}'] == frozenset((5 - i, 5 - j)
                                                      for i, j in el[f'INHALE-{k}']))
    corpus = sum(1 for f in doc['forms'] for c in ('rouge', 'bleu')
                 if transversale(frozenset(tuple(p) for p in f[c + '_positions']),
                                 quadrant))
    print(f'2. éléments de la page 052 transversaux des six classes : {tr}/8 ; '
          f'EXHALE k = demi-tour d’INHALE k : {demi_tour}/4')
    print(f'   formes rouges ou bleues du corpus qui sont transversales : '
          f'{corpus}/512 — les éléments sont une donnée de la planche, pas du corpus')
    if tr != 8 or demi_tour != 4 or corpus != 0:
        echecs.append('les huit éléments ne sont pas les transversales annoncées')

    # 3. les quatre rosaces
    croix = {k: el[f'INHALE-{k}'] | el[f'EXHALE-{k}'] for k in range(1, 5)}
    cloture = set()
    for v in croix.values():
        cloture |= symetries(v)
    orb = orbites(cloture)
    support = {p for s in cloture for p in s}
    hors_diag = {(i, j) for i in range(6) for j in range(6)
                 if i != j and i + j != 5}
    couverture = collections.Counter(p for v in croix.values() for p in v)
    positions = all(len(v) == 12
                    and all(sum(1 for i, j in v if i == r) == 2 for r in range(6))
                    and all(sum(1 for i, j in v if j == c) == 2 for c in range(6))
                    and not (v & (set(range(6)) and {(i, j) for i in range(6)
                                                     for j in range(6)
                                                     if i == j or i + j == 5}))
                    and v == frozenset((5 - i, 5 - j) for i, j in v)
                    for v in croix.values())
    print(f'3. rosaces : {len(croix)} ; douze cases, deux par ligne et par '
          f'colonne, hors diagonales, à symétrie centrale : {positions}')
    print(f'   (la croix ansée de la page 040 est un autre objet, et il n’y en '
          f'a que deux : voir tools/croix_ansee.py)')
    print(f'   fermées sous les huit symétries du carré : {len(cloture)} figures, '
          f'en {len(orb)} orbites de {sorted({len(o) for o in orb})}')
    print(f'   support = les 24 cases hors diagonales : {support == hors_diag} ; '
          f'couverture par les quatre rosaces : {sorted(set(couverture.values()))} '
          f'sur {len(couverture)} cases')
    if (not positions or len(cloture) != 8 or len(orb) != 4
            or {len(o) for o in orb} != {2} or support != hors_diag
            or set(couverture.values()) != {2} or len(couverture) != 24):
        echecs.append('les rosaces ne sont pas quatre, en huit figures et quatre orbites')

    # 4. la connexité, par couple de jonctions
    print('4. connexité des formes de colonne, par couple de jonctions '
          '(rouge et bleu réunis)')
    compte = collections.defaultdict(lambda: [0, 0])
    for C in range(8):
        for teinte in 'RB':
            s = frozenset((i % 6, j % 6) for (i, j), v in FC[C].items() if v == teinte)
            k = jonctions(C)
            compte[k][0] += adjacences(s)
            compte[k][1] += composantes(s)
    for (d1, d2) in sorted(compte):
        a, n = compte[(d1, d2)]
        nom = {(0, 0): 'aucune', (1, 0): 'tête-cœur seule',
               (0, 1): 'cœur-ventre seule', (1, 1): 'les deux'}[(d1, d2)]
        print(f'   d₁={d1} d₂={d2}  {nom:<18s} {a:3d} adjacences, {n:2d} composantes')
    attendu = {(0, 0): [32, 20], (0, 1): [48, 12], (1, 0): [64, 4], (1, 1): [48, 12]}
    if {k: list(v) for k, v in compte.items()} != attendu:
        echecs.append('les décomptes de connexité ne sont pas ceux de l’article')

    # 5. seul le décalage diagonal donne la constante
    print('5. formes de colonne selon le décalage')
    for dr, dc in ((6, 6), (6, 0), (0, 6)):
        par_col = collections.defaultdict(set)
        par_lig = collections.defaultdict(set)
        for R in range(8):
            for C in range(8):
                F = figure(assemblage(G, R, C), dr, dc)
                s = frozenset(p for p, v in F.items() if v == 'B')
                par_col[C].add(s)
                par_lig[R].add(s)
        cst_c = all(len(v) == 1 for v in par_col.values())
        cst_l = all(len(v) == 1 for v in par_lig.values())
        print(f'   décalage ({dr}, {dc}) : constante par colonne {cst_c}, '
              f'par ligne {cst_l}')
        if (dr, dc) == (6, 6) and not cst_c:
            echecs.append('le décalage diagonal ne donne pas la constante de colonne')
        if (dr, dc) != (6, 6) and (cst_c or cst_l):
            echecs.append(f'le décalage ({dr}, {dc}) donne une constante inattendue')

    # 6. la rosace lit le trigramme
    lus = 0
    for R in range(8):
        FR = {C: figure(assemblage(G, R, C)) for C in range(8)}
        for v in el.values():
            lectures = {tuple(FR[C][p] for p in sorted(v)) for C in range(8)}
            lus += (len(lectures) == 8)
    minimal = {}
    for nom, v in el.items():
        for k in range(1, 7):
            bons = [c for c in itertools.combinations(sorted(v), k)
                    if len({tuple(FC[C][p] for p in c) for C in range(8)}) == 8]
            if bons:
                minimal[nom] = (k, len(bons))
                break
    tailles = {k for k, _ in minimal.values()}
    print(f'6. un élément lu sur ses six cases distingue les huit colonnes : '
          f'{lus}/64 (8 éléments × 8 lignes du damier)')
    print(f'   cases nécessaires et suffisantes : {sorted(tailles)}, '
          f'{sorted({n for _, n in minimal.values()})} triplets par élément — '
          f'six cases = trois traits lus deux fois')
    if lus != 64 or tailles != {3}:
        echecs.append('la rosace ne lit pas le trigramme comme annoncé')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nSix classes, huit transversales, quatre rosaces : l’échelle se referme.')


if __name__ == '__main__':
    main()
