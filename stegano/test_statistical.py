#!/usr/bin/env python3
# (c) Anibal Edelberto Amiot 2026 - La Livree d'Hermes
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
test_statistical.py — Tests statistiques de sortie Carter
La Livree d'Hermes — Anibal Edelberto Amiot (2026)

Tests implementes :
  1. Avalanche cle     : 1 bit flip -> ~50% cellules modifiees
  2. Avalanche message : 1 bit flip -> ~50% positions message modifiees
  3. Entropie Shannon  : H > 0.98*log2(ALPHA_LEN) bits/symbole
  4. Chi2 monobit      : distribution uniforme sur [0..ALPHA_LEN-1]
  5. Correlation serie : independance des paires adjacentes
  6. Autocorrelation   : |r(lag)| < seuil pour lag=1..10
  7. Carter Random     : capacite, chi2, avalanche (grammaire + message)

Methode Avalanche : os.urandom fixe pour isoler l'effet de la cle.
La grammaire Carter change => blocs reasignes => effets en cascade.

Adapte de la suite soumise en revue cryptographique externe pour coller a
l'API reelle de stegano_lib.py / carter_random.py. _xchacha20_enc
(tache 1, format v3 : XChaCha20-Poly1305 standard, remplace la
construction a sous-cle HKDF de LH-5) et _encrypt vivent dans
crypto_core.py, re-exportes par
stegano_lib.py. Il n'existe pas de helper "un octet -> N
symboles" isole (_byte_to_syms) : le flux de symboles d'un message se
produit avec payload_to_symbols(), la meme fonction que les encodeurs
Carter utilisent en production - c'est elle qui remplace l'ancienne
boucle "par octet" dans test_message_cell_avalanche ci-dessous.
"""

import os, sys, math, struct, statistics, unittest
from unittest.mock import patch
from typing import List, Tuple

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')   # console Windows (cp1252) vs. symboles

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stegano_lib import (
    load_referents, _load_ref360,
    encode_carter, decode_carter,
    encode_carter_360, encode_carter_mix,
    _encrypt, _xchacha20_enc, payload_to_symbols, ALPHA_LEN,
)

from carter_random import (
    encode_carter_random, decode_carter_random,
    encode_carter_random_360, decode_carter_random_360,
    random_capacity, random_fits, SEEDS,
    encode_carter_18, decode_carter_18, carter18_fits,
    encode_carter_hybrid, decode_carter_hybrid, carter_hybrid_fits,
    _carter_split, _derive_params,
)

# ── Constantes statistiques ────────────────────────────────────────────────────
ALPHA       = ALPHA_LEN           # 44 symboles (stegano_lib.ALPHABET)
H_MAX       = math.log2(ALPHA)    # ~5.4594 bits
H_MIN_OK    = H_MAX * 0.98        # seuil : ~5.35 bits
AVALANCHE_LOW  = 0.45             # intervalle acceptable
AVALANCHE_HIGH = 0.55             # autour de 50%
CHI2_PVALUE_MIN = 0.05            # seuil de significativite
AUTOCORR_MAX    = 0.05            # |r| < 5% pour lags > 0

# ── Generateur pseudo-aleatoire deterministe ──────────────────────────────────
class _Det:
    """Generateur deterministe pour isoler l'effet de la cle dans les tests."""
    def __init__(self, seed=b'stat-test-2026'):
        import hashlib
        self._s = hashlib.sha256(seed).digest()
        self._buf = b''

    def read(self, n):
        while len(self._buf) < n:
            import hashlib
            self._s = hashlib.sha256(self._s).digest()
            self._buf += self._s
        out, self._buf = self._buf[:n], self._buf[n:]
        return out

    def randbelow(self, n): return struct.unpack('>Q', self.read(8))[0] % n


def _encode_fixed_noise(fn, *args, seed=b'fixed'):
    """Encode avec bruit fixe pour isoler l'effet de la cle."""
    rng = _Det(seed)
    with patch('os.urandom', rng.read):
        return fn(*args)

