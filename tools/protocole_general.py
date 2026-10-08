#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# protocole_general.py — le protocole en vocabulaire standard, à tout ordre pair.
#
# ÉNONCÉ. Soit une grille n × n. On étiquette chacune de ses n² cases par l'une
# de quatre classes, et la case (r, c) reçoit alors l'un des quatre entiers
#
#     B(r, c) = n·r + c + 1                  (lecture ligne par ligne)
#     R(r, c) = n² + 1 − B(r, c)             (son complément)
#     V(r, c) = n·r + (n − 1 − c) + 1        (lecture ligne par ligne, colonnes renversées)
#     J(r, c) = n² + 1 − V(r, c)             (son complément)
#
# selon sa classe. C'est la méthode dite de la table de motifs, ou « criss-cross »,
# portée de deux classes à quatre : la version à deux classes, qui n'emploie que
# B et R, est documentée pour les ordres doublement pairs seulement.
#
# DEUX ÉGALITÉS D'ÉQUILIBRAGE, qui ne sont PAS nécessaires à la magicité — le
# papier en donne des contre-exemples — mais qui décrivent le cœur du
# procédé. Chaque valeur est de la forme α·r + β·c + γ avec
#
#     B : α = +n, β = +1        V : α = +n, β = −1
#     R : α = −n, β = −1        J : α = −n, β = +1
#
# Pour qu'une somme de ligne ne dépende pas de r, il faut que les α s'annulent ;
# pour qu'une somme de colonne ne dépende pas de c, il faut que les β s'annulent.
# D'où, en notant b, ρ, v, j les effectifs des quatre classes :
#
#     dans chaque LIGNE    : b + v = ρ + j = n / 2
#     dans chaque COLONNE  : b + j = ρ + v = n / 2
#
# L'ordre doit donc être pair, et ces deux égalités ne dépendent que des
# effectifs — ni de la forme de l'étiquetage, ni de l'ordre.
#
# UNE TROISIÈME CONDITION, et celle-là est nécessaire ET suffisante pour que
# les n² entiers soient tous présents une fois. Elle ne porte plus sur des
# effectifs mais sur des POSITIONS.
#
# Une case de classe B en (r, c) prend la c-ième valeur du bloc r ; de classe V,
# la (n−1−c)-ième du même bloc. Une case de classe R en (r, c) prend la
# (n−1−c)-ième valeur du bloc n−1−r ; de classe J, la c-ième de ce même bloc.
# Posons donc, pour chaque ligne r,
#
#     P(r) = { c : classe B } ∪ { n−1−c : classe V }   indices pris dans le bloc r
#     Q(r) = { n−1−c : classe R } ∪ { c : classe J }   indices pris dans le bloc n−1−r
#
# Alors l'étiquetage est une bijection sur 1…n² si et seulement si, pour chaque
# bloc k, P(k) et Q(n−1−k) sont disjoints et leur réunion est {0, …, n−1}.
#
# Autrement dit : chaque ligne se partage le bloc k avec la ligne n−1−k, l'une
# par ses cases claires, l'autre par ses cases sombres, et les deux doivent se
# compléter exactement. C'est ce qui apparie les lignes r et n−1−r.
#
# CE QUE LE TÉMOIN ÉTABLIT, ET RIEN DE PLUS : les deux équilibrages n'impliquent
# pas la bijection. Ce n'est pas une indépendance mutuelle des trois.
# Un étiquetage peut vérifier les deux égalités
# d'effectifs et manquer la troisième ; le script en exhibe un. Et les trois
# réunies ne suffisent toujours pas à rendre le carré magique : elles laissent
# libres les sommes de positions, qui règlent ensuite la constante et les
# diagonales.
#
# Ce script vérifie l'énoncé sur le corpus des 256 carrés d'ordre 6, puis
# contrôle n'importe quel étiquetage fourni, à n'importe quel ordre pair.
#
# Usage : cd <racine du dépôt> && python tools/protocole_general.py
#         --ordre N --etiquettes <fichier>   vérifie un étiquetage d'ordre N
#         (fichier : N lignes de N caractères parmi B R V J)

import sys

from lldh_commun import etiquetage, lire_referent, magique, protocole

