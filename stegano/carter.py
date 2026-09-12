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

from typing import List, Dict, Tuple, Optional
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

from crypto_core import (
    ALPHA_LEN, LABELS, C_PUB, MAX_REDRAWS, _redraw_grammar_key,
    _encrypt, _decrypt, payload_to_symbols,
    max_payload_for, max_message_for, random_grid, _derive_masks,
)
from stegano_classic import apply_orientation, load_referents, load_referent_360_v3
from sweep import derive_sweep_index, crypto_reading_order

# ── Grille Carter — Grammaire à 3 catégories dérivées de la clé ───────────────
CARTER_GRID  = 90
CARTER_BLOCK = 6
CARTER_SIDE  = CARTER_GRID // CARTER_BLOCK    # 15 blocs par côté
CARTER_N     = CARTER_SIDE ** 2               # 225 blocs

_PURE, _STRUCTURED, _MESSAGE = 0, 1, 2

def _find_grammar_with_c_pub(grammar_key: bytes, variant: str,
                              grammar_fn, message_positions_fn):
    """
    Recherche déterministe (tâche 4, format v3) : essaie grammar_key_ctr pour
    ctr=0..MAX_REDRAWS-1 (voir crypto_core._redraw_grammar_key pour l'ordre
    exact de la dérivation complète) jusqu'à trouver une grammaire dont la
    capacité (max_message_for) est >= C_PUB[variant]. Retourne (grammar_key_ctr,
    grammar, n_pos) du premier succès — grammar_key_ctr est aussi la clé de
    dérivation des masques de position (voir encode_carter() ci-dessous) :
    un redraw retire seed/grammaire/masques ENSEMBLE, jamais l'un sans les
    autres (même invariant que Random/18/Hybrid, tâche 4). Lève ValueError
    après MAX_REDRAWS échecs — jamais de grille construite, même partielle.
    """
    for ctr in range(MAX_REDRAWS):
        gk_ctr = _redraw_grammar_key(grammar_key, variant, ctr)
        grammar = grammar_fn(gk_ctr)
        n_pos = message_positions_fn(grammar)
        if max_message_for(n_pos) >= C_PUB[variant]:
            return gk_ctr, grammar, n_pos
    raise ValueError(
        f"Échec de dérivation de grammaire après {MAX_REDRAWS} tentatives : "
        f"régénérer la clé maître (capacité cible C_PUB={C_PUB[variant]} "
        f"octets non atteinte).")

def _carter_split(master_key: bytes):
    """
    Séparation explicite des clés Carter [correction 2].
    Deux usages distincts → deux sous-clés indépendantes via HKDF.
      xchacha_key : chiffrement XChaCha20-Poly1305 standard (tâche 1)
      grammar_key : dérivation de la grammaire (rôles + formes)
    Propriété : la grammaire ne révèle rien sur la clé de chiffrement et vice-versa.
    Labels centralisés dans crypto_core.LABELS['carter256'] (tâche 3).
    """
    L = LABELS['carter256']
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'],
                         info=L['encrypt_info']).derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'],
                         info=L['grammar_info']).derive(master_key)
    return xchacha_key, grammar_key

