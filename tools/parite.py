#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# parite.py — pourquoi la parité de n/2 décide. Le théorème, et son contrôle.
#
# LE THÉORÈME. Sous la bijection, la condition I et le critère II, l'écart de la
# PREMIÈRE paire de lignes ne peut s'annuler que si n/2 est impair. Il n'y a
# donc aucune croix ansée magique aux ordres doublement pairs — à tout ordre
# doublement pair, et non seulement à ceux qu'un solveur a tranchés.
#
# LA PREUVE. Posons m = n/2, C = n²+1, et numérotons de 0 à n−1 les n paires
# complémentaires P_j = {j+1, C−(j+1)} dont les deux membres occupent les blocs
# 0 et n−1, c'est-à-dire les lignes 0 et n−1. Leur différence est
#
#       D(j) = C − 2(j+1) = n² − 1 − 2j,   impaire puisque n est pair.
#
# Une paire horizontale apporte à la ligne 0 ses deux membres, soit C ; une
# paire traversante lui apporte un seul membre, soit C/2 ± D(j)/2. Avec h
# paires horizontales dans la ligne 0 et n − 2h paires traversantes,
#
#       δ_0 = S_0 − nC/2 = ½ Σ_{j traversante} σ_j D(j),   σ_j = ±1,
#
# où σ_j = +1 quand la ligne 0 reçoit le grand membre. La condition I apparie
# les indices : j et n−1−j sont horizontales ensemble, ou traversantes
# ensemble (c'est le lemme des orbites, et le contrôle ci-dessous le vérifie
# case par case). Les indices traversants se groupent donc en couples
# {j, n−1−j}, et comme D(j) + D(n−1−j) = 2n(n−1) :
#
#   — un couple de même signe σ apporte σ·n(n−1) ;
#   — un couple de signes opposés apporte ±(n−1−2j), un nombre impair.
#
# D'où, exactement,
#
#       δ_0 = n(n−1)·A + W,   A = somme des signes des couples de même signe,
#                             W = somme des apports des couples opposés.
#
# Or |W| ≤ (n−1) + (n−3) + … + 1 = m², tandis que n(n−1) = 4m² − 2m > m² dès
# m ≥ 1. Si A ≠ 0, le premier terme l'emporte et δ_0 ≠ 0. Donc
#
#       δ_0 = 0  ⟹  A = 0  et  W = 0.
#
# A = 0 force un nombre PAIR de couples de même signe ; W = 0, somme de t
# nombres impairs, force t PAIR. Le nombre total de couples traversants,
# m − h, est donc pair. Et le critère II veut h impair. Donc m est impair. ∎
#
# CE QUE CELA DONNE. La conjecture « la parité de n/2 décide de la
# réalisabilité » est démontrée dans son sens négatif : aux ordres doublement
# pairs, rien n'existe, et il n'y a plus d'ordre à trancher un par un. Le sens
# positif — à tout ordre singulièrement pair, une croix ansée magique existe —
# est démontré exhaustivement, figure par figure, aux ordres 6 et 10 seulement ;
# vérifié sur 201 figures échantillonnées à l'ordre 14 ; et aux ordres 18, 22,
# 26 et 30 on n'a que des témoins d'existence d'une croix ansée, ce qui n'est
# pas la réalisation de toutes les figures candidates. L'ordre 34 n'a pas de
# témoin de croix ansée du tout.
#
# CE QUE CELA NE DIT PAS. Que δ = 0 suffise à la magicité : les colonnes
# restent à contrôler, et un témoin d'ordre 6 a δ = 0 avec des colonnes
# fausses. Mais δ_0 = 0 est nécessaire, et c'est tout ce que la preuve emploie.
#
# Usage : cd <racine du dépôt> && python tools/parite.py
#         python tools/parite.py --ordres 4,6,8,...,26   (le compte par ordre)
#
# Aucune dépendance : Python nu.

import sys, os, itertools

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from reseau import orbites, etats, valeur, CLASSES, H_PARTENAIRE  # noqa: E402


def configurations(n):
    """Toutes les configurations de la paire de lignes (0, n−1) admissibles
    sous bijection + condition I, une par une."""
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    orbs = [o for o in orbites(n) if any(a == 0 for a, _ in o)]
    jeux = [etats(n, o, brut=True) for o in orbs]
    for combo in itertools.product(*jeux):
        cl = {}
        for d in combo:
            cl.update(d)
        yield cl, diag


def analyse(n, cl, diag):
    """Pour une configuration : l'écart de la ligne 0, et les quantités de la
    preuve — A, W, le nombre de couples opposés t, celui de couples de même
    signe, et le nombre h de traits horizontaux."""
    M = n * (n * n + 1) // 2
    S = sum(valeur(k, a, c, n) for (a, c), k in cl.items() if a == 0)
    horiz = set()
    sig = {}
    h = 0
    for (a, c), k in cl.items():
        if a != 0:
            continue
        v = valeur(k, a, c, n)
        j = v - 1 if v <= n else n * n - v          # l'indice de la paire P_j
        if (a, c) not in diag and cl[(a, n - 1 - c)] == H_PARTENAIRE[k]:
            horiz.add(j)
            h += 1
        else:
            sig[j] = +1 if v > n else -1           # +1 : le grand membre
    h //= 2                                        # chaque trait, deux cases
    A = W = t = meme = 0
    vus = set()
    for j in list(sig):
        jb = n - 1 - j
        if j in vus:
            continue
        vus |= {j, jb}
        if jb not in sig:                          # jamais : lemme des orbites
            return None
        jj = min(j, jb)
        if sig[j] == sig[jb]:
            A += sig[jj]
            meme += 1
        else:
            t += 1
            W += sig[jj] * (n - 1 - 2 * jj)
    return S - M, A, W, t, meme, h


