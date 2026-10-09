#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# construction.py — toute figure candidate est réalisable à m impair.
#
# LE THÉORÈME. Soit n = 2m ≥ 6 avec m ≥ 3 impair, et soit une figure candidate
# quelconque sur la grille quotient m × m, c'est-à-dire une orientation H ou V
# de chaque orbite hors diagonale telle que chaque ligne porte un nombre impair
# de H (critère II) et chaque colonne un nombre impair de V (critère III).
# Alors il existe un étiquetage magique à quatre classes qui la réalise.
#
# LA PREUVE EST UNE RECETTE. La table locale de `recollement.py` donne, avec
# C = n²+1, t_r = n−1−2r et s_c = n−1−2c, les états d'orbite suivants :
#
#     orbite diagonale   D      (a−C, b−C) = (n·t_r,  t_r)
#     orbite verticale   V_σ    (a−C, b−C) = (σ·n·t_r,  0)
#     orbite horizontale H_τ    (a−C, b−C) = (0,  τ·s_c)      σ, τ = ±1
#
# C'est la séparation qui fait tout : une verticale ne touche QUE sa ligne, une
# horizontale QUE sa colonne. Les deux réglages sont donc indépendants.
#
#   — LIGNES. La ligne quotient r a m−1 orbites hors diagonale, et II en met un
#     nombre impair en H. Comme m−1 est pair, le nombre d_r de V y est lui aussi
#     impair. On pose D sur l'orbite diagonale, et on choisit les signes des d_r
#     verticales pour que Σσ = −1 : possible puisque d_r est impair, avec
#     (d_r−1)/2 signes + et (d_r+1)/2 signes −. Alors
#
#         δ_r = n·t_r + n·t_r·Σσ = n·t_r (1 − 1) = 0.
#
#   — COLONNES. La colonne quotient c a m−1 orbites hors diagonale, et III en
#     met un nombre impair en V, donc un nombre impair e_c en H. On choisit
#     leurs signes pour que Στ = −1. L'orbite diagonale (c, c) apporte s_c à
#     cette colonne, d'où
#
#         γ_c = s_c + s_c·Στ = 0.
#
# Les états sont admissibles orbite par orbite sous bijection + I ; la figure
# fournit II et III ; on obtient δ = 0 et γ = 0 ; et I rend les diagonales
# magiques. Le carré est donc magique et porte la figure demandée. ∎
#
# LE SIGNE OPPOSÉ. Ce qui précède construit un représentant. L'échange global
# B ↔ R, V ↔ J envoie chaque valeur x sur n²+1−x, conserve bijection, I, II et
# III, et change le signe de tous les écarts : les deux signes sont donc
# disponibles sans construction nouvelle.
#
# CE QUE CELA FERME. Avec le théorème négatif — à m pair, aucune croix ansée —
# la classification est complète pour n = 2m ≥ 6 :
#
#     une figure candidate est réalisable  ⟺  m est impair,
#
# et le nombre de croix ansées vaut exactement 2^(m²−3m+1) si m est impair,
# et 0 sinon. L'ordre 2 (m = 1) est hors théorème.
#
# UNE FIGURE EXPLICITE À TOUT ORDRE. La figure canonique — V si c ≡ r+1 (mod m),
# H partout ailleurs — satisfait II et III : chaque ligne a une seule V, donc
# m−2 H, impair ; chaque colonne a une seule V. Elle donne donc, à tout ordre
# singulièrement pair, un étiquetage magique portant une croix ansée, sans
# résoudre le système GF(2) et sans solveur.
#
# LE COROLLAIRE D'EXISTENCE COMPLÈTE. Le protocole admet un étiquetage magique
# normal diagonal à TOUT ordre pair n ≥ 4, et l'ordre 2 est le seul ordre pair
# impossible. Deux branches, et elles sont toutes deux explicites :
#
#     n ≡ 0 (mod 4)   le motif classique à deux classes
#
#                         L(r, c) = B  si r mod 4 = c mod 4
#                                      ou (r mod 4) + (c mod 4) = 3,
#                                   R  sinon,
#
#                     c'est-à-dire le criss-cross de la méthode des motifs, que
#                     le protocole contient comme sous-cas à deux classes. Dans
#                     chaque paquet de quatre cases d'une ligne, les deux B ont
#                     la même somme de résidus que les deux R, donc le paquet
#                     somme à 2(n²+1) ; il y en a n/4, d'où M = (n/2)(n²+1).
#                     Même calcul par colonne. Sur la diagonale r = c toutes les
#                     cases sont B, et sur l'antidiagonale r + c ≡ 3 (mod 4)
#                     donc aussi : les deux diagonales valent M.
#
#     n ≡ 2 (mod 4)   la construction canonique à croix ansée ci-dessus,
#     n ≥ 6           par le théorème positif.
#
#     n = 2           impossible, et pour une raison qui ne doit RIEN au
#                     protocole. Soit un carré 2 × 2 normal
#
#                              a  b
#                              c  d
#
#                     dont les lignes et les colonnes ont même somme :
#                     a + b = c + d et a + c = b + d. En soustrayant,
#                     b − c = c − b, donc b = c, ce qui contredit la présence
#                     d'une seule occurrence de chaque valeur. Aucun carré
#                     magique normal d'ordre 2 n'existe. ∎
#
#                     ATTENTION à l'argument faux, qu'une version antérieure de
#                     ce script employait : l'échec du critère II à l'ordre 2
#                     — zéro trait horizontal par ligne, et 0 n'est pas impair —
#                     ne prouve QUE l'absence de croix ansée. II est une
#                     condition de la figure, pas une condition nécessaire de la
#                     magicité. Le mode --existence énumère donc réellement les
#                     4⁴ = 256 étiquetages de l'ordre 2 et constate qu'aucun
#                     n'est magique ; `compte_etiquetages.py --ordre 2` le
#                     redonne indépendamment.
#
# Ce motif B/R ne vérifie PAS la condition I — il ne porte pas de croix ansée,
# et le théorème négatif interdit qu'il en porte une. L'existence d'un étiquetage
# magique et l'existence d'une croix ansée sont deux questions distinctes : la
# première est fermée à tout ordre pair, la seconde exactement aux ordres
# n ≡ 2 (mod 4) AVEC n ≥ 6 — la borne compte, puisque 2 est lui aussi congru à
# 2 modulo 4 et ne porte aucune croix. Le titre du papier devient littéralement complet sur l'existence.
#
# Usage : cd <racine du dépôt> && python tools/construction.py
#         [--ordres 6,10,...]   la figure canonique à ces ordres
#         [--toutes]            TOUTES les figures candidates des ordres 6 et 10
#         [--echantillon K]     K figures tirées au hasard par ordre
#         [--existence]         le corollaire : un étiquetage magique à tout
#                               ordre pair n ≥ 4, par ses deux branches
#
# Aucune dépendance : Python nu.