def _carter_grammar(master_key: bytes, ref256: Dict) -> Dict:
    """
    Dérive la grammaire Carter depuis la clé maître (HKDF-SHA256).
    Assigne à chaque bloc un rôle et une forme (référent 256 v3, format
    déclaratif — data/referent_256_v3.json, 256 formes, plus d'orientation
    D4 ni de tirage de couleur : voir _carter_positions). Sans la clé, les
    rôles sont inconnus → grammaire = couche secrète.
    Labels centralisés dans crypto_core.LABELS['carter256'] (tâche 3).

    RÈGLE DE LECTURE v3 (câblage production, 2026-09-12) : positions
    stégano = les cases des couleurs déclarées `stegano_colors` du
    référent PRISES ENSEMBLE (rouge+bleu, 12 cases/forme — remplace
    l'ancien tirage d'UNE seule couleur, 6 cases). Seuls les blocs
    'message' en tiennent compte ; 'pure'/'structured' restent du bruit
    CSPRNG non structuré, EXACTEMENT comme avant (décision de l'auteur :
    le papier ne prévoit aucun changement hors des positions stégano).

    Retourne {'blocks': [{'role','form_id'}, ...], 'sweep_of_color':
    {couleur: 0..7}} -- le balayage (stegano.py) est dérivé UNE FOIS par
    couleur stégano pour toute la grammaire, jamais retiré par bloc.
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    L = LABELS['carter256']
    km = HKDF(_hh.SHA256(), CARTER_N * 2,
              salt=L['grammar_content_salt'],
              info=L['grammar_content_info']).derive(master_key)
    blocks = []
    for i in range(CARTER_N):
        rb, fb = km[i*2], km[i*2 + 1]
        role = _PURE if rb < 85 else (_STRUCTURED if rb < 170 else _MESSAGE)
        # 256 formes exactement (referent_256_v3.json) : fb utilisé tel
        # quel comme form_id, aucune mise à l'échelle ni rejet nécessaire.
        blocks.append({'role': role, 'form_id': fb})
    sweep_of_color = {c: derive_sweep_index(master_key, c)
                       for c in ref256['stegano_colors']}
    return {'blocks': blocks, 'sweep_of_color': sweep_of_color}

def _carter_positions(br: int, bc: int, g: Dict, ref256: Dict,
                       sweep_of_color: Dict) -> List[Tuple]:
    """Positions stégano de lecture du bloc (br, bc) selon la grammaire g :
    les cases des couleurs stégano du référent (rouge+bleu, 12 pour le
    référent 256 v3), ensemble, dans l'ordre de lecture (chaque couleur
    triée par son balayage, voir crypto_reading_order). `sweep_of_color`
    vient de _carter_grammar() (une seule dérivation pour toute la
    grammaire, jamais retirée par bloc)."""
    form = ref256['forms'][g['form_id']]
    stegano_colors = ref256['stegano_colors']
    grid_size = ref256['grid_size']
    cells_by_niveau = {0: {c: [tuple(p) for p in form[f'{c}_positions']]
                            for c in stegano_colors}}
    local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                        grid_size, sweep_of_color)
    r0, c0 = br * CARTER_BLOCK, bc * CARTER_BLOCK
    return [(r0+r, c0+c) for r, c in local_order
            if 0 <= r0+r < CARTER_GRID and 0 <= c0+c < CARTER_GRID]

def _carter_message_positions(grammar: Dict, ref256: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    sweep_of_color = grammar['sweep_of_color']
    return sum(len(_carter_positions(i // CARTER_SIDE, i % CARTER_SIDE, g, ref256, sweep_of_color))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

def encode_carter(message: str, master_key: bytes,
                  ref256: Dict,
                  _nonce: bytes = None, _y: int = None,
                  _leftover: List[int] = None, _noise_seed: bytes = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter 90×90.

    La clé maître dérive :
      - La grammaire (rôles des 225 blocs : pur / structuré / message)
      - La forme géométrique de chaque bloc non-pur

    Blocs 'message'    → positions = nibbles du message chiffré (ChaCha20-HKDF)
    Blocs 'structuré'  → positions = valeurs aléatoires (indiscernables)
    Blocs 'pur'        → tout aléatoire, aucune structure appliquée

    grid_to_csv() pour sérialiser, csv_to_grid() pour désérialiser.

    _nonce/_y/_leftover/_noise_seed (préfixés `_`, tâche 7) : injection
    interne pour le mode vecteurs — transmis tels quels à _encrypt/
    payload_to_symbols/random_grid, None (défaut) préserve exactement le
    comportement actuel. Aucun appelant public ne les renseigne ; voir
    stegano/vectors_internal.py.
    """
    xchacha_key, grammar_key = _carter_split(master_key)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — un message
    # plus long est refusé AVANT toute dérivation de grammaire ou
    # construction de grille, même si CETTE clé (après redraw) aurait pu
    # en porter davantage. Évite un canal où la limite accept/refuse
    # dépendrait de la clé. En OCTETS UTF-8 (pas des caractères — voir
    # crypto_core._message_to_bytes).
    if len(message.encode('utf-8')) > C_PUB['carter256']:
        raise ValueError(
            f"Message trop long : {len(message.encode('utf-8'))} > "
            f"C_PUB={C_PUB['carter256']} octets (capacité publique "
            f"garantie, indépendante de la clé).")
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter256',
        lambda gk: _carter_grammar(gk, ref256),
        lambda g: _carter_message_positions(g, ref256))
    payload = _encrypt(message, xchacha_key, n_pos, _nonce=_nonce)
    # Même flux de symboles base-44 que les autres encodeurs — toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, n_pos, _y=_y, _leftover=_leftover)
    # Masques de position (2026-09-12) : même construction ChaCha20 que
    # Random/18/Hybrid/déni (crypto_core._derive_masks), domaine propre à
    # Carter-256 — dérivés de gk_ctr (même clé que la grammaire : un
    # redraw retire les deux ensemble, voir _find_grammar_with_c_pub()).
    masks = _derive_masks(gk_ctr, len(nibbles), LABELS['mask_seed']['info_carter256'])

    # Remplissage bulk CSPRNG (voir crypto_core.random_grid) : mesuré ~x6-x40
    # plus rapide que CARTER_GRID² appels à secrets.randbelow() (audit
    # G. Kerma, §4.8 ; voir aussi BENCHMARKS_ARM64.md), même garantie de sécurité.
    grid  = random_grid(CARTER_GRID, CARTER_GRID, _noise_seed=_noise_seed)
    sweep_of_color = grammar['sweep_of_color']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER_SIDE, i % CARTER_SIDE
        for gr, gc in _carter_positions(br, bc, g, ref256, sweep_of_color):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN; nib_i += 1
    return grid