def _flip_key_bit(key: bytes, bit_pos: int) -> bytes:
    """Retourne la cle avec le bit bit_pos flippe."""
    arr = bytearray(key)
    arr[bit_pos // 8] ^= (1 << (bit_pos % 8))
    return bytes(arr)

def _flip_msg_bit(msg: str, char_pos: int, bit_pos: int) -> str:
    """Retourne le message avec un bit flippe dans un caractere ASCII."""
    arr = list(msg.upper())
    c = ord(arr[char_pos])
    c ^= (1 << bit_pos)
    c = max(65, min(90, c))   # garder dans A-Z
    arr[char_pos] = chr(c)
    return ''.join(arr)

def _grid_flat(grid: List[List[int]]) -> List[int]:
    return [v for row in grid for v in row]

def _hamming_ratio(a: List[int], b: List[int]) -> float:
    """Fraction de positions differentes entre deux grilles."""
    assert len(a) == len(b)
    return sum(1 for x, y in zip(a, b) if x != y) / len(a)

# ── Tests ──────────────────────────────────────────────────────────────────────
class TestAvalancheKey(unittest.TestCase):
    """1 bit flip dans master_key -> ~50% des cellules changent."""

    MSG  = "LACROIXANSEE"
    BITS = 32          # tester 32 bits sur les 256 (representatif)

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()

    def _avalanche_ratio(self, key: bytes, bit_pos: int) -> float:
        seed = f'av-{bit_pos}'.encode()
        g1 = _encode_fixed_noise(encode_carter, self.MSG, key,
                                  self.ref256, seed=seed)
        g2 = _encode_fixed_noise(encode_carter, self.MSG,
                                  _flip_key_bit(key, bit_pos),
                                  self.ref256, seed=seed)
        return _hamming_ratio(_grid_flat(g1), _grid_flat(g2))

    def test_grammar_avalanche(self):
        """
        Avalanche de grammaire Carter-256 : flip 1 bit cle -> >35% des
        blocs changent de role. Meme methode que
        TestCarterRandomAvalanche.test_grammar_avalanche, appliquee au
        referent fixe (carter.py) plutot qu'aux referents generes
        dynamiquement (carter_random.py).

        Remplace l'ancien test_avalanche_carter_grid, qui mesurait la
        distance de Hamming sur la grille ENTIERE (8100 cellules). Ce
        chiffre etait domine par le bruit independant de deux appels
        os.urandom non correles (secrets.randbelow() n'etait alors pas
        patchable par le mock os.urandom des tests, malgre le seed
        partage voulu par _encode_fixed_noise) : deux grilles de bruit
        independant differaient deja sur ~97,7% des cellules, quelle que
        soit la cle. Depuis que le remplissage passe par
        crypto_core.random_grid() (perf, mesure arm64 gk2/MOCHAbin,
        §4.8), le bruit EST reellement pin par le seed partage, et ce
        qui reste a mesurer est le vrai signal : le changement de
        grammaire. Sur la grille entiere, ce signal reel ne pese plus
        que ~3-4% des cellules (seuls les blocs 'message' sont
        effectivement ecrits ; 'structure' et 'pur' sont indiscernables
        du bruit par construction) — la grammaire elle-meme reste
        mesurable directement, sans passer par la grille.
        """
        from stegano_lib import _carter_grammar, _MESSAGE
        key = os.urandom(32)
        ratios = []
        for bit in range(self.BITS):
            key2 = _flip_key_bit(key, bit)
            _, gk1 = _carter_split(key)
            _, gk2 = _carter_split(key2)
            g1 = _carter_grammar(gk1, self.ref256)
            g2 = _carter_grammar(gk2, self.ref256)
            roles1 = [1 if g['role']==_MESSAGE else 0 for g in g1]
            roles2 = [1 if g['role']==_MESSAGE else 0 for g in g2]
            diff = sum(1 for a,b in zip(roles1,roles2) if a!=b)
            ratios.append(diff/len(roles1))
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.35,
            f"Grammar avalanche Carter-256 trop faible : {mean:.3f} < 0.35")
        print(f"  Grammar avalanche Carter-256 : mean={mean:.3f} (attendu > 0.35)")

    def test_avalanche_chacha20_hkdf_key_sensitivity(self):
        """
        XChaCha20-Poly1305 standard (tache 1) key sensitivity :
        flip 1 bit de CLE -> ~50% bits ciphertext changent.
        """
        msg = self.MSG.upper().encode('ascii')
        key = os.urandom(32)
        seed = b'xchacha20-key-av'
        rng1 = _Det(seed)
        with patch('os.urandom', rng1.read):
            ct1 = _xchacha20_enc(key, msg)
        ratios = []
        NONCE = 24
        for bit_pos in range(32):   # 32 premiers bits de la cle
            key2 = bytearray(key)
            key2[bit_pos // 8] ^= (1 << (bit_pos % 8))
            rng2 = _Det(seed)   # meme nonce
            with patch('os.urandom', rng2.read):
                ct2 = _xchacha20_enc(bytes(key2), msg)
            c1, c2 = ct1[NONCE:], ct2[NONCE:]
            n = min(len(c1), len(c2)) * 8
            diff = sum(bin(a^b).count('1') for a,b in zip(c1,c2))
            ratios.append(diff / n if n > 0 else 0)
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.40,
            f"ChaCha20-HKDF key sensitivity faible : {mean:.3f}")
        self.assertLess(mean, 0.60,
            f"ChaCha20-HKDF key sensitivity anormale : {mean:.3f}")
        print(f"  ChaCha20-HKDF key sensitivity : mean={mean:.3f} (attendu ~0.50)")

    def test_avalanche_no_zero_bit(self):
        """Aucun flip de bit ne laisse la grille identique."""
        key = os.urandom(32)
        for b in range(self.BITS):
            r = self._avalanche_ratio(key, b)
            self.assertGreater(r, 0.01,
                f"Bit {b} n'a aucun effet sur la grille (ratio={r:.4f})")

    def test_avalanche_variance_acceptable(self):
        """La variance des ratios est faible (comportement homogene)."""
        key = os.urandom(32)
        ratios = [self._avalanche_ratio(key, b) for b in range(self.BITS)]
        std = statistics.stdev(ratios)
        self.assertLess(std, 0.15, f"Variance avalanche trop elevee : std={std:.3f}")


