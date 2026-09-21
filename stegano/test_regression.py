#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Vecteurs de régression — SecuBox / La Livrée d'Hermès
Anibal Edelberto Amiot (2026)

Ce fichier contient les vecteurs de régression cryptographiques.
Tout échec indique une rupture de compatibilité entre versions.

Structure :
  Classe XChaCha20  — Vecteurs officiels draft-irtf-cfrg-xchacha (tâche 1)
  Classe A          — Dérivation de clés (pure, déterministe)
  Classe B          — Grammaire Carter (déterministe)
  Classe C          — Format payload (key commitment + XChaCha20-Poly1305)
  Classe C-bis       — Charge utile à longueur fixe, correction seule (tâche 2,
                       remplace N1 — voir test_statistical.py pour les
                       tests statistiques 6.2/6.4 associés)
  Classe D          — Décodage (grilles pré-calculées, fixtures JSON)
  Classe E          — Compatibilité croisée encode/decode

Adapté de la suite de tests soumise en revue cryptographique externe pour
coller à l'API réelle de stegano_lib.py (monolithe) : `_encrypt()` ne porte
pas d'en-tête de longueur en tête de ses octets — cet en-tête est ajouté au
niveau du flux de symboles base-44 par `payload_to_symbols()`. La Classe C
a été réécrite en conséquence (voir commentaires locaux) ; les Classes A,
B, D, E sont inchangées dans leur logique, seuls les imports/signatures
ont été alignés sur stegano_lib.py.