def decode_carter(grid: List[List[int]], master_key: bytes,
                  ref256: Dict) -> str:
    """
    Décode une grille Carter. La grammaire est re-dérivée depuis la clé
    (même recherche C_PUB déterministe que l'encodeur — tâche 4).
    Lève ValueError si la clé est incorrecte (tag Poly1305 invalide).
    """
    xchacha_key, grammar_key = _carter_split(master_key)
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter256',
        lambda gk: _carter_grammar(gk, ref256),
        lambda g: _carter_message_positions(g, ref256))
    masks = _derive_masks(gk_ctr, n_pos, LABELS['mask_seed']['info_carter256'])
    sweep_of_color = grammar['sweep_of_color']
    vals, ni = [], 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER_SIDE, i % CARTER_SIDE
        for gr, gc in _carter_positions(br, bc, g, ref256, sweep_of_color):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN); ni += 1
    return _decrypt(vals, xchacha_key, len(vals))

def carter_capacity(master_key: bytes, ref256: Dict) -> Dict:
    """Retourne les statistiques de capacité de la grammaire dérivée
    (après redraw C_PUB, tâche 4 — reflète ce qu'encode_carter() utilise
    réellement, pas la grammaire brute avant recherche)."""
    _, grammar_key = _carter_split(master_key)
    _, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter256',
        lambda gk: _carter_grammar(gk, ref256),
        lambda g: _carter_message_positions(g, ref256))
    blocks = grammar['blocks']
    n_msg = sum(1 for g in blocks if g['role'] == _MESSAGE)
    n_str = sum(1 for g in blocks if g['role'] == _STRUCTURED)
    n_pur = sum(1 for g in blocks if g['role'] == _PURE)
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

def _carter360_split(master_key: bytes):
    """Séparation des clés pour Carter 360 (salt distinct du Carter 256).
    Labels centralisés dans crypto_core.LABELS['carter360'] (tâche 3)."""
    L = LABELS['carter360']
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['encrypt_info']).derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['grammar_info']).derive(master_key)
    return xchacha_key, grammar_key

N_NIVEAUX_360 = 6
N_CALQUES_PAR_NIVEAU_360 = 60


def _calques_by_niveau_360(ref360: Dict) -> Dict[int, List[Dict]]:
    """{niveau: [calque, ...]} (60 par niveau), ordre STABLE (trié par
    famille/teinte) pour que le tirage par index soit reproductible --
    même construction que tools/calibrate_referent.py::_calques_by_niveau,
    désormais la version de production."""
    by_niveau = {n: [] for n in range(1, N_NIVEAUX_360 + 1)}
    for calque in sorted(ref360['calques'], key=lambda c: (c['famille'], c['teinte'], c['niveau'])):
        by_niveau[calque['niveau']].append(calque)
    return by_niveau


