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
from sweep import derive_sweep_index, crypto_reading_order

def _find_ref(name: str) -> str:
    _dir = os.path.dirname(os.path.abspath(__file__))
    for path in [
        os.path.join(_dir, name),
        os.path.join(_dir, 'data', name),
        os.path.join(os.path.dirname(_dir), 'data', name),
    ]:
        if os.path.exists(path): return path
    raise FileNotFoundError(f"{name} introuvable")

def load_referent_360_v3() -> Dict:
    """
    Chargeur du Référent 360 au format v3 (data/referent_360_v3.json --
    360 calques, niveaux/LAYER_OF, colors=[violet,magenta,orange],
    stegano_colors=[violet], c_pub calibré). Chargeur UNIQUE du Référent
    360 dans tout le dépôt (hors disk_lib.py/cryptanalyse_spn.py, qui
    lisent directement l'ancien referent_360.json pour un usage sans
    rapport — S-box de chiffrement disque, voir leur propre
    load_referents()).

    Avant le câblage production (2026-09-12), carter.py maintenait son
    propre second chargeur pour le 360 (_load_ref360()) qui filtrait aux
    formes complètes (3×8=24 positions), tandis que l'ancien
    stegano_classic.load_referents() (supprimé depuis — grid_90.py, son
    dernier appelant réel, est sorti du chemin de production le
    2026-09-12, voir stegano/legacy/grid_90.py) renvoyait les 360 formes
    brutes du fichier — dont 247 sont des formes à 1 ou 2 couleurs
    disponibles (8 ou 16 positions seulement), qui rendent 0 position pour
    toute couleur absente. Le filtre est appliqué ICI, dans le chargeur v3."""
    with open(_find_ref('referent_360_v3.json')) as f:
        return json.load(f)