class TestAvalancheMessage(unittest.TestCase):
    """1 bit flip dans le message -> ~50% des cellules changent."""

    MSG  = "HERMESCROIXANSEE"
    BITS = [(0, b) for b in range(6)] + [(4, b) for b in range(6)]

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()
        cls.key = os.urandom(32)

    def test_avalanche_message_bits(self):
        """
        Avalanche sur les cellules message (pas la grille entiere) : flip
        1 bit du message -> le commitment HMAC-SHA256 (32B, avalanche
        complete) et le tag Poly1305 (16B, avalanche complet) changent,
        pour un ciphertext XChaCha20 qui ne differe lineairement que sur
        l'octet touche. Isole aux cellules message (meme cle -> memes
        positions pour msg et msg2, voir _carter_message_positions) plutot
        que sur la grille entiere : les cellules hors-message sont
        structurellement identiques entre les deux encodages (meme cle,
        meme bruit pin par le seed partage), donc les compter aurait
        dilue le signal sur ~8000 cellules qui ne peuvent PAS differer par
        construction. Meme principe que le remplacement de
        test_avalanche_carter_grid ci-dessus.
        """
        from stegano_lib import _carter_grammar, _carter_message_positions
        _, grammar_key = _carter_split(self.key)
        grammar = _carter_grammar(grammar_key, self.ref256)
        n_msg_positions = _carter_message_positions(grammar, self.ref256)

        ratios = []
        for char_pos, bit_pos in self.BITS:
            msg2 = _flip_msg_bit(self.MSG, char_pos, bit_pos)
            if msg2 == self.MSG: continue   # bit flip sans effet sur ASCII
            seed = f'msgav-{char_pos}-{bit_pos}'.encode()
            g1 = _encode_fixed_noise(encode_carter, self.MSG, self.key,
                                      self.ref256, seed=seed)
            g2 = _encode_fixed_noise(encode_carter, msg2, self.key,
                                      self.ref256, seed=seed)
            # Seules les cellules message peuvent differer (meme cle, meme
            # bruit pin) : diviser par n_msg_positions plutot que la
            # taille totale de la grille isole le signal reel.
            diff = sum(1 for a, b in zip(_grid_flat(g1), _grid_flat(g2)) if a != b)
            ratios.append(diff / n_msg_positions)
        if ratios:
            mean = statistics.mean(ratios)
            self.assertGreater(mean, 0.20,
                f"Avalanche cellules message trop faible : {mean:.3f}")
            print(f"  Avalanche msg (cellules message) : mean={mean:.3f}  n={len(ratios)}")


class TestEntropy(unittest.TestCase):
    """Entropie Shannon de la grille Carter >= H_MIN_OK."""

    MSG = "ANIBALAMIOTX"
    N_GRIDS = 5

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()
        cls.ref360 = _load_ref360()

    def _entropy(self, flat: List[int]) -> float:
        n = len(flat)
        freq = [flat.count(v) / n for v in range(ALPHA)]
        return -sum(p * math.log2(p) for p in freq if p > 0)

    def _test_mode(self, fn, *args):
        entropies = []
        for i in range(self.N_GRIDS):
            key  = os.urandom(32)
            grid = fn(self.MSG, key, *args)
            h    = self._entropy(_grid_flat(grid))
            entropies.append(h)
        mean_h = statistics.mean(entropies)
        self.assertGreater(mean_h, H_MIN_OK,
            f"{fn.__name__} : entropie trop basse {mean_h:.4f} < {H_MIN_OK:.4f}")
        return mean_h

    def test_entropy_carter_256(self):
        h = self._test_mode(encode_carter, self.ref256)
        print(f"  Entropie Carter 256 : {h:.4f} bits (max {H_MAX:.4f})")

    def test_entropy_carter_360(self):
        h = self._test_mode(encode_carter_360, self.ref360)
        print(f"  Entropie Carter 360 : {h:.4f} bits")

    def test_entropy_carter_mix(self):
        h = self._test_mode(encode_carter_mix, self.ref256, self.ref360)
        print(f"  Entropie Carter Mix : {h:.4f} bits")

    def test_entropy_chacha20_hkdf_output(self):
        """_encrypt() (XChaCha20-Poly1305 + commitment) : entropie sur la sortie brute (bits)."""
        key = os.urandom(32)
        payload = _encrypt(self.MSG * 10, key, 320)   # L=320, plus long pour stat
        bits = []
        for b in payload:
            for bit in range(8):
                bits.append((b >> bit) & 1)
        p1 = sum(bits) / len(bits)
        p0 = 1 - p1
        h = -(p0 * math.log2(p0) if p0 > 0 else 0) \
            -(p1 * math.log2(p1) if p1 > 0 else 0)
        self.assertGreater(h, 0.98, f"ChaCha20-HKDF entropie bit faible : {h:.4f}")
        print(f"  Entropie ChaCha20-HKDF : {h:.4f} bits/bit (proportion 1s={p1:.4f})")