def _rejection_index_60(byte_iter) -> int:
    """Index dans [0,59] par rejet d'octet, sans biais modulo (limit =
    256 - 256%60 = 240)."""
    limit = 256 - (256 % N_CALQUES_PAR_NIVEAU_360)
    for b in byte_iter:
        if b < limit:
            return b % N_CALQUES_PAR_NIVEAU_360
    raise RuntimeError("keystream épuisé sans octet accepté (ne devrait jamais arriver)")


def _carter360_grammar(master_key: bytes, ref360: Dict) -> Dict:
    """
    Dérive la grammaire Carter pour le Référent 360 (blocs 12×12, format
    v3 -- data/referent_360_v3.json).

    RÈGLE DE LECTURE v3 (câblage production, 2026-09-12) : pour chaque
    bloc 'message', UN calque est tiré PAR NIVEAU (6 tirages, rejet sans
    biais vers [0,59] parmi les 60 calques de ce niveau) -- les positions
    stégano du bloc sont l'UNION des positions violettes des 6 calques
    ainsi tirés (48 en moyenne : 8 par niveau pour 56/60 identités, 0 ou
    16 pour les 4 identités "MUT"). Remplace l'ancien tirage à une seule
    couleur (C1/C2/C3) parmi 294 formes plates, qui rendait 0 position
    pour 44,9% des blocs message (canal absent de la forme tirée).

    Retourne {'blocks':[{role, niveau_calque_idx|None}, ...],
    'by_niveau': {...}, 'sweep_of_color': {'violet': 0..7}}.
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
    L = LABELS['carter360']
    role_key = HKDF(_hh.SHA256(), CARTER360_N,
                     salt=L['grammar_content_salt'],
                     info=L['grammar_content_info']).derive(master_key)
    calque_key = HKDF(_hh.SHA256(), 32,
                       salt=L['niveau_calque_salt'],
                       info=L['niveau_calque_info']).derive(master_key)
    # Sur-tirage large : jusqu'à CARTER360_N*N_NIVEAUX_360 tirages, ~6,25%
    # de rejet chacun (limite=240/256) -- même dimensionnement que
    # tools/calibrate_referent.py::_n_pos_for_key (calibration).
    keystream = Cipher(algorithms.ChaCha20(calque_key, bytes(16)), mode=None).encryptor()
    buf = keystream.update(b'\x00' * (CARTER360_N * N_NIVEAUX_360 * 4))
    byte_iter = iter(buf)

    blocks = []
    for i in range(CARTER360_N):
        rb = role_key[i]
        role = _PURE if rb < 85 else (_STRUCTURED if rb < 170 else _MESSAGE)
        niveau_calque_idx = None
        if role == _MESSAGE:
            niveau_calque_idx = [_rejection_index_60(byte_iter)
                                  for _ in range(N_NIVEAUX_360)]
        blocks.append({'role': role, 'niveau_calque_idx': niveau_calque_idx})

    sweep_of_color = {c: derive_sweep_index(master_key, c)
                       for c in ref360['stegano_colors']}
    return {'blocks': blocks, 'by_niveau': _calques_by_niveau_360(ref360),
            'sweep_of_color': sweep_of_color}

def _carter360_positions(br: int, bc: int, g: Dict, ref360: Dict,
                          by_niveau: Dict, sweep_of_color: Dict) -> List[Tuple]:
    """Positions stégano de lecture du bloc 12×12 (br, bc) : l'union des
    positions violettes des 6 calques tirés (un par niveau, voir
    _carter360_grammar), dans l'ordre de lecture (niveaux croissants,
    chacun trié par le balayage de 'violet' -- une seule couleur stégano
    pour ce référent, voir crypto_reading_order)."""
    stegano_colors = ref360['stegano_colors']
    cells_by_niveau = {}
    for niveau, calque_idx in zip(range(1, N_NIVEAUX_360 + 1), g['niveau_calque_idx']):
        calque = by_niveau[niveau][calque_idx]
        cells_by_niveau[niveau] = {
            c: [tuple(p) for p in calque.get(f'{c}_positions', [])]
            for c in stegano_colors
        }
    local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                        ref360['grid_size'], sweep_of_color)
    r0, c0 = br * CARTER360_BLOCK, bc * CARTER360_BLOCK
    return [(r0+r, c0+c) for r, c in local_order
            if 0 <= r0+r < CARTER360_GRID and 0 <= c0+c < CARTER360_GRID]

def _carter360_message_positions(grammar: Dict, ref360: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    by_niveau = grammar['by_niveau']
    sweep_of_color = grammar['sweep_of_color']
    return sum(len(_carter360_positions(i // CARTER360_SIDE, i % CARTER360_SIDE,
                                        g, ref360, by_niveau, sweep_of_color))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

def encode_carter_360(message: str, master_key: bytes,
                       ref360: Optional[Dict] = None,
                       _nonce: bytes = None, _y: int = None,
                       _leftover: List[int] = None, _noise_seed: bytes = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter 180×180 (Référent 360, format
    v3 -- data/referent_360_v3.json par défaut).

    _nonce/_y/_leftover/_noise_seed (tâche 7) : voir encode_carter().

    Grammaire dérivée de master_key :
      'pur'       → bruit aléatoire, aucune structure 12×12
      'structuré' → bruit aléatoire, EXACTEMENT comme 'pur' (rien ne
                    change hors des positions stégano, décision de
                    l'auteur, câblage production 2026-09-12)
      'message'   → 6 calques tirés (un par niveau) → positions violettes
                    ensemble, valeurs = message ChaCha20-HKDF

    Capacité : ~48 positions stégano en moyenne par bloc message (8 par
    niveau pour 56/60 identités, 0 ou 16 pour les 4 identités "MUT") --
    voir carter360_capacity() pour le chiffre exact d'une clé donnée.
    """
    if ref360 is None:
        ref360 = load_referent_360_v3()

    xchacha_key, grammar_key = _carter360_split(master_key)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # encode_carter() pour la justification complète. En OCTETS UTF-8.
    if len(message.encode('utf-8')) > C_PUB['carter360']:
        raise ValueError(
            f"Message trop long : {len(message.encode('utf-8'))} > "
            f"C_PUB={C_PUB['carter360']} octets (capacité publique "
            f"garantie, indépendante de la clé).")
    # Charge utile à longueur fixe (format v3, tâche 2) : n_pos doit être
    # connu AVANT l'appel à _encrypt(). Recherche C_PUB (tâche 4) : redraw
    # déterministe jusqu'à satisfaction, voir _find_grammar_with_c_pub().
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter360',
        lambda gk: _carter360_grammar(gk, ref360),
        lambda g: _carter360_message_positions(g, ref360))
    payload = _encrypt(message, xchacha_key, n_pos, _nonce=_nonce)
    # Même flux de symboles base-44 que les autres encodeurs — toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, n_pos, _y=_y, _leftover=_leftover)
    # Masques de position (2026-09-12) : voir encode_carter().
    masks = _derive_masks(gk_ctr, len(nibbles), LABELS['mask_seed']['info_carter360'])

    # Remplissage bulk CSPRNG — voir encode_carter().
    grid  = random_grid(CARTER360_GRID, CARTER360_GRID, _noise_seed=_noise_seed)
    by_niveau = grammar['by_niveau']
    sweep_of_color = grammar['sweep_of_color']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER360_SIDE, i % CARTER360_SIDE
        for gr, gc in _carter360_positions(br, bc, g, ref360, by_niveau, sweep_of_color):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN; nib_i += 1
    return grid