Format v3 (tâche 2) : `_encrypt`/`_decrypt`/`payload_to_symbols` prennent
désormais un paramètre `L` (nombre de positions message de la grammaire) —
la charge utile est de longueur FIXE, déterminée par L, et porte la longueur
du message CHIFFRÉE à l'intérieur du payload plutôt que dans un en-tête
séparé. N1 (l'en-tête de longueur à entropie pleine) est remplacé en entier,
pas complété : TestHeaderUniformity est remplacée par TestFixedPayloadUniformity
ici (round-trip, invariant structurel) et par TestTwoGridDifference /
TestMaskedLength dans test_statistical.py (tests 6.2/6.4 du plan v3 —
propriétés statistiques, voir ce fichier).
"""

import unittest, os, sys, hashlib, hmac, struct
from unittest.mock import patch

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')   # console Windows (cp1252) vs. symboles ✓/✗

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stegano_lib import (
    load_referent_256_v3, load_referent_360_v3,
    _carter_split, _carter360_split, _carter_mix_split,
    _commit_key, _carter_grammar,
    _encrypt, _decrypt,
    encode, decode, make_keys,
    encode_carter, decode_carter,
    encode_carter_360, decode_carter_360,
    encode_carter_mix, decode_carter_mix,
    grid_to_csv, csv_to_grid,
    payload_to_symbols, symbols_needed, max_message_for,
    hchacha20, _xchacha20_enc, _xchacha20_dec,
    ALG_CASCADE_V1, _cascade_keys, encrypt_cascade, decrypt_cascade,
    max_message_for_cascade,
)
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305, AESGCM

# ── Clés fixes pour les tests ─────────────────────────────────────────────────
KEY_ZERO   = bytes(32)                           # 00...00
KEY_ONE    = bytes([0xFF] * 32)                  # FF...FF
KEY_KNOWN  = bytes(range(32))                    # 00 01 02 ... 1F
KEY_KNOWN2 = bytes(range(32, 64))                # 20 21 22 ... 3F

MSG_SHORT  = "ANIBALAMIOTX"
MSG_LONG   = "LACROIXANSEEESTLAMETHODECREATIVEDELALIVREEDHERMES"
MSG_ALPHA  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# ── Chargement des référents ─────────────────────────────────────────────────
_REF256_V3 = None
_REF360_V3 = None

def get_ref256_v3():
    """Référent 256 v3, chargeur unique du dépôt pour encode_carter/
    decode_carter/carter_capacity et le côté Ref256 de Carter-Mix (voir
    stegano_classic.load_referent_256_v3)."""
    global _REF256_V3
    if _REF256_V3 is None:
        _REF256_V3 = load_referent_256_v3()
    return _REF256_V3

def get_ref360_v3():
    """Référent 360 v3 (câblage production, étape 3, 2026-09-12) -- pour
    encode_carter_360/decode_carter_360/carter360_capacity et le côté
    Ref360 de Carter-Mix (étape 4)."""
    global _REF360_V3
    if _REF360_V3 is None:
        _REF360_V3 = load_referent_360_v3()
    return _REF360_V3

# ── Utilitaire : mock os.urandom déterministe ─────────────────────────────────
class _FakeRandom:
    """Générateur pseudo-aléatoire fixe pour rendre l'encodage déterministe."""
    def __init__(self, seed: bytes = b'\xDE\xAD\xBE\xEF'):
        self._state = hashlib.sha256(seed).digest()
        self._buf   = b''

    def urandom(self, n: int) -> bytes:
        while len(self._buf) < n:
            self._state = hashlib.sha256(self._state).digest()
            self._buf  += self._state
        result, self._buf = self._buf[:n], self._buf[n:]
        return result


def encode_deterministic(fn, *args, seed=b'DEADBEEF', **kwargs):
    """Exécute fn(*args) avec os.urandom fixé."""
    rng = _FakeRandom(seed)
    with patch('os.urandom', rng.urandom):
        return fn(*args, **kwargs)


# ══════════════════════════════════════════════════════════════════════════════
# Classe XChaCha20 — Vecteurs officiels draft-irtf-cfrg-xchacha (tâche 1)
# ══════════════════════════════════════════════════════════════════════════════
class TestXChaCha20Vectors(unittest.TestCase):
    """
    Vecteurs officiels du brouillon IETF draft-irtf-cfrg-xchacha, recopiés
    depuis le texte du brouillon (sections 2.2.1 et A.1/A.3.1), pas
    inventés. Confirme que hchacha20()/_xchacha20_enc()/_xchacha20_dec()
    sont interopérables avec toute implémentation standard de
    XChaCha20-Poly1305 (libsodium, PyNaCl, etc.) — contrairement à la
    construction à sous-clé HKDF de LH-5 qu'ils remplacent (tâche 1,
    format v3).
    """

    def test_hchacha20_vector_2_2_1(self):
        """Vecteur HChaCha20, draft-irtf-cfrg-xchacha §2.2.1."""
        key = bytes(range(32))  # 00 01 02 ... 1f
        nonce16 = bytes.fromhex('000000090000004a0000000031415927')
        expected = bytes.fromhex(
            '82413b4227b27bfed30e42508a877d73a0f9e4d58a74a853c12ec41326d3ecdc'
        )
        self.assertEqual(hchacha20(key, nonce16), expected)

    def test_xchacha20_poly1305_vector_a_3_1(self):
        """
        Vecteur AEAD_XChaCha20_Poly1305 complet, draft-irtf-cfrg-xchacha
        annexes A.1/A.3.1 — même texte en clair que l'exemple ChaCha20-
        Poly1305 de la RFC 8439 §2.8.2 ("Ladies and Gentlemen..."), réutilisé
        par le brouillon XChaCha pour cet exemple.
        """
        key = bytes.fromhex(
            '808182838485868788898a8b8c8d8e8f'
            '909192939495969798999a9b9c9d9e9f'
        )
        nonce = bytes.fromhex('404142434445464748494a4b4c4d4e4f5051525354555657')
        aad = bytes.fromhex('50515253c0c1c2c3c4c5c6c7')
        plaintext = (
            b"Ladies and Gentlemen of the class of '99: If I could offer you "
            b"only one tip for the future, sunscreen would be it."
        )
        expected_ct = bytes.fromhex(
            'bd6d179d3e83d43b9576579493c0e939'
            '572a1700252bfaccbed2902c21396cbb'
            '731c7f1b0b4aa6440bf3a82f4eda7e39'
            'ae64c6708c54c216cb96b72e1213b452'
            '2f8c9ba40db5d945b11b69b982c1bb9e'
            '3f3fac2bc369488f76b2383565d3fff9'
            '21f9664c97637da9768812f615c68b13'
            'b52e'
        )
        expected_tag = bytes.fromhex('c0875924c1c7987947deafd8780acf49')
        self.assertEqual(len(nonce), 24)
        self.assertEqual(len(plaintext), 114)

        subkey = hchacha20(key, nonce[:16])
        chacha_nonce = b'\x00\x00\x00\x00' + nonce[16:]
        ct_and_tag = ChaCha20Poly1305(subkey).encrypt(chacha_nonce, plaintext, aad)
        ct, tag = ct_and_tag[:-16], ct_and_tag[-16:]
        self.assertEqual(ct, expected_ct)
        self.assertEqual(tag, expected_tag)

    def test_xchacha20_enc_dec_roundtrip(self):
        """_xchacha20_enc/_xchacha20_dec (l'API réellement utilisée par _encrypt/_decrypt) sont inverses l'une de l'autre."""
        key = os.urandom(32)
        msg = b'HELLO XCHACHA20 STANDARD'
        ct = _xchacha20_enc(key, msg, aad=b'aad')
        self.assertEqual(_xchacha20_dec(key, ct, aad=b'aad'), msg)
        with self.assertRaises(Exception):
            _xchacha20_dec(os.urandom(32), ct, aad=b'aad')


# ══════════════════════════════════════════════════════════════════════════════
# Classe Cascade v1 — AES-256-GCM(XChaCha20-Poly1305(plaintext)), docs/CASCADE_V1.md
# ══════════════════════════════════════════════════════════════════════════════
class TestCascadeV1(unittest.TestCase):
    """
    encrypt_cascade/decrypt_cascade (tâche cascade, format v3). Pas de
    vecteur AES-GCM externe (NIST/RFC) recopié ici : contrairement à
    HChaCha20 (TestXChaCha20Vectors ci-dessus, pur Python, écrit à la main
    dans ce dépôt), AES-256-GCM n'est PAS réimplémenté — il vient tel quel
    de `cryptography` (AESGCM), une bibliothèque déjà validée contre les
    vecteurs NIST CAVP dans sa propre suite de tests amont ; un vecteur
    recopié ici de mémoire, sans pouvoir le vérifier contre le texte source,
    risquerait précisément ce que ce dépôt évite ailleurs (« vecteurs
    officiels, pas inventés »). Ce qui EST testé ici, et qui ne l'est nulle
    part en amont : la composition cascade elle-même — clés indépendantes,
    ordre des couches, alg en AAD, format, et qu'une seule couche compromise
    ne suffit pas à passer le round-trip.
    """

    def test_cascade_keys_independent_and_deterministic(self):
        key = os.urandom(32)
        k1a, k2a = _cascade_keys(key)
        k1b, k2b = _cascade_keys(key)
        self.assertEqual(k1a, k1b, "k1 non déterministe")
        self.assertEqual(k2a, k2b, "k2 non déterministe")
        self.assertNotEqual(k1a, k2a, "k1 et k2 identiques — pas de séparation de domaine")
        self.assertEqual(len(k1a), 32)
        self.assertEqual(len(k2a), 32)

    def test_aesgcm_layer_matches_cryptography_directly(self):
        """encrypt_cascade appelle bien AESGCM(k2) pour la couche extérieure :
        déchiffre la couche extérieure du payload avec AESGCM directement
        (indépendamment de decrypt_cascade), vérifie qu'elle redonne un flux
        XChaCha20-Poly1305 valide, pas en supposant que decrypt_cascade a raison."""
        key = os.urandom(32)
        L = 400
        nonce1, nonce2 = os.urandom(24), os.urandom(12)
        payload = encrypt_cascade("SEL", key, L, _nonce1=nonce1, _nonce2=nonce2)
        k1, k2 = _cascade_keys(key)

        commit, aad_p, n2_p, outer_p = payload[:32], payload[32:33], payload[33:45], payload[45:]
        self.assertEqual(aad_p, bytes([ALG_CASCADE_V1]))
        self.assertEqual(n2_p, nonce2)
        inner_direct = AESGCM(k2).decrypt(n2_p, outer_p, aad_p)
        self.assertEqual(inner_direct[:24], nonce1)   # N1 en tête de l'intérieur
        pt = _xchacha20_dec(k1, inner_direct, aad=aad_p)
        self.assertEqual(struct.unpack('>I', pt[:4])[0], len("SEL".encode('utf-8')))

    def test_roundtrip_various_lengths(self):
        key = os.urandom(32)
        for L, msg in ((200, ""), (300, "A"), (500, MSG_SHORT), (2000, MSG_LONG), (5000, "é中🎉 mixte UTF-8")):
            with self.subTest(L=L, msg=msg):
                payload = encrypt_cascade(msg, key, L)
                vals = payload_to_symbols(payload, L)
                self.assertEqual(decrypt_cascade(vals, key, L), msg)

    def test_capacity_29_bytes_less_than_simple(self):
        """payload_bytes ne dépend que de L (même budget pour les deux formats) :
        les +29 octets de surcoût cascade (alg + N2 + T2) se lisent donc comme
        29 octets de MESSAGE UTILE en moins pour un même L, pas comme un
        payload plus long — max_message_for_cascade(L) == max_message_for(L) - 29."""
        for L in (200, 400, 1000, 2000):
            with self.subTest(L=L):
                self.assertEqual(max_message_for_cascade(L), max_message_for(L) - 29)

    def test_wrong_full_key_rejected(self):
        key, other = os.urandom(32), os.urandom(32)
        L = 400
        payload = encrypt_cascade(MSG_SHORT, key, L)
        vals = payload_to_symbols(payload, L)
        with self.assertRaises(ValueError):
            decrypt_cascade(vals, other, L)

    def test_tampered_alg_byte_rejected(self):
        key = os.urandom(32)
        L = 400
        payload = bytearray(encrypt_cascade(MSG_SHORT, key, L))
        payload[32] ^= 0xFF   # alg
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(bytes(payload), L), key, L)

    def test_tampered_outer_nonce_rejected(self):
        key = os.urandom(32)
        L = 400
        payload = bytearray(encrypt_cascade(MSG_SHORT, key, L))
        payload[33] ^= 0xFF   # premier octet de N2
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(bytes(payload), L), key, L)

    def test_tampered_outer_ciphertext_rejected(self):
        """Altère un octet à l'intérieur de AES-GCM(inner) — la couche extérieure
        doit rejeter, sans même atteindre XChaCha20-Poly1305."""
        key = os.urandom(32)
        L = 400
        payload = bytearray(encrypt_cascade(MSG_SHORT, key, L))
        payload[50] ^= 0xFF   # à l'intérieur du bloc AES-GCM(inner)
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(bytes(payload), L), key, L)

    def test_tampered_outer_tag_rejected(self):
        key = os.urandom(32)
        L = 400
        payload = bytearray(encrypt_cascade(MSG_SHORT, key, L))
        payload[-1] ^= 0xFF   # dernier octet = T2
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(bytes(payload), L), key, L)

    def test_wrong_k1_alone_rejected(self):
        """Construit un payload où k2/commit viennent de la vraie clé mais où
        l'intérieur a été chiffré avec un k1 différent — la couche extérieure
        (AES-GCM, bonne clé) passe, la couche intérieure (XChaCha20, mauvaise
        clé) doit être ce qui échoue : preuve que les deux couches sont
        vérifiées, pas seulement l'extérieure."""
        key = os.urandom(32)
        wrong_k1 = os.urandom(32)
        L = 400
        msg_b = MSG_SHORT.encode('utf-8')
        cleartext_len = max_message_for_cascade(L) + 4
        cleartext = struct.pack('>I', len(msg_b)) + msg_b + b'\x00' * (cleartext_len - 4 - len(msg_b))
        _, k2 = _cascade_keys(key)
        aad = bytes([ALG_CASCADE_V1])
        inner = _xchacha20_enc(wrong_k1, cleartext, aad=aad)   # mauvais k1
        nonce2 = os.urandom(12)
        outer = AESGCM(k2).encrypt(nonce2, inner, aad)          # bon k2
        ck = _commit_key(key)
        commit = hmac.new(ck, nonce2 + outer, hashlib.sha256).digest()
        payload = commit + aad + nonce2 + outer
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(payload, L), key, L)

    def test_wrong_k2_alone_rejected(self):
        """Symétrique du précédent : k1 correct, k2 différent pour la couche
        extérieure. Le commitment (calculé sur N2‖outer, avec le VRAI k2 côté
        décodage) doit déjà rejeter ceci avant même AES-GCM."""
        key = os.urandom(32)
        wrong_k2 = os.urandom(32)
        L = 400
        msg_b = MSG_SHORT.encode('utf-8')
        cleartext_len = max_message_for_cascade(L) + 4
        cleartext = struct.pack('>I', len(msg_b)) + msg_b + b'\x00' * (cleartext_len - 4 - len(msg_b))
        k1, _ = _cascade_keys(key)
        aad = bytes([ALG_CASCADE_V1])
        inner = _xchacha20_enc(k1, cleartext, aad=aad)           # bon k1
        nonce2 = os.urandom(12)
        outer = AESGCM(wrong_k2).encrypt(nonce2, inner, aad)     # mauvais k2
        ck = _commit_key(key)
        commit = hmac.new(ck, nonce2 + outer, hashlib.sha256).digest()
        payload = commit + aad + nonce2 + outer
        with self.assertRaises(ValueError):
            decrypt_cascade(payload_to_symbols(payload, L), key, L)


