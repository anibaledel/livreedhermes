# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
keys.py — Deux clés indépendantes (contenu / géométrie), format v4
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Remplace KeySplit(mk) : au lieu d'une clé maître unique dérivant ck
(contenu) et gk (géométrie) par HKDF, l'appelant fournit deux entrées
INDÉPENDANTES, tirées séparément (secrets.token_bytes(32) chacune, ou
gk désigné — voir gk_from_designation ci-dessous). Aucune dérivation de
l'une vers l'autre : connaître ck ne donne rien sur gk, et réciproquement.

  ck (32 octets) : clé de contenu — chiffrement XChaCha20-Poly1305 et
                   commitment, exactement comme le xchacha_key/steg_key
                   d'aujourd'hui (crypto_core._encrypt/_decrypt).
  gk (32 octets) : clé de géométrie — référent(s), rôles, formes,
                   balayages, masques, redraw : tout ce que §3.3 du
                   papier dérive de la clé de grammaire aujourd'hui
                   (grammar_key dans carter.py/carter_random.py).

keys_from_master(master_key, variant) est marquée LEGACY, mode à clé
unique : elle reproduit bit à bit l'ancien KeySplit (labels v3,
LABELS[variant]['split_salt'/'encrypt_info'/'grammar_info']) pour que
les vecteurs et tests v3 existants restent valides. Elle n'est PAS
utilisée par les nouveaux chemins d'encodage/décodage (qui prennent
ck/gk en paramètres séparés) — seulement par les tests de non-
régression et par un appelant qui choisit délibérément le mode à clé
unique.
"""

import secrets
from typing import Dict, List, Optional, Tuple

from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

from crypto_core import LABELS, ALPHA_LEN, _bytes_to_syms, _syms_to_bytes

# ── Deux clés indépendantes ────────────────────────────────────────────────────

def generate_keys() -> Dict[str, bytes]:
    """Tire ck et gk indépendamment (CSPRNG, 32 octets chacune)."""
    return {'ck': secrets.token_bytes(32), 'gk': secrets.token_bytes(32)}


def keys_from_master(master_key: bytes, variant: str = 'carter256') -> Dict[str, bytes]:
    """
    LEGACY, mode à clé unique. Reproduit bit à bit l'ancien KeySplit(mk)
    (_carter_split/_carter360_split/_carter_mix_split, format v3) : ck et
    gk dérivés de la MÊME master_key par HKDF-SHA256, labels
    LABELS[variant]['split_salt'/'encrypt_info'/'grammar_info']. Sert aux
    tests et vecteurs v3 existants — n'est pas utilisée par l'appli, qui
    prend deux entrées indépendantes (generate_keys() ou gk désignée).

    variant : 'carter256'|'carter360'|'cartermix' (labels propres) ou
    'carterrandom'|'carter18'|'carterhybrid' (réutilisent la table
    'carter256' — choix délibéré déjà en vigueur en v3, voir
    carter_random.py : "réutilise les primitives déjà auditées").
    """
    split_variant = variant if variant in ('carter256', 'carter360', 'cartermix') else 'carter256'
    L = LABELS[split_variant]
    ck = HKDF(hashes.SHA256(), 32, salt=L['split_salt'], info=L['encrypt_info']).derive(master_key)
    gk = HKDF(hashes.SHA256(), 32, salt=L['split_salt'], info=L['grammar_info']).derive(master_key)
    return {'ck': ck, 'gk': gk}


def gk_from_designation(planche_id: str, date_iso: str) -> bytes:
    """
    Clé de géométrie DÉSIGNÉE plutôt que tirée au hasard : un paramètre
    convenu entre correspondants (identifiant de planche + date), pas un
    secret fort — faible entropie, documentée comme telle. La sécurité
    du CONTENU repose entièrement sur ck (secret fort, tiré au CSPRNG) ;
    gk désignée ne fait que fixer PUBLIQUEMENT la géométrie d'une session
    donnée, comme un numéro de planche l'aurait fait.

    gk = HKDF-SHA256(SHA256(planche_id || date_iso), salt=designated_salt)
    """
    import hashlib
    L = LABELS['keys_v4']
    ikm = hashlib.sha256((planche_id + date_iso).encode('utf-8')).digest()
    return HKDF(hashes.SHA256(), 32, salt=L['designated_salt'], info=b'').derive(ikm)


# ── Nonce de disposition (obligatoire avec deux clés) ──────────────────────────
# Avec ck/gk indépendantes, gk seule ne change plus d'une grille à l'autre pour
# une même paire de correspondants (contrairement à v3, où gk dérivait de la
# master_key elle-même souvent renouvelée) -- sans nonce, deux grilles sous la
# même gk partageraient EXACTEMENT la même géométrie (mêmes rôles, mêmes
# formes, mêmes masques), un canal observable même sans connaître gk. Le
# nonce de disposition nu (24 octets CSPRNG, tiré par grille, PUBLIC) referme
# cet écart : gk_nu = HKDF(gk, salt=nu, info=<variante>) remplace gk dans
# TOUTES les dérivations de géométrie/masques de cette grille.

NU_BYTES = 24
NU_SYMBOLS = 36  # voir nu_to_symbols() : plus petit m tel que 44**m >= 2**(8*24), SANS marge _LAMBDA_S


def new_layout_nonce() -> bytes:
    """nu : 24 octets CSPRNG, un tirage par grille, indépendant de ck/gk."""
    return secrets.token_bytes(NU_BYTES)


def derive_gk_nu(gk: bytes, nu: bytes, variant: str) -> bytes:
    """
    gk_nu = HKDF-SHA256(gk, salt=nu, info=LABELS['keys_v4']['layout_info'][variant]).
    Remplace gk dans toutes les dérivations de géométrie et de masques de
    cette grille (référent, rôles, formes, balayages, masques, redraw).
    """
    info = LABELS['keys_v4']['layout_info'][variant]
    return HKDF(hashes.SHA256(), 32, salt=nu, info=info).derive(gk)


def nu_to_symbols(nu: bytes, _y: Optional[int] = None) -> List[int]:
    """
    Sérialise nu (24 octets) en 36 symboles base-44, SANS champ longueur
    (nu est de taille fixe et publique, le décodeur la connaît d'avance)
    et SANS la marge d'uniformité _LAMBDA_S de payload_to_symbols (nu est
    déjà CSPRNG et public, contrairement à un payload chiffré dont la
    marge masque la longueur exacte du clair) : m = plus petit entier tel
    que ALPHA_LEN**m >= 2**(8*len(nu)), calculé directement par
    _bytes_to_syms (Définition 3.6 réutilisée telle quelle, pas
    réimplémentée) plutôt que par payload_to_symbols/_smallest_m (qui
    ajouteraient une marge et un champ hors-propos ici).

    _y (préfixé `_`) : injection interne pour le mode vecteurs, voir
    _bytes_to_syms. None (défaut) préserve secrets.randbelow(Q).
    """
    if len(nu) != NU_BYTES:
        raise ValueError(f"nu invalide : {len(nu)} octets, {NU_BYTES} attendus")
    return _bytes_to_syms(nu, NU_SYMBOLS, _y=_y)


def symbols_to_nu(syms: List[int]) -> bytes:
    """Inverse de nu_to_symbols()."""
    if len(syms) != NU_SYMBOLS:
        raise ValueError(f"{len(syms)} symboles reçus, {NU_SYMBOLS} attendus")
    return _syms_to_bytes(syms, NU_BYTES)
