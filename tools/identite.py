#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# identite.py — l'identité exacte des sommes de lignes, et sa forme (*).
#
# En notant A_r les colonnes de la ligne r dont la classe est B ou J,
# b_r le nombre de cases de classe B ou V, d_r = b_r − n/2 et u_r = 2r − n + 1 :
#
#     Somme_{c dans A_r} (2c + 1) = n (|A_r| − d_r u_r)              (identité)
#
# La congruence 2·Somme_{c dans A_r} c + |A_r| ≡ 0 (mod n) n'en est que la
# réduction modulo n.
#
# LES HORIZONTALES S'ÉLIMINENT EXACTEMENT. Sous la condition I, un trait
# horizontal est B–J ou R–V : ses deux valeurs somment à n²+1, et il contient
# exactement une case de {B, V}, de sorte que d_r est inchangé. En notant A*_r
# les cases de A_r qui ne sont pas horizontales — les verticales et les deux
# diagonales — il reste
#
#     Somme_{c dans A*_r} (2c + 1 − n) = − n d_r u_r                     (*)
#
# C'est la forme la plus nue de ce que les sommes de lignes imposent, et elle ne
# parle que des verticales et des diagonales.
#
# Ce script vérifie les deux formes sur tout ce dont on dispose : les 18 432
# étiquetages magiques d'ordre 6 et les témoins des ordres 10 à 26. Il sort en
# erreur si l'une tombe.
#
# Usage : cd <racine du dépôt> && python tools/identite.py

import json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)

from verifie_temoins import condition_I, traits, diagonales   # noqa: E402


def ecart(mots, n, r):
    b = sum(1 for k in mots[r] if k in 'BV')
    return b - n // 2, 2 * r - n + 1


def identite(mots, n):
    """L'identité exacte, ligne par ligne."""
    for r in range(n):
        A = [c for c, k in enumerate(mots[r]) if k in 'BJ']
        d, u = ecart(mots, n, r)
        if sum(2 * c + 1 for c in A) != n * (len(A) - d * u):
            return False
    return True


def etoile(mots, n):
    """La forme (*), après élimination exacte des horizontales. Ne vaut que
    sous la condition I, qui seule définit les traits."""
    if not condition_I(mots, n):
        return None
    t, dg = traits(mots, n), diagonales(n)
    for r in range(n):
        horiz = {c for c in range(n)
                 if frozenset({(r, c), (r, n - 1 - c)}) in t}
        A = [c for c, k in enumerate(mots[r])
             if k in 'BJ' and (c not in horiz or (r, c) in dg)]
        d, u = ecart(mots, n, r)
        if sum(2 * c + 1 - n for c in A) != -n * d * u:
            return False
    return True


def main():
    ecarts = []
    cache = os.path.join(ICI, 'pavables6.json')
    if os.path.exists(cache):
        tous = json.load(open(cache))['tous']
        a = sum(1 for g in tous if identite(g, 6))
        b = sum(1 for g in tous if etoile(g, 6) is not False)
        print(f'ordre 6, {len(tous)} étiquetages magiques : '
              f'identité exacte {a}/{len(tous)}, forme (*) {b}/{len(tous)}')
        if a != len(tous) or b != len(tous):
            ecarts.append('ordre 6')

    for c in (os.path.join(os.path.dirname(ICI), 'data', 'temoins.json'),
              os.path.join(ICI, 'temoins.json')):
        if os.path.exists(c):
            for t in json.load(open(c, encoding='utf-8'))['temoins']:
                if t['genre'] == 'independance':
                    continue
                n, mots = t['ordre'], t['etiquetage']
                i, e = identite(mots, n), etoile(mots, n)
                print(f'  {t["genre"]:22s} ordre {n:3d} : identité {i}, '
                      f'(*) {"sans objet" if e is None else e}')
                if not i or e is False:
                    ecarts.append(f'{t["genre"]} ordre {n}')
            break

    if ecarts:
        print('écarts : ' + ', '.join(ecarts), file=sys.stderr)
        sys.exit(1)
    print('\nles deux formes tiennent partout.')


if __name__ == '__main__':
    main()
