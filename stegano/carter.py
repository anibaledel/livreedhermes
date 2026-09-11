# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
carter.py — Grille Carter, Grammaire à 3 catégories dérivées de la clé
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Extrait de stegano_lib.py (refactor de modularisation) : Carter 256
(Référent 256, grille 90×90), Carter 360 (Référent 360 Jacquard, grille
180×180) et Carter Mix (combinaison des deux, grille 180×180).

Remplace l'ancien carter.py (implémentation Carter-256-seule, non
importée ailleurs dans ce dépôt) par la version réellement utilisée,
qui vivait jusqu'ici dans stegano_lib.py.

Concept :
  La clé maître dérive une GRAMMAIRE qui assigne à chaque bloc de la
  grille l'un des trois rôles suivants :

    'pure'       : bruit pur — aucune forme géométrique appliquée
    'structured' : bruit structuré — forme appliquée, positions aléatoires
    'message'    : message réel — forme appliquée, positions = message chiffré

  Propriété fondamentale :
    'structured' et 'message' sont statistiquement INDISCERNABLES sans la clé.
    ChaCha20-HKDF produit du pseudo-aléatoire uniforme, identique au bruit pur.
    → La grammaire elle-même est une couche secrète supplémentaire.
"""

import json
from typing import List, Dict, Tuple, Optional
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

from crypto_core import (
    ALPHA_LEN, _encrypt, _decrypt, payload_to_symbols,
    max_payload_for, max_message_for, _random_symbols,
)
from stegano_classic import apply_orientation, _find_ref

# ── Grille Carter — Grammaire à 3 catégories dérivées de la clé ───────────────
CARTER_GRID  = 90
CARTER_BLOCK = 6
CARTER_SIDE  = CARTER_GRID // CARTER_BLOCK    # 15 blocs par côté
CARTER_N     = CARTER_SIDE ** 2               # 225 blocs

_PURE, _STRUCTURED, _MESSAGE = 0, 1, 2

def _carter_split(master_key: bytes):
    """
    Séparation explicite des clés Carter [correction 2].
    Deux usages distincts → deux sous-clés indépendantes via HKDF.
      xchacha_key : chiffrement ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5)
      grammar_key : dérivation de la grammaire (rôles + formes)
    Propriété : la grammaire ne révèle rien sur la clé de chiffrement et vice-versa.
    """
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'Carter-v2',
                         info=b'encrypt').derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'Carter-v2',
                         info=b'grammar').derive(master_key)
    return xchacha_key, grammar_key

def _carter_grammar(master_key: bytes, ref256: List[Dict]) -> List[Dict]:
    """
    Dérive la grammaire Carter depuis la clé maître (HKDF-SHA256).
    Assigne à chaque bloc un rôle et une forme géométrique.
    Sans la clé, les rôles sont inconnus → grammaire = couche secrète.
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    km = HKDF(_hh.SHA256(), CARTER_N * 4,
              salt=b'Carter-grammar-v1',
              info=b'block-roles-and-forms').derive(master_key)
    grammar = []
    for i in range(CARTER_N):
        b = km[i*4 : i*4+4]
        rb = b[0]
        role = _PURE if rb < 85 else (_STRUCTURED if rb < 170 else _MESSAGE)
        grammar.append({
            'role':    role,
            'form_id': (b[1] * len(ref256)) // 256,
            'color':   'blue' if b[2] < 128 else 'orange',
            'orient':  b[3] % 8,
        })
    return grammar

def _carter_positions(br: int, bc: int, g: Dict, ref256: List[Dict]) -> List[Tuple]:
    """6 positions de lecture du bloc (br, bc) selon la grammaire g."""
    form = ref256[g['form_id'] % len(ref256)]
    base = form[g['color']]
    t    = apply_orientation(base, g['orient'])
    r0, c0 = br * CARTER_BLOCK, bc * CARTER_BLOCK
    return [(r0+r, c0+c) for r, c in t
            if 0 <= r0+r < CARTER_GRID and 0 <= c0+c < CARTER_GRID]

