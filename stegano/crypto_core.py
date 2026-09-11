# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
crypto_core.py — Primitives cryptographiques pures
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Extrait de stegano_lib.py (refactor de modularisation) : ce fichier ne
contient QUE la couche cryptographique — XChaCha20-Poly1305 standard
(HChaCha20 pur Python + ChaCha20Poly1305, format v3, tâche 1 —
remplace la construction à sous-clé HKDF de LH-5, non interopérable),
key commitment HMAC-SHA256, et l'encodage base-44 uniforme du payload
chiffré (format v3, tâche 2). Aucune logique de placement géométrique
ici.

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

# ── HChaCha20 (pur Python) — draft-irtf-cfrg-xchacha §2.2 ────────────────────
# Tache 1 (format v3) : remplace la sous-cle derivee par HKDF (LH-5) par le
# vrai HChaCha20, ce qui rend la construction interoperable avec toute
# implementation standard de XChaCha20-Poly1305 (libsodium, PyNaCl, etc.).

_CHACHA_CONSTANTS = (0x61707865, 0x3320646e, 0x79622d32, 0x6b206574)

def _rotl32(x: int, n: int) -> int:
    x &= 0xffffffff
    return ((x << n) | (x >> (32 - n))) & 0xffffffff

def _qr(s: List[int], a: int, b: int, c: int, d: int) -> None:
    s[a] = (s[a] + s[b]) & 0xffffffff; s[d] ^= s[a]; s[d] = _rotl32(s[d], 16)
    s[c] = (s[c] + s[d]) & 0xffffffff; s[b] ^= s[c]; s[b] = _rotl32(s[b], 12)
    s[a] = (s[a] + s[b]) & 0xffffffff; s[d] ^= s[a]; s[d] = _rotl32(s[d], 8)
    s[c] = (s[c] + s[d]) & 0xffffffff; s[b] ^= s[c]; s[b] = _rotl32(s[b], 7)

def hchacha20(key: bytes, nonce16: bytes) -> bytes:
    """
    HChaCha20 : dérive une sous-clé 256 bits depuis une clé 256 bits et un
    nonce 128 bits, via la permutation ChaCha20 (20 tours, PAS d'addition
    de l'état initial en sortie — contrairement au bloc ChaCha20 complet).
    draft-irtf-cfrg-xchacha §2.2. Vérifié contre le vecteur officiel §2.2.1
    (voir test_regression.py::TestXChaCha20Vectors).
    """
    if len(key) != 32:
        raise ValueError(f"Clé HChaCha20 : 32 octets requis, reçu {len(key)}")
    if len(nonce16) != 16:
        raise ValueError(f"Nonce HChaCha20 : 16 octets requis, reçu {len(nonce16)}")
    state = list(_CHACHA_CONSTANTS)
    state += list(struct.unpack('<8I', key))
    state += list(struct.unpack('<4I', nonce16))
    for _ in range(10):  # 20 tours = 10 doubles-tours
        _qr(state, 0, 4, 8, 12); _qr(state, 1, 5, 9, 13)
        _qr(state, 2, 6, 10, 14); _qr(state, 3, 7, 11, 15)
        _qr(state, 0, 5, 10, 15); _qr(state, 1, 6, 11, 12)
        _qr(state, 2, 7, 8, 13); _qr(state, 3, 4, 9, 14)
    out_words = state[0:4] + state[12:16]  # pas de state initial ajouté (HChaCha20, pas ChaCha20)
    return struct.pack('<8I', *out_words)

# ── XChaCha20-Poly1305 standard ───────────────────────────────────────────────
def _xchacha20_enc(key: bytes, plaintext: bytes, aad: bytes = b'') -> bytes:
    """
    XChaCha20-Poly1305 standard (draft-irtf-cfrg-xchacha). Nonce 24 octets :
    subkey = HChaCha20(key, nonce[0:16]) ; nonce ChaCha20-Poly1305 12 octets
    = 4 zéros || nonce[16:24]. Interopérable avec toute implémentation
    standard (libsodium, PyNaCl, etc.) — contrairement à la construction à
    sous-clé HKDF qu'elle remplace (LH-5, tâche 1 du format v3).
    """
    nonce  = os.urandom(24)
    subkey = hchacha20(key, nonce[:16])
    chacha_nonce = b'\x00\x00\x00\x00' + nonce[16:]
    ct = ChaCha20Poly1305(subkey).encrypt(chacha_nonce, plaintext, aad or None)
    return nonce + ct

def _xchacha20_dec(key: bytes, data: bytes, aad: bytes = b'') -> bytes:
    """XChaCha20-Poly1305 standard — déchiffrement. Voir _xchacha20_enc."""
    if len(data) < 24 + 16:
        raise ValueError(f"Ciphertext trop court : {len(data)} octets, minimum 40 requis")
    nonce, ct = data[:24], data[24:]
    subkey = hchacha20(key, nonce[:16])
    chacha_nonce = b'\x00\x00\x00\x00' + nonce[16:]
    return ChaCha20Poly1305(subkey).decrypt(chacha_nonce, ct, aad or None)

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

