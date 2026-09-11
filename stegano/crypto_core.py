# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
crypto_core.py — Primitives cryptographiques pures
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Extrait de stegano_lib.py (refactor de modularisation) : ce fichier ne
contient QUE la couche cryptographique — XChaCha20-Poly1305 standard
(HChaCha20 pur Python + ChaCha20Poly1305, format v3, tâche 1 —
remplace la construction à sous-clé HKDF de LH-5, non interopérable),
key commitment HMAC-SHA256, et PayloadToSymbols à charge utile de
longueur FIXE (Définition 3.6, format v3, tâche 2 — remplace le
correctif N1 en entier : plus d'en-tête de longueur séparé, la longueur
est chiffrée à l'intérieur du payload lui-même, et le nombre de
positions message consommées ne dépend que de la grammaire, jamais du
message). Aucune logique de placement géométrique ici.

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
import os, secrets, struct
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
_AEAD_OVERHEAD = 32 + 24 + 16   # commitment HMAC + nonce XChaCha20 + tag Poly1305

# ── Encodage base-44 — PayloadToSymbols (Définition 3.6, format v3) ──────────
# CORRECTIF AUDIT (historique) : l'encodage en nibbles plaçait les octets du
# message dans [0..15] alors que le bruit couvre [0..43]. Toute cellule > 15
# était donc prouvablement du bruit : les blocs porteurs se localisaient
# statistiquement sans aucune clé. Le message restait chiffré, mais sa
# PRÉSENCE et son EMPLACEMENT étaient détectables.
#
# Les symboles portent la même loi uniforme sur [0..ALPHA_LEN-1] que le
# bruit : le payload est vu comme un entier x, complété par un aléa de
# rembourrage y qui rend la distribution des symboles uniforme à 2^-λs près
# (λs = _LAMBDA_S), puis écrit en base ALPHA_LEN — PayloadToSymbols,
# Définition 3.6 du bloc B (carter_v6_fixes.tex).

_LAMBDA_S = 64   # λ_s : marge de sécurité statistique, écart <= 2^-64 à l'uniforme

def _smallest_m(target_bits: int) -> int:
    """
    Plus petit entier m tel que ALPHA_LEN**m >= 2**target_bits.

    Recherche entière exacte (Définition 3.6) : aucun flottant n'entre dans
    la décision, uniquement des comparaisons entre entiers Python arbitraires
    (ALPHA_LEN**m face à 2**target_bits).
    """
    if target_bits <= 0:
        return 0
    threshold = 1 << target_bits
    m, val = 1, ALPHA_LEN
    while val < threshold:
        m += 1
        val *= ALPHA_LEN
    return m

def _capacity_k(L: int) -> int:
    """
    k = 8·floor((L·log2(ALPHA_LEN) − λs) / 8), en bits, calculé en entiers
    exacts. Charge utile à longueur fixe (tâche 2, format v3) : k est la
    taille en bits du payload chiffré que L positions message peuvent porter
    avec la marge d'uniformité λs.

    j = plus grand entier tel que 2**(8·(j+1) + λs) <= ALPHA_LEN**L —
    reformulation strictement équivalente et exacte de
    8·(j+1) + λs <= L·log2(ALPHA_LEN) (les deux membres élevés en puissance
    de 2 face à ALPHA_LEN**L, deux entiers Python arbitraires ; aucun
    flottant, même en interne).
    """
    if L <= 0:
        return 0
    alpha_L = ALPHA_LEN ** L
    j = 0
    while (1 << (8*(j+1) + _LAMBDA_S)) <= alpha_L:
        j += 1
    return 8 * j

def _bytes_to_syms(payload: bytes, m: int) -> List[int]:
    """
    PayloadToSymbols (Définition 3.6) : x = int(P) ; Q = floor(α^m / 2^k) ;
    y = random(Q) ; z = x + 2^k·y ; sortie = m chiffres de z en base α.
    """
    k = 8 * len(payload)
    span = 1 << k
    Q = (ALPHA_LEN ** m) // span
    if Q < 1:
        raise ValueError(f"{m} symboles insuffisants pour {len(payload)} octets")
    x = int.from_bytes(payload, 'big')
    y = secrets.randbelow(Q)
    z = x + span * y
    out = []
    for _ in range(m):
        z, r = divmod(z, ALPHA_LEN)
        out.append(r)
    return out

def _syms_to_bytes(syms: List[int], nbytes: int) -> bytes:
    """Inverse de _bytes_to_syms : x = z mod 2^k, le rembourrage y disparaît."""
    z = 0
    for d in reversed(syms):
        if not 0 <= d < ALPHA_LEN:
            raise ValueError(f"Symbole hors plage : {d}")
        z = z * ALPHA_LEN + d
    return (z & ((1 << (8*nbytes)) - 1)).to_bytes(nbytes, 'big')

