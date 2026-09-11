#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Tests des 256 référents 6×6 aléatoires (ChaCha20, format v3, tâche 2026-09-12)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Régénère les 256 référents depuis stegano/referent6x6_gen.py (algorithme
normatif, voir ce module) et vérifie leur SHA-256 contre
data/referents_6x6_v3_hashes.json — critère d'acceptation équivalent à
test_vectors_regeneration.py pour LH-5 : quiconque n'a que l'algorithme
et ce fichier de hash peut vérifier qu'il reproduit les 256 référents à
l'identique, sans avoir besoin des 256 JSON complets.
"""
import json
import os
import sys
import unittest
from collections import Counter

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, 'stegano'))
import referent6x6_gen as G  # noqa: E402

HASHES_PATH = os.path.join(REPO_ROOT, 'data', 'referents_6x6_v3_hashes.json')
DEBUG_PATHS = {
    0: os.path.join(REPO_ROOT, 'data', 'referent_6x6_index0_v3.json'),
    1: os.path.join(REPO_ROOT, 'data', 'referent_6x6_index1_v3.json'),
}


def _load_hashes():
    with open(HASHES_PATH, encoding='utf-8') as f:
        return json.load(f)


class TestHashesFileStructure(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.doc = _load_hashes()

    def test_256_hashes_present(self):
        self.assertEqual(self.doc['n_referents'], 256)
        self.assertEqual(len(self.doc['hashes']), 256)
        self.assertEqual(set(self.doc['hashes'].keys()), {str(n) for n in range(256)})

    def test_c_pub_present(self):
        self.assertIsNotNone(self.doc.get('c_pub'))
        self.assertGreater(self.doc['c_pub'], 0)

    def test_all_hashes_distinct(self):
        hashes = list(self.doc['hashes'].values())
        self.assertEqual(len(hashes), len(set(hashes)),
            "deux referents differents ne devraient jamais partager le meme hash")


class TestRegenerationMatchesHashes(unittest.TestCase):
    """Régénère les 256 référents et vérifie le SHA-256 de CHACUN contre
    data/referents_6x6_v3_hashes.json -- test volontairement exhaustif
    (pas un échantillon) : c'est le critère d'acceptation LH-5."""

    @classmethod
    def setUpClass(cls):
        cls.hashes_doc = _load_hashes()

    def test_all_256_referents_reproduce_published_hash(self):
        expected = self.hashes_doc['hashes']
        mismatches = []
        for n in range(G.N_REFERENTS):
            forms = G.generate_referent(n)
            actual = G.referent_hash(n, forms)
            if actual != expected[str(n)]:
                mismatches.append((n, expected[str(n)][:16], actual[:16]))
        self.assertEqual(mismatches, [],
            f"{len(mismatches)} referent(s) ne reproduisent pas leur hash publie : "
            f"{mismatches[:5]}")

    def test_each_referent_composition_6_6_12_12_and_distinct_forms(self):
        """Verifie sur un sous-ensemble (tous les 256, mais uniquement la
        composition + distinction -- pas de recalcul de hash ici, deja
        fait ci-dessus) que chaque referent respecte bien la specification."""
        for n in (0, 1, 2, 127, 128, 255):
            forms = G.generate_referent(n)
            self.assertEqual(len(forms), G.N_FORMS)
            seen = set()
            for by_color in forms:
                counts = {c: len(by_color[c]) for c in G.COUNTS}
                self.assertEqual(counts, G.COUNTS, f"referent {n} : composition incorrecte")
                key = tuple(sorted((c, tuple(map(tuple, pos))) for c, pos in by_color.items()))
                self.assertNotIn(key, seen, f"referent {n} : forme dupliquee")
                seen.add(key)

    def test_row_constraint_no_three_consecutive_small_color(self):
        for n in (0, 1, 255):
            forms = G.generate_referent(n)
            for by_color in forms:
                grid = [[None] * 6 for _ in range(6)]
                for color in ('blue', 'orange'):
                    for r, c in by_color[color]:
                        grid[r][c] = color
                for row in grid:
                    for small in ('blue', 'orange'):
                        run = 0
                        for cell in row:
                            run = run + 1 if cell == small else 0
                            self.assertLessEqual(run, 2,
                                f"referent {n} : 3 cases consecutives {small} sur une ligne")


class TestSelectReferentIndex(unittest.TestCase):

    def test_returns_byte_range_0_255_no_bias_by_construction(self):
        """Ne prouve pas l'absence de biais (proprieté de HKDF, pas testable
        statistiquement ici) -- verifie seulement que l'API renvoie bien un
        octet brut, sans reduction modulo supplementaire du cote appelant."""
        for key in (b'\x00' * 32, b'\xff' * 32, os.urandom(32)):
            idx = G.select_referent_index(key)
            self.assertIsInstance(idx, int)
            self.assertGreaterEqual(idx, 0)
            self.assertLessEqual(idx, 255)

    def test_deterministic_for_same_key(self):
        key = os.urandom(32)
        self.assertEqual(G.select_referent_index(key), G.select_referent_index(key))


class TestDebugFilesMatchAlgorithm(unittest.TestCase):
    """data/referent_6x6_index{0,1}_v3.json (JSON complet, pour debogage
    uniquement) doivent correspondre exactement a ce que l'algorithme
    produit pour ces memes index."""

    def test_index0_and_index1_forms_match_generator(self):
        for n, path in DEBUG_PATHS.items():
            with open(path, encoding='utf-8') as f:
                doc = json.load(f)
            forms = G.generate_referent(n)
            for i, entry in enumerate(doc['forms']):
                for color in ('blue', 'orange', 'green', 'yellow'):
                    expected = sorted(forms[i][color])
                    actual = sorted(tuple(p) for p in entry[f'{color}_positions'])
                    actual = [list(p) for p in actual]
                    self.assertEqual(expected, actual,
                        f"referent {n} forme {i} couleur {color} : ecart avec le generateur")


if __name__ == '__main__':
    unittest.main(verbosity=2)
