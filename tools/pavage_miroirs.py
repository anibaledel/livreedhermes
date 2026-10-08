#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# pavage_miroirs.py — la méthode : un carré d'ordre 6 pavé par miroirs alternés
# donne un carré magique d'ordre 6m, pour tout m.
#
# ÉNONCÉ. Soit E un étiquetage d'ordre 6 du corpus, et m ≥ 1. On pave une grille
# d'ordre 6m avec m × m copies de E, la copie du bloc (i, j) étant
#
#     E               si i et j sont pairs
#     miroir gauche-droite de E   si j est impair et i pair
#     miroir haut-bas de E        si i est impair et j pair
#     demi-tour de E              si i et j sont impairs
#
# — autrement dit : un miroir par parité, dans chaque sens. On applique ensuite
# le protocole à l'ordre n = 6m. Le résultat est un carré magique, diagonales
# comprises.
#
# VÉRIFIÉ. 256/256 aux ordres 6, 12, 18, 24 et 30 ; 12/12 sur échantillon aux
# ordres 42, 48 et 60 — les trois ordres que ce script teste, et aucun autre. Les quatre agencements de la page 031 sont le cas
# m = 2 de cette règle.
#
# LE MOTIF DE MIROIRS N'EST PAS LIBRE. À l'ordre 12, sur les 256 façons de
# choisir l'une des quatre orientations dans chacun des quatre blocs, 16
# seulement donnent un carré magique. L'alternance par parité en fait partie.
#
# L'UNITÉ DU PAVAGE N'EST PAS LE CARRÉ D'ORDRE 6 mais le bloc de 3 × 3 — les
# quatre sous-ensembles de la page 034. On pave une grille d'ordre 6m avec
# 2m × 2m blocs de 3, le bloc (I, J) prenant le sous-ensemble (I mod 2, J mod 2).
# Le résultat est magique. Sur les 256 règles d'orientation par bloc, deux
# seulement passent : tout conforme, et tout demi-tour.
#
# Le décompte de la page 034 en découle : à l'ordre 30, la grille compte
# 10 × 10 blocs de trois, et chacun des quatre sous-ensembles y paraît
# exactement vingt-cinq fois.
#
# LA RÈGLE DES MIROIRS. Les motifs valides ne sont pas un ensemble quelconque :
# codés dans (Z/2)^(2m²) par les deux bits de miroir de chaque bloc, ils forment
# un SOUS-GROUPE, le même pour les 256 graines, et une seule règle le décrit à
# tout ordre. En notant h(i, j) et v(i, j) les deux bits du bloc (i, j) :
#
#     le pavage est magique  <=>  h(i, j) = h(m−1−i, j)  et  v(i, j) = v(i, m−1−j)
#
# Le bit horizontal est invariant quand on renverse l'indice de LIGNE de blocs,
# le bit vertical quand on renverse celui de COLONNE. C'est le même renversement
# r <-> n−1−r que celui de la condition de bijection du protocole.
#
# Le décompte suit : les orbites de i <-> m−1−i sont au nombre de ceil(m/2),
# un bit libre par orbite et par colonne, autant pour v, soit
#
#     2^(2m·ceil(m/2))  motifs valides à l'ordre 6m
#
#     ordre 12 : 2⁴ = 16        sur 4⁴ = 256
#     ordre 18 : 2¹² = 4096     sur 4⁹ = 262144
#     ordre 24 : 2¹⁶ = 65536    sur 4¹⁶
#     ordre 30 : 2³⁰            sur 4²⁵
#
# Le cas où h ne dépend que de la colonne et v que de la ligne est un
# sous-groupe PROPRE dès m ≥ 3 : il ne donne que 2^(2m) motifs.
#
# TIRAGES ALÉATOIRES. Les deux échantillons de ce script fixent leur graine de
# hasard, pour que leurs chiffres se reproduisent à l'identique.
#
# Usage : cd <racine du dépôt> && python tools/pavage_miroirs.py [--jusqua M]
#         --echantillons   ajoute les deux tirages aléatoires (environ 70 s)
#         --exhaustif      énumère les 262 144 motifs de l'ordre 18 sur deux
#                          graines : la règle y devient démontrée et non
#                          échantillonnée (environ 2 minutes)


import sys, itertools, random, collections

from lldh_commun import (etiquetage, lire_referent, magique as magique_grille, protocole,
                         valeur)

