#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# temoins.py — fabrique le fichier de témoins du dépôt.
#
# POURQUOI. Les résultats POSITIFS de ce travail sont des objets finis : une
# graine, une croix ansée, un contre-exemple. Chacun se revérifie en quelques
# lignes de bibliothèque standard, sans solveur et sans installer quoi que ce
# soit. Celle des résultats NÉGATIFS qui porte sur les ordres doublement pairs a
# désormais la preuve la plus courte du dossier — voir `parite.py`. Ce qui n'a
# toujours pas de certificat court, c'est « aucun étiquetage à l'ordre 2 » et
# « les 32 figures de l'ordre 8 sont toutes impossibles », figure par figure :
# ceux-là ne sont reproductibles qu'en relançant CP-SAT. Le dépôt doit donc distinguer les deux, et ce script
# produit la moitié certifiable.
#
# Ce script-ci demande `ortools` ; `verifie_temoins.py`, qui relit son fichier,
# n'utilise que la bibliothèque standard. C'est tout l'intérêt : un lecteur
# contrôle sans rien installer les énoncés d'existence du papier. Les
# impossibilités n'ont pas de certificat court, sauf celle du doublement pair,
# qui est désormais démontrée et contrôlée par parite.py.
#
# Usage : cd <racine du dépôt> && python tools/temoins.py [--ordres 4,6,10,14]
#         [--limite S]   écrit data/temoins.json

import json, os, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from graine_sat import cherche, controle                   # noqa: E402
from croix_existence import essai as essai_croix           # noqa: E402
from ligne_necessaire import essai as essai_ligne          # noqa: E402
from parite_suit import contre_exemple                     # noqa: E402
from profils import cherche as cherche_profil              # noqa: E402

# le témoin d'indépendance de la planche : les deux égalités d'équilibrage
# tenues, la bijection violée
TEMOIN_INDEPENDANCE = ['BJRBVR', 'BRVVJR', 'VJBJRB', 'VRRVJB', 'VRJVJB',
                       'JJBBRV']


def ajoute(out, genre, n, mots, enonce, extra=None):
    if mots is None:
        return False
    d = {'genre': genre, 'ordre': n, 'etiquetage': list(mots),
         'enonce': enonce}
    if extra:
        d.update(extra)
    out.append(d)
    print(f'  {genre} ordre {n} : retenu', flush=True)
    return True


def main():
    av = sys.argv
    ordres = ([int(o) for o in av[av.index('--ordres') + 1].split(',')]
              if '--ordres' in av else [4, 6, 10, 14])
    limite = float(av[av.index('--limite') + 1]) if '--limite' in av else 600.0
    t0 = time.time()
    out = []

    out.append({'genre': 'independance', 'ordre': 6,
                'etiquetage': TEMOIN_INDEPENDANCE,
                'enonce': 'les deux égalités d’équilibrage sont tenues par '
                          'ligne et par colonne, et la bijection échoue : '
                          'elles ne l’impliquent donc pas'})

    for n in ordres:
        print(f'ordre {n} …', flush=True)
        nom, mots = cherche(n, limite)
        ajoute(out, 'graine', n, mots,
               f'étiquetage magique à quatre classes d’ordre {n}')

        nom, mots, _ = essai_croix(n, limite)
        ajoute(out, 'croix_ansee', n, mots,
               f'étiquetage magique d’ordre {n} portant une croix ansée : '
               f'condition I, et un nombre impair de traits par ligne et par '
               f'colonne')

        # contre-exemple à l'égalité de ligne, au centre
        for ligne in range(n // 2 - 1, -1, -1):
            nom, mots = essai_ligne(n, ligne, n // 2 + 1, limite / 4)
            if mots is not None:
                ajoute(out, 'ligne_non_necessaire', n, mots,
                       f'étiquetage magique d’ordre {n} dont la ligne {ligne} '
                       f'compte {n // 2 + 1} cases de classe B ou V au lieu de '
                       f'{n // 2} : l’égalité d’effectifs par ligne n’est pas '
                       f'nécessaire',
                       {'ligne': ligne, 'effectif_attendu': n // 2,
                        'effectif_obtenu': n // 2 + 1})
                break

        # contre-exemple à « la condition I entraîne la parité »
        for sens in ('ligne', 'colonne'):
            for i in range(n // 2 - 1, -1, -1):
                nom, mots = contre_exemple(n, sens, i, limite / 4)
                if mots is not None:
                    ajoute(out, 'parite_non_impliquee', n, mots,
                           f'étiquetage magique d’ordre {n} vérifiant la '
                           f'condition I dont la {sens} {i} porte un nombre '
                           f'PAIR de traits : la condition I n’entraîne pas '
                           f'les critères de parité',
                           {'sens': sens, 'indice': i})
                    break
            else:
                continue
            break

        # contre-exemple au profil symétrique, si l'ordre s'y prête
        if n >= 10:
            demi = n * n // 2
            for a in (demi // 2 + 1, demi // 2 + 3):
                nom, mots = cherche_profil(n, a, limite / 6)
                if mots is not None:
                    ajoute(out, 'profil_symetrique', n, mots,
                           f'étiquetage magique d’ordre {n} de profil '
                           f'({a}, {a}, {demi - a}, {demi - a})',
                           {'profil': [a, a, demi - a, demi - a]})
                    break

    for d in out:
        g, ok = controle(d['etiquetage'], d['ordre'])
        d['magique'] = bool(ok)

    chemin = os.path.join(os.path.dirname(ICI), 'data', 'temoins.json')
    if not os.path.isdir(os.path.dirname(chemin)):
        chemin = os.path.join(ICI, 'temoins.json')
    json.dump({'temoins': out}, open(chemin, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'\n{len(out)} témoins écrits dans {chemin}   '
          f'[{time.time() - t0:.0f} s]')
    print('contrôle à la volée : '
          f'{sum(1 for d in out if d["magique"])} magiques sur {len(out)} '
          '(le témoin d’indépendance ne l’est pas, et c’est son objet)')


if __name__ == '__main__':
    main()