import sys, os, itertools, random

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from reseau import orbites, etats, valeur, H_PARTENAIRE          # noqa: E402


def cellules(n):
    m = n // 2
    g = [[None] * m for _ in range(m)]
    for o in orbites(n):
        g[min(a for a, _ in o)][min(b for _, b in o)] = o
    return g


def etats_classes(n, orbite, r, c):
    """(a−C, b−C, horizontale, classes) pour chaque état admissible."""
    C = n * n + 1
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    out = []
    for cl in etats(n, orbite, brut=True):
        a = sum(valeur(k, i, j, n) for (i, j), k in cl.items() if i == r)
        b = sum(valeur(k, i, j, n) for (i, j), k in cl.items() if j == c)
        hor = None
        for (i, j), k in cl.items():
            if (i, j) in diag:
                continue
            hor = (cl[(i, n - 1 - j)] == H_PARTENAIRE[k])
            break
        out.append((a - C, b - C, hor, cl))
    return out


def conforme(m, f):
    """La figure satisfait-elle II (H impair par ligne) et III (V impair par
    colonne) ? f[(r, c)] vaut 1 pour horizontale, 0 pour verticale."""
    return (all(sum(f[(r, c)] for c in range(m) if c != r) % 2 == 1
                for r in range(m))
            and all(sum(1 - f[(r, c)] for r in range(m) if r != c) % 2 == 1
                    for c in range(m)))