echecs = []


def conditions(etiq, n):
    """Les deux égalités d'effectifs, ligne par ligne et colonne par colonne."""
    ok_l = all(sum(1 for c in range(n) if etiq[r][c] in 'BV') == n // 2 for r in range(n))
    ok_c = all(sum(1 for r in range(n) if etiq[r][c] in 'BJ') == n // 2 for c in range(n))
    return ok_l, ok_c


def bloc_clair(etiq, r, n):
    """P(r) : les indices que la ligne r prend dans le bloc r."""
    return [c if etiq[r][c] == 'B' else n - 1 - c
            for c in range(n) if etiq[r][c] in 'BV']


def bloc_sombre(etiq, r, n):
    """Q(r) : les indices que la ligne r prend dans le bloc n-1-r."""
    return [n - 1 - c if etiq[r][c] == 'R' else c
            for c in range(n) if etiq[r][c] in 'RJ']


def condition_bijection(etiq, n):
    """La troisième condition : chaque bloc est exactement partagé."""
    return all(sorted(bloc_clair(etiq, k, n) + bloc_sombre(etiq, n - 1 - k, n))
               == list(range(n)) for k in range(n))


def main():
    if '--ordre' in sys.argv:
        n = int(sys.argv[sys.argv.index('--ordre') + 1])
        chemin = sys.argv[sys.argv.index('--etiquettes') + 1]
        etiq = [ligne.strip() for ligne in open(chemin) if ligne.strip()]
        ok_l, ok_c = conditions(etiq, n)
        ok_b = condition_bijection(etiq, n)
        m, pourquoi = magique(protocole(etiq, n), n)
        print(f'ordre {n} : condition de ligne {ok_l}, condition de colonne {ok_c}, '
              f'condition de bijection {ok_b}, magique {m}'
              + (f' ({pourquoi})' if pourquoi else ''))
        sys.exit(0 if m else 1)

    doc = lire_referent()
    n = 6
    mag = lig = col = bij = 0
    for f in doc['forms']:
        etiq = [''.join(ligne) for ligne in etiquetage(f)]
        a, b = conditions(etiq, n)
        lig += a
        col += b
        bij += condition_bijection(etiq, n)
        mag += magique(protocole(etiq, n), n)[0]
    print(f'corpus des 256 carrés d’ordre 6')
    print(f'  condition de ligne   (B + V = {n // 2}) : {lig}/256')
    print(f'  condition de colonne (B + J = {n // 2}) : {col}/256')
    print(f'  condition de bijection (chaque bloc partagé) : {bij}/256')
    print(f'  carrés magiques, diagonales comprises   : {mag}/256')
    if not (lig == col == bij == mag == 256):
        echecs.append('le corpus ne vérifie pas l’énoncé')

    # les conditions sont nécessaires : un contre-exemple qui en viole une
    etiq = ['B' * n for _ in range(n)]
    a, b = conditions(etiq, n)
    m, _ = magique(protocole(etiq, n), n)
    print(f'  contrôle négatif (tout en B) : conditions {a}, {b} ; magique {m}')
    if m:
        echecs.append('le contrôle négatif est magique, l’énoncé est faux')

    # les trois sont indépendantes : un étiquetage conforme aux deux premières
    # et pas à la troisième
    temoin = ['BJRBVR', 'BRVVJR', 'VJBJRB', 'VRRVJB', 'VRJVJB', 'JJBBRV']
    a, b = conditions(temoin, n)
    t = condition_bijection(temoin, n)
    g = protocole(temoin, n)
    doublons = len(g * 0) == 0 and sorted(x for l in g for x in l) != list(range(1, n * n + 1))
    print(f'  témoin d’indépendance : effectifs {a} et {b}, bijection {t}, '
          f'entiers répétés {doublons}')
    if not (a and b and not t and doublons):
        echecs.append('le témoin ne sépare plus la troisième condition des deux autres')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nQuatre classes, et un ordre pair : c’est tout ce que le protocole\n'
          'demande pour s’écrire. Qu’un étiquetage magique existe à tout ordre\n'
          'pair reste ouvert.')


if __name__ == '__main__':
    main()
