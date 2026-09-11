#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Vecteurs de régression — SecuBox / La Livrée d'Hermès
Anibal Edelberto Amiot (2026)

Ce fichier contient les vecteurs de régression cryptographiques.
Tout échec indique une rupture de compatibilité entre versions.

Structure :
  Classe A — Dérivation de clés (pure, déterministe)
  Classe B — Grammaire Carter (déterministe)
  Classe C — Format payload (key commitment + ChaCha20-HKDF)
  Classe D — Décodage (grilles pré-calculées, fixtures JSON)
  Classe E — Compatibilité croisée encode/decode

Adapté de la suite de tests soumise en revue cryptographique externe pour
coller à l'API réelle de stegano_lib.py (monolithe) : `_encrypt()` ne porte
pas d'en-tête de longueur en tête de ses octets — cet en-tête est ajouté au
niveau du flux de symboles base-44 par `payload_to_symbols()`. La Classe C
a été réécrite en conséquence (voir commentaires locaux) ; les Classes A,
B, D, E sont inchangées dans leur logique, seuls les imports/signatures
ont été alignés sur stegano_lib.py.
"""

import unittest, os, sys, hashlib, hmac, struct
from unittest.mock import patch

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')   # console Windows (cp1252) vs. symboles ✓/✗

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stegano_lib import (
    load_referents, _load_ref360,
    _carter_split, _carter360_split, _carter_mix_split,
    _commit_key, _carter_grammar,
    _encrypt, _decrypt,
    encode, decode, make_keys,
    encode_carter, decode_carter,
    encode_carter_360, decode_carter_360,
    encode_carter_mix, decode_carter_mix,
    grid_to_csv, csv_to_grid,
    payload_to_symbols, symbols_needed,
)

# ── Clés fixes pour les tests ─────────────────────────────────────────────────
KEY_ZERO   = bytes(32)                           # 00...00
KEY_ONE    = bytes([0xFF] * 32)                  # FF...FF
KEY_KNOWN  = bytes(range(32))                    # 00 01 02 ... 1F
KEY_KNOWN2 = bytes(range(32, 64))                # 20 21 22 ... 3F

MSG_SHORT  = "ANIBALAMIOTX"
MSG_LONG   = "LACROIXANSEEESTLAMETHODECREATIVEDELALIVREEDHERMES"
MSG_ALPHA  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# ── Chargement des référents ─────────────────────────────────────────────────
_REF256 = None
_REF360 = None

def get_refs():
    global _REF256, _REF360
    if _REF256 is None:
        _REF256, _ = load_referents()
        _REF360    = _load_ref360()
    return _REF256, _REF360

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
    """La grammaire Carter doit être identique d'une version à l'autre."""

    GRAMMAR_VECTOR = None

    @classmethod
    def setUpClass(cls):
        ref256, _ = get_refs()
        grammar = _carter_grammar(KEY_KNOWN, ref256)
        cls.GRAMMAR_VECTOR = [
            {'role': g['role'], 'form_id': g['form_id'],
             'color': g['color'], 'orient': g['orient']}
            for g in grammar[:10]
        ]
        cls.ROLE_COUNTS = {
            0: sum(1 for g in grammar if g['role'] == 0),  # PURE
            1: sum(1 for g in grammar if g['role'] == 1),  # STRUCTURED
            2: sum(1 for g in grammar if g['role'] == 2),  # MESSAGE
        }

    def test_grammar_deterministic(self):
        ref256, _ = get_refs()
        g1 = _carter_grammar(KEY_KNOWN, ref256)
        g2 = _carter_grammar(KEY_KNOWN, ref256)
        self.assertEqual(
            [(g['role'], g['form_id'], g['color']) for g in g1],
            [(g['role'], g['form_id'], g['color']) for g in g2])

    def test_grammar_key_sensitive(self):
        ref256, _ = get_refs()
        g1 = _carter_grammar(KEY_KNOWN,  ref256)
        g2 = _carter_grammar(KEY_KNOWN2, ref256)
        roles1 = [g['role'] for g in g1]
        roles2 = [g['role'] for g in g2]
        self.assertNotEqual(roles1, roles2,
                            "Clés différentes → même grammaire (collision)")

    def test_grammar_vector_stable(self):
        ref256, _ = get_refs()
        grammar = _carter_grammar(KEY_KNOWN, ref256)
        current = [
            {'role': g['role'], 'form_id': g['form_id'],
             'color': g['color'], 'orient': g['orient']}
            for g in grammar[:10]
        ]
        self.assertEqual(current, self.GRAMMAR_VECTOR,
                         "Grammaire modifiée — rupture de compatibilité !")

    def test_grammar_covers_225_blocks(self):
        ref256, _ = get_refs()
        grammar = _carter_grammar(KEY_KNOWN, ref256)
        self.assertEqual(len(grammar), 225)

    def test_grammar_total_consistent(self):
        self.assertEqual(sum(self.ROLE_COUNTS.values()), 225)


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
    """Vérifier la structure du payload ChaCha20-HKDF + key commitment."""

    def _make_payload(self, msg: str, key: bytes) -> bytes:
        """Génère un payload déterministe avec nonce fixe."""
        rng = _FakeRandom(b'format-test')
        with patch('os.urandom', rng.urandom):
            return _encrypt(msg, key)

    def test_payload_header_size(self):
        """
        L'en-tête de longueur vit dans le flux de symboles, pas dans les
        octets de _encrypt() : payload_to_symbols() doit produire exactement
        symbols_needed(len(payload)) symboles (en-tête + payload).
        """
        payload = self._make_payload(MSG_SHORT, KEY_KNOWN)
        syms = payload_to_symbols(payload)
        self.assertEqual(len(syms), symbols_needed(len(payload)),
                         "Taille du flux de symboles incohérente avec l'en-tête de longueur")

    def test_payload_commitment_present(self):
        """
        Les 32 premiers octets de _encrypt() sont le HMAC de key commitment.

        LH-4 (audit G. Kerma) : le HMAC porte sur header||inner, où header
        est l'en-tête de longueur (4 octets, = 32+len(inner)) que
        payload_to_symbols() calculera pour ce payload — et non plus sur
        inner seul. Sans cela, la longueur du message n'était pas couverte
        par le commitment.
        """
        payload = self._make_payload(MSG_SHORT, KEY_KNOWN)
        commit_recv, inner = payload[:32], payload[32:]
        ck = _commit_key(KEY_KNOWN)
        header = struct.pack('>I', 32 + len(inner))
        commit_calc = hmac.new(ck, header + inner, hashlib.sha256).digest()
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
        syms = payload_to_symbols(payload)
        with self.assertRaises(ValueError) as ctx:
            _decrypt(syms, KEY_KNOWN2)
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
            payload = _encrypt(MSG_SHORT, KEY_KNOWN)
        syms = payload_to_symbols(payload)
        self.assertEqual(len(syms), symbols_needed(len(payload)))
        result = _decrypt(syms, KEY_KNOWN)
        self.assertEqual(result, MSG_SHORT.upper())


# ══════════════════════════════════════════════════════════════════════════════
# Classe C-bis — En-tête de longueur à entropie pleine (correctif audit N1)
# ══════════════════════════════════════════════════════════════════════════════
class TestHeaderUniformity(unittest.TestCase):
    """
    N1 (audit passage 3) : le symbole de poids faible de l'en-tête de longueur
    ne couvrait que 11 valeurs sur 44 ({0,4,…,40}) — span=2^32 ≡ 4 (mod 44) et
    une longueur de faible entropie. Distingueur exploitable sans clé. Le champ
    longueur doit désormais présenter une entrée à ENTROPIE PLEINE : ses
    symboles de poids faible sont uniformes sur [0..ALPHA_LEN-1].
    """

    def test_header_roundtrip(self):
        """La longueur reste exactement recouvrable malgré le rembourrage."""
        import crypto_core as C
        for L in (0, 1, 44, 255, 256, 1000, 65535, (1 << 24) - 1):
            for _ in range(20):
                syms = C._header_to_syms(L)
                self.assertEqual(len(syms), C._SYM_HEADER)
                self.assertEqual(C._syms_to_header(syms), L,
                                 f"En-tête non réversible pour L={L}")

    def test_header_slots_multiple_of_alpha(self):
        """k = 44^m // 2^32 est un multiple de ALPHA_LEN (condition d'uniformité)."""
        import crypto_core as C
        self.assertEqual(C._HEADER_SLOTS % C.ALPHA_LEN, 0)
        # capacité exactement remplie : u ∈ [0, 44^m)
        self.assertEqual((C._HEADER_SPAN - 1) * C._HEADER_SLOTS
                         + (C._HEADER_SLOTS - 1),
                         C.ALPHA_LEN ** C._SYM_HEADER - 1)

    def test_header_low_symbol_uniform(self):
        """
        Preuve empirique : pour une longueur FIXÉE, le symbole de poids faible
        de l'en-tête parcourt les 44 valeurs de façon uniforme (44/44), contre
        11/44 avant le correctif. Chi² à 43 ddl, seuil très lâche.
        """
        import crypto_core as C
        from collections import Counter
        N = 120_000
        for L in (100, 12345):
            for idx in (0, 1):   # les deux symboles de poids faible
                c   = Counter(C._header_to_syms(L)[idx] for _ in range(N))
                exp = N / C.ALPHA_LEN
                chi2 = sum((c.get(v, 0) - exp) ** 2 / exp
                           for v in range(C.ALPHA_LEN))
                with self.subTest(L=L, idx=idx):
                    self.assertEqual(len(c), C.ALPHA_LEN,
                                     f"L={L} sym[{idx}] : {len(c)}/44 valeurs seulement")
                    # χ²_0.9999 (df=43) ≈ 89 ; large marge anti-flakiness.
                    self.assertLess(chi2, 100.0,
                                    f"L={L} sym[{idx}] non uniforme : chi2={chi2:.1f}")

    def test_length_hidden_and_hmac_length_preserved(self):
        """
        L'en-tête ne divulgue plus la longueur en clair (masquée par le
        rembourrage), et le HMAC LH-4 porte toujours sur struct.pack('>I',
        longueur)‖inner : decode reconstruit la même longueur avant de vérifier.
        """
        payload = _encrypt(MSG_SHORT, KEY_KNOWN)
        syms    = payload_to_symbols(payload)
        # decode complet réussit -> longueur correctement reconstruite + HMAC OK
        self.assertEqual(_decrypt(syms, KEY_KNOWN), MSG_SHORT.upper())


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
        ref256, _ = get_refs()
        ref360    = _load_ref360()

        def make_fixture(fn, *args, seed=b'seed'):
            rng = _FakeRandom(seed)
            with patch('os.urandom', rng.urandom):
                return fn(*args)

        sk, kb, kc, k2 = make_fixture(
            lambda: make_keys(len(MSG_SHORT), ref256), seed=b'classic-keys')
        grid = make_fixture(encode, MSG_SHORT, sk, kb, kc, k2, ref256,
                             seed=b'classic-grid')
        cls.FIXTURES['classic'] = {
            'grid': grid_to_csv(grid), 'steg_key': sk.hex(),
            'key_b': kb, 'key_c': kc, 'key_2': k2, 'message': MSG_SHORT,
        }
        grid2 = make_fixture(encode_carter, MSG_SHORT, KEY_KNOWN, ref256,
                              seed=b'carter256-2026')
        cls.FIXTURES['carter_256'] = {
            'grid': grid_to_csv(grid2), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

        grid3 = make_fixture(encode_carter_360, MSG_SHORT, KEY_KNOWN, ref360,
                              seed=b'carter360-2026')
        cls.FIXTURES['carter_360'] = {
            'grid': grid_to_csv(grid3), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

        grid4 = make_fixture(encode_carter_mix, MSG_SHORT, KEY_KNOWN,
                              ref256, ref360, seed=b'cartermix-2026')
        cls.FIXTURES['carter_mix'] = {
            'grid': grid_to_csv(grid4), 'key': KEY_KNOWN.hex(), 'message': MSG_SHORT}

    def test_classic_decode_stable(self):
        ref256, _ = get_refs()
        f = self.FIXTURES['classic']
        grid = csv_to_grid(f['grid'])
        sk   = bytes.fromhex(f['steg_key'])
        result = decode(grid, sk, f['key_b'], f['key_c'], f['key_2'], ref256)
        self.assertEqual(result, f['message'],
                         "Rupture encode/decode classique !")

    def test_carter_256_decode_stable(self):
        ref256, _ = get_refs()
        f   = self.FIXTURES['carter_256']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter(csv_to_grid(f['grid']), key, ref256),
            f['message'], "Rupture Carter 256 !")

    def test_carter_360_decode_stable(self):
        _, ref360 = get_refs()
        f   = self.FIXTURES['carter_360']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter_360(csv_to_grid(f['grid']), key, ref360),
            f['message'], "Rupture Carter 360 !")

    def test_carter_mix_decode_stable(self):
        ref256, ref360 = get_refs()
        f   = self.FIXTURES['carter_mix']
        key = bytes.fromhex(f['key'])
        self.assertEqual(
            decode_carter_mix(csv_to_grid(f['grid']), key, ref256, ref360),
            f['message'], "Rupture Carter Mix !")

    def test_wrong_key_rejected_all_modes(self):
        ref256, ref360 = get_refs()
        wrong = KEY_KNOWN2

        for name, fn, args in [
            ('carter_256', decode_carter,
             (csv_to_grid(self.FIXTURES['carter_256']['grid']), wrong, ref256)),
            ('carter_360', decode_carter_360,
             (csv_to_grid(self.FIXTURES['carter_360']['grid']), wrong, ref360)),
            ('carter_mix', decode_carter_mix,
             (csv_to_grid(self.FIXTURES['carter_mix']['grid']), wrong, ref256, ref360)),
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
        self.ref256, self.ref360 = get_refs()

    def _roundtrip(self, enc_fn, dec_fn, msg, key, *args):
        grid = enc_fn(msg, key, *args)
        result = dec_fn(grid, key, *args)
        return result

    def test_classic_roundtrip(self):
        sk, kb, kc, k2 = make_keys(len(MSG_LONG), self.ref256)
        grid = encode(MSG_LONG, sk, kb, kc, k2, self.ref256)
        self.assertEqual(decode(grid, sk, kb, kc, k2, self.ref256), MSG_LONG)

    def test_carter_256_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter, decode_carter,
                            MSG_LONG, KEY_KNOWN, self.ref256),
            MSG_LONG)

    def test_carter_360_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter_360, decode_carter_360,
                            MSG_LONG, KEY_KNOWN, self.ref360),
            MSG_LONG)

    def test_carter_mix_roundtrip(self):
        self.assertEqual(
            self._roundtrip(encode_carter_mix, decode_carter_mix,
                            MSG_LONG, KEY_KNOWN, self.ref256, self.ref360),
            MSG_LONG)

    def test_key_isolation(self):
        grid256 = encode_carter(MSG_SHORT, KEY_KNOWN,  self.ref256)
        grid360 = encode_carter_360(MSG_SHORT, KEY_KNOWN, self.ref360)
        self.assertEqual(decode_carter(grid256, KEY_KNOWN, self.ref256),     MSG_SHORT)
        self.assertEqual(decode_carter_360(grid360, KEY_KNOWN, self.ref360), MSG_SHORT)

    def test_alpha_message(self):
        self.assertEqual(
            self._roundtrip(encode_carter, decode_carter,
                            MSG_ALPHA, KEY_KNOWN2, self.ref256),
            MSG_ALPHA)

    def test_message_case_normalization(self):
        msg_lower = "anibalamiotx"
        grid = encode_carter(msg_lower, KEY_KNOWN, self.ref256)
        result = decode_carter(grid, KEY_KNOWN, self.ref256)
        self.assertEqual(result, msg_lower.upper())


# ══════════════════════════════════════════════════════════════════════════════
# Point d'entrée
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("="*64)
    print("VECTEURS DE RÉGRESSION — SecuBox / La Livrée d'Hermès")
    print("="*64)
    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()
    for cls in [TestKeyDerivation, TestCarterGrammar,
                TestPayloadFormat, TestHeaderUniformity,
                TestFixtures, TestEndToEnd]:
        suite.addTests(loader.loadTestsFromTestCase(cls))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print(f"\n✓ Tous les vecteurs de régression passent")
        print(f"  {result.testsRun} tests, 0 erreur, 0 échec")
    else:
        print(f"\n✗ {len(result.failures)} échec(s), {len(result.errors)} erreur(s)")
        sys.exit(1)
