#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# recollement.py — le problème global comme somme nulle de m objets locaux.
#
# CE QUE L'ON SAIT. Pour m ≥ 3, la PREMIÈRE paire (0, n−1) admet une
# configuration locale d'écart nul si et seulement si m = n/2 est impair : c'est le théorème et sa
# réciproque locale, dans `parite.py`. Pour les AUTRES paires, le mode
# `--construit` de ce script donne une construction explicite à tout m impair,
# et le théorème global — toute figure candidate est réalisable — est démontré
# dans `construction.py`. Le présent script calcule les profils sans supposer
# leur existence : c'est lui qui a fourni la table locale d'où la preuve est
# sortie.
#
# En particulier « à m pair, aucune paire n'est réalisable » serait FAUX : à
# l'ordre 8, les paires (0,7), (1,6) et (2,5) n'ont aucune configuration
# d'écart nul, mais la paire centrale (3,4) en a 384. À ordre doublement pair,
# l'impossibilité de la seule première paire suffit à fermer tout recollement,
# et les paires centrales peuvent rester localement réalisables. La preuve ne
# mord que si n·|u_r| > m², ce qui exclut justement le centre.
#
# Le sens positif global — toute figure candidate est-elle réalisable ? — ne
# peut donc pas se lire sur une seule paire de lignes. Il est maintenant
# DÉMONTRÉ, et c'est précisément la table locale de ce script qui le donne :
# une orbite verticale est neutre pour sa colonne, une horizontale neutre pour
# sa ligne, et les deux réglages de signes sont donc indépendants. Voir
# `construction.py`, qui porte le théorème et le réalise à chaque ordre.
#
# CE QUE CE SCRIPT MET À PLAT. Le carré se décompose en m × m orbites de quatre
# cases, l'orbite (r, c) étant {(r,c), (r,c̄), (r̄,c), (r̄,c̄)}. Les contraintes
# de bijection et la condition I sont LOCALES à une orbite. Chaque orbite a donc
# un petit nombre d'états admissibles, et chaque état donne trois nombres :
#
#     a  ce que l'orbite apporte à la somme de la ligne r ;
#     b  ce qu'elle apporte à la somme de la colonne c ;
#     o  son orientation, horizontale ou verticale.
#
# Et tout le reste du problème s'écrit en fonction de ces trois nombres :
#
#     ligne r    : somme des a sur c = M,  nombre d'orbites H impair  (II)
#     colonne c  : somme des b sur r = M,  nombre d'orbites V impair  (III)
#
# POURQUOI LES DEUX MOITIÉS SUFFISENT. Dans une orbite, les quatre valeurs
# somment à 2(n²+1), donc l'apport à la colonne c̄ vaut 2(n²+1) moins l'apport à
# la colonne c : les m premières colonnes déterminent les autres, et c'est
# l'antisymétrie γ_{n−1−c} = −γ_c. Même chose pour les lignes. Il suffit donc
# de poser les contraintes sur r < m et c < m.
#
# LE PROBLÈME DEVIENT un transport entier sur une grille m × m, avec une parité
# par ligne et par colonne. C'est beaucoup plus structuré que l'énoncé de
# départ : les lignes et les colonnes n'y communiquent plus que par ces quatre
# familles de contraintes, et les 4^(n²) étiquetages ont disparu.
#
# CE QUE LE SCRIPT CALCULE. Les états par orbite ; les profils de ligne — les
# vecteurs d'apports aux colonnes qu'une paire de lignes d'écart nul peut
# produire — ; puis, par programmation dynamique sur les lignes, le nombre de
# recollements complets. Sans solveur.
#
# Usage : cd <racine du dépôt> && python tools/recollement.py [--ordres 6,10]
#         [--profils]   détaille les profils de ligne par ordre
#         [--inverse]   recolle les paires en partant de la dernière
#         [--ordre-paires 1,0,2,3,4]   un ordre de recollement quelconque :
#                       le compte ne doit pas en dépendre, l'élagage si
#         [--apports]   où vit l'apport d'une paire à une colonne
#         [--table]     la table des états d'orbite, et sa borne
#         [--geometrie] le centre du quotient, les couches, le 3
#         [--par-colonne]  les bornes, colonne par colonne
#         [--construit]    les quatre énoncés, par construction
#
# Aucune dépendance : Python nu.

