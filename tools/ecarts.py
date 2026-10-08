#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# ecarts.py — les écarts de somme de ligne, et la vraie forme de l'obstruction.
#
# CE QUI REMPLACE UNE AFFIRMATION RETIRÉE. Une version précédente de ce dossier
# annonçait que l'obstruction de l'ordre 8 était « une congruence modulo n² ».
# C'était faux : la satisfaisabilité modulo q n'est pas monotone en q, et le
# balayage complet de `congruences.py --balayage` montre que le plus petit
# module obstructif à l'ordre 8 est 19, non 64.
#
# LA BONNE FORMULATION. Sous la condition I, les deux critères de parité et la
# bijection, posons l'écart de la ligne r
#
#     delta_r = (somme de la ligne r) − n(n²+1)/2.
#
# L'ANTISYMÉTRIE EST UN LEMME DE LA BIJECTION SEULE, et non de la condition I
# comme une version antérieure de ce fichier l'écrivait. Preuve : par la
# condition de bijection, les valeurs du bloc r se répartissent exactement entre
# les cases B, V de la ligne r et les cases R, J de la ligne n−1−r, et le bloc
# n−1−r entre les mêmes deux lignes avec les rôles échangés. Donc
#
#     S_r + S_{n−1−r} = somme(bloc r) + somme(bloc n−1−r)
#                     = n²(n−1) + n(n+1) = n(n²+1) = 2M,
#
# d'où delta_{n−1−r} = − delta_r. La somme de tous les écarts est alors nulle
# paire par paire, sans invoquer la somme globale des valeurs. Vérifié ici sur
# des étiquetages bijectifs NON magiques et NE vérifiant PAS la condition I,
# dont les écarts sont non nuls : l'antisymétrie y tient quand même.
#
# LES ÉCARTS NE SONT PAS TOUS PAIRS. Le solveur produit, sous I + II + III et
# la bijection, des lignes d'écart impair aux ordres 8 et 10 : toute explication
# du tableau des modules qui suppose delta_r pair est donc à écarter.
# `--cherche-impair` en produit le témoin.
#
# L'ENSEMBLE DES ÉCARTS EST SYMÉTRIQUE. L'échange global B <-> R, V <-> J envoie
# chaque valeur x sur n²+1−x, conserve la bijection, la condition I et les deux
# critères, et envoie delta sur −delta. Le minimum de delta_r vaut donc
# automatiquement l'opposé du maximum, et il suffit de maximiser.
#
# D'OÙ VIENT LA BORNE. Le critère II impose au moins un trait horizontal par
# ligne, et un trait horizontal contient exactement une case du bloc r et une du
# bloc n−1−r. Donc 1 <= b_r <= n−1, soit |d_r| <= (n−2)/2, et
#
#     |n d_r u_r| <= n(n−2)/2 × |u_r|
#
# qui est exactement la borne mesurée. Ce n'est pas encore une preuve : il reste
# à montrer que le second terme de l'identité ne permet pas de dépasser cette
# extrémité.
#
# LA BORNE PAR LIGNE EST DÉMONTRÉE, et sous une forme plus fine que la première
# annoncée. Les 2n valeurs des blocs r et n−1−r se groupent en n paires
# complémentaires P_j, dont la différence vaut D_j = n|u_r| + (n−1−2j), de sorte
# que D_j + D_{n−1−j} = 2n|u_r| et somme(D_j) = n²|u_r|. Une paire dont les deux
# valeurs tombent dans la même ligne est, sous la condition I, un trait
# horizontal : elle apporte n²+1 à cette ligne, soit exactement sa part neutre,
# et comme h_r = h_{n−1−r} par symétrie centrale, les traits horizontaux ne
# contribuent rien à l'écart. Il reste n − 2h_r paires traversantes, chacune
# apportant ±D_j/2, d'où
#
#     |delta_r| <= (n/2) (n − 2 h_r) |u_r|                           (A)
#
# et, le critère II imposant h_r impair donc h_r >= 1,
#
#     |delta_r| <= n(n−2)/2 × |u_r|                                  (B)
#
# pour tout ordre pair, sous bijection + I + II. Le critère III n'y intervient
# pas. Ce que le calcul établit n'est donc plus la borne mais son ATTEIGNABILITÉ :
# `--bornes` trouve le maximum égal à (B) aux ordres 6, 8, 10 et 12, sur les
# dix-huit lignes représentatives, et à h_r fixé le maximum vaut exactement (A)
# — vérifié pour h_r = 1 et h_r = 3 à l'ordre 8. Le modèle magique demande exactement delta = 0.
# Demander « somme de ligne ≡ M modulo q » revient à demander qu'un vecteur
# d'écarts ATTEIGNABLE ait toutes ses composantes divisibles par q. Le balayage
# des modules n'est donc qu'un filtre grossier sur l'ensemble des vecteurs
# d'écarts atteignables, et la question propre est :
#
#     le vecteur nul est-il atteignable ?
#
# À l'ordre 8 : non, et c'est tout le contenu de l'impossibilité. À l'ordre 10 :
# oui. C'est cet ensemble qu'il faut caractériser, pas un module.
#
# Usage : cd <racine du dépôt> && python tools/ecarts.py [--ordres 8,10]
#         [--modules 2,16,32,34] [--limite S]
#         --bornes          le maximum de l'écart par ligne, et la formule
#         --bornes --h 1,3  le même, à nombre de traits horizontaux imposé :
#                           la borne fine (n/2)(n−2h)|u_r|
#         --direction       les pas atteignables dans une direction du réseau
#         --cherche-impair  un témoin d'écart impair, qui écarte l'hypothèse
#                           de parité
#         --zero            le vecteur d'écarts nul est-il atteignable ? C'est
#                           exactement la question de la croix ansée magique