def _cleartext_capacity(L: int):
    """
    (payload_bytes, cleartext_len) pour L positions message.
      payload_bytes : taille du payload chiffré (commit + nonce + ct + tag)
      cleartext_len : taille du clair AVANT chiffrement
                      (longueur 4B + message + rembourrage zéro)
    (0, 0) si L est trop petit pour porter ne serait-ce qu'un message vide
    (il faut au moins les 4 octets du champ de longueur).
    """
    payload_bytes = _capacity_k(L) // 8
    cleartext_len = payload_bytes - _AEAD_OVERHEAD
    if cleartext_len < 4:
        return 0, 0
    return payload_bytes, cleartext_len

def symbols_needed(L: int) -> int:
    """
    Nombre de positions consommées pour une grammaire à L positions message.
    Format v3 (tâche 2) : charge utile à longueur fixe — toutes les
    positions message portent un symbole de charge utile, donc = L.
    """
    return L

def max_payload_for(L: int) -> int:
    """Taille en octets du payload chiffré porté par L positions message."""
    payload_bytes, _ = _cleartext_capacity(L)
    return payload_bytes

def max_message_for(L: int) -> int:
    """Plus long message clair (octets) tenant dans L positions message."""
    _, cleartext_len = _cleartext_capacity(L)
    return max(0, cleartext_len - 4)

# ── Labels HKDF centralisés (format v3, tâche 3) ──────────────────────────────
# Tous les labels HKDF (salt, info) de la couche Carter et du key commitment,
# centralisés ici pour que LH-5 (spécification d'interopérabilité) les
# reprenne tels quels. Convention : salt = 'Carter-<variante>-v3' (ou
# 'commit-v3' pour le commitment, partagé par tous les schémas — classique,
# Carter, grid_90) ; info = but précis de CETTE dérivation, distinct pour
# toute paire (variante, but) — y compris les masques, qui utilisaient
# jusqu'ici un domaine PARTAGÉ entre Carter Random/18/Hybrid (les trois
# réutilisent le même _carter_split, donc le même grammar_key pour une
# master_key donnée ; _derive_masks(grammar_key, n) ne dépendait que de ces
# deux valeurs — sous la même clé, les trois variantes dérivaient donc EXACTEMENT
# le même flux de masques jusqu'à la longueur n commune). Désormais
# domaine-séparées par variante (masks_info distinct), fermant cet écart.
#
# Hors de ce dict, volontairement : secu_box.py (session X25519, chiffrement
# d'identité, déni — ce dernier remplacé en entier par la tâche 5, qui
# choisira ses propres labels sur ce même modèle) et vault_lib.py — ce ne
# sont pas des primitives du format Carter v3, et l'une d'elles est
# explicitement protégée contre un renommage par des données déjà exportées
# (voir le commentaire sur _chacha20_hkdf_enc2/dec2 dans secu_box.py).
LABELS = {
    'commit': {
        'salt': b'commit-v3',
        'info': b'key-commitment',
    },
    'carter256': {
        'split_salt':           b'Carter-256-v3',
        'encrypt_info':         b'encrypt',
        'grammar_info':         b'grammar',
        'grammar_content_salt': b'Carter-256-grammar-v3',
        'grammar_content_info': b'block-roles-and-forms',
    },
    'carter360': {
        'split_salt':           b'Carter-360-v3',
        'encrypt_info':         b'encrypt',
        'grammar_info':         b'grammar',
        'grammar_content_salt': b'Carter-360-grammar-v3',
        'grammar_content_info': b'block-roles-360-forms',
    },
    'cartermix': {
        'split_salt':           b'Carter-mix-v3',
        'encrypt_info':         b'encrypt',
        'grammar_info':         b'grammar',
        'grammar_content_salt': b'Carter-mix-grammar-v3',
        'grammar_content_info': b'mixed-256-360-grammar',
    },
    'carterrandom': {
        # Random/18/Hybrid réutilisent _carter_split (Carter-256) pour
        # xchacha_key/grammar_key — c'est un choix délibéré, documenté dans
        # carter_random.py ("réutilise les primitives déjà auditées"), pas
        # une omission de la tâche 3. Seules les dérivations SECONDAIRES
        # depuis grammar_key sont propres à chaque variante ci-dessous.
        'params_salt':             b'Carter-random-params-v3',
        'params_info':             b'seed-and-mode',
        'grammar_individual_salt': b'Carter-random-v3',
        'grammar_individual_info': b'grammar-individual',
        'grammar_meta_salt':       b'Carter-random-meta-v3',
        'grammar_meta_roles_info': b'meta-roles',
        'grammar_meta_forms_info': b'block-forms',
    },
    'carter18': {
        'grammar_salt': b'Carter-18-v3',
        'grammar_info': b'grammar-18',
        'seed_salt':    b'Carter-18-seed-v3',
        'seed_info':    b'seed',
    },
    'carterhybrid': {
        'grammar_salt':  b'Carter-hybrid-v3',
        'grammar_info':  b'grammar-hybrid',
        'seed18_salt':   b'Carter-hybrid-seed-v3',
        'seed18_info':   b'seed-18',
        'seed6_salt':    b'Carter-hybrid-seed6-v3',
        'seed6_info':    b'seed-6',
        'subblock_salt': b'Carter-hybrid-sub-v3',
    },
    'mask_seed': {
        # Point d'entrée labellisé pour _derive_masks() (carter_random.py) :
        # mask_key = HKDF-SHA256(grammar_key, salt, info=domaine), domaine
        # séparé par variante ; le flux de masques lui-même vient ensuite
        # du keystream ChaCha20(mask_key, nonce=0) — voir carter_random.py.
        'salt':        b'Carter-masks-v3',
        'info_random': b'position-masks-random',
        'info_18':     b'position-masks-18',
        'info_hybrid': b'position-masks-hybrid',
    },
    'redraw': {
        # Racine du redraw déterministe (tâche 4) — voir _redraw_grammar_key
        # ci-dessous pour l'ordre exact de la dérivation complète. Une
        # entrée par variante ayant son propre C_PUB (Random 90 et 360
        # partagent la même racine que le reste de Random : le grid_size
        # n'est pas secret et influence déjà la dérivation en aval via
        # _derive_params(grammar_key_ctr, grid_size), inutile de le
        # dupliquer ici).
        'carter256':     b'Carter-256-redraw-v3',
        'carter360':     b'Carter-360-redraw-v3',
        'cartermix':     b'Carter-mix-redraw-v3',
        'carterrandom':  b'Carter-random-redraw-v3',
        'carter18':      b'Carter-18-redraw-v3',
        'carterhybrid':  b'Carter-hybrid-redraw-v3',
    },
}