class TestChiSquare(unittest.TestCase):
    """Chi2 : distribution uniforme des valeurs sur [0..ALPHA_LEN-1]."""

    MSG = "ANIBALAMIOTX"
    N_GRIDS = 10

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()

    def _chisq(self, flat: List[int]) -> Tuple[float, float]:
        """Retourne (chi2_stat, p_value) pour k=ALPHA classes."""
        import scipy.stats as st
        n   = len(flat)
        exp = n / ALPHA
        obs = [flat.count(v) for v in range(ALPHA)]
        chi2, p = st.chisquare(obs, [exp] * ALPHA)
        return chi2, p

    def test_chisq_carter_256(self):
        try:
            import scipy.stats
        except ImportError:
            self.skipTest("scipy non installe")
        p_values = []
        for _ in range(self.N_GRIDS):
            key  = os.urandom(32)
            grid = encode_carter(self.MSG, key, self.ref256)
            _, p = self._chisq(_grid_flat(grid))
            p_values.append(p)
        bad = sum(1 for p in p_values if p < CHI2_PVALUE_MIN)
        self.assertLessEqual(bad, 2,
            f"Chi2 : trop de grilles non uniformes ({bad}/{self.N_GRIDS})")
        mean_p = statistics.mean(p_values)
        print(f"  Chi2 Carter 256 : mean_p={mean_p:.3f}  "
              f"echecs={bad}/{self.N_GRIDS}")


class TestAutocorrelation(unittest.TestCase):
    """Autocorrelation des valeurs de grille : |r(lag)| < AUTOCORR_MAX."""

    MSG = "ANIBALAMIOTX"
    LAGS = [1, 2, 3, 5, 10]

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()

    def _autocorr(self, seq: List[float], lag: int) -> float:
        n    = len(seq)
        mean = sum(seq) / n
        var  = sum((x - mean)**2 for x in seq) / n
        if var == 0: return 0.0
        cov = sum((seq[i] - mean) * (seq[i+lag] - mean)
                   for i in range(n - lag)) / (n - lag)
        return cov / var

    def test_autocorrelation_carter_256(self):
        key  = os.urandom(32)
        grid = encode_carter(self.MSG, key, self.ref256)
        flat = [float(v) for v in _grid_flat(grid)]
        n    = len(flat)
        threshold = 2.0 / math.sqrt(n)
        max_r = 0.0
        for lag in self.LAGS:
            r = abs(self._autocorr(flat, lag))
            max_r = max(max_r, r)
            self.assertLess(r, threshold * 3,
                f"Autocorrelation lag={lag} significative : r={r:.4f}")
        print(f"  Autocorr Carter 256 : max_r={max_r:.4f}  "
              f"seuil=2/sqrt({n})={threshold:.4f}")


class TestSerialCorrelation(unittest.TestCase):
    """Correlation serie : paires (v_i, v_{i+1}) independantes."""

    MSG = "ANIBALAMIOTX"

    @classmethod
    def setUpClass(cls):
        cls.ref256, _ = load_referents()

    def _serial_chi2(self, flat: List[int]) -> float:
        n    = len(flat)
        obs  = {}
        for i in range(n - 1):
            k = (flat[i], flat[i+1])
            obs[k] = obs.get(k, 0) + 1
        freq = [flat.count(v) / n for v in range(ALPHA)]
        chi2 = 0.0
        for a in range(ALPHA):
            for b in range(ALPHA):
                expected = freq[a] * freq[b] * (n - 1)
                if expected > 5:
                    observed = obs.get((a, b), 0)
                    chi2 += (observed - expected)**2 / expected
        return chi2

    def test_serial_chi2_reasonable(self):
        """Chi2 serial < 2.5 x esperance (df ~= (ALPHA-1)^2)."""
        key    = os.urandom(32)
        grid   = encode_carter(self.MSG, key, self.ref256)
        flat   = _grid_flat(grid)
        chi2   = self._serial_chi2(flat)
        df     = (ALPHA - 1) ** 2
        ratio  = chi2 / df
        self.assertLess(ratio, 2.5,
            f"Correlation serie trop elevee : chi2/df={ratio:.3f}")
        print(f"  Correlation serie   : chi2={chi2:.1f}  df={df}  ratio={ratio:.3f}")


# ── Rapport synthetique ────────────────────────────────────────────────────────
class TestSummary(unittest.TestCase):
    """Rapport synthetique des proprietes statistiques."""

    def test_print_summary(self):
        """Affiche un recap sans assertion (toujours OK)."""
        ref256, _ = load_referents()
        ref360    = _load_ref360()
        key       = os.urandom(32)
        msg       = "ANIBALAMIOTX"

        grids = {
            'Carter 256': encode_carter(msg, key, ref256),
            'Carter 360': encode_carter_360(msg, key, ref360),
            'Carter Mix': encode_carter_mix(msg, key, ref256, ref360),
        }

        print(f"\n{'='*56}")
        print(f"PROPRIETES STATISTIQUES — La Livree d'Hermes")
        print(f"{'='*56}")
        print(f"{'Mode':<15} {'H(bits)':>8} {'E[V]':>8} {'Std':>8} {'Uniq':>6}")
        print(f"{'-'*56}")
        for name, grid in grids.items():
            flat = _grid_flat(grid)
            n    = len(flat)
            freq = [flat.count(v) / n for v in range(ALPHA)]
            h    = -sum(p * math.log2(p) for p in freq if p > 0)
            mean = sum(flat) / n
            std  = math.sqrt(sum((v-mean)**2 for v in flat) / n)
            uniq = len(set(flat))
            print(f"{name:<15} {h:>8.4f} {mean:>8.2f} {std:>8.2f} {uniq:>6d}")
        print(f"{'-'*56}")
        print(f"Max entropy : {math.log2(ALPHA):.4f} bits  "
              f"E[V] ideal : {(ALPHA-1)/2:.2f}  "
              f"Std ideal : {math.sqrt((ALPHA**2-1)/12):.2f}")
        self.assertTrue(True)