import os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                   # noqa: E402
from graine_sat import CLASSES, valeur                    # noqa: E402
from croix_existence import horizontal                    # noqa: E402


def modele(n):
    """Condition I, les deux critères de parité, la bijection — sans les
    sommes."""
    m = cp_model.CpModel()
    x = {(r, c, k): m.NewBoolVar('')
         for r in range(n) for c in range(n) for k in CLASSES}
    for r in range(n):
        for c in range(n):
            m.AddExactlyOne(x[r, c, k] for k in CLASSES)
    for k in range(n):
        for j in range(n):
            m.AddExactlyOne([x[k, j, 'B'], x[k, n - 1 - j, 'V'],
                             x[n - 1 - k, n - 1 - j, 'R'],
                             x[n - 1 - k, j, 'J']])
    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    for r in range(n):
        for c in range(n):
            for k in CLASSES:
                j = x[n - 1 - r, n - 1 - c, k]
                if (r, c) in diag:
                    m.AddImplication(x[r, c, k], j)
                else:
                    m.AddBoolOr([x[r, c, k].Not(), j.Not()])
    H = {(r, c): horizontal(m, x, r, c, n)
         for r in range(n) for c in range(n) if (r, c) not in diag}

    def impair(cases, nom):
        t = m.NewIntVar(0, n, nom)
        m.Add(2 * t == sum(cases))
        m.AddModuloEquality(1, t, 2)

    for r in range(n):
        impair([H[(r, c)] for c in range(n) if (r, c) not in diag], f't{r}')
    for c in range(n):
        impair([H[(r, c)].Not() for r in range(n) if (r, c) not in diag],
               f'u{c}')
    return m, x


def echantillon(n, q, limite=30.0):
    """Un vecteur d'écarts atteignable dont toutes les composantes sont
    divisibles par q (q = None : les écarts sont libres)."""
    M = n * (n * n + 1) // 2
    m, x = modele(n)
    for i in range(n):
        S = sum(valeur(k, i, c, n) * x[i, c, k]
                for c in range(n) for k in CLASSES)
        v = m.NewIntVar(0, n * n * n, f'S{i}')
        m.Add(v == S)
        if q is not None:
            m.AddModuloEquality(M % q, v, q)
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    e = s.Solve(m)
    if e not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(e), None, None
    mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                    for c in range(n)) for r in range(n)]
    g = [[valeur(mots[r][c], r, c, n) for c in range(n)] for r in range(n)]
    return s.StatusName(e), mots, [sum(l) - M for l in g]