import sys, os
from collections import defaultdict

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from reseau import orbites, etats, valeur, CLASSES, H_PARTENAIRE  # noqa: E402


def cellules(n):
    """Les orbites rangées en grille : grille[r][c] pour r, c < m."""
    m = n // 2
    g = [[None] * m for _ in range(m)]
    for o in orbites(n):
        r = min(a for a, _ in o)
        c = min(b for _, b in o)
        g[r][c] = o
    return g


def trois_nombres(n, orbite, r, c):
    """Pour chaque état admissible de l'orbite : (a, b, orientation).

    L'orientation vaut True (horizontale), False (verticale) ou None pour
    l'orbite diagonale, qui ne porte pas de trait. Les états ne sont PAS
    dédupliqués : deux états distincts peuvent donner les mêmes nombres, et
    leur multiplicité compte dans les dénombrements."""
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
        out.append((a, b, hor))
    return out


def profils_de_ligne(n, grille, r):
    """Les apports aux colonnes qu'une paire de lignes d'écart nul peut
    produire, avec la parité verticale par colonne.

    Renvoie un dictionnaire {(apports, masque_V) : nombre de configurations},
    où apports[c] est ce que la paire donne à la colonne c."""
    m = n // 2
    M = n * (n * n + 1) // 2
    dp = {(0, (), 0, 0): 1}          # (somme de ligne, apports, masque V, h)
    for c in range(m):
        suiv = defaultdict(int)
        for (s, ap, mv, h), poids in dp.items():
            for a, b, hor in trois_nombres(n, grille[r][c], r, c):
                nmv = mv if hor is not False else (mv ^ (1 << c))
                suiv[(s + a, ap + (b,), nmv, h + (1 if hor is True else 0))] += poids
        dp = suiv
    out = defaultdict(int)
    for (s, ap, mv, h), poids in dp.items():
        if s == M and h % 2 == 1:    # écart nul, et critère II sur la ligne
            out[(ap, mv)] += poids
    return dict(out)


def recollements(n, trace=False, ordre_paires=None):
    """Le nombre de carrés obtenus en recollant m paires de lignes d'écart nul
    de façon que toutes les colonnes soient magiques et de parité impaire."""
    m = n // 2
    M = n * (n * n + 1) // 2
    grille = cellules(n)
    profs = [profils_de_ligne(n, grille, r) for r in range(m)]
    # le compte ne doit pas dépendre de l'ordre où l'on recolle les paires.
    # L'élagage par atteignabilité, lui, en dépend : certains ordres gardent
    # beaucoup plus d'états. D'où --ordre-paires, qui laisse choisir.
    if ordre_paires is None:
        ordre_paires = list(range(m))
    assert sorted(ordre_paires) == list(range(m)), 'ordre de paires invalide'
    profs = [profs[i] for i in ordre_paires]
    if trace:
        for pos, (r0, p) in enumerate(zip(ordre_paires, profs)):
            total = sum(p.values())
            print(f'  paire {r0} et {n - 1 - r0} (recollée en {pos + 1}ᵉ) : '
                  f'{len(p):7d} profils distincts, {total:12d} '
                  f'configurations locales', flush=True)
    plein = (1 << m) - 1
    if any(not p for p in profs):
        # une paire sans solution locale d'écart nul ferme tout : c'est le
        # cas de tout ordre doublement pair, par le théorème.
        return 0, profs
    # élagage par atteignabilité : ce que les paires restantes peuvent encore
    # apporter à chaque colonne. Sans lui, la somme partielle reste libre et le
    # nombre d'états explose.
    mini = [[min(ap[c] for ap, _ in profs[r]) for c in range(m)]
            for r in range(m)]
    maxi = [[max(ap[c] for ap, _ in profs[r]) for c in range(m)]
            for r in range(m)]
    rmin = [[sum(mini[q][c] for q in range(r, m)) for c in range(m)]
            for r in range(m + 1)]
    rmax = [[sum(maxi[q][c] for q in range(r, m)) for c in range(m)]
            for r in range(m + 1)]
    dp = {((0,) * m, 0): 1}
    for r in range(m):
        suiv = defaultdict(int)
        bas, haut = rmin[r + 1], rmax[r + 1]
        for (col, mv), poids in dp.items():
            for (ap, nv), k in profs[r].items():
                nc = tuple(x + y for x, y in zip(col, ap))
                if any(nc[c] + bas[c] > M or nc[c] + haut[c] < M
                       for c in range(m)):
                    continue
                suiv[(nc, mv ^ nv)] += poids * k
        dp = suiv
        if trace:
            print(f'  après la paire {ordre_paires[r]} : {len(dp):10d} '
                  f'états', flush=True)
    cible = (M,) * m
    return dp.get((cible, plein), 0), profs