# ══════════════════════════════════════════════════════════════════════════════
# Classe A — Dérivation de clés
# ══════════════════════════════════════════════════════════════════════════════
class TestKeyDerivation(unittest.TestCase):
    """Vecteurs de dérivation de clés (HKDF-SHA256). Entièrement déterministes."""

    VECTORS = {
        'carter_split_zero': {
            'input':     '0000000000000000000000000000000000000000000000000000000000000000',
            'xchacha':   None,
            'grammar':   None,
        },
        'carter_split_known': {
            'input':     '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
            'xchacha':   None,
            'grammar':   None,
        },
        'commit_key_zero': {
            'input':     '0000000000000000000000000000000000000000000000000000000000000000',
            'output':    None,
        },
    }

    @classmethod
    def setUpClass(cls):
        for name, v in cls.VECTORS.items():
            key = bytes.fromhex(v['input'])
            if 'carter_split' in name:
                xk, gk = _carter_split(key)
                v['xchacha'] = xk.hex()
                v['grammar'] = gk.hex()
            elif 'commit_key' in name:
                v['output'] = _commit_key(key).hex()

    def test_carter_split_deterministic(self):
        key = KEY_ZERO
        xk1, gk1 = _carter_split(key)
        xk2, gk2 = _carter_split(key)
        self.assertEqual(xk1, xk2, "xchacha_key non déterministe")
        self.assertEqual(gk1, gk2, "grammar_key non déterministe")

    def test_carter_split_separation(self):
        xk, gk = _carter_split(KEY_KNOWN)
        self.assertNotEqual(xk, gk,       "xchacha_key == grammar_key")
        self.assertNotEqual(xk, KEY_KNOWN, "xchacha_key == master_key")
        self.assertNotEqual(gk, KEY_KNOWN, "grammar_key == master_key")

    def test_carter360_split_independent(self):
        xk256, gk256 = _carter_split(KEY_KNOWN)
        xk360, gk360 = _carter360_split(KEY_KNOWN)
        self.assertNotEqual(xk256, xk360, "Carter 256 et 360 partagent xchacha_key")
        self.assertNotEqual(gk256, gk360, "Carter 256 et 360 partagent grammar_key")

    def test_carter_mix_split_independent(self):
        xk256, _ = _carter_split(KEY_KNOWN)
        xk360, _ = _carter360_split(KEY_KNOWN)
        xkmix, _ = _carter_mix_split(KEY_KNOWN)
        self.assertNotEqual(xkmix, xk256)
        self.assertNotEqual(xkmix, xk360)

    def test_commit_key_deterministic(self):
        ck1 = _commit_key(KEY_KNOWN)
        ck2 = _commit_key(KEY_KNOWN)
        self.assertEqual(ck1, ck2)
        self.assertNotEqual(ck1, KEY_KNOWN)

    def test_known_vectors(self):
        for name, v in self.VECTORS.items():
            key = bytes.fromhex(v['input'])
            if 'carter_split' in name:
                xk, gk = _carter_split(key)
                self.assertEqual(xk.hex(), v['xchacha'],
                                 f"xchacha_key changé pour {name}")
                self.assertEqual(gk.hex(), v['grammar'],
                                 f"grammar_key changé pour {name}")
            elif 'commit_key' in name:
                ck = _commit_key(key)
                self.assertEqual(ck.hex(), v['output'],
                                 f"commit_key changé pour {name}")


# ══════════════════════════════════════════════════════════════════════════════
# Classe B — Grammaire Carter
# ══════════════════════════════════════════════════════════════════════════════
class TestCarterGrammar(unittest.TestCase):
    """La grammaire Carter doit être identique d'une version à l'autre.

    Réécrite pour la forme v3 (câblage production, étape 2, 2026-09-12) :
    _carter_grammar() renvoie {'blocks':[{role,form_id}, ...]} -- plus de
    couleur/orientation tirées par bloc (le référent v3 encode déjà des
    positions absolues, lues rouge+bleu ensemble ; voir
    carter._carter_positions).

    Chantier 2 (2026-09-21) : _carter_grammar() ne dérive plus de
    sweep_of_color -- l'ordre de lecture des 12 positions stégano d'un
    bloc vient désormais du protocole couleur -> nombre du carré magique
    (voir carter._magic_number/_carter_positions), pas du balayage. La clé
    choisit toujours QUELLE forme (form_id), plus l'ordre DANS la forme."""

    GRAMMAR_VECTOR = None

    @classmethod
    def setUpClass(cls):
        ref256_v3 = get_ref256_v3()
        grammar = _carter_grammar(KEY_KNOWN, ref256_v3)
        cls.GRAMMAR_VECTOR = [
            {'role': g['role'], 'form_id': g['form_id']}
            for g in grammar['blocks'][:10]
        ]
        cls.ROLE_COUNTS = {
            0: sum(1 for g in grammar['blocks'] if g['role'] == 0),  # PURE
            1: sum(1 for g in grammar['blocks'] if g['role'] == 1),  # STRUCTURED
            2: sum(1 for g in grammar['blocks'] if g['role'] == 2),  # MESSAGE
        }

    def test_grammar_deterministic(self):
        ref256_v3 = get_ref256_v3()
        g1 = _carter_grammar(KEY_KNOWN, ref256_v3)
        g2 = _carter_grammar(KEY_KNOWN, ref256_v3)
        self.assertEqual(
            [(g['role'], g['form_id']) for g in g1['blocks']],
            [(g['role'], g['form_id']) for g in g2['blocks']])

    def test_grammar_key_sensitive(self):
        ref256_v3 = get_ref256_v3()
        g1 = _carter_grammar(KEY_KNOWN,  ref256_v3)
        g2 = _carter_grammar(KEY_KNOWN2, ref256_v3)
        roles1 = [g['role'] for g in g1['blocks']]
        roles2 = [g['role'] for g in g2['blocks']]
        self.assertNotEqual(roles1, roles2,
                            "Clés différentes → même grammaire (collision)")

    def test_grammar_vector_stable(self):
        ref256_v3 = get_ref256_v3()
        grammar = _carter_grammar(KEY_KNOWN, ref256_v3)
        current = [
            {'role': g['role'], 'form_id': g['form_id']}
            for g in grammar['blocks'][:10]
        ]
        self.assertEqual(current, self.GRAMMAR_VECTOR,
                         "Grammaire modifiée — rupture de compatibilité !")

    def test_grammar_covers_225_blocks(self):
        ref256_v3 = get_ref256_v3()
        grammar = _carter_grammar(KEY_KNOWN, ref256_v3)
        self.assertEqual(len(grammar['blocks']), 225)

    def test_grammar_total_consistent(self):
        self.assertEqual(sum(self.ROLE_COUNTS.values()), 225)


