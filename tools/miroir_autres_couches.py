#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
miroir_autres_couches.py — garder le miroir sur d'autres jeux de couches (suite de tools/corpus_miroir.py).

On prend les 60 images du référent (15 familles × 4 couches) et les 1 770 paires de couches {A, B}. Pour chaque paire et chacun des 64 hexagrammes n, la grille Φ(n, A, B) (carte des six niveaux du site).
Une grille est RETENUE si elle cumule les trois critères d'Anibal : une vraie ligne de miroir dans le pavage (pas un glissement), un seul motif au pavage (g∘σ = π∘g pour une involution π des teintes, la définition
« pave simplement » de la note) et 48 / 48 / 48 cases par teinte. Résultat, vérifié ici :
  - avec les couches d'UNE MÊME famille, exactement les 512 grilles unifiées du site (les 256 du corpus et les 256 du couple YIN) : le miroir n'ajoute aucun autre jeu de couches à l'intérieur d'une famille ;
  - en prenant les deux couches dans des familles DIFFÉRENTES, 4 768 grilles de plus (5 280 au total), qui forment 724 formes sous Γ = D4 × σ × S3.
La lisibilité par la lecture binaire (72 / 72, lecture inversée par le décalage) se teste en JavaScript (assets/lecture-binaire.js) : sur ces 5 280 grilles, 2 640 passent, dont les 256 du corpus ;
ce test-là n'est pas encore dans un outil.

  python3 tools/miroir_autres_couches.py            imprime les nombres
  python3 tools/miroir_autres_couches.py --verifie  échoue si ces nombres changent
"""
import itertools
import os
import sys

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import check_note_v6 as note  # noqa: E402
import corpus_miroir as cm  # noqa: E402

N = 12
ATTENDU = {'retenues': 5280, 'meme_famille': 512, 'familles_differentes': 4768, 'formes': 724}
INVOLUTIONS = [np.array(p, np.uint8) for p in itertools.permutations(range(3)) if p != (0, 1, 2) and all(p[p[i]] == i for i in range(3))]


def sigma(g):
    return np.roll(np.roll(g, 6, 0), 6, 1)


def un_seul_motif(g):
    s = sigma(g)
    return any(np.array_equal(s, p[g]) for p in INVOLUTIONS)


def calculer():
    L, FAM, _ = note.charger()
    Lm = np.array(L)
    imgs = [(fam, np.array([[cm.LET.index(x) for x in r] for r in g], np.uint8)) for fam, d in FAM.items() for g in d.values()]
    assert len(imgs) == 60
    bits = np.array([[[(n >> (Lm[r][c] - 1)) & 1 for c in range(N)] for r in range(N)] for n in range(64)], bool)
    vus = {}
    for i, j in itertools.combinations(range(60), 2):
        A, B = imgs[i][1], imgs[j][1]
        if np.array_equal(A, B):
            continue
        meme = imgs[i][0] == imgs[j][0]
        for n in range(64):
            g = np.where(bits[n], A, B)
            if tuple(np.bincount(g.ravel(), minlength=3)) != (48, 48, 48):
                continue
            k = g.tobytes()
            if k not in vus:
                vus[k] = {'g': g, 'ok': cm.vrai_miroir(g) is not None and un_seul_motif(g), 'meme': False}
            if vus[k]['ok'] and meme:
                vus[k]['meme'] = True
    bons = [e for e in vus.values() if e['ok']]
    formes = {min(x.tobytes() for x in cm.transformees(e['g'])) for e in bons}
    return {'retenues': len(bons), 'meme_famille': sum(e['meme'] for e in bons), 'familles_differentes': sum(not e['meme'] for e in bons), 'formes': len(formes)}


def main():
    n = calculer()
    print(n)
    if '--verifie' in sys.argv:
        if n != ATTENDU:
            print(f'ÉCART {n} au lieu de {ATTENDU}', file=sys.stderr)
            sys.exit(1)
        print('OK    miroir sur les 1 770 paires de couches : 512 grilles avec les couches d\'une même famille (= les 512 unifiées), 4 768 de plus avec des familles différentes, 724 formes.')


if __name__ == '__main__':
    main()