def table_locale(n):
    """La table des états d'orbite, et la borne qu'elle démontre.

    LE THÉORÈME. Posons C = n²+1, t_r = n−1−2r = |u_r| et s_c = n−1−2c, pour
    r, c < m. Sous la bijection et la condition I, les états d'une orbite sont
    exactement, en écarts à C :

        orbite hors diagonale       a − C          b − C
          horizontale                 0        ±n·t_r  ou  ±s_c
          verticale            ±n·t_r ou ±s_c         0

        orbite diagonale (c = r)   (a − C, b − C) ∈ {(±n·t_r, ±t_r),
                                                     (±t_r, ±n·t_r)}
                                   dans chacun des deux types les DEUX signes
                                   sont indépendants : huit états au total.

    LA PREUVE, en six lignes. Pour une orbite hors diagonale, la bijection et la
    condition I ne laissent que deux types. Si l'orbite est HORIZONTALE, les
    deux cases de la ligne r sont complémentaires, donc a = C ; la colonne
    représentative reçoit alors deux valeurs prises soit dans les deux blocs r
    et n−1−r, ce qui donne b − C = ±n(n−1−2r) = ±n·t_r, soit aux indices de
    colonne opposés, ce qui donne b − C = ±(n−1−2c) = ±s_c. Si l'orbite est
    VERTICALE, le même raisonnement échange les rôles : b = C et a − C ∈
    {±n·t_r, ±s_c}. Sur l'orbite diagonale, la substitution directe des huit
    états donne (a−C, b−C) ∈ {(±n·t_r, ±t_r), (±t_r, ±n·t_r)}. Enfin
    1 ≤ s_c ≤ n−1 < n·t_r puisque t_r ≥ 1. ∎

    Une horizontale est donc neutre pour la ligne, une verticale neutre pour la
    colonne, et toute valeur en jeu est majorée par n·t_r :

        |a − C| ≤ n·|u_r|   et   |b − C| ≤ n·|u_r|

    pour TOUT état admissible, avant même d'imposer δ_r = 0 ou le critère II.
    L'origine de n·|u_r| est immédiate : B(n−1−r, c) − B(r, c) = n(n−1−2r),
    le saut entre les deux blocs de lignes complémentaires. C'est pourquoi le
    même nombre gouverne la borne des écarts de ligne et l'étendue des apports
    aux colonnes : les deux mesurent le même écart de blocs.

    Renvoie (nombre d'orbites testées, nombre d'écarts à la table)."""
    m, C = n // 2, n * n + 1
    g = cellules(n)
    cas = ecarts = 0
    for r in range(m):
        t = n - 1 - 2 * r
        for c in range(m):
            s = n - 1 - 2 * c
            obs = {(a - C, b - C, o)
                   for a, b, o in trois_nombres(n, g[r][c], r, c)}
            if c == r:
                att = {(e * n * t, f * t, None)
                       for e in (1, -1) for f in (1, -1)} | \
                      {(e * t, f * n * t, None)
                       for e in (1, -1) for f in (1, -1)}
            else:
                att = {(0, x, True) for x in (n * t, -n * t, s, -s)} | \
                      {(x, 0, False) for x in (n * t, -n * t, s, -s)}
            cas += 1
            ecarts += (obs != att)
    return cas, ecarts


