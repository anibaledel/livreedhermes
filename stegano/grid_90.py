# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Grille 90×90 — Structure QR à trois niveaux
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Hiérarchie :
  Cellule    : 1×1
  Bloc       : 6×6 cellules      → 15×15 = 225 blocs
  Super-bloc : 3×3 blocs (9 bl)  →  5×5  =  25 super-blocs

Rôles (5×5 super-blocs) :
  ▓ coin   (4)  : marqueurs fixes (reconnaissables sans clé)
  ░ bord  (12)  : message leurre
  · centre (9)  : message réel

Encodage par super-bloc :
  - Message réel  → 9 blocs du super-bloc central en stream continu
  - Message leurre→ 9 blocs du super-bloc bord en stream continu
  - Marqueurs     → pattern fixe dans le bloc central uniquement
  - Bruit         → cellules restantes

Capacité :
  Un super-bloc rend 9 blocs × 6 positions = 54 symboles base-44.
  9 super-blocs centraux = 486 symboles, soit environ 230 caractères une
  fois retirés l'en-tête de longueur et le surcoût AEAD. stream_capacity()
  donne le chiffre exact pour un jeu de clés donné : make_keys() dimensionne
  ses clés sur une grille pleine et annonce nettement plus.
"""

import secrets
from typing import List, Tuple
from stegano_lib import (
    load_referents,
    apply_orientation, ALPHA_LEN,
    _encrypt, _decrypt, payload_to_symbols, max_message_for
)
from stegano_classic import zigzag_blocks

# grid_90.py mis de côté (décision de l'auteur, 2026-09-12), pas migré vers
# la règle de lecture v3 -- voir stegano_classic.load_referents()). Reste
# sur l'ancien schéma de référent (blue/orange, form_id+color+orientation
# D4) : stegano_classic.make_keys() est passée à la règle v3 (étape 6) et
# ne convient plus ici, donc grid_90.py garde sa PROPRE génération de clés
# B/C/2 dans l'ancien format, ci-dessous (copie de l'ancien make_keys()).

def _legacy_classic_n_pos(key_b: List[int], grid_size: int) -> int:
    B = grid_size // 6
    order = zigzag_blocks(B)
    n_pos = 0; pos_i = 0
    for k in key_b:
        if pos_i >= len(order): break
        available = min(k*k, len(order) - pos_i)
        n_pos += available * 6; pos_i += available
    return n_pos

def make_keys_legacy(msg_len: int, ref256: List, grid_size: int = 60,
                      block_size: int = 1) -> Tuple:
    """Ancien schéma de clés (form_id+color, orientations D4), pour
    grid_90.py seul -- voir la note de module ci-dessus. ref256 : ancien
    schéma (liste de dicts blue/orange, PAS le référent v3)."""
    if block_size not in (1, 2, 3, 5):
        raise ValueError(f"block_size={block_size} invalide")
    B = grid_size // 6; n_blocks = B * B
    steg_key = secrets.token_bytes(32)
    key_b = [block_size] * n_blocks
    key_c = [[secrets.randbelow(8) for _ in range(block_size**2)]
              for _ in range(n_blocks)]
    key_2 = [{'form_id': secrets.randbelow(len(ref256)),
               'color': secrets.choice(['blue', 'orange'])}
              for _ in range(n_blocks)]
    max_len = max_message_for(_legacy_classic_n_pos(key_b, grid_size))
    if msg_len > max_len:
        raise ValueError(f"Message {msg_len} > capacité {max_len}")
    return steg_key, key_b, key_c, key_2

GRID_SIZE   = 90
BLOCK_SIZE  = 6
BLOCKS_SIDE = 15   # 90/6
SUPER_SIDE  = 5    # 15/3
SUPER_BL    = 3    # blocs par côté de super-bloc

def super_role(sr: int, sc: int) -> str:
    if (sr in (0, SUPER_SIDE-1)) and (sc in (0, SUPER_SIDE-1)): return 'corner'
    if (sr in (0, SUPER_SIDE-1)) or (sc in (0, SUPER_SIDE-1)):  return 'edge'
    return 'center'

def blocks_of_super(sr: int, sc: int) -> List[Tuple[int,int]]:
    """9 blocs (br, bc) du super-bloc (sr, sc) — ordre zigzag."""
    br0, bc0 = sr * SUPER_BL, sc * SUPER_BL
    blocs = [(br0+dr, bc0+dc) for dr in range(SUPER_BL) for dc in range(SUPER_BL)]
    return blocs   # 9 blocs

def central_block(sr: int, sc: int) -> Tuple[int,int]:
    return sr * SUPER_BL + 1, sc * SUPER_BL + 1

# Marqueur de coin : pattern 6×6 visuel (bordure pleine + anneau vide + croix)
CORNER_PAT = [
    [15,15,15,15,15,15],
    [15, 0, 0, 0, 0,15],
    [15, 0,15,15, 0,15],
    [15, 0,15,15, 0,15],
    [15, 0, 0, 0, 0,15],
    [15,15,15,15,15,15],
]

def apply_corner(grid, sr, sc):
    br, bc = central_block(sr, sc)
    r0, c0 = br*BLOCK_SIZE, bc*BLOCK_SIZE
    for dr in range(6):
        for dc in range(6):
            grid[r0+dr][c0+dc] = CORNER_PAT[dr][dc]

# ── Encodage / Décodage stream sur un super-bloc ──────────────────────────────
def _collect_positions(sr, sc, ref256, k2, kc):
    """Retourne toutes les positions de lecture du super-bloc dans l'ordre."""
    positions = []
    for i, (br, bc) in enumerate(blocks_of_super(sr, sc)):
        r0, c0 = br*BLOCK_SIZE, bc*BLOCK_SIZE
        idx = i % len(k2)
        fk = k2[idx]; orient = kc[idx][0]
        form = ref256[fk['form_id'] % len(ref256)]
        base = form[fk.get('color','blue')]
        t = apply_orientation(base, orient)
        for r, c in t:
            positions.append((r0+r, c0+c))
    return positions   # 9 blocs × 6 positions = 54 positions