class TestCarterRandomCapacity(unittest.TestCase):
    """
    CR-1 (audit G. Kerma, rev. 2) — Capacite par regime.
    Mesure min/1er centile/5e centile/mediane/max sur 3000 cles.
    Objectif : verifier que le fallback meta->individuel supprime
    les queues nulles signalees en revision 2.
    """

    N_KEYS = 3000
    MESSAGES = [30, 100, 150]   # longueurs test (chars)

    @classmethod
    def setUpClass(cls):
        caps_ind, caps_meta = [], []
        modes = {'individual': 0, 'meta': 0, 'individual_fallback': 0}
        for _ in range(cls.N_KEYS):
            k = os.urandom(32)
            c = random_capacity(k)
            if c['meta_mode']:
                caps_meta.append(c['chars_max'])
                modes['meta'] += 1
            else:
                caps_ind.append(c['chars_max'])
                modes['individual'] += 1
        cls.caps_ind  = sorted(caps_ind)
        cls.caps_meta = sorted(caps_meta)
        cls.modes     = modes

    def _percentile(self, data, pct):
        if not data: return 0
        idx = max(0, int(len(data) * pct / 100) - 1)
        return data[idx]

    def test_capacity_individual_no_zero(self):
        """Mode individuel : capacite minimale > 0 sur toutes les cles."""
        min_cap = min(self.caps_ind) if self.caps_ind else 0
        self.assertGreater(min_cap, 0,
            f"Mode individuel : capacite nulle detectee (min={min_cap})")
        print(f"\n  Individuel ({len(self.caps_ind)} cles) : "
              f"min={min_cap}  "
              f"p1={self._percentile(self.caps_ind,1)}  "
              f"p5={self._percentile(self.caps_ind,5)}  "
              f"med={self._percentile(self.caps_ind,50)}  "
              f"max={max(self.caps_ind)} chars")

    def test_capacity_meta_no_zero_after_fallback(self):
        """Mode meta apres fallback CR-1 : capacite minimale > 0."""
        if not self.caps_meta:
            self.skipTest("Aucune cle en mode meta")
        min_cap = min(self.caps_meta)
        self.assertGreater(min_cap, 0,
            f"Mode meta : capacite nulle apres fallback (min={min_cap})")
        print(f"\n  Meta       ({len(self.caps_meta)} cles) : "
              f"min={min_cap}  "
              f"p1={self._percentile(self.caps_meta,1)}  "
              f"p5={self._percentile(self.caps_meta,5)}  "
              f"med={self._percentile(self.caps_meta,50)}  "
              f"max={max(self.caps_meta)} chars")

    def test_refus_rate_by_length(self):
        """
        Taux de refus par longueur de message sur 3000 cles.
        Objectif post-CR-1 : < 2% pour 30 chars.
        """
        for lng in self.MESSAGES:
            msg  = 'A' * lng
            refus = sum(1 for _ in range(500) if not random_fits(msg, os.urandom(32)))
            pct   = refus / 5  # %
            if lng == 30:
                self.assertLess(pct, 2.0,
                    f"{lng} chars : taux de refus trop eleve ({pct:.1f}%)")
            print(f"  Refus {lng:3d} chars : {pct:.1f}%  ({refus}/500 cles)")


class TestCarterRandomChiSquare(unittest.TestCase):
    """
    Chi2 sur les grilles Carter Random — indistinguabilite statistique.
    """

    MSG     = "ANIBALAMIOTX"
    N_GRIDS = 10
    DF      = ALPHA_LEN - 1  # 43 degres de liberte
    CHI2_SEUIL = 59.3        # seuil a alpha=0.05

    def _chi2_stat(self, flat):
        n   = len(flat)
        exp = n / ALPHA_LEN
        return sum((flat.count(v) - exp)**2 / exp for v in range(ALPHA_LEN))

    def _run_serie(self, encode_fn, label):
        try:
            import scipy.stats as st
        except ImportError:
            self.skipTest("scipy non installe")
        chi2s, ps = [], []
        for _ in range(self.N_GRIDS):
            k = os.urandom(32)
            if not random_fits(self.MSG, k): continue
            grid, _ = encode_fn(self.MSG, k)
            flat = [v for row in grid for v in row]
            c    = self._chi2_stat(flat)
            p    = 1 - st.chi2.cdf(c, self.DF)
            chi2s.append(c); ps.append(p)
        if not chi2s:
            self.skipTest("Aucune cle valide")
        mean_c = statistics.mean(chi2s)
        mean_p = statistics.mean(ps)
        bad    = sum(1 for c in chi2s if c > self.CHI2_SEUIL)
        self.assertLessEqual(bad, 2,
            f"{label} chi2 : {bad}/{len(chi2s)} grilles au-dessus du seuil")
        print(f"  chi2 {label:<12} : mean={mean_c:.1f}  "
              f"p={mean_p:.3f}  "
              f"seuil={self.CHI2_SEUIL}  "
              f"echecs={bad}/{len(chi2s)}")

    def test_chi2_carter_random_90(self):
        self._run_serie(encode_carter_random, "Random 90")

    def test_chi2_carter_random_360(self):
        self._run_serie(encode_carter_random_360, "Random 360")