def trio_explicite(m, r):
    """Les trois indices de l'énoncé III, sans recherche : i + j − k = r, tous
    distincts et distincts de r, pour tout m ≥ 5 impair. None si m < 5."""
    if m < 5:
        return None
    if r == 0:
        t = (1, 2, 3)
    elif r == 1:
        t = (0, 3, 2)
    elif r <= m - 2:
        t = (0, r + 1, 1)
    else:
        t = (m - 2, m - 3, m - 4)
    i, j, k = t
    if (len({i, j, k}) < 3 or r in t or not all(0 <= x < m for x in t)
            or i + j - k != r):
        return None
    return t


def construction(n, r, cible=None):
    """La construction explicite d'un profil local, et de ses extrêmes.

    LES QUATRE ÉNONCÉS, pour n = 2m avec m ≥ 3 impair. (À m = 1,
    soit n = 2, le code renvoie lui-même h_r = −1 : hors théorème.) Ils découlent de la table
    locale, et ce code les réalise au lieu de les affirmer.

    I.  Toute paire de lignes admet un profil local avec δ_r = 0 et le critère
        II. Prendre sur l'orbite diagonale l'état a − C = +n·t_r, sur une
        orbite hors diagonale un état VERTICAL a − C = −n·t_r, et mettre
        toutes les autres en HORIZONTAL, donc a − C = 0. La somme est nulle, et
        h_r = (m−1) − 1 = m−2, impair puisque m l'est. À ordre singulièrement
        pair, aucune paire de lignes n'oppose donc d'obstruction locale.

    II. Pour une colonne c ≠ r, C ± n·|u_r| est atteignable : on met en outre
        l'orbite de la colonne c en horizontal avec b_c − C = ±n·t_r, ce qui ne
        change rien à la ligne.

    III. Pour la colonne diagonale c = r, il faut b_r − C = ±n·t_r, et la table
        impose alors a_r − C = ±t_r. On l'annule par trois verticales de poids
        −s_i, −s_j, +s_k. Comme s_i + s_j − s_k = n − 1 − 2(i+j−k) = s_{i+j−k},
        la condition est exactement i + j − k = r. L'existence de trois indices
        distincts et distincts de r ne suffit pas à conclure : il faut la
        résoudre. Elle l'est explicitement, pour tout m ≥ 5 impair, par

                r                    (i, j, k)
                0                    (1, 2, 3)
                1                    (0, 3, 2)
                2 ≤ r ≤ m−2          (0, r+1, 1)
                m−1                  (m−2, m−3, m−4)

        — table que `trio(m, r)` renvoie et que le code emploie, la recherche
        exhaustive ne servant que de recours quand a_r − C vaut −t_r. Il reste
        m−4 horizontales, impair.

    IV. À m = 3 c'est impossible, et le confinement observé est exact : il n'y
        a que deux orbites hors diagonale, II force une horizontale et une
        verticale, et la seule verticale ne peut apporter que ±n·t_r ou ±s_c
        avec c ≠ r, donc jamais ∓t_r. La diagonale doit donc prendre
        a − C = ±n·t_r, et la colonne diagonale ne reçoit que b_r − C = ±t_r.

    Renvoie (δ_r, h_r, b_cible) ou None si la construction n'existe pas."""
    m, C, t = n // 2, n * n + 1, n - 1 - 2 * r
    g = cellules(n)
    choix = {}

    def etats(c):
        return [(a - C, b - C, o) for a, b, o in trois_nombres(n, g[r][c], r, c)]

    def prend(c, cond):
        for e in etats(c):
            if cond(e):
                choix[c] = e
                return True
        return False

    if cible is None or cible != r:
        if not prend(r, lambda e: e[0] == n * t):
            return None
        v = next((c for c in range(m) if c != r and c != cible), None)
        if v is None or not prend(v, lambda e: e[2] is False and e[0] == -n * t):
            return None
        if cible is not None and not prend(
                cible, lambda e: e[2] is True and e[1] == n * t):
            return None
    else:
        if not prend(r, lambda e: e[1] == n * t):
            return None
        ar, trio = choix[r][0], None
        tab = trio_explicite(m, r)
        if tab is not None and (n - 1 - 2 * (tab[0] + tab[1] - tab[2])) == ar:
            trio = tab
        for i in range(m) if trio is None else ():
            for j in range(m):
                for k in range(m):
                    if len({i, j, k}) < 3 or r in (i, j, k):
                        continue
                    if (n - 1 - 2 * i) + (n - 1 - 2 * j) - (n - 1 - 2 * k) == ar:
                        trio = (i, j, k)
                        break
                if trio:
                    break
            if trio:
                break
        if trio is None:
            return None
        i, j, k = trio
        for c, v in ((i, -(n - 1 - 2 * i)), (j, -(n - 1 - 2 * j)),
                     (k, +(n - 1 - 2 * k))):
            if not prend(c, lambda e, v=v: e[2] is False and e[0] == v):
                return None
    for c in range(m):
        if c not in choix and not prend(c, lambda e: e[2] is True):
            return None
    return (sum(e[0] for e in choix.values()),
            sum(1 for e in choix.values() if e[2] is True),
            choix[cible][1] if cible is not None else None)


