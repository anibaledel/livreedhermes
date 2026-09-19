#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
measure_k_pic.py — Mesure k_pic (fréquence spatiale dominante) depuis les
masques de data/referent_bandes_v1.json.

Contrairement à derive_frequences.py, qui part d'un k_pic déjà présent
dans le fichier, ce script CALCULE k_pic depuis la géométrie réelle des
1152 triangles de chaque gamme — la mesure qui manquait : les k_pic
actuels du fichier sont de provenance inconnue (voir
echelle.avertissement) et ne décrivent la géométrie d'aucun des deux
référents (ni l'ancien, faux, ni le bicolore actuel).

Méthode
-------
1. Réduction cellule : chaque cellule de la grille 12×12 est coupée en 8
   triangles CONGRUENTS par ses deux diagonales et ses deux médianes (voir
   familles.py) — chacun couvre exactement 1/8 de l'aire de la cellule.
   La moyenne des 8 bits yang de la cellule est donc EXACTEMENT sa
   fraction d'aire sombre, pas une approximation : c'est la rastérisation
   des 1152 triangles, réduite à sa valeur correcte par cellule.
2. FFT 2D de la grille 12×12 ainsi obtenue (moyenne retirée, pour ignorer
   la composante continue).
3. Pic dominant hors DC : le bin de fréquence (fx, fy), indices centrés
   dans [-6, 6], de magnitude |FFT|² maximale.
4. k_pic² = fx² + fy² (entier par construction — voir discussion dans la
   PR qui a introduit ce script). k_pic = sqrt(k_pic²).

Le résultat est indépendant du choix yang/yin : yin est le complément bit
à bit de yang, donc FFT{1-x} = -FFT{x} en dehors du DC, même magnitude.

Usage :
    python tools/measure_k_pic.py
"""

import json
import os

import numpy as np

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT_PATH = os.path.join(REPO_ROOT, 'data', 'referent_bandes_v1.json')

N = 12


def hex_to_bits(h):
    out = []
    for c in h:
        v = int(c, 16)
        out.extend([(v >> (3 - b)) & 1 for b in range(4)])
    return out


def cell_fraction_grid(bits):
    """1152 bits (cellule ligne-major, 8 par cellule) -> grille 12x12 de
    fraction d'aire sombre par cellule (exacte, triangles congruents)."""
    g = np.zeros((N, N))
    for idx, b in enumerate(bits):
        cell = idx // 8
        r, c = divmod(cell, N)
        g[r, c] += b
    return g / 8.0


def dominant_k2(grid):
    F = np.fft.fft2(grid - grid.mean())
    P = np.abs(F) ** 2
    P[0, 0] = 0
    kx, ky = np.unravel_index(np.argmax(P), P.shape)
    fx = kx if kx <= N // 2 else kx - N
    fy = ky if ky <= N // 2 else ky - N
    return fx * fx + fy * fy, fx, fy


def measure():
    doc = json.load(open(REFERENT_PATH, encoding='utf-8'))
    out = {}
    for name, g in doc['gammes'].items():
        grid = cell_fraction_grid(hex_to_bits(g['yang']))
        k2, fx, fy = dominant_k2(grid)
        out[name] = {'k2': k2, 'fx': fx, 'fy': fy, 'k_pic': k2 ** 0.5, 'categorie': g['categorie']}
    return out


def main():
    mesures = measure()
    print(f"{'gamme':20s} {'categorie':10s} {'(fx,fy)':>10s} {'k^2':>5s} {'k_pic':>8s}")
    for name, m in sorted(mesures.items(), key=lambda kv: kv[1]['k2']):
        print(f"{name:20s} {m['categorie']:10s} {'(' + str(m['fx']) + ',' + str(m['fy']) + ')':>10s} "
              f"{m['k2']:5d} {m['k_pic']:8.3f}")
    vals = sorted(set(m['k2'] for m in mesures.values()))
    print(f"\nvaleurs distinctes de k^2 ({len(vals)}) : {vals}")


if __name__ == '__main__':
    main()