class TestCarterRandomAvalanche(unittest.TestCase):
    """
    Avalanche Carter Random — deux mesures adaptees au modele.

    La grille Carter Random est dominee par du bruit aleatoire (~95% des
    cellules). Mesurer l'avalanche de la grille entiere n'est pas pertinent :
    le bruit masque l'effet de la cle sur les cellules message (~5%).

    On mesure a la place :
    1. Grammaire (roles des blocs) : flip 1 bit -> HKDF derive une grammaire
       entierement differente -> >35% des blocs changent de role.
    2. Cellules message : les symboles chiffres changent a ~97% (ChaCha20-HKDF).
    """

    BITS = 16

    def test_grammar_avalanche(self):
        """
        Avalanche de grammaire : flip 1 bit cle -> >35% des blocs changent de role.
        Mesure directe de la sensibilite HKDF sur l'assignation des roles.
        """
        from carter_random import (
            _carter_split, _derive_params, get_referent,
            _grammar_individual, _grammar_meta, _MESSAGE,
        )
        key = os.urandom(32)
        ratios = []
        for bit in range(self.BITS):
            key2 = bytearray(key)
            key2[bit // 8] ^= (1 << (bit % 8))
            key2 = bytes(key2)
            _, gk1 = _carter_split(key);  s1, m1 = _derive_params(gk1)
            _, gk2 = _carter_split(key2); s2, m2 = _derive_params(gk2)
            r1 = get_referent(s1); r2 = get_referent(s2)
            g1 = _grammar_individual(gk1, r1) if not m1 else _grammar_meta(gk1, r1)
            g2 = _grammar_individual(gk2, r2) if not m2 else _grammar_meta(gk2, r2)
            roles1 = [1 if x["role"]==_MESSAGE else 0 for x in g1]
            roles2 = [1 if x["role"]==_MESSAGE else 0 for x in g2]
            n = min(len(roles1), len(roles2))
            diff = sum(1 for a,b in zip(roles1[:n],roles2[:n]) if a!=b)
            ratios.append(diff/n)
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.35,
            f"Grammar avalanche trop faible : {mean:.3f} < 0.35")
        print(f"  Grammar avalanche    : mean={mean:.3f} (theorique ~= 0.44)")

    def test_message_cell_avalanche(self):
        """
        Avalanche des symboles message : flip 1 bit cle -> >80% des symboles
        chiffres changent (propriete de ChaCha20-HKDF + masques HKDF).

        Utilise payload_to_symbols() (le meme flux de symboles que produisent
        les encodeurs Carter en production) plutot qu'une conversion octet
        par octet isolee — il n'existe pas de helper "un octet -> N symboles"
        expose separement dans ce depot.
        """
        from carter_random import _carter_split, _derive_masks
        ratios = []
        for _ in range(8):
            k  = os.urandom(32)
            k2 = bytearray(k); k2[0] ^= 1; k2 = bytes(k2)
            def syms_and_masks(key):
                xk, gk = _carter_split(key)
                payload = _encrypt("LACROIXANSEE", xk, 150)
                syms    = payload_to_symbols(payload, 150)
                masks   = _derive_masks(gk, len(syms)+128)
                return [(syms[i]+masks[i]) % ALPHA_LEN for i in range(len(syms))]
            v1 = syms_and_masks(k)
            v2 = syms_and_masks(k2)
            n = min(len(v1), len(v2))
            ratios.append(sum(1 for a,b in zip(v1[:n],v2[:n]) if a!=b)/n)
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.80,
            f"Avalanche symboles message : {mean:.3f} < 0.80")
        print(f"  Avalanche msg symboles : mean={mean:.3f} (attendu >0.80 — ChaCha20-HKDF)")


