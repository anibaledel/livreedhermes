#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verifie_temoins.py — contrôle les témoins du dépôt, SANS SOLVEUR.
#
# Ce script n'utilise que la bibliothèque standard : ni ortools, ni numpy, ni
# rien à installer. Il relit `data/temoins.json` et revérifie chaque témoin
# contre l'énoncé qu'il porte, par le calcul direct. Un lecteur contrôle donc
# ainsi toute la moitié POSITIVE du papier — les existences, les contre-exemples
# — sans dépendre d'un solveur ni de sa version.
#
# CE QU'IL NE PEUT PAS CONTRÔLER, et c'est dit ici plutôt que caché : les
# résultats NÉGATIFS. « Aucun étiquetage magique à l'ordre 2 », « aucune croix
# ansée aux ordres 8, 12 et 16 », « les 32 figures de l'ordre 8 sont toutes
# impossibles » n'ont pas de certificat court : il faut relancer CP-SAT. Le
# dépôt les étiquette comme tels, avec la version d'ortools et le temps de
# calcul.
#
# Le protocole, rappelé pour que ce fichier se lise seul : la case (r, c) d'une
# grille n × n reçoit, selon sa classe,
#
#     B = nr + c + 1          R = n² + 1 − B
#     V = nr + (n−1−c) + 1    J = n² + 1 − V
#
# Usage : python tools/verifie_temoins.py [chemin/vers/temoins.json]
#         code de retour 0 si tous les témoins passent, 1 sinon

import json, os, sys


def valeur(k, r, c, n):
    B = n * r + c + 1
    V = n * r + (n - 1 - c) + 1
    return {'B': B, 'R': n * n + 1 - B, 'V': V, 'J': n * n + 1 - V}[k]


def grille(mots, n):
    return [[valeur(mots[r][c], r, c, n) for c in range(n)] for r in range(n)]


def magique(mots, n):
    """Bijection sur 1…n², lignes, colonnes et les deux diagonales."""
    M = n * (n * n + 1) // 2
    g = grille(mots, n)
    return (sorted(v for l in g for v in l) == list(range(1, n * n + 1))
            and all(sum(l) == M for l in g)
            and all(sum(g[r][c] for r in range(n)) == M for c in range(n))
            and sum(g[i][i] for i in range(n)) == M
            and sum(g[i][n - 1 - i] for i in range(n)) == M)