echecs = []

ident = lambda e: [r[:] for r in e]
horiz = lambda e: [r[::-1] for r in e]
verti = lambda e: e[::-1]
demi = lambda e: [r[::-1] for r in e[::-1]]
OPS = {'C': ident, 'H': horiz, 'V': verti, 'D': demi}


def magique(e, n):
    """L'étiquetage e d'ordre n donne-t-il, par le protocole, un carré magique ?"""
    return magique_grille(protocole(e, n), n)[0]


def alterne(m):
    """Le motif de miroirs : un miroir par parité, dans chaque sens."""
    return [[('C', 'H', 'V', 'D')[(1 if j % 2 else 0) + (2 if i % 2 else 0)]
             for j in range(m)] for i in range(m)]


def pave(base, m, motif):
    n = 6 * m
    e = [[None] * n for _ in range(n)]
    for i in range(m):
        for j in range(m):
            b = OPS[motif[i][j]](base)
            for r in range(6):
                for c in range(6):
                    e[6 * i + r][6 * j + c] = b[r][c]
    return e


def sousblocs(e):
    """Les quatre sous-ensembles 3 × 3 de la page 034."""
    return {(a, b): [[e[3 * a + i][3 * b + j] for j in range(3)] for i in range(3)]
            for a in range(2) for b in range(2)}


