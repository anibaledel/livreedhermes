# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
crypto_core.py — Primitives cryptographiques pures
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Extrait de stegano_lib.py (refactor de modularisation) : ce fichier ne
contient QUE la couche cryptographique — ChaCha20-Poly1305 à nonce étendu
par HKDF (voir LH-5 ci-dessous), key commitment HMAC-SHA256, et
l'encodage base-44 uniforme du payload chiffré. Aucune logique de
placement géométrique ici.

Portée destinée à la revue cryptographique externe (voir
NOTE_TECHNIQUE_CRYPTOEXPERTS.md dans le paquet d'export) : la couche
stéganographique (carter.py, stegano_classic.py) ne revendique aucune
propriété cryptographique propre et est délibérément hors de ce fichier.

Audit cryptologique : 2026-09-10
NOTE AUDIT : symboles du message ET bruit uniformes sur [0..ALPHA_LEN-1]
             → aucun distingueur statistique sur la valeur des cellules.
NOTE AUDIT : Confidentialité assurée par la construction ci-dessous, pas
             par la géométrie.
"""

import hashlib
import hmac as _hmac_mod
import os, secrets, struct, math
from typing import List
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

def _chacha20_hkdf_enc(key: bytes, plaintext: bytes, aad: bytes = b'') -> bytes:
    """
    ChaCha20-Poly1305 à nonce étendu par HKDF. Nonce 24 bytes. [A3]

    LH-5 (audit G. Kerma) : renommée depuis _xchacha_enc. Bien que le
    schéma soit structurellement analogue à XChaCha20-Poly1305 (nonce 24
    octets → sous-clé → ChaCha20-Poly1305), la sous-clé est dérivée par
    HKDF-SHA256 et non par HChaCha20 comme le spécifie XChaCha20
    (draft-irtf-cfrg-xchacha). La construction est au moins aussi sûre
    pour cet usage mais n'est PAS interopérable avec les implémentations
    standard de XChaCha20-Poly1305 (libsodium, PyNaCl, etc.) : un
    ciphertext produit ici ne se déchiffre qu'avec cette même fonction,
    pas avec un décodeur XChaCha20 conforme au brouillon IETF. D'où le
    nom «ChaCha20-Poly1305 à nonce étendu par HKDF» — et l'identifiant
    _chacha20_hkdf_enc — plutôt que «XChaCha20-Poly1305» pour désigner
    cette construction sans ambiguïté, dans le code comme dans la doc.
    """
    nonce  = os.urandom(24)
    subkey = _HKDF(_hashes.SHA256(), 32, salt=nonce[:16],
                   info=b'XChaCha20-HChaCha20-subkey').derive(key)
    ct = ChaCha20Poly1305(subkey).encrypt(b'\x00'*4 + nonce[16:], plaintext, aad or None)
    return nonce + ct

def _chacha20_hkdf_dec(key: bytes, data: bytes, aad: bytes = b'') -> bytes:
    """ChaCha20-Poly1305 à nonce étendu par HKDF — déchiffrement (LH-5, voir _chacha20_hkdf_enc ; renommée depuis _xchacha_dec). [A3]"""
    if len(data) < 24 + 16:
        raise ValueError(f"Ciphertext trop court : {len(data)} octets, minimum 40 requis")
    nonce, ct = data[:24], data[24:]
    subkey = _HKDF(_hashes.SHA256(), 32, salt=nonce[:16],
                   info=b'XChaCha20-HChaCha20-subkey').derive(key)
    return ChaCha20Poly1305(subkey).decrypt(b'\x00'*4 + nonce[16:], ct, aad or None)

ALPHABET  = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-'
ALPHA_LEN = len(ALPHABET)   # 44
_AEAD_OVERHEAD = 32 + 24 + 16   # commitment HMAC + nonce ChaCha20-HKDF + tag Poly1305
_MAX_PAYLOAD   = 1 << 24        # garde-fou en-tête (16 Mio)

# ── Encodage base-44 ─────────────────────────────────────────────────────────
# CORRECTIF AUDIT : l'encodage en nibbles plaçait les octets du message dans
# [0..15] alors que le bruit couvre [0..43]. Toute cellule > 15 était donc
# prouvablement du bruit, et une forme dont les 6 cellules valent <= 15 avait
# 1 chance sur 432 d'être du bruit : les blocs porteurs se localisaient
# statistiquement sans aucune clé. Le message restait chiffré, mais sa
# PRÉSENCE et son EMPLACEMENT étaient détectables — l'inverse du but d'un
# système stéganographique.
#
# Les symboles portent désormais la même loi uniforme sur [0..ALPHA_LEN-1]
# que le bruit. Le payload est vu comme un entier, complété par un aléa de
# rembourrage qui rend la distribution des symboles uniforme à 2^-64 près,
# puis écrit en base ALPHA_LEN. Bonus : 1,47 symbole par octet au lieu de 2.

_UNIFORM_MARGIN_BITS = 64   # écart à l'uniformité : <= 2^-64

def _sym_count(nbytes: int) -> int:
    """Nombre de symboles base-44 pour nbytes octets, marge d'uniformité incluse."""
    return math.ceil((8*nbytes + _UNIFORM_MARGIN_BITS) / math.log2(ALPHA_LEN))

_SYM_HEADER = _sym_count(4)   # en-tête : longueur du payload sur 4 octets

def _bytes_to_syms(b: bytes, m: int) -> List[int]:
    """Octets → m symboles uniformes sur [0..ALPHA_LEN-1]."""
    span = 1 << (8*len(b))
    k = (ALPHA_LEN ** m) // span
    if k < 1:
        raise ValueError(f"{m} symboles insuffisants pour {len(b)} octets")
    u = int.from_bytes(b, 'big') + span * secrets.randbelow(k)
    out = []
    for _ in range(m):
        u, r = divmod(u, ALPHA_LEN)
        out.append(r)
    return out

def _syms_to_bytes(syms: List[int], nbytes: int) -> bytes:
    """Inverse de _bytes_to_syms : le rembourrage aléatoire disparaît au modulo."""
    u = 0
    for d in reversed(syms):
        if not 0 <= d < ALPHA_LEN:
            raise ValueError(f"Symbole hors plage : {d}")
        u = u * ALPHA_LEN + d
    return (u & ((1 << (8*nbytes)) - 1)).to_bytes(nbytes, 'big')

# ── Chiffrement du message — Key commitment + ChaCha20-HKDF ──────────────────

def _commit_key(steg_key: bytes) -> bytes:
    """Clé HMAC dédiée au key commitment (séparée de la clé de chiffrement)."""
    return _HKDF(_hashes.SHA256(), 32,
                  salt=b'commit-v1',
                  info=b'key-commitment').derive(steg_key)

def _encrypt(message: str, steg_key: bytes) -> bytes:
    """
    Chiffre avec ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5, voir
    _chacha20_hkdf_enc) + key commitment HMAC-SHA256 [correction 3].

    Format : [32B HMAC(commit_key, header||inner)][inner]
      inner = nonce(24) + ciphertext + tag(16)
    La longueur est portée séparément par l'en-tête base-44 de la grille.

    Key commitment : ce ciphertext ne peut déchiffrer valablement
    que sous une seule clé — élimine les partitioning oracle attacks.
    """
    # LH-1 (audit G. Kerma) : refuser un message hors alphabet plutôt que le
    # mutiler silencieusement. L'ancien errors='replace' remplaçait tout
    # caractère non-ASCII par '?' sans prévenir l'appelant — un accent oublié
    # se retrouvait décodé en un message différent du message saisi.
    msg_upper = message.upper()
    invalid = [c for c in msg_upper if c not in ALPHABET]
    if invalid:
        unique_invalid = sorted(set(invalid))
        raise ValueError(
            f"Message contient {len(invalid)} caractère(s) hors alphabet : "
            f"{unique_invalid!r}. Alphabet accepté : {ALPHABET!r}. "
            f"Conseil : translittérer les accents (É→E, À→A, etc.) "
            f"ou retirer la ponctuation non supportée avant l'envoi.")
    msg_b    = msg_upper.encode('ascii')
    inner    = _chacha20_hkdf_enc(steg_key, msg_b)
    ck       = _commit_key(steg_key)
    # LH-4 (audit G. Kerma) : authentifier l'en-tête de longueur. Le HMAC ne
    # portait auparavant que sur `inner` ; la longueur totale du payload
    # (portée séparément, en symboles, par payload_to_symbols()) n'était pas
    # couverte par le commitment. `header` reproduit exactement l'en-tête que
    # payload_to_symbols() calculera pour ce payload (4 octets, longueur de
    # commit+inner) ; _decrypt() le reconstruit depuis le total_len déjà lu
    # du flux de symboles — aucun changement de format, juste du contenu du
    # HMAC.
    header   = struct.pack('>I', 32 + len(inner))
    commit   = _hmac_mod.new(ck, header + inner, hashlib.sha256).digest()  # 32 bytes
    return commit + inner

def _decrypt(vals: List[int], steg_key: bytes) -> str:
    """
    Vérifie le key commitment PUIS déchiffre.
    Double protection : HMAC invalide → rejet immédiat sans tentative de déchiffrement.
    """
    if len(vals) < _SYM_HEADER:
        raise ValueError("Grille trop petite")
    total_len = struct.unpack('>I', _syms_to_bytes(vals[:_SYM_HEADER], 4))[0]
    if total_len > _MAX_PAYLOAD:
        raise ValueError("En-tête invalide — clé de dissimulation incorrecte")
    need = _SYM_HEADER + _sym_count(total_len)
    if len(vals) < need:
        raise ValueError(f"Positions insuffisantes : {len(vals)} < {need}")
    payload = _syms_to_bytes(vals[_SYM_HEADER:need], total_len)
    if len(payload) < 32:
        raise ValueError("Payload trop court (key commitment manquant)")
    commit_recv, inner = payload[:32], payload[32:]
    # Vérifier key commitment avant déchiffrement.
    # LH-4 : header reconstruit depuis total_len (déjà lu ci-dessus, égal à
    # len(payload) == 32+len(inner)) — même valeur que celle authentifiée
    # côté _encrypt(), sans avoir à la transporter une seconde fois.
    ck          = _commit_key(steg_key)
    header      = struct.pack('>I', total_len)
    commit_calc = _hmac_mod.new(ck, header + inner, hashlib.sha256).digest()
    if not _hmac_mod.compare_digest(commit_recv, commit_calc):
        raise ValueError("Key commitment invalide — clé incorrecte ou données altérées")
    try:
        pt = _chacha20_hkdf_dec(steg_key, inner)
    except Exception:
        raise ValueError("Tag Poly1305 invalide — clé incorrecte ou données altérées")
    try:
        return pt.decode('ascii', errors='strict')
    except UnicodeDecodeError:
        raise ValueError(
            "Texte déchiffré non-ASCII — données corrompues malgré une "
            "authentification AEAD valide")

# ── Flux de symboles — API pour carter.py et grid_90.py ──────────────────────
# Ces modules construisent leur propre flux et appellent _decrypt() dessus.
# Ils doivent donc produire exactement le même flux que encode() : en-tête de
# longueur puis payload, en symboles base-44. Sans cela, ils continueraient
# d'écrire des nibbles [0..15] repérables dans un bruit couvrant [0..43].

def payload_to_symbols(payload: bytes) -> List[int]:
    """Payload chiffré → flux de symboles uniformes sur [0..ALPHA_LEN-1]."""
    return (_bytes_to_syms(struct.pack('>I', len(payload)), _SYM_HEADER)
            + _bytes_to_syms(payload, _sym_count(len(payload))))

def symbols_needed(payload_len: int) -> int:
    """Nombre de positions nécessaires pour un payload de cette taille."""
    return _SYM_HEADER + _sym_count(payload_len)

def max_payload_for(n_positions: int) -> int:
    """Plus grand payload (en octets) tenant dans n_positions symboles."""
    avail = n_positions - _SYM_HEADER
    if avail <= 0:
        return 0
    lo, hi = 0, avail
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if _sym_count(mid) <= avail: lo = mid
        else: hi = mid - 1
    return lo

def max_message_for(n_positions: int) -> int:
    """Plus long message clair tenant dans n_positions symboles."""
    return max(0, max_payload_for(n_positions) - _AEAD_OVERHEAD)

# ── Bruit de grille — remplissage CSPRNG en bloc ──────────────────────────────
# Mesure arm64 (gk2/MOCHAbin, audit G. Kerma, §4.8) : le remplissage du bruit
# d'une grille Carter 90×90 via secrets.randbelow(ALPHA_LEN) x 8100 appels
# individuels coûte ~42,5 ms, soit ~85% du coût d'un encode() complet
# (~50 ms). Le CSPRNG lui-même n'est pas le goulot — c'est le coût Python
# de 8100 appels de fonction séparés. _random_symbols() tire un seul bloc
# os.urandom() puis fait le rejection sampling directement sur les octets,
# sans appel de fonction par cellule. Même garantie de sécurité que
# secrets.randbelow() : CSPRNG (os.urandom), distribution exactement
# uniforme sur [0..ALPHA_LEN-1] par rejet (aucun biais modulo) — mesuré
# ~×6 sur le débit d'encodage (~50 ms -> ~8 ms).

def _random_symbols(n: int) -> List[int]:
    """
    n symboles uniformes sur [0..ALPHA_LEN-1], tirés d'un CSPRNG (os.urandom)
    par rejection sampling en bloc plutôt que n appels à secrets.randbelow().
    """
    if n <= 0:
        return []
    lim = (256 // ALPHA_LEN) * ALPHA_LEN   # 220 pour ALPHA_LEN=44 : rejette [220..255]
    out = []
    while len(out) < n:
        # Sur-échantillonne pour couvrir le taux de rejet (~14% pour 44),
        # avec une marge fixe pour les petits n.
        need = n - len(out)
        buf  = os.urandom(need + need // 6 + 16)
        for b in buf:
            if b < lim:
                out.append(b % ALPHA_LEN)
                if len(out) >= n: break
    return out