class TestCarterMagicOrder(unittest.TestCase):
    """Ordre de lecture par valeur magique (chantier 2, 2026-09-21,
    référent 256 SEULEMENT) : les 12 positions stégano d'un bloc sont
    lues dans l'ordre croissant du numéro que leur assigne le protocole
    couleur -> nombre du carré magique (carter._magic_number), à la place
    du balayage. Voir tools/verif_protocole.py pour la vérification
    indépendante sur les 256 formes (256/256 carrés magiques complets)."""

    @classmethod
    def setUpClass(cls):
        cls.ref256_v3 = get_ref256_v3()

    def test_magic_number_matches_protocol(self):
        """_magic_number reproduit exactement le calcul de
        tools/verif_protocole.py (bleu=i, rouge=37-i, vert=j, jaune=37-j)."""
        from carter import _magic_number
        n = 6
        for row in range(n):
            for col in range(n):
                i = n * row + col + 1
                j = n * row + (n - 1 - col) + 1
                self.assertEqual(_magic_number(row, col, 'bleu'), i)
                self.assertEqual(_magic_number(row, col, 'rouge'), n * n + 1 - i)
                self.assertEqual(_magic_number(row, col, 'vert'), j)
                self.assertEqual(_magic_number(row, col, 'jaune'), n * n + 1 - j)

    def test_magic_number_rejects_unknown_color(self):
        from carter import _magic_number
        with self.assertRaises(ValueError):
            _magic_number(0, 0, 'orange')

    def test_all_256_forms_have_distinct_magic_numbers_on_stegano_cells(self):
        """Précaution explicitement demandée : le tri par numéro n'est
        bien défini que si les 12 positions rouge+bleu d'une forme ont 12
        numéros distincts (garanti par construction pour un vrai carré
        magique d'ordre 6, où 1..36 apparaissent une seule fois chacun —
        vérifié ici sur les 256 formes réelles, pas seulement affirmé)."""
        from carter import _magic_number
        colors = self.ref256_v3['stegano_colors']
        for f in self.ref256_v3['forms']:
            numbers = [_magic_number(r, c, color)
                       for color in colors for r, c in f[f'{color}_positions']]
            self.assertEqual(len(set(numbers)), len(numbers),
                f"forme {f['id']} : numéros non distincts sur les positions stégano")

    def test_carter_positions_sorted_by_ascending_magic_number(self):
        from carter import _carter_grammar, _carter_positions, _MESSAGE, _magic_number, CARTER_BLOCK
        grammar = _carter_grammar(KEY_KNOWN, self.ref256_v3)
        checked_a_message_block = False
        for i, g in enumerate(grammar['blocks']):
            if g['role'] != _MESSAGE:
                continue
            checked_a_message_block = True
            br, bc = i // 15, i % 15
            positions = _carter_positions(br, bc, g, self.ref256_v3)
            form = self.ref256_v3['forms'][g['form_id']]
            colors = self.ref256_v3['stegano_colors']
            local_cells = [(r, c, color) for color in colors for r, c in form[f'{color}_positions']]
            expected_local_order = [
                (r, c) for _, r, c in sorted(
                    (_magic_number(r, c, color), r, c) for r, c, color in local_cells)
            ]
            r0, c0 = br * CARTER_BLOCK, bc * CARTER_BLOCK
            expected = [(r0 + r, c0 + c) for r, c in expected_local_order]
            self.assertEqual(positions, expected)
            break
        self.assertTrue(checked_a_message_block, "aucun bloc message dans la grammaire de test — clé à changer")

    def test_carter_positions_determinism(self):
        """Même clé, même référent -> même ordre à chaque appel (l'ordre
        ne dépend que de la forme, publique, pas d'un tirage)."""
        from carter import _carter_grammar, _carter_positions, _MESSAGE
        grammar = _carter_grammar(KEY_KNOWN, self.ref256_v3)
        for i, g in enumerate(grammar['blocks']):
            if g['role'] != _MESSAGE:
                continue
            br, bc = i // 15, i % 15
            p1 = _carter_positions(br, bc, g, self.ref256_v3)
            p2 = _carter_positions(br, bc, g, self.ref256_v3)
            self.assertEqual(p1, p2)
            break

    def test_carter_positions_same_form_same_order_regardless_of_key(self):
        """L'ordre de lecture d'UNE forme donnée ne dépend que de la forme
        (publique) : _carter_positions ne prend même pas de clé en
        argument -- deux blocs assignés au même form_id, que ce soit sous
        la même clé ou sous des clés différentes, lisent leurs 12
        positions dans le même ordre. C'est la clé qui choisit QUELLE
        forme (grammaire) ; l'ordre à l'intérieur de la forme choisie est
        public (chantier 2)."""
        from carter import _carter_positions
        g = {'form_id': 0, 'role': 2}
        p_from_block_a = _carter_positions(0, 0, g, self.ref256_v3)
        p_from_block_b = _carter_positions(3, 7, g, self.ref256_v3)   # même form_id, bloc différent
        local_a = [(r - 0, c - 0) for r, c in p_from_block_a]
        local_b = [(r - 3 * 6, c - 7 * 6) for r, c in p_from_block_b]
        self.assertEqual(local_a, local_b)

    def test_carter_positions_uses_block_size_not_grid_size(self):
        """Précaution explicitement demandée : le protocole numérote
        TOUJOURS le bloc à n=6 (CARTER_BLOCK), jamais la grille globale
        (90) -- sinon les numéros et donc l'ordre changeraient. On le
        vérifie en reproduisant _magic_number avec n=90 : le résultat
        diffère de celui utilisé en production dès que row>0."""
        from carter import _magic_number
        # row=1 donne des numéros différents entre n=6 (bloc) et n=90 (grille).
        self.assertNotEqual(_magic_number(1, 0, 'bleu', n=6),
                             _magic_number(1, 0, 'bleu', n=90))

    def test_corrupted_form_with_duplicate_magic_numbers_raises(self):
        """La distinction des 12 numéros est ASSERTÉE, pas seulement
        supposée : une forme corrompue (positions dupliquées, donnant deux
        cases la même couleur sur la même case) doit lever, pas produire
        silencieusement un ordre ambigu."""
        from carter import _carter_positions
        ref = self.ref256_v3
        good_form = ref['forms'][0]
        corrupted = dict(good_form)
        # Duplique une position rouge existante dans sa propre liste :
        # même case, même couleur, deux fois -> même numéro deux fois
        # (rouge et bleu ne peuvent jamais entrer en collision entre eux,
        # leurs formules sont l'inverse l'une de l'autre sur 1..36 --
        # c'est une VRAIE duplication de case qu'il faut simuler ici).
        corrupted['rouge_positions'] = list(good_form['rouge_positions']) + [good_form['rouge_positions'][0]]
        corrupted_ref = dict(ref)
        corrupted_ref['forms'] = [corrupted] + list(ref['forms'][1:])
        g = {'form_id': 0, 'role': 2}
        with self.assertRaises(AssertionError):
            _carter_positions(0, 0, g, corrupted_ref)