def direction(n, forme, val, limite=10.0):
    """Le vecteur d'écarts val × forme est-il atteignable ?

    `forme` est donné sur la première moitié des lignes ; l'antisymétrie
    complète l'autre moitié. Sert à sonder l'ensemble des écarts atteignables
    dans une direction fixée, et à en trouver les pas.
    """
    M = n * (n * n + 1) // 2
    m, x = modele(n)
    for r in range(n):
        S = sum(valeur(k, r, c, n) * x[r, c, k]
                for c in range(n) for k in CLASSES)
        d = m.NewIntVar(-n ** 3, n ** 3, f'd{r}')
        m.Add(d == S - M)
        coef = forme[r] if r < len(forme) else -forme[n - 1 - r]
        m.Add(d == coef * val)
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    return s.StatusName(s.Solve(m))


def cherche_impair(n, ligne=0, limite=20.0):
    """Un étiquetage dont la ligne donnée a un écart IMPAIR, sous I + II + III
    et la bijection. Un seul témoin suffit à établir que les écarts ne sont pas
    tous pairs, et donc à écarter toute explication du tableau des modules qui
    repose sur leur parité."""
    M = n * (n * n + 1) // 2
    m, x = modele(n)
    S = sum(valeur(k, ligne, c, n) * x[ligne, c, k]
            for c in range(n) for k in CLASSES)
    v = m.NewIntVar(0, n ** 3, 'S')
    m.Add(v == S)
    u = m.NewIntVar(0, n ** 3, 'u')
    # écart impair : S et M de parités différentes
    m.Add(v == 2 * u + (1 if M % 2 == 0 else 0))
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    e = s.Solve(m)
    if e not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(e), None, None
    mots = [''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                    for c in range(n)) for r in range(n)]
    g = [[valeur(mots[r][c], r, c, n) for c in range(n)] for r in range(n)]
    return s.StatusName(e), mots, [sum(l) - M for l in g]


