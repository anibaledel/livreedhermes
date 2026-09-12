# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
# Geometric constructions: IACR ePrint 2026 (CC BY) — Patent: FR2865054
"""
stegano_classic.py — Méthode stéganographique classique (Référent 256)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Extrait de stegano_lib.py (refactor de modularisation) : encodage/décodage
par clés B/C/2 (taille de bloc, orientations, forme+couleur), sans la
grammaire Carter (voir carter.py). La couche cryptographique est dans
crypto_core.py.

ARCHITECTURE :
  Couche 1 — ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5) : message chiffré AVANT dissimulation.
  Couche 2 — Dissimulation géométrique : chiffré placé aux positions
             définies par les clés B, C, 2.

NOTE AUDIT : Clé A retirée (redondante avec Clé 2, 0 bit ajouté).
"""

import json, os, secrets, math
from typing import List, Dict, Tuple

from crypto_core import (
    ALPHA_LEN, _encrypt, _decrypt, payload_to_symbols, max_message_for, random_grid,
)

def _find_ref(name: str) -> str:
    _dir = os.path.dirname(os.path.abspath(__file__))
    for path in [
        os.path.join(_dir, name),
        os.path.join(_dir, 'data', name),
        os.path.join(os.path.dirname(_dir), 'data', name),
    ]:
        if os.path.exists(path): return path
    raise FileNotFoundError(f"{name} introuvable")

def load_referents() -> Tuple[List, List]:
    """
    TODO v3-format : cohabitation avec load_referent_256_v3() (nouveau,
    ci-dessous) et le futur chargeur v3 du Référent 360 -- ce chargeur
    reste sur l'ancien schéma referent_256.json (blue/orange, 6+6 cases)
    tant que TOUS ses appelants n'ont pas migré vers la nouvelle règle de
    lecture (rouge+bleu ensemble, 12 cases stégano ; le « 36 en crypto »
    de la règle ne s'applique PAS ici -- décision de l'auteur, 2026-09-12 :
    il ne concerne que le mode crypto de secu_box, pas les blocs stégano
    de Carter/Random/18/Hybrid, qui restent bruit CSPRNG non structuré
    pour pure/structured, inchangé). Appelants restants sous l'ancien
    schéma au 2026-09-12 :
      - grid_90.py : mis de côté (décision de l'auteur, 2026-09-12), PAS
        migré pour l'instant -- garde CET appelant vivant tant que sa
        décision finale (garder/migrer/abandonner) n'est pas prise. Ses
        tests (test_regression.py, classe G) doivent rester au vert à
        chaque étape du câblage ; signaler immédiatement toute casse.
      - stegano_classic.encode/decode/make_keys/compute_keyspace (étape
        8, pas encore faite).
      - secu_box._km_to_keys/Session, mode « classique » (étape 5 bis,
        pas encore faite).
      - disk_lib.py/cryptanalyse_spn.py (hors périmètre, S-box de
        chiffrement disque sans rapport).
    Objectif final : UN SEUL chargeur si/quand grid_90.py migre ou est
    abandonné -- sinon cette fonction reste nécessaire pour lui seul.

    Chargeur UNIQUE du Référent 256 et du Référent 360 (2026-09-12) : avant
    ce commit, carter.py maintenait son propre second chargeur pour le 360
    (_load_ref360()) qui filtrait aux formes complètes (3×8=24 positions),
    tandis que CETTE fonction renvoyait les 360 formes brutes du fichier —
    dont 247 sont des formes à 1 ou 2 couleurs disponibles (8 ou 16
    positions seulement), qui rendent 0 position pour toute couleur
    absente. Tout appelant passant par CETTE fonction (vectors_internal.py,
    benchmark.py) recevait donc un référent 360 dégradé par rapport à celui
    utilisé par défaut par encode_carter_360()/encode_carter_mix() — un
    écart mesuré à ~43% de capacité en moins, et une capacité annoncée par
    C_PUB largement inatteignable pour ce chargeur (voir docs/
    PAPER_NUMBERS_v3.md). Le filtre est maintenant appliqué ICI, dans
    l'UNIQUE chargeur du dépôt — carter.py n'a plus le sien.
    """
    with open(_find_ref('referent_256.json')) as f: r256 = json.load(f)
    with open(_find_ref('referent_360.json')) as f: raw360 = json.load(f)
    r360 = [f for f in raw360
            if (isinstance(f['positions'], dict) and
                sum(len(v) for v in f['positions'].values()) == 24)]
    return r256, r360

def load_referent_360_v3() -> Dict:
    """
    Chargeur du Référent 360 au format v3 (data/referent_360_v3.json --
    360 calques, niveaux/LAYER_OF, colors=[violet,magenta,orange],
    stegano_colors=[violet], c_pub calibré). NOUVEAU (câblage production,
    2026-09-12) : cohabite TEMPORAIREMENT avec load_referents() ci-dessus
    tant que Carter-Mix (étape 4) n'a pas migré. Utilisé par carter.py
    (Carter-360) dès l'étape 3 du câblage."""
    with open(_find_ref('referent_360_v3.json')) as f:
        return json.load(f)