def _carter_message_positions(grammar: List[Dict], ref256: List[Dict]) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    return sum(len(_carter_positions(i // CARTER_SIDE, i % CARTER_SIDE, g, ref256))
               for i, g in enumerate(grammar) if g['role'] == _MESSAGE)

def encode_carter(message: str, master_key: bytes,
                  ref256: List[Dict]) -> List[List[int]]:
    """
    Encode un message dans une grille Carter 90×90.

    La clé maître dérive :
      - La grammaire (rôles des 225 blocs : pur / structuré / message)
      - La forme géométrique de chaque bloc non-pur

    Blocs 'message'    → positions = nibbles du message chiffré (ChaCha20-HKDF)
    Blocs 'structuré'  → positions = valeurs aléatoires (indiscernables)
    Blocs 'pur'        → tout aléatoire, aucune structure appliquée

    grid_to_csv() pour sérialiser, csv_to_grid() pour désérialiser.
    """
    xchacha_key, grammar_key = _carter_split(master_key)
    grammar = _carter_grammar(grammar_key, ref256)

    payload = _encrypt(message, xchacha_key)
    # Même flux de symboles base-44 que encode() : les nibbles [0..15]
    # trahissaient les cellules message dans un bruit couvrant [0..43].
    nibbles = payload_to_symbols(payload)

    # Positions réellement rendues, comptées comme le fait la boucle
    # d'écriture ci-dessous. Les 512 formes Ref256 comptent aujourd'hui
    # 6 points chacune et la grille est alignée sur les blocs, donc
    # n_pos == n_msg*6 ; le produit resterait juste par coïncidence, et
    # la garde doit porter sur ce que l'encodeur écrit vraiment.
    n_pos = _carter_message_positions(grammar, ref256)
    if len(nibbles) > n_pos:
        raise ValueError(
            f"Message trop long pour la grammaire dérivée : "
            f"{len(message)} caractères > {max_message_for(n_pos)} "
            f"disponibles. Changer la clé ou réduire le message.")

    # Remplissage bulk CSPRNG (voir crypto_core._random_symbols) : mesuré
    # ~x6 plus rapide que CARTER_GRID² appels à secrets.randbelow() (audit
    # G. Kerma, §4.8), même garantie de sécurité.
    _flat = _random_symbols(CARTER_GRID * CARTER_GRID)
    grid  = [_flat[i*CARTER_GRID:(i+1)*CARTER_GRID] for i in range(CARTER_GRID)]
    nib_i = 0
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER_SIDE, i % CARTER_SIDE
        for gr, gc in _carter_positions(br, bc, g, ref256):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = nibbles[nib_i]; nib_i += 1
    return grid

def decode_carter(grid: List[List[int]], master_key: bytes,
                  ref256: List[Dict]) -> str:
    """
    Décode une grille Carter. La grammaire est re-dérivée depuis la clé.
    Lève ValueError si la clé est incorrecte (tag Poly1305 invalide).
    """
    xchacha_key, grammar_key = _carter_split(master_key)
    grammar = _carter_grammar(grammar_key, ref256)
    vals = []
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER_SIDE, i % CARTER_SIDE
        vals.extend(grid[gr][gc]
                    for gr, gc in _carter_positions(br, bc, g, ref256))
    return _decrypt(vals, xchacha_key)

def carter_capacity(master_key: bytes, ref256: List[Dict]) -> Dict:
    """Retourne les statistiques de capacité de la grammaire dérivée."""
    _, grammar_key = _carter_split(master_key)
    grammar = _carter_grammar(grammar_key, ref256)
    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_str = sum(1 for g in grammar if g['role'] == _STRUCTURED)
    n_pur = sum(1 for g in grammar if g['role'] == _PURE)
    n_pos = _carter_message_positions(grammar, ref256)
    return {
        'blocs_message':    n_msg,
        'blocs_structure':  n_str,
        'blocs_purs':       n_pur,
        'nibbles':          n_pos,
        'bytes_bruts':      max_payload_for(n_pos),
        'bytes_utiles':     max_message_for(n_pos),
        'chars_max':        max_message_for(n_pos),
        'ambiguite':        f"1 message parmi {n_msg + n_str} blocs structurés",
    }

# ── Référent 360 — Grille Carter 180×180 ──────────────────────────────────────
# Blocs 12×12, 8 positions par forme (une couleur parmi C1/C2/C3)
# Même structure Carter que 90×90 : 225 blocs, grammaire dérivée de la clé

CARTER360_GRID  = 180
CARTER360_BLOCK = 12
CARTER360_SIDE  = CARTER360_GRID // CARTER360_BLOCK   # 15
CARTER360_N     = CARTER360_SIDE ** 2                  # 225

_COLORS_360 = ['C1', 'C2', 'C3']

def _load_ref360() -> List[Dict]:
    """Charge le Référent 360 (formes complètes 3×8=24 positions)."""
    with open(_find_ref('referent_360.json')) as f:
        raw = json.load(f)
    return [f for f in raw
            if (isinstance(f['positions'], dict) and
                sum(len(v) for v in f['positions'].values()) == 24)]

def _carter360_split(master_key: bytes):
    """Séparation des clés pour Carter 360 (salt distinct du Carter 256)."""
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'Carter360-v2', info=b'encrypt').derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'Carter360-v2', info=b'grammar').derive(master_key)
    return xchacha_key, grammar_key

