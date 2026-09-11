#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
sweep.py — Ordre de lecture par balayage (règle de lecture v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Brique partagée du câblage en production de la nouvelle règle de lecture
(référent en paramètre) : 8 balayages possibles (4 coins × 2 axes),
dérivés de la clé, UN par couleur, fixés pour toute la grammaire (jamais
retiré par bloc — la même couleur est toujours lue dans le même ordre
partout où elle apparaît dans un message donné).

Un balayage = un coin de départ (haut-gauche/haut-droit/bas-gauche/
bas-droit) × un axe primaire (horizontal : ligne par ligne ; vertical :
colonne par colonne). Appliqué aux positions LOCALES d'un bloc/calque
(coordonnées 0..grid_size-1), pas aux coordonnées globales de la grille
90×90/180×180 — chaque bloc/calque réapplique le même balayage à ses
propres positions de cette couleur.

Ordre crypto (toutes les cases, pas seulement stégano) : niveaux
d'abord (si le référent en a — sinon un seul groupe), puis l'ordre des
couleurs déclaré (`crypto_color_order`), chaque couleur triée par son
propre balayage — voir `crypto_reading_order()`.
"""
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

SWEEP_SALT = b'Carter-sweep-v3'

_CORNERS = ('TL', 'TR', 'BL', 'BR')
_AXES = ('H', 'V')
SWEEPS = [(corner, axis) for corner in _CORNERS for axis in _AXES]   # 8, index 0..7
N_SWEEPS = len(SWEEPS)   # 8 ; 256 % 8 == 0, aucun biais modulo


def derive_sweep_index(key: bytes, color: str) -> int:
    """Balayage (0..7) pour `color`, dérivé de `key` (typiquement
    grammar_key_ctr : un redraw retire donc les balayages avec le reste
    de la grammaire). 1 octet HKDF-SHA256, utilisé TEL QUEL modulo 8 :
    256 est un multiple exact de 8, `% 8` ne biaise donc aucune des 8
    valeurs (même raisonnement que select_referent_index, longueur 1
    différente)."""
    b = _HKDF(_hashes.SHA256(), 1, salt=SWEEP_SALT,
              info=color.encode('utf-8')).derive(key)
    return b[0] % N_SWEEPS


def sort_by_sweep(positions, sweep_index: int, grid_size: int):
    """Trie `positions` (liste de (row, col) LOCALES à un bloc/calque de
    taille grid_size) selon le balayage `sweep_index` -- ordre total,
    déterministe, sans dépendre de l'ordre d'entrée."""
    corner, axis = SWEEPS[sweep_index]

    def adjusted(pos):
        r, c = pos
        ar = r if corner[0] == 'T' else (grid_size - 1 - r)
        ac = c if corner[1] == 'L' else (grid_size - 1 - c)
        return (ar, ac) if axis == 'H' else (ac, ar)

    return sorted(positions, key=adjusted)


def crypto_reading_order(cells_by_niveau_and_color, color_order, grid_size, sweep_of_color):
    """Ordre de lecture CRYPTO (toutes les cases) : niveaux dans l'ordre
    croissant, puis `color_order` (l'ordre déclaré du référent), chaque
    couleur triée par son balayage (`sweep_of_color[color]`).

    `cells_by_niveau_and_color` : {niveau: {couleur: [(row,col), ...]}} --
    pour un référent sans niveau (6×6), utiliser un seul niveau (ex. 0).
    Retourne la liste plate des positions, dans l'ordre de lecture."""
    order = []
    for niveau in sorted(cells_by_niveau_and_color):
        by_color = cells_by_niveau_and_color[niveau]
        for color in color_order:
            positions = by_color.get(color, [])
            if not positions:
                continue
            order.extend(sort_by_sweep(positions, sweep_of_color[color], grid_size))
    return order
