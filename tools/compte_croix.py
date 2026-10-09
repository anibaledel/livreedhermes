#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# compte_croix.py — COMBIEN de croix ansées à l'ordre n ?
#
# L'énumération par no-goods de `suite_croix.py` devient impraticable dès
# l'ordre 10. Ici on prend le problème par l'autre bout, en deux temps :
#
#   1. énumérer les figures CANDIDATES par la paramétrisation affine de
#      `compte_figures.py` : les critères de parité forment un système sur
#      GF(2), dont une solution particulière et une base du noyau engendrent
#      directement les 2^(k−rang) figures — 2 à l'ordre 6, 32 à l'ordre 8,
#      2 048 à l'ordre 10, 524 288 à l'ordre 12. On ne parcourt donc plus les
#      2^k configurations : à l'ordre 12 c'est 524 288 au lieu de 2^30 ;
#   2. pour chacune, demander au solveur s'il existe un étiquetage magique
#      auto-construit qui la RÉALISE. La figure étant entièrement fixée, chaque
#      case voit sa classe liée à celle de son miroir, et la propagation est
#      forte.
#
# Le compte des croix ansées d'ordre n est le nombre de candidates réalisables.
# Il vaut 2 à l'ordre 6 et 0 à l'ordre 8, et ces deux valeurs sont retrouvées
# ici indépendamment de `suite_croix.py`, qui procédait par no-goods — à
# condition de passer `--sans-pretest`. Sans ce drapeau, le pré-test conclut
# globalement et le chemin figure par figure n'est pas parcouru : le compte est
# juste, mais il n'est plus un contrôle indépendant. À l'ordre 8, les deux
# chemins ont été menés : 0 par le pré-test, et 32 figures INFEASIBLE une à une.
#
# LES FAMILLES QUI COMPTENT. Aux ordres 6, 8, 10, 12 et 16, l'existence suit
# exactement la parité singulièrement/doublement paire : 2, 0, 2 048, 0, 0. À
# l'ordre 14, un échantillon de 201 figures réparties sur les 2^29 candidates
# les donne toutes réalisables — échantillon aujourd'hui périmé. La
# généralisation n'est PLUS conjecturale : elle est démontrée dans les deux
# sens (`parite.py` au doublement pair, `construction.py` au singulièrement
# pair), et ce script n'en est plus qu'un contrôle indépendant par solveur aux
# ordres 6, 8 et 10. Comme la proportion du tiers du corpus exige en outre
# 6 | n, la suite à indexer
# n'est donc pas celle de tous les ordres pairs — elle serait criblée de zéros
# et de termes non tranchés — mais celle du singulièrement pair, n = 6, 10, 14,
# 18, 22, 26, 30, et à l'intérieur celle des multiples impairs de 6, n = 6, 18,
# 30, 42, là où les deux exigences se rencontrent.
#
# Usage : cd <racine du dépôt> && python tools/compte_croix.py [--ordre N]
#         [--limite S]   temps par figure
#         [--depart K] [--combien J]   pour découper le travail

import itertools, os, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from ortools.sat.python import cp_model                  # noqa: E402
from graine_sat import CLASSES, valeur, controle         # noqa: E402
from croix_ansee_n import orbites, traits, par_ligne, par_colonne  # noqa: E402
from compte_figures import engendre, resout              # noqa: E402

H_PART = {'B': 'J', 'J': 'B', 'R': 'V', 'V': 'R'}
V_PART = {'B': 'V', 'V': 'B', 'R': 'J', 'J': 'R'}


def candidates(n, depart=0, combien=None, verifie=True):
    """Les figures tenant les critères II et III, par la base du noyau.

    C'est un GÉNÉRATEUR, et il doit le rester : à l'ordre 14 il y a 2^29
    figures, et les matérialiser en liste annulerait tout le bénéfice de la
    paramétrisation. `--depart` et `--combien` passent par itertools.islice,
    de sorte qu'un lot au milieu de l'espace ne fabrique pas ce qui le
    précède."""
    orbs = orbites(n)
    for bits in engendre(n, depart, combien):
        t = traits(n, orbs, bits)
        if verifie and not (all(par_ligne(t, r) % 2 == 1 for r in range(n))
                            and all(par_colonne(t, c) % 2 == 1
                                    for c in range(n))):
            raise AssertionError('la paramétrisation rend une figure non conforme')
        yield t


def combien_de_candidates(n):
    """Le compte sans énumération : 2^(k − rang), par le théorème."""
    r = resout(n)
    return 0 if r is None else 2 ** len(r[3])


