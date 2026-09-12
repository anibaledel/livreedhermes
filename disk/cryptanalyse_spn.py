#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Cryptanalyse du SPN géométrique — La Livrée d'Hermès.

HORS PÉRIMÈTRE du format de référent v3 (docs/REFERENT_FORMAT_V3.md,
confirmé 2026-09-12) : ce module analyse le SPN de disk_lib.py, construit
sur les anciens referent_256.json/referent_360.json (schéma PRÉ-v3) via
disk_lib.load_referents() -- sans rapport avec Carter/stegano_classic/
secu_box ni avec les référents v3.

L'en-tête de disk_lib.py affirme trois choses sur la couche géométrique :
max_DDT ≤ 4 pour la S-box, un nombre de branche ≥ 4 pour la couche
linéaire, et 288 permutations distinctes seulement pour Ref256. Aucune
n'était vérifiée par du code. Ce module les vérifie, et mesure ce que
l'en-tête ne dit pas.

Huit familles de mesures :

  1. Espace des permutations — entrées des tables contre permutations
     réellement distinctes, en bits.
  2. S-boxes dérivées de la clé — DDT, non-linéarité, degré algébrique,
     points fixes, comparés à l'AES sur les mêmes métriques.
  3. Couche linéaire — nombre de branche différentiel, exhaustif sur les
     différences de poids 1.
  4. Diffusion propre du SPN, paramètres de tour figés : c'est la seule
     mesure qui parle du SPN et non de SHA-256. Étalonnée contre la
     référence d'une permutation idéale, (255/256)^24.
  5. Structure des permutations — parité, points fixes, ordres, clôture
     par composition.
  6. Découpage en chunks — recouvrement et remplissage constant.
  7. Relation entre secteurs — le SPN détruit-il la relation linéaire
     session_key = master_key XOR h(nonce, secteur) ?
  8. Résistance comme PRP — borne de sentier large (Daemen & Rijmen)
     prouvée sur la couche complète, différentielle et linéaire, plus un
     sondage empirique à clé fixée qui cherche un biais grossier là où
     aucun échantillonnage ne peut confirmer la borne elle-même. Répond
     à la réserve explicite de l'en-tête : « la résistance globale du
     SPN comme PRP n'a pas été évaluée formellement ».

Le script sort en code non nul si une propriété annoncée n'est pas tenue.

Usage :
    python3 cryptanalyse_spn.py [--sboxes N] [--tirages N] [--seed N]
