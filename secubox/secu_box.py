# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
SecuBox — Protocole de communication sécurisée
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

1. Échange de clés  : X25519 triple DH (éphémère×éphémère, éphémère×identité,
                      identité×éphémère) + HKDF-SHA256 sur le transcript
2. Authentification : l'identité long-terme entre dans la dérivation ; le
                      fingerprint vérifié hors bande écarte un relais actif
3. Forward secrecy  : clé éphémère détruite après derive()
4. Déni plausible   : 2 messages dans 2 zones non-chevauchantes d'une grille
5. Chiffrement      : ChaCha20-Poly1305 a nonce etendu par HKDF (LH-5, stegano_lib.py)
6. Dissimulation    : géométrie La Livrée d'Hermès

Zones déni plausible (grille 90×90 = 225 blocs 6×6) :
  Chaque clé dérive ses blocs depuis (son propre steg_key, un counter)
  (fix LH-2 v3, audit G. Kerma, rév. 3) — aucun secret partagé entre les
  deux côtés. Remplace la v2 (exclusion depuis une permutation
  canonique) : vérifié par exécution, la v2 laissait retrouver 48/50
  blocs réels depuis la seule clé de contrainte, sans aucun faux positif
  — voir _derive_block_sequence() pour le mécanisme de la fuite et sa
  correction.
  → aucune collision possible entre les deux messages
"""

import os, secrets, struct, hashlib
from typing import Dict, List, Tuple, Optional

from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey, X25519PublicKey)
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF2
from cryptography.hazmat.primitives import hashes as _hashes2
from argon2.low_level import hash_secret_raw as _argon2_raw, Type as _Argon2Type

def _argon2id_identity(passphrase: str, salt: bytes) -> bytes:
    """Argon2id pour chiffrement des identités (time=3, mem=64MB)."""
    return _argon2_raw(
        secret=passphrase.encode(),
        salt=salt[:16],
        time_cost=3, memory_cost=65536, parallelism=4,
        hash_len=32, type=_Argon2Type.ID)

# LH-5 (audit G. Kerma) : renommees depuis _xchacha_enc2/_xchacha_dec2.
# ChaCha20-Poly1305 a nonce etendu par HKDF (pas du XChaCha20 standard :
# la sous-cle vient de HKDF-SHA256, non de HChaCha20 — non interoperable
# avec libsodium/PyNaCl). Meme construction que crypto_core.py, dupliquee
# ici plutot qu'importee ; le HKDF info= reste 'XChaCha20-HChaCha20-subkey'
# tel quel, c'est un simple libelle de derivation, pas un nom d'API — le
# changer romprait le dechiffrement des identites deja exportees.
def _chacha20_hkdf_enc2(key, pt, aad=b''):
    n=os.urandom(24)
    sk=_HKDF2(_hashes2.SHA256(),32,salt=n[:16],info=b'XChaCha20-HChaCha20-subkey').derive(key)
    ct=ChaCha20Poly1305(sk).encrypt(b'\x00'*4+n[16:],pt,aad or None)
    return n+ct

def _chacha20_hkdf_dec2(key, data, aad=b''):
    n,ct=data[:24],data[24:]
    sk=_HKDF2(_hashes2.SHA256(),32,salt=n[:16],info=b'XChaCha20-HChaCha20-subkey').derive(key)
    return ChaCha20Poly1305(sk).decrypt(b'\x00'*4+n[16:],ct,aad or None)
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from stegano_lib import (
    load_referents, encode, decode,
    ALPHA_LEN, apply_orientation,
    _encrypt, _decrypt, payload_to_symbols,
)

# ── Identité long-terme ───────────────────────────────────────────────────────
class Identity:
    def __init__(self, private_bytes: Optional[bytes] = None):
        self._priv = (X25519PrivateKey.from_private_bytes(private_bytes)
                      if private_bytes else X25519PrivateKey.generate())

    @property
    def public_bytes(self) -> bytes:
        return self._priv.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    def fingerprint(self) -> str:
        return ':'.join(f'{b:02x}'
                        for b in hashlib.sha256(self.public_bytes).digest()[:6])

    def export_private(self, passphrase: str) -> bytes:
        raw   = self._priv.private_bytes(serialization.Encoding.Raw,
                  serialization.PrivateFormat.Raw, serialization.NoEncryption())
        salt  = os.urandom(16)
        key   = _argon2id_identity(passphrase, salt)
        return salt + _chacha20_hkdf_enc2(key, raw, b'SecuBox-Identity-v2')

    @classmethod
    def from_export(cls, data: bytes, passphrase: str) -> 'Identity':
        salt, enc = data[:16], data[16:]
        key = _argon2id_identity(passphrase, salt)
        raw = _chacha20_hkdf_dec2(key, enc, b'SecuBox-Identity-v2')
        return cls(raw)


# ── Session : échange authentifié X25519 (triple DH) ──────────────────────────
#
# CORRECTIF AUDIT 2026-09-10 : la version précédente était un ECDH
# éphémère-éphémère nu. La classe Identity existait, était protégée par
# passphrase, exposait un fingerprint que la CLI invitait à vérifier « par un
# canal sûr » — et n'entrait dans aucun calcul. N'importe quel relais pouvait
# substituer ses propres clés éphémères et partager une clé avec chacun des
# deux correspondants sans qu'ils s'en aperçoivent : le fingerprint vérifié
# ne protégeait rien.
#
# La session dérive désormais de trois Diffie-Hellman, à la manière de X3DH :
#
#   DH_ee = ECDH(éphémère_moi,  éphémère_pair)   → forward secrecy
#   DH_es = ECDH(éphémère_moi,  identité_pair)   → authentifie le pair
#   DH_se = ECDH(identité_moi,  éphémère_pair)   → m'authentifie auprès de lui
#
# Un attaquant qui substitue les clés éphémères ne possède aucune des deux
# clés d'identité privées : il ne peut calculer ni DH_es ni DH_se, donc pas
# la clé de session. L'authentification repose sur la vérification du
# fingerprint d'identité hors bande — laquelle a maintenant un effet réel.
#
# Aucune primitive nouvelle : X25519 seul, comme avant.

_SESSION_INFO = b'SecuBox-Session-v2-3dh'

def _dh(priv: X25519PrivateKey, peer_public: bytes) -> bytes:
    """ECDH X25519. La bibliothèque rejette déjà les points d'ordre faible."""
    return priv.exchange(X25519PublicKey.from_public_bytes(peer_public))

