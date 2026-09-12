# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
# Geometric constructions: IACR ePrint 2026 (CC BY) — Patent: FR2865054
"""
Chiffrement de disque — Architecture hybride géométrique + ChaCha20-Poly1305
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

HORS PÉRIMÈTRE du format de référent v3 (docs/REFERENT_FORMAT_V3.md,
confirmé 2026-09-12) : ce module lit directement les anciens
data/referent_256.json / referent_360.json (schéma PRÉ-v3 : blue/orange,
294 formes plates), via son propre load_referents() ci-dessous --
totalement indépendant de stegano_classic.py (aucun import commun). Le
SPN géométrique ci-dessous est une construction de diversification de
clé pour le chiffrement DISQUE, sans rapport avec Carter, stegano_classic
ou secu_box. Ne pas migrer vers le format v3 sans revoir cette
architecture dans son ensemble (les 288/164 permutations distinctes
mesurées ci-dessous dépendent de la table PRÉ-v3 exacte).

ARCHITECTURE (suite à évaluation cryptologique externe) :

  Couche 1 — Géométrique (La Livrée d'Hermès) :
    Transforme le master_key en clé de session via le SPN géométrique.
    Referent 256 (S-box GF + permutation) + Referent 360 (permutation).
    Mesuré : la table Ref256 compte 12 288 entrées mais seulement 288
    permutations distinctes (les positions de chaque forme sont déjà triées
    dans le référent, donc _perm_from_seq efface l'identité de la forme :
    seul l'ordre des quadrants compte). Soit ~8 bits, non 13,6.
    Ref360 (complété à 360 formes) : 678 entrées pour 164 permutations
    distinctes (113 formes retenues sur 360, celles totalisant 24
    positions).
    Rôle : diversification de clé par construction géométrique originale.
    NON revendiqué comme chiffrement complet à lui seul.

  Couche 2 — Cryptographique standard :
    ChaCha20-Poly1305 (IETF RFC 8439, nonce 96 bits — c'est ce que fournit
    `cryptography`; ce n'est PAS XChaCha20, contrairement à ce qu'indiquaient
    les versions précédentes de ce fichier).
    Fournit : confidentialité + authentification + intégrité par secteur.
    Le nonce de 96 bits de chaque secteur est dérivé par HKDF d'un nonce
    global de 192 bits tiré au hasard par fichier, et la clé change à chaque
    secteur : la réutilisation de nonce reste hors de portée.

Format de sortie :
  [32B salt KDF][24B nonce global][secteurs chiffrés+auth][32B MAC global]

Propriétés démontrées :
  - Confidentialité : ChaCha20-Poly1305 (standard, éprouvé)
  - Authentification : Poly1305 par secteur (16B tag) + HMAC-SHA256 global
  - Diversification géométrique : clé de session dérivée via SPN Ref256+360
  - max_DDT S-box ≤ 4 [Nyberg 1994] — propriété de la couche géométrique
  - Nombre de branche de la couche de diffusion complète (P256→MDS→P360,
    différentiel et linéaire) : 5, prouvé par invariance du poids de
    Hamming aux permutations de position, vérifié sur des tirages réels
  - Borne de sentier large sur 4 tours : probabilité différentielle
    ≤ 2⁻⁶⁰, corrélation linéaire ≤ 2⁻²⁰ — sous l'hypothèse d'un
    attaquant à requêtes multiples sur permutation fixée, hypothèse plus
    forte que ce que l'usage réel exige (un seul point par secteur)

AVERTISSEMENT :
  La sécurité cryptographique effective repose sur ChaCha20-Poly1305,
  algorithme standard éprouvé. Le SPN géométrique est une couche de
  diversification de clé originale, non un chiffrement autonome certifié.
  La résistance du SPN comme PRP a été évaluée (cryptanalyse_spn.py, §8) :
  borne de sentier large prouvée sur la couche complète (voir ci-dessus),
  sondage empirique sans biais grossier détecté. La borne suppose un
  attaquant à requêtes multiples sur une permutation à paramètres fixés ;
  le protocole réel n'en offre jamais qu'une seule par secteur, ce qui
  rend la borne plus forte que ce que l'usage exige, sans en dépendre.
"""