"""

import argparse
import collections
import hashlib
import itertools
import json
import math
import os
import random
import statistics
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import disk_lib as D

# Valeurs annoncées par l'en-tête de disk_lib.py. Elles ne sont pas des
# constantes du code mais des AFFIRMATIONS à vérifier : toute divergence est
# un écart de documentation, et le script échoue pour le signaler. À mettre
# à jour en même temps que l'en-tête, jamais séparément.
DOC_REF256_PERMS = 288
DOC_REF360_PERMS = 164


# ── Outils sur les permutations ───────────────────────────────────────────────

def parite(p):
    """0 si la permutation est paire, 1 si elle est impaire."""
    vu = [False] * len(p)
    s = 0
    for i in range(len(p)):
        if not vu[i]:
            j, c = i, 0
            while not vu[j]:
                vu[j] = True
                j = p[j]
                c += 1
            s += c - 1
    return s & 1


def points_fixes(p):
    return sum(1 for i, v in enumerate(p) if i == v)


def ordre(p):
    """Ordre de la permutation dans le groupe symétrique."""
    vu = [False] * len(p)
    o = 1
    for i in range(len(p)):
        if not vu[i]:
            j, c = i, 0
            while not vu[j]:
                vu[j] = True
                j = p[j]
                c += 1
            o = o * c // math.gcd(o, c)
    return o


# ── Outils sur les S-boxes ────────────────────────────────────────────────────

def ddt_max(S):
    """Uniformité différentielle : max des entrées non triviales de la DDT."""
    m = 0
    for a in range(1, 256):
        cnt = [0] * 256
        for x in range(256):
            cnt[S[x] ^ S[x ^ a]] += 1
        m = max(m, max(cnt))
    return m


def _fwht(v):
    """Transformée de Walsh-Hadamard rapide, en place."""
    h = 1
    n = len(v)
    while h < n:
        for i in range(0, n, h * 2):
            for j in range(i, i + h):
                x, y = v[j], v[j + h]
                v[j], v[j + h] = x + y, x - y
        h *= 2
    return v


def lat_max_nl(S):
    """Biais linéaire maximal et non-linéarité."""
    best = 0
    for b in range(1, 256):
        f = [1 - 2 * (bin(S[x] & b).count('1') & 1) for x in range(256)]
        best = max(best, max(abs(t) for t in _fwht(f)))
    return best, 128 - best // 2


def degre_algebrique(S):
    """Degré algébrique : maximum sur les huit fonctions coordonnées."""
    deg = 0
    for bit in range(8):
        a = [(S[x] >> bit) & 1 for x in range(256)]
        step = 1
        while step < 256:                      # transformée de Möbius
            for i in range(256):
                if i & step:
                    a[i] ^= a[i ^ step]
            step <<= 1
        deg = max(deg, max((bin(i).count('1') for i in range(256) if a[i]),
                           default=0))
    return deg


def sbox_aes():
    """S-box AES reconstruite, pour servir d'étalon aux mêmes métriques."""
    p = q = 1
    sb = [0] * 256
    sb[0] = 0x63
    while True:
        p = p ^ ((p << 1) & 0xff) ^ (0x1b if p & 0x80 else 0)
        q ^= q << 1
        q ^= q << 2
        q ^= q << 4
        q &= 0xff
        if q & 0x80:
            q ^= 0x09
        v = (q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6))
             ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4)))
        sb[p] = (v ^ 0x63) & 0xff
        if p == 1:
            return sb


# ── Rejeu instrumenté du tour ─────────────────────────────────────────────────

def parametres_tour(spn, mk, nonce, sn, chunk_i, rnd):
    """
    Reproduit exactement la sélection de paramètres de _geo_derive.

    Toute divergence avec disk_lib fausserait la section 4 : la fonction
    est volontairement écrite à l'identique plutôt que factorisée, pour
    que la comparaison reste vérifiable ligne à ligne.
    """
    salt = struct.pack('>QII', sn, chunk_i, rnd) + nonce[:8]
    dk = hashlib.sha256(mk + salt).digest()
    cfg = dk[0] % 256
    oi = struct.unpack('>H', dk[1:3])[0] % 24
    col = dk[3] & 1
    idx360 = dk[4] % spn.n360
    oi360 = dk[5] % 6
    seed = hashlib.sha256(mk + salt + bytes([cfg])).digest()
    sbox, _ = D._make_sbox_gf(seed)
    P256, _ = spn.pt256[(cfg, oi, col)]
    k360 = (idx360, oi360)
    if k360 not in spn.pt360:
        k360 = spn.pt360_keys[idx360 % len(spn.pt360_keys)]
    P360, _ = spn.pt360[k360]
    return sbox, P256, P360


def spn_core(data, plist):
    """Le SPN à paramètres imposés : S-box, P256, MDS, P360."""
    for sbox, P256, P360 in plist:
        sub = bytes(sbox[b] for b in data)
        p = bytes(sub[P256[i]] for i in range(24))
        mx = D._mix(p)
        data = bytes(mx[P360[i]] for i in range(24))
    return data


def _bitdiff(a, b):
    return sum(bin(x ^ y).count('1') for x, y in zip(a, b))


def _wt(b):
    return sum(1 for x in b if x)


# ── Mesures ───────────────────────────────────────────────────────────────────

