#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
test_grid_90.py — grid_90.py (LEGACY, hors chemin de production)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Déplacé depuis stegano/test_regression.py (classe G, « grid_90.py —
structure QR à trois niveaux ») le 2026-09-12, en même temps que
grid_90.py lui-même : voir l'en-tête de ce module pour la décision de
l'auteur qui le sort du chemin de production. Gardé au vert ici plutôt
que supprimé, pour continuer à vérifier que le module fonctionne toujours
tel quel, à l'usage de quiconque voudrait le reprendre.
"""

import os, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from grid_90 import _load_ref256_legacy

KEY_KNOWN2 = bytes(range(32, 64))                # 20 21 22 ... 3F
MSG_SHORT  = "ANIBALAMIOTX"


class TestGrid90(unittest.TestCase):
    """grid_90.py : réel/leurre, stream sur sous-ensemble de super-blocs, limites."""

    @classmethod
    def setUpClass(cls):
        cls.ref256 = _load_ref256_legacy()

    def _make_keys_dict(self, msg_len, grid_size):
        from grid_90 import make_keys_legacy
        sk, kb, kc, k2 = make_keys_legacy(msg_len, self.ref256, grid_size=grid_size)
        return {'steg_key': sk, 'key_b': kb, 'key_c': kc, 'key_2': k2}

    def test_real_and_lure_roundtrip(self):
        """Message réel (9 super-blocs centraux) et leurre (12 de bord), indépendamment décodables."""
        from grid_90 import make_grid_90, decode_grid_90, GRID_SIZE
        real_msg, lure_msg = "ANIBALAMIOTX", "TEXTEANODINS"
        real_keys = self._make_keys_dict(len(real_msg), GRID_SIZE)
        lure_keys = self._make_keys_dict(len(lure_msg), GRID_SIZE)
        grid = make_grid_90(real_msg, real_keys, lure_msg, lure_keys, self.ref256)
        self.assertEqual(
            decode_grid_90(grid, real_keys, self.ref256, role='center'), real_msg)
        self.assertEqual(
            decode_grid_90(grid, lure_keys, self.ref256, role='edge'), lure_msg)

    def test_real_wrong_key_rejected(self):
        from grid_90 import make_grid_90, decode_grid_90, GRID_SIZE
        real_keys = self._make_keys_dict(len(MSG_SHORT), GRID_SIZE)
        lure_keys = self._make_keys_dict(len(MSG_SHORT), GRID_SIZE)
        grid = make_grid_90(MSG_SHORT, real_keys, MSG_SHORT, lure_keys, self.ref256)
        wrong_keys = dict(real_keys, steg_key=KEY_KNOWN2)
        with self.assertRaises(ValueError):
            decode_grid_90(grid, wrong_keys, self.ref256, role='center')

    def test_encode_stream_roundtrip_few_superblocks(self):
        """
        _encode_stream/_decode_stream sur 4 super-blocs seulement (216
        positions, contre 486 pour les 9 utilisés par make_grid_90) —
        vérifie le format v3 au voisinage du minimum de capacité (124
        positions), pas seulement sur la grille pleine.
        """
        import secrets
        from grid_90 import _encode_stream, _decode_stream, GRID_SIZE, ALPHA_LEN
        supers = [(1, 1), (1, 2), (2, 1), (2, 2)]   # 4 super-blocs = 216 positions
        keys = self._make_keys_dict(0, GRID_SIZE)
        grid = [[secrets.randbelow(ALPHA_LEN) for _ in range(GRID_SIZE)]
                for _ in range(GRID_SIZE)]
        msg = "HI"
        _encode_stream(grid, msg, keys, supers, self.ref256)
        self.assertEqual(_decode_stream(grid, keys, supers, self.ref256), msg)

    def test_encode_super_single_block_always_too_small(self):
        """
        encode_super() opère sur UN SEUL super-bloc (9 blocs × 6 = 54
        positions). La charge utile à longueur fixe exige >= 124 positions
        même pour un message VIDE (76 octets de surcoût AEAD+longueur,
        format v3, tâche 2) — et c'était déjà vrai avant la tâche 2 :
        l'ancien format variable exigeait >= 136 symboles pour un message
        vide (en-tête 18 symboles + 118 pour 72 octets de surcoût AEAD),
        également supérieur aux 54 positions disponibles. encode_super()
        n'a donc jamais pu encoder quoi que ce soit sur un seul super-bloc,
        dans AUCUNE version du format — ce n'est pas une régression de la
        tâche 2. Ce test verrouille le comportement attendu (rejet propre
        par ValueError) plutôt que de prétendre à un round-trip qui n'a
        jamais été possible.
        """
        import secrets
        from grid_90 import encode_super, make_keys_legacy, GRID_SIZE, ALPHA_LEN
        sk, kb, kc, k2 = make_keys_legacy(0, self.ref256, grid_size=GRID_SIZE)
        grid = [[secrets.randbelow(ALPHA_LEN) for _ in range(GRID_SIZE)]
                for _ in range(GRID_SIZE)]
        with self.assertRaises(ValueError):
            encode_super(grid, "", sk, kb, kc, k2, 2, 2, self.ref256)


if __name__ == '__main__':
    unittest.main(verbosity=2)