import json, os, hmac as _hmac, hashlib, struct, itertools
from typing import List, Dict, Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes as _hashes

_DIR = os.path.dirname(os.path.abspath(__file__))

def _find_ref(name: str) -> str:
    for path in [
        os.path.join(_DIR, name),
        os.path.join(_DIR, 'data', name),
        os.path.join(os.path.dirname(_DIR), 'data', name),
    ]:
        if os.path.exists(path): return path
    raise FileNotFoundError(f"{name} introuvable")

SECTOR_SIZE  = 512
NONCE_SIZE   = 24   # nonce global 192 bits (le nonce AEAD par secteur en fait 96)
TAG_SIZE     = 16   # Poly1305
SALT_SIZE    = 32
MAC_SIZE     = 32   # HMAC-SHA256 global
N_ROUNDS     = 4
ALL_ORDERS   = list(itertools.permutations(range(4)))
COLOR_ORDERS = list(itertools.permutations(['C1','C2','C3']))
OFFSETS_12   = [(0,0),(0,6),(6,0),(6,6)]

# ── GF(2^8) ───────────────────────────────────────────────────────────────────
def _gf_mul(a: int, b: int) -> int:
    r = 0
    for _ in range(8):
        if b & 1: r ^= a
        hi = a & 0x80; a = (a << 1) & 0xff
        if hi: a ^= 0x1b
        b >>= 1
    return r

_GF_INV = [0]*256
for _x in range(1, 256):
    for _y in range(1, 256):
        if _gf_mul(_x, _y) == 1: _GF_INV[_x] = _y; break

def _gf2_matvec(M: List[int], x: int) -> int:
    r = 0
    for i, row in enumerate(M):
        r |= (bin(row & x).count('1') % 2) << i
    return r

def _gf2_inv(M: List[int]) -> Optional[List[int]]:
    n = 8
    rows = [(M[i] & 0xff) | ((1 << n) << i) for i in range(n)]
    for col in range(n):
        pivot = next((r for r in range(col, n) if (rows[r] >> col) & 1), -1)
        if pivot < 0: return None
        rows[col], rows[pivot] = rows[pivot], rows[col]
        for r in range(n):
            if r != col and (rows[r] >> col) & 1: rows[r] ^= rows[col]
    return [(rows[i] >> n) & 0xff for i in range(n)]

def _make_sbox_gf(seed: bytes) -> Tuple[List[int], List[int]]:
    """S(x) = M·GF_INV(x) ⊕ c, max_DDT ≤ 4 [Nyberg 1994]."""
    rng = hashlib.sha256(seed).digest() + hashlib.sha256(seed + b'x').digest()
    M = [0]*8
    for i in range(8):
        M[i] = 1 << i
        for j in range(i+1, 8):
            if (rng[i] >> (j-i-1)) & 1: M[i] |= (1 << j)
    const = rng[8]
    Mi = _gf2_inv(M)
    if Mi is None:
        raise ValueError("Matrice affine singulière")
    sbox     = [_gf2_matvec(M,  _GF_INV[x]) ^ const for x in range(256)]
    sbox_inv = [_GF_INV[_gf2_matvec(Mi, y ^ const)] for y in range(256)]
    return sbox, sbox_inv

# ── Chargement ────────────────────────────────────────────────────────────────
def load_referents() -> Tuple[List, List]:
    with open(_find_ref('referent_256.json')) as f: r256 = json.load(f)
    with open(_find_ref('referent_360.json')) as f: r360 = json.load(f)
    r360 = [f for f in r360
            if sum(len(p) for p in f['positions'].values()) == 24]
    return r256, r360

# ── Tables de permutation ─────────────────────────────────────────────────────
def _perm_from_seq(seq: List[int]) -> Tuple[List, List]:
    if len(seq) != 24:
        raise ValueError(f"Séquence {len(seq)} positions, attendu 24")
    P = sorted(range(24), key=lambda i: seq[i])
    Pi = [0]*24
    for i, p in enumerate(P): Pi[p] = i
    return P, Pi