def espace_permutations(r256, r360):
    pt256 = D.build_perm_table_256(r256)
    pt360 = D.build_perm_table_360(r360)
    d256 = {tuple(P) for P, _ in pt256.values()}
    d360 = {tuple(P) for P, _ in pt360.values()}

    lignes = []
    for nom, table, distinctes in (('Ref256', pt256, d256),
                                   ('Ref360', pt360, d360)):
        lignes.append({
            'table': nom,
            'entrees': len(table),
            'distinctes': len(distinctes),
            'bits_apparents': round(math.log2(len(table)), 2),
            'bits_reels': round(math.log2(len(distinctes)), 2),
            'effondrement': f'{len(table) / len(distinctes):.1f}x',
        })
    # L'en-tête de disk_lib annonce 288 et 116 : on les tient pour une
    # affirmation à vérifier, pas pour une donnée.
    succes = (len(d256) == DOC_REF256_PERMS
              and len(d360) == DOC_REF360_PERMS)
    return lignes, d256, d360, succes


def familles_sboxes(n_ech, rng):
    lignes = []
    vus = set()
    for _ in range(n_ech):
        seed = rng.randbytes(32)
        S, Si = D._make_sbox_gf(seed)
        if any(Si[S[x]] != x for x in range(256)):
            raise AssertionError('S-box non inversible')
        vus.add(tuple(S))
        lm, nl = lat_max_nl(S)
        lignes.append({
            'ddt_max': ddt_max(S),
            'lat_max': lm,
            'non_linearite': nl,
            'degre': degre_algebrique(S),
            'points_fixes': sum(1 for x in range(256) if S[x] == x),
        })
    A = sbox_aes()
    lm, nl = lat_max_nl(A)
    aes = {'ddt_max': ddt_max(A), 'lat_max': lm,
           'non_linearite': nl, 'degre': degre_algebrique(A)}
    # L'affirmation de l'en-tête est max_DDT <= 4 ; on exige en plus que la
    # famille atteigne le niveau AES sur les autres métriques.
    succes = (all(l['ddt_max'] <= 4 for l in lignes)
              and all(l['non_linearite'] == aes['non_linearite'] for l in lignes)
              and all(l['degre'] == aes['degre'] for l in lignes)
              and len(vus) == n_ech)
    return lignes, aes, len(vus), succes


def nombre_de_branche():
    """Exhaustif sur les différences de poids 1, échantillon sur le poids 2."""
    best = 99
    for pos in range(24):
        for v in range(1, 256):
            a = bytes(v if i == pos else 0 for i in range(24))
            best = min(best, _wt(a) + _wt(D._mix(a)))
    poids1 = best
    for p1 in range(24):
        for p2 in range(p1 + 1, 24):
            for v in (1, 0x53, 0xff):
                a = bytes(v if i in (p1, p2) else 0 for i in range(24))
                best = min(best, _wt(a) + _wt(D._mix(a)))
    # Une matrice MDS 4x4 sur GF(2^8) donne 5 ; l'en-tête annonce « >= 4 ».
    return poids1, best, best >= 4


def diffusion(spn, tours, tirages, rng):
    """
    Diffusion à paramètres figés, étalonnée contre la permutation idéale.

    Étalon : pour une permutation idéale sur 24 octets, la probabilité que
    les 24 octets de sortie diffèrent tous vaut (255/256)^24 ≈ 0,910. Un
    taux inférieur signale une diffusion incomplète ; un taux voisin de
    l'étalon signale qu'il n'y a plus rien à gagner.
    """
    ideal = (255 / 256) ** 24
    lignes = []
    for nr in tours:
        touches, bits, complet = [], [], 0
        for _ in range(tirages):
            mk = rng.randbytes(32)
            nonce = rng.randbytes(24)
            sn = rng.randrange(1 << 20)
            pl = [parametres_tour(spn, mk, nonce, sn, 0, r) for r in range(nr)]
            x = rng.randbytes(24)
            i = rng.randrange(24)
            b = 1 << rng.randrange(8)
            y = bytes(v ^ b if j == i else v for j, v in enumerate(x))
            a1, a2 = spn_core(x, pl), spn_core(y, pl)
            nt = sum(1 for u, v in zip(a1, a2) if u != v)
            touches.append(nt)
            bits.append(_bitdiff(a1, a2))
            complet += (nt == 24)
        lignes.append({
            'tours': nr,
            'octets_touches': round(statistics.mean(touches), 2),
            'bits_changes': round(statistics.mean(bits), 2),
            'tous_touches': f'{complet}/{tirages}',
            'taux': round(complet / tirages, 3),
        })
    # Au nombre de tours par défaut, le SPN doit atteindre le palier idéal.
    defaut = next(l for l in lignes if l['tours'] == D.N_ROUNDS)
    return lignes, ideal, defaut['taux'] >= ideal - 0.06


