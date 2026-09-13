# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
masks.py — Dérivation des masques de position (dérivé de gk)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réorganisation de stegano/ (2026-09, branche deux-cles). Le primitif
lui-même (keystream ChaCha20 sous clé dérivée par HKDF, rejet vers
Z_ALPHA_LEN) reste dans crypto_core.py, INCHANGÉ (contrainte de la
réorganisation : crypto_core.py n'est pas touché au-delà des labels) --
crypto_core._derive_masks() est un primitif générique partagé par TOUTES
les couches (Carter, déni), pas une notion propre à la grammaire Carter.

Ce module n'ajoute qu'une chose : le dispatch "quel domaine HKDF pour
quelle variante" (LABELS['mask_seed']['info_<variante>']), pour que les
appelants (carter.py/carter_random.py, secu_box.py) n'aient plus à
recopier ce mapping à chaque site d'appel.
"""

from typing import List

from crypto_core import LABELS, _derive_masks

_MASK_INFO = {
    'carter256':    LABELS['mask_seed']['info_carter256'],
    'carter360':    LABELS['mask_seed']['info_carter360'],
    'cartermix':    LABELS['mask_seed']['info_cartermix'],
    'carterrandom': LABELS['mask_seed']['info_random'],
    'carter18':     LABELS['mask_seed']['info_18'],
    'carterhybrid': LABELS['mask_seed']['info_hybrid'],
    'deniable':     LABELS['mask_seed']['info_deniable'],
}


def derive_masks(gk: bytes, n: int, variant: str) -> List[int]:
    """
    Masques de position pour `variant` (n symboles uniformes sur
    [0..ALPHA_LEN-1]), dérivés de gk (ou gk_nu une fois le nonce de
    disposition câblé, voir keys.py::derive_gk_nu). Délègue entièrement
    à crypto_core._derive_masks — voir ce primitif pour la construction
    exacte (mask_key = HKDF-SHA256(gk, salt, info=domaine), masques =
    keystream ChaCha20(mask_key, nonce=0) + rejet vers Z_ALPHA_LEN).
    """
    return _derive_masks(gk, n, _MASK_INFO[variant])