def geometrie(n):
    """La géométrie du quotient, calculée et non affirmée.

    LE LEMME. Soit n = 2m avec m impair et q = (m−1)/2. Les centres des quatre
    quadrants m × m sont (q,q), (q,m+q), (m+q,q) et (m+q,m+q). Comme
    n−1−q = 2m−1−q = m+q, ces quatre cases forment exactement l'orbite de
    (q,q), et elles sont toutes diagonales : q = q d'une part, et
    q + (m+q) = 2m−1 = n−1 d'autre part. Dans la grille quotient m × m, cette
    orbite est la case (q,q), son unique centre. Elle existe si et seulement si
    m est impair, c'est-à-dire n ≡ 2 (mod 4).

    DEUX CENTRES À NE PAS CONFONDRE. Le centre du quotient est en r = q. Les
    couches mesurées par |u_r| = n−1−2r se resserrent, elles, jusqu'à r = m−1,
    la paire de lignes qui borde la médiane. Rayons : n(n−1), n(n−3), …, n.

    Renvoie un dictionnaire de ce qui a été contrôlé."""
    m = n // 2
    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    res = {'m': m, 'm impair': m % 2 == 1, 'rayons': [n * (n - 1 - 2 * r)
                                                      for r in range(m)]}
    if m % 2 == 0:
        res['centre du quotient'] = None
        return res
    q = (m - 1) // 2
    centres = {(q, q), (q, m + q), (m + q, q), (m + q, m + q)}
    orb = [o for o in orbites(n) if set(o) == centres]
    res['centres de quadrants'] = sorted(centres)
    res['une seule orbite'] = len(orb) == 1
    res['toutes diagonales'] = centres <= diag
    res['centre du quotient'] = (q, q)
    res['orbite au centre du quotient'] = (min(a for a, _ in centres),
                                           min(b for _, b in centres)) == (q, q)
    res['couche la plus serrée'] = m - 1
    return res


def signature_mod3(n, r, c):
    """Les écarts à C d'une orbite hors diagonale, et leurs résidus mod 3.

    La table locale fait apparaître n·t_r et s_c = n−1−2c. Quand 3 divise n,
    n·t_r l'est aussi, et s_c = n−1−2c l'est dès que 3 | n−1−2c. Il existe donc
    une signature locale modulo 3, que l'union globale des résidus efface."""
    C = n * n + 1
    g = cellules(n)
    h = sorted({b - C for a, b, o in trois_nombres(n, g[r][c], r, c)
                if o is True})
    return h, sorted({x % 3 for x in h}), all(x % 3 == 0 for x in h)