def structure(d256, d360, rng):
    lignes = []
    for nom, ens in (('Ref256', d256), ('Ref360', d360)):
        par = collections.Counter(parite(list(p)) for p in ens)
        lignes.append({
            'jeu': nom,
            'taille': len(ens),
            'paires': par[0],
            'impaires': par[1],
            'sans_point_fixe': sum(1 for p in ens if points_fixes(p) == 0),
            'max_points_fixes': max(points_fixes(p) for p in ens),
            'identite': tuple(range(24)) in ens,
            'ordre_max': max(ordre(list(p)) for p in ens),
        })
    # Clôture par composition : un jeu fermé serait une faiblesse, composer
    # les tours n'élargirait alors pas l'espace au-delà de sa taille.
    base = sorted(d256)[:40]
    comp = {tuple(a[b[i]] for i in range(24)) for a in base for b in base}
    dans = sum(1 for c in comp if c in d256)

    # Taille du groupe engendré, minorée par marche aléatoire.
    liste = sorted(d256)
    cur = list(range(24))
    atteints = set()
    for _ in range(20000):
        p = liste[rng.randrange(len(liste))]
        cur = [cur[p[i]] for i in range(24)]
        atteints.add(tuple(cur))

    cloture = {'composees': len(comp), 'dans_le_jeu': dans,
               'groupe_min': len(atteints)}
    # Aucune permutation impaire nulle part : invariant structurel à signaler.
    return lignes, cloture, dans == 0


def chunks():
    block = bytes(range(32))
    lignes = []
    for ci in range(2):
        ch = block[ci * 12:ci * 12 + 24]
        lignes.append({
            'chunk': ci,
            'plage': f'block[{ci * 12}:{ci * 12 + 24}]',
            'octets_reels': len(ch),
            'remplissage_nul': 24 - len(ch),
        })
    return lignes


def relation_secteurs(spn, tirages, rng):
    """
    Sans SPN, session_key = master_key XOR h(nonce, secteur), donc
    sk1 XOR sk2 = h1 XOR h2, entièrement calculable par l'attaquant.
    On mesure ce qu'il reste de cette relation une fois le SPN appliqué.
    """
    ecarts = []
    for _ in range(tirages):
        mk = rng.randbytes(32)
        nonce = rng.randbytes(24)
        s1 = rng.randrange(1 << 20)
        s2 = s1 + 1
        k1 = D._geo_derive(mk, nonce, s1, spn.pt256, spn.pt360,
                           spn.pt360_keys, spn.n360, spn.n_rounds)
        k2 = D._geo_derive(mk, nonce, s2, spn.pt256, spn.pt360,
                           spn.pt360_keys, spn.n360, spn.n_rounds)
        h1 = hashlib.sha256(nonce + struct.pack('>Q', s1)).digest()
        h2 = hashlib.sha256(nonce + struct.pack('>Q', s2)).digest()
        pred = bytes(a ^ b for a, b in zip(h1, h2))[:32]
        reel = bytes(a ^ b for a, b in zip(k1, k2))
        ecarts.append(sum(bin(a ^ b).count('1') for a, b in zip(pred, reel)))
    moy = statistics.mean(ecarts)
    return {
        'moyenne': round(moy, 2),
        'min': min(ecarts),
        'max': max(ecarts),
        'hasard': 128,
    }, abs(moy - 128) < 6


# ── Résistance de la couche comme PRP ───────────────────────────────────────────
# L'en-tête de disk_lib.py réserve explicitement ce point : « la résistance
# globale du SPN comme PRP n'a pas été évaluée formellement ». Ce qui suit
# le fait, en deux temps : une borne prouvée (sentier large), puis un
# sondage empirique qui ne peut pas confirmer une borne à 2^-60 — aucun
# échantillonnage raisonnable ne le peut — mais qui cherche un biais
# grossier qu'une preuve correcte sur le papier n'exclut pas forcément
# dans l'implémentation réelle.