# ── En-tête de longueur à entropie pleine ─────────────────────────────────────
# CORRECTIF AUDIT N1 — en-tête de longueur non uniforme.
# _bytes_to_syms plaçait la valeur encodée dans les bits de POIDS FAIBLE :
#   u = data + span·randbelow(k),  span = 2^(8·len(b))
# Pour un PAYLOAD, `data` est du chiffré uniformément aléatoire, donc data mod
# ALPHA_LEN est déjà uniforme et le symbole de poids faible l'est aussi. Pour
# l'EN-TÊTE, `data` est la longueur — une valeur connue, de faible entropie et
# souvent constante d'un message à l'autre. Comme span = 2^32 ≡ 4 (mod 44),
# le symbole de poids faible de l'en-tête ne parcourait que le sous-groupe
# {0,4,…,40} translaté par (longueur mod 44) : 11 valeurs sur 44. C'est un
# distingueur exploitable SANS clé, et la longueur elle-même se lisait en
# clair depuis le flux de symboles.
#
# L'en-tête utilise désormais un encodage dédié où la longueur occupe les
# symboles de POIDS FORT et un rembourrage aléatoire occupe les poids faibles :
#   u = longueur·k + randbelow(k),  k = ALPHA_LEN^_SYM_HEADER // 2^32
# Comme 44^_SYM_HEADER = 2^36·11^18 est divisible par 2^32, on a
# k = 2^4·11^18 = 44·(4·11^17) : k est un multiple de 44 (et même de 44^2).
# Les deux symboles de poids faible de l'en-tête sont donc EXACTEMENT uniformes
# sur [0..43], quelle que soit la longueur ; les suivants le sont à la même
# marge que le payload. La longueur reste recouvrable par u // k, et le HMAC
# LH-4 continue de porter sur struct.pack('>I', longueur)‖inner (inchangé :
# _decrypt reconstruit la même longueur avant vérification).
_HEADER_SPAN  = 1 << 32                                   # longueur sur 4 octets
_HEADER_SLOTS = (ALPHA_LEN ** _SYM_HEADER) // _HEADER_SPAN  # k, multiple de 44

def _header_to_syms(length: int) -> List[int]:
    """Longueur (< 2^32) → _SYM_HEADER symboles à entropie pleine (voir N1)."""
    if not 0 <= length < _HEADER_SPAN:
        raise ValueError(f"Longueur d'en-tête hors plage : {length}")
    u = length * _HEADER_SLOTS + secrets.randbelow(_HEADER_SLOTS)
    out = []
    for _ in range(_SYM_HEADER):
        u, r = divmod(u, ALPHA_LEN)
        out.append(r)
    return out

def _syms_to_header(syms: List[int]) -> int:
    """Inverse de _header_to_syms : le rembourrage aléatoire disparaît au // k."""
    u = 0
    for d in reversed(syms):
        if not 0 <= d < ALPHA_LEN:
            raise ValueError(f"Symbole hors plage : {d}")
        u = u * ALPHA_LEN + d
    return u // _HEADER_SLOTS

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
    Chiffre avec XChaCha20-Poly1305 standard (tâche 1, voir _xchacha20_enc)
    + key commitment HMAC-SHA256 [correction 3].

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
    inner    = _xchacha20_enc(steg_key, msg_b)
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
    total_len = _syms_to_header(vals[:_SYM_HEADER])   # N1 : en-tête entropie pleine
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
        pt = _xchacha20_dec(steg_key, inner)
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

def random_grid(rows: int, cols: int) -> List[List[int]]:
    """Grille rows×cols de symboles uniformes sur [0..ALPHA_LEN-1] (CSPRNG).

    Remplace le `secrets.randbelow(ALPHA_LEN)` appelé cellule-par-cellule (un
    appel Python + un tirage os.urandom pour CHAQUE cellule) par un unique
    tirage `os.urandom` en bloc, échantillonné par rejet vers [0..ALPHA_LEN-1].
    Même source (os.urandom) et même uniformité (le rejet des octets
    `>= 256 - 256 % ALPHA_LEN` supprime le biais modulo), mais ~40× plus rapide
    sur une grille 90×90 : l'initialisation du bruit de couverture dominait le
    coût d'encodage Carter (mesuré ~42 ms/50 ms sur ARM Cortex-A72)."""
    n = rows * cols
    limit = 256 - (256 % ALPHA_LEN)      # ALPHA_LEN=44 -> 220 ; octets >=220 rejetés
    flat: List[int] = []
    while len(flat) < n:
        manque = n - len(flat)
        buf = os.urandom(manque * 256 // limit + 16)   # sur-tirage ~ taux de rejet
        flat.extend(b % ALPHA_LEN for b in buf if b < limit)
    return [flat[r * cols:(r + 1) * cols] for r in range(rows)]

def payload_to_symbols(payload: bytes) -> List[int]:
    """Payload chiffré → flux de symboles uniformes sur [0..ALPHA_LEN-1]."""
    return (_header_to_syms(len(payload))
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

# NOTE : le remplissage de bruit de grille (mesure arm64 gk2/MOCHAbin, audit
# G. Kerma, §4.8 — voir BENCHMARKS_ARM64.md) est traité par random_grid()
# ci-dessus, pas ici. Une implémentation équivalente (_random_symbols, flux
# plat + reshape manuel) a existé brièvement dans cette branche ; random_grid
# est la version retenue après fusion avec la branche perf indépendante
# (même idée, même mesure, implémentation légèrement différente).