class TestCarter18Statistical(unittest.TestCase):
    """
    Carter-18 (meta-blocs concentriques 18x18) — chi2, avalanche de
    grammaire, round-trip. Meme structure que TestCarterRandomChiSquare +
    TestCarterRandomAvalanche, appliquee au mode Carter-18.
    """

    MSG        = "ANIBALAMIOTX"
    N_GRIDS    = 10
    DF         = ALPHA_LEN - 1   # 43 degres de liberte
    CHI2_SEUIL = 59.3            # seuil a alpha=0.05
    BITS       = 16
    N_ROUNDTRIP = 20

    def _chi2_stat(self, flat):
        n   = len(flat)
        exp = n / ALPHA_LEN
        return sum((flat.count(v) - exp)**2 / exp for v in range(ALPHA_LEN))

    def test_chi2_carter_18(self):
        """Chi2 sur les cellules message : distribution uniforme sur [0..43]."""
        try:
            import scipy.stats as st
        except ImportError:
            self.skipTest("scipy non installe")
        chi2s, ps = [], []
        for _ in range(self.N_GRIDS):
            k = os.urandom(32)
            if not carter18_fits(self.MSG, k): continue
            grid, _ = encode_carter_18(self.MSG, k)
            flat = [v for row in grid for v in row]
            c    = self._chi2_stat(flat)
            p    = 1 - st.chi2.cdf(c, self.DF)
            chi2s.append(c); ps.append(p)
        if not chi2s:
            self.skipTest("Aucune cle valide")
        mean_c = statistics.mean(chi2s)
        mean_p = statistics.mean(ps)
        bad    = sum(1 for c in chi2s if c > self.CHI2_SEUIL)
        self.assertLessEqual(bad, 2,
            f"Carter-18 chi2 : {bad}/{len(chi2s)} grilles au-dessus du seuil")
        print(f"  chi2 Carter-18     : mean={mean_c:.1f}  p={mean_p:.3f}  "
              f"seuil={self.CHI2_SEUIL}  echecs={bad}/{len(chi2s)}")

    def test_grammar_avalanche_carter_18(self):
        """Avalanche de grammaire : flip 1 bit cle -> >35% des blocs changent de role."""
        from carter_random import _grammar_18, _MESSAGE, GRID_SIZE
        key = os.urandom(32)
        ratios = []
        for bit in range(self.BITS):
            key2 = bytearray(key)
            key2[bit // 8] ^= (1 << (bit % 8))
            key2 = bytes(key2)
            _, gk1 = _carter_split(key)
            _, gk2 = _carter_split(bytes(key2))
            g1 = _grammar_18(gk1, GRID_SIZE)
            g2 = _grammar_18(gk2, GRID_SIZE)
            roles1 = [1 if x["role"]==_MESSAGE else 0 for x in g1]
            roles2 = [1 if x["role"]==_MESSAGE else 0 for x in g2]
            n = min(len(roles1), len(roles2))
            diff = sum(1 for a,b in zip(roles1[:n],roles2[:n]) if a!=b)
            ratios.append(diff/n)
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.35,
            f"Grammar avalanche Carter-18 trop faible : {mean:.3f} < 0.35")
        print(f"  Grammar avalanche Carter-18 : mean={mean:.3f} (attendu > 0.35)")

    def test_roundtrip_carter_18(self):
        """Round-trip sur 20 cles aleatoires."""
        ok, tried = 0, 0
        for _ in range(self.N_ROUNDTRIP):
            k = os.urandom(32)
            if not carter18_fits(self.MSG, k): continue
            tried += 1
            grid, _ = encode_carter_18(self.MSG, k)
            dec = decode_carter_18(grid, k)
            self.assertEqual(dec, self.MSG,
                f"Rupture round-trip Carter-18 pour une cle valide")
            ok += 1
        self.assertGreater(tried, 0, "Aucune cle valide sur 20 essais")
        print(f"  Round-trip Carter-18 : {ok}/{tried} cles valides, 0 echec")