def equilibrage(mots, n):
    """(égalité par ligne, égalité par colonne)."""
    ligne = all(sum(1 for k in l if k in 'BV') == n // 2 for l in mots)
    colonne = all(sum(1 for r in range(n) if mots[r][c] in 'BJ') == n // 2
                  for c in range(n))
    return ligne, colonne


def ou_est_la_complementaire(mots, n):
    """Pour chaque case, 'T' demi-tour, 'H' miroir horizontal, 'V' miroir
    vertical, '?' ailleurs."""
    val = {(r, c): valeur(mots[r][c], r, c, n)
           for r in range(n) for c in range(n)}
    pos = {v: rc for rc, v in val.items()}
    out = {}
    for (r, c), v in val.items():
        p = pos[n * n + 1 - v]
        if p == (n - 1 - r, n - 1 - c):
            out[(r, c)] = 'T'
        elif p == (r, n - 1 - c):
            out[(r, c)] = 'H'
        elif p == (n - 1 - r, c):
            out[(r, c)] = 'V'
        else:
            out[(r, c)] = '?'
    return out


def diagonales(n):
    return {(r, r) for r in range(n)} | {(r, n - 1 - r) for r in range(n)}


def condition_I(mots, n):
    """Les paires par demi-tour sont exactement les 2n cases des diagonales."""
    p = ou_est_la_complementaire(mots, n)
    d = diagonales(n)
    return all(k != '?' and (k == 'T') == (rc in d) for rc, k in p.items())


def traits(mots, n):
    p = ou_est_la_complementaire(mots, n)
    d = diagonales(n)
    out = set()
    for (r, c), k in p.items():
        if (r, c) in d:
            continue
        out.add(frozenset({(r, c), (r, n - 1 - c)}) if k == 'H'
                else frozenset({(r, c), (n - 1 - r, c)}))
    return out


def comptes_de_traits(mots, n):
    t = traits(mots, n)
    h = [sum(1 for x in t if all(p[0] == r for p in x)) for r in range(n)]
    v = [sum(1 for x in t if all(p[1] == c for p in x)) for c in range(n)]
    return h, v


def profil(mots, n):
    from collections import Counter
    c = Counter(''.join(mots))
    return [c.get('B', 0), c.get('R', 0), c.get('V', 0), c.get('J', 0)]


def controle(t):
    """Rend (verdict, détail) pour un témoin."""
    n, mots, genre = t['ordre'], t['etiquetage'], t['genre']
    if len(mots) != n or any(len(l) != n for l in mots):
        return False, 'dimensions incohérentes'
    if any(k not in 'BRVJ' for l in mots for k in l):
        return False, 'classe inconnue'
    mag = magique(mots, n)

    if genre == 'independance':
        lig, col = equilibrage(mots, n)
        if not (lig and col):
            return False, 'les égalités d’équilibrage ne sont pas tenues'
        if mag:
            return False, 'l’étiquetage est magique : ce n’est pas un témoin'
        g = grille(mots, n)
        vus = sorted(v for l in g for v in l)
        return True, (f'équilibrage tenu, bijection violée : '
                      f'{n * n - len(set(vus))} valeurs répétées')

    if genre == 'lignes_sans_colonnes':
        if not condition_I(mots, n):
            return False, 'la condition I n’est pas vérifiée'
        h, v = comptes_de_traits(mots, n)
        if not (all(x % 2 == 1 for x in h) and all(x % 2 == 1 for x in v)):
            return False, f'parité violée : lignes {h}, colonnes {v}'
        g = grille(mots, n)
        vus = sorted(x for l in g for x in l)
        if vus != list(range(1, n * n + 1)):
            return False, 'la bijection n’est pas tenue'
        M = n * (n * n + 1) // 2
        L = [sum(l) - M for l in g]
        C = [sum(g[r][c] for r in range(n)) - M for c in range(n)]
        if any(L):
            return False, f'les sommes de lignes ne sont pas magiques : {L}'
        if not any(C):
            return False, 'les colonnes sont magiques aussi : pas un témoin'
        if mag:
            return False, 'l’étiquetage est magique : ce n’est pas un témoin'
        return True, (f'δ = 0 et γ = {C} : les lignes sont magiques, '
                      f'les colonnes non')

    if not mag:
        return False, 'l’étiquetage n’est pas magique'

    if genre == 'graine':
        return True, f'magique, constante {n * (n * n + 1) // 2}'

    if genre == 'croix_ansee':
        if not condition_I(mots, n):
            return False, 'la condition I n’est pas vérifiée'
        h, v = comptes_de_traits(mots, n)
        if not (all(x % 2 == 1 for x in h) and all(x % 2 == 1 for x in v)):
            return False, f'parité violée : lignes {h}, colonnes {v}'
        return True, (f'condition I, traits par ligne {sorted(set(h))}, '
                      f'par colonne {sorted(set(v))}')

    if genre == 'ligne_non_necessaire':
        r = t['ligne']
        b = sum(1 for k in mots[r] if k in 'BV')
        if b == n // 2:
            return False, 'l’égalité de ligne est tenue : pas un témoin'
        d = b - n // 2
        u = 2 * r - n + 1
        if abs(d * u) > (n - 1) // 2:
            return False, (f'le témoin viole l’inégalité démontrée : '
                           f'|{d}·{u}| > {(n - 1) // 2}')
        return True, (f'ligne {r} : {b} cases B ou V au lieu de {n // 2} ; '
                      f'|d·u| = {abs(d * u)} ≤ {(n - 1) // 2}, conforme à '
                      f'l’inégalité')

    if genre == 'parite_non_impliquee':
        if not condition_I(mots, n):
            return False, 'la condition I n’est pas vérifiée'
        h, v = comptes_de_traits(mots, n)
        compte = h[t['indice']] if t['sens'] == 'ligne' else v[t['indice']]
        if compte % 2 == 1:
            return False, f'le compte est impair ({compte}) : pas un témoin'
        return True, (f'condition I tenue, et la {t["sens"]} {t["indice"]} '
                      f'porte {compte} traits, un nombre pair')

    if genre == 'profil_symetrique':
        p = profil(mots, n)
        if t.get('profil') and p != t['profil']:
            return False, f'profil annoncé {t["profil"]}, calculé {p}'
        return True, f'profil (B, R, V, J) = {p}, somme {sum(p)} = n²'

    return False, f'genre inconnu : {genre}'


def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else None
    if chemin is None:
        ici = os.path.dirname(os.path.abspath(__file__))
        for c in (os.path.join(os.path.dirname(ici), 'data', 'temoins.json'),
                  os.path.join(ici, 'temoins.json')):
            if os.path.exists(c):
                chemin = c
                break
    if chemin is None or not os.path.exists(chemin):
        print('fichier de témoins introuvable', file=sys.stderr)
        sys.exit(2)

    d = json.load(open(chemin, encoding='utf-8'))
    print(f'{len(d["temoins"])} témoins lus dans {chemin}')
    print('contrôle sans solveur, bibliothèque standard seule\n')
    echecs = 0
    for t in d['temoins']:
        ok, detail = controle(t)
        if not ok:
            echecs += 1
        print(f'  [{"OK " if ok else "NON"}] {t["genre"]:22s} '
              f'ordre {t["ordre"]:3d} : {detail}')
    print()
    if echecs:
        print(f'{echecs} témoin(s) en échec', file=sys.stderr)
        sys.exit(1)
    print(f'les {len(d["temoins"])} témoins passent.')
    print('Rappel : les résultats NÉGATIFS du papier — aucun étiquetage à '
          'l’ordre 2, aucune croix ansée à l’ordre doublement pair (désormais démontré dans le papier) — n’ont pas '
          'de certificat court et ne sont pas contrôlés ici.')


if __name__ == '__main__':
    main()