def load_referent_256_v3() -> Dict:
    """
    Chargeur du Référent 256 au format v3 (data/referent_256_v3.json --
    36 cases, colors=[rouge,bleu,vert,jaune], stegano_colors=[rouge,bleu],
    c_pub calibré). NOUVEAU (câblage production, 2026-09-12) : cohabite
    TEMPORAIREMENT avec load_referents() ci-dessus (voir son TODO
    v3-format) tant que tous les appelants n'ont pas migré vers la
    nouvelle règle de lecture. Utilisé par carter.py (Carter-256, Carter-
    Mix) dès l'étape 2 du câblage ; stegano_classic.encode/decode y
    migreront à l'étape 8."""
    with open(_find_ref('referent_256_v3.json')) as f:
        return json.load(f)

# ── Orientations D4 ──────────────────────────────────────────────────────────
ORIENTATIONS = [
    lambda r,c,n: (r,   c  ),
    lambda r,c,n: (c,   n-r),
    lambda r,c,n: (n-r, n-c),
    lambda r,c,n: (n-c, r  ),
    lambda r,c,n: (r,   n-c),
    lambda r,c,n: (n-r, c  ),
    lambda r,c,n: (c,   r  ),
    lambda r,c,n: (n-c, n-r),
]

def apply_orientation(positions: List, orient: int, grid_n: int = 5) -> List:
    t = ORIENTATIONS[orient % 8]
    return [t(r, c, grid_n) for r, c in positions]

VALID_K = frozenset({1, 2, 3, 5})

def _chk_k(k: int) -> None:
    if k not in VALID_K:
        raise ValueError(f"k={k} invalide. Valeurs autorisées : {sorted(VALID_K)}")

def zigzag_blocks(B: int) -> List[Tuple[int,int]]:
    order = []
    for r in range(B):
        cols = range(B-1,-1,-1) if r%2==0 else range(B)
        for c in cols: order.append((r, c))
    return order

# ── Capacité ─────────────────────────────────────────────────────────────────
def _classic_n_pos(key_b: List[int], grid_size: int) -> int:
    """Nombre de positions message que encode()/decode() liront réellement pour ces clés."""
    B = grid_size // 6
    order = zigzag_blocks(B)
    n_pos = 0; pos_i = 0
    for k in key_b:
        if pos_i >= len(order): break
        available = min(k*k, len(order) - pos_i)
        n_pos += available * 6; pos_i += available
    return n_pos

def max_message_len(key_b: List[int], grid_size: int = 60) -> int:
    """
    Longueur max du message en clair, en OCTETS UTF-8 (pas en caractères —
    voir crypto_core._message_to_bytes). Charge utile à longueur fixe
    (format v3, tâche 2) : max_message_for() calcule directement la réponse
    exacte depuis le nombre de positions, plus besoin de recherche binaire
    locale.
    """
    return max_message_for(_classic_n_pos(key_b, grid_size))

# ── Encodeur ─────────────────────────────────────────────────────────────────
def encode(message: str, steg_key: bytes,
           key_b: List[int], key_c: List[List[int]], key_2: List[Dict],
           ref256: List[Dict], grid_size: int = 60,
           _nonce: bytes = None, _y: int = None,
           _leftover: List[int] = None, _noise_seed: bytes = None) -> List[List[int]]:
    """
    _nonce/_y/_leftover/_noise_seed (préfixés `_`, tâche 7) : injection
    interne pour le mode vecteurs — voir carter.encode_carter(). None
    (défaut) préserve exactement le comportement actuel.
    """
    for k in key_b: _chk_k(k)
    N = grid_size; B = N // 6
    if N % 6 != 0:
        raise ValueError(f"grid_size {N} doit être multiple de 6")
    n_pos = _classic_n_pos(key_b, grid_size)
    max_len = max_message_for(n_pos)   # en octets UTF-8, voir crypto_core._message_to_bytes
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > max_len:
        raise ValueError(f"Message trop long : {msg_bytes_len} > {max_len} octets")

    payload = _encrypt(message, steg_key, n_pos, _nonce=_nonce)
    # Charge utile à longueur fixe (format v3, tâche 2) : toutes les
    # positions message portent un symbole de charge utile, en symboles
    # base-44 uniformes — aucun en-tête distinct.
    nibbles = payload_to_symbols(payload, n_pos, _y=_y, _leftover=_leftover)

    # Grille de bruit — même loi uniforme [0..ALPHA_LEN-1] que les symboles.
    # random_grid() (crypto_core) plutôt qu'une boucle secrets.randbelow()
    # locale : unifie le remplissage de bruit sur un seul point d'injection
    # (_noise_seed, tâche 7) au lieu d'en dupliquer un second ici.
    grid = random_grid(N, N, _noise_seed=_noise_seed)

    # Placer les nibbles
    nib_idx = 0
    order = zigzag_blocks(B)
    pos_i = 0; block_i = 0

    while pos_i < len(order) and nib_idx < len(nibbles) and block_i < len(key_b):
        k = key_b[block_i]; fk = key_2[block_i]; orients = key_c[block_i]
        form = ref256[fk['form_id'] % len(ref256)]
        base_pos = form[fk.get('color', 'blue')]
        for sub in range(k*k):
            if pos_i >= len(order) or nib_idx >= len(nibbles): break
            br, bc = order[pos_i]
            t = apply_orientation(base_pos, orients[sub % len(orients)])
            for r, c in t:
                if nib_idx >= len(nibbles): break
                gr, gc = br*6+r, bc*6+c
                if 0 <= gr < N and 0 <= gc < N:
                    grid[gr][gc] = nibbles[nib_idx]; nib_idx += 1
            pos_i += 1
        block_i += 1
    return grid