def decode_carter_360(grid: List[List[int]], master_key: bytes,
                       ref360: Optional[Dict] = None) -> str:
    """Décode une grille Carter 180×180. Lève ValueError si clé incorrecte."""
    if ref360 is None:
        ref360 = load_referent_360_v3()
    xchacha_key, grammar_key = _carter360_split(master_key)
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter360',
        lambda gk: _carter360_grammar(gk, ref360),
        lambda g: _carter360_message_positions(g, ref360))
    masks = _derive_masks(gk_ctr, n_pos, LABELS['mask_seed']['info_carter360'])
    by_niveau = grammar['by_niveau']
    sweep_of_color = grammar['sweep_of_color']
    vals, ni = [], 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER360_SIDE, i % CARTER360_SIDE
        for gr, gc in _carter360_positions(br, bc, g, ref360, by_niveau, sweep_of_color):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN); ni += 1
    return _decrypt(vals, xchacha_key, len(vals))

def carter360_capacity(master_key: bytes,
                        ref360: Optional[Dict] = None) -> Dict:
    """Statistiques de capacité de la grammaire Carter 360 (après redraw
    C_PUB, tâche 4 — reflète ce qu'encode_carter_360() utilise réellement)."""
    if ref360 is None:
        ref360 = load_referent_360_v3()
    _, grammar_key = _carter360_split(master_key)
    _, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'carter360',
        lambda gk: _carter360_grammar(gk, ref360),
        lambda g: _carter360_message_positions(g, ref360))
    blocks = grammar['blocks']
    n_msg = sum(1 for g in blocks if g['role'] == _MESSAGE)
    n_str = sum(1 for g in blocks if g['role'] == _STRUCTURED)
    n_pur = sum(1 for g in blocks if g['role'] == _PURE)
    return {
        'referent':         '360',
        'grille':           f'{CARTER360_GRID}×{CARTER360_GRID}',
        'blocs_message':    n_msg,
        'blocs_structure':  n_str,
        'blocs_purs':       n_pur,
        # Moyenne constatee sur les positions violettes reellement rendues
        # (6 niveaux, ~8/niveau pour 56/60 identites -- 0 ou 16 pour les 4
        # identites MUT) -- voir _carter360_grammar/_carter360_positions.
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
    """Séparation des clés pour Carter mixte (salt distinct).
    Labels centralisés dans crypto_core.LABELS['cartermix'] (tâche 3)."""
    L = LABELS['cartermix']
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['encrypt_info']).derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['grammar_info']).derive(master_key)
    return xchacha_key, grammar_key

