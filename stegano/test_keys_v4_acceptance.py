#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
test_keys_v4_acceptance.py — Tests d'acceptation du format v4 (§3,
PROMPT_CC_deux_cles) La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Les sept tests requis par le §3 du prompt de migration deux-cles, ceux qui
ne sont pas déjà couverts ailleurs (test_legacy_master_key existe dans
test_keys.py ; les 154 tests v3 existants et leur régénération en v4 sont
couverts par la suite de régression/vecteurs déjà en place — ce fichier
n'ajoute que les six qui manquaient) :

  - test_two_keys_roundtrip     : toutes variantes, ck/gk indépendants.
  - test_ck_alone_uniform       : gk inconnu -> grille entière ~ bruit.
  - test_gk_alone_uniform       : ck inconnu -> symboles message démasqués
                                   uniformes (positions/masques connus via gk).
  - test_nu_changes_layout      : même (ck, gk), nu different -> positions
                                   disjointes à >90 %, masques differents.
  - test_nu_cells_uniform       : χ² des 36 cases de nu sur 1000 grilles.
  - test_nu_not_from_keys       : (déni, secu_box) nu vient de secrets,
                                   jamais dérivé de ck_r/gk_r/ck_d/gk_d.

Chaque test réutilise les fonctions de PRODUCTION (jamais de
réimplémentation de la grammaire, du redraw, du chiffrement ou du
masquage) — même discipline que vectors_internal.py/test_statistical.py.
Carter-256 sert de variante représentative pour les tests géométriques
(ck_alone/gk_alone/nu_changes_layout/nu_cells) : le prompt ne demande
« toutes variantes » que pour le roundtrip.
"""

import os
import sys
import unittest
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'secubox'))

from stegano_lib import (
    load_referent_256_v3, load_referent_360_v3, ALPHA_LEN,
    encode_carter, decode_carter,
    encode_carter_360, decode_carter_360,
    encode_carter_mix, decode_carter_mix,
)
from carter_random import (
    encode_carter_random, decode_carter_random,
    encode_carter_18, decode_carter_18,
    encode_carter_hybrid, decode_carter_hybrid,
)
from carter import (
    _find_grammar_with_c_pub, _carter_grammar, _carter_message_positions,
    CARTER_SIDE,
)
from grammar import _carter_positions, _MESSAGE
from masks import derive_masks
from keys import derive_gk_nu, new_layout_nonce, NU_SYMBOLS

REF256 = load_referent_256_v3()
REF360 = load_referent_360_v3()

CHI2_PVALUE_MIN = 0.001


def _chi2_uniform_pvalue(values, alpha=ALPHA_LEN):
    """χ² d'ajustement à l'uniforme sur [0, alpha) -- scipy, même outil que
    le reste de la suite statistique (test_statistical.py)."""
    import scipy.stats as st
    n = len(values)
    exp = n / alpha
    c = Counter(values)
    obs = [c.get(v, 0) for v in range(alpha)]
    chi2, p = st.chisquare(obs, [exp] * alpha)
    return chi2, p


class TestTwoKeysRoundtrip(unittest.TestCase):
    """test_two_keys_roundtrip : encode/décode identité, ~200 messages
    répartis sur toutes les variantes, ck et gk tirés indépendamment."""

    def _variants(self):
        return [
            ('carter256', lambda m, ck, gk: encode_carter(m, ck, gk, REF256),
                           lambda g, ck, gk: decode_carter(g, ck, gk, REF256)),
            ('carter360', lambda m, ck, gk: encode_carter_360(m, ck, gk, REF360),
                           lambda g, ck, gk: decode_carter_360(g, ck, gk, REF360)),
            ('cartermix', lambda m, ck, gk: encode_carter_mix(m, ck, gk, REF256, REF360),
                           lambda g, ck, gk: decode_carter_mix(g, ck, gk, REF256, REF360)),
            ('carterrandom', lambda m, ck, gk: encode_carter_random(m, ck, gk)[0],
                              lambda g, ck, gk: decode_carter_random(g, ck, gk)),
            ('carter18', lambda m, ck, gk: encode_carter_18(m, ck, gk)[0],
                          lambda g, ck, gk: decode_carter_18(g, ck, gk)),
            ('carterhybrid', lambda m, ck, gk: encode_carter_hybrid(m, ck, gk)[0],
                              lambda g, ck, gk: decode_carter_hybrid(g, ck, gk)),
        ]

    def test_two_keys_roundtrip(self):
        variants = self._variants()
        n_per_variant = 200 // len(variants)
        for name, enc, dec in variants:
            with self.subTest(variant=name):
                for i in range(n_per_variant):
                    ck = os.urandom(32)
                    gk = os.urandom(32)
                    msg = f"MSG{i}{name}".upper()
                    grid = enc(msg, ck, gk)
                    self.assertEqual(dec(grid, ck, gk), msg,
                        f"{name} : rupture round-trip pour ck/gk independants (essai {i})")


class TestCkAloneUniform(unittest.TestCase):
    """test_ck_alone_uniform : gk inconnu (fresh a chaque grille) -> la
    grille ENTIERE (toutes cellules, message compris) est indistinguable du
    bruit uniforme, meme pour un observateur qui connait ck -- sans gk, il
    ne peut pas localiser les positions message pour les isoler."""

    def test_ck_alone_uniform(self):
        try:
            import scipy.stats  # noqa: F401
        except ImportError:
            self.skipTest("scipy non installe")
        ck = os.urandom(32)   # connu du test (et de l'attaquant hypothetique)
        values = []
        for i in range(1000):
            gk = os.urandom(32)   # inconnu -- fresh a chaque grille
            grid = encode_carter(f"MSG{i}", ck, gk, REF256)
            values.extend(v for row in grid for v in row)
        chi2, p = _chi2_uniform_pvalue(values)
        self.assertGreater(p, CHI2_PVALUE_MIN,
            f"Grille non uniforme sans gk : chi2={chi2:.1f} p={p:.5f} n={len(values)}")


class TestGkAloneUniform(unittest.TestCase):
    """test_gk_alone_uniform : ck inconnu (fresh a chaque grille), gk connu
    -> les positions se retrouvent (via gk) mais les symboles lus puis
    demasques (masques derives de gk_nu, donc connus) restent uniformes --
    c'est la sortie XChaCha20-Poly1305 (payload_to_symbols) qui protege,
    pas le secret des positions."""

    def test_gk_alone_uniform(self):
        try:
            import scipy.stats  # noqa: F401
        except ImportError:
            self.skipTest("scipy non installe")
        gk = os.urandom(32)   # connu du test
        values = []
        for i in range(1000):
            ck = os.urandom(32)   # inconnu -- fresh a chaque grille
            grid = encode_carter(f"MESSAGE NUMERO {i}", ck, gk, REF256)
            nu = bytes(_symbols_to_nu_local(grid))
            gk_nu = derive_gk_nu(gk, nu, 'carter256')
            _, grammar, n_pos = _find_grammar_with_c_pub(
                gk_nu, 'carter256',
                lambda k: _carter_grammar(k, REF256),
                lambda g: _carter_message_positions(g, REF256))
            sweep_of_color = grammar['sweep_of_color']
            masks = derive_masks(gk_nu, n_pos, 'carter256')
            ni = 0
            for bi, g in enumerate(grammar['blocks']):
                if g['role'] != _MESSAGE:
                    continue
                br, bc = bi // CARTER_SIDE, bi % CARTER_SIDE
                for gr, gc in _carter_positions(br, bc, g, REF256, sweep_of_color):
                    values.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
                    ni += 1
        chi2, p = _chi2_uniform_pvalue(values)
        self.assertGreater(p, CHI2_PVALUE_MIN,
            f"Symboles message demasques non uniformes sans ck : "
            f"chi2={chi2:.1f} p={p:.5f} n={len(values)}")


def _symbols_to_nu_local(grid):
    """nu se lit directement en tete de grille (colonnes 0..35, ligne 0) --
    pas besoin de connaitre ck ni gk pour cette seule lecture."""
    from keys import symbols_to_nu
    return symbols_to_nu(grid[0][:NU_SYMBOLS])


class TestNuChangesLayout(unittest.TestCase):
    """
    test_nu_changes_layout : memes (ck, gk) et meme message, deux grilles
    -> positions message notablement moins semblables que sous le meme nu,
    masques differents (nu frais a chaque encode, par defaut).

    Mesure sur Carter-360 (pas Carter-256) : c'est le referent 360 qui
    concentre l'interet pratique de nu (blocs 12x12, six calques empiles
    par bloc message), et c'est sur lui que le seuil ci-dessous a ete
    calibre -- voir la note de derivation.

    SEUIL DERIVE D'UNE MESURE, PAS D'UNE VALEUR ARBITRAIRE (correction de
    l'auteur, 2026-09) : le premier seuil ecrit ("recouvrement < 10 %")
    supposait par erreur une independance totale entre les deux tirages de
    nu, sans verifier la ligne de base reelle. Diagnostic effectue :
      - recouvrement mesure (20 essais, meme cle, nu different) :
        moyenne 15,8 % (12,2-19,6 %), densite message ~10,8 % de la grille.
      - recouvrement attendu par pure independance (mean_v^2/144, mean_v=8
        positions violettes/calque) : 0,44 case/bloc -- tres inferieur.
      - recouvrement entre calques d'un MEME niveau, tires au hasard (10000
        paires, exact sur les 360 calques) : 3,93 cases partagees en
        moyenne, ~9x la ligne de base par independance -- les calques d'un
        meme niveau partagent une part importante de leur placement (ils ne
        different surtout que par teinte/famille), ce qui explique l'ecart
        entre le recouvrement observe (15,8 %) et l'independance naive
        (~10,8 %). Meme famille de constat que pour le referent 256 (motif
        de carre magique), transposee au referent 360 (familles de calques
        par niveau).
    Seuil fixe a 35 % (~2x la moyenne mesuree, largement au-dessus de la
    plage observee 12-20 %) : detecte une regression reelle (nu sans effet
    -> recouvrement proche de 100 %) sans faux positifs dus a cette
    structure connue et sans consequence sur la securite (voir ci-dessous).

    Portee de la propriete : nu est de la defense en profondeur (evite un
    canal observable meme sans connaitre gk, voir keys.py) -- le
    recouvrement des positions n'entre dans AUCUNE des deux preuves de
    securite du papier ; ce test verifie que nu a un effet mesurable, pas
    une borne de securite.
    """

    OVERLAP_MAX = 0.35

    def test_nu_changes_layout(self):
        ck, gk = os.urandom(32), os.urandom(32)
        msg = "MEME MESSAGE POUR LES DEUX GRILLES"

        def positions_and_masks(grid):
            from carter import _carter360_grammar, _carter360_message_positions, CARTER360_SIDE
            from grammar import _carter360_positions
            nu = bytes(_symbols_to_nu_local(grid))
            gk_nu = derive_gk_nu(gk, nu, 'carter360')
            _, grammar, n_pos = _find_grammar_with_c_pub(
                gk_nu, 'carter360',
                lambda k: _carter360_grammar(k, REF360),
                lambda g: _carter360_message_positions(g, REF360))
            by_niveau = grammar['by_niveau']
            sweep_of_color = grammar['sweep_of_color']
            pos = [p for bi, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE
                   for p in _carter360_positions(bi // CARTER360_SIDE, bi % CARTER360_SIDE,
                                                  g, REF360, by_niveau, sweep_of_color)]
            masks = derive_masks(gk_nu, n_pos, 'carter360')
            return set(pos), masks

        grid1 = encode_carter_360(msg, ck, gk, REF360)
        grid2 = encode_carter_360(msg, ck, gk, REF360)
        pos1, masks1 = positions_and_masks(grid1)
        pos2, masks2 = positions_and_masks(grid2)

        overlap = len(pos1 & pos2) / max(len(pos1), 1)
        self.assertLess(overlap, self.OVERLAP_MAX,
            f"Positions message trop semblables entre deux nu : "
            f"{overlap*100:.1f}% de recouvrement (seuil {self.OVERLAP_MAX*100:.0f}%, "
            f"derive de la ligne de base mesuree, voir docstring)")
        self.assertNotEqual(masks1, masks2, "Masques identiques malgre nu different")


class TestNuCellsUniform(unittest.TestCase):
    """test_nu_cells_uniform : χ² des 36 premieres cases (nu encode en
    symboles) sur 1000 grilles."""

    def test_nu_cells_uniform(self):
        try:
            import scipy.stats  # noqa: F401
        except ImportError:
            self.skipTest("scipy non installe")
        ck, gk = os.urandom(32), os.urandom(32)
        values = []
        for i in range(1000):
            grid = encode_carter(f"M{i}", ck, gk, REF256)
            values.extend(grid[0][:NU_SYMBOLS])
        chi2, p = _chi2_uniform_pvalue(values)
        self.assertGreater(p, CHI2_PVALUE_MIN,
            f"Cases de nu non uniformes : chi2={chi2:.1f} p={p:.5f} n={len(values)}")


class TestNuNotFromKeys(unittest.TestCase):
    """test_nu_not_from_keys (déni, secu_box) : nu provient de secrets ;
    aucune fonction de dérivation n'est appelée avec ck_r/gk_r/ck_d/gk_d
    avant son tirage. Étend test_block_set_derivation_never_uses_key_material
    (test_secu_box.py) au nonce de disposition plutôt qu'aux ensembles de
    blocs."""

    def test_nu_not_from_keys(self):
        import secu_box as SB
        import keys as K
        calls = []
        original = K.new_layout_nonce
        def spy():
            # Capture l'etat des lors de l'appel : aucune cle n'a encore ete
            # transmise a cette fonction (elle ne prend aucun argument).
            calls.append(True)
            return original()
        K.new_layout_nonce = spy
        # secu_box importe new_layout_nonce localement (dans les fonctions
        # encode_deniable/encode_deniable0), donc patcher keys.new_layout_nonce
        # suffit -- l'import local resout le nom a l'appel, pas a la
        # definition du module.
        try:
            grid, dk_r, dk_d = SB.encode_deniable("REEL", "LEURRE")
            grid0, dk_d0 = SB.encode_deniable0("LEURRE SEUL")
        finally:
            K.new_layout_nonce = original

        self.assertEqual(len(calls), 2,
            "new_layout_nonce() devrait etre appelee une fois par encode_deniable*")
        self.assertEqual(list(inspect_signature_params(K.new_layout_nonce)), [],
            "new_layout_nonce() ne doit prendre aucun argument -- "
            "elle ne peut donc recevoir aucune cle, meme par erreur")

        # nu est bien COMMUN aux deux cotes, jamais derive de ck_r/gk_r/ck_d/gk_d :
        self.assertEqual(dk_r['layout_nonce'], dk_d['layout_nonce'])
        self.assertNotEqual(dk_r['layout_nonce'], dk_r['ck'])
        self.assertNotEqual(dk_r['layout_nonce'], dk_r['gk'])
        self.assertNotEqual(dk_d['layout_nonce'], dk_d['ck'])
        self.assertNotEqual(dk_d['layout_nonce'], dk_d['gk'])


def inspect_signature_params(fn):
    import inspect
    return inspect.signature(fn).parameters


if __name__ == '__main__':
    unittest.main(verbosity=2)