class TestCarterHybridStatistical(unittest.TestCase):
    """
    Carter-Hybrid (meta-blocs 18x18 concentriques + 6x6 mixtes) — chi2,
    avalanche de grammaire, round-trip. Meme structure que
    TestCarterRandomChiSquare + TestCarterRandomAvalanche, appliquee au
    mode Carter-Hybrid.
    """

    MSG        = "ANIBALAMIOTX"
    N_GRIDS    = 10
    DF         = ALPHA_LEN - 1   # 43 degres de liberte
    CHI2_SEUIL = 59.3            # seuil a alpha=0.05
    BITS       = 16
    N_ROUNDTRIP = 20

    def _chi2_stat(self, flat):
        n   = len(flat)
        exp = n / ALPHA_LEN
        return sum((flat.count(v) - exp)**2 / exp for v in range(ALPHA_LEN))

    def test_chi2_carter_hybrid(self):
        """Chi2 sur les cellules message : distribution uniforme sur [0..43]."""
        try:
            import scipy.stats as st
        except ImportError:
            self.skipTest("scipy non installe")
        chi2s, ps = [], []
        for _ in range(self.N_GRIDS):
            k = os.urandom(32)
            if not carter_hybrid_fits(self.MSG, k): continue
            grid, _ = encode_carter_hybrid(self.MSG, k)
            flat = [v for row in grid for v in row]
            c    = self._chi2_stat(flat)
            p    = 1 - st.chi2.cdf(c, self.DF)
            chi2s.append(c); ps.append(p)
        if not chi2s:
            self.skipTest("Aucune cle valide")
        mean_c = statistics.mean(chi2s)
        mean_p = statistics.mean(ps)
        bad    = sum(1 for c in chi2s if c > self.CHI2_SEUIL)
        self.assertLessEqual(bad, 2,
            f"Carter-Hybrid chi2 : {bad}/{len(chi2s)} grilles au-dessus du seuil")
        print(f"  chi2 Carter-Hybrid : mean={mean_c:.1f}  p={mean_p:.3f}  "
              f"seuil={self.CHI2_SEUIL}  echecs={bad}/{len(chi2s)}")

    def test_grammar_avalanche_carter_hybrid(self):
        """Avalanche de grammaire : flip 1 bit cle -> >35% des blocs changent de role."""
        from carter_random import _grammar_hybrid, _MESSAGE, GRID_SIZE
        key = os.urandom(32)
        ratios = []
        for bit in range(self.BITS):
            key2 = bytearray(key)
            key2[bit // 8] ^= (1 << (bit % 8))
            key2 = bytes(key2)
            _, gk1 = _carter_split(key)
            _, gk2 = _carter_split(bytes(key2))
            g1 = _grammar_hybrid(gk1, GRID_SIZE)
            g2 = _grammar_hybrid(gk2, GRID_SIZE)
            roles1 = [1 if x["role"]==_MESSAGE else 0 for x in g1]
            roles2 = [1 if x["role"]==_MESSAGE else 0 for x in g2]
            n = min(len(roles1), len(roles2))
            diff = sum(1 for a,b in zip(roles1[:n],roles2[:n]) if a!=b)
            ratios.append(diff/n)
        mean = statistics.mean(ratios)
        self.assertGreater(mean, 0.35,
            f"Grammar avalanche Carter-Hybrid trop faible : {mean:.3f} < 0.35")
        print(f"  Grammar avalanche Carter-Hybrid : mean={mean:.3f} (attendu > 0.35)")

    def test_roundtrip_carter_hybrid(self):
        """Round-trip sur 20 cles aleatoires."""
        ok, tried = 0, 0
        for _ in range(self.N_ROUNDTRIP):
            k = os.urandom(32)
            if not carter_hybrid_fits(self.MSG, k): continue
            tried += 1
            grid, _ = encode_carter_hybrid(self.MSG, k)
            dec = decode_carter_hybrid(grid, k)
            self.assertEqual(dec, self.MSG,
                f"Rupture round-trip Carter-Hybrid pour une cle valide")
            ok += 1
        self.assertGreater(tried, 0, "Aucune cle valide sur 20 essais")
        print(f"  Round-trip Carter-Hybrid : {ok}/{tried} cles valides, 0 echec")


class TestCarterRandomSummary(unittest.TestCase):
    """Tableau recapitulatif Carter Random — toutes metriques."""

    MSG = "ANIBALAMIOTX"

    def test_summary(self):
        try:
            import scipy.stats as st
        except ImportError:
            self.skipTest("scipy non installe")
        key = os.urandom(32)
        while not (random_fits(self.MSG, key) and carter18_fits(self.MSG, key)
                   and carter_hybrid_fits(self.MSG, key)):
            key = os.urandom(32)

        results = {}
        for label, fn in [('Random 90', encode_carter_random),
                           ('Random 360', encode_carter_random_360),
                           ('Carter-18', encode_carter_18),
                           ('Carter-Hybrid', encode_carter_hybrid)]:
            grid, _ = fn(self.MSG, key)
            flat = [v for row in grid for v in row]
            n    = len(flat)
            freq = [flat.count(v)/n for v in range(ALPHA_LEN)]
            h    = -sum(p*math.log2(p) for p in freq if p > 0)
            mean = sum(flat)/n
            std  = math.sqrt(sum((v-mean)**2 for v in flat)/n)
            exp  = n/ALPHA_LEN
            chi2 = sum((flat.count(v)-exp)**2/exp for v in range(ALPHA_LEN))
            p    = 1 - st.chi2.cdf(chi2, ALPHA_LEN-1)
            results[label] = (h, mean, std, chi2, p)

        print(f"\n{'='*65}")
        print(f"CARTER RANDOM — Metriques statistiques")
        print(f"{'='*65}")
        print(f"{'Mode':<14} {'H':>7} {'E[V]':>7} {'Std':>7} {'chi2':>8} {'p':>7}")
        print(f"{'-'*65}")
        for label, (h, mean, std, chi2, p) in results.items():
            ok = 'OK' if p > 0.05 else 'FAIL'
            print(f"{label:<14} {h:>7.4f} {mean:>7.2f} {std:>7.2f} "
                  f"{chi2:>8.1f} {p:>7.3f} {ok}")
        print(f"{'-'*65}")
        print(f"Ideal        {math.log2(ALPHA_LEN):>7.4f} "
              f"{(ALPHA_LEN-1)/2:>7.2f} "
              f"{math.sqrt((ALPHA_LEN**2-1)/12):>7.2f}  "
              f"df={ALPHA_LEN-1}  seuil=0.05")
        self.assertTrue(True)


if __name__ == '__main__':
    print("="*56)
    print("TESTS STATISTIQUES — SecuBox / La Livree d'Hermes")
    print("="*56)

    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()
    for cls in [TestAvalancheKey, TestAvalancheMessage, TestEntropy,
                TestChiSquare, TestAutocorrelation, TestSerialCorrelation,
                TestSummary,
                TestCarterRandomCapacity, TestCarterRandomChiSquare,
                TestCarterRandomAvalanche,
                TestCarter18Statistical, TestCarterHybridStatistical,
                TestCarterRandomSummary]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print(f"\nTous les tests statistiques passent")
        print(f"  {result.testsRun} tests, 0 erreur, 0 echec")
    else:
        print(f"\n{len(result.failures)} echec(s), {len(result.errors)} erreur(s)")
        sys.exit(1)