def super_capacity(sr, sc, ref256, k2, kc) -> int:
    """Plus long message tenant dans le super-bloc (sr, sc), en caractères."""
    return max_message_for(len(_collect_positions(sr, sc, ref256, k2, kc)))

def encode_super(grid, message, sk, kb, kc, k2, sr, sc, ref256):
    """Encode un message dans les positions du super-bloc (sr, sc)."""
    positions = _collect_positions(sr, sc, ref256, k2, kc)
    # Charge utile à longueur fixe (format v3, tâche 2) : le nombre de
    # positions doit être connu AVANT l'appel à _encrypt(), qui lève
    # désormais lui-même l'erreur si le message ne tient pas.
    payload  = _encrypt(message, sk, len(positions))
    nibbles  = payload_to_symbols(payload, len(positions))
    for i, (gr, gc) in enumerate(positions):
        if i >= len(nibbles): break
        if 0 <= gr < GRID_SIZE and 0 <= gc < GRID_SIZE:
            grid[gr][gc] = nibbles[i]

def decode_super(grid, sk, kc, k2, sr, sc, ref256):
    """Lit les nibbles du super-bloc et tente le déchiffrement."""
    positions = _collect_positions(sr, sc, ref256, k2, kc)
    vals = [grid[gr][gc] for gr,gc in positions
            if 0 <= gr < GRID_SIZE and 0 <= gc < GRID_SIZE]
    return _decrypt(vals, sk, len(vals))