def apports(n):
    """Les bornes sont-elles encore atteintes une fois le profil contraint ?

    La borne |b − C| ≤ n·|u_r| est DÉMONTRÉE : voir `table_locale`. Ce qui
    reste observé est plus fort et plus précis : après avoir imposé à la paire
    entière δ_r = 0 et le critère II, les deux extrémités C ± n·|u_r| restent
    atteintes.

    ATTENTION À LA PORTÉE. Ce mode prend le minimum et le maximum TOUTES
    COLONNES CONFONDUES : il établit que l'enveloppe globale des apports atteint
    C ± n·|u_r|, et non que chaque colonne les atteint. La distinction est
    réelle : à l'ordre 6, et seulement là parmi les ordres calculés, la colonne
    diagonale c = r est confinée à C ± t_r — ±5, ±3, ±1 pour r = 0, 1, 2 — et
    ce sont les autres colonnes qui portent les extrêmes. Aux ordres 8, 10 et
    12, toutes les colonnes atteignent les deux bornes. Le mode `--par-colonne`
    donne le détail.

    Renvoie la liste (r, C, n|u_r|, min, max, accord)."""
    m, C = n // 2, n * n + 1
    g = cellules(n)
    out = []
    for r in range(m):
        p = profils_de_ligne(n, g, r)
        if not p:
            continue
        vals = [b for ap, _ in p for b in ap]
        lo, hi, u = min(vals), max(vals), abs(2 * r - n + 1)
        out.append((r, C, n * u, lo, hi, lo - C == -n * u and hi - C == n * u))
    return out