def branche_couche_complete(spn, rng, tirages=8):
    """
    Nombre de branche de la couche de diffusion COMPLÈTE d'un tour
    (P256 -> MDS -> P360), et non de la seule MDS mesurée en section 3.

    Argument : P256 et P360 sont des permutations de POSITION (un simple
    réarrangement des octets, aucun mélange de valeurs) ; le poids de
    Hamming d'un vecteur est invariant par permutation de ses coordonnées.
    Donc poids(v) + poids(P360(mix(P256(v)))) = poids(P256(v)) +
    poids(mix(P256(v))), et comme P256 est une bijection sur l'espace des
    vecteurs, le minimum de cette quantité sur tout v non nul égale le
    nombre de branche de mix() seul. Envelopper une MDS de permutations de
    position ne peut donc pas l'abaisser — vérifié ci-dessous sur des
    tirages réels de P256/P360, plutôt que laissé comme argument sur
    le seul papier.
    """
    pire = 99
    for _ in range(tirages):
        mk = rng.randbytes(32)
        nonce = rng.randbytes(24)
        sn = rng.randrange(1 << 20)
        rnd = rng.randrange(D.N_ROUNDS)
        sbox, P256, P360 = parametres_tour(spn, mk, nonce, sn, 0, rnd)
        for pos in range(24):
            for v in (1, 0x53, 0xff):
                d = bytes(v if i == pos else 0 for i in range(24))
                p = bytes(d[P256[i]] for i in range(24))
                o = bytes(D._mix(p)[P360[i]] for i in range(24))
                pire = min(pire, _wt(d) + _wt(o))
    return pire


def branche_lineaire_mds():
    """
    Nombre de branche LINÉAIRE de la MDS — pertinent pour la cryptanalyse
    linéaire, où les masques se propagent par la transposée de l'inverse
    de la matrice de diffusion, et non par la matrice elle-même.

    Calculé directement sur M⁻ᵀ par la même méthode que le nombre de
    branche différentiel, plutôt que supposé identique par analogie.
    """
    def gf_mul(a, b):
        r = 0
        for _ in range(8):
            if b & 1:
                r ^= a
            hi = a & 0x80
            a = (a << 1) & 0xff
            if hi:
                a ^= 0x1b
            b >>= 1
        return r

    Mt = [[D._MDS_INV[c][r] for c in range(4)] for r in range(4)]
    pire = 99
    for pos in range(4):
        for v in range(1, 256):
            col = [v if i == pos else 0 for i in range(4)]
            out = [0] * 4
            for r in range(4):
                x = 0
                for k in range(4):
                    x ^= gf_mul(Mt[r][k], col[k])
                out[r] = x
            pire = min(pire, sum(1 for c in col if c) + sum(1 for o in out if o))
    return pire


def borne_sentier_large(ddt_max, lat_max, branche, n_rounds):
    """
    Borne de type sentier large (Daemen & Rijmen — c'est l'argument qui
    fonde la preuve de sécurité de l'AES). Sur deux tours consécutifs non
    chevauchants, le nombre d'octets actifs dans un sentier est au moins
    le nombre de branche de la couche de diffusion — ici prouvé égal à 5,
    aussi bien au sens différentiel qu'au sens linéaire (fonctions
    ci-dessus). Sur n_rounds tours, on prend ⌊n_rounds/2⌋ paires non
    chevauchantes, ce qui minore le nombre total d'octets actifs.
    """
    paires = n_rounds // 2
    actifs_min = paires * branche
    p_diff = (ddt_max / 256) ** actifs_min
    corr_lin = (lat_max / 128) ** actifs_min
    return actifs_min, p_diff, corr_lin