def _carter_mix_grammar(master_key: bytes,
                         ref256: Dict,
                         ref360: Dict) -> Dict:
    """
    Dérive la grammaire Carter mixte depuis la clé maître (format v3,
    câblage production 2026-09-12). Pour chaque méta-bloc 12×12 (225
    total) :
      - référent : 256 (4 sous-blocs 6×6) ou 360 (1 bloc 12×12)
      - rôle     : pur / structuré / message
      - Ref256 : UN form_id (0..255, direct, référent v3) appliqué
        IDENTIQUEMENT aux 4 sous-blocs -- jusqu'à 4×12=48 positions
        stégano (rouge+bleu ensemble par sous-bloc).
      - Ref360 : 6 calques tirés (un par niveau, comme _carter360_grammar)
        -- positions stégano = union des violettes, ~48 en moyenne.
    Sans la clé, référent ET rôle sont inconnus.
    Labels centralisés dans crypto_core.LABELS['cartermix'] (tâche 3).
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
    L = LABELS['cartermix']
    km = HKDF(_hh.SHA256(), CARTER_MIX_N * 3,
              salt=L['grammar_content_salt'],
              info=L['grammar_content_info']).derive(master_key)
    calque_key = HKDF(_hh.SHA256(), 32,
                       salt=L['niveau_calque_salt'],
                       info=L['niveau_calque_info']).derive(master_key)
    keystream = Cipher(algorithms.ChaCha20(calque_key, bytes(16)), mode=None).encryptor()
    buf = keystream.update(b'\x00' * (CARTER_MIX_N * N_NIVEAUX_360 * 4))
    byte_iter = iter(buf)

    blocks = []
    for i in range(CARTER_MIX_N):
        b = km[i*3 : i*3+3]
        role = _PURE if b[0] < 85 else (_STRUCTURED if b[0] < 170 else _MESSAGE)
        ref  = _REF256 if b[1] < 128 else _REF360
        if ref == _REF256:
            blocks.append({'role': role, 'ref': ref, 'form_id': b[2]})
        else:
            niveau_calque_idx = ([_rejection_index_60(byte_iter) for _ in range(N_NIVEAUX_360)]
                                  if role == _MESSAGE else None)
            blocks.append({'role': role, 'ref': ref, 'niveau_calque_idx': niveau_calque_idx})

    sweep_256 = {c: derive_sweep_index(master_key, c) for c in ref256['stegano_colors']}
    sweep_360 = {c: derive_sweep_index(master_key, c) for c in ref360['stegano_colors']}
    return {'blocks': blocks, 'by_niveau': _calques_by_niveau_360(ref360),
            'sweep_256': sweep_256, 'sweep_360': sweep_360}

def _mix_positions(mbr: int, mbc: int, g: Dict, ref256: Dict, ref360: Dict,
                    by_niveau: Dict, sweep_256: Dict, sweep_360: Dict) -> List[Tuple]:
    """
    Positions stégano de lecture d'un méta-bloc (mbr, mbc) selon sa
    grammaire. Ref256 : le même form_id (rouge+bleu ensemble, 12
    positions triées par balayage) répliqué sur les 4 sous-blocs 6×6 --
    jusqu'à 48. Ref360 : union des positions violettes des 6 calques
    tirés (un par niveau) sur le bloc 12×12 entier -- ~48 en moyenne.
    """
    N = CARTER_MIX_GRID
    if g['ref'] == _REF256:
        form = ref256['forms'][g['form_id']]
        stegano_colors = ref256['stegano_colors']
        cells_by_niveau = {0: {c: [tuple(p) for p in form[f'{c}_positions']]
                                for c in stegano_colors}}
        local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                            ref256['grid_size'], sweep_256)
        pos = []
        for dr in range(2):      # 2×2 sous-blocs dans le méta-bloc
            for dc in range(2):
                r0 = mbr * CARTER_MIX_META + dr * CARTER_BLOCK
                c0 = mbc * CARTER_MIX_META + dc * CARTER_BLOCK
                for r, c in local_order:
                    gr, gc = r0+r, c0+c
                    if 0 <= gr < N and 0 <= gc < N:
                        pos.append((gr, gc))
        return pos   # jusqu'à 48 (4×12)
    else:
        stegano_colors = ref360['stegano_colors']
        cells_by_niveau = {}
        for niveau, calque_idx in zip(range(1, N_NIVEAUX_360 + 1), g['niveau_calque_idx']):
            calque = by_niveau[niveau][calque_idx]
            cells_by_niveau[niveau] = {
                c: [tuple(p) for p in calque.get(f'{c}_positions', [])]
                for c in stegano_colors
            }
        local_order = crypto_reading_order(cells_by_niveau, stegano_colors,
                                            ref360['grid_size'], sweep_360)
        r0, c0 = mbr * CARTER_MIX_META, mbc * CARTER_MIX_META
        return [(r0+r, c0+c) for r, c in local_order
                if 0 <= r0+r < N and 0 <= c0+c < N]

def _mix_message_positions(grammar: Dict, ref256: Dict, ref360: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    by_niveau = grammar['by_niveau']
    sweep_256, sweep_360 = grammar['sweep_256'], grammar['sweep_360']
    return sum(len(_mix_positions(i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE,
                                  g, ref256, ref360, by_niveau, sweep_256, sweep_360))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

def encode_carter_mix(message: str, master_key: bytes,
                       ref256: Dict,
                       ref360: Optional[Dict] = None,
                       _nonce: bytes = None, _y: int = None,
                       _leftover: List[int] = None, _noise_seed: bytes = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter mixte 180×180 (format v3).
    Ref256 et Ref360 coexistent — la clé détermine quel référent chaque
    méta-bloc utilise.

    Méta-blocs Ref256 message : jusqu'à 4×12=48 positions (même form_id,
    répliqué sur les 4 sous-blocs 6×6, rouge+bleu ensemble par sous-bloc).
    Méta-blocs Ref360 message : ~48 en moyenne (6 calques tirés, un par
    niveau, union des positions violettes).

    La capacité totale est elle-même dérivée de la clé (obscurcissement).

    _nonce/_y/_leftover/_noise_seed (tâche 7) : voir encode_carter().
    """
    if ref360 is None:
        ref360 = load_referent_360_v3()

    xchacha_key, grammar_key = _carter_mix_split(master_key)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # encode_carter() pour la justification complète. En OCTETS UTF-8.
    if len(message.encode('utf-8')) > C_PUB['cartermix']:
        raise ValueError(
            f"Message trop long : {len(message.encode('utf-8'))} > "
            f"C_PUB={C_PUB['cartermix']} octets (capacité publique "
            f"garantie, indépendante de la clé).")
    # Charge utile à longueur fixe (format v3, tâche 2) : n_pos doit être
    # connu AVANT l'appel à _encrypt(). Recherche C_PUB (tâche 4) : redraw
    # déterministe jusqu'à satisfaction, voir _find_grammar_with_c_pub().
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'cartermix',
        lambda gk: _carter_mix_grammar(gk, ref256, ref360),
        lambda g: _mix_message_positions(g, ref256, ref360))

    payload = _encrypt(message, xchacha_key, n_pos, _nonce=_nonce)
    # Même flux de symboles base-44 que les autres encodeurs — toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, n_pos, _y=_y, _leftover=_leftover)
    # Masques de position (2026-09-12) : voir encode_carter().
    masks = _derive_masks(gk_ctr, len(nibbles), LABELS['mask_seed']['info_cartermix'])

    # Remplissage bulk CSPRNG — voir encode_carter().
    grid  = random_grid(CARTER_MIX_GRID, CARTER_MIX_GRID, _noise_seed=_noise_seed)
    by_niveau = grammar['by_niveau']
    sweep_256, sweep_360 = grammar['sweep_256'], grammar['sweep_360']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        mbr, mbc = i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE
        for gr, gc in _mix_positions(mbr, mbc, g, ref256, ref360, by_niveau, sweep_256, sweep_360):
            if nib_i >= len(nibbles): break
            grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN; nib_i += 1
    return grid

