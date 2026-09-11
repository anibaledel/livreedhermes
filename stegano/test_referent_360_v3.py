#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Tests du Référent 360 v3 (format déclaratif, tâche 8)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Lit directement data/referent_360_v3.json (pas de reparsing SVG — voir
tools/generate_referent_360.py pour la génération) et vérifie les deux
invariants établis avec l'auteur sur les 360 calques :
  1. 48/48/48 par superposition (somme sur les 6 niveaux d'une identité).
  2. Les deux règles de couleur : transposition MUT à 2 couleurs (magenta
     fixe côté YIN, orange fixe côté YANG) ; rotation M→O→V→M sur le
     changement d'axe2 YIN→YANG à axe1 fixé.
"""
import json
import os
import unittest
from collections import Counter, defaultdict

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT_PATH = os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')


def _load():
    with open(REFERENT_PATH, encoding='utf-8') as f:
        return json.load(f)


def _cellset(calque, color):
    return set(tuple(p) for p in calque.get(f'{color}_positions', []))


class TestReferent360Structure(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.doc = _load()

    def test_360_calques_60_identities(self):
        self.assertEqual(self.doc['n_calques'], 360)
        self.assertEqual(self.doc['n_identities'], 60)
        self.assertEqual(len(self.doc['calques']), 360)

    def test_c_pub_present(self):
        self.assertIsNotNone(self.doc.get('c_pub'),
            "c_pub absent -- executer tools/calibrate_referent.py")
        self.assertGreater(self.doc['c_pub'], 0)

    def test_referent_id_stable_across_recompute(self):
        """referent_id ne doit PAS dépendre de c_pub/generated_at_utc/
        generator_tool -- recalibrer ou regénérer à la même date ne doit
        jamais changer l'identité du référent."""
        import sys
        sys.path.insert(0, os.path.join(REPO_ROOT, 'tools'))
        import generate_referent_360 as GEN
        core = {
            'format_version': self.doc['format_version'],
            'referent_kind': self.doc['referent_kind'],
            'grid_size': self.doc['grid_size'],
            'layer_of': self.doc['layer_of'],
            'colors': self.doc['colors'],
            'color_hues_hex': self.doc['color_hues_hex'],
            'stegano_colors': self.doc['stegano_colors'],
            'calques': self.doc['calques'],
        }
        recomputed = GEN.compute_referent_id(core)
        self.assertEqual(recomputed, self.doc['referent_id'])

    def test_each_calque_single_niveau(self):
        layer_of = self.doc['layer_of']
        for calque in self.doc['calques']:
            niveau = calque['niveau']
            for color in ('violet', 'magenta', 'orange'):
                for r, c in calque.get(f'{color}_positions', []):
                    self.assertEqual(layer_of[r][c], niveau,
                        f"{calque['famille']}/{calque['teinte']}/{niveau} : "
                        f"case ({r},{c}) appartient au niveau {layer_of[r][c]}")

    def test_no_cell_reused_across_colors_within_a_calque(self):
        for calque in self.doc['calques']:
            seen = Counter()
            for color in ('violet', 'magenta', 'orange'):
                for pos in calque.get(f'{color}_positions', []):
                    seen[tuple(pos)] += 1
            dupes = {p: n for p, n in seen.items() if n > 1}
            self.assertFalse(dupes,
                f"{calque['famille']}/{calque['teinte']}/{calque['niveau']} : "
                f"case(s) comptée(s) sous plusieurs couleurs : {dupes}")


class TestInvariant48_48_48(unittest.TestCase):
    """Somme sur les 6 niveaux d'une identité (famille,teinte) = 48/48/48,
    sans exception, sur les 60 identités."""

    @classmethod
    def setUpClass(cls):
        cls.doc = _load()
        cls.by_identity = defaultdict(lambda: Counter())
        for calque in cls.doc['calques']:
            key = (calque['famille'], calque['teinte'])
            for color in ('violet', 'magenta', 'orange'):
                cls.by_identity[key][color] += len(calque.get(f'{color}_positions', []))

    def test_60_identities_present(self):
        self.assertEqual(len(self.by_identity), 60)

    def test_48_48_48_exact_on_all_60_identities(self):
        exceptions = []
        for key, counts in self.by_identity.items():
            if not (counts['violet'] == 48 and counts['magenta'] == 48 and counts['orange'] == 48):
                exceptions.append((key, dict(counts)))
        self.assertEqual(exceptions, [], f"identités hors 48/48/48 : {exceptions}")


class TestColorRules(unittest.TestCase):
    """Les deux règles établies avec l'auteur (2026-09-12), vérifiées sur
    les 360 calques réels du référent par défaut."""

    @classmethod
    def setUpClass(cls):
        cls.doc = _load()
        cls.lookup = {}
        for calque in cls.doc['calques']:
            cls.lookup[(calque['famille'], calque['teinte'], calque['niveau'])] = calque

    def _violet_count_pattern(self, famille, teinte):
        return tuple(len(self.lookup[(famille, teinte, n)].get('violet_positions', []))
                     for n in range(1, 7))

    def test_mut_transposition_orange_fixed_on_yang_side(self):
        """YIN-MUT-YANG(-MUT) : orange constant a 8 sur les 6 niveaux,
        magenta/violet alternent 16/0."""
        for teinte in ('YIN-MUT-YANG', 'YIN-MUT-YANG-MUT'):
            orange_counts = [len(self.lookup[('BASES', teinte, n)].get('orange_positions', []))
                              for n in range(1, 7)]
            self.assertTrue(all(c == 8 for c in orange_counts),
                f"BASES/{teinte} : orange non constant a 8 : {orange_counts}")
            violet_counts = self._violet_count_pattern('BASES', teinte)
            self.assertEqual(set(violet_counts), {0, 16},
                f"BASES/{teinte} : violet devrait alterner 0/16 : {violet_counts}")

    def test_mut_transposition_magenta_fixed_on_yin_side(self):
        """YIN-MUT-YIN(-MUT) : magenta constant a 8 sur les 6 niveaux,
        violet/orange alternent 16/0."""
        for teinte in ('YIN-MUT-YIN', 'YIN-MUT-YIN-MUT'):
            magenta_counts = [len(self.lookup[('BASES', teinte, n)].get('magenta_positions', []))
                               for n in range(1, 7)]
            self.assertTrue(all(c == 8 for c in magenta_counts),
                f"BASES/{teinte} : magenta non constant a 8 : {magenta_counts}")
            violet_counts = self._violet_count_pattern('BASES', teinte)
            self.assertEqual(set(violet_counts), {0, 16},
                f"BASES/{teinte} : violet devrait alterner 0/16 : {violet_counts}")

    def test_56_of_60_identities_uniform_8_per_niveau(self):
        n_uniform = 0
        n_mut = 0
        for (fam, teinte) in set((c['famille'], c['teinte']) for c in self.doc['calques']):
            pattern = self._violet_count_pattern(fam, teinte)
            if set(pattern) == {8}:
                n_uniform += 1
            elif set(pattern) == {0, 16}:
                n_mut += 1
            else:
                self.fail(f"{fam}/{teinte} : motif de violet inattendu {pattern}")
        self.assertEqual(n_uniform, 56)
        self.assertEqual(n_mut, 4)

    def test_yin_to_yang_axis2_rotation_M_to_O_to_V_to_M(self):
        """A axe1 fixe, passer de teinte=<axe1>-YIN a teinte=<axe1>-YANG
        (niveau identique) doit faire tourner CHAQUE case M->O, O->V, V->M,
        sans exception -- verifie sur les 4 valeurs d'axe1 x 6 niveaux."""
        axis1_values = ['YANG', 'YANG-MUT', 'YIN', 'YIN-MUT']
        expected = {('M', 'O'), ('O', 'V'), ('V', 'M')}
        checked = 0
        for axis1 in axis1_values:
            teinte_from = f'{axis1}-YIN'
            teinte_to = f'{axis1}-YANG'
            for niveau in range(1, 7):
                cfrom = self.lookup.get(('BASES', teinte_from, niveau))
                cto = self.lookup.get(('BASES', teinte_to, niveau))
                if cfrom is None or cto is None:
                    continue
                colormap_from = {}
                for color, letter in (('violet', 'V'), ('magenta', 'M'), ('orange', 'O')):
                    for pos in cfrom.get(f'{color}_positions', []):
                        colormap_from[tuple(pos)] = letter
                colormap_to = {}
                for color, letter in (('violet', 'V'), ('magenta', 'M'), ('orange', 'O')):
                    for pos in cto.get(f'{color}_positions', []):
                        colormap_to[tuple(pos)] = letter
                for pos, label_from in colormap_from.items():
                    label_to = colormap_to.get(pos)
                    if label_to is None:
                        continue
                    self.assertIn((label_from, label_to), expected,
                        f"BASES {teinte_from}->{teinte_to} niveau {niveau} case {pos} : "
                        f"{label_from}->{label_to} hors rotation M->O->V->M")
                checked += 1
        self.assertGreater(checked, 0, "aucune paire axe1 x niveau n'a pu etre testee")


if __name__ == '__main__':
    unittest.main(verbosity=2)
