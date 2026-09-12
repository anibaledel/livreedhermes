#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Régénération du mode vecteurs (tâche 7, format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Vérifie vectors/carter_v3.json dans les DEUX sens :
  1. Encodage bit-exact : regénérer tous les vecteurs (vectors_internal.
     generate_all(), déterministe) reproduit EXACTEMENT les mêmes
     grid_sha256 que ceux stockés sur disque.
  2. Décodage : grille régénérée + clé du vecteur → message attendu, via
     les fonctions de décodage de PRODUCTION (jamais une réimplémentation).

Le vecteur carter256-basic-01 embarque en plus grid_csv (la grille
complète) : un test dédié décode DIRECTEMENT depuis cette grille stockée,
sans rien régénérer — c'est le cas qui doit être suffisant pour quelqu'un
qui n'a que LH-5 et ce fichier (critère d'acceptation, tâche 7).
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import vectors_internal as VI
import carter as CT
import carter_random as CR
import stegano_classic as SC

VECTORS_PATH = os.path.join(VI.REPO_ROOT, 'vectors', 'carter_v3.json')

_DECODE_FN = {
    'carter256':    lambda g, key: CT.decode_carter(g, key, VI.load_referent_256_v3()),
    'carter360':    lambda g, key: CT.decode_carter_360(g, key, VI.load_referent_360_v3()),
    'cartermix':    lambda g, key: CT.decode_carter_mix(
                        g, key, VI.load_referent_256_v3(), VI.load_referent_360_v3()),
    'carterrandom': lambda g, key: CR.decode_carter_random(g, key, 90),
    'carter18':     lambda g, key: CR.decode_carter_18(g, key, 90),
    'carterhybrid': lambda g, key: CR.decode_carter_hybrid(g, key, 90),
}


class TestVectorsRegeneration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(VECTORS_PATH, encoding='utf-8') as f:
            cls.stored = json.load(f)
        # include_grid_csv_showcase=False : la bit-exactitude se vérifie sur
        # grid_sha256 (présent pour tous les vecteurs), pas besoin de
        # regénérer le CSV complet, plus lourd, pour ce test.
        cls.fresh, cls.fresh_grids = VI.generate_all(include_grid_csv_showcase=False)

    def test_vector_id_list_matches(self):
        stored_ids = [v['id'] for v in self.stored['vectors']]
        fresh_ids  = [v['id'] for v in self.fresh['vectors']]
        self.assertEqual(stored_ids, fresh_ids,
            "generate_all() ne produit plus la même liste de vecteurs que le "
            "fichier sur disque — régénérer vectors/carter_v3.json.")

    def test_encoding_bit_exact(self):
        """Sens 1/2 : ré-exécuter generate_all() reproduit EXACTEMENT les
        mêmes grilles (sha256) que celles déjà écrites sur disque —
        aucune source d'aléa résiduelle dans le mode vecteurs."""
        fresh_by_id = {v['id']: v for v in self.fresh['vectors']}
        for sv in self.stored['vectors']:
            with self.subTest(id=sv['id']):
                fv = fresh_by_id[sv['id']]
                if 'grid_sha256' in sv:
                    self.assertEqual(sv['grid_sha256'], fv['grid_sha256'])
                if 'grid0_sha256_encode0' in sv:
                    self.assertEqual(sv['grid0_sha256_encode0'], fv['grid0_sha256_encode0'])

    def test_decoding_from_regenerated_grid(self):
        """Sens 2/2 (Carter ×6) : grille régénérée + clé du vecteur →
        message attendu, via les fonctions decode_* de production."""
        for sv in self.stored['vectors']:
            inst = sv['instantiation']
            # Les vecteurs négatifs/de rejet (tamper=...) sont volontairement
            # NON décodables — voir test_negative_and_rejection_vectors.
            if inst not in _DECODE_FN or 'tamper' in sv:
                continue
            with self.subTest(id=sv['id']):
                key = bytes.fromhex(sv['inputs']['master_key_hex'])
                grid = self.fresh_grids[sv['id']]
                decoded = _DECODE_FN[inst](grid, key)
                self.assertEqual(decoded, sv['expected_decode'])

    def test_negative_and_rejection_vectors_still_reject(self):
        """Les vecteurs négatifs (tamper=...) doivent continuer à produire
        le MÊME résultat après régénération : rejet (même sous-chaîne
        d'erreur) pour cellule/commitment/mauvaise clé altérés, mais
        décodage RÉUSSI pour une cellule de bruit altérée (elle ne porte
        aucune information — voir gen_carter256_negative_vectors)."""
        for sv in self.stored['vectors']:
            if 'tamper' not in sv:
                continue
            with self.subTest(id=sv['id']):
                grid = self.fresh_grids[sv['id']]
                key = bytes.fromhex(sv['inputs']['master_key_hex'])
                if sv['tamper']['type'] == 'bruit_altere':
                    self.assertEqual(sv.get('expected_result'), 'decode_ok')
                    decoded = CT.decode_carter(grid, key, VI.load_referent_256_v3())
                    self.assertEqual(decoded, sv['expected_decode'])
                    continue
                self.assertEqual(sv.get('expected_result'), 'rejet')
                bad_key = (bytes.fromhex(sv['tamper']['wrong_key_hex'])
                           if sv['tamper']['type'] == 'mauvaise_cle'
                           else key)
                with self.assertRaises(ValueError) as ctx:
                    CT.decode_carter(grid, bad_key, VI.load_referent_256_v3())
                self.assertIn('commitment', str(ctx.exception).lower())

    def test_decoding_classic(self):
        """Sens 2/2 (stegano_classic) : mêmes clés B/2 explicites du
        vecteur (plus de Clé C depuis le câblage étape 6), grille
        régénérée → message attendu."""
        classic = next(v for v in self.stored['vectors'] if v['instantiation'] == 'classic')
        grid = self.fresh_grids[classic['id']]
        steg_key = bytes.fromhex(classic['inputs']['steg_key_hex'])
        key_b = classic['inputs']['key_b']
        key_2 = [{'form_id': d['form_id']} for d in classic['inputs']['key_2']]
        decoded = SC.decode(grid, steg_key, key_b, key_2,
                             VI.load_referent_256_v3(), classic['inputs']['grid_size'])
        self.assertEqual(decoded, classic['expected_decode'])

    def test_decoding_deniable(self):
        """Sens 2/2 (déni plausible) : dk_r/dk_d reconstruites depuis le
        vecteur, décodent bien real/duress sur la grille Encode ; dk_d0
        décode bien duress sur la grille Encode0."""
        import secu_box as SB
        den = next(v for v in self.stored['vectors'] if v['instantiation'] == 'deniable')
        grid  = self.fresh_grids[den['id'] + '-encode']
        grid0 = self.fresh_grids[den['id'] + '-encode0']

        rsk = bytes.fromhex(den['inputs']['rsk_hex'])
        dsk = bytes.fromhex(den['inputs']['dsk_hex'])
        Br_blocks = den['derivation']['Br']['blocks']
        Bd_blocks = den['derivation']['Bd']['blocks']
        # Cablage 2026-09-12 : form_id (block_list) est desormais DERIVE
        # de steg_key par decode_deniable() lui-meme -- plus de 'key_2' a
        # reconstruire ni a passer, dk_r/dk_d ne portent que steg_key+blocks.

        dk_r = {'steg_key': rsk, 'blocks': Br_blocks}
        dk_d = {'steg_key': dsk, 'blocks': Bd_blocks}

        self.assertEqual(SB.decode_deniable(grid, dk_r, den['inputs']['grid_size']),
                          den['expected_decode']['real_via_dk_r'])
        self.assertEqual(SB.decode_deniable(grid, dk_d, den['inputs']['grid_size']),
                          den['expected_decode']['duress_via_dk_d'])
        self.assertEqual(SB.decode_deniable(grid0, dk_d, den['inputs']['grid_size']),
                          den['expected_decode']['duress_via_dk_d0_encode0'])


