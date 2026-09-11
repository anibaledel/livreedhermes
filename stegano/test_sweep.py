#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""Tests de stegano/sweep.py (balayages de lecture, câblage production)."""
import os
import unittest

import sweep as S


class TestDeriveSweepIndex(unittest.TestCase):

    def test_range_0_7(self):
        for key in (b'\x00' * 32, b'\xff' * 32, os.urandom(32)):
            for color in ('rouge', 'bleu', 'vert', 'jaune'):
                idx = S.derive_sweep_index(key, color)
                self.assertGreaterEqual(idx, 0)
                self.assertLessEqual(idx, 7)

    def test_deterministic(self):
        key = os.urandom(32)
        self.assertEqual(S.derive_sweep_index(key, 'rouge'),
                          S.derive_sweep_index(key, 'rouge'))

    def test_distinct_colors_generally_differ(self):
        """Pas une propriete garantie (collisions possibles sur 8
        valeurs), mais sur un echantillon de cles, la plupart des cles
        doivent donner des balayages differents pour rouge/bleu."""
        key = os.urandom(32)
        colors = ['rouge', 'bleu', 'vert', 'jaune']
        indices = [S.derive_sweep_index(key, c) for c in colors]
        self.assertEqual(len(indices), 4)   # ne leve pas, valeurs dans [0,7]


class TestSortBySweep(unittest.TestCase):

    def setUp(self):
        self.positions = [(r, c) for r in range(6) for c in range(6)]

    def test_all_8_sweeps_are_total_orders_covering_all_positions(self):
        for idx in range(8):
            ordered = S.sort_by_sweep(list(self.positions), idx, 6)
            self.assertEqual(sorted(ordered), sorted(self.positions))
            self.assertEqual(len(ordered), len(self.positions))

    def test_TL_H_is_row_major(self):
        idx = S.SWEEPS.index(('TL', 'H'))
        ordered = S.sort_by_sweep(list(self.positions), idx, 6)
        expected = [(r, c) for r in range(6) for c in range(6)]
        self.assertEqual(ordered, expected)

    def test_BR_H_is_reverse_row_major(self):
        idx = S.SWEEPS.index(('BR', 'H'))
        ordered = S.sort_by_sweep(list(self.positions), idx, 6)
        expected = [(r, c) for r in range(5, -1, -1) for c in range(5, -1, -1)]
        self.assertEqual(ordered, expected)

    def test_TL_V_is_column_major(self):
        idx = S.SWEEPS.index(('TL', 'V'))
        ordered = S.sort_by_sweep(list(self.positions), idx, 6)
        expected = [(r, c) for c in range(6) for r in range(6)]
        self.assertEqual(ordered, expected)

    def test_subset_of_positions_preserves_relative_order(self):
        subset = [(0, 3), (5, 0), (2, 2)]
        for idx in range(8):
            ordered = S.sort_by_sweep(list(subset), idx, 6)
            self.assertEqual(sorted(ordered), sorted(subset))

    def test_deterministic_independent_of_input_order(self):
        import random
        rng = random.Random(1)
        shuffled = list(self.positions)
        rng.shuffle(shuffled)
        for idx in range(8):
            a = S.sort_by_sweep(list(self.positions), idx, 6)
            b = S.sort_by_sweep(shuffled, idx, 6)
            self.assertEqual(a, b)


class TestCryptoReadingOrder(unittest.TestCase):

    def test_single_niveau_orders_by_declared_color_then_sweep(self):
        cells = {0: {'rouge': [(1, 1), (0, 0)], 'bleu': [(2, 2)]}}
        sweep_of_color = {'rouge': S.SWEEPS.index(('TL', 'H')),
                           'bleu': S.SWEEPS.index(('TL', 'H'))}
        order = S.crypto_reading_order(cells, ['rouge', 'bleu'], 6, sweep_of_color)
        self.assertEqual(order, [(0, 0), (1, 1), (2, 2)])

    def test_niveaux_processed_in_ascending_order(self):
        cells = {2: {'rouge': [(0, 0)]}, 1: {'rouge': [(1, 1)]}}
        sweep_of_color = {'rouge': S.SWEEPS.index(('TL', 'H'))}
        order = S.crypto_reading_order(cells, ['rouge'], 6, sweep_of_color)
        self.assertEqual(order, [(1, 1), (0, 0)])

    def test_missing_color_in_a_niveau_is_skipped(self):
        cells = {0: {'rouge': [(0, 0)]}}
        sweep_of_color = {'rouge': 0, 'bleu': 0}
        order = S.crypto_reading_order(cells, ['rouge', 'bleu'], 6, sweep_of_color)
        self.assertEqual(order, [(0, 0)])


if __name__ == '__main__':
    unittest.main(verbosity=2)