def figures(m):
    """Toutes les figures candidates. Praticable jusqu'à m = 5."""
    hors = [(r, c) for r in range(m) for c in range(m) if r != c]
    for bits in itertools.product((0, 1), repeat=len(hors)):
        f = dict(zip(hors, bits))
        if conforme(m, f):
            yield f


def canonique(m):
    """V si c ≡ r+1 (mod m), H ailleurs : une figure candidate à tout m."""
    return {(r, c): (0 if c == (r + 1) % m else 1)
            for r in range(m) for c in range(m) if r != c}


def au_hasard(m, rng, pas=40):
    """Une figure candidate tirée au hasard. On part de la canonique et on lui
    applique des rectangles : retourner les quatre cases (r1,c1), (r1,c2),
    (r2,c1), (r2,c2) préserve toutes les parités de ligne et de colonne."""
    f = canonique(m)
    hors = lambda r, c: r != c
    for _ in range(pas):
        r1, r2 = rng.sample(range(m), 2)
        c1, c2 = rng.sample(range(m), 2)
        coins = [(r1, c1), (r1, c2), (r2, c1), (r2, c2)]
        if all(hors(*p) for p in coins):
            for p in coins:
                f[p] ^= 1
    return f


def realise(n, f):
    """La recette : D sur la diagonale, signes des V par ligne, des H par
    colonne. Renvoie l'étiquetage, ou None si un état manque."""
    m, C = n // 2, n * n + 1
    g = cellules(n)
    t = lambda r: n - 1 - 2 * r
    s = lambda c: n - 1 - 2 * c
    sigma, tau = {}, {}
    for r in range(m):
        V = [c for c in range(m) if c != r and f[(r, c)] == 0]
        for i, c in enumerate(V):
            sigma[(r, c)] = 1 if i < (len(V) - 1) // 2 else -1
    for c in range(m):
        H = [r for r in range(m) if r != c and f[(r, c)] == 1]
        for i, r in enumerate(H):
            tau[(r, c)] = 1 if i < (len(H) - 1) // 2 else -1
    cl = {}
    for r in range(m):
        for c in range(m):
            E = etats_classes(n, g[r][c], r, c)
            if r == c:
                ch = [e for e in E if e[0] == n * t(r) and e[1] == t(r)]
            elif f[(r, c)] == 0:
                ch = [e for e in E if e[2] is False
                      and e[0] == sigma[(r, c)] * n * t(r) and e[1] == 0]
            else:
                ch = [e for e in E if e[2] is True
                      and e[0] == 0 and e[1] == tau[(r, c)] * s(c)]
            if not ch:
                return None
            cl.update(ch[0][3])
    return cl


ECHANGE = {'B': 'R', 'R': 'B', 'V': 'J', 'J': 'V'}


def echange(cl):
    """L'échange global B ↔ R, V ↔ J. Il envoie chaque valeur x sur n²+1−x,
    donc change le signe de tous les écarts, et conserve la bijection, la
    condition I et l'orientation de chaque trait."""
    return {p: ECHANGE[k] for p, k in cl.items()}


def classique(n):
    """Le motif à deux classes des ordres doublement pairs : B sur les deux
    diagonales de chaque paquet 4 × 4, R ailleurs. C'est le criss-cross de la
    méthode des motifs, écrit dans le protocole."""
    return {(r, c): ('B' if (r % 4 == c % 4 or (r % 4) + (c % 4) == 3) else 'R')
            for r in range(n) for c in range(n)}


def magique(n, cl):
    """Bijection sur 1…n², les n lignes, les n colonnes et les deux diagonales
    à M. Rien de plus : ni condition I, ni critères de parité."""
    M = n * (n * n + 1) // 2
    g = [[valeur(cl[(r, c)], r, c, n) for c in range(n)] for r in range(n)]
    return (sorted(v for L in g for v in L) == list(range(1, n * n + 1))
            and all(sum(L) == M for L in g)
            and all(sum(g[r][c] for r in range(n)) == M for c in range(n))
            and sum(g[i][i] for i in range(n)) == M
            and sum(g[i][n - 1 - i] for i in range(n)) == M)