def _carter360_grammar(master_key: bytes, ref360: List[Dict]) -> List[Dict]:
    """
    Dérive la grammaire Carter pour le Référent 360 (blocs 12×12).
    Même principe que _carter_grammar pour Ref256,
    mais avec 3 couleurs (C1/C2/C3) au lieu de 2 (blue/orange).
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    km = HKDF(_hh.SHA256(), CARTER360_N * 4,
              salt=b'Carter360-grammar-v1',
              info=b'block-roles-360-forms').derive(master_key)
    grammar = []
    for i in range(CARTER360_N):
        b = km[i*4 : i*4+4]
        rb = b[0]
        role = _PURE if rb < 85 else (_STRUCTURED if rb < 170 else _MESSAGE)
        grammar.append({
            'role':    role,
            'form_id': (b[1] * len(ref360)) // 256,
            'color':   _COLORS_360[b[2] % 3],
            'orient':  b[3] % 6,   # 6 permutations de couleurs
        })
    return grammar

def _carter360_positions(br: int, bc: int,
                          g: Dict, ref360: List[Dict]) -> List[Tuple]:
    """
    Positions de lecture du bloc 12×12 (br, bc) selon la grammaire g.

    Zéro à 16 positions, et non 8 comme on pourrait l'attendre. La grammaire
    tire une couleur parmi C1/C2/C3, mais une forme n'offre pas forcément le
    canal tiré : sur les 294 formes du référent, 84 portent C1, 198 portent
    C3, 214 portent C2. Le canal absent, le .get() rend une liste vide et le
    bloc ne porte rien. Les canaux existants comptent 8 points, sauf 21
    d'entre eux qui en comptent 16.

    Mesuré sur 463 blocs message : 44,9 % ne rendent aucune position, la
    moyenne s'établissant à 4,60. Toute capacité calculée comme n_msg*8 est
    donc inatteignable — voir _carter360_message_positions().
    """
    form = ref360[g['form_id'] % len(ref360)]
    pts  = form['positions'].get(g['color'], [])
    r0, c0 = br * CARTER360_BLOCK, bc * CARTER360_BLOCK
    return [(r0+r, c0+c) for r, c in pts
            if 0 <= r0+r < CARTER360_GRID and 0 <= c0+c < CARTER360_GRID]

def _carter360_message_positions(grammar: List[Dict], ref360: List[Dict]) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    return sum(len(_carter360_positions(i // CARTER360_SIDE, i % CARTER360_SIDE,
                                        g, ref360))
               for i, g in enumerate(grammar) if g['role'] == _MESSAGE)

def encode_carter_360(message: str, master_key: bytes,
                       ref360: Optional[List[Dict]] = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter 180×180 (Référent 360).

    Grammaire dérivée de master_key :
      'pur'       → bruit aléatoire, aucune structure 12×12
      'structuré' → forme Ref360 appliquée, valeurs aléatoires
      'message'   → forme Ref360 appliquée, valeurs = message ChaCha20-HKDF

    Capacité utile : 152 caractères en moyenne sur 200 clés (49 à 246),
    contre 214 pour Carter 90×90 Ref256 — inférieure malgré une grille plus
    grande, pour la raison expliquée sous _carter360_positions(). La
    grammaire étant dérivée de la clé, la capacité varie fortement d'une clé
    à l'autre : carter360_capacity() donne le chiffre exact pour une clé.
    """
    if ref360 is None:
        ref360 = _load_ref360()

    xchacha_key, grammar_key = _carter360_split(master_key)
    grammar = _carter360_grammar(grammar_key, ref360)
    n_msg   = sum(1 for g in grammar if g['role'] == _MESSAGE)

    payload = _encrypt(message, xchacha_key)
    # Même flux de symboles base-44 que encode() : les nibbles [0..15]
    # trahissaient les cellules message dans un bruit couvrant [0..43].
    nibbles = payload_to_symbols(payload)

    # Positions réellement disponibles. La grammaire tire une couleur parmi
    # C1/C2/C3, mais une forme Ref360 n'offre pas forcément le canal tiré :
    # 84 formes sur 294 portent C1, 198 portent C3, 214 portent C2. Quand le
    # canal manque, le bloc ne rend AUCUNE position. Mesuré sur 463 blocs
    # message : 44,9 % n'en rendent aucune, et la moyenne tombe à 4,60 par
    # bloc. Le produit n_msg*8 annonçait donc une capacité inatteignable.
    n_pos = _carter360_message_positions(grammar, ref360)
    if len(nibbles) > n_pos:
        raise ValueError(
            f"Message trop long : {len(message)} caractères > "
            f"{max_message_for(n_pos)} disponibles "
            f"({n_msg} blocs message, {n_pos} positions).")

    # Remplissage bulk CSPRNG — voir encode_carter().
    _flat = _random_symbols(CARTER360_GRID * CARTER360_GRID)
    grid  = [_flat[i*CARTER360_GRID:(i+1)*CARTER360_GRID] for i in range(CARTER360_GRID)]
    nib_i = 0
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER360_SIDE, i % CARTER360_SIDE
        for gr, gc in _carter360_positions(br, bc, g, ref360):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = nibbles[nib_i]; nib_i += 1
    return grid