class Session:
    """
    Session X25519 authentifiée, à forward secrecy.

      alice = Identity(); bob = Identity()
      sa = Session(ref256, alice)
      sb = Session(ref256, bob)
      offer_a, offer_b = sa.offer(), sb.offer()     # échangés sur le réseau
      ka = sa.derive(offer_b)
      kb = sb.derive(offer_a)
      assert ka['steg_key'] == kb['steg_key']

    Une offer transporte (identité publique ‖ éphémère publique), soit 64
    octets. Elle n'est pas secrète, mais l'identité qu'elle annonce DOIT
    être vérifiée hors bande via son fingerprint : c'est elle qui distingue
    le correspondant d'un relais. peer_fingerprint() la donne sous la même
    forme que Identity.fingerprint().

    La clé éphémère privée est détruite après derive(), et une Session ne
    peut servir qu'une fois.
    """

    OFFER_SIZE = 64   # 32 octets d'identité publique + 32 d'éphémère publique

    def __init__(self, ref256: List[Dict], identity: 'Identity'):
        if not isinstance(identity, Identity):
            raise TypeError(
                "Session exige une Identity : c'est elle qui authentifie "
                "l'échange. Créer ou charger une identité au préalable.")
        self._identity = identity
        self._eph      = X25519PrivateKey.generate()
        self._eph_pub  = self._eph.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        self._ref256   = ref256
        self._done     = False

    @property
    def public_bytes(self) -> bytes:
        """Clé éphémère publique seule. Pour le réseau, préférer offer()."""
        return self._eph_pub

    def offer(self) -> bytes:
        """Ce qui est transmis au correspondant : identité ‖ éphémère."""
        return self._identity.public_bytes + self._eph_pub

    @staticmethod
    def split_offer(offer: bytes) -> Tuple[bytes, bytes]:
        """(identité publique, éphémère publique) — valide la taille."""
        if len(offer) != Session.OFFER_SIZE:
            raise ValueError(
                f"Offer invalide : {len(offer)} octets, "
                f"{Session.OFFER_SIZE} attendus (identité ‖ éphémère).")
        return offer[:32], offer[32:]

    @staticmethod
    def peer_fingerprint(offer: bytes) -> str:
        """Fingerprint de l'identité annoncée — à confronter hors bande."""
        peer_id, _ = Session.split_offer(offer)
        return ':'.join(f'{b:02x}'
                        for b in hashlib.sha256(peer_id).digest()[:6])

    # ── Reprise entre deux invocations ────────────────────────────────────
    # Une CLI ne peut pas garder la Session en mémoire entre le moment où
    # elle publie son offer et celui où elle reçoit celle du correspondant.
    # La clé éphémère privée doit donc survivre sur disque dans l'intervalle,
    # ce qui ouvre une fenêtre pendant laquelle la forward secrecy dépend de
    # ce fichier. Elle est chiffrée sous une clé dérivée de l'identité — un
    # vol du seul fichier d'attente ne donne rien — et doit être détruite dès
    # la session dérivée.

    def _pending_key(self) -> bytes:
        return _HKDF2(_hashes2.SHA256(), 32, salt=b'SecuBox-Pending-v1',
                      info=b'ephemeral-at-rest').derive(
            self._identity._priv.private_bytes(
                serialization.Encoding.Raw,
                serialization.PrivateFormat.Raw,
                serialization.NoEncryption()))

    def export_pending(self) -> bytes:
        """Éphémère privée chiffrée sous l'identité, pour reprise ultérieure."""
        raw = self._eph.private_bytes(
            serialization.Encoding.Raw, serialization.PrivateFormat.Raw,
            serialization.NoEncryption())
        return _chacha20_hkdf_enc2(self._pending_key(), raw, b'SecuBox-Pending-v1')

    @classmethod
    def resume(cls, ref256: List[Dict], identity: 'Identity',
               pending: bytes) -> 'Session':
        """Reconstruit la Session qui a produit ce pending, même éphémère."""
        self = cls(ref256, identity)
        raw  = _chacha20_hkdf_dec2(self._pending_key(), pending, b'SecuBox-Pending-v1')
        self._eph     = X25519PrivateKey.from_private_bytes(raw)
        self._eph_pub = self._eph.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        return self

    def derive(self, their_offer: bytes,
               grid_size: int = 60, block_size: int = 1) -> Dict:
        if self._done:
            raise ValueError("Session consommée. Créer une nouvelle Session().")
        their_id, their_eph = Session.split_offer(their_offer)
        my_id = self._identity.public_bytes

        if their_id == my_id:
            raise ValueError(
                "L'offer annonce notre propre identité : réflexion du message "
                "ou correspondant mal choisi.")

        dh_ee = _dh(self._eph, their_eph)
        dh_es = _dh(self._eph, their_id)              # éphémère moi × identité pair
        dh_se = _dh(self._identity._priv, their_eph)  # identité moi × éphémère pair

        # Les deux DH croisés se correspondent en miroir : chez le pair,
        # notre dh_es est son dh_se. Un ordre canonique, dérivé des deux
        # identités publiques, les range identiquement des deux côtés.
        if my_id < their_id:
            cross = dh_es + dh_se
            ids   = my_id + their_id
            ephs  = self._eph_pub + their_eph
        else:
            cross = dh_se + dh_es
            ids   = their_id + my_id
            ephs  = their_eph + self._eph_pub

        # Le transcript complet entre dans info : les quatre clés publiques
        # sont ainsi authentifiées par la clé dérivée.
        km = HKDF(hashes.SHA256(), 64, _SESSION_INFO,
                  ids + ephs).derive(dh_ee + cross)

        # session_id dérivé du matériel HKDF et non du secret ECDH brut,
        # pour ne pas publier d'engagement vérifiable sur ce dernier.
        session_id = HKDF(hashes.SHA256(), 8, _SESSION_INFO,
                          b'session-id').derive(km).hex()

        del self._eph, dh_ee, dh_es, dh_se, cross
        self._done = True
        return _km_to_keys(km, self._ref256, session_id, grid_size, block_size)