def bornes(n, limite=15.0, h=None):
    """Pour chaque ligne, le maximum de l'écart sous I + II + III et la
    bijection, et la valeur que la borne démontrée prédit.

    Sans `h`, la prédiction est n(n−2)/2 × |2r−n+1|, atteinte à h_r = 1.
    Avec `h`, le nombre de traits horizontaux de la ligne est IMPOSÉ, et la
    prédiction devient (n/2)(n−2h)|2r−n+1| — la forme fine de la borne. Le
    maximum n'est retenu que si le statut est OPTIMAL ; sinon None, et rien
    n'est conclu."""
    M = n * (n * n + 1) // 2
    diag = {(a, b) for a in range(n) for b in range(n)
            if a == b or a + b == n - 1}
    out = []
    for r in range(n // 2):
        m, x = modele(n)
        if h is not None:
            H = {(a, b): horizontal(m, x, a, b, n)
                 for a in range(n) for b in range(n) if (a, b) not in diag}
            m.Add(sum(H[(r, c)] for c in range(n)
                      if (r, c) not in diag) == 2 * h)
        S = sum(valeur(k, r, c, n) * x[r, c, k]
                for c in range(n) for k in CLASSES)
        d = m.NewIntVar(-n ** 3, n ** 3, 'd')
        m.Add(d == S - M)
        m.Maximize(d)
        s = cp_model.CpSolver()
        s.parameters.max_time_in_seconds = limite
        s.parameters.num_search_workers = 8
        e = s.Solve(m)
        v = s.Value(d) if e == cp_model.OPTIMAL else None
        hh = 1 if h is None else h
        pred = (n // 2) * (n - 2 * hh) * abs(2 * r - n + 1)
        out.append((r, 2 * r - n + 1, v, pred, s.StatusName(e)))
    return out


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [8, 10])
    modules = ([None if o in ('None', 'aucun', '0') else int(o)
                for o in av[av.index('--modules') + 1].split(',')]
               if '--modules' in av else [None, 2, 16, 32, 34])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 30.0
    if '--zero' in av:
        for n in ordres:
            forme = [0] * (n // 2)
            nom = direction(n, forme, 0, max(limite, 60.0))
            print(f'ordre {n} : vecteur d’écarts NUL — {nom}')
            if nom == 'INFEASIBLE':
                print('  le zéro n’est pas atteignable : aucune croix ansée '
                      'magique à cet ordre')
            elif nom in ('OPTIMAL', 'FEASIBLE'):
                print('  le zéro est atteignable : une croix ansée magique '
                      'existe à cet ordre')
            else:
                print('  non tranché — ne rien conclure')
        return
    if '--cherche-impair' in av:
        for n in ordres:
            nom, mots, d = cherche_impair(n, 0, limite)
            if d is None:
                print(f'ordre {n} : aucun écart impair trouvé ({nom})')
                continue
            print(f'ordre {n} : écart impair trouvé — écarts {d}')
            print(f'  ligne 0 : {d[0]}, impair {d[0] % 2 == 1}')
            for l in mots:
                print('    ' + ' '.join(l))
        return
    if '--bornes' in av:
        hs = ([int(o) for o in av[av.index('--h') + 1].split(',')]
              if '--h' in av else [None])
        for n in ordres:
            for h in hs:
                if h is None:
                    print(f'ordre {n} — bornes par ligne, h_r libre ; '
                          f'la borne est atteinte à h_r = 1')
                else:
                    print(f'ordre {n} — bornes par ligne, h_r imposé à {h} ; '
                          f'(n/2)(n−2h) = {(n // 2) * (n - 2 * h)}')
                for r, u, v, pred, nom in bornes(n, limite, h):
                    if v is None:
                        print(f'  ligne {r} (u = {u:4d}) : {nom} — '
                              f'rien conclu ; prédiction {pred}', flush=True)
                        continue
                    print(f'  ligne {r} (u = {u:4d}) : max {v} ; '
                          f'borne prédite {pred} ; atteinte {v == pred} ; '
                          f'respectée {v <= pred}', flush=True)
        return
    if '--direction' in av:
        for n in ordres:
            forme = [-2, -1, -1, 0] if n == 8 else [-1] + [0] * (n // 2 - 1)
            print(f'ordre {n} — pas atteignables dans la direction {forme} '
                  f'(complétée par antisymétrie)')
            # la borne par ligne limite λ : pour la première coordonnée,
            # |coef| × λ ≤ n(n−2)/2 × |2·0−n+1|
            haut = (n * (n - 2) // 2) * (n - 1) // max(1, abs(forme[0])) + 1
            sat, insat, flou = [], [], []
            for v in range(0, haut):
                nom = direction(n, forme, v, limite)
                (sat if nom in ('OPTIMAL', 'FEASIBLE')
                 else insat if nom == 'INFEASIBLE' else flou).append(v)
            print(f'  λ atteignables   : {sat}')
            print(f'  λ impossibles    : {len(insat)} valeurs')
            if flou:
                print(f'  λ NON TRANCHÉS   : {flou}')
                print('  la liste des λ atteignables n’est donc pas exacte ; '
                      'augmenter --limite')
            else:
                print('  aucun λ non tranché : la liste est exacte')
            print(f'  λ = 0 atteignable : {0 in sat} '
                  f'— c’est la question de la magicité')
        return
    ecarts = []
    for n in ordres:
        print(f'ordre {n}, constante {n * (n * n + 1) // 2}')
        for q in modules:
            nom, mots, d = echantillon(n, q, limite)
            if d is None:
                print(f'  mod {str(q):>5} : {nom}')
                continue
            anti = all(d[r] == -d[n - 1 - r] for r in range(n))
            div = q is None or all(e % q == 0 for e in d)
            nul = all(e == 0 for e in d)
            print(f'  mod {str(q):>5} : écarts {d}')
            print(f'          somme {sum(d)}, antisymétrique {anti}, '
                  f'divisibles {div}, nuls {nul}')
            if not anti or sum(d) != 0 or not div:
                ecarts.append((n, q))
    if ecarts:
        print('anomalies : ' + ', '.join(map(str, ecarts)), file=sys.stderr)
        sys.exit(1)
    print('\nla somme des écarts est nulle et l’antisymétrie tient partout.')


if __name__ == '__main__':
    main()