def build_perm_table_256(ref256: List[Dict]) -> Dict:
    t = {}
    for form in ref256:
        for oi, order in enumerate(ALL_ORDERS):
            for col, ck in [(0,'blue'), (1,'orange')]:
                seq = []
                for slot in order:
                    dr, dc = OFFSETS_12[slot]
                    for r, c in form[ck]:
                        seq.append((r + dr) * 12 + (c + dc))
                t[(form['id'], oi, col)] = _perm_from_seq(seq)
    return t

def build_perm_table_360(ref360: List[Dict]) -> Dict:
    t = {}
    for i, form in enumerate(ref360):
        for oi, co in enumerate(COLOR_ORDERS):
            seq = []
            for col in co:
                for r, c in form['positions'].get(col, []):
                    seq.append(r * 12 + c)
            if len(seq) == 24:
                t[(i, oi)] = _perm_from_seq(seq)
    return t

# ── MixBlock MDS — ShiftRows + MixColumns AES ────────────────────────────────
# Matrice MDS 4×4 sur GF(2^8) [AES MixColumns, Daemen & Rijmen 2002]
# Branch number mesuré >= 4 sur notre structure 4x6
_MDS     = [[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]]
_MDS_INV = [[14,11,13,9],[9,14,11,13],[13,9,14,11],[11,13,9,14]]

def _shift_rows(data: bytes) -> bytes:
    """Decalage cyclique des lignes de la matrice 4x6 (modele AES ShiftRows)."""
    r = bytearray(24)
    for row in range(4):
        for col in range(6):
            r[row*6 + col] = data[row*6 + (col + row) % 6]
    return bytes(r)

def _unshift_rows(data: bytes) -> bytes:
    r = bytearray(24)
    for row in range(4):
        for col in range(6):
            r[row*6 + (col + row) % 6] = data[row*6 + col]
    return bytes(r)

def _mix_cols(data: bytes) -> bytes:
    """Multiplication MDS sur chacune des 6 colonnes de la matrice 4x6."""
    r = bytearray(24)
    for col in range(6):
        v = [data[row*6 + col] for row in range(4)]
        for row in range(4):
            x = 0
            for k in range(4): x ^= _gf_mul(_MDS[row][k], v[k])
            r[row*6 + col] = x
    return bytes(r)

def _unmix_cols(data: bytes) -> bytes:
    r = bytearray(24)
    for col in range(6):
        v = [data[row*6 + col] for row in range(4)]
        for row in range(4):
            x = 0
            for k in range(4): x ^= _gf_mul(_MDS_INV[row][k], v[k])
            r[row*6 + col] = x
    return bytes(r)

def _mix(data: bytes) -> bytes:
    """ShiftRows + MixColumns MDS. Fondement: MDS prouvee sur GF(2^8)."""
    return _mix_cols(_shift_rows(data))

def _unmix(data: bytes) -> bytes:
    """Inverse exact : MixColumns_inv + ShiftRows_inv."""
    return _unshift_rows(_unmix_cols(data))