# ── Capacité minimale publique — C_PUB (format v3, tâche 4) ──────────────────
# Valeurs arbitrées par l'utilisateur (2026-09-11) à partir de la
# distribution empirique de capacité sur 10 000 clés par variante (rapport
# complet : docs/PAPER_NUMBERS_v3.md, tâche 8). Choisies sous le p1 mesuré
# (moins de 1 % des clés tombent en dessous SANS même passer par le
# redraw), avec marge : la queue basse est fine (voir le rapport), donc le
# redraw (MAX_REDRAWS tentatives, ci-dessous) absorbe le reste avec une
# probabilité d'échec totale négligeable.
#
# En octets de message (= caractères, alphabet ASCII 1 octet/caractère).
# Random 90 et Random 360 sont deux cibles DISTINCTES : même code, deux
# géométries, deux distributions de capacité mesurées séparément.
C_PUB = {
    'carter256':       150,
    'carter360':        230,
    'cartermix':        500,
    'carterrandom90':   150,
    'carterrandom360': 1000,
    'carter18':         350,
    'carterhybrid':     100,
}

MAX_REDRAWS = 10   # tentatives ctr=0..9 ; échec au-delà (voir _redraw_grammar_key)

def _redraw_grammar_key(grammar_key: bytes, variant: str, ctr: int) -> bytes:
    """
    Racine du redraw déterministe (tâche 4, format v3) : reforge
    grammar_key en fonction d'un compteur ctr, de sorte qu'un redraw
    retire ENSEMBLE tout ce qui en dépend en cascade — seed, mode
    (individuel/méta), rôles ET formes — et pas seulement le contenu final
    de la grammaire à travers une dérivation secondaire isolée.

    Ordre exact de la dérivation complète pour une variante donnée (à
    reprendre tel quel par LH-5) :
      1. xchacha_key, grammar_key = <split variante>(master_key)
         — UNE SEULE FOIS par appel encode/decode. xchacha_key NE DÉPEND
         JAMAIS de ctr : la séparation grammaire/chiffrement (correction 2,
         Carter) reste intacte quel que soit le nombre de redraws.
      2. Pour ctr = 0, 1, …, MAX_REDRAWS-1 :
           grammar_key_ctr = _redraw_grammar_key(grammar_key, variant, ctr)
           <dériver seed/mode/grammaire/masques DEPUIS grammar_key_ctr,
            exactement comme avant la tâche 4 — aucune fonction de
            dérivation existante n'est modifiée, seule la VALEUR qu'on lui
            passe change>
           si capacité(grammar_key_ctr) >= C_PUB[variant] : succès, arrêt
      3. Échec après MAX_REDRAWS tentatives : ValueError explicite
         invitant à régénérer la clé maître — jamais de grille construite,
         même partielle (l'échec est un événement PUBLIC : C_PUB et
         MAX_REDRAWS sont publics, la probabilité d'épuiser les 10
         tentatives est negligeable — voir docs/PAPER_NUMBERS_v3.md —, mais
         quand elle survient elle ne doit rien apprendre de plus que « cette
         clé est à régénérer »).

    ctr=0 n'est PAS un cas particulier « sans redraw » : même la première
    tentative passe par cette dérivation, pour que le code de recherche
    soit uniforme (pas de branchement encode/decode selon qu'un redraw a
    eu lieu ou non).
    """
    return _HKDF(_hashes.SHA256(), 32,
                 salt=LABELS['redraw'][variant],
                 info=b'redraw-root|ctr=' + ctr.to_bytes(4, 'big')).derive(grammar_key)