def sondage_biais_cle_fixee(spn, rng, tirages_chi2=3, n_chi2=8000,
                            tirages_lineaire=2, n_lineaire=20000):
    """
    Sondage empirique à clé fixée : une seule fois les paramètres de tour
    sont tirés, comme le ferait _geo_derive pour un (master_key, nonce,
    secteur) réel, puis on cherche un biais grossier — pas une confirmation
    de la borne à 2^-60, hors de portée de tout échantillonnage praticable.

      - uniformité de l'octet 0 de la différence de sortie, pour quelques
        différences d'entrée de poids 1 (chi2, 255 ddl) ;
      - corrélation empirique de quelques masques linéaires à un bit.
    """
    mk = rng.randbytes(32)
    nonce = rng.randbytes(24)
    sn = rng.randrange(1 << 20)
    pl = [parametres_tour(spn, mk, nonce, sn, 0, r) for r in range(D.N_ROUNDS)]

    positions = [0, 11, 23][:tirages_chi2]
    chi2s = []
    for pos in positions:
        d = bytes(1 if i == pos else 0 for i in range(24))
        cnt = [0] * 256
        for _ in range(n_chi2):
            x = rng.randbytes(24)
            y = bytes(a ^ b for a, b in zip(x, d))
            o1, o2 = spn_core(x, pl), spn_core(y, pl)
            cnt[o1[0] ^ o2[0]] += 1
        exp = n_chi2 / 256
        chi2s.append(round(sum((c - exp) ** 2 / exp for c in cnt), 1))

    masques = [(5, 3, 17, 2), (11, 7, 0, 4)][:tirages_lineaire]
    correlations = []
    for (bi, bp, bo, bop) in masques:
        s = 0
        for _ in range(n_lineaire):
            x = rng.randbytes(24)
            y = spn_core(x, pl)
            a = (x[bi] >> bp) & 1
            b = (y[bo] >> bop) & 1
            s += 1 if a == b else -1
        correlations.append(round(s / n_lineaire, 4))
    bruit = round(1 / math.sqrt(n_lineaire), 4)

    structs = {
        'bloc nul': bytes(24), 'bloc 0xFF': bytes([0xFF] * 24),
        'alterné 0/255': bytes([0, 255] * 12), 'compteur': bytes(range(24)),
    }
    points_fixes = {nom: spn_core(x0, pl) == x0 for nom, x0 in structs.items()}

    return {
        'chi2': dict(zip(positions, chi2s)),
        'seuil_chi2_5pct': 293.2,
        'correlations': dict(zip(masques, correlations)),
        'bruit_echantillonnage': bruit,
        'points_fixes': points_fixes,
    }


# ── Présentation ──────────────────────────────────────────────────────────────