def pave3(base, m, regle):
    """Ordre 6m en blocs de 3 : le bloc (I, J) prend le sous-ensemble
    (I mod 2, J mod 2), orienté par regle."""
    sb = sousblocs(base)
    n = 6 * m
    e = [[None] * n for _ in range(n)]
    for I in range(2 * m):
        for J in range(2 * m):
            b = OPS[regle[(I // 2) % 2][(J // 2) % 2]](sb[(I % 2, J % 2)])
            for i in range(3):
                for j in range(3):
                    e[3 * I + i][3 * J + j] = b[i][j]
    return e


def blocs_de_trois(bases, ech):
    """L'unité du pavage est le bloc de 3, pas le carré d'ordre 6."""
    print('\nà l’échelle du bloc de 3 (page 034)')
    bons = [[[r[0], r[1]], [r[2], r[3]]] for r in itertools.product('CHVD', repeat=4)
            if all(magique(pave3(b, 2, [[r[0], r[1]], [r[2], r[3]]]), 12)
                   for b in bases[:40])]
    noms = sorted(''.join(r[0] + r[1]) for r in bons)
    print(f'  règles d’orientation par bloc valides à l’ordre 12 : {len(bons)}/256'
          f'  ({", ".join(noms)} — tout conforme, tout demi-tour)')
    if noms != ['CCCC', 'DDDD']:
        echecs.append(f'règles d’orientation par bloc de 3 : {noms} au lieu de CCCC et DDDD')

    for regle in bons:
        nom = regle[0][0] * 4
        for m, lot, total in ((2, bases, 256), (3, bases, 256),
                              (5, ech, len(ech)), (7, ech, len(ech))):
            ok = sum(1 for b in lot if magique(pave3(b, m, regle), 6 * m))
            print(f'  {nom} — ordre {6 * m:3d} : {ok}/{total}')
            if ok != total:
                echecs.append(f'blocs de 3, règle {nom}, ordre {6 * m} : {total - ok} échecs')

    # le décompte de la page 034 : chaque sous-ensemble 25 fois à l'ordre 30
    vus = collections.Counter((I % 2, J % 2) for I in range(10) for J in range(10))
    print(f'  ordre 30, 10 × 10 blocs de trois : chaque sous-ensemble '
          f'{sorted(set(vus.values()))[0]} fois')
    if set(vus.values()) != {25}:
        echecs.append('le décompte de la page 034 ne donne pas 25 par sous-ensemble')


BITS = {'C': (0, 0), 'H': (1, 0), 'V': (0, 1), 'D': (1, 1)}


def vecteur(motif):
    """Le motif comme élément de (Z/2)^(2k)."""
    return tuple(b for o in motif for b in BITS[o])


def par_bloc(m, H, V):
    """Le motif où le miroir h ne dépend que de la colonne de blocs et le
    miroir v que de la ligne : la forme annoncée."""
    return [[('C', 'H', 'V', 'D')[H[j] + 2 * V[i]] for j in range(m)]
            for i in range(m)]


def regle(m, H, V):
    """La règle des miroirs : h invariant par i -> m-1-i, v par j -> m-1-j."""
    return all(H[i][j] == H[m - 1 - i][j] and V[i][j] == V[i][m - 1 - j]
               for i in range(m) for j in range(m))


def pave_hv(base, m, H, V):
    n = 6 * m
    e = [[None] * n for _ in range(n)]
    for i in range(m):
        for j in range(m):
            b = [r[:] for r in base]
            if H[i][j]:
                b = [r[::-1] for r in b]
            if V[i][j]:
                b = b[::-1]
            for r in range(6):
                for c in range(6):
                    e[6 * i + r][6 * j + c] = b[r][c]
    return e


def regle_des_miroirs(bases, jusqua=5, tirages=64):
    """La règle est nécessaire et suffisante, et elle donne 2^(2m·ceil(m/2))."""
    rng = random.Random(7)
    print('\nla règle des miroirs : h(i,j) = h(m−1−i, j) et v(i,j) = v(i, m−1−j)')
    for m in range(2, jusqua + 1):
        n = 6 * m
        libres = 2 * m * ((m + 1) // 2)
        orb = [(k, m - 1 - k) for k in range((m + 1) // 2)]

        ok = ech = 0
        for _ in range(min(2 ** libres, tirages)):
            H = [[0] * m for _ in range(m)]
            V = [[0] * m for _ in range(m)]
            for j in range(m):
                for a, b in orb:
                    x = rng.randint(0, 1)
                    H[a][j] = H[b][j] = x
            for i in range(m):
                for a, b in orb:
                    x = rng.randint(0, 1)
                    V[i][a] = V[i][b] = x
            ech += 1
            ok += magique(pave_hv(bases[rng.randrange(len(bases))], m, H, V), n)

        hors = mag_hors = 0
        for _ in range(200):
            H = [[rng.randint(0, 1) for _ in range(m)] for _ in range(m)]
            V = [[rng.randint(0, 1) for _ in range(m)] for _ in range(m)]
            if regle(m, H, V):
                continue
            hors += 1
            mag_hors += magique(pave_hv(bases[0], m, H, V), n)

        print(f'  ordre {n:3d} (m={m}) : 2^{libres} = {2 ** libres} motifs annoncés ; '
              f'conformes magiques {ok}/{ech} ; hors règle magiques {mag_hors}/{hors}')
        if ok != ech or mag_hors:
            echecs.append(f'la règle des miroirs tombe à l’ordre {n}')


def exhaustif_ordre18(bases, graines=2):
    """L'énumération complète à l'ordre 18 : 4096 motifs, et ce sont
    exactement ceux de la règle. La nécessité cesse d'être échantillonnée.

    On précalcule, pour chaque bloc et chaque orientation, sa contribution aux
    sommes de lignes, de colonnes et de diagonales : le test d'un motif se
    réduit alors à neuf additions vectorielles, et les 262 144 motifs passent
    en quelques dizaines de secondes. La bijection n'est vérifiée que sur les
    motifs qui franchissent les sommes.
    """
    m, n = 3, 18
    M = n * (n * n + 1) // 2
    ORI = [(0, 0), (1, 0), (0, 1), (1, 1)]
    print(f'\nénumération exhaustive à l’ordre 18 ({4 ** (m * m)} motifs, '
          f'{graines} graines)')
    ref = None
    for g in range(graines):
        base = bases[g]
        contrib = {}
        for i in range(m):
            for j in range(m):
                for h, v in ORI:
                    b = [r[:] for r in base]
                    if h:
                        b = [r[::-1] for r in b]
                    if v:
                        b = b[::-1]
                    lig = [0] * n
                    col = [0] * n
                    d1 = d2 = 0
                    for r in range(6):
                        for c in range(6):
                            R, C = 6 * i + r, 6 * j + c
                            x = valeur(b[r][c], R, C, n)
                            lig[R] += x
                            col[C] += x
                            if R == C:
                                d1 += x
                            if R + C == n - 1:
                                d2 += x
                    contrib[(i, j, h, v)] = (lig, col, d1, d2)

        bons = set()
        for mot in itertools.product(ORI, repeat=m * m):
            lig = [0] * n
            col = [0] * n
            d1 = d2 = 0
            for k, (h, v) in enumerate(mot):
                a_, b_, c1, c2 = contrib[(k // m, k % m, h, v)]
                for t in range(n):
                    lig[t] += a_[t]
                    col[t] += b_[t]
                d1 += c1
                d2 += c2
            if d1 != M or d2 != M:
                continue
            if any(x != M for x in lig) or any(x != M for x in col):
                continue
            H = [[mot[i * m + j][0] for j in range(m)] for i in range(m)]
            V = [[mot[i * m + j][1] for j in range(m)] for i in range(m)]
            if magique(pave_hv(base, m, H, V), n):
                bons.add(mot)

        par_regle = {mot for mot in bons
                     if regle(m, [[mot[i * m + j][0] for j in range(m)] for i in range(m)],
                                 [[mot[i * m + j][1] for j in range(m)] for i in range(m)])}
        memes = '' if ref is None else f', identique à la graine 0 : {bons == ref}'
        if ref is None:
            ref = bons
        print(f'  graine {g} : {len(bons)} motifs magiques, dont {len(par_regle)} '
              f'conformes à la règle{memes}')
        if len(bons) != 4096 or par_regle != bons or (g and bons != ref):
            echecs.append(f'l’énumération de l’ordre 18 contredit la règle (graine {g})')
    print('  la règle est donc nécessaire et suffisante à l’ordre 18, sans échantillon')


def sous_groupe(bases):
    """L'énumération exhaustive à l'ordre 12 : seize, un sous-groupe, et la
    règle les redonne exactement."""
    tous = list(itertools.product('CHVD', repeat=4))
    ref = None
    memes = 0
    for b in bases:
        S = frozenset(m for m in tous
                      if magique(pave(b, 2, [[m[0], m[1]], [m[2], m[3]]]), 12))
        if ref is None:
            ref = S
        memes += (S == ref)
    print(f'\nle sous-groupe des motifs valides à l’ordre 12')
    print(f'  motifs valides : {len(ref)} ; identiques sur les 256 graines : {memes}/256')
    if len(ref) != 16 or memes != 256:
        echecs.append('les motifs valides ne sont pas seize, les mêmes pour toutes les graines')

    vecs = [vecteur(m) for m in ref]
    zero = tuple([0] * 8)
    groupe = (zero in vecs and
              all(tuple((a[i] + b[i]) % 2 for i in range(8)) in vecs
                  for a in vecs for b in vecs))
    print(f'  sous-groupe de (Z/2)⁸ : {groupe}, d’ordre {len(vecs)} = 2^{len(vecs).bit_length() - 1}')
    if not groupe:
        echecs.append('les motifs valides ne forment pas un sous-groupe')

    # h0=h2, h1=h3, v0=v1, v2=v3  —  indices : h_k en 2k, v_k en 2k+1
    eq = all(v[0] == v[4] and v[2] == v[6] and v[1] == v[3] and v[5] == v[7]
             for v in vecs)
    reciproque = sum(1 for m in tous
                     if (lambda v: v[0] == v[4] and v[2] == v[6]
                         and v[1] == v[3] and v[5] == v[7])(vecteur(m)))
    print(f'  h₀=h₂, h₁=h₃, v₀=v₁, v₂=v₃ sur les seize : {eq} ; '
          f'motifs vérifiant ces équations : {reciproque}/256')
    if not eq or reciproque != 16:
        echecs.append('les quatre équations ne caractérisent pas les seize motifs')

    # et ce sont exactement les motifs que donne la règle générale
    par_regle = sum(1 for m in tous
                    if regle(2, [[BITS[m[0]][0], BITS[m[1]][0]],
                                 [BITS[m[2]][0], BITS[m[3]][0]]],
                                [[BITS[m[0]][1], BITS[m[1]][1]],
                                 [BITS[m[2]][1], BITS[m[3]][1]]]))
    print(f'  motifs donnés par la règle des miroirs : {par_regle}/256')
    if par_regle != 16:
        echecs.append('la règle des miroirs ne redonne pas les seize motifs')


def forme_annoncee(bases):
    """« h par colonne de blocs, v par ligne » : 2^(2m) motifs, tous magiques."""
    print('\nles motifs « h par colonne, v par ligne »')
    for m in (2, 3):
        n = 6 * m
        total = ok = 0
        for H in itertools.product((0, 1), repeat=m):
            for V in itertools.product((0, 1), repeat=m):
                motif = par_bloc(m, H, V)
                for b in bases:
                    total += 1
                    ok += magique(pave(b, m, motif), n)
        attendu = 4 ** m * len(bases)
        print(f'  ordre {n:3d} : {ok}/{total} (2^{2 * m} motifs × {len(bases)} graines)')
        if ok != total or total != attendu:
            echecs.append(f'la forme annoncée échoue à l’ordre {n}')


def echantillon_ordre18(bases, tirages=4000):
    """Combien de motifs QUELCONQUES sont magiques à l'ordre 18, et combien
    d'entre eux sont de la forme annoncée. Graine fixée."""
    rng = random.Random(0)
    base = bases[0]
    m = 3
    mag = conformes = 0
    for _ in range(tirages):
        motif = [[rng.choice('CHVD') for _ in range(m)] for _ in range(m)]
        if magique(pave(base, m, motif), 18):
            mag += 1
            H = [BITS[motif[0][j]][0] for j in range(m)]
            V = [BITS[motif[i][0]][1] for i in range(m)]
            conformes += (motif == par_bloc(m, H, V))
    print(f'\nordre 18, {tirages} motifs tirés au hasard (graine 0) : {mag} magiques, '
          f'dont {conformes} de la forme annoncée')
    print('  la forme est donc suffisante, non nécessaire au-delà de l’ordre 12')
    if mag <= conformes:
        echecs.append('l’échantillon ne montre plus d’autres motifs magiques à l’ordre 18')


def echantillon_graines(tirages=400000):
    """Un étiquetage conforme aux trois conditions est-il souvent magique ?
    Graine fixée. Sert à montrer que les conditions sont loin de suffire."""
    rng = random.Random(1)
    print(f'\nétiquetages tirés au hasard parmi les conformes (graine 1)')
    for n in (6, 10, 14):
        conformes = magiques = 0
        for _ in range(tirages):
            e = []
            for r in range(n):
                pos = list(range(n))
                rng.shuffle(pos)
                ligne = [None] * n
                for i, c in enumerate(pos):
                    ligne[c] = rng.choice('BV') if i < n // 2 else rng.choice('RJ')
                e.append(ligne)
            if not all(sum(1 for r in range(n) if e[r][c] in 'BJ') == n // 2
                       for c in range(n)):
                continue
            conformes += 1
            magiques += magique(e, n)
        print(f'  ordre {n:2d} : {conformes} conformes aux deux conditions '
              f'd’effectifs sur {tirages} tirages, {magiques} magiques')
        if magiques:
            echecs.append(f'un étiquetage magique est apparu au hasard à l’ordre {n}')


def main():
    doc = lire_referent()
    bases = [etiquetage(f) for f in doc['forms']]
    jusqua = int(sys.argv[sys.argv.index('--jusqua') + 1]) if '--jusqua' in sys.argv else 5

    for m in range(1, jusqua + 1):
        n = 6 * m
        ok = sum(1 for b in bases if magique(pave(b, m, alterne(m)), n))
        print(f'ordre {n:3d} ({m} × {m} blocs) : {ok}/256 magiques')
        if ok != 256:
            echecs.append(f'ordre {n} : {256 - ok} carrés non magiques')

    random.seed(1)
    ech = random.sample(bases, 12)
    ech20 = random.sample(bases, 20)
    for m in (7, 8, 10):
        n = 6 * m
        ok = sum(1 for b in ech if magique(pave(b, m, alterne(m)), n))
        print(f'ordre {n:3d} ({m} × {m} blocs) : {ok}/12 sur échantillon')
        if ok != 12:
            echecs.append(f'ordre {n} : échantillon non magique')

    bons = sum(1 for motif in itertools.product('CHVD', repeat=4)
               if magique(pave(bases[0], 2, [[motif[0], motif[1]], [motif[2], motif[3]]]), 12))
    print(f'\nmotifs de miroirs donnant un carré magique à l’ordre 12 : {bons}/256')
    if bons != 16:
        echecs.append(f'{bons} motifs valides au lieu de 16')

    blocs_de_trois(bases, ech20)
    sous_groupe(bases)
    regle_des_miroirs(bases)
    forme_annoncee(bases[:8])
    if '--exhaustif' in sys.argv:
        exhaustif_ordre18(bases)
    if '--echantillons' in sys.argv:
        echantillon_ordre18(bases)
        echantillon_graines()

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nUn carré d’ordre 6, un pavage par miroirs alternés, et l’ordre 6m suit.')


if __name__ == '__main__':
    main()