def _km_to_keys(km: bytes, ref256: List[Dict], session_id: str,
                grid_size: int = 60, block_size: int = 1) -> Dict:
    B        = grid_size // 6
    n_blocks = B * B
    seed     = km[32:64]
    counter  = [0]

    def prng(n: int) -> int:
        h = hashlib.sha256(seed + struct.pack('>Q', counter[0])).digest()
        counter[0] += 1
        return struct.unpack('>Q', h[:8])[0] % n

    key_b = [block_size] * n_blocks
    key_c = [[prng(8) for _ in range(block_size**2)] for _ in range(n_blocks)]
    key_2 = [{'form_id': prng(len(ref256)),
               'color':   'blue' if prng(2) == 0 else 'orange'}
              for _ in range(n_blocks)]

    return {'steg_key': km[:32], 'key_b': key_b, 'key_c': key_c,
            'key_2': key_2, 'session_id': session_id, 'grid_size': grid_size}


# ── Déni plausible ────────────────────────────────────────────────────────────
def _derive_block_sequence(steg_key: bytes, counter: int, n_blocks: int) -> List[int]:
    """
    LH-2 v3 (audit G. Kerma, rév. 3) : dérive une suite ordonnée de blocs
    depuis (steg_key, counter) via HKDF + Fisher-Yates.

    Remplace _derive_block_order (v2), qui filtrait par exclusion
    (exclude=real_set) une permutation CANONIQUE dérivée de dsk seul. La
    faille : un porteur de la seule clé de contrainte peut recalculer
    cette même permutation canonique (dsk, sans exclusion) et la comparer
    à la duress_order réellement stockée dans sa clé — tout écart entre
    les deux (un bloc présent dans la permutation canonique mais absent
    de duress_order) a nécessairement été retiré par exclusion, donc
    appartient à real_set. Vérifié PAR EXÉCUTION (audit G. Kerma, pas une
    analyse théorique) : cette comparaison retrouve 48/50 blocs réels
    sans aucun faux positif sur la v2, depuis la seule clé de contrainte.

    Ici, chaque candidat (steg_key, counter) produit une permutation
    COMPLÈTE et INDÉPENDANTE (nouvel info HKDF par valeur de counter) —
    rien n'est jamais filtré depuis un ordre canonique commun. Il n'existe
    donc aucune version « non filtrée » à comparer à la séquence stockée
    pour en déduire quels blocs auraient été exclus.

    La suite est entièrement re-dérivable depuis (steg_key, counter) —
    rien d'autre n'est stocké dans la clé. Un porteur avec ces deux
    valeurs recalcule exactement la même suite que l'encodeur.
    """
    km = HKDF(hashes.SHA256(), n_blocks * 4,
              salt=b'deniable-v3',
              info=b'deniable-blocks-v3-' + counter.to_bytes(4, 'big')
              ).derive(steg_key)
    order = list(range(n_blocks))
    for i in range(n_blocks - 1, 0, -1):
        j = int.from_bytes(km[i*4:i*4+4], 'big') % (i + 1)
        order[i], order[j] = order[j], order[i]
    return order