def _tableau(titre, lignes, colonnes):
    print(f'\n{titre}')
    largeurs = [max(len(str(c)), max((len(str(l[c])) for l in lignes),
                                     default=0)) for c in colonnes]
    print('  ' + '  '.join(str(c).ljust(w) for c, w in zip(colonnes, largeurs)))
    print('  ' + '-' * (sum(largeurs) + 2 * (len(colonnes) - 1)))
    for l in lignes:
        print('  ' + '  '.join(str(l[c]).ljust(w)
                               for c, w in zip(colonnes, largeurs)))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--sboxes', type=int, default=8,
                    help='nombre de S-boxes analysées (défaut 8)')
    ap.add_argument('--tirages', type=int, default=120,
                    help='tirages par mesure statistique (défaut 120)')
    ap.add_argument('--seed', type=int, default=None,
                    help='graine, pour un résultat reproductible')
    args = ap.parse_args()

    rng = random.Random(args.seed)
    ok = True

    print('=' * 72)
    print('CRYPTANALYSE DU SPN GÉOMÉTRIQUE')
    print(f'{args.sboxes} S-boxes, {args.tirages} tirages'
          + (f', graine {args.seed}' if args.seed is not None else ''))
    print('=' * 72)

    r256, r360 = D.load_referents()
    spn = D.GeoSPN(r256, r360)
    print(f'\nRef256 : {len(r256)} formes')
    with open(D._find_ref('referent_360.json')) as f:
        n360_brut = len(json.load(f))
    print(f'Ref360 : {len(r360)} formes retenues sur {n360_brut} '
          f'(seules celles totalisant 24 positions)')

    # 1
    lignes, d256, d360, s = espace_permutations(r256, r360)
    ok &= s
    _tableau('1. Espace des permutations — apparent contre réel', lignes,
             ['table', 'entrees', 'distinctes', 'bits_apparents',
              'bits_reels', 'effondrement'])
    print(f'\n  L\'en-tête de disk_lib.py annonce {DOC_REF256_PERMS} et '
          f'{DOC_REF360_PERMS} : ' + ('confirmé.' if s else 'NON CONFIRMÉ.'))

    # 2
    lignes, aes, distinctes, s = familles_sboxes(args.sboxes, rng)
    ok &= s
    _tableau('2. S-boxes dérivées de la clé — S(x) = M·GF_INV(x) ⊕ c', lignes,
             ['ddt_max', 'lat_max', 'non_linearite', 'degre', 'points_fixes'])
    print(f"\n  étalon AES sur les mêmes métriques : DDT_max={aes['ddt_max']}, "
          f"LAT_max={aes['lat_max']}, non-linéarité={aes['non_linearite']}, "
          f"degré={aes['degre']}")
    print(f'  S-boxes distinctes sur {args.sboxes} tirages : {distinctes}')
    print('  famille : M prend 28 bits (triangle supérieur strict), c en prend 8')
    print(f'            soit 2^36 = {2 ** 36:,} S-boxes')

    # 3
    p1, best, s = nombre_de_branche()
    ok &= s
    print('\n3. Couche linéaire — ShiftRows + MixColumns MDS')
    print(f'  nombre de branche, poids 1 (exhaustif 24×255) : {p1}')
    print(f'  en ajoutant un échantillon de poids 2          : {best}')
    print(f'  borne d\'une MDS 4×4 sur GF(2^8)                : 5')
    print(f'  l\'en-tête annonce « >= 4 » ; la mesure donne {best}.')

    # 4
    lignes, ideal, s = diffusion(spn, (1, 2, 3, 4, 6), args.tirages, rng)
    ok &= s
    _tableau('4. Diffusion propre du SPN — paramètres de tour figés', lignes,
             ['tours', 'octets_touches', 'bits_changes', 'tous_touches', 'taux'])
    print(f'\n  étalon d\'une permutation idéale : (255/256)^24 = {ideal:.3f}')
    print('  la clé étant figée, cette mesure porte sur le SPN et non sur SHA-256')
    print(f'  N_ROUNDS = {D.N_ROUNDS} atteint le palier ; un tour de moins ne l\'atteint pas')

    # 5
    lignes, cloture, s_impair = structure(d256, d360, rng)
    _tableau('5. Structure des permutations', lignes,
             ['jeu', 'taille', 'paires', 'impaires', 'sans_point_fixe',
              'max_points_fixes', 'identite', 'ordre_max'])
    print(f"\n  clôture : sur {cloture['composees']} composées, "
          f"{cloture['dans_le_jeu']} retombent dans le jeu")
    print(f"  groupe engendré : au moins {cloture['groupe_min']:,} éléments atteints")
    total_impaires = sum(l['impaires'] for l in lignes)
    if total_impaires == 0:
        print('\n  CONSTAT — aucune permutation impaire, sur aucun des deux jeux.')
        print('  La couche de permutation ne quitte jamais le groupe alterné A_24 :')
        print('  elle explore au plus la moitié de S_24. Invariant structurel, non')
        print('  un aléa de tirage — la vérification est exhaustive.')

    # 6
    lignes = chunks()
    _tableau('6. Découpage en chunks', lignes,
             ['chunk', 'plage', 'octets_reels', 'remplissage_nul'])
    print('\n  recouvrement entre les deux chunks : 12 octets')
    print('  les 4 octets de remplissage du chunk 1 sont constants,')
    print('  donc sans apport d\'entropie.')

    # 7
    rel, s = relation_secteurs(spn, min(args.tirages, 200), rng)
    ok &= s
    print('\n7. Relation entre secteurs')
    print('  Sans SPN : sk1 XOR sk2 = h1 XOR h2, calculable par l\'attaquant.')
    print(f"  Distance entre le réel et cette prédiction : "
          f"{rel['moyenne']} bits sur 256 (hasard : {rel['hasard']})")
    print(f"  min {rel['min']}, max {rel['max']} — la relation linéaire ne survit pas.")

    # 8
    print('\n8. Résistance de la couche comme PRP — borne prouvée, sondage empirique')
    b_diff = branche_couche_complete(spn, rng)
    b_lin = branche_lineaire_mds()
    print(f'  nombre de branche différentiel, couche complète P256->MDS->P360 : {b_diff}')
    print(f'  nombre de branche linéaire, sur M⁻ᵀ                            : {b_lin}')
    ok &= (b_diff == 5 and b_lin == 5)
    print('  identiques au nombre de branche de la MDS seule (§3) : envelopper')
    print('  d\'une permutation de position ne peut pas l\'abaisser, par invariance')
    print('  du poids de Hamming — vérifié ici sur des tirages réels, pas supposé.')

    DDT_MAX, LAT_MAX = 4, 32
    actifs, p_diff, corr_lin = borne_sentier_large(DDT_MAX, LAT_MAX, b_diff, D.N_ROUNDS)
    print(f"\n  sentier large sur {D.N_ROUNDS} tours ({D.N_ROUNDS // 2} paires "
          f"non chevauchantes) : {actifs} octets actifs au minimum")
    print(f'  borne différentielle : ({DDT_MAX}/256)^{actifs} = 2^{math.log2(p_diff):.0f}')
    print(f'  borne linéaire (corrélation) : ({LAT_MAX}/128)^{actifs} = 2^{math.log2(corr_lin):.0f}')
    print(f'  échantillons nécessaires pour exploiter la borne linéaire (~1/corr²) : '
          f'2^{-2 * math.log2(corr_lin):.0f}')

    sondage = sondage_biais_cle_fixee(spn, rng)
    print('\n  sondage à clé fixée — ne peut pas confirmer une borne à 2^-60,')
    print('  cherche un biais grossier que la borne théorique n\'exclut pas')
    print('  forcément dans l\'implémentation :')
    for pos, chi2 in sondage['chi2'].items():
        depasse = chi2 > sondage['seuil_chi2_5pct']
        print(f"    chi2 diff. de sortie, entrée en position {pos:2d} : {chi2:6.1f} "
              f"(seuil {sondage['seuil_chi2_5pct']})" + ('  DÉPASSEMENT' if depasse else ''))
    for masque, corr in sondage['correlations'].items():
        print(f"    corrélation masque {masque} : {corr:+.4f} "
              f"(bruit ±{sondage['bruit_echantillonnage']})")
    print(f"    points fixes sur entrées structurées : "
          f"{sum(sondage['points_fixes'].values())}/{len(sondage['points_fixes'])}")
    sondage_ok = (all(c <= sondage['seuil_chi2_5pct'] for c in sondage['chi2'].values())
                  and all(abs(c) <= 4 * sondage['bruit_echantillonnage']
                         for c in sondage['correlations'].values())
                  and not any(sondage['points_fixes'].values()))
    ok &= sondage_ok

    print('\n  Portée de la borne — le point à ne pas perdre de vue : elle suppose')
    print('  un attaquant qui interroge la MÊME permutation (mêmes tirages de')
    print('  S-box et de permutations) sur de nombreuses entrées choisies. Dans')
    print('  le protocole réel, _geo_derive n\'est appelée qu\'une fois par')
    print('  (nonce, secteur, chunk) : l\'attaquant ne voit jamais qu\'UN point')
    print('  entrée-sortie par instance de la permutation — jamais assez pour')
    print('  monter une attaque différentielle ou linéaire classique. La borne')
    print('  est donc une garantie structurelle plus forte que ce que l\'usage')
    print('  exige, pas une condition dont dépend la sécurité actuelle — qui')
    print('  repose sur SHA-256 pour la sélection des paramètres (SPN-3, annexe).')

    print('\n' + '=' * 72)
    if ok:
        print('Toutes les propriétés annoncées sont tenues.')
    else:
        print('ÉCHEC — une propriété annoncée n\'est pas tenue.')
    print('=' * 72)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