def porte_une_croix(n, cl):
    """L'étiquetage vérifie-t-il la condition I, et donc porte-t-il une figure ?"""
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    return all((cl[(r, c)] == cl[(n - 1 - r, n - 1 - c)]) == ((r, c) in diag)
               for r in range(n) for c in range(n))


def controle(n, cl, f):
    """Le carré est-il magique, et réalise-t-il bien la figure demandée ?"""
    m, M = n // 2, n * (n * n + 1) // 2
    gr = [[valeur(cl[(r, c)], r, c, n) for c in range(n)] for r in range(n)]
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    ok = sorted(v for L in gr for v in L) == list(range(1, n * n + 1))
    ok &= all(sum(L) == M for L in gr)
    ok &= all(sum(gr[r][c] for r in range(n)) == M for c in range(n))
    ok &= sum(gr[i][i] for i in range(n)) == M
    ok &= sum(gr[i][n - 1 - i] for i in range(n)) == M
    ok &= all((cl[(r, c)] == cl[(n - 1 - r, n - 1 - c)]) == ((r, c) in diag)
              for r in range(n) for c in range(n))
    for r in range(m):
        for c in range(m):
            if r == c:
                continue
            h = cl[(r, n - 1 - c)] == H_PARTENAIRE[cl[(r, c)]]
            if h != (f[(r, c)] == 1):
                return False
    for r in range(n):
        h = sum(1 for c in range(n) if (r, c) not in diag
                and cl[(r, n - 1 - c)] == H_PARTENAIRE[cl[(r, c)]])
        ok &= (h // 2) % 2 == 1
    for c in range(n):
        v = sum(1 for r in range(n) if (r, c) not in diag
                and cl[(r, n - 1 - c)] != H_PARTENAIRE[cl[(r, c)]])
        ok &= (v // 2) % 2 == 1
    return ok


def mots(n, cl):
    return [''.join(cl[(r, c)] for c in range(n)) for r in range(n)]


if __name__ == '__main__':
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 10, 14, 18, 22, 26, 30])
    echec = 0

    if '--toutes' in av:
        print('TOUTES les figures candidates, construites une à une\n')
        for n in (6, 10):
            m = n // 2
            F = list(figures(m))
            bons = sum(1 for f in F
                       if (c := realise(n, f)) is not None and controle(n, c, f))
            attendu = 2 ** (m * m - 3 * m + 1)
            print(f'  ordre {n:3d} (m = {m}) : {len(F)} figures candidates '
                  f'(formule 2^({m}²−3·{m}+1) = {attendu}) ; construites et '
                  f'magiques : {bons}', flush=True)
            echec += (len(F) != attendu) + (bons != len(F))
        print('\nà l\'ordre 10, les 2 048 sur 2 048 sont ainsi retrouvées sans '
              'solveur,\npar construction et non par recherche.')
        sys.exit(1 if echec else 0)

    if '--existence' in av:
        print('le corollaire d\'existence : un étiquetage magique à tout ordre '
              'pair n ≥ 4\n')
        pairs = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
                 if '--ordres' in av else list(range(2, 53, 2)))
        for n in pairs:
            if n == 2:
                # on ne se contente pas de l'argument : on énumère. Les 4⁴ = 256
                # étiquetages, et aucun n'est magique — c'est le cas NÉGATIF du
                # corollaire, il doit donc être contrôlé, et non déduit de
                # l'échec du critère II, qui ne concerne que la croix ansée.
                cases = [(r, c) for r in range(2) for c in range(2)]
                tous = list(itertools.product('BRVJ', repeat=4))
                combien = sum(1 for w in tous
                              if magique(2, dict(zip(cases, w))))
                # et la preuve analytique, sur les 24 carrés 2 × 2 normaux :
                # a+b = c+d et a+c = b+d donnent b = c, donc aucun.
                carres = sum(1 for q in itertools.permutations((1, 2, 3, 4))
                             if q[0] + q[1] == q[2] + q[3]
                             and q[0] + q[2] == q[1] + q[3])
                bon = combien == 0 and carres == 0
                echec += not bon
                print(f'  ordre {n:3d} : impossible — {combien} étiquetage '
                      f'magique parmi les {len(tous)} de l\'ordre 2, et '
                      f'{carres} carré 2×2 normal à lignes et colonnes égales '
                      f'parmi les 24 (preuve : b = c) : {bon}', flush=True)
                continue
            if n % 4 == 0:
                cl, voie = classique(n), 'motif classique B/R'
                croix = porte_une_croix(n, cl)
                bon = magique(n, cl) and not croix
                detail = (f'{voie}, magique : {magique(n, cl)} ; porte une '
                          f'croix : {croix} (le théorème négatif l\'interdit)')
            else:
                m = n // 2
                f = canonique(m)
                cl = realise(n, f)
                bon = cl is not None and controle(n, cl, f)
                detail = (f'croix ansée canonique, magique et conforme : {bon}')
            echec += not bon
            print(f'  ordre {n:3d} : {detail}', flush=True)
        print('\nles deux branches couvrent tous les ordres pairs n ≥ 4 ; '
              'l\'ordre 2 est\nle seul ordre pair impossible.')
        sys.exit(1 if echec else 0)

    if '--echantillon' in av:
        K = int(av[av.index('--echantillon') + 1])
        rng = random.Random(1)
        print(f'{K} figures tirées au hasard par ordre, graine fixée\n')
        for n in ordres:
            m = n // 2
            if m % 2 == 0 or m < 3:
                continue
            bons = 0
            for _ in range(K):
                f = au_hasard(m, rng)
                if not conforme(m, f):
                    continue
                c = realise(n, f)
                if c is not None and controle(n, c, f):
                    bons += 1
            print(f'  ordre {n:3d} (m = {m:2d}) : {bons}/{K} construites et '
                  f'magiques', flush=True)
            echec += (bons != K)
        sys.exit(1 if echec else 0)

    print('la figure canonique — V si c ≡ r+1 (mod m), H ailleurs\n')
    for n in ordres:
        m = n // 2
        if m % 2 == 0:
            print(f'  ordre {n:3d} : m = {m} pair, aucune croix ansée '
                  f'(théorème)', flush=True)
            continue
        if m < 3:
            # l'ordre 2 est hors théorème, et ce n'est pas un échec. Les quatre
            # cases sont toutes diagonales : la ligne ne porte aucun trait, et
            # le critère II s'applique et ÉCHOUE, puisque 0 n'est pas impair.
            print(f'  ordre {n:3d} : m = {m} < 3, hors théorème — aucune orbite '
                  f'hors diagonale, donc 0 trait par ligne, et II veut un '
                  f'nombre impair : il échoue, donc aucune croix ansée. '
                  f'L\'absence d\'étiquetage MAGIQUE à l\'ordre 2 est une autre '
                  f'affaire, et se voit sur le carré 2×2 : voir --existence',
                  flush=True)
            continue
        f = canonique(m)
        if not conforme(m, f):
            print(f'  ordre {n:3d} : la figure canonique ne tient pas II/III')
            echec += 1
            continue
        cl = realise(n, f)
        bon = cl is not None and controle(n, cl, f)
        echec += not bon
        if bon:
            # correction (b) : le signe opposé, par l'échange global
            autre = echange(cl)
            miroir = controle(n, autre, f)
            valeurs = all(valeur(autre[(r, c)], r, c, n)
                          == n * n + 1 - valeur(cl[(r, c)], r, c, n)
                          for r in range(n) for c in range(n))
            bon &= miroir and valeurs
        ligne = mots(n, cl)[0] if cl else '—'
        print(f'  ordre {n:3d} (m = {m:2d}) : construit, bijectif, lignes, '
              f'colonnes et diagonales magiques, figure conforme, et son '
              f'échangé B↔R/V↔J de même (x ↦ n²+1−x) : {bon}'
              f'   ligne 0 = {ligne}', flush=True)
    print('\nune croix ansée magique à tout ordre singulièrement pair, '
          'sans solveur\net sans résoudre le système GF(2).')
    sys.exit(1 if echec else 0)