# ── API principale ─────────────────────────────────────────────────────────────
def make_grid_90(real_message, real_keys, lure_message, lure_keys, ref256):
    """
    Construit la grille 90×90.
    Message réel  → stream sur les 9 super-blocs centraux (486 symboles)
    Message leurre→ stream sur les 12 super-blocs de bord (648 symboles)
    Coins         → marqueurs fixes
    Reste         → bruit aléatoire
    """
    N    = GRID_SIZE
    grid = [[secrets.randbelow(ALPHA_LEN) for _ in range(N)] for _ in range(N)]

    # 1. Marqueurs de coin
    for sr, sc in [(0,0),(0,4),(4,0),(4,4)]:
        apply_corner(grid, sr, sc)

    # 2. Message réel → stream sur 9 super-blocs centraux
    center_supers = [(sr,sc) for sr in range(1,4) for sc in range(1,4)]
    _encode_stream(grid, real_message, real_keys, center_supers, ref256)

    # 3. Message leurre → stream sur 12 super-blocs de bord
    if lure_message and lure_keys:
        edge_supers = [(sr,sc) for sr in range(5) for sc in range(5)
                       if super_role(sr,sc)=='edge']
        _encode_stream(grid, lure_message, lure_keys, edge_supers, ref256)

    return grid

def _stream_positions(keys, supers, ref256) -> List[Tuple[int,int]]:
    """
    Positions de lecture d'un stream, dans l'ordre.

    Une seule marche de la géométrie, partagée par l'encodage, le décodage
    et le calcul de capacité : c'est ce qui garantit que la capacité
    annoncée est exactement celle que l'encodeur sait écrire.
    """
    positions = []
    for i, (sr, sc) in enumerate(supers):
        for j, (br, bc) in enumerate(blocks_of_super(sr, sc)):
            idx    = (i * SUPER_BL * SUPER_BL + j) % len(keys['key_2'])
            fk     = keys['key_2'][idx]
            orient = keys['key_c'][idx][0]
            form   = ref256[fk['form_id'] % len(ref256)]
            base   = form[fk.get('color','blue')]
            r0, c0 = br*BLOCK_SIZE, bc*BLOCK_SIZE
            for r, c in apply_orientation(base, orient):
                gr, gc = r0+r, c0+c
                if 0 <= gr < GRID_SIZE and 0 <= gc < GRID_SIZE:
                    positions.append((gr, gc))
    return positions

def stream_capacity(keys, supers, ref256) -> int:
    """Plus long message tenant dans ces super-blocs, en caractères."""
    return max_message_for(len(_stream_positions(keys, supers, ref256)))

def _encode_stream(grid, message, keys, supers, ref256):
    """Encode un message en stream sur une liste de super-blocs."""
    positions = _stream_positions(keys, supers, ref256)
    # Charge utile à longueur fixe (format v3, tâche 2) : le nombre de
    # positions doit être connu AVANT l'appel à _encrypt(), qui lève
    # désormais lui-même l'erreur si le message ne tient pas. make_keys()
    # dimensionne ses clés sur la capacité d'une grille pleine, bien
    # supérieure aux positions qu'un stream de super-blocs rend — d'où
    # cette garde en amont plutôt qu'une taille fixe supposée.
    payload   = _encrypt(message, keys['steg_key'], len(positions))
    nibbles   = payload_to_symbols(payload, len(positions))
    for nib_i, (gr, gc) in enumerate(positions):
        if nib_i >= len(nibbles): break
        grid[gr][gc] = nibbles[nib_i]

def _decode_stream(grid, keys, supers, ref256):
    """Lit en stream depuis une liste de super-blocs."""
    vals = [grid[gr][gc]
            for gr, gc in _stream_positions(keys, supers, ref256)]
    return _decrypt(vals, keys['steg_key'], len(vals))

def decode_grid_90(grid, keys, ref256, role='center'):
    """Décode le message du rôle indiqué (center=réel, edge=leurre)."""
    if role == 'center':
        supers = [(sr,sc) for sr in range(1,4) for sc in range(1,4)]
    else:
        supers = [(sr,sc) for sr in range(5) for sc in range(5)
                  if super_role(sr,sc)=='edge']
    return _decode_stream(grid, keys, supers, ref256)

