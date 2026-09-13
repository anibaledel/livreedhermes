# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
variants.py — Les six instantiations Carter, une table déclarative
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réorganisation de stegano/ (2026-09, branche deux-cles) : nom → (grille,
référent, règle de lecture, domaine de masque) pour les six variantes.
Purement déclaratif — décrit ce que carter.py/carter_random.py
implémentent, ne les remplace pas : chaque variante garde ses propres
fonctions de grammaire/positions/redraw (voir grammar.py) et son propre
encode_*/decode_* (façades de compatibilité, carter.py/carter_random.py).
Sert de référence unique pour la documentation et les outils
(tools/capacity_table.py) plutôt qu'une table éparpillée dans chaque
appelant.

Le déni plausible (secu_box.py) n'est PAS une septième variante ici : il
réutilise le pool 6×6 de Carter-Random (voir grammar.get_referent) mais
n'a pas d'encode_*/decode_* Carter propre — c'est un mode de secu_box.py,
pas une géométrie Carter distincte.
"""

from typing import Dict, NamedTuple

import grammar as G


class Variant(NamedTuple):
    grid_size: int
    referent: str
    reading_rule: str
    mask_domain: str    # clé pour masks.derive_masks(gk, n, variant=mask_domain)


VARIANTS: Dict[str, Variant] = {
    'carter256': Variant(
        grid_size=G.CARTER_GRID,
        referent='Référent 256 fixe (croix ansée), data/referent_256_v3.json — blocs 6×6',
        reading_rule='rouge+bleu ensemble par bloc message (12 positions), triées par balayage',
        mask_domain='carter256',
    ),
    'carter360': Variant(
        grid_size=G.CARTER360_GRID,
        referent='Référent 360 fixe (calques Jacquard), data/referent_360_v3.json — blocs 12×12',
        reading_rule='union des positions violettes de 6 calques tirés (un par niveau) par bloc message',
        mask_domain='carter360',
    ),
    'cartermix': Variant(
        grid_size=G.CARTER_MIX_GRID,
        referent='Référent 256 OU 360 selon la clé, par méta-bloc 12×12 (4 sous-blocs 6×6 si Ref256)',
        reading_rule='Ref256 : un form_id répliqué sur 4 sous-blocs (jusqu\'à 48 positions) ; '
                      'Ref360 : union de 6 calques (~48 en moyenne)',
        mask_domain='cartermix',
    ),
    'carterrandom': Variant(
        grid_size=G.GRID_SIZE,   # 90 par défaut ; 180 via grid_size=180 (alias carterrandom360)
        referent='256 référents 6×6 dérivés par ChaCha20 (referent6x6_gen.py), '
                 'choisis par un octet de la clé (select_referent_index)',
        reading_rule='bloc à bloc (6×6) ou méta-concentrique (18×18, CONC_ORDER) selon la clé (CR-1)',
        mask_domain='carterrandom',
    ),
    'carter18': Variant(
        grid_size=G.GRID_SIZE,
        referent='Référent 18×18 (256 formes × 4 directions), généré par random.Random(seed), '
                 'seed choisie parmi 10 valeurs fixes (SEEDS)',
        reading_rule='une direction de lecture concentrique par méta-bloc (noyau→périphérie, '
                      'périphérie→noyau, couches paires, couches impaires), dérivée de la clé',
        mask_domain='carter18',
    ),
    'carterhybrid': Variant(
        grid_size=G.GRID_SIZE,
        referent='Référent 18×18 (comme carter18) ET référent 6×6 v3 (comme carterrandom), '
                 'les deux choisis par la clé',
        reading_rule='par méta-bloc 18×18 : MODE_18 (concentrique, comme carter18) ou MODE_6 '
                      '(9 sous-blocs 6×6 indépendants), le mode dérivé de la clé',
        mask_domain='carterhybrid',
    ),
}