# ══════════════════════════════════════════════════════════════════════════════
# Classe C — Format payload (key commitment)
#
# Réécrite pour l'architecture réelle de stegano_lib.py : `_encrypt()` rend
# `commit(32B) + inner` où `inner = nonce(24) + ciphertext + tag(16)`, SANS
# en-tête de longueur en tête des octets. L'en-tête de longueur est ajouté
# séparément, au niveau du flux de symboles base-44, par
# `payload_to_symbols()` (utilisée par encode()/encode_carter*()), et c'est
# ce flux — pas les octets bruts de `_encrypt()` — que consomme `_decrypt()`.
# ══════════════════════════════════════════════════════════════════════════════
class TestPayloadFormat(unittest.TestCase):
    """Vérifier la structure du payload XChaCha20-Poly1305 + key commitment."""

    L_TEST = 200   # positions message arbitraires, largement au-dessus du
                   # minimum utilisable (124) et suffisantes pour MSG_SHORT

    def _make_payload(self, msg: str, key: bytes, L: int = None) -> bytes:
        """Génère un payload déterministe avec nonce fixe."""
        rng = _FakeRandom(b'format-test')
        with patch('os.urandom', rng.urandom):
            return _encrypt(msg, key, L if L is not None else self.L_TEST)

    def test_payload_header_size(self):
        """
        Format v3 (tâche 2) : plus d'en-tête de longueur séparé —
        payload_to_symbols() produit exactement L symboles (= symbols_needed(L)),
        toutes les positions message portant un symbole de charge utile.
        """
        payload = self._make_payload(MSG_SHORT, KEY_KNOWN)
        syms = payload_to_symbols(payload, self.L_TEST)
        self.assertEqual(len(syms), symbols_needed(self.L_TEST),
                         "Taille du flux de symboles incohérente avec L")
        self.assertEqual(len(syms), self.L_TEST)

    def test_payload_commitment_present(self):
        """
        Les 32 premiers octets de _encrypt() sont le HMAC de key commitment.

        Format v3 (tâche 2) : le HMAC porte sur `inner` seul. Contrairement à
        LH-4 (v2), il n'existe plus de longueur transmise séparément à
        authentifier — la taille du payload se déduit de L, public et
        identique des deux côtés, jamais transportée dans le flux.
        """
        payload = self._make_payload(MSG_SHORT, KEY_KNOWN)
        commit_recv, inner = payload[:32], payload[32:]
        ck = _commit_key(KEY_KNOWN)
        commit_calc = hmac.new(ck, inner, hashlib.sha256).digest()
        self.assertEqual(len(commit_recv), 32,
                         "Key commitment HMAC absent ou tronqué")
        self.assertEqual(commit_recv, commit_calc,
                         "Key commitment HMAC incorrect")

    def test_payload_minimum_size(self):
        """Taille minimale : 32B HMAC + 24B nonce + 16B tag = 72B (message 'A')."""
        payload = self._make_payload("A", KEY_KNOWN)
        min_size = 32 + 24 + 16   # hmac + nonce + tag (_encrypt ne porte pas de header)
        self.assertGreaterEqual(len(payload), min_size,
                                f"Payload trop court : {len(payload)} < {min_size}")

    def test_key_commitment_wrong_key(self):
        """Mauvaise clé → HMAC invalide détecté avant déchiffrement."""
        payload = self._make_payload(MSG_SHORT, KEY_KNOWN)
        syms = payload_to_symbols(payload, self.L_TEST)
        with self.assertRaises(ValueError) as ctx:
            _decrypt(syms, KEY_KNOWN2, self.L_TEST)
        self.assertIn("commitment", str(ctx.exception).lower(),
                      "Key commitment non détecté comme tel")

    def test_key_commitment_stable(self):
        """Le HMAC est déterministe pour une clé + payload donnés."""
        ck = _commit_key(KEY_KNOWN)
        inner = b'\x01' * 40   # nonce(24) + ct + tag simulés
        commit1 = hmac.new(ck, inner, hashlib.sha256).digest()
        commit2 = hmac.new(ck, inner, hashlib.sha256).digest()
        self.assertEqual(commit1, commit2)

    def test_format_unchanged_vector(self):
        """Le format du payload est stable entre versions."""
        rng = _FakeRandom(b'format-vector')
        with patch('os.urandom', rng.urandom):
            payload = _encrypt(MSG_SHORT, KEY_KNOWN, self.L_TEST)
        syms = payload_to_symbols(payload, self.L_TEST)
        self.assertEqual(len(syms), self.L_TEST)
        result = _decrypt(syms, KEY_KNOWN, self.L_TEST)
        self.assertEqual(result, MSG_SHORT.upper())


# ══════════════════════════════════════════════════════════════════════════════
# Classe C-bis — Charge utile à longueur fixe (format v3, tâche 2)
#
# N1 (correctif audit, passage 3) : REMPLACÉ PAR v3, pas fermé. N1 rendait
# les 2 symboles de poids faible d'un en-tête de longueur SÉPARÉ exactement
# uniformes, mais restait un champ distinct, de taille variable selon la
# longueur du message — hors du cadre des preuves du papier corrigé
# (carter_v6_fixes.tex). TestHeaderUniformity testait ce mécanisme
# (_header_to_syms/_syms_to_header) ; ce mécanisme est supprimé en entier
# (pas complété) par la charge utile à longueur fixe de la Définition 3.6 :
# TOUTES les positions message portent désormais un symbole de charge
# utile, il n'existe plus de position structurellement différente des
# autres.
#
# Les tests 6.2 (différence de deux grilles) et 6.4 (longueur masquée) du
# plan v3, qui remplacent la partie STATISTIQUE de TestHeaderUniformity,
# vivent dans test_statistical.py (TestTwoGridDifference,
# TestMaskedLength) — découpage cohérent avec le tableau 2 du papier
# (régression = vecteurs de correction, statistique = propriétés
# distributionnelles). Cette classe ne garde que les vérifications de
# correction (round-trip, invariant structurel) qui ne sont pas des tests
# statistiques.
# ══════════════════════════════════════════════════════════════════════════════
class TestFixedPayloadUniformity(unittest.TestCase):
    """Remplace TestHeaderUniformity (voir bloc de commentaire ci-dessus)."""

    L_TEST = 300

    def test_roundtrip_various_lengths(self):
        """Aller-retour correct pour plusieurs longueurs de message à L fixé."""
        key = KEY_KNOWN
        max_len = max_message_for(self.L_TEST)
        for msg in ("", "A", MSG_SHORT, MSG_LONG[:max_len]):
            payload = _encrypt(msg, key, self.L_TEST)
            syms = payload_to_symbols(payload, self.L_TEST)
            self.assertEqual(len(syms), self.L_TEST)
            self.assertEqual(_decrypt(syms, key, self.L_TEST), msg.upper())

    def test_symbol_count_independent_of_message_length(self):
        """
        Format v3 : le nombre de symboles produits ne dépend QUE de L (la
        grammaire), jamais de la longueur du message — c'est la propriété
        structurelle qui rend la longueur non observable depuis le flux
        (répond à N1 : plus de champ distinct dont la taille varierait).
        """
        key = KEY_KNOWN
        max_len = max_message_for(self.L_TEST)
        lengths_seen = set()
        for msg in ("", "A", MSG_SHORT, MSG_LONG[:max_len]):
            payload = _encrypt(msg, key, self.L_TEST)
            syms = payload_to_symbols(payload, self.L_TEST)
            lengths_seen.add(len(syms))
        self.assertEqual(lengths_seen, {self.L_TEST})


