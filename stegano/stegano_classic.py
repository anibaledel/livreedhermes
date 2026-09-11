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
    ALPHA_LEN, _encrypt, _decrypt, payload_to_symbols,
    _SYM_HEADER, _sym_count, _AEAD_OVERHEAD,
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
    with open(_find_ref('referent_256.json')) as f: r256 = json.load(f)
    with open(_find_ref('referent_360.json')) as f: r360 = json.load(f)
    return r256, r360

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
def max_message_len(key_b: List[int], grid_size: int = 60) -> int:
    """Longueur max du message en clair (bytes disponibles - overhead AEAD)."""
    B = grid_size // 6
    order = zigzag_blocks(B)
    n_pos = 0; pos_i = 0
    for k in key_b:
        if pos_i >= len(order): break
        available = min(k*k, len(order) - pos_i)
        n_pos += available * 6; pos_i += available
    # CORRECTIF AUDIT : l'ancien calcul comptait un surcoût de 32 octets alors
    # que le format en consomme 72 (32 commitment + 24 nonce + 16 tag). Un
    # message de la taille annoncée était accepté à l'encodage, tronqué
    # silencieusement faute de positions, puis irrécupérable au décodage.
    avail = n_pos - _SYM_HEADER
    lo, hi = 0, max(0, avail)
    while lo < hi:                      # plus grand payload tenant dans avail
        mid = (lo + hi + 1) // 2
        if _sym_count(mid) <= avail: lo = mid
        else: hi = mid - 1
    return max(0, lo - _AEAD_OVERHEAD)

# ── Encodeur ─────────────────────────────────────────────────────────────────
def encode(message: str, steg_key: bytes,
           key_b: List[int], key_c: List[List[int]], key_2: List[Dict],
           ref256: List[Dict], grid_size: int = 60) -> List[List[int]]:
    for k in key_b: _chk_k(k)
    N = grid_size; B = N // 6
    if N % 6 != 0:
        raise ValueError(f"grid_size {N} doit être multiple de 6")
    max_len = max_message_len(key_b, grid_size)
    if len(message) > max_len:
        raise ValueError(f"Message trop long : {len(message)} > {max_len}")

    payload = _encrypt(message, steg_key)
    # En-tête (longueur) + payload, en symboles base-44 uniformes
    nibbles = payload_to_symbols(payload)

    # Grille de bruit — même loi uniforme [0..ALPHA_LEN-1] que les symboles
    grid = [[secrets.randbelow(ALPHA_LEN) for _ in range(N)] for _ in range(N)]

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
    return _decrypt(vals, steg_key)

# ── Clés ─────────────────────────────────────────────────────────────────────
def make_keys(msg_len: int, ref256: List[Dict],
              grid_size: int = 60, block_size: int = 1) -> Tuple:
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
    sk, kb, kc, k2 = make_keys(len(message), ref256, grid_size=60)
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