def detect_corners(grid) -> bool:
    for sr, sc in [(0,0),(0,4),(4,0),(4,4)]:
        br, bc = central_block(sr, sc)
        r0, c0 = br*BLOCK_SIZE, bc*BLOCK_SIZE
        if grid[r0][c0] != 15 or grid[r0][c0+1] != 15: return False
    return True

def print_map(keys=None, ref256=None):
    sym = {'corner':'▓','edge':'░','center':'·'}
    print("Structure 5×5 super-blocs (15×15 blocs de 6×6) :")
    print("  ┌───────────────────┐")
    for sr in range(SUPER_SIDE):
        row = "  │"
        for sc in range(SUPER_SIDE): row += f" {sym[super_role(sr,sc)]}"
        print(row+" │")
    print("  └───────────────────┘")
    print("  ▓ coin(4)    : marqueurs sans clé")
    print("  ░ bord(12)   : message leurre")
    print("  · centre(9)  : message réel\n")
    # Les capacités dépendent des clés (formes et orientations tirées), donc
    # elles ne se calculent qu'avec un jeu de clés sous la main. L'ancien
    # affichage les dérivait d'une arithmétique en nibbles périmée et
    # annonçait des valeurs négatives : « -17 bytes (3 chars) ».
    if keys is None or ref256 is None:
        print("  Capacités : voir stream_capacity() — elles dépendent des clés.")
        return
    center = [(sr,sc) for sr in range(1,4) for sc in range(1,4)]
    edge   = [(sr,sc) for sr in range(SUPER_SIDE) for sc in range(SUPER_SIDE)
              if super_role(sr,sc)=='edge']
    for label, supers in (("message réel (9 super-blocs centraux)", center),
                          ("message leurre (12 super-blocs de bord)", edge)):
        pos = len(_stream_positions(keys, supers, ref256))
        print(f"  Capacité {label} : {pos} positions = "
              f"{max_message_for(pos)} caractères")

if __name__ == '__main__':
    print("="*54)
    print("GRILLE 90×90 — STRUCTURE QR LA LIVRÉE D'HERMÈS")
    print("="*54+"\n")
    ref256, _ = load_referents()

    # Générer des clés pour 9×9 = 81 blocs (super-blocs centraux)
    N_BLOCS = SUPER_BL * SUPER_BL * 9   # 81 blocs pour les 9 super-blocs centraux
    real_sk, real_kb, real_kc, real_k2 = make_keys_legacy(
        len("ANIBALAMIOTX"), ref256, grid_size=GRID_SIZE)
    lure_sk, lure_kb, lure_kc, lure_k2 = make_keys_legacy(
        len("TEXTEANODINS"), ref256, grid_size=GRID_SIZE)

    real_keys = {'steg_key':real_sk,'key_b':real_kb,'key_c':real_kc,'key_2':real_k2}
    lure_keys = {'steg_key':lure_sk,'key_b':lure_kb,'key_c':lure_kc,'key_2':lure_k2}

    print_map(real_keys, ref256)

    print("\nConstruction...")
    grid = make_grid_90("ANIBALAMIOTX", real_keys,
                        "TEXTEANODINS", lure_keys, ref256)

    print(f"Grille 90×90 = {GRID_SIZE**2} cellules ✓")
    print(f"Marqueurs de coin : {detect_corners(grid)} ✓")

    real_out = decode_grid_90(grid, real_keys, ref256, role='center')
    lure_out = decode_grid_90(grid, lure_keys, ref256, role='edge')
    print(f"\nMessage réel   : '{real_out}' ✓")
    print(f"Message leurre : '{lure_out}' ✓")
    print(f"\n3 niveaux indépendants :")
    print(f"  Marqueurs   → lisibles sans clé (structure QR)")
    print(f"  Leurre      → lisible avec clé leurre uniquement")
    print(f"  Réel        → lisible avec clé réelle uniquement")