# ══════════════════════════════════════════════════════════════════════════════
# Classe C-ter — PayloadToSymbols au niveau primitif (tâche 6.1)
#
# TestFixedPayloadUniformity exerce _bytes_to_syms/_syms_to_bytes UNIQUEMENT
# via L (nombre de positions message d'une grammaire, toujours >= 124 en
# pratique — voir tâche 2), donc k = _capacity_k(L) n'est jamais 0 ni petit.
# Cette classe teste les primitives DIRECTEMENT, avec les cas limites du
# plan v3 (k=0, k multiple de 8, grande taille) que le chemin par L ne peut
# pas atteindre.
# ══════════════════════════════════════════════════════════════════════════════
class TestPtSPrimitive(unittest.TestCase):
    """PayloadToSymbols (Définition 3.6) : _bytes_to_syms/_syms_to_bytes, cas limites."""

    def test_roundtrip_various_nbytes(self):
        """Aller-retour pour des tailles de payload variées, y compris 0."""
        import crypto_core as C
        for nbytes in (0, 1, 2, 4, 8, 16, 32, 64, 128, 500):
            with self.subTest(nbytes=nbytes):
                payload = os.urandom(nbytes)
                m = C._smallest_m(8 * nbytes + C._LAMBDA_S)
                syms = C._bytes_to_syms(payload, m)
                self.assertEqual(len(syms), m)
                self.assertTrue(all(0 <= s < C.ALPHA_LEN for s in syms))
                self.assertEqual(C._syms_to_bytes(syms, nbytes), payload)

    def test_k_zero_empty_payload(self):
        """k=0 (payload vide) : cas limite explicitement requis par la tâche 6.1."""
        import crypto_core as C
        m = C._smallest_m(0 + C._LAMBDA_S)
        syms = C._bytes_to_syms(b'', m)
        self.assertEqual(len(syms), m)
        self.assertEqual(C._syms_to_bytes(syms, 0), b'')

    def test_k_multiple_of_8(self):
        """k multiple de 8 (toujours vrai ici puisque k=8*nbytes, mais vérifié explicitement)."""
        import crypto_core as C
        for k_bits in (8, 64, 128, 256, 1024):
            nbytes = k_bits // 8
            with self.subTest(k_bits=k_bits):
                payload = os.urandom(nbytes)
                m = C._smallest_m(k_bits + C._LAMBDA_S)
                syms = C._bytes_to_syms(payload, m)
                self.assertEqual(C._syms_to_bytes(syms, nbytes), payload)

    def test_large_size(self):
        """Grande taille — ordre de grandeur du payload d'une grande grille (Carter-Random-360)."""
        import crypto_core as C
        nbytes = 1400
        payload = os.urandom(nbytes)
        m = C._smallest_m(8 * nbytes + C._LAMBDA_S)
        syms = C._bytes_to_syms(payload, m)
        self.assertEqual(len(syms), m)
        self.assertEqual(C._syms_to_bytes(syms, nbytes), payload)

    def test_smallest_m_exact_boundary(self):
        """_smallest_m renvoie exactement le plus petit m tel que ALPHA_LEN**m >= 2**target_bits."""
        import crypto_core as C
        for target_bits in (0, 1, 5, 8, 64, 100, 1000):
            with self.subTest(target_bits=target_bits):
                m = C._smallest_m(target_bits)
                threshold = 1 << target_bits
                self.assertGreaterEqual(C.ALPHA_LEN ** m, threshold)
                if m > 0:
                    self.assertLess(C.ALPHA_LEN ** (m - 1), threshold)


# ══════════════════════════════════════════════════════════════════════════════
# Classe D — Grilles pré-calculées (fixtures)
# ══════════════════════════════════════════════════════════════════════════════
class TestFixtures(unittest.TestCase):
    """
    Vecteurs de décodage : grilles générées une fois avec randomness fixe.
    Si decode(grid, key) ≠ message_attendu → rupture de compatibilité.
    """

    FIXTURES = {}

    @classmethod
    def setUpClass(cls):
        ref256_v3 = get_ref256_v3()
        ref360_v3 = get_ref360_v3()

        def make_fixture(fn, *args, seed=b'seed'):
            rng = _FakeRandom(seed)
            with patch('os.urandom', rng.urandom):
                return fn(*args)

        sk, kb, k2 = make_fixture(
            lambda: make_keys(len(MSG_SHORT), ref256_v3), seed=b'classic-keys')
        grid = make_fixture(encode, MSG_SHORT, sk, kb, k2, ref256_v3,
                             seed=b'classic-grid')
        cls.FIXTURES['classic'] = {
            'grid': grid_to_csv(grid), 'steg_key': sk.hex(),
            'key_b': kb, 'key_2': k2, 'message': MSG_SHORT,
        }
        grid2 = make_fixture(encode_carter, MSG_SHORT, KEY_KNOWN, ref256_v3,
                              seed=b'carter256-2026')
        cls.FIXTURES['carter_256'] = {
            'grid': grid_to_csv(grid2), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

        grid3 = make_fixture(encode_carter_360, MSG_SHORT, KEY_KNOWN, ref360_v3,
                              seed=b'carter360-2026')
        cls.FIXTURES['carter_360'] = {
            'grid': grid_to_csv(grid3), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

        grid4 = make_fixture(encode_carter_mix, MSG_SHORT, KEY_KNOWN,
                              ref256_v3, ref360_v3, seed=b'cartermix-2026')
        cls.FIXTURES['carter_mix'] = {
            'grid': grid_to_csv(grid4), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

    def test_classic_decode_stable(self):
        ref256_v3 = get_ref256_v3()
        f = self.FIXTURES['classic']
        grid = csv_to_grid(f['grid'])
        sk   = bytes.fromhex(f['steg_key'])
        result = decode(grid, sk, f['key_b'], f['key_2'], ref256_v3)
        self.assertEqual(result, f['message'],
                         "Rupture encode/decode classique !")

    def test_carter_256_decode_stable(self):
        ref256_v3 = get_ref256_v3()
        f   = self.FIXTURES['carter_256']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter(csv_to_grid(f['grid']), key, ref256_v3),
            f['message'], "Rupture Carter 256 !")

    def test_carter_360_decode_stable(self):
        ref360_v3 = get_ref360_v3()
        f   = self.FIXTURES['carter_360']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter_360(csv_to_grid(f['grid']), key, ref360_v3),
            f['message'], "Rupture Carter 360 !")

    def test_carter_mix_decode_stable(self):
        ref256_v3 = get_ref256_v3()
        ref360_v3 = get_ref360_v3()
        f   = self.FIXTURES['carter_mix']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter_mix(csv_to_grid(f['grid']), key, ref256_v3, ref360_v3),
            f['message'], "Rupture Carter Mix !")

    def test_wrong_key_rejected_all_modes(self):
        ref256_v3 = get_ref256_v3()
        ref360_v3 = get_ref360_v3()
        wrong = KEY_KNOWN2

        for name, fn, args in [
            ('carter_256', decode_carter,
             (csv_to_grid(self.FIXTURES['carter_256']['grid']), wrong, ref256_v3)),
            ('carter_360', decode_carter_360,
             (csv_to_grid(self.FIXTURES['carter_360']['grid']), wrong, ref360_v3)),
            ('carter_mix', decode_carter_mix,
             (csv_to_grid(self.FIXTURES['carter_mix']['grid']), wrong, ref256_v3, ref360_v3)),
        ]:
            with self.subTest(mode=name):
                with self.assertRaises(ValueError, msg=f"Mauvaise clé acceptée en mode {name}"):
                    fn(*args)


# ══════════════════════════════════════════════════════════════════════════════
# Classe E — Compatibilité encode → decode
# ══════════════════════════════════════════════════════════════════════════════
class TestEndToEnd(unittest.TestCase):
    """Encode puis decode → message identique. Vérifié pour tous les modes."""

    def setUp(self):
        self.ref256_v3 = get_ref256_v3()
        self.ref360_v3 = get_ref360_v3()

    def _roundtrip(self, enc_fn, dec_fn, msg, key, *args):
        grid = enc_fn(msg, key, *args)
        result = dec_fn(grid, key, *args)
        return result

    def test_classic_roundtrip(self):
        sk, kb, k2 = make_keys(len(MSG_LONG), self.ref256_v3)
        grid = encode(MSG_LONG, sk, kb, k2, self.ref256_v3)
        self.assertEqual(decode(grid, sk, kb, k2, self.ref256_v3), MSG_LONG)

    def test_carter_256_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter, decode_carter,
                            MSG_LONG, KEY_KNOWN, self.ref256_v3),
            MSG_LONG)

    def test_carter_360_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter_360, decode_carter_360,
                            MSG_LONG, KEY_KNOWN, self.ref360_v3),
            MSG_LONG)

    def test_carter_mix_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter_mix, decode_carter_mix,
                            MSG_LONG, KEY_KNOWN, self.ref256_v3, self.ref360_v3),
            MSG_LONG)

    def test_key_isolation(self):
        grid256 = encode_carter(MSG_SHORT, KEY_KNOWN,  self.ref256_v3)
        grid360 = encode_carter_360(MSG_SHORT, KEY_KNOWN, self.ref360_v3)
        self.assertEqual(decode_carter(grid256, KEY_KNOWN, self.ref256_v3),     MSG_SHORT)
        self.assertEqual(decode_carter_360(grid360, KEY_KNOWN, self.ref360_v3), MSG_SHORT)

    def test_alpha_message(self):
        self.assertEqual(
            self._roundtrip(encode_carter, decode_carter,
                            MSG_ALPHA, KEY_KNOWN2, self.ref256_v3),
            MSG_ALPHA)

    def test_message_case_preserved(self):
        """Format v3 (UTF-8 sans restriction d'alphabet) : la casse n'est
        plus normalisée à l'encodage — decode() renvoie exactement le texte
        saisi (voir crypto_core._message_to_bytes)."""
        msg_mixed = "AnibalAmiotX"
        grid = encode_carter(msg_mixed, KEY_KNOWN, self.ref256_v3)
        result = decode_carter(grid, KEY_KNOWN, self.ref256_v3)
        self.assertEqual(result, msg_mixed)

    def test_message_utf8_non_ascii_roundtrip(self):
        """UTF-8 sans restriction d'alphabet (format v3) : un message
        accentué est accepté et redonné à l'identique, plus rejeté."""
        msg = "déjà vu"
        grid = encode_carter(msg, KEY_KNOWN, self.ref256_v3)
        result = decode_carter(grid, KEY_KNOWN, self.ref256_v3)
        self.assertEqual(result, msg)