def load_referent_256_v3() -> Dict:
    """
    Chargeur du Référent 256 au format v3 (data/referent_256_v3.json --
    36 cases, colors=[rouge,bleu,vert,jaune], stegano_colors=[rouge,bleu],
    c_pub calibré). Chargeur UNIQUE du Référent 256 dans tout le dépôt
    (hors disk_lib.py/cryptanalyse_spn.py, qui lisent directement l'ancien
    referent_256.json pour un usage sans rapport — S-box de chiffrement
    disque, voir leur propre load_referents() — et stegano/legacy/grid_90.py,
    sorti du chemin de production le 2026-09-12, qui garde sa propre copie
    minimale de l'ancien chargeur pour rester lisible isolément). Utilisé
    par carter.py (Carter-256, Carter-Mix), stegano_classic.encode/decode
    et secu_box.py (mode classique et mode déni)."""
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
    """Nombre de positions message que encode()/decode() liront réellement
    pour ces clés. 12 positions/sous-bloc 6×6 (règle v3, câblage
    production étape 6 -- rouge+bleu ensemble, remplace les 6 positions
    d'une seule couleur d'avant ce commit)."""
    B = grid_size // 6
    order = zigzag_blocks(B)
    n_pos = 0; pos_i = 0
    for k in key_b:
        if pos_i >= len(order): break
        available = min(k*k, len(order) - pos_i)
        n_pos += available * 12; pos_i += available
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
           key_b: List[int], key_2: List[Dict],
           ref256: Dict, grid_size: int = 60,
           _nonce: bytes = None, _y: int = None,
           _leftover: List[int] = None, _noise_seed: bytes = None) -> List[List[int]]:
    """
    Câblage production étape 6 (2026-09-12) : positions stégano = rouge+
    bleu ENSEMBLE (12/sous-bloc, référent v3 -- data/referent_256_v3.json),
    triées par balayage (une seule dérivation par couleur pour tout
    l'appel, depuis steg_key, jamais retirée par sous-bloc -- voir
    stegano/sweep.py). Plus de Clé C (orientations D4) : le référent v3
    encode déjà des positions absolues, aucune rotation/réflexion n'a de
    rôle à jouer -- retirée du triplet de clés (devenu B/2), comme
    l'orientation a disparu de la grammaire Carter-256 (étape 2).
    Un même form_id (Clé 2) est appliqué IDENTIQUEMENT à chacun des k²
    sous-blocs d'un bloc k×k (comme avant ce commit).

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

    stegano_colors = ref256['stegano_colors']
    sweep_of_color = {c: derive_sweep_index(steg_key, c) for c in stegano_colors}

    # Placer les nibbles
    nib_idx = 0
    order = zigzag_blocks(B)
    pos_i = 0; block_i = 0

    while pos_i < len(order) and nib_idx < len(nibbles) and block_i < len(key_b):
        k = key_b[block_i]; fk = key_2[block_i]
        form = ref256['forms'][fk['form_id']]
        cells_by_niveau = {0: {c: [tuple(p) for p in form[f'{c}_positions']]
                                for c in stegano_colors}}
        local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                            ref256['grid_size'], sweep_of_color)
        for sub in range(k*k):
            if pos_i >= len(order) or nib_idx >= len(nibbles): break
            br, bc = order[pos_i]
            for r, c in local_order:
                if nib_idx >= len(nibbles): break
                gr, gc = br*6+r, bc*6+c
                if 0 <= gr < N and 0 <= gc < N:
                    grid[gr][gc] = nibbles[nib_idx]; nib_idx += 1
            pos_i += 1
        block_i += 1
    return grid

# ── Décodeur ─────────────────────────────────────────────────────────────────
def decode(grid: List[List[int]], steg_key: bytes,
           key_b: List[int], key_2: List[Dict],
           ref256: Dict, grid_size: int = 60) -> str:
    for k in key_b: _chk_k(k)
    N = grid_size; B = N // 6
    stegano_colors = ref256['stegano_colors']
    sweep_of_color = {c: derive_sweep_index(steg_key, c) for c in stegano_colors}
    vals = []; order = zigzag_blocks(B); pos_i = 0; block_i = 0
    while pos_i < len(order) and block_i < len(key_b):
        k = key_b[block_i]; fk = key_2[block_i]
        form = ref256['forms'][fk['form_id']]
        cells_by_niveau = {0: {c: [tuple(p) for p in form[f'{c}_positions']]
                                for c in stegano_colors}}
        local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                            ref256['grid_size'], sweep_of_color)
        for sub in range(k*k):
            if pos_i >= len(order): break
            br, bc = order[pos_i]
            for r, c in local_order:
                gr, gc = br*6+r, bc*6+c
                if 0 <= gr < N and 0 <= gc < N:
                    vals.append(grid[gr][gc])
            pos_i += 1
        block_i += 1
    return _decrypt(vals, steg_key, len(vals))

# ── Clés ─────────────────────────────────────────────────────────────────────
def make_keys(msg_len: int, ref256: Dict,
              grid_size: int = 60, block_size: int = 1) -> Tuple:
    """msg_len : longueur du message en OCTETS UTF-8 (len(message.encode('utf-8')),
    pas len(message)) — voir crypto_core._message_to_bytes. Retourne
    (steg_key, key_b, key_2) -- plus de Clé C depuis l'étape 6 (voir
    encode())."""
    if block_size not in VALID_K:
        raise ValueError(f"block_size={block_size} invalide")
    B = grid_size // 6; n_blocks = B * B
    steg_key = secrets.token_bytes(32)
    key_b = [block_size]*n_blocks
    key_2 = [{'form_id': secrets.randbelow(len(ref256['forms']))}
              for _ in range(n_blocks)]
    max_len = max_message_len(key_b, grid_size)
    if msg_len > max_len:
        raise ValueError(f"Message {msg_len} > capacité {max_len}")
    return steg_key, key_b, key_2

def compute_keyspace(key_b: List[int], ref256: Dict) -> Dict:
    """Câblage production étape 6 : plus de Clé C (retirée), plus de
    tirage de couleur dans Clé 2 (rouge+bleu ensemble, un seul form_id
    par bloc parmi les 256 du référent v3 -- avant ce commit :
    log2(len(ref256)*2) par bloc, form_id ET choix blue/orange)."""
    n_blocks = len(key_b)
    return {
        'steg_key'    : '256 bits (ChaCha20-HKDF)',
        'key_B_bits'  : round(math.log2(4)*n_blocks),
        'key_2_bits'  : round(math.log2(len(ref256['forms']))*n_blocks),
        'key_A'       : 'Retirée — redondante avec Clé 2 (audit 2026-09-10)',
        'key_C'       : 'Retirée — orientation D4 sans rôle sur positions '
                         'absolues du référent v3 (câblage production, étape 6)',
        'note'        : 'Confidentialité = ChaCha20-HKDF (256 bits effectifs)',
    }

def grid_to_csv(g): return '\n'.join(','.join(str(v) for v in r) for r in g)
def csv_to_grid(s): return [[int(v) for v in r.split(',')]
                             for r in s.strip().split('\n')]

def demo():
    print("=== STÉGANOGRAPHIE GÉOMÉTRIQUE — La Livrée d'Hermès ===\n")
    ref256 = load_referent_256_v3()
    message = "ANIBALAMIOTX"
    sk, kb, k2 = make_keys(len(message.encode('utf-8')), ref256, grid_size=60)
    grid = encode(message, sk, kb, k2, ref256)
    decoded = decode(grid, sk, kb, k2, ref256)
    print(f"Message : '{message}' | Décodé : '{decoded}' | OK : {decoded==message}")
    # Mauvaise clé
    try:
        decode(grid, secrets.token_bytes(32), kb, k2, ref256)
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