# ── Décodeur ─────────────────────────────────────────────────────────────────
def decode(grid: List[List[int]], steg_key: bytes,
           key_b: List[int], key_c: List[List[int]], key_2: List[Dict],
           ref256: List[Dict], grid_size: int = 60) -> str:
    for k in key_b: _chk_k(k)
    N = grid_size; B = N // 6
    vals = []; order = zigzag_blocks(B); pos_i = 0; block_i = 0
    while pos_i < len(order) and block_i < len(key_b):
        k = key_b[block_i]; fk = key_2[block_i]; orients = key_c[block_i]
        form = ref256[fk['form_id'] % len(ref256)]
        base_pos = form[fk.get('color', 'blue')]
        for sub in range(k*k):
            if pos_i >= len(order): break
            br, bc = order[pos_i]
            t = apply_orientation(base_pos, orients[sub % len(orients)])
            for r, c in t:
                gr, gc = br*6+r, bc*6+c
                if 0 <= gr < N and 0 <= gc < N:
                    vals.append(grid[gr][gc])
            pos_i += 1
        block_i += 1
    return _decrypt(vals, steg_key, len(vals))

# ── Clés ─────────────────────────────────────────────────────────────────────
def make_keys(msg_len: int, ref256: List[Dict],
              grid_size: int = 60, block_size: int = 1) -> Tuple:
    """msg_len : longueur du message en OCTETS UTF-8 (len(message.encode('utf-8')),
    pas len(message)) — voir crypto_core._message_to_bytes."""
    if block_size not in VALID_K:
        raise ValueError(f"block_size={block_size} invalide")
    B = grid_size // 6; n_blocks = B * B
    steg_key = secrets.token_bytes(32)
    key_b = [block_size]*n_blocks
    key_c = [[secrets.randbelow(8) for _ in range(block_size**2)]
              for _ in range(n_blocks)]
    key_2 = [{'form_id': secrets.randbelow(len(ref256)),
               'color': secrets.choice(['blue','orange'])}
              for _ in range(n_blocks)]
    max_len = max_message_len(key_b, grid_size)
    if msg_len > max_len:
        raise ValueError(f"Message {msg_len} > capacité {max_len}")
    return steg_key, key_b, key_c, key_2

def compute_keyspace(key_b: List[int], ref256: List[Dict]) -> Dict:
    n_blocks = len(key_b); n_sub = sum(k**2 for k in key_b)
    return {
        'steg_key'    : '256 bits (ChaCha20-HKDF)',
        'key_B_bits'  : round(math.log2(4)*n_blocks),
        'key_C_bits'  : round(math.log2(8)*n_sub),
        'key_2_bits'  : round(math.log2(len(ref256)*2)*n_blocks),
        'key_A'       : 'Retirée — redondante avec Clé 2 (audit 2026-09-10)',
        'note'        : 'Confidentialité = ChaCha20-HKDF (256 bits effectifs)',
    }

def grid_to_csv(g): return '\n'.join(','.join(str(v) for v in r) for r in g)
def csv_to_grid(s): return [[int(v) for v in r.split(',')]
                             for r in s.strip().split('\n')]

def demo():
    print("=== STÉGANOGRAPHIE GÉOMÉTRIQUE — La Livrée d'Hermès ===\n")
    ref256, _ = load_referents()
    message = "ANIBALAMIOTX"
    sk, kb, kc, k2 = make_keys(len(message.encode('utf-8')), ref256, grid_size=60)
    grid = encode(message, sk, kb, kc, k2, ref256)
    decoded = decode(grid, sk, kb, kc, k2, ref256)
    print(f"Message : '{message}' | Décodé : '{decoded}' | OK : {decoded==message}")
    # Mauvaise clé
    try:
        decode(grid, secrets.token_bytes(32), kb, kc, k2, ref256)
    except ValueError as e:
        print(f"Mauvaise clé : {e} ✓")
    # Anti-distingueur S4
    flat = [v for row in grid for v in row]
    zeros = flat.count(0)
    print(f"Valeurs 0 dans la grille : {zeros} (bruit inclus — pas de distingueur trivial)")
    ks = compute_keyspace(kb, ref256)
    print(f"\nEspace de clés (honnête) :")
    for k,v in ks.items(): print(f"  {k:<14} : {v}")
    print(f"\nCapacité max (k=1, 60×60) : {max_message_len(kb,60)} caractères")

if __name__ == '__main__':
    demo()