# ── Chiffrement du message — Key commitment + XChaCha20-Poly1305 ─────────────

def _commit_key(steg_key: bytes) -> bytes:
    """Clé HMAC dédiée au key commitment (séparée de la clé de chiffrement)."""
    return _HKDF(_hashes.SHA256(), 32,
                  salt=LABELS['commit']['salt'],
                  info=LABELS['commit']['info']).derive(steg_key)

def _validate_alphabet(message: str) -> bytes:
    """Majuscule + vérifie l'alphabet, renvoie les octets ASCII (LH-1).

    Refuse un message hors alphabet plutôt que de le mutiler silencieusement.
    L'ancien errors='replace' remplaçait tout caractère non-ASCII par '?' sans
    prévenir l'appelant — un accent oublié se retrouvait décodé en un message
    différent du message saisi.
    """
    msg_upper = message.upper()
    invalid = [c for c in msg_upper if c not in ALPHABET]
    if invalid:
        unique_invalid = sorted(set(invalid))
        raise ValueError(
            f"Message contient {len(invalid)} caractère(s) hors alphabet : "
            f"{unique_invalid!r}. Alphabet accepté : {ALPHABET!r}. "
            f"Conseil : translittérer les accents (É→E, À→A, etc.) "
            f"ou retirer la ponctuation non supportée avant l'envoi.")
    return msg_upper.encode('ascii')

def _encrypt(message: str, steg_key: bytes, L: int) -> bytes:
    """
    Chiffre avec une charge utile à LONGUEUR FIXE (tâche 2, format v3 —
    remplace le correctif N1 en entier, pas en complément).

    N1 rendait les 2 symboles de poids faible d'un en-tête de longueur
    SÉPARÉ exactement uniformes, mais cet en-tête restait un champ distinct,
    de taille variable selon la longueur du message et potentiellement
    corrélé entre deux grilles sous la même clé et la même grammaire — hors
    du cadre des preuves du papier (carter_v6_fixes.tex).

    Le clair est désormais [longueur(4B)][message][rembourrage zéro], de
    taille FIXE déterminée par L (nombre de positions message de la
    grammaire — connu du décodeur via la grammaire, jamais transmis),
    chiffré comme un seul bloc XChaCha20-Poly1305 + key commitment
    HMAC-SHA256. La longueur du message n'apparaît donc plus jamais en clair
    ni dans un champ à part : payload_to_symbols() produit exactement L
    symboles, tous porteurs de charge utile — aucune position n'est
    structurellement différente d'une autre (répond à N1).
    """
    msg_b = _validate_alphabet(message)
    payload_bytes, cleartext_len = _cleartext_capacity(L)
    if cleartext_len == 0:
        raise ValueError(
            f"Grammaire trop petite ({L} positions) pour porter un message, "
            f"même vide.")
    max_msg = cleartext_len - 4
    if len(msg_b) > max_msg:
        raise ValueError(
            f"Message trop long pour la grammaire dérivée : {len(msg_b)} "
            f"octets > {max_msg} disponibles ({L} positions). "
            f"Changer la clé ou réduire le message.")
    cleartext = (struct.pack('>I', len(msg_b)) + msg_b +
                 b'\x00' * (cleartext_len - 4 - len(msg_b)))
    inner   = _xchacha20_enc(steg_key, cleartext)
    ck      = _commit_key(steg_key)
    # Le HMAC porte sur `inner` seul : contrairement à LH-4 (v2), il n'existe
    # plus de longueur transmise séparément à authentifier — payload_bytes
    # se déduit de L, public et identique des deux côtés, jamais transporté.
    commit  = _hmac_mod.new(ck, inner, hashlib.sha256).digest()  # 32 bytes
    payload = commit + inner
    assert len(payload) == payload_bytes, "invariant PayloadToSymbols rompu"
    return payload