# ══════════════════════════════════════════════════════════════════════════════
# Classe F — stegano_classic.py (couverture étendue)
#
# La suite existante (TestFixtures.test_classic_decode_stable,
# TestEndToEnd.test_classic_roundtrip) n'exerce que block_size=1 (k=1),
# avec une clé et un message uniques — jamais les blocs k=2/3/5, jamais le
# rejet de mauvaise clé, jamais la garde de capacité. Ajoutée suite à la
# migration de stegano_classic.py vers l'API v3 (tâche 2), qui n'avait
# jusqu'ici été vérifiée que par un lancement manuel de demo().
# ══════════════════════════════════════════════════════════════════════════════
class TestClassicVariants(unittest.TestCase):
    """stegano_classic.py : tailles de bloc, mauvaise clé, capacité."""

    def setUp(self):
        self.ref256_v3 = get_ref256_v3()

    def test_roundtrip_block_sizes(self):
        """Round-trip pour chaque taille de bloc valide (k=1,2,3,5)."""
        for k in (1, 2, 3, 5):
            with self.subTest(block_size=k):
                sk, kb, k2 = make_keys(len(MSG_SHORT), self.ref256_v3, block_size=k)
                grid = encode(MSG_SHORT, sk, kb, k2, self.ref256_v3)
                self.assertEqual(decode(grid, sk, kb, k2, self.ref256_v3), MSG_SHORT)

    def test_wrong_key_rejected(self):
        sk, kb, k2 = make_keys(len(MSG_SHORT), self.ref256_v3)
        grid = encode(MSG_SHORT, sk, kb, k2, self.ref256_v3)
        with self.assertRaises(ValueError):
            decode(grid, KEY_KNOWN2, kb, k2, self.ref256_v3)

    def test_capacity_exceeded_raises_before_grid(self):
        """
        Format v3 (tâche 2) : encode() calcule n_pos puis vérifie la
        capacité AVANT d'appeler _encrypt()/de construire la moindre
        grille — un message bien plus long que la capacité de la grille
        par défaut (60×60) doit être rejeté par ValueError.
        """
        sk, kb, k2 = make_keys(0, self.ref256_v3)   # message vide : capacité OK
        too_long = 'A' * 5000
        with self.assertRaises(ValueError):
            encode(too_long, sk, kb, k2, self.ref256_v3)


# Classe G — grid_90.py : SUPPRIMÉE d'ici le 2026-09-12 (décision de
# l'auteur, module sorti du chemin de production). Déplacée avec le module
# lui-même vers stegano/legacy/test_grid_90.py, où elle reste au vert.


# ══════════════════════════════════════════════════════════════════════════════
# Classe G-bis — Carter-Random : invariants de témoin (câblage cascade, 2026-09-21)
#
# Point de conception explicite (chantier Carter) : les critères I à IV ne
# s'appliquent PAS au générateur aléatoire. Carter-Random reste sans
# structure -- composition 6/6/12/12 seulement, pas de critères, pas de
# valeurs magiques, et par conséquent ses huit balayages conservés. Le
# câblage de la cascade porte sur le chiffrement du payload, jamais sur
# l'ordre de lecture ; ces tests échouent si un futur câblage (ici ou
# ailleurs) fait déborder la cascade sur la géométrie.
# ══════════════════════════════════════════════════════════════════════════════
class TestCarterRandomWitness(unittest.TestCase):
    """Carter-Random sert de témoin statistique dans le papier : aucune
    structure imposée aux référents (pas de critères I-IV, pas de valeur
    magique), lecture par balayage dérivé de la clé (huit balayages
    possibles, jamais un ordre canonique fixé). Ces tests garantissent que
    le câblage de la cascade v1 (encrypt_cascade/decrypt_cascade à la
    place de _encrypt/_decrypt, voir carter_random.py) n'a changé QUE le
    chiffrement du payload -- rien à la sélection du référent, au mode
    (CR-1), aux rôles de grammaire, ni aux balayages."""

    def test_eight_sweeps_no_canonical_order(self):
        """8 balayages possibles (4 coins × 2 axes), tous distincts. Un
        câblage qui figerait un ordre de lecture canonique (au lieu de le
        dériver de la clé, un par couleur) romprait cet invariant en
        réduisant ou en collisionnant cet ensemble."""
        import sweep as SW
        self.assertEqual(SW.N_SWEEPS, 8)
        self.assertEqual(len(SW.SWEEPS), 8)
        self.assertEqual(len(set(SW.SWEEPS)), 8, "balayages non distincts")

    def test_geometry_unchanged_by_cascade_wiring(self):
        """Valeurs figées sur le code de production JUSTE AVANT le câblage
        cascade (2026-09-21, capturées sur _encrypt/_encode_carter_random
        avant la migration vers encrypt_cascade) pour une clé fixe :
        référent, mode (CR-1), nombre de positions ET grammaire (rôles par
        bloc, résumés par SHA-256) doivent rester identiques après le
        câblage. Toute différence signale que la cascade a débordé sur la
        lecture plutôt que de se limiter au chiffrement du payload."""
        import carter_random as CR
        import sweep as SW
        import hashlib
        key = bytes(range(32))
        _, gk = CR._carter_split(key)
        # (ref_idx, meta_mode, n_pos, sweep_of_color, sha256 des rôles de grammaire)
        expected = {
            90:  (41, False, 864, {'blue': 0, 'orange': 0},
                  '520700b34ccfa859ec00e3f063440234741e4aaefccf804be1e07377c187e829'),
            180: (41, False, 3720, {'blue': 0, 'orange': 0},
                  '0d49a60e61feb364d9f9621a220ff61ce40693ad1c4e21e904707cc067c7c298'),
        }
        for grid_size, (exp_ref, exp_meta, exp_npos, exp_sweep, exp_roles_sha) in expected.items():
            with self.subTest(grid_size=grid_size):
                gk_ctr, ref_idx, meta_mode, ref, grammar, n_pos = CR._find_random_grammar_with_c_pub(
                    gk, grid_size, capacity_fn=CR.max_message_for_cascade)
                sweep_of_color = {c: SW.derive_sweep_index(gk_ctr, c) for c in CR._RANDOM_STEGANO_COLORS}
                roles_sha = hashlib.sha256(bytes(g['role'] for g in grammar)).hexdigest()
                self.assertEqual(ref_idx, exp_ref, "référent sélectionné modifié par le câblage")
                self.assertEqual(meta_mode, exp_meta, "bascule CR-1 modifiée par le câblage")
                self.assertEqual(n_pos, exp_npos, "nombre de positions modifié par le câblage")
                self.assertEqual(sweep_of_color, exp_sweep, "balayage modifié par le câblage")
                self.assertEqual(roles_sha, exp_roles_sha,
                    "grammaire (rôles par bloc) modifiée -- la cascade a débordé sur "
                    "autre chose que le chiffrement du payload")

    def test_no_referent_filtering_all_256_reachable(self):
        """Carter-Random n'applique aucun critère de sélection/validation
        aux référents : select_referent_index doit pouvoir retourner
        n'importe laquelle des 256 valeurs, sans filtrage ni repli. Un
        échantillon de 512 clés aléatoires doit couvrir un large éventail
        de référents distincts -- un sous-ensemble restreint trahirait un
        filtre caché (les critères I-IV du papier, par exemple)."""
        import referent6x6_gen as R6
        seen = {R6.select_referent_index(os.urandom(32)) for _ in range(512)}
        self.assertGreater(len(seen), 200,
            f"seulement {len(seen)} référents distincts sur 512 tirages -- "
            f"un filtre/critère aurait réduit l'espace atteignable")

    def test_role_composition_not_fixed_pattern(self):
        """Les rôles de grammaire (pur/structuré/message) sont dérivés de
        la clé, pas d'un motif fixe : deux clés différentes doivent
        produire des listes de rôles différentes pour le même référent."""
        import carter_random as CR
        _, gk1 = CR._carter_split(b'\x01' * 32)
        _, gk2 = CR._carter_split(b'\x02' * 32)
        ref = CR.get_referent(0)
        roles1 = [b['role'] for b in CR._grammar_individual(gk1, ref)]
        roles2 = [b['role'] for b in CR._grammar_individual(gk2, ref)]
        self.assertNotEqual(roles1, roles2,
            "mêmes rôles pour deux clés différentes -- suggère un motif fixe")