def controle(n):
    """Vérifie, sur toutes les configurations de la première paire de lignes :
    l'appariement des indices, l'identité δ_0 = n(n−1)·A + W, et les trois
    conséquences employées par la preuve."""
    total = nuls = 0
    for cl, diag in configurations(n):
        a = analyse(n, cl, diag)
        if a is None:
            raise AssertionError(f'ordre {n} : indices traversants non appariés')
        d0, A, W, t, meme, h = a
        if d0 != n * (n - 1) * A + W:
            raise AssertionError(f'ordre {n} : identité fausse, {d0} ≠ '
                                 f'{n * (n - 1) * A + W}')
        if h % 2 == 0:
            continue                               # critère II
        total += 1
        if d0 == 0:
            nuls += 1
            if A != 0 or W != 0 or t % 2 or meme % 2:
                raise AssertionError(f'ordre {n} : A={A} W={W} t={t} '
                                     f'même={meme}')
            if (n // 2) % 2 == 0:
                raise AssertionError(f'ordre {n} : écart nul avec n/2 pair')
    return total, nuls


def classes_orbite(n, orbite):
    """Les états admissibles d'une orbite de la première paire de lignes,
    rangés par ce que la preuve regarde : horizontale, ou traversante avec les
    deux membres que la ligne 0 reçoit tous deux grands (++) ou tous deux
    petits (−−), ou de signes opposés."""
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    rang = {'horizontal': [], '++': [], '--': [], 'oppose': []}
    for cl in etats(n, orbite, brut=True):
        hor = [k for (a, c), k in cl.items()
               if a == 0 and (a, c) not in diag
               and cl[(a, n - 1 - c)] == H_PARTENAIRE[k]]
        if hor:
            rang['horizontal'].append(cl)
            continue
        sg = sorted(+1 if valeur(k, a, c, n) > n else -1
                    for (a, c), k in cl.items() if a == 0)
        rang['++' if sg == [1, 1] else
             '--' if sg == [-1, -1] else 'oppose'].append(cl)
    return rang


def reciproque(n):
    """La réciproque locale, par construction : pour m = n/2 impair, on met une
    orbite horizontale et autant d'orbites ++ que d'orbites −−, ce qui donne
    A = 0 et W = 0, donc δ_0 = 0. Renvoie l'étiquetage construit de la paire de
    lignes, et son écart."""
    m = n // 2
    if m % 2 == 0:
        return None, None
    diag = {(a, a) for a in range(n)} | {(a, n - 1 - a) for a in range(n)}
    orbs = [o for o in orbites(n) if any(a == 0 for a, _ in o)]
    # l'orbite diagonale ne porte pas de trait : la seule horizontale demandée
    # par le critère II va sur une orbite non diagonale, et le reste — l'orbite
    # diagonale comprise — se partage à parts égales entre ++ et −−.
    hors = [o for o in orbs if not any(p in diag for p in o)]
    sur = [o for o in orbs if any(p in diag for p in o)]
    ordre = [hors[0]] + hors[1:] + sur
    besoins = ['horizontal'] + ['++'] * ((m - 1) // 2) + ['--'] * ((m - 1) // 2)
    cl = {}
    for o, besoin in zip(ordre, besoins):
        r = classes_orbite(n, o)
        if not r[besoin]:
            return None, f'aucun état « {besoin} » disponible sur une orbite'
        cl.update(r[besoin][0])
    M = n * (n * n + 1) // 2
    S = sum(valeur(k, a, c, n) for (a, c), k in cl.items() if a == 0)
    lignes = [''.join(cl[(a, c)] for c in range(n)) for a in (0, n - 1)]
    return lignes, S - M


if __name__ == '__main__':
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [4, 6, 8, 10])
    print('la première paire de lignes, configuration par configuration :\n'
          "  l'identité δ_0 = n(n−1)·A + W, et ses conséquences\n")
    for n in ordres:
        total, nuls = controle(n)
        m = n // 2
        print(f'  ordre {n:3d} (n/2 = {m:2d}, '
              f'{"impair" if m % 2 else "pair":6s}) : '
              f'{total:9d} configurations à h impair, dont {nuls:7d} '
              f"d'écart nul — identité vérifiée partout", flush=True)
    print('\naucun écart nul à n/2 pair, comme le théorème le demande.')
    print('\nla réciproque locale, par construction, aux ordres impairs en m :')
    for n in [6, 10, 14, 18, 22, 26, 30, 34]:
        lignes, d = reciproque(n)
        if lignes is None:
            print(f'  ordre {n:3d} : {d}')
            continue
        assert d == 0, (n, d)
        print(f'  ordre {n:3d} : δ_0 = {d}   ligne 0 = {lignes[0]}', flush=True)
    print('\ndonc à m impair la première paire de lignes n\'oppose plus '
          'd\'obstacle : le théorème est exact, et non seulement nécessaire.')
