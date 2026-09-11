#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Vecteurs de régression — secu_box.py (déni plausible)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Tests de bout en bout pour secu_box.encode_deniable / encode_deniable0 /
decode_deniable (bloc C, Définition 1 révisée — tâche 5, format v3).

Absent de la suite avant ce fichier : encode_deniable/decode_deniable
n'étaient exercés que par demo() (lancement manuel). La rupture introduite
par la migration format v3 de crypto_core._encrypt/_decrypt/payload_to_symbols
(tâche 2 — paramètre L requis) n'avait été détectée par aucun test
automatisé ; ce fichier existe pour que ça ne se reproduise pas.
"""

import os, sys, secrets, unittest

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'stegano'))

from secu_box import encode_deniable, encode_deniable0, decode_deniable

MSG_REAL   = "MESSAGE SECRET ANIBAL"
MSG_DURESS = "NOTES PERSO TEXTILE"


class TestDeniableRoundtrip(unittest.TestCase):
    """Den.Encode / Den.Decode — round-trip de bout en bout."""

    def test_real_and_duress_roundtrip(self):
        grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        self.assertEqual(decode_deniable(grid, rk), MSG_REAL)
        self.assertEqual(decode_deniable(grid, dk), MSG_DURESS)

    def test_encode0_roundtrip(self):
        """Den.Encode0 — mode normal de l'API publique, pas un mode de test."""
        grid, dk = encode_deniable0(MSG_DURESS)
        self.assertEqual(decode_deniable(grid, dk), MSG_DURESS)

    def test_roundtrip_various_lengths(self):
        for real, duress in (("A", "B"),
                              ("", "MESSAGE VIDE COTE REEL"),
                              (MSG_REAL, MSG_DURESS)):
            with self.subTest(real=real, duress=duress):
                grid, rk, dk = encode_deniable(real, duress)
                self.assertEqual(decode_deniable(grid, rk), real.upper())
                self.assertEqual(decode_deniable(grid, dk), duress.upper())

    def test_message_case_normalization(self):
        grid, rk, dk = encode_deniable("anibal amiot", "notes perso")
        self.assertEqual(decode_deniable(grid, rk), "ANIBAL AMIOT")
        self.assertEqual(decode_deniable(grid, dk), "NOTES PERSO")


class TestDeniableKeyProperties(unittest.TestCase):
    """rsk/dsk neufs, π indépendante des clés, partition stricte de tous les blocs."""

    def test_fresh_keys_each_call(self):
        _, rk1, dk1 = encode_deniable(MSG_REAL, MSG_DURESS)
        _, rk2, dk2 = encode_deniable(MSG_REAL, MSG_DURESS)
        self.assertNotEqual(rk1['steg_key'], rk2['steg_key'])
        self.assertNotEqual(dk1['steg_key'], dk2['steg_key'])
        self.assertNotEqual(rk1['steg_key'], dk1['steg_key'])

    def test_br_bd_disjoint_and_cover_all_blocks(self):
        """Br ∩ Bd = ∅ et Br ∪ Bd = [0, B) — partition stricte, aucune collision possible."""
        grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        br, bd = set(rk['blocks']), set(dk['blocks'])
        self.assertTrue(br.isdisjoint(bd), "Br et Bd se chevauchent")
        n_blocks = (90 // 6) ** 2
        self.assertEqual(br | bd, set(range(n_blocks)),
                         "Br ∪ Bd ne couvre pas tous les blocs de la grille")
        self.assertEqual(len(br), n_blocks // 2)
        self.assertEqual(len(bd), n_blocks - n_blocks // 2)

    def test_permutation_independent_of_keys(self):
        """
        π ne dépend d'aucune des deux clés : deux appels avec les MÊMES
        messages produisent des rsk/dsk différents (donc des grammar_key
        différents) mais rien ne garantit — ni n'interdit — que Br/Bd soient
        identiques d'un appel à l'autre. Vérifie plutôt que Br varie
        significativement entre plusieurs tirages (π tirée par secrets à
        chaque appel, pas dérivée d'une clé stable).
        """
        br_sets = []
        for _ in range(8):
            _, rk, _ = encode_deniable("A", "B")
            br_sets.append(frozenset(rk['blocks']))
        self.assertGreater(len(set(br_sets)), 1,
                           "Br identique à chaque appel : π ne semble pas tirée fraîche")

    def test_wrong_key_rejected_both_sides(self):
        grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        wrong_rk = dict(rk, steg_key=secrets.token_bytes(32))
        wrong_dk = dict(dk, steg_key=secrets.token_bytes(32))
        with self.assertRaises(ValueError):
            decode_deniable(grid, wrong_rk)
        with self.assertRaises(ValueError):
            decode_deniable(grid, wrong_dk)

    def test_duress_key_alone_cannot_decode_real_message(self):
        """
        Le porteur de la seule clé de contrainte ne peut pas décoder le
        message réel, même en connaissant Br (structurellement déductible
        de Bd, voir le commentaire de section dans secu_box.py) : sans rsk,
        le commitment HMAC / tag Poly1305 échoue.
        """
        grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        forged = {'steg_key': dk['steg_key'], 'blocks': rk['blocks'], 'key_2': rk['key_2']}
        with self.assertRaises(ValueError):
            decode_deniable(grid, forged)


class TestDeniableCapacity(unittest.TestCase):
    """Message trop long pour Br/Bd (112/113 blocs × 6 positions chacun)."""

    def test_message_too_long_raises(self):
        with self.assertRaises(ValueError):
            encode_deniable("A" * 5000, MSG_DURESS)
        with self.assertRaises(ValueError):
            encode_deniable(MSG_REAL, "A" * 5000)


if __name__ == '__main__':
    print("=" * 64)
    print("VECTEURS DE RÉGRESSION — secu_box.py (déni plausible)")
    print("=" * 64)
    unittest.main(verbosity=2)