class TestShowcaseVectorSelfContained(unittest.TestCase):
    """carter256-basic-01, carter360-basic-01 et deniable-basic-01
    embarquent grid_csv (la grille complète) : ces tests décodent
    DIRECTEMENT depuis cette grille stockée, SANS rien régénérer — le cas
    visé par le critère d'acceptation (suffisant pour quelqu'un qui n'a
    que LH-5 et ce fichier)."""

    @classmethod
    def setUpClass(cls):
        with open(VECTORS_PATH, encoding='utf-8') as f:
            cls.doc = json.load(f)
        cls.ref256_v3 = VI.load_referent_256_v3()
        cls.ref360_v3 = VI.load_referent_360_v3()

    def _csv_to_grid(self, csv_text):
        return [[int(x) for x in row.split(',')] for row in csv_text.strip().split('\n')]

    def test_decode_from_stored_grid_csv_only(self):
        v = next(x for x in self.doc['vectors'] if x['id'] == 'carter256-basic-01')
        self.assertIn('grid_csv', v, "carter256-basic-01 devrait embarquer grid_csv")
        grid = self._csv_to_grid(v['grid_csv'])
        key = bytes.fromhex(v['inputs']['master_key_hex'])
        decoded = CT.decode_carter(grid, key, self.ref256_v3)
        self.assertEqual(decoded, v['expected_decode'])

    def test_decode_carter360_from_stored_grid_csv_only(self):
        v = next(x for x in self.doc['vectors'] if x['id'] == 'carter360-basic-01')
        self.assertIn('grid_csv', v, "carter360-basic-01 devrait embarquer grid_csv")
        grid = self._csv_to_grid(v['grid_csv'])
        key = bytes.fromhex(v['inputs']['master_key_hex'])
        decoded = CT.decode_carter_360(grid, key, self.ref360_v3)
        self.assertEqual(decoded, v['expected_decode'])

    def test_decode_deniable_from_stored_grid_csv_only(self):
        import secu_box as SB
        v = next(x for x in self.doc['vectors'] if x['id'] == 'deniable-basic-01')
        self.assertIn('grid_csv', v, "deniable-basic-01 devrait embarquer grid_csv")
        self.assertIn('grid0_csv_encode0', v,
            "deniable-basic-01 devrait embarquer grid0_csv_encode0")
        grid  = self._csv_to_grid(v['grid_csv'])
        grid0 = self._csv_to_grid(v['grid0_csv_encode0'])

        rsk = bytes.fromhex(v['inputs']['rsk_hex'])
        dsk = bytes.fromhex(v['inputs']['dsk_hex'])
        Br_blocks = v['derivation']['Br']['blocks']
        Bd_blocks = v['derivation']['Bd']['blocks']
        dk_r = {'steg_key': rsk, 'blocks': Br_blocks}
        dk_d = {'steg_key': dsk, 'blocks': Bd_blocks}

        grid_size = v['inputs']['grid_size']
        self.assertEqual(SB.decode_deniable(grid, dk_r, grid_size),
                          v['expected_decode']['real_via_dk_r'])
        self.assertEqual(SB.decode_deniable(grid, dk_d, grid_size),
                          v['expected_decode']['duress_via_dk_d'])
        self.assertEqual(SB.decode_deniable(grid0, dk_d, grid_size),
                          v['expected_decode']['duress_via_dk_d0_encode0'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