# ── Couche géométrique : diversification de clé ───────────────────────────────
def _geo_derive(master_key: bytes, nonce: bytes, sn: int,
                pt256: Dict, pt360: Dict, pt360_keys: List,
                n360: int, n_rounds: int) -> bytes:
    """
    Applique le SPN géométrique pour dériver une clé de session 32B.
    Rôle : diversification de clé, pas chiffrement direct.
    L'entrée est master_key (32B), la sortie est session_key (32B).
    """
    # Bloc d'entrée : XOR de master_key avec nonce+secteur
    block = bytearray(32)
    seed_material = nonce + struct.pack('>Q', sn)
    h = hashlib.sha256(seed_material).digest()
    for i in range(32):
        block[i] = master_key[i] ^ h[i % 16 + (i // 16) * 16]

    # Appliquer le SPN sur deux chunks de 24B issus du bloc
    result = bytearray(32)
    for chunk_i in range(2):
        # Chevauchement intentionnel : chunk 0 = block[0:24], chunk 1 =
        # block[12:36]. Les deux chunks se recouvrent sur 12 octets
        # (block[12:24]), pour que chaque octet du bloc d'entrée influence
        # les deux chunks.
        # SPN-4 (audit G. Kerma) : block fait 32 octets, donc chunk 1 =
        # block[12:36] ne rend que 20 octets réels (block[12:32]) ; les 4
        # octets suivants (block[32:36]) n'existent pas et sont remplis de
        # zéros ci-dessous. Ces 4 octets nuls n'apportent aucune entropie
        # supplémentaire au second passage. Impact : nul sur la sécurité
        # (la sortie de 32 octets reste dérivée des 32 octets d'entrée via
        # le premier chunk). Documenté ici pour éviter toute ambiguïté.
        chunk = bytes(block[chunk_i*12:chunk_i*12+24])  # overlap voulu
        if len(chunk) < 24: chunk = chunk + bytes(24 - len(chunk))
        data = bytes(chunk[:24])
        for rnd in range(n_rounds):
            salt = struct.pack('>QII', sn, chunk_i, rnd) + nonce[:8]
            dk = hashlib.sha256(master_key + salt).digest()
            cfg = dk[0] % 256; oi = struct.unpack('>H',dk[1:3])[0] % 24
            col = dk[3] & 1
            idx360 = dk[4] % n360; oi360 = dk[5] % 6
            seed = hashlib.sha256(master_key + salt + bytes([cfg])).digest()
            sbox, _ = _make_sbox_gf(seed)
            P256, _ = pt256[(cfg, oi, col)]
            key360  = (idx360, oi360)
            if key360 not in pt360:
                key360 = pt360_keys[idx360 % len(pt360_keys)]
            P360, _ = pt360[key360]
            sub  = bytes(sbox[b] for b in data)
            p256 = bytes(sub[P256[i]] for i in range(24))
            mx   = _mix(p256)
            data = bytes(mx[P360[i]] for i in range(24))
        result[chunk_i*16:chunk_i*16+16] = data[:16]

    return bytes(result)

# ── Clé du MAC global ─────────────────────────────────────────────────────────
def _mac_key(geo_key: bytes, salt: bytes) -> bytes:
    """
    Clé HMAC dédiée, dérivée de la clé passée au KDF — jamais master_key brute.
    Domaine séparé des clés de session (info distinct).
    """
    return HKDF(
        algorithm=_hashes.SHA256(), length=32, salt=salt,
        info=b'GeoSPN-global-mac-v2',
    ).derive(geo_key)

# ── API publique ──────────────────────────────────────────────────────────────
class GeoSPN:
    """
    Chiffrement hybride : diversification géométrique + ChaCha20-Poly1305.
    Authentification par secteur (Poly1305) + globale (HMAC-SHA256).
    """
    def __init__(self, ref256: List[Dict], ref360: List[Dict],
                 n_rounds: int = N_ROUNDS):
        if n_rounds < 1:
            raise ValueError("n_rounds doit être ≥ 1")
        self.n_rounds    = n_rounds
        self.n360        = len(ref360)
        self.pt256       = build_perm_table_256(ref256)
        self.pt360       = build_perm_table_360(ref360)
        self.pt360_keys  = sorted(self.pt360.keys())
        if not self.pt360_keys:
            raise ValueError("Aucune forme Ref360 complète trouvée")

    def _sector_nonce(self, global_nonce: bytes, sector_num: int) -> bytes:
        """Nonce unique par secteur : HKDF(global_nonce + secteur)."""
        hkdf = HKDF(
            algorithm=_hashes.SHA256(),
            length=NONCE_SIZE,
            salt=struct.pack('>Q', sector_num),
            info=b'GeoSPN-sector-nonce',
        )
        return hkdf.derive(global_nonce)

    def encrypt(self, data: bytes, master_key: bytes) -> bytes:
        """
        Chiffre des données arbitraires.
        Format : [32B salt][24B nonce][secteurs auth-chiffrés][32B HMAC global]
        Chaque secteur = ChaCha20-Poly1305 avec clé dérivée géométriquement.
        """
        salt         = os.urandom(SALT_SIZE)
        global_nonce = os.urandom(NONCE_SIZE)

        # KDF moderne : 300 000 itérations
        geo_key = hashlib.pbkdf2_hmac(
            'sha256', master_key, salt, iterations=300_000, dklen=32)

        olen   = len(data)
        header = struct.pack('>Q', olen)
        padded = header + data
        pad    = (SECTOR_SIZE - len(padded) % SECTOR_SIZE) % SECTOR_SIZE
        padded = padded + bytes(pad)

        ciphertext = bytearray()
        for s in range(len(padded) // SECTOR_SIZE):
            sector = padded[s*SECTOR_SIZE:(s+1)*SECTOR_SIZE]
            # Clé de session géométrique par secteur
            session_key = _geo_derive(
                geo_key, global_nonce, s,
                self.pt256, self.pt360, self.pt360_keys,
                self.n360, self.n_rounds)
            # Nonce secteur unique
            sector_nonce = self._sector_nonce(global_nonce, s)[:12]  # ChaCha20 = 96 bits
            # ChaCha20-Poly1305 (RFC 8439)
            aad = struct.pack('>Q', s) + global_nonce
            enc = ChaCha20Poly1305(session_key).encrypt(
                sector_nonce, sector, aad)
            ciphertext.extend(enc)

        payload = salt + global_nonce + bytes(ciphertext)
        mac = _hmac.new(_mac_key(geo_key, salt), payload,
                        hashlib.sha256).digest()
        return payload + mac

    def decrypt(self, data: bytes, master_key: bytes) -> bytes:
        """Déchiffre. Lève ValueError si MAC ou tag secteur invalide."""
        if len(data) < SALT_SIZE + NONCE_SIZE + MAC_SIZE:
            raise ValueError("Données trop courtes")
        mac_recv = data[-MAC_SIZE:]
        payload  = data[:-MAC_SIZE]

        salt         = payload[:SALT_SIZE]
        global_nonce = payload[SALT_SIZE:SALT_SIZE+NONCE_SIZE]
        ciphertext   = payload[SALT_SIZE+NONCE_SIZE:]

        # Le KDF est appliqué AVANT toute vérification : le MAC global est
        # keyé par une clé dérivée, jamais par master_key brute. Sans cela,
        # un attaquant hors ligne testerait les passphrases contre le MAC
        # au coût d'un HMAC (~5 us) au lieu du PBKDF2 300 000 (~200 ms).
        geo_key = hashlib.pbkdf2_hmac(
            'sha256', master_key, salt, iterations=300_000, dklen=32)

        mac_calc = _hmac.new(_mac_key(geo_key, salt), payload,
                             hashlib.sha256).digest()
        if not _hmac.compare_digest(mac_recv, mac_calc):
            raise ValueError("MAC global invalide — données altérées ou clé incorrecte")

        # Taille d'un secteur chiffré = SECTOR_SIZE + TAG_SIZE (Poly1305)
        sector_enc_size = SECTOR_SIZE + TAG_SIZE
        if len(ciphertext) % sector_enc_size != 0:
            raise ValueError("Longueur ciphertext invalide")

        plaintext = bytearray()
        for s in range(len(ciphertext) // sector_enc_size):
            enc_sector = ciphertext[s*sector_enc_size:(s+1)*sector_enc_size]
            session_key  = _geo_derive(
                geo_key, global_nonce, s,
                self.pt256, self.pt360, self.pt360_keys,
                self.n360, self.n_rounds)
            sector_nonce = self._sector_nonce(global_nonce, s)[:12]
            aad = struct.pack('>Q', s) + global_nonce
            try:
                dec = ChaCha20Poly1305(session_key).decrypt(
                    sector_nonce, enc_sector, aad)
            except Exception:
                raise ValueError(f"Tag Poly1305 invalide au secteur {s}")
            plaintext.extend(dec)

        olen = struct.unpack('>Q', plaintext[:8])[0]
        return bytes(plaintext[8:8+olen])

    def description(self) -> str:
        return (
            "Chiffrement hybride : diversification géométrique GeoSPN "
            f"(Ref256+Ref360, {self.n_rounds} tours, max_DDT≤4) "
            "suivie de ChaCha20-Poly1305 (RFC 8439) par secteur. "
            "Authentification : Poly1305 par secteur + HMAC-SHA256 global. "
            "KDF : PBKDF2-SHA256, 300 000 itérations. "
            "NON revendiqué comme chiffrement autonome certifié ; "
            "la couche géométrique est une diversification de clé originale."
        )

# ── Clé maître ────────────────────────────────────────────────────────────────
def passphrase_to_key(passphrase: str,
                      salt: Optional[bytes] = None) -> Tuple[bytes, bytes]:
    """
    Dérive une clé maître 32B depuis une passphrase.
    Retourne (key, salt). Salt aléatoire (32B) si non fourni.
    KDF : PBKDF2-SHA256, 300 000 itérations.
    """
    if salt is None:
        salt = os.urandom(SALT_SIZE)
    elif len(salt) < 16:
        raise ValueError("Salt trop court (minimum 16 bytes)")
    key = hashlib.pbkdf2_hmac(
        'sha256', passphrase.encode('utf-8'),
        salt, iterations=300_000, dklen=32)
    return key, salt

# ── Démo ──────────────────────────────────────────────────────────────────────
def demo():
    print("=== GeoSPN + ChaCha20-Poly1305 — La Livrée d'Hermès ===\n")
    print("Architecture : diversification géométrique + chiffrement standard\n")

    ref256, ref360 = load_referents()
    spn = GeoSPN(ref256, ref360)
    print(spn.description()); print()

    mk, salt = passphrase_to_key("LaLivreeDHermes2026")
    print(f"Clé maître : {mk.hex()[:32]}... (PBKDF2 300k itérations)\n")

    msg = b"ANIBAL EDELBERTO AMIOT - LA LIVREE D'HERMES - BREVET FR2865054" * 10
    print(f"Message : {len(msg)} bytes")

    enc = spn.encrypt(msg, mk)
    dec = spn.decrypt(enc, mk)
    if msg != dec:
        raise ValueError("ERREUR déchiffrement")
    print(f"Chiffré  : {len(enc)} bytes")
    print(f"Déchiffré : '{dec[:50].decode()}...' ✓")

    # Test intégrité
    tampered = bytearray(enc); tampered[SALT_SIZE + NONCE_SIZE + 20] ^= 1
    try:
        spn.decrypt(bytes(tampered), mk)
        raise AssertionError("Intégrité non vérifiée !")
    except ValueError as e:
        print(f"Intégrité : altération détectée ✓ ({e})")

    # Mauvaise clé
    mk2, _ = passphrase_to_key("MauvaisMotDePasse", salt)
    try:
        spn.decrypt(enc, mk2)
        raise AssertionError("Mauvaise clé non détectée !")
    except ValueError as e:
        print(f"Mauvaise clé : détectée ✓ ({e})")

    print(f"\n=== PROPRIÉTÉS ===")
    print(f"  Confidentialité     : ChaCha20-Poly1305 (RFC 8439)")
    print(f"  Auth par secteur    : Poly1305 (16B tag)")
    print(f"  Auth globale        : HMAC-SHA256 (32B)")
    print(f"  KDF                 : PBKDF2-SHA256, 300 000 itérations")
    print(f"  Nonce global        : os.urandom(24B), nonce/secteur 12B")
    print(f"  Nonce/secteur       : HKDF(global_nonce, secteur)")
    print(f"  Couche géométrique  : diversification clé via SPN Ref256+Ref360")
    print(f"  max_DDT S-box       : ≤ 4 [Nyberg 1994]")
    print(f"\n  Sécurité effective  : ChaCha20-Poly1305 (standard éprouvé)")
    print(f"  Apport géométrique  : diversification de clé originale,")
    print(f"                        résistance formelle à évaluer")

if __name__ == '__main__':
    demo()