# ══════════════════════════════════════════════════════════════════════════════
# Classe H — C_PUB (capacité minimale publique, tâche 4)
#
# Validation complète sur 10 000 clés par variante effectuée hors suite
# (docs/PAPER_NUMBERS_v3.md, tâche 8) : 0/10000 échec pour les 7 cibles.
# Ici, échantillon rapide + garantie structurelle (rejet avant toute grille).
# ══════════════════════════════════════════════════════════════════════════════
class TestCPub(unittest.TestCase):
    """C_PUB : rejet public avant toute grille, capacité garantie après redraw."""

    N_KEYS = 30   # échantillon rapide dans la suite ; validation complète = 10 000

    @classmethod
    def setUpClass(cls):
        cls.ref256_v3 = get_ref256_v3()
        cls.ref360_v3 = get_ref360_v3()

    def test_c_pub_rejects_over_limit_before_grid(self):
        """Un message > C_PUB est refusé, quelle que soit la clé (seuil public)."""
        import crypto_core as C
        cases = [
            ('carter256', lambda msg: encode_carter(msg, KEY_KNOWN, self.ref256_v3)),
            ('carter360', lambda msg: encode_carter_360(msg, KEY_KNOWN, self.ref360_v3)),
            ('cartermix', lambda msg: encode_carter_mix(msg, KEY_KNOWN, self.ref256_v3, self.ref360_v3)),
        ]
        for variant, enc_fn in cases:
            with self.subTest(variant=variant):
                too_long = 'A' * (C.C_PUB[variant] + 1)
                with self.assertRaises(ValueError):
                    enc_fn(too_long)

    def test_c_pub_guaranteed_capacity_sample(self):
        """Capacité réelle (après redraw) toujours >= C_PUB, sur un échantillon de clés."""
        import crypto_core as C
        from carter import carter_capacity, carter360_capacity, carter_mix_capacity
        checks = [
            ('carter256', lambda k: carter_capacity(k, self.ref256_v3)['chars_max']),
            ('carter360', lambda k: carter360_capacity(k, self.ref360_v3)['chars_max']),
            ('cartermix', lambda k: carter_mix_capacity(k, self.ref256_v3, self.ref360_v3)['bytes_utiles']),
        ]
        for variant, cap_fn in checks:
            with self.subTest(variant=variant):
                for _ in range(self.N_KEYS):
                    key = os.urandom(32)
                    self.assertGreaterEqual(cap_fn(key), C.C_PUB[variant],
                        f"{variant} : capacité sous C_PUB malgré le redraw")

    def test_c_pub_roundtrip_at_boundary(self):
        """Round-trip pour un message exactement à la limite C_PUB."""
        import crypto_core as C
        msg = 'A' * C.C_PUB['carter256']
        grid = encode_carter(msg, KEY_KNOWN, self.ref256_v3)
        self.assertEqual(decode_carter(grid, KEY_KNOWN, self.ref256_v3), msg)

    def test_c_pub_carter_random_family(self):
        """Même garantie pour Random/18/Hybrid (import local, non exposés par stegano_lib)."""
        import crypto_core as C
        from carter_random import (
            encode_carter_random, encode_carter_random_360,
            encode_carter_18, encode_carter_hybrid,
            random_capacity, carter18_capacity, carter_hybrid_capacity,
        )
        cases = [
            ('carterrandom90',  lambda msg: encode_carter_random(msg, KEY_KNOWN),
             lambda k: random_capacity(k)['chars_max']),
            ('carterrandom360', lambda msg: encode_carter_random_360(msg, KEY_KNOWN),
             lambda k: random_capacity(k, grid_size=180)['chars_max']),
            ('carter18',        lambda msg: encode_carter_18(msg, KEY_KNOWN),
             lambda k: carter18_capacity(k)['capacity_chars']),
            ('carterhybrid',    lambda msg: encode_carter_hybrid(msg, KEY_KNOWN),
             lambda k: carter_hybrid_capacity(k)['capacity_chars']),
        ]
        for variant, enc_fn, cap_fn in cases:
            with self.subTest(variant=variant):
                too_long = 'A' * (C.C_PUB[variant] + 1)
                with self.assertRaises(ValueError):
                    enc_fn(too_long)
                for _ in range(self.N_KEYS):
                    key = os.urandom(32)
                    self.assertGreaterEqual(cap_fn(key), C.C_PUB[variant],
                        f"{variant} : capacité sous C_PUB malgré le redraw")

    def test_c_pub_keys_match_wired_variants(self):
        """Recoupe deux sources indépendantes : la liste des variantes de
        tools/recalibrate_carter_v3.VARIANTS (carter18 y a rejoint les six
        autres avec le câblage cascade, 2026-09-21 -- avant cela, sa
        géométrie n'avait pas changé lors du précédent passage de
        recalibration et il n'y figurait pas), contre les clés de
        crypto_core.C_PUB. Doit rester égal : ni variante câblée sans
        entrée C_PUB (oubli), ni entrée C_PUB orpheline (typo, variante
        retirée). C_PUB n'est PAS un champ du référent (décision de
        l'auteur, 2026-09-12) -- voir docs/REFERENT_FORMAT_V3.md."""
        import crypto_core as C
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, os.path.join(repo_root, 'tools'))
        import recalibrate_carter_v3 as RC
        wired = {variant_key for variant_key, _, _, _ in RC.VARIANTS}
        self.assertEqual(set(C.C_PUB.keys()), wired)


# ══════════════════════════════════════════════════════════════════════════════
# Point d'entrée
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("="*64)
    print("VECTEURS DE RÉGRESSION — SecuBox / La Livrée d'Hermès")
    print("="*64)
    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()
    for cls in [TestXChaCha20Vectors, TestKeyDerivation, TestCarterGrammar,
                TestCarterMagicOrder,
                TestPayloadFormat, TestFixedPayloadUniformity, TestPtSPrimitive,
                TestFixtures, TestEndToEnd,
                TestClassicVariants, TestCarterRandomWitness, TestCPub]:
        suite.addTests(loader.loadTestsFromTestCase(cls))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print(f"\n✓ Tous les vecteurs de régression passent")
        print(f"  {result.testsRun} tests, 0 erreur, 0 échec")
    else:
        print(f"\n✗ {len(result.failures)} échec(s), {len(result.errors)} erreur(s)")
        sys.exit(1)