if __name__ == '__main__':
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [6, 10])
    trace = '--profils' in av
    ordre = None
    if '--ordre-paires' in av:
        ordre = [int(x) for x in av[av.index('--ordre-paires') + 1].split(',')]
    print('le recollement : m objets locaux d\'écart nul, de somme nulle sur '
          'les colonnes\n')
    if '--construit' in av:
        print('les quatre énoncés, par construction explicite\n')
        for n in ordres:
            m = n // 2
            if m % 2 == 0:
                print(f'  ordre {n:3d} : m = {m} pair, hors sujet')
                continue
            t = lambda r: n - 1 - 2 * r
            un = all(construction(n, r) == (0, m - 2, None) for r in range(m))
            deux = all(construction(n, r, c) == (0, m - 2, n * t(r))
                       for r in range(m) for c in range(m) if c != r)
            trois = [construction(n, r, r) for r in range(m)]
            att = [(0, m - 4, n * t(r)) for r in range(m)]
            print(f'  ordre {n:3d} (m = {m}) : I toute paire a un profil '
                  f'(δ=0, h_r={m - 2}) : {un} ; II colonnes c≠r atteignent '
                  f'C±n|u_r| : {deux} ; III colonne c=r : '
                  f'{"atteinte, h_r=" + str(m - 4) if trois == att else "IMPOSSIBLE"}',
                  flush=True)
        print('\nla colonne diagonale est donc atteignable dès m ≥ 5, et '
              'seulement là :\nà m = 3 il n\'y a que deux orbites hors '
              'diagonale, et le trio n\'existe pas.')
        sys.exit(0)
    if '--geometrie' in av:
        print('la géométrie du quotient, calculée\n')
        for n in ordres:
            g = geometrie(n)
            if g['centre du quotient'] is None:
                print(f'  ordre {n:3d} (m = {g["m"]:2d}, pair) : la grille '
                      f'quotient n\'a pas de centre ; rayons des couches '
                      f'{g["rayons"]}', flush=True)
                continue
            print(f'  ordre {n:3d} (m = {g["m"]:2d}, impair) : centres de '
                  f'quadrants {g["centres de quadrants"]}')
            print(f'            une seule orbite : {g["une seule orbite"]} ; '
                  f'toutes diagonales : {g["toutes diagonales"]} ; '
                  f'au centre du quotient : '
                  f'{g["orbite au centre du quotient"]}')
            print(f'            centre du quotient r = {g["centre du quotient"][0]}, '
                  f'couche la plus serrée r = {g["couche la plus serrée"]} — '
                  f'deux objets distincts', flush=True)
            print(f'            rayons des couches : {g["rayons"]} '
                  f'(ils décroissent de {2 * n})', flush=True)
        print('\nla signature locale modulo 3, sur l\'orbite hors diagonale '
              '(r, c) = (0, 1) :')
        for n in ordres:
            if n // 2 < 2:
                continue
            h, res, tous = signature_mod3(n, 0, 1)
            print(f'  ordre {n:3d} : 3 | n = {n % 3 == 0:5} ; écarts '
                  f'horizontaux {h} ; résidus mod 3 {res} ; '
                  f'tous divisibles par 3 : {tous}', flush=True)
        print('\nla divisibilité par 3 se lit donc dans les états locaux. '
              'Ce que le test par union\ndes résidus sur tous les profils ne '
              'voit pas, faute de finesse.')
        sys.exit(0)
    if '--table' in av:
        print('la table des états d\'orbite, et la borne |b − C| ≤ n·|u_r|\n')
        tc = te = 0
        for n in ordres:
            c, e = table_locale(n)
            tc += c; te += e
            print(f'  ordre {n:3d} : {c:4d} orbites, {e} écart(s) à la table',
                  flush=True)
        print(f'\n{tc} orbites testées, {te} écart(s). La table est donc '
              f'exacte sur ces ordres, et la borne en découle.')
        sys.exit(0 if te == 0 else 1)
    if '--par-colonne' in av:
        print('les bornes sont-elles atteintes COLONNE PAR COLONNE ?\n')
        exceptions = []
        for n in ordres:
            m, C = n // 2, n * n + 1
            g = cellules(n)
            for r in range(m):
                p = profils_de_ligne(n, g, r)
                if not p:
                    continue
                B = n * abs(2 * r - n + 1)
                ko = []
                for c in range(m):
                    v = [ap[c] for ap, _ in p]
                    if not (min(v) == C - B and max(v) == C + B):
                        ko.append((c, min(v) - C, max(v) - C))
                exceptions += [(n, r, c) for c, _, _ in ko]
                print(f'  ordre {n:3d}, paire {r} : borne C±{B} ; colonnes qui '
                      f'ne l\'atteignent pas : {ko if ko else "aucune"}',
                      flush=True)
        if exceptions:
            print('\nexceptions rencontrées : ' + ', '.join(
                f'ordre {o} paire {p} colonne {c}' for o, p, c in exceptions))
            print('la colonne en défaut est la diagonale c = r : '
                  f'{all(p == c for _, p, c in exceptions)}')
        else:
            print('\naucune exception sur les ordres demandés : toutes les '
                  'colonnes atteignent les deux bornes.')
        sys.exit(0)
    if '--apports' in av:
        print('l\'apport d\'une paire de lignes à une colonne : où vit-il ?\n')
        print('  n    r   C=n²+1   n|u_r|      min      max   accord')
        tout = True
        for n in ordres:
            for r, C, B, lo, hi, acc in apports(n):
                tout &= acc
                print(f'{n:4d} {r:4d} {C:8d} {B:8d} {lo:8d} {hi:8d}   '
                      f'{"oui" if acc else "NON"}', flush=True)
        print(f'\naccord partout : {tout}')
        print('les paires sans solution locale d\'écart nul sont omises.')
        sys.exit(0 if tout else 1)
    for n in ordres:
        # l'ordre des paires dépend de m : il se recalcule à chaque n, sinon
        # celui du premier ordre est réutilisé et devient invalide au suivant.
        ordre_n = (list(range(n // 2))[::-1] if '--inverse' in av else ordre)
        print(f'=== ordre {n} (m = {n // 2}) ===', flush=True)
        combien, profs = recollements(n, trace, ordre_n)
        print(f'  recollements complets (lignes ET colonnes magiques, '
              f'II et III) : {combien}', flush=True)
        print()
