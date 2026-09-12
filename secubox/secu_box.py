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
  Den.Encode/Encode0/Decode — Définition 1 révisée (bloc C, tâche 5,
  format v3). Br/Bd viennent d'une permutation π de TOUS les blocs, tirée
  une fois par secrets (Fisher-Yates), INDÉPENDAMMENT de rsk et dsk — ni
  l'une ni l'autre clé ne permet de la recalculer. Partition FIXE
  (Br=π[:B/2], Bd=π[B/2:]), stockée directement dans les clés retournées
  (π n'est dérivable d'aucune clé, contrairement à LH-2 v3 qui ne stockait
  qu'un compteur). Remplace ENTIÈREMENT _derive_block_sequence (LH-2 v3) —
  voir le commentaire de section au-dessus d'encode_deniable() pour le
  détail, notamment pourquoi Bd révélant Br structurellement n'est pas une
  fuite (Encode0 est un mode normal, pas un mode de test).
  → aucune collision possible entre les deux messages (partition stricte)
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
    load_referent_256_v3, encode, decode,
    ALPHA_LEN, LABELS, apply_orientation,
    _encrypt, _decrypt, payload_to_symbols, random_grid,
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

    def __init__(self, ref256: Dict, identity: 'Identity'):
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
    def resume(cls, ref256: Dict, identity: 'Identity',
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


def _km_to_keys(km: bytes, ref256: Dict, session_id: str,
                grid_size: int = 60, block_size: int = 1) -> Dict:
    """Câblage production étape 6 (2026-09-12) : plus de Clé C
    (orientations D4, sans rôle sur les positions absolues du référent
    v3) ni de tirage de couleur dans Clé 2 (rouge+bleu ensemble, un seul
    form_id par bloc) -- voir stegano_classic.encode()."""
    B        = grid_size // 6
    n_blocks = B * B
    seed     = km[32:64]
    counter  = [0]

    def prng(n: int) -> int:
        h = hashlib.sha256(seed + struct.pack('>Q', counter[0])).digest()
        counter[0] += 1
        return struct.unpack('>Q', h[:8])[0] % n

    key_b = [block_size] * n_blocks
    key_2 = [{'form_id': prng(len(ref256['forms']))} for _ in range(n_blocks)]

    return {'steg_key': km[:32], 'key_b': key_b,
            'key_2': key_2, 'session_id': session_id, 'grid_size': grid_size}


# ── Déni plausible (bloc C, Définition 1 révisée — tâche 5, format v3) ────────
# Remplace ENTIÈREMENT _derive_block_sequence (LH-2 v3) : plus de dérivation
# de blocs depuis (steg_key, counter). Br et Bd viennent d'une permutation π
# de TOUS les blocs de la grille, tirée UNE FOIS par secrets (Fisher-Yates),
# INDÉPENDAMMENT de rsk et dsk — ni l'une ni l'autre clé ne permet de la
# recalculer. Br et Bd ont TOUJOURS la même taille ⌊B/2⌋ (voir
# _split_br_bd) : jamais proportionnelle à la longueur des messages —
# contrairement à LH-2 v3, dont le tradeoff assumé (n_blocks_real ≈
# n_blocks_duress observable par qui détient les deux clés) disparaît avec
# une taille fixe indépendante du contenu.
#
# π n'étant dérivable d'AUCUNE clé, elle doit être stockée directement dans
# les deux clés retournées (dk_r, dk_d) — LH-2 v3 ne stockait qu'un
# compteur, réutilisable pour re-dériver. C'est le changement de fond : il
# n'existe plus de « permutation canonique » que quiconque pourrait
# recalculer depuis une clé seule pour en déduire l'autre moitié PAR LE
# CONTENU (c'était la fuite exploitée en v2, voir l'historique de
# _derive_block_sequence dans les révisions précédentes de ce fichier).
#
# B = 225 (grille 90×90 par défaut) est IMPAIR : ⌊B/2⌋ = 112, donc
# |Br| = |Bd| = 112 et il reste EXACTEMENT un bloc (π[112]) hors des deux
# ensembles — jamais écrit, laissé au bruit CSPRNG du remplissage initial,
# exactement comme le reste de Br sous Encode0. Ce choix (plutôt que
# Bd = complément(Br), qui donnerait à Bd un bloc de plus que Br) garde les
# deux clés de même taille.
#
# Point à ne pas manquer en révision : Bd N'EST DONC PAS le complément
# exact de Br — complément(Br) = Bd ∪ {bloc restant}, un ensemble à 113
# éléments qui CONTIENT Bd sans l'identifier exactement (113 candidats pour
# 112 places). Mais même en ignorant cette nuance d'un bloc : connaître Bd
# révèle de toute façon Br (ou son sur-ensemble à un bloc près) en tant
# qu'ENSEMBLE de positions — c'est de l'arithmétique, pas un secret qui
# aurait pu fuiter. Ce n'est PAS une régression : Encode0() (mode normal de
# l'API publique, pas un mode de test) remplit Br ET le bloc restant de
# bruit CSPRNG UNIFORME sur CHAQUE appel, qu'il y ait un message réel ou
# non — un adversaire qui isole ces blocs ne peut jamais distinguer
# « message réel chiffré » de « bruit pur », exactement la même propriété
# d'indiscernabilité statistique que les cellules structurées de Carter.
# Savoir OÙ se trouve Br ne prouve donc rien sur CE QU'il contient.

def _fisher_yates(n: int) -> List[int]:
    """Permutation aléatoire de [0..n-1] via secrets — indépendante de toute clé."""
    order = list(range(n))
    for i in range(n - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        order[i], order[j] = order[j], order[i]
    return order

def _split_br_bd(pi: List[int]) -> Tuple[List[int], List[int]]:
    """
    Br = π[:⌊B/2⌋], Bd = les ⌊B/2⌋ suivants — TAILLES ÉGALES. Si B est
    impair (225 par défaut), π[⌊B/2⌋] (1 bloc) reste hors des deux
    ensembles : ni Br ni Bd, jamais écrit par _place_deniable, laissé au
    bruit CSPRNG du remplissage initial de la grille (voir encode_deniable/
    encode_deniable0 — le bloc restant y est traité EXACTEMENT comme le
    reste de Br : jamais touché, dans les deux fonctions).
    """
    n = len(pi)
    half = n // 2
    Br = pi[:half]
    Bd = pi[half + 1:] if n % 2 else pi[half:]
    return Br, Bd

def _deniable_positions(N: int, B: int, block_indices: List[int],
                         sk: bytes, k2: List[Dict]) -> List[Tuple[int, int]]:
    """
    Positions de lecture/écriture (row, col), dans l'ordre, pour ces blocs
    sous la clé `sk` et les formes `k2`. Marche géométrique UNIQUE partagée
    par _place_deniable, _read_deniable et les tests (même motivation que
    grid_90._stream_positions : la vérité de ce qui est écrit ne doit
    exister qu'à un seul endroit).

    RÈGLE DE LECTURE v3, mode CRYPTO (câblage production, étape 5,
    2026-09-12) : contrairement aux positions stégano de Carter (12 sur
    36), ici TOUTES LES CASES d'un bloc portent de l'information -- 36 en
    6×6. Un seul tirage de forme par bloc (1 octet, k2[i]['form_id'],
    0..255) dans le référent choisi pour ce message par
    select_referent_index(gk_local) (referent6x6_gen.py, 256 référents
    ChaCha20) -- PLUS de "direction" (l'ancien référent bariolé à 4
    directions n'a pas de notion de couleur ; le référent v3 encode déjà
    des positions absolues par couleur). Lues dans l'ordre crypto :
    couleurs dans l'ordre déclaré (blue/orange/green/yellow), chacune
    triée par son propre balayage (stegano/sweep.py).

    Référent choisi UNE FOIS pour tout `sk` (gk_local dérivé de sk) : voir
    l'invariant documenté dans encode_deniable — les POSITIONS intra-bloc
    dépendent de la clé du message concerné (voulu), les ENSEMBLES de
    blocs n'en dépendent jamais (_fisher_yates/_split_br_bd).
    """
    import referent6x6_gen as R6
    from sweep import derive_sweep_index, crypto_reading_order
    from stegano_lib import _carter_split
    _, gk_local = _carter_split(sk)
    ref_idx   = R6.select_referent_index(gk_local)
    ref_local = R6.get_referent_cached(ref_idx)
    color_order = list(R6.SMALL_COLORS) + list(R6.LARGE_COLORS)
    sweep_of_color = {c: derive_sweep_index(gk_local, c) for c in color_order}
    positions = []
    for blk, idx in enumerate(block_indices):
        br, bc = idx // B, idx % B
        fk   = k2[blk]
        form = ref_local[fk['form_id']]
        cells_by_niveau = {0: {c: form[c] for c in color_order}}
        local_order = crypto_reading_order(cells_by_niveau, color_order,
                                            R6.GRID_SIZE, sweep_of_color)
        for r, c in local_order:
            gr, gc = br*R6.GRID_SIZE+r, bc*R6.GRID_SIZE+c
            if 0 <= gr < N and 0 <= gc < N:
                positions.append((gr, gc))
    return positions

def _place_deniable(grid: List[List[int]], N: int, B: int,
                     block_indices: List[int], message: str, sk: bytes,
                     _nonce: bytes = None, _y: int = None,
                     _leftover: List[int] = None, _k2: List[Dict] = None) -> List[Dict]:
    """
    Écrit `message` (chiffré, charge utile à longueur fixe — format v3,
    tâche 2) dans les blocs `block_indices` (36 positions chacun, mode
    crypto -- voir _deniable_positions). Retourne key_2 (une forme par
    bloc, fraîches via secrets — rsk et dsk sont neufs à chaque appel,
    jamais fournis de l'extérieur : voir encode_deniable/encode_deniable0).

    _nonce/_y/_leftover/_k2 (préfixés `_`, tâche 7) : injection interne pour
    le mode vecteurs — None (défaut) préserve exactement le comportement
    actuel pour chacun. _k2 remplace le tirage secrets.randbelow(N_FORMS)
    par bloc (plus de tirage de direction, voir _deniable_positions).
    """
    import referent6x6_gen as R6
    from carter_random import _derive_masks
    from stegano_lib import _carter_split
    CELL_SIZE = R6.GRID_SIZE * R6.GRID_SIZE   # 36 : mode crypto, toutes les cases
    L = len(block_indices) * CELL_SIZE
    payload = _encrypt(message, sk, L, _nonce=_nonce)
    nibbles = payload_to_symbols(payload, L, _y=_y, _leftover=_leftover)
    if _k2 is not None:
        if len(_k2) != len(block_indices):
            raise ValueError(f"_k2 doit contenir {len(block_indices)} entrée(s), reçu {len(_k2)}")
        k2 = _k2
    else:
        k2 = [{'form_id': secrets.randbelow(R6.N_FORMS)} for _ in range(len(block_indices))]
    positions = _deniable_positions(N, B, block_indices, sk, k2)
    _, gk_local = _carter_split(sk)
    # gk_local diffère déjà entre rsk et dsk (secrets.token_bytes distincts) :
    # un seul domaine HKDF suffit à séparer les masques réel/contrainte, la
    # clé elle-même fait le travail de séparation.
    masks = _derive_masks(gk_local, L, LABELS['mask_seed']['info_deniable'])
    for ni, (gr, gc) in enumerate(positions):
        if ni >= len(nibbles): break
        grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
    return k2

def _read_deniable(grid: List[List[int]], N: int, B: int,
                    block_indices: List[int], sk: bytes, k2: List[Dict]) -> str:
    """Inverse de _place_deniable — mêmes blocs, même clé, même key_2."""
    import referent6x6_gen as R6
    from carter_random import _derive_masks
    from stegano_lib import _carter_split
    _, gk_local = _carter_split(sk)
    CELL_SIZE = R6.GRID_SIZE * R6.GRID_SIZE
    L = len(block_indices) * CELL_SIZE
    masks = _derive_masks(gk_local, L, LABELS['mask_seed']['info_deniable'])
    positions = _deniable_positions(N, B, block_indices, sk, k2)
    vals = [(grid[gr][gc] - masks[ni]) % ALPHA_LEN
            for ni, (gr, gc) in enumerate(positions)]
    return _decrypt(vals, sk, len(vals))

def encode_deniable(real_message: str, duress_message: str,
                     grid_size: int = 90,
                     _rsk: Optional[bytes] = None,
                     _dsk: Optional[bytes] = None,
                     _pi: Optional[List[int]] = None,
                     _noise_seed: Optional[bytes] = None,
                     _real_inject: Optional[Dict] = None,
                     _duress_inject: Optional[Dict] = None) -> Tuple[List[List[int]], Dict, Dict]:
    """
    Den.Encode(m_r, m_d) — Définition 1 révisée (bloc C, tâche 5, format v3).

    rsk et dsk sont neufs à chaque appel (secrets.token_bytes) — aucune API
    PUBLIQUE ne permet d'en fournir un existant. _rsk/_dsk/_pi/_noise_seed/
    _real_inject/_duress_inject (préfixés `_`) sont le mode vecteurs interne
    de la tâche 7 — jamais exposés par demo() ni la CLI. _real_inject et
    _duress_inject sont des dicts optionnels {'_nonce':.., '_y':.., '_leftover':..,
    '_k2':..} (mêmes clés que les paramètres de _place_deniable, dépaquetés
    directement en **kwargs) transmis pour le côté concerné.

    π (permutation de TOUS les blocs) est tirée une fois par secrets,
    indépendamment de rsk et dsk — sauf si _pi est fourni (mode vecteurs),
    auquel cas cette permutation exacte est utilisée telle quelle (validée
    comme permutation de range(n_blocks)). Br et Bd (même taille ⌊B/2⌋
    chacun, voir _split_br_bd) sont stockés directement dans les clés
    retournées — voir le commentaire de section ci-dessus pour pourquoi Bd
    révélant Br structurellement n'est pas une fuite.

    Invariant (à reprendre tel quel par LH-5) : les ENSEMBLES de blocs
    (Br, Bd, et le bloc orphelin si B est impair) sont indépendants des
    clés — aucune fonction qui les calcule (_fisher_yates, _split_br_bd)
    n'est appelée avec rsk, dsk ni aucune valeur qui en dérive. Les
    POSITIONS À L'INTÉRIEUR d'un bloc (référent, formes, k2) sont en
    revanche dérivées de la clé du message CONCERNÉ par ce bloc (rsk pour
    Br, dsk pour Bd) — c'est voulu, pas une fuite : voir _place_deniable.

    Retourne (grid, dk_r, dk_d), syntaxiquement identiques.
    """
    N = grid_size; B = N // 6
    n_blocks = B * B

    grid = random_grid(N, N, _noise_seed=_noise_seed)

    rsk = _rsk if _rsk is not None else secrets.token_bytes(32)
    dsk = _dsk if _dsk is not None else secrets.token_bytes(32)

    if _pi is not None:
        if sorted(_pi) != list(range(n_blocks)):
            raise ValueError(f"_pi doit être une permutation de range({n_blocks})")
        pi = list(_pi)
    else:
        pi = _fisher_yates(n_blocks)
    Br, Bd = _split_br_bd(pi)

    real_inject   = _real_inject or {}
    duress_inject = _duress_inject or {}
    rk2 = _place_deniable(grid, N, B, Br, real_message,   rsk, **real_inject)
    dk2 = _place_deniable(grid, N, B, Bd, duress_message, dsk, **duress_inject)

    dk_r = {'steg_key': rsk, 'blocks': Br, 'key_2': rk2}
    dk_d = {'steg_key': dsk, 'blocks': Bd, 'key_2': dk2}
    return grid, dk_r, dk_d

def encode_deniable0(duress_message: str, grid_size: int = 90,
                      _dsk: Optional[bytes] = None,
                      _pi: Optional[List[int]] = None,
                      _noise_seed: Optional[bytes] = None,
                      _duress_inject: Optional[Dict] = None) -> Tuple[List[List[int]], Dict]:
    """
    Den.Encode0(m_d) — même procédure SANS message réel (bloc C, tâche 5).

    Mode d'usage NORMAL de l'API publique, pas un mode de test : Br reste
    au bruit CSPRNG déjà posé par le remplissage initial de la grille —
    statistiquement identique à un message chiffré réel (même construction
    XChaCha20-Poly1305 + PayloadToSymbols, même loi uniforme sur
    [0..ALPHA_LEN-1]), donc aucun distingueur entre une grille produite par
    encode_deniable() et une grille produite par encode_deniable0() sans
    connaître au moins une des deux clés.

    _dsk/_pi/_noise_seed/_duress_inject (préfixés `_`) : mode vecteurs
    interne (tâche 7), voir encode_deniable().

    Retourne (grid, dk_d) — pas de dk_r, il n'y a pas de message réel à décoder.
    """
    N = grid_size; B = N // 6
    n_blocks = B * B

    grid = random_grid(N, N, _noise_seed=_noise_seed)

    dsk = _dsk if _dsk is not None else secrets.token_bytes(32)

    if _pi is not None:
        if sorted(_pi) != list(range(n_blocks)):
            raise ValueError(f"_pi doit être une permutation de range({n_blocks})")
        pi = list(_pi)
    else:
        pi = _fisher_yates(n_blocks)
    _, Bd = _split_br_bd(pi)   # Br (et le bloc restant si B impair) volontairement inutilisés

    duress_inject = _duress_inject or {}
    dk2 = _place_deniable(grid, N, B, Bd, duress_message, dsk, **duress_inject)

    dk_d = {'steg_key': dsk, 'blocks': Bd, 'key_2': dk2}
    return grid, dk_d

def decode_deniable(grid: List[List[int]], keys: Dict, grid_size: int = 90) -> str:
    """
    Den.Decode — décode un message depuis la grille. Fonctionne
    identiquement pour dk_r et dk_d (mêmes clés syntaxiquement) : les blocs
    sont stockés directement dans `keys['blocks']` (π est indépendante des
    clés, non re-dérivable — voir encode_deniable). Lève ValueError si la
    clé est incorrecte (commitment ou tag Poly1305 invalide).
    """
    N = grid_size; B = N // 6
    return _read_deniable(grid, N, B, keys['blocks'], keys['steg_key'], keys['key_2'])


# ── Démo ──────────────────────────────────────────────────────────────────────
def demo():
    print("=== SECUBOX — X25519 + Forward Secrecy + Déni Plausible ===\n")
    ref256 = load_referent_256_v3()

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
                  ka['key_2'], ref256)
    decoded = decode(grid, kb['steg_key'], kb['key_b'],
                     kb['key_2'], ref256)
    print(f"   Alice → Bob : '{msg}' → '{decoded}' ✓")

    print("\n6. DÉNI PLAUSIBLE (2 messages, 1 grille 90×90, bloc C — tâche 5)\n")
    grid_d, rk, dk = encode_deniable(
        "MESSAGE SECRET ANIBAL", "NOTES PERSO TEXTILE")
    real_out   = decode_deniable(grid_d, rk)
    duress_out = decode_deniable(grid_d, dk)
    print(f"   Clé réelle     → '{real_out}' ✓")
    print(f"   Clé contrainte → '{duress_out}' ✓")
    print(f"   Br/Bd viennent d'une permutation π tirée par secrets, indépendante de rsk/dsk")
    print(f"   (remplace _derive_block_sequence — voir le commentaire de section, tâche 5)")

    print("\n6bis. DÉNI PLAUSIBLE — Encode0 (pas de message réel, mode normal)\n")
    grid_d0, dk0 = encode_deniable0("RIEN A CACHER ICI")
    duress0_out  = decode_deniable(grid_d0, dk0)
    print(f"   Clé contrainte → '{duress0_out}' ✓")
    print(f"   Br reste au bruit CSPRNG du remplissage initial — statistiquement identique")
    print(f"   à un message chiffré réel, aucun distingueur entre cette grille et celle du 6.")

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
                           ref256: Dict) -> List[List[int]]:
    """
    Encode un message en mode Carter depuis une session X25519.
    Utilise steg_key comme master_key de la grammaire Carter.

    session_keys : résultat de Session.derive()
    ref256 : référent 256 v3 (stegano_classic.load_referent_256_v3()) --
             câblage production 2026-09-12, remplace l'ancien schéma
             blue/orange. Pas de callers de production actuels (fonction
             non testée) : signalé pour tout futur appelant.
    Retourne     : grille 90×90 (liste de listes)
    """
    from stegano_lib import encode_carter
    return encode_carter(message, session_keys['steg_key'], ref256)

def decode_carter_session(grid: List[List[int]], session_keys: Dict,
                           ref256: Dict) -> str:
    """
    Décode une grille Carter depuis les clés de session. ref256 : voir
    encode_carter_session().
    """
    from stegano_lib import decode_carter
    return decode_carter(grid, session_keys['steg_key'], ref256)

def carter_deniable(
    real_message:   str,
    real_key:       bytes,
    duress_message: str,
    duress_key:     bytes,
    ref256:         Dict,
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
                                ref256: Dict,
                                ref360: Optional[Dict] = None) -> List[List[int]]:
    """
    Encode en mode Carter mixte (Ref256 + Ref360) depuis une session X25519.
    steg_key de session → master_key de la grammaire mixte 180×180.
    """
    from stegano_lib import encode_carter_mix
    return encode_carter_mix(message, session_keys['steg_key'], ref256, ref360)

def decode_carter_mix_session(grid: List[List[int]], session_keys: Dict,
                                ref256: Dict,
                                ref360: Optional[Dict] = None) -> str:
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