def decode_carter_360(grid: List[List[int]], master_key: bytes,
                       ref360: Optional[List[Dict]] = None) -> str:
    """Décode une grille Carter 180×180. Lève ValueError si clé incorrecte."""
    if ref360 is None:
        ref360 = _load_ref360()
    xchacha_key, grammar_key = _carter360_split(master_key)
    grammar = _carter360_grammar(grammar_key, ref360)
    vals = []
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER360_SIDE, i % CARTER360_SIDE
        vals.extend(grid[gr][gc]
                    for gr, gc in _carter360_positions(br, bc, g, ref360))
    return _decrypt(vals, xchacha_key)

def carter360_capacity(master_key: bytes,
                        ref360: Optional[List[Dict]] = None) -> Dict:
    """Statistiques de capacité de la grammaire Carter 360."""
    if ref360 is None:
        ref360 = _load_ref360()
    _, grammar_key = _carter360_split(master_key)
    grammar = _carter360_grammar(grammar_key, ref360)
    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_str = sum(1 for g in grammar if g['role'] == _STRUCTURED)
    n_pur = sum(1 for g in grammar if g['role'] == _PURE)
    # Positions réellement disponibles. La grammaire tire une couleur parmi
    # C1/C2/C3, mais une forme Ref360 n'offre pas forcément le canal tiré :
    # 84 formes sur 294 portent C1, 198 portent C3, 214 portent C2. Quand le
    # canal manque, le bloc ne rend AUCUNE position. Mesuré sur 463 blocs
    # message : 44,9 % n'en rendent aucune, et la moyenne tombe à 4,60 par
    # bloc. Le produit n_msg*8 annonçait donc une capacité inatteignable.
    n_pos = _carter360_message_positions(grammar, ref360)
    return {
        'referent':         '360',
        'grille':           f'{CARTER360_GRID}×{CARTER360_GRID}',
        'blocs_message':    n_msg,
        'blocs_structure':  n_str,
        'blocs_purs':       n_pur,
        # Moyenne constatée, et non la constante 8 d'avant : un canal de
        # couleur existant porte bien 8 points (16 pour 21 d'entre eux),
        # mais près d'un bloc message sur deux tire un canal absent de sa
        # forme et ne rend rien du tout.
        'positions_bloc':   (n_pos / n_msg) if n_msg else 0,
        'nibbles':          n_pos,
        'bytes_utiles':     max_message_for(n_pos),
        'chars_max':        max_message_for(n_pos),
        'ambiguite':        f"1 message parmi {n_msg + n_str} blocs structurés",
    }

