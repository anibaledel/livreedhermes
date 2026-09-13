# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
test_keys.py — Tests de stegano/keys.py (format v4, deux clés indépendantes)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
"""

import os, secrets, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import keys as K
from carter import _carter_split, _carter360_split, _carter_mix_split
from crypto_core import ALPHA_LEN


class TestLegacyMasterKey(unittest.TestCase):
    """keys_from_master() reproduit bit à bit l'ancien KeySplit (v3)."""

    def test_legacy_master_key(self):
        mk = secrets.token_bytes(32)

        xk, gk = _carter_split(mk)
        kv = K.keys_from_master(mk, 'carter256')
        self.assertEqual(kv['ck'], xk)
        self.assertEqual(kv['gk'], gk)

        xk360, gk360 = _carter360_split(mk)
        kv360 = K.keys_from_master(mk, 'carter360')
        self.assertEqual(kv360['ck'], xk360)
        self.assertEqual(kv360['gk'], gk360)

        xkmix, gkmix = _carter_mix_split(mk)
        kvmix = K.keys_from_master(mk, 'cartermix')
        self.assertEqual(kvmix['ck'], xkmix)
        self.assertEqual(kvmix['gk'], gkmix)

    def test_legacy_master_key_random_reuses_carter256_split(self):
        """carterrandom/carter18/carterhybrid reutilisent le split carter256
        (choix deliberatif deja en vigueur en v3, voir carter_random.py)."""
        mk = secrets.token_bytes(32)
        xk, gk = _carter_split(mk)
        for variant in ('carterrandom', 'carter18', 'carterhybrid'):
            kv = K.keys_from_master(mk, variant)
            self.assertEqual(kv['ck'], xk, f"{variant} ck")
            self.assertEqual(kv['gk'], gk, f"{variant} gk")


class TestGenerateKeys(unittest.TestCase):
    def test_generate_keys_independent(self):
        k = K.generate_keys()
        self.assertEqual(len(k['ck']), 32)
        self.assertEqual(len(k['gk']), 32)
        self.assertNotEqual(k['ck'], k['gk'])

    def test_generate_keys_different_each_call(self):
        k1, k2 = K.generate_keys(), K.generate_keys()
        self.assertNotEqual(k1['ck'], k2['ck'])
        self.assertNotEqual(k1['gk'], k2['gk'])


class TestGkDesignation(unittest.TestCase):
    def test_deterministic(self):
        d1 = K.gk_from_designation('planche-042', '2026-09-13')
        d2 = K.gk_from_designation('planche-042', '2026-09-13')
        self.assertEqual(d1, d2)
        self.assertEqual(len(d1), 32)

    def test_sensitive_to_planche_and_date(self):
        base = K.gk_from_designation('planche-042', '2026-09-13')
        self.assertNotEqual(base, K.gk_from_designation('planche-043', '2026-09-13'))
        self.assertNotEqual(base, K.gk_from_designation('planche-042', '2026-09-14'))


class TestLayoutNonce(unittest.TestCase):
    def test_new_layout_nonce_length(self):
        nu = K.new_layout_nonce()
        self.assertEqual(len(nu), K.NU_BYTES)
        self.assertEqual(K.NU_BYTES, 24)

    def test_new_layout_nonce_different_each_call(self):
        self.assertNotEqual(K.new_layout_nonce(), K.new_layout_nonce())

    def test_nu_to_symbols_length(self):
        """36 symboles exactement : plus petit m tel que 44**m >= 2**192,
        SANS la marge _LAMBDA_S (nu est deja CSPRNG et public)."""
        nu = K.new_layout_nonce()
        syms = K.nu_to_symbols(nu)
        self.assertEqual(len(syms), K.NU_SYMBOLS)
        self.assertEqual(K.NU_SYMBOLS, 36)
        for s in syms:
            self.assertGreaterEqual(s, 0)
            self.assertLess(s, ALPHA_LEN)

    def test_nu_symbols_roundtrip(self):
        for _ in range(20):
            nu = K.new_layout_nonce()
            self.assertEqual(K.symbols_to_nu(K.nu_to_symbols(nu)), nu)

    def test_nu_wrong_length_rejected(self):
        with self.assertRaises(ValueError):
            K.nu_to_symbols(b'\x00' * 23)
        with self.assertRaises(ValueError):
            K.symbols_to_nu([0] * 35)


class TestDeriveGkNu(unittest.TestCase):
    def test_deterministic(self):
        gk = secrets.token_bytes(32)
        nu = K.new_layout_nonce()
        self.assertEqual(K.derive_gk_nu(gk, nu, 'carter256'),
                          K.derive_gk_nu(gk, nu, 'carter256'))

    def test_sensitive_to_nu(self):
        gk = secrets.token_bytes(32)
        nu_a, nu_b = K.new_layout_nonce(), K.new_layout_nonce()
        self.assertNotEqual(K.derive_gk_nu(gk, nu_a, 'carter256'),
                             K.derive_gk_nu(gk, nu_b, 'carter256'))

    def test_sensitive_to_variant(self):
        gk = secrets.token_bytes(32)
        nu = K.new_layout_nonce()
        seen = {v: K.derive_gk_nu(gk, nu, v) for v in
                ('carter256', 'carter360', 'cartermix', 'carterrandom',
                 'carter18', 'carterhybrid', 'deniable')}
        self.assertEqual(len(set(seen.values())), len(seen), "collision entre variantes")

    def test_independent_of_ck(self):
        """gk_nu ne depend que de gk et nu : ck n'entre dans aucune derivation
        de geometrie (verification de l'invariant central du format v4)."""
        gk = secrets.token_bytes(32)
        nu = K.new_layout_nonce()
        gk_nu = K.derive_gk_nu(gk, nu, 'carter256')
        # Deux appels avec des ck differents (non passes a derive_gk_nu,
        # qui n'accepte meme pas ce parametre) donnent le meme resultat --
        # l'absence de parametre ck dans la signature EST la garantie ;
        # ce test documente l'invariant plutot que de le mesurer.
        self.assertEqual(K.derive_gk_nu(gk, nu, 'carter256'), gk_nu)


if __name__ == '__main__':
    unittest.main(verbosity=2)