def _decrypt(vals: List[int], steg_key: bytes, L: int) -> str:
    """
    Vérifie le key commitment PUIS déchiffre.
    Charge utile à longueur fixe (tâche 2, format v3) : L détermine la
    taille exacte du payload — aucune longueur n'est lue depuis le flux de
    symboles lui-même. Double protection : HMAC invalide → rejet immédiat
    sans tentative de déchiffrement.
    """
    payload_bytes, cleartext_len = _cleartext_capacity(L)
    if cleartext_len == 0:
        raise ValueError(f"Grammaire trop petite ({L} positions) pour un message")
    m = _smallest_m(_capacity_k(L) + _LAMBDA_S)
    if len(vals) < m:
        raise ValueError(f"Positions insuffisantes : {len(vals)} < {m}")
    payload = _syms_to_bytes(vals[:m], payload_bytes)
    commit_recv, inner = payload[:32], payload[32:]
    ck          = _commit_key(steg_key)
    commit_calc = _hmac_mod.new(ck, inner, hashlib.sha256).digest()
    if not _hmac_mod.compare_digest(commit_recv, commit_calc):
        raise ValueError("Key commitment invalide — clé incorrecte ou données altérées")
    try:
        pt = _xchacha20_dec(steg_key, inner)
    except Exception:
        raise ValueError("Tag Poly1305 invalide — clé incorrecte ou données altérées")
    msg_len = struct.unpack('>I', pt[:4])[0]
    if msg_len > len(pt) - 4:
        raise ValueError("Longueur de message invalide — clé incorrecte ou données altérées")
    msg_b = pt[4:4+msg_len]
    try:
        return msg_b.decode('ascii', errors='strict')
    except UnicodeDecodeError:
        raise ValueError(
            "Texte déchiffré non-ASCII — données corrompues malgré une "
            "authentification AEAD valide")

# ── Flux de symboles — API pour carter.py, carter_random.py, grid_90.py ──────
# Ces modules construisent leur propre flux et appellent _decrypt() dessus.
# Ils doivent donc produire exactement le même flux que payload_to_symbols() :
# L symboles de charge utile, sans en-tête séparé (format v3, tâche 2). Sans
# cela, ils continueraient d'écrire des nibbles [0..15] repérables dans un
# bruit couvrant [0..43], ou une longueur en clair distinguable du bruit.

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

def payload_to_symbols(payload: bytes, L: int) -> List[int]:
    """
    Payload chiffré à longueur fixe → L symboles uniformes sur
    [0..ALPHA_LEN-1] (PayloadToSymbols, Définition 3.6, format v3).

    m = _smallest_m(...) symboles portent le payload lui-même. Comme
    L·log2(ALPHA_LEN) n'est en général pas un multiple exact de 8 bits (la
    granularité de _capacity_k), il reste au plus UNE position de marge
    entre m et L (jamais davantage — garanti par construction de
    _capacity_k) ; elle est comblée par un symbole CSPRNG supplémentaire, de
    la même loi uniforme que les symboles de charge utile — indiscernable,
    aucune perte d'entropie de position. Toutes les positions message
    portent désormais un symbole de charge utile : aucune n'est un en-tête
    (répond à N1).
    """
    k = _capacity_k(L)
    assert len(payload) * 8 == k, "L incohérent avec la taille du payload"
    m = _smallest_m(k + _LAMBDA_S)
    syms = _bytes_to_syms(payload, m)
    if m < L:
        syms += [secrets.randbelow(ALPHA_LEN) for _ in range(L - m)]
    return syms

# NOTE : le remplissage de bruit de grille (mesure arm64 gk2/MOCHAbin, audit
# G. Kerma, §4.8 — voir BENCHMARKS_ARM64.md) est traité par random_grid()
# ci-dessus, pas ici. Une implémentation équivalente (_random_symbols, flux
# plat + reshape manuel) a existé brièvement dans cette branche ; random_grid
# est la version retenue après fusion avec la branche perf indépendante
# (même idée, même mesure, implémentation légèrement différente).