# ── Grille Carter Mixte 180×180 — Ref256 + Ref360 combinés ────────────────────
# Grammaire opérant sur 225 méta-blocs 12×12.
# Chaque méta-bloc reçoit un référent (256 ou 360) et un rôle (pur/structuré/message).
# La clé détermine tout — référent, rôle, forme, couleur, orientation.

CARTER_MIX_GRID  = 180
CARTER_MIX_META  = 12           # méta-bloc 12×12
CARTER_MIX_SIDE  = 15           # méta-blocs par côté (180/12)
CARTER_MIX_N     = 225          # total méta-blocs
_REF256, _REF360 = 0, 1         # identifiants de référent

def _carter_mix_split(master_key: bytes):
    """Séparation des clés pour Carter mixte (salt distinct)."""
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'CarterMix-v2', info=b'encrypt').derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=b'CarterMix-v2', info=b'grammar').derive(master_key)
    return xchacha_key, grammar_key

def _carter_mix_grammar(master_key: bytes,
                         ref256: List[Dict],
                         ref360: List[Dict]) -> List[Dict]:
    """
    Dérive la grammaire Carter mixte depuis la clé maître.
    Pour chaque méta-bloc 12×12 (225 total) :
      - référent : 256 (4 sous-blocs 6×6) ou 360 (1 bloc 12×12)
      - rôle     : pur / structuré / message
      - forme    : issue du référent sélectionné
    Sans la clé, référent ET rôle sont inconnus.
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    km = HKDF(_hh.SHA256(), CARTER_MIX_N * 5,
              salt=b'CarterMix-v1',
              info=b'mixed-256-360-grammar').derive(master_key)
    grammar = []
    for i in range(CARTER_MIX_N):
        b = km[i*5 : i*5+5]
        role = _PURE if b[0] < 85 else (_STRUCTURED if b[0] < 170 else _MESSAGE)
        ref  = _REF256 if b[1] < 128 else _REF360
        if ref == _REF256:
            cfg = {'form_id': (b[2] * len(ref256)) // 256,
                   'color':   'blue' if b[3] < 128 else 'orange',
                   'orient':  b[4] % 8}
        else:
            cfg = {'form_id': (b[2] * len(ref360)) // 256,
                   'color':   _COLORS_360[b[3] % 3],
                   'orient':  b[4] % 6}
        grammar.append({'role': role, 'ref': ref, **cfg})
    return grammar

def _mix_positions(mbr: int, mbc: int,
                   g: Dict, ref256: List[Dict],
                   ref360: List[Dict]) -> List[Tuple]:
    """
    Positions de lecture d'un méta-bloc (mbr, mbc) selon sa grammaire.
    Ref256 : 4 sous-blocs × 6 = 24 positions
    Ref360 : 1 bloc 12×12 × 8 =  8 positions
    """
    N = CARTER_MIX_GRID
    if g['ref'] == _REF256:
        form = ref256[g['form_id'] % len(ref256)]
        base = form[g['color']]
        t    = apply_orientation(base, g['orient'])
        pos  = []
        for dr in range(2):      # 2×2 sous-blocs dans le méta-bloc
            for dc in range(2):
                r0 = mbr * CARTER_MIX_META + dr * CARTER_BLOCK
                c0 = mbc * CARTER_MIX_META + dc * CARTER_BLOCK
                for r, c in t:
                    gr, gc = r0+r, c0+c
                    if 0 <= gr < N and 0 <= gc < N:
                        pos.append((gr, gc))
        return pos   # jusqu'à 24
    else:
        form = ref360[g['form_id'] % len(ref360)]
        pts  = form['positions'].get(g['color'], [])
        r0   = mbr * CARTER_MIX_META
        c0   = mbc * CARTER_MIX_META
        return [(r0+r, c0+c) for r, c in pts
                if 0 <= r0+r < N and 0 <= c0+c < N]  # 8

def _mix_message_positions(grammar: List[Dict], ref256: List[Dict],
                           ref360: List[Dict]) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    return sum(len(_mix_positions(i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE,
                                  g, ref256, ref360))
               for i, g in enumerate(grammar) if g['role'] == _MESSAGE)

def encode_carter_mix(message: str, master_key: bytes,
                       ref256: List[Dict],
                       ref360: Optional[List[Dict]] = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter mixte 180×180.
    Ref256 et Ref360 coexistent — la clé détermine quel référent chaque méta-bloc utilise.

    Méta-blocs Ref256 message : 24 positions = 12 bytes
    Méta-blocs Ref360 message :  8 positions =  4 bytes

    La capacité totale est elle-même dérivée de la clé (obscurcissement).
    """
    if ref360 is None:
        ref360 = _load_ref360()

    xchacha_key, grammar_key = _carter_mix_split(master_key)
    grammar = _carter_mix_grammar(grammar_key, ref256, ref360)
    # Calculer la capacité
    nibbles_cap = _mix_message_positions(grammar, ref256, ref360)

    payload = _encrypt(message, xchacha_key)
    # Même flux de symboles base-44 que encode() : les nibbles [0..15]
    # trahissaient les cellules message dans un bruit couvrant [0..43].
    nibbles = payload_to_symbols(payload)

    if len(nibbles) > nibbles_cap:
        raise ValueError(
            f"Message trop long : {len(message)} caractères > "
            f"{max_message_for(nibbles_cap)} disponibles dans la "
            f"grammaire dérivée.")

    # Remplissage bulk CSPRNG — voir encode_carter().
    _flat = _random_symbols(CARTER_MIX_GRID * CARTER_MIX_GRID)
    grid  = [_flat[i*CARTER_MIX_GRID:(i+1)*CARTER_MIX_GRID] for i in range(CARTER_MIX_GRID)]
    nib_i = 0
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        mbr, mbc = i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE
        for gr, gc in _mix_positions(mbr, mbc, g, ref256, ref360):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = nibbles[nib_i]; nib_i += 1
    return grid