def decode_carter_mix(grid: List[List[int]], master_key: bytes,
                       ref256: Dict,
                       ref360: Optional[Dict] = None) -> str:
    """Décode une grille Carter mixte 180×180."""
    if ref360 is None:
        ref360 = load_referent_360_v3()
    xchacha_key, grammar_key = _carter_mix_split(master_key)
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        grammar_key, 'cartermix',
        lambda gk: _carter_mix_grammar(gk, ref256, ref360),
        lambda g: _mix_message_positions(g, ref256, ref360))
    masks = _derive_masks(gk_ctr, n_pos, LABELS['mask_seed']['info_cartermix'])
    by_niveau = grammar['by_niveau']
    sweep_256, sweep_360 = grammar['sweep_256'], grammar['sweep_360']
    vals, ni = [], 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        mbr, mbc = i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE
        for gr, gc in _mix_positions(mbr, mbc, g, ref256, ref360, by_niveau, sweep_256, sweep_360):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN); ni += 1
    return _decrypt(vals, xchacha_key, len(vals))

def carter_mix_capacity(master_key: bytes,
                         ref256: Dict,
                         ref360: Optional[Dict] = None) -> Dict:
    """Statistiques de capacité de la grammaire Carter mixte (après redraw
    C_PUB, tâche 4 — reflète ce qu'encode_carter_mix() utilise réellement)."""
    if ref360 is None:
        ref360 = load_referent_360_v3()
    _, grammar_key = _carter_mix_split(master_key)
    _, grammar, nibs = _find_grammar_with_c_pub(
        grammar_key, 'cartermix',
        lambda gk: _carter_mix_grammar(gk, ref256, ref360),
        lambda g: _mix_message_positions(g, ref256, ref360))
    blocks = grammar['blocks']
    n256m = sum(1 for g in blocks if g['role']==_MESSAGE and g['ref']==_REF256)
    n360m = sum(1 for g in blocks if g['role']==_MESSAGE and g['ref']==_REF360)
    n256s = sum(1 for g in blocks if g['role']==_STRUCTURED and g['ref']==_REF256)
    n360s = sum(1 for g in blocks if g['role']==_STRUCTURED and g['ref']==_REF360)
    n_pur = sum(1 for g in blocks if g['role']==_PURE)
    # La capacité doit être calculée comme le fait l'encodeur : Ref256
    # rend jusqu'à 4×12=48 positions/méta-bloc (répliqué sur 4 sous-blocs),
    # Ref360 ~48 en moyenne (6 calques tirés) -- jamais une constante
    # exacte, une forme tronquée au bord de la grille en rend moins.
    # (nibs déjà obtenu par _find_grammar_with_c_pub ci-dessus.)
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