def realisable(n, figure, limite=60.0):
    """Existe-t-il un étiquetage magique auto-construit réalisant cette figure ?"""
    M = n * (n * n + 1) // 2
    m = cp_model.CpModel()
    x = {(r, c, k): m.NewBoolVar('')
         for r in range(n) for c in range(n) for k in CLASSES}
    for r in range(n):
        for c in range(n):
            m.AddExactlyOne(x[r, c, k] for k in CLASSES)

    def somme(cellules):
        return sum(valeur(k, r, c, n) * x[r, c, k]
                   for r, c in cellules for k in CLASSES)

    for i in range(n):
        m.Add(somme([(i, c) for c in range(n)]) == M)
        m.Add(somme([(r, i) for r in range(n)]) == M)
    m.Add(somme([(i, i) for i in range(n)]) == M)
    m.Add(somme([(i, n - 1 - i) for i in range(n)]) == M)
    for k in range(n):
        for j in range(n):
            m.AddExactlyOne([x[k, j, 'B'], x[k, n - 1 - j, 'V'],
                             x[n - 1 - k, n - 1 - j, 'R'],
                             x[n - 1 - k, j, 'J']])

    diag = {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}
    # les diagonales s'apparient par demi-tour : même classe
    for (r, c) in diag:
        for k in CLASSES:
            m.AddImplication(x[r, c, k], x[n - 1 - r, n - 1 - c, k])
    # chaque case hors diagonale est appariée comme la figure le dit
    for (r, c) in ((r, c) for r in range(n) for c in range(n)
                   if (r, c) not in diag):
        horiz = frozenset({(r, c), (r, n - 1 - c)}) in figure
        for k in CLASSES:
            if horiz:
                m.AddImplication(x[r, c, k], x[r, n - 1 - c, H_PART[k]])
            else:
                m.AddImplication(x[r, c, k], x[n - 1 - r, c, V_PART[k]])

    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limite
    s.parameters.num_search_workers = 8
    etat = s.Solve(m)
    if etat not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return s.StatusName(etat), None
    return s.StatusName(etat), [
        ''.join(next(k for k in CLASSES if s.Value(x[r, c, k]))
                for c in range(n)) for r in range(n)]


def main():
    av = sys.argv
    n = int(av[av.index('--ordre') + 1]) if '--ordre' in av else 6
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 60.0
    depart = int(av[av.index('--depart') + 1]) if '--depart' in av else 0
    combien = int(av[av.index('--combien') + 1]) if '--combien' in av else None
    sans_pretest = '--sans-pretest' in av

    t0 = time.time()
    # pré-test : si aucun carré ne satisfait I + II + III, le compte est 0 sans
    # énumération des figures candidates. Il court-circuite donc le chemin
    # figure par figure, qui est le contrôle INDÉPENDANT de `suite_croix.py` :
    # `--sans-pretest` le désactive pour retrouver ce chemin.
    if not sans_pretest:
        from croix_existence import essai
        nom, mots, _ = essai(n, limite)
        if mots is None and nom == 'INFEASIBLE':
            print(f'ordre {n} : aucune croix ansée — le modèle complet est '
                  f'INFEASIBLE, inutile d’énumérer les figures. '
                  f'--sans-pretest force l’examen figure par figure, qui est '
                  f'le chemin indépendant de suite_croix.py')
            return
    total = combien_de_candidates(n)
    print(f'ordre {n} : {total} figures candidates '
          f'(critères II–III tenus)   [{time.time() - t0:.0f} s]', flush=True)
    lot = candidates(n, depart, combien)
    vus = oui = non = flou = 0
    for i, f in enumerate(lot, depart):
        vus += 1
        nom, mots = realisable(n, f, limite)
        if mots is not None:
            _, ok = controle(mots, n)
            if not ok:
                print('réalisation non magique', file=sys.stderr)
                sys.exit(1)
            oui += 1
        elif nom == 'INFEASIBLE':
            non += 1
        else:
            flou += 1
        if vus % 50 == 0:
            print(f'  {i + 1}/{total} : réalisables {oui}, '
                  f'impossibles {non}, non tranchées {flou}   '
                  f'[{time.time() - t0:.0f} s]', flush=True)
    print(f'  {depart + vus}/{total} : réalisables {oui}, impossibles {non}, '
          f'non tranchées {flou}   [{time.time() - t0:.0f} s]', flush=True)
    print(f'\nordre {n} — croix ansées : {oui} réalisables sur {vus} '
          f'figures examinées ; {non} impossibles, {flou} non tranchées')
    if vus < total:
        print(f'  lot partiel : {vus} figures sur {total} ; '
              f'relancer avec --depart {depart + vus}')
    if flou:
        print('  le compte n’est pas exhaustif : '
              f'{flou} figures restent non tranchées')


if __name__ == '__main__':
    main()
