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

import os, sys, secrets, unittest, inspect, random
from collections import Counter

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'stegano'))

from secu_box import (
    encode_deniable, encode_deniable0, decode_deniable,
    _fisher_yates, _split_br_bd, _deniable_positions,
)
from stegano_lib import ALPHA_LEN

MSG_REAL   = "MESSAGE SECRET ANIBAL"
MSG_DURESS = "NOTES PERSO TEXTILE"
GRID_SIZE  = 90
N_BLOCKS   = (GRID_SIZE // 6) ** 2   # 225


# ── Test de permutation — Bd vs condition sur m_r ─────────────────────────────
# chi2_contingency suppose un tirage multinomial AVEC remise ; chaque essai
# tire ici EXACTEMENT 112 blocs SANS remise parmi 225 (Fisher-Yates), une
# structure a variance reduite d'un facteur de correction de population finie
# (225-112)/(225-1) ~ 0.50 par rapport a l'hypothese implicite de
# chi2_contingency. Verifie experimentalement : cela biaisait p
# systematiquement pres de 1 au lieu d'etre uniforme sur [0,1] sous
# l'hypothese nulle (vraie ici par construction, Bd ne depend d'aucune cle ni
# de m_r). Le test de permutation calibre la meme statistique par
# re-echantillonnage des VRAIS tirages (les Bd effectivement obtenus),
# respectant donc automatiquement la structure sans remise, sans hypothese
# parametrique sur la variance.

def _bd_condition_stat(tables: list) -> float:
    """Statistique chi2-style (observe vs attendu pondere par condition) --
    seule sa CALIBRATION change (permutation ci-dessous), pas sa formule."""
    n_blocks = len(tables[0])
    pooled = [sum(t[b] for t in tables) for b in range(n_blocks)]
    total = sum(pooled)
    s = 0.0
    for t in tables:
        n_t = sum(t)
        for b in range(n_blocks):
            exp = pooled[b] * n_t / total
            if exp > 0:
                s += (t[b] - exp) ** 2 / exp
    return s

def _permutation_pvalue_bd_by_condition(trials: list, n_blocks: int, n_perm: int = 3000):
    """
    trials : liste de (condition_label, blocks) -- un par essai.
    Retourne (obs_stat, p) : p = fraction (+correction) des permutations
    d'etiquettes dont la statistique est >= la statistique observee.
    """
    rng = random.Random()
    labels = sorted(set(lab for lab, _ in trials))

    def tables_from(trials_):
        # Materialise en liste : trials_ est parcouru UNE FOIS PAR ETIQUETTE
        # ci-dessous -- un iterateur a usage unique (ex. zip(...) passe tel
        # quel) s'epuiserait des la premiere etiquette et laisserait les
        # suivantes a zero, faussant silencieusement chaque permutation.
        trials_ = list(trials_)
        out = []
        for label in labels:
            counts = [0] * n_blocks
            for lab, blocks in trials_:
                if lab == label:
                    for b in blocks:
                        counts[b] += 1
            out.append(counts)
        return out

    obs_stat = _bd_condition_stat(tables_from(trials))
    all_labels = [lab for lab, _ in trials]
    all_blocks = [b for _, b in trials]
    count_ge = 0
    for _ in range(n_perm):
        perm_labels = all_labels[:]
        rng.shuffle(perm_labels)
        perm_stat = _bd_condition_stat(tables_from(zip(perm_labels, all_blocks)))
        if perm_stat >= obs_stat:
            count_ge += 1
    p = (1 + count_ge) / (n_perm + 1)
    return obs_stat, p


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

    def test_message_case_preserved(self):
        """Format v3 (UTF-8 sans restriction d'alphabet) : la casse n'est
        plus normalisée à l'encodage — voir crypto_core._message_to_bytes."""
        grid, rk, dk = encode_deniable("Anibal Amiot", "Notes Perso")
        self.assertEqual(decode_deniable(grid, rk), "Anibal Amiot")
        self.assertEqual(decode_deniable(grid, dk), "Notes Perso")


class TestDeniableKeyProperties(unittest.TestCase):
    """rsk/dsk neufs, π indépendante des clés, partition stricte de tous les blocs."""

    def test_fresh_keys_each_call(self):
        _, rk1, dk1 = encode_deniable(MSG_REAL, MSG_DURESS)
        _, rk2, dk2 = encode_deniable(MSG_REAL, MSG_DURESS)
        self.assertNotEqual(rk1['steg_key'], rk2['steg_key'])
        self.assertNotEqual(dk1['steg_key'], dk2['steg_key'])
        self.assertNotEqual(rk1['steg_key'], dk1['steg_key'])

    def test_br_bd_disjoint_equal_size_one_leftover(self):
        """
        Br ∩ Bd = ∅, |Br| = |Bd| = ⌊B/2⌋. B=225 est impair : un bloc
        (π[112]) reste hors des deux ensembles, jamais écrit (voir
        _split_br_bd) — Br ∪ Bd ne couvre donc PAS tous les blocs, il en
        manque exactement un.
        """
        grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        br, bd = set(rk['blocks']), set(dk['blocks'])
        n_blocks = (90 // 6) ** 2   # 225
        self.assertTrue(br.isdisjoint(bd), "Br et Bd se chevauchent")
        self.assertEqual(len(br), n_blocks // 2)
        self.assertEqual(len(bd), n_blocks // 2)
        leftover = set(range(n_blocks)) - br - bd
        self.assertEqual(len(leftover), 1,
                         "Il ne reste pas exactement un bloc hors de Br et Bd")

    def test_encode0_leaves_br_and_leftover_untouched(self):
        """
        Encode0 n'appelle _place_deniable QUE sur Bd -- Br ET le bloc
        restant (B=225 impair) restent au bruit CSPRNG du remplissage
        initial, jamais écrits par aucune fonction.
        """
        import secu_box as SB
        calls = []
        original = SB._place_deniable
        def spy(grid, N, B, block_indices, message, sk):
            calls.append(list(block_indices))
            return original(grid, N, B, block_indices, message, sk)
        SB._place_deniable = spy
        try:
            grid, dk = encode_deniable0(MSG_DURESS)
        finally:
            SB._place_deniable = original
        self.assertEqual(len(calls), 1,
                         "_place_deniable doit être appelée exactement une fois (Bd seul)")
        self.assertEqual(set(calls[0]), set(dk['blocks']),
                         "_place_deniable a été appelée avec autre chose que Bd")

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
        forged = {'steg_key': dk['steg_key'], 'blocks': rk['blocks']}
        with self.assertRaises(ValueError):
            decode_deniable(grid, forged)


class TestDeniableCapacity(unittest.TestCase):
    """Message trop long pour Br/Bd (112 blocs × 36 positions chacun,
    mode crypto -- 6 était l'ancien schéma stégano, périmé depuis le
    câblage production étape 5, 2026-09-12)."""

    def test_message_too_long_raises(self):
        with self.assertRaises(ValueError):
            encode_deniable("A" * 5000, MSG_DURESS)
        with self.assertRaises(ValueError):
            encode_deniable(MSG_REAL, "A" * 5000)

    def test_capacity_exact_bound(self):
        """
        Vérifie la borne EXACTE (question de l'audit du 2026-09-12) :
        L = 112 blocs × 36 positions (mode crypto) = 4032 symboles,
        max_message_for(4032) = 2667 octets -- calculé par la fonction de
        PRODUCTION (crypto_core.max_message_for), jamais réimplémenté.
        Un message pile à cette limite passe, un octet de plus échoue --
        avant ce test, seul « 5000 caractères → erreur » était couvert,
        loin de la frontière réelle.
        """
        import crypto_core as C
        L = 112 * 36
        limit = C.max_message_for(L)
        self.assertEqual(limit, 2667)
        msg_ok = "A" * limit
        msg_too_long = "A" * (limit + 1)
        grid, rk, dk = encode_deniable(msg_ok, MSG_DURESS)
        self.assertEqual(decode_deniable(grid, rk), msg_ok)
        with self.assertRaises(ValueError):
            encode_deniable(msg_too_long, MSG_DURESS)


# ══════════════════════════════════════════════════════════════════════════════
# Classe — Tâche 6.3 (déni) : du point de vue du contraignant (dk_d seul)
#
# Invariant vérifié ici (formulation reprise telle quelle dans les
# commentaires de secu_box.py, destinée à LH-5) : les ENSEMBLES de blocs
# (Br, Bd, bloc orphelin) sont indépendants des clés ; les POSITIONS
# INTRA-BLOC sont dérivées de la clé du message concerné — c'est voulu,
# pas une fuite (voir _place_deniable/_deniable_positions).
# ══════════════════════════════════════════════════════════════════════════════
class TestDeniableStatistical(unittest.TestCase):
    """Encode vs Encode0 du point de vue du porteur de dk_d — χ², seuils p > 0.001."""

    def _outside_bd_values(self, grid, dk):
        """Toutes les valeurs de la grille SAUF les positions message de Bd —
        exactement ce que le porteur de dk_d peut isoler avec sa seule clé."""
        B = GRID_SIZE // 6
        bd_positions = set(_deniable_positions(GRID_SIZE, B, dk['blocks'],
                                                dk['steg_key']))
        return [grid[r][c] for r in range(GRID_SIZE) for c in range(GRID_SIZE)
                if (r, c) not in bd_positions]

    def test_cells_outside_bd_uniform_and_encode_vs_encode0(self):
        """
        6.3.1 : χ² des cellules hors Bd sous Encode et sous Encode0, plus un
        test à deux échantillons entre les deux modes sur ces cellules —
        le porteur de dk_d ne doit voir aucune différence entre "il y a un
        message réel dans Br" (Encode) et "il n'y en a pas" (Encode0).
        """
        try:
            import scipy.stats as st
        except ImportError:
            self.skipTest("scipy non installe")

        N_TRIALS = 15
        encode_vals, encode0_vals = [], []
        for _ in range(N_TRIALS):
            grid, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
            encode_vals.extend(self._outside_bd_values(grid, dk))
        for _ in range(N_TRIALS):
            grid, dk = encode_deniable0(MSG_DURESS)
            encode0_vals.extend(self._outside_bd_values(grid, dk))

        for label, vals in (("Encode", encode_vals), ("Encode0", encode0_vals)):
            n = len(vals)
            exp = n / ALPHA_LEN
            c = Counter(vals)
            obs = [c.get(v, 0) for v in range(ALPHA_LEN)]
            chi2, p = st.chisquare(obs, [exp] * ALPHA_LEN)
            with self.subTest(mode=label, check="uniforme"):
                self.assertGreater(p, 0.001,
                    f"{label} : cellules hors Bd non uniformes (n={n}) chi2={chi2:.1f} p={p:.5f}")

        # Test à deux échantillons : Encode vs Encode0, mêmes cellules (hors Bd)
        ce, ce0 = Counter(encode_vals), Counter(encode0_vals)
        table = [[ce.get(v, 0) for v in range(ALPHA_LEN)],
                 [ce0.get(v, 0) for v in range(ALPHA_LEN)]]
        chi2_2s, p_2s, dof, _ = st.chi2_contingency(table)
        self.assertGreater(p_2s, 0.001,
            f"Encode et Encode0 distinguables hors Bd : chi2={chi2_2s:.1f} p={p_2s:.5f} dof={dof}")
        print(f"  Hors Bd : Encode n={len(encode_vals)} / Encode0 n={len(encode0_vals)} "
              f"-- deux echantillons chi2={chi2_2s:.1f} p={p_2s:.4f}")

    def test_bd_distribution_independent_of_real_message(self):
        """
        6.3.2 (mode vecteurs, dsk injecté) : même dsk, deux encodages
        donnent des Bd différents ; la distribution de Bd (quels blocs sont
        choisis) ne dépend ni de la présence ni de la longueur de m_r.

        Calibration par test de PERMUTATION sur les étiquettes de condition
        (pas chi2_contingency — voir le commentaire de section en tête de
        fichier) : chaque essai tire exactement 112 blocs SANS remise parmi
        225 (Fisher-Yates), une structure que chi2_contingency modélise mal
        (elle suppose un tirage multinomial AVEC remise) — vérifié
        expérimentalement, cela biaisait p systématiquement près de 1 au
        lieu d'être uniforme sur [0,1] sous l'hypothèse nulle.
        """
        fixed_dsk = secrets.token_bytes(32)

        # même dsk, deux appels -> Bd différents
        _, dk_a = encode_deniable0("A", _dsk=fixed_dsk)
        _, dk_b = encode_deniable0("B", _dsk=fixed_dsk)
        self.assertEqual(dk_a['steg_key'], fixed_dsk)
        self.assertEqual(dk_b['steg_key'], fixed_dsk)
        self.assertNotEqual(set(dk_a['blocks']), set(dk_b['blocks']))

        N_TRIALS = 60
        conditions = {
            'no_real':    lambda: encode_deniable0(MSG_DURESS, _dsk=fixed_dsk)[1],
            'short_real': lambda: encode_deniable("A", MSG_DURESS, _dsk=fixed_dsk)[2],
            'long_real':  lambda: encode_deniable("A" * 100, MSG_DURESS, _dsk=fixed_dsk)[2],
        }
        trials = []
        for label, fn in conditions.items():
            for _ in range(N_TRIALS):
                trials.append((label, fn()['blocks']))

        obs_stat, p = _permutation_pvalue_bd_by_condition(trials, N_BLOCKS, n_perm=3000)
        self.assertGreater(p, 0.001,
            f"Distribution de Bd dépendante de la présence/longueur de m_r : "
            f"stat={obs_stat:.1f} p={p:.5f} (test de permutation, {N_TRIALS}/condition)")
        print(f"  Bd vs m_r (no/short/long, dsk fixe, {N_TRIALS}/condition, "
              f"permutation n=3000) : stat={obs_stat:.1f} p={p:.4f}")

    def test_block_set_derivation_never_uses_key_material(self):
        """
        6.3.3 : aucune fonction qui calcule les ENSEMBLES de blocs (Br, Bd,
        bloc orphelin) n'est appelée avec rsk, dsk ni une valeur qui en
        dérive. _fisher_yates(n) ne prend qu'un entier ; instrumenté pour
        confirmer qu'aucun appel réel ne lui passe autre chose.
        """
        self.assertEqual(list(inspect.signature(_fisher_yates).parameters), ['n'])
        self.assertEqual(list(inspect.signature(_split_br_bd).parameters), ['pi'])

        import secu_box as SB
        calls = []
        original = SB._fisher_yates
        def spy(n):
            calls.append(n)
            return original(n)
        SB._fisher_yates = spy
        try:
            encode_deniable(MSG_REAL, MSG_DURESS)
            encode_deniable0(MSG_DURESS)
        finally:
            SB._fisher_yates = original
        self.assertEqual(len(calls), 2)
        self.assertTrue(all(isinstance(n, int) for n in calls),
                        "_fisher_yates a reçu autre chose qu'un entier — fuite potentielle de clé")

    def test_form_id_derived_from_key_not_stored(self):
        """
        6.3.3 (suite), câblage 2026-09-12 : form_id N'EST PLUS stocké dans
        la clé (key_2 a disparu de dk_r/dk_d) -- dérivé de gk_local par
        _derive_deniable_form_ids(), comme les balayages et les masques.
        Corrige une divergence entre le docstring d'encode_deniable, qui
        affirmait déjà "dérivées de la clé du message concerné", et
        l'implémentation antérieure, qui tirait form_id par
        secrets.randbelow() et le stockait séparément.

        Vérifié : dk_r/dk_d ne portent plus 'key_2' ; les form_id
        redérivés depuis steg_key sont dans [0, N_FORMS) ; Bd sous Encode
        et sous Encode0 (même dsk, même liste de blocs) donnent les MÊMES
        form_id -- déterminisme, pas juste "même fonction appelée" comme
        avant (où seule la fonction était identique, le tirage restait
        aléatoire à chaque appel).
        """
        import referent6x6_gen as R6
        from secu_box import _derive_deniable_form_ids
        from stegano_lib import _carter_split
        _, rk, dk = encode_deniable(MSG_REAL, MSG_DURESS)
        _, dk0 = encode_deniable0(MSG_DURESS)

        for label, keys in (('Encode dk_r', rk), ('Encode dk_d', dk), ('Encode0 dk_d', dk0)):
            with self.subTest(source=label):
                self.assertNotIn('key_2', keys)
                _, gk_local = _carter_split(keys['steg_key'])
                form_ids = _derive_deniable_form_ids(gk_local, len(keys['blocks']))
                self.assertTrue(len(form_ids) > 0)
                for fid in form_ids:
                    self.assertTrue(0 <= fid < R6.N_FORMS)

        # Meme dsk (injecte) et memes blocs (meme pi) entre Encode et
        # Encode0 -- alors, et seulement alors, les form_id derives
        # doivent coincider (determinisme, pas juste "meme fonction").
        fixed_dsk = secrets.token_bytes(32)
        fixed_pi  = _fisher_yates(N_BLOCKS)
        _, _, dk_fixed  = encode_deniable(MSG_REAL, MSG_DURESS, _dsk=fixed_dsk, _pi=fixed_pi)
        _, dk0_fixed    = encode_deniable0(MSG_DURESS, _dsk=fixed_dsk, _pi=fixed_pi)
        self.assertEqual(dk_fixed['blocks'], dk0_fixed['blocks'])
        _, gk_d = _carter_split(fixed_dsk)
        self.assertEqual(
            _derive_deniable_form_ids(gk_d, len(dk_fixed['blocks'])),
            _derive_deniable_form_ids(gk_d, len(dk0_fixed['blocks'])),
            "Bd sous Encode et sous Encode0 devrait donner les mêmes form_id "
            "(même dsk, même liste de blocs, dérivation déterministe)")


if __name__ == '__main__':
    print("=" * 64)
    print("VECTEURS DE RÉGRESSION — secu_box.py (déni plausible)")
    print("=" * 64)
    unittest.main(verbosity=2)