def decode_carter_mix(grid: List[List[int]], master_key: bytes,
                       ref256: List[Dict],
                       ref360: Optional[List[Dict]] = None) -> str:
    """Décode une grille Carter mixte 180×180."""
    if ref360 is None:
        ref360 = _load_ref360()
    xchacha_key, grammar_key = _carter_mix_split(master_key)
    grammar = _carter_mix_grammar(grammar_key, ref256, ref360)
    vals = []
    for i, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        mbr, mbc = i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE
        vals.extend(grid[gr][gc]
                    for gr, gc in _mix_positions(mbr, mbc, g, ref256, ref360))
    return _decrypt(vals, xchacha_key)

def carter_mix_capacity(master_key: bytes,
                         ref256: List[Dict],
                         ref360: Optional[List[Dict]] = None) -> Dict:
    """Statistiques de capacité de la grammaire Carter mixte."""
    if ref360 is None:
        ref360 = _load_ref360()
    _, grammar_key = _carter_mix_split(master_key)
    grammar = _carter_mix_grammar(grammar_key, ref256, ref360)
    n256m = sum(1 for g in grammar if g['role']==_MESSAGE and g['ref']==_REF256)
    n360m = sum(1 for g in grammar if g['role']==_MESSAGE and g['ref']==_REF360)
    n256s = sum(1 for g in grammar if g['role']==_STRUCTURED and g['ref']==_REF256)
    n360s = sum(1 for g in grammar if g['role']==_STRUCTURED and g['ref']==_REF360)
    n_pur = sum(1 for g in grammar if g['role']==_PURE)
    # La capacité doit être calculée comme le fait l'encodeur : une forme
    # tronquée au bord de la grille rend moins de 24 (ou 8) positions.
    # L'ancien produit n256m*24 + n360m*8 annonçait jusqu'à 12 % de trop.
    nibs  = _mix_message_positions(grammar, ref256, ref360)
    return {
        'grille':              f'{CARTER_MIX_GRID}×{CARTER_MIX_GRID}',
        'meta_blocs':          CARTER_MIX_N,
        'message_ref256':      n256m,
        'message_ref360':      n360m,
        'structure_ref256':    n256s,
        'structure_ref360':    n360s,
        'purs':                n_pur,
        'nibbles_total':       nibs,
        'bytes_utiles':        max_message_for(nibs),
        'chars_max':           max_message_for(nibs),
        'ambiguite_256':       f"1/{n256m+n256s} méta-blocs Ref256",
        'ambiguite_360':       f"1/{n360m+n360s} méta-blocs Ref360",
    }