def encode_deniable(
    real_message:   str,
    duress_message: str,
    ref256:         Optional[List[Dict]] = None,
    grid_size:      int = 90,
) -> Tuple[List[List[int]], Dict, Dict]:
    """
    Encode deux messages dans une grille unique.

    LH-2 v3 (audit G. Kerma, rév. 3) — remplace v2 (fixe une fuite
    vérifiée par exécution, pas seulement théorique : 48/50 blocs réels
    retrouvés depuis la seule clé de contrainte, voir
    _derive_block_sequence()). Propriétés :
    • Chaque clé stocke uniquement (steg_key, counter, n_blocks, key_2) —
      la suite de blocs se re-dérive à l'identique depuis (steg_key,
      counter), rien n'est stocké en plus.
    • L'encodeur incrémente le counter de la clé de contrainte (0..65535)
      jusqu'à disjonction avec les blocs réels.
    • Allocation exacte à la taille du message (blocks_needed), pas une
      répartition fixe 50/50 comme en v2.

    Tradeoff assumé, à documenter plutôt qu'à cacher : contrairement au
    50/50 fixe de la v2, le nombre de blocs alloués ici est proportionnel
    à la longueur du message. Si les deux messages ont une longueur
    proche, n_blocks_real ≈ n_blocks_duress devient observable par qui
    détient LES DEUX clés — ce que le 50/50 fixe de la v2 évitait par
    construction. Mais un porteur de la SEULE clé de contrainte reste
    dans l'incapacité totale de localiser les blocs réels sans rsk : par
    construction (voir _derive_block_sequence), il n'existe aucune
    permutation « non filtrée » à comparer pour en déduire les blocs
    exclus. C'est un tradeoff acceptable face à la fuite concrète —
    démontrée par exécution, pas seulement redoutée en théorie — de la v2.

    Retourne (grid, real_keys, duress_keys).
    ref256 : ignoré (conservé pour compatibilité d'API avec la v2).
    """
    from carter_random import get_referent, _derive_params, _derive_masks, CELL_SIZE, N_FORMS, N_DIR
    from stegano_lib import _carter_split

    N = grid_size; B = N // 6
    n_blocks = B * B

    grid = [[secrets.randbelow(ALPHA_LEN) for _ in range(N)]
             for _ in range(N)]

    rsk = secrets.token_bytes(32)
    dsk = secrets.token_bytes(32)

    def payload_and_nibbles(msg: str, sk: bytes):
        payload = _encrypt(msg, sk)
        # Même flux de symboles base-44 que stegano_lib.encode() : les
        # nibbles [0..15] trahissaient les cellules message dans un bruit
        # couvrant [0..43].
        return payload_to_symbols(payload)

    def blocks_needed(nibbles, cell_size=CELL_SIZE) -> int:
        """Nombre de blocs 6×6 nécessaires pour écrire len(nibbles) symboles."""
        return max(1, -(-len(nibbles) // cell_size))  # ceil

    def place(nibbles, sk, k2, block_indices):
        _, gk_local   = _carter_split(sk)
        seed_local, _ = _derive_params(gk_local)
        ref_local     = get_referent(seed_local)
        masks_local   = _derive_masks(gk_local, len(nibbles) + 64)
        ni = 0; blk = 0
        while blk < len(k2) and ni < len(nibbles):
            idx    = block_indices[blk]
            br, bc = idx // B, idx % B
            fk     = k2[blk]
            form   = ref_local[fk['form_id'] % len(ref_local)]
            for r, c in form[fk['dir']]:
                if ni >= len(nibbles): break
                gr, gc = br*6+r, bc*6+c
                if 0 <= gr < N and 0 <= gc < N:
                    grid[gr][gc] = (nibbles[ni]+masks_local[ni]) % ALPHA_LEN
                ni += 1
            blk += 1

    real_nibs   = payload_and_nibbles(real_message,   rsk)
    duress_nibs = payload_and_nibbles(duress_message, dsk)

    n_real   = blocks_needed(real_nibs)
    n_duress = blocks_needed(duress_nibs)
    if n_real > n_blocks or n_duress > n_blocks:
        raise ValueError(
            f"Message trop long pour la grille déniable {N}×{N} "
            f"({n_blocks} blocs disponibles)")

    r_counter = 0
    real_seq  = _derive_block_sequence(rsk, r_counter, n_blocks)
    real_set  = set(real_seq[:n_real])

    # Chercher un counter pour la clé de contrainte tel que les deux
    # suites soient disjointes — chaque counter produit une permutation
    # complète indépendante (voir _derive_block_sequence).
    for d_counter in range(65536):
        duress_seq = _derive_block_sequence(dsk, d_counter, n_blocks)
        if not real_set & set(duress_seq[:n_duress]):
            break
    else:
        raise ValueError(
            "Aucune séquence de contrainte disjointe trouvée en 65536 essais")

    rk2 = [{'form_id': secrets.randbelow(N_FORMS),
             'dir':     secrets.randbelow(N_DIR)} for _ in range(n_real)]
    dk2 = [{'form_id': secrets.randbelow(N_FORMS),
             'dir':     secrets.randbelow(N_DIR)} for _ in range(n_duress)]

    # Contrainte d'abord, réel en dernier : le message réel n'est jamais
    # écrasé (les deux suites sont déjà disjointes par construction, donc
    # purement défensif).
    place(duress_nibs, dsk, dk2, duress_seq[:n_duress])
    place(real_nibs,   rsk, rk2, real_seq[:n_real])

    # Les clés ne stockent que (steg_key, counter, n_blocks, key_2) — la
    # suite se re-dérive, aucun block_sequence stocké.
    real_keys   = {'steg_key': rsk, 'counter': r_counter,
                   'n_blocks': n_real,   'key_2': rk2}
    duress_keys = {'steg_key': dsk, 'counter': d_counter,
                   'n_blocks': n_duress, 'key_2': dk2}
    return grid, real_keys, duress_keys


def decode_deniable(grid: List[List[int]], keys: Dict,
                    ref256: Optional[List[Dict]] = None, grid_size: int = 90) -> str:
    """
    Décode un message depuis la grille.

    LH-2 v3 : le décodeur re-dérive la suite de blocs depuis
    (steg_key, counter) — identique à ce que l'encodeur a calculé. Aucune
    information sur l'autre message n'est nécessaire ni accessible.
    ref256 : ignoré (conservé pour compatibilité d'API avec la v2).
    """
    from carter_random import get_referent, _derive_params, _derive_masks, CELL_SIZE
    from stegano_lib import _carter_split

    N = grid_size; B = N // 6
    n_blocks = B * B
    sk      = keys['steg_key']
    counter = keys['counter']
    n_blk   = keys['n_blocks']
    k2      = keys['key_2']

    # Re-dériver la suite depuis (steg_key, counter) — reproductible à
    # l'identique, rien d'autre n'est nécessaire.
    block_seq = _derive_block_sequence(sk, counter, n_blocks)[:n_blk]

    _, gk_local   = _carter_split(sk)
    seed_local, _ = _derive_params(gk_local)
    ref_local     = get_referent(seed_local)
    masks_local   = _derive_masks(gk_local, len(k2) * CELL_SIZE + 64)

    vals = []; ni = 0; blk = 0
    while blk < len(k2):
        idx    = block_seq[blk]
        br, bc = idx // B, idx % B
        fk     = k2[blk]
        form   = ref_local[fk['form_id'] % len(ref_local)]
        for r, c in form[fk['dir']]:
            gr, gc = br*6+r, bc*6+c
            if 0 <= gr < N and 0 <= gc < N:
                vals.append((grid[gr][gc]-masks_local[ni]) % ALPHA_LEN)
            ni += 1
        blk += 1
    return _decrypt(vals, sk)


# ── Démo ──────────────────────────────────────────────────────────────────────
def demo():
    print("=== SECUBOX — X25519 + Forward Secrecy + Déni Plausible ===\n")
    ref256, _ = load_referents()

    print("1. IDENTITÉS LONG-TERME\n")
    alice = Identity()
    bob   = Identity()
    print(f"   Alice : {alice.fingerprint()}")
    print(f"   Bob   : {bob.fingerprint()}")

    print("\n2. ÉCHANGE DE CLÉS X25519 AUTHENTIFIÉ (triple DH)\n")
    sa = Session(ref256, alice); sb = Session(ref256, bob)
    offer_a, offer_b = sa.offer(), sb.offer()
    print(f"   Offer d'Alice : {len(offer_a)} octets "
          f"(identité ‖ éphémère), fingerprint annoncé "
          f"{Session.peer_fingerprint(offer_a)}")
    print(f"   Bob confronte ce fingerprint hors bande à {alice.fingerprint()} "
          f": {Session.peer_fingerprint(offer_a) == alice.fingerprint()} ✓")
    ka = sa.derive(offer_b)
    kb = sb.derive(offer_a)
    print(f"   steg_key identique  : {ka['steg_key'] == kb['steg_key']} ✓")
    print(f"   key_2 identique     : {ka['key_2'] == kb['key_2']} ✓")
    print(f"   session_id          : {ka['session_id']}")

    print("\n3. RÉSISTANCE À L'HOMME DU MILIEU\n")
    mallory = Identity()
    sm_a = Session(ref256, mallory); sm_b = Session(ref256, mallory)
    sa2 = Session(ref256, alice);    sb2 = Session(ref256, bob)
    offer_a2 = sa2.offer()
    # Mallory relaie en substituant ses propres offers
    k_alice   = sa2.derive(sm_a.offer())
    k_mallory = sm_a.derive(offer_a2)
    print(f"   Mallory partage-t-elle la clé d'Alice : "
          f"{k_alice['steg_key'] == k_mallory['steg_key']} "
          f"(mais l'offer annonce {Session.peer_fingerprint(sm_a.offer())}")
    print(f"    au lieu de {bob.fingerprint()} — le fingerprint hors bande "
          f"la démasque)")
    k_bob = sb2.derive(sm_b.offer())
    print(f"   Alice et Bob obtiennent-ils la même clé : "
          f"{k_alice['steg_key'] == k_bob['steg_key']} ✓ "
          f"(le relais ne peut pas les réconcilier)")

    print("\n4. FORWARD SECRECY\n")
    try:
        sa.derive(offer_b)
    except ValueError:
        print("   Réutilisation bloquée ✓")

    print("\n5. MESSAGE STÉGANO\n")
    msg = "ANIBALAMIOTX"
    grid = encode(msg, ka['steg_key'], ka['key_b'],
                  ka['key_c'], ka['key_2'], ref256)
    decoded = decode(grid, kb['steg_key'], kb['key_b'],
                     kb['key_c'], kb['key_2'], ref256)
    print(f"   Alice → Bob : '{msg}' → '{decoded}' ✓")

    print("\n6. DÉNI PLAUSIBLE (2 messages, 1 grille 90×90, LH-2 v3)\n")
    grid_d, rk, dk = encode_deniable(
        "MESSAGE SECRET ANIBAL", "NOTES PERSO TEXTILE")
    real_out   = decode_deniable(grid_d, rk)
    duress_out = decode_deniable(grid_d, dk)
    print(f"   Clé réelle     → '{real_out}' ✓")
    print(f"   Clé contrainte → '{duress_out}' ✓")
    print(f"   Chaque clé dérive ses blocs depuis (son propre steg_key, un counter) (fix LH-2 v3)")
    print(f"   Propriété : aucun secret partagé, blocs réels non calculables sans la clé réelle")
    print(f"   (v2 le laissait faire : 48/50 blocs réels retrouvés par exécution, voir _derive_block_sequence)")

    print("\n7. IDENTITÉ EXPORTÉE\n")
    exported  = alice.export_private("passphrase_test")
    alice2    = Identity.from_export(exported, "passphrase_test")
    print(f"   {len(exported)} bytes chiffrés (Argon2id+ChaCha20-HKDF) ✓")
    print(f"   Restaurée identique : {alice.public_bytes == alice2.public_bytes} ✓")

    print("\n=== ARCHITECTURE SECUBOX ===\n")
    print("  Clés long-terme : X25519 exportées chiffrées")
    print("  Échange         : triple DH X25519 (ee + es + se), HKDF")
    print("  Authentification: identité liée à la session — fingerprint")
    print("                    à vérifier hors bande")
    print("  Forward secrecy : clé éphémère détruite après derive()")
    print("  Chiffrement     : ChaCha20-Poly1305 à nonce étendu par HKDF (nonce 24 bytes, LH-5)")
    print("  Dissimulation   : La Livrée d'Hermès (Ref256+Ref360)")
    print("  Déni plausible  : 2 zones, 0 collision, 1 grille")

if __name__ == '__main__':
    demo()

# ── Mode Carter dans SecuBox ───────────────────────────────────────────────────
# Intégration de la grille Carter dans le protocole SecuBox.
# La steg_key de session devient le master_key de la grammaire Carter.
# Avantage : key_b, key_c, key_2 ne sont plus nécessaires en mode Carter.
# La grammaire est entièrement dérivée de steg_key → moins de surface d'attaque.

def encode_carter_session(message: str, session_keys: Dict,
                           ref256: List[Dict]) -> List[List[int]]:
    """
    Encode un message en mode Carter depuis une session X25519.
    Utilise steg_key comme master_key de la grammaire Carter.

    session_keys : résultat de Session.derive()
    Retourne     : grille 90×90 (liste de listes)
    """
    from stegano_lib import encode_carter
    return encode_carter(message, session_keys['steg_key'], ref256)

def decode_carter_session(grid: List[List[int]], session_keys: Dict,
                           ref256: List[Dict]) -> str:
    """
    Décode une grille Carter depuis les clés de session.
    """
    from stegano_lib import decode_carter
    return decode_carter(grid, session_keys['steg_key'], ref256)

def carter_deniable(
    real_message:   str,
    real_key:       bytes,
    duress_message: str,
    duress_key:     bytes,
    ref256:         List[Dict],
) -> tuple:
    """
    Déni plausible Carter : deux grilles indépendantes avec deux clés.
    Chaque grille est une grille Carter 90×90 autonome.
    Aucun observateur ne peut prouver laquelle est réelle.

    Retourne (grid_real, grid_duress).
    Les deux grilles sont transmises ensemble ou séparément selon le contexte.
    """
    from stegano_lib import encode_carter
    grid_real   = encode_carter(real_message,   real_key,   ref256)
    grid_duress = encode_carter(duress_message, duress_key, ref256)
    return grid_real, grid_duress

def encode_carter_mix_session(message: str, session_keys: Dict,
                                ref256: List[Dict],
                                ref360: Optional[List[Dict]] = None) -> List[List[int]]:
    """
    Encode en mode Carter mixte (Ref256 + Ref360) depuis une session X25519.
    steg_key de session → master_key de la grammaire mixte 180×180.
    """
    from stegano_lib import encode_carter_mix
    return encode_carter_mix(message, session_keys['steg_key'], ref256, ref360)

def decode_carter_mix_session(grid: List[List[int]], session_keys: Dict,
                                ref256: List[Dict],
                                ref360: Optional[List[Dict]] = None) -> str:
    from stegano_lib import decode_carter_mix
    return decode_carter_mix(grid, session_keys['steg_key'], ref256, ref360)


# ── Mode Carter Random v3 dans SecuBox ──────────────────────────────────────────
# Variante de la section « Mode Carter » ci-dessus : au lieu de la grille
# Carter à Référent 256/360 fixe, la grammaire dérive ses PROPRES référents
# (10 seeds, 256 formes générées dynamiquement chacun). Aucun fichier JSON de
# référent n'est nécessaire. Fonctions additives — n'affectent pas
# encode_carter_session/decode_carter_session/carter_deniable ci-dessus, qui
# restent la voie Carter à référent fixe.

def encode_carter_random_session(message: str, session_keys: Dict) -> Tuple:
    """
    Encode un message en mode Carter Random v3 depuis une session X25519.
    Utilise steg_key comme master_key de la grammaire (référents dérivés,
    pas de referent_256.json requis).

    session_keys : résultat de Session.derive()
    Retourne     : (grille 90×90, métadonnées de capacité)
    """
    from carter_random import encode_carter_random
    return encode_carter_random(message, session_keys['steg_key'])

def decode_carter_random_session(grid: List[List[int]], session_keys: Dict) -> str:
    """Décode une grille Carter Random v3 depuis les clés de session."""
    from carter_random import decode_carter_random
    return decode_carter_random(grid, session_keys['steg_key'])

def encode_carter_random_session_360(message: str, session_keys: Dict) -> Tuple:
    """Carter Random v3 sur grille 180×180 depuis une session X25519."""
    from carter_random import encode_carter_random_360
    return encode_carter_random_360(message, session_keys['steg_key'])

def decode_carter_random_session_360(grid: List[List[int]], session_keys: Dict) -> str:
    """Décode une grille Carter Random v3 180×180 depuis les clés de session."""
    from carter_random import decode_carter_random_360
    return decode_carter_random_360(grid, session_keys['steg_key'])

def encode_carter_session_18(message: str, session_keys: Dict) -> Tuple:
    """
    Carter-18 (méta-blocs concentriques 18×18) depuis une session X25519.
    Utilise steg_key comme master_key de la grammaire.

    session_keys : résultat de Session.derive()
    Retourne     : (grille 90×90, métadonnées de capacité)
    """
    from carter_random import encode_carter_18
    return encode_carter_18(message, session_keys['steg_key'])

def decode_carter_session_18(grid: List[List[int]], session_keys: Dict) -> str:
    """Décode une grille Carter-18 depuis les clés de session."""
    from carter_random import decode_carter_18
    return decode_carter_18(grid, session_keys['steg_key'])

def encode_carter_session_hybrid(message: str, session_keys: Dict) -> Tuple:
    """
    Carter-Hybrid (mélange 18×18 concentrique + 6×6) depuis une session X25519.
    Le mode par méta-bloc (18×18 ou 6×6) est dérivé de steg_key, pas de la
    longueur du message.

    session_keys : résultat de Session.derive()
    Retourne     : (grille 90×90, métadonnées de capacité)
    """
    from carter_random import encode_carter_hybrid
    return encode_carter_hybrid(message, session_keys['steg_key'])

def decode_carter_session_hybrid(grid: List[List[int]], session_keys: Dict) -> str:
    """Décode une grille Carter-Hybrid depuis les clés de session."""
    from carter_random import decode_carter_hybrid
    return decode_carter_hybrid(grid, session_keys['steg_key'])

def carter_hybrid_fits_session(message: str, session_keys: Dict) -> bool:
    """Vérifie si le message tient dans la grille Carter-Hybrid pour cette session."""
    from carter_random import carter_hybrid_fits
    return carter_hybrid_fits(message, session_keys['steg_key'])

def carter_random_deniable(
    real_message:   str,
    real_key:       bytes,
    duress_message: str,
    duress_key:     bytes,
) -> tuple:
    """
    Déni plausible Carter Random v3 : deux grilles 90×90 indépendantes, une
    par clé, chacune avec sa propre grammaire et ses propres référents
    dérivés. Aucun observateur ne peut prouver laquelle est réelle.

    Retourne (grid_real, grid_duress) — chaque élément est le couple
    (grille, métadonnées) renvoyé par encode_carter_random().
    """
    from carter_random import encode_carter_random
    grid_real   = encode_carter_random(real_message,   real_key)
    grid_duress = encode_carter_random(duress_message, duress_key)
    return grid_real, grid_duress

def carter_random_deniable_360(
    real_message:   str,
    real_key:       bytes,
    duress_message: str,
    duress_key:     bytes,
) -> tuple:
    """Variante 180×180 de carter_random_deniable()."""
    from carter_random import encode_carter_random_360
    grid_real   = encode_carter_random_360(real_message,   real_key)
    grid_duress = encode_carter_random_360(duress_message, duress_key)
    return grid_real, grid_duress
