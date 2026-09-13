# (c) Anibal Edelberto Amiot 2026 - La Livree d'Hermes
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
carter_random.py — Façade de compatibilité : Carter-Random, Carter-18, Carter-Hybrid
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réorganisation de stegano/ (2026-09, branche deux-cles) : la grammaire
(rôles, formes, positions, redraw, référents 6×6/18×18) vit désormais
dans grammar.py, la dérivation des masques dans masks.py. Ce fichier ne
garde que les fonctions publiques encode_*/decode_*/*_fits/*_capacity,
inchangées pour tout le code qui les appelle déjà (secu_box.py,
vectors_internal.py, la suite de tests) — et ré-exporte les constantes
et fonctions de grammaire dont ces mêmes appelants ont besoin
directement (ex. `carter_random.CONC_ORDER`, `carter_random._derive_params`),
pour qu'aucun appelant existant n'ait à changer.

Aucun changement de comportement : chaque fonction encode_*/decode_*/
*_fits/*_capacity est le copier-coller exact de sa version précédente,
ses dépendances de grammaire venant maintenant de grammar.py au lieu
d'être définies localement. Vérifié par la suite complète (149 tests)
restant verte à l'identique.
"""

from typing import List, Dict, Tuple, Optional

from stegano_lib import (
    ALPHA_LEN, LABELS, C_PUB, MAX_REDRAWS, _redraw_grammar_key,
    _encrypt, _decrypt, payload_to_symbols, max_message_for,
    _carter_split, _PURE, _STRUCTURED, _MESSAGE, random_grid, _derive_masks,
)
from masks import derive_masks
from sweep import derive_sweep_index, crypto_reading_order
from keys import new_layout_nonce, derive_gk_nu, nu_to_symbols, symbols_to_nu, NU_SYMBOLS

from grammar import (
    # Carter-Random (individuel/méta)
    GRID_SIZE, CELL_SIZE, N_SIDE, N_BLOCKS, META, N_META, N_META_TOT, N_DIR, N_FORMS,
    SEEDS, CONC_ORDER,
    get_referent, _RANDOM_STEGANO_COLORS, _form_stegano_positions,
    _random_individual_positions, _random_meta_positions,
    _derive_params, _grammar_individual, _grammar_meta, _random_c_pub_key,
    _find_random_grammar_with_c_pub,
    # Carter-18
    BLOCK_18, N_LAYERS, N_FORMS_18, N_DIR_18, _LAYERS_BY_DIR, _POSITIONS_PER_DIR,
    _layer_cells, _build_form_18, get_referent_18, _grammar_18, _carter18_seed,
    _carter18_positions, _find_carter18_grammar_with_c_pub,
    # Carter-Hybrid
    MODE_18, MODE_6,
    _grammar_hybrid, _subblock_positions, _carter_hybrid_seeds,
    _hybrid_positions, _find_hybrid_grammar_with_c_pub,
)

# ── Carter-Random : encode ──────────────────────────────────────────────────────
def encode_carter_random(message: str,
                          ck: bytes, gk: bytes,
                          grid_size: int = GRID_SIZE,
                          _nonce: bytes = None, _y: int = None,
                          _leftover: List[int] = None, _noise_seed: bytes = None,
                          _nu: bytes = None) -> Tuple[List, Dict]:
    """
    Encode un message dans une grille 90×90 (format v4 : deux clés
    indépendantes, keys.py -- voir carter.encode_carter()). Tous les
    paramètres géométriques sont dérivés de gk_nu = derive_gk_nu(gk, nu,
    'carterrandom').

    _nonce/_y/_leftover/_noise_seed/_nu (préfixés `_`, tâche 7 puis format
    v4) : injection interne pour le mode vecteurs — voir
    carter.encode_carter(). Le redraw (ctr), le mode (CR-1) et les masques
    restent 100% déterministes depuis gk_nu seul, aucune injection n'y est
    nécessaire.
    """
    c_pub_key = _random_c_pub_key(grid_size)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS
    # UTF-8 du message (pas des caractères — voir crypto_core._message_to_bytes).
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB[c_pub_key]:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB[c_pub_key]} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterrandom')
    n_side_g  = grid_size // CELL_SIZE
    n_meta_g  = n_side_g  // META

    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed, mode (CR-1 compris) et grammaire redérivés ensemble à chaque
    # tentative, voir _find_random_grammar_with_c_pub().
    gk_ctr, ref_idx, meta_mode, ref, grammar, cap = _find_random_grammar_with_c_pub(
        gk_nu, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}

    payload = _encrypt(message, ck, cap, _nonce=_nonce)
    # Flux de symboles base-44 uniformes — même fonction que celle utilisée
    # par encode_carter() dans stegano_lib.py : toutes les positions message
    # portent un symbole de charge utile, aucun en-tête séparé.
    nibbles = payload_to_symbols(payload, cap, _y=_y, _leftover=_leftover)

    # Remplissage bulk CSPRNG (voir crypto_core.random_grid) : mesuré ~x6-x40
    # plus rapide que grid_size² appels à secrets.randbelow() (audit G. Kerma,
    # §4.8 ; voir aussi BENCHMARKS_ARM64.md), même garantie de sécurité.
    grid = random_grid(grid_size, grid_size, _noise_seed=_noise_seed)
    # Masques dérivés de gk_ctr (même clé redraw que la grammaire, tâche 4) :
    # un redraw retire ref_idx+mode+rôles+masques ensemble, comme une seule unité.
    masks = derive_masks(gk_ctr, len(nibbles) + 128, 'carterrandom')
    nib_i = 0

    if not meta_mode:
        # ── Mode individuel : bloc à bloc ──
        for i, g in enumerate(grammar):
            if g['role'] != _MESSAGE: continue
            for gr, gc in _random_individual_positions(i // n_side_g, i % n_side_g,
                                                         g, ref, sweep_of_color, grid_size):
                if nib_i >= len(nibbles): break
                grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN
                nib_i += 1
        mode_str  = 'individual'
        n_msg_out = sum(1 for g in grammar if g['role'] == _MESSAGE)

    else:
        # ── Mode méta-concentrique : méta-blocs 18×18 ──
        # grammar/cap déjà dérivés plus haut par la recherche C_PUB (tâche 4).
        for mi, mg in enumerate(grammar):
            if mg['role'] != _MESSAGE: continue
            for gr, gc in _random_meta_positions(mi // n_meta_g, mi % n_meta_g,
                                                  mg, ref, sweep_of_color, grid_size):
                if nib_i >= len(nibbles): break
                grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN
                nib_i += 1
        mode_str  = 'meta'
        n_msg_out = sum(1 for g in grammar if g['role'] == _MESSAGE)

    # Nonce de disposition, écrit en dernier — voir carter.encode_carter().
    for c, sym in enumerate(nu_to_symbols(nu)):
        grid[0][c] = sym

    return grid, {
        'referent_index': ref_idx, 'mode': mode_str, 'meta_mode': meta_mode,
        'n_msg_blocks': n_msg_out, 'capacity_chars': max_message_for(cap),
    }

# ── Carter-Random : decode ───────────────────────────────────────────────────────
def decode_carter_random(grid: List, ck: bytes, gk: bytes,
                          grid_size: int = GRID_SIZE) -> str:
    """Décode une grille 90×90 (format v4). Lit nu depuis les 36 premières
    cases de la ligne 0 (même recherche C_PUB déterministe que
    l'encodeur — tâche 4)."""
    nu = symbols_to_nu(grid[0][:NU_SYMBOLS])
    gk_nu = derive_gk_nu(gk, nu, 'carterrandom')
    gk_ctr, ref_idx, meta_mode, ref, grammar, cap = _find_random_grammar_with_c_pub(
        gk_nu, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}
    n_side_g  = grid_size // CELL_SIZE
    n_meta_g  = n_side_g  // META

    masks = derive_masks(gk_ctr, grid_size * grid_size, 'carterrandom')
    vals, nib_i = [], 0

    if not meta_mode:
        for i, g in enumerate(grammar):
            if g['role'] != _MESSAGE: continue
            for gr, gc in _random_individual_positions(i // n_side_g, i % n_side_g,
                                                         g, ref, sweep_of_color, grid_size):
                vals.append((grid[gr][gc] - masks[nib_i]) % ALPHA_LEN)
                nib_i += 1
    else:
        for mi, mg in enumerate(grammar):
            if mg['role'] != _MESSAGE: continue
            for gr, gc in _random_meta_positions(mi // n_meta_g, mi % n_meta_g,
                                                  mg, ref, sweep_of_color, grid_size):
                vals.append((grid[gr][gc] - masks[nib_i]) % ALPHA_LEN)
                nib_i += 1

    return _decrypt(vals, ck, len(vals))

# ── Utilitaires ─────────────────────────────────────────────────────────────────
def random_fits(message: str, ck: bytes, gk: bytes,
                 grid_size: int = GRID_SIZE, _nu: bytes = None) -> bool:
    """Vérifie si le message tient dans la grille avec la config dérivée
    (après redraw C_PUB, tâche 4 — reflète ce qu'encode_carter_random()
    utilise réellement)."""
    c_pub_key = _random_c_pub_key(grid_size)
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB[c_pub_key]:
        return False
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterrandom')
    _, _, _, _, _, n_pos = _find_random_grammar_with_c_pub(gk_nu, grid_size)
    return msg_bytes_len <= max_message_for(n_pos)

def random_capacity(gk: bytes, grid_size: int = GRID_SIZE, _nu: bytes = None) -> Dict:
    """Retourne la capacité disponible pour une clé donnée (après redraw
    C_PUB, tâche 4). Format v4 : la capacité dépend de gk ET de nu -- voir
    carter.carter_capacity()."""
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterrandom')
    gk_ctr, ref_idx, meta_mode, ref, grammar, n_pos = _find_random_grammar_with_c_pub(
        gk_nu, grid_size)
    n_msg = sum(1 for x in grammar if x['role'] == _MESSAGE)
    n_pur = sum(1 for x in grammar if x['role'] == _PURE)
    n_str = sum(1 for x in grammar if x['role'] == _STRUCTURED)
    return {
        'referent_index': ref_idx, 'meta_mode': meta_mode,
        'n_msg': n_msg, 'n_pure': n_pur, 'n_struct': n_str,
        'chars_max': max_message_for(n_pos),
        'geometry': f"cell=6×6 referent_index={ref_idx} mode={'meta' if meta_mode else 'individual'}",
    }

# ── Aliases Carter Random 360 (grille 180×180) ────────────────────────────────
def encode_carter_random_360(message: str, ck: bytes, gk: bytes) -> Tuple[List, Dict]:
    """Carter Random sur grille 180×180 (4× plus de blocs, capacité ~4×)."""
    return encode_carter_random(message, ck, gk, grid_size=180)

def decode_carter_random_360(grid: List, ck: bytes, gk: bytes) -> str:
    """Décode une grille Carter Random 180×180."""
    return decode_carter_random(grid, ck, gk, grid_size=180)


# ── Carter-18 ───────────────────────────────────────────────────────────────────

def encode_carter_18(message: str,
                     ck: bytes, gk: bytes,
                     grid_size: int = GRID_SIZE,
                     _nonce: bytes = None, _y: int = None,
                     _leftover: List[int] = None, _noise_seed: bytes = None,
                     _nu: bytes = None) -> Tuple[List[List[int]], Dict]:
    """
    Carter-18 : encode sur grille grid_size×grid_size avec méta-blocs 18×18
    (format v4 : deux clés indépendantes, keys.py -- voir carter.encode_carter()).

    Chaque méta-bloc 18×18 porte ses symboles en ordre concentrique — noyau
    d'abord pour dir 0, périphérie d'abord pour dir 1, couches paires/impaires
    pour dir 2/3. Les positions à l'intérieur de chaque couche sont mélangées
    aléatoirement par la graine (publique) du référent.

    Capacité nettement supérieure à Carter-256 (324 positions par méta-bloc
    message en direction 0/1, contre 6 par bloc en Carter-256).

    _nonce/_y/_leftover/_noise_seed/_nu (tâche 7 puis format v4) : voir
    encode_carter_random().
    """
    # C18-2 (audit G. Kerma, rév. 5) : grid_size doit être multiple de BLOCK_18,
    # sinon n_side_18 = grid_size // BLOCK_18 tronque silencieusement et les
    # méta-blocs ne pavent plus la grille correctement.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS UTF-8.
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carter18']:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB['carter18']} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carter18')
    n_side_18 = grid_size // BLOCK_18
    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed du référent et grammaire redérivés ensemble à chaque tentative.
    gk_ctr, seed, ref18, grammar, cap = _find_carter18_grammar_with_c_pub(
        gk_nu, grid_size)

    payload = _encrypt(message, ck, cap, _nonce=_nonce)
    # Même flux de symboles base-44 que encode_carter_random() ci-dessus —
    # charge utile à longueur fixe (format v3, tâche 2) : toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, cap, _y=_y, _leftover=_leftover)

    masks = derive_masks(gk_ctr, len(nibbles) + 256, 'carter18')
    # Remplissage bulk CSPRNG — voir encode_carter_random().
    grid  = random_grid(grid_size, grid_size, _noise_seed=_noise_seed)

    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE or ni >= len(nibbles): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        for gr, gc in _carter18_positions(br18, bc18, g, ref18, grid_size):
            if ni >= len(nibbles): break
            grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
            ni += 1

    # Nonce de disposition, écrit en dernier — voir carter.encode_carter().
    for c, sym in enumerate(nu_to_symbols(nu)):
        grid[0][c] = sym

    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    return grid, {
        'seed': seed, 'grid_size': grid_size, 'mode': 'carter-18',
        'n_msg_blocks': n_msg, 'capacity_chars': max_message_for(cap),
    }


def decode_carter_18(grid: List[List[int]],
                     ck: bytes, gk: bytes,
                     grid_size: int = GRID_SIZE) -> str:
    """Décode une grille encodée par encode_carter_18 (format v4). Lit nu
    depuis les 36 premières cases de la ligne 0. ValueError si clé
    incorrecte (même recherche C_PUB déterministe que l'encodeur — tâche 4)."""
    # C18-2 (audit G. Kerma, rév. 5) : voir encode_carter_18.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    nu = symbols_to_nu(grid[0][:NU_SYMBOLS])
    gk_nu = derive_gk_nu(gk, nu, 'carter18')
    gk_ctr, seed, ref18, grammar, n_tot_pos = _find_carter18_grammar_with_c_pub(
        gk_nu, grid_size)
    n_side_18 = grid_size // BLOCK_18

    masks = derive_masks(gk_ctr, n_tot_pos + 256, 'carter18')

    vals = []; ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        for gr, gc in _carter18_positions(br18, bc18, g, ref18, grid_size):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
            ni += 1
    return _decrypt(vals, ck, len(vals))


def carter18_fits(message: str, ck: bytes, gk: bytes,
                  grid_size: int = GRID_SIZE, _nu: bytes = None) -> bool:
    """Vérifie si le message tient dans la grille Carter-18 avec la config
    dérivée (après redraw C_PUB, tâche 4)."""
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carter18']:
        return False
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carter18')
    _, _, _, _, cap = _find_carter18_grammar_with_c_pub(gk_nu, grid_size)
    return msg_bytes_len <= max_message_for(cap)


def carter18_capacity(gk: bytes, grid_size: int = GRID_SIZE, _nu: bytes = None) -> Dict:
    """Retourne les infos de capacité Carter-18 pour cette clé (après
    redraw C_PUB, tâche 4). Format v4 : la capacité dépend de gk ET de nu."""
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carter18')
    gk_ctr, seed, ref18, grammar, cap = _find_carter18_grammar_with_c_pub(
        gk_nu, grid_size)
    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_side_18 = grid_size // BLOCK_18
    return {
        'n_blocks': n_side_18 * n_side_18,
        'n_msg_blocks': n_msg,
        'positions_per_block_dir0': _POSITIONS_PER_DIR[0],   # 324
        'positions_per_block_dir2': _POSITIONS_PER_DIR[2],   # 180
        'capacity_chars': max_message_for(cap),
        'mode': 'carter-18',
    }


# ── Carter-Hybrid ───────────────────────────────────────────────────────────────

def encode_carter_hybrid(message: str,
                         ck: bytes, gk: bytes,
                         grid_size: int = GRID_SIZE,
                         _nonce: bytes = None, _y: int = None,
                         _leftover: List[int] = None, _noise_seed: bytes = None,
                         _nu: bytes = None) -> Tuple[List[List[int]], Dict]:
    """
    Carter-Hybrid : mélange 18×18 concentrique + 6×6 sous-blocs (format v4 :
    deux clés indépendantes, keys.py -- voir carter.encode_carter()).

    Les méta-blocs message en MODE_18 offrent une haute capacité (jusqu'à
    324 positions) ; ceux en MODE_6 complètent en grain plus fin (54
    positions, 9 sous-blocs 6×6). Le mode par bloc est dérivé de la clé,
    pas du message : pas d'adaptation à la longueur qui distinguerait un
    message court d'un message long depuis la seule géométrie.

    _nonce/_y/_leftover/_noise_seed/_nu (tâche 7 puis format v4) : voir
    encode_carter_random().
    """
    # C18-2 (audit G. Kerma, rév. 5) : grid_size doit être multiple de BLOCK_18,
    # sinon n_side_18 = grid_size // BLOCK_18 tronque silencieusement et les
    # méta-blocs ne pavent plus la grille correctement.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS UTF-8.
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carterhybrid']:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB['carterhybrid']} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterhybrid')
    n_side_18 = grid_size // BLOCK_18
    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed18/ref_idx6 et grammaire redérivés ensemble à chaque tentative.
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, cap = _find_hybrid_grammar_with_c_pub(
        gk_nu, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}

    # Charge utile à longueur fixe (format v3, tâche 2) : toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    payload = _encrypt(message, ck, cap, _nonce=_nonce)
    nibbles = payload_to_symbols(payload, cap, _y=_y, _leftover=_leftover)

    masks = derive_masks(gk_ctr, len(nibbles) + 512, 'carterhybrid')
    # Remplissage bulk CSPRNG — voir encode_carter_random().
    grid  = random_grid(grid_size, grid_size, _noise_seed=_noise_seed)

    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE or ni >= len(nibbles): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        for gr, gc in _hybrid_positions(br18, bc18, g, ref18, ref6, gk_ctr, sweep_of_color, grid_size):
            if ni >= len(nibbles): break
            grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
            ni += 1

    # Nonce de disposition, écrit en dernier — voir carter.encode_carter().
    for c, sym in enumerate(nu_to_symbols(nu)):
        grid[0][c] = sym

    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_18  = sum(1 for g in grammar if g['role']==_MESSAGE and g['mode']==MODE_18)
    return grid, {
        'mode': 'carter-hybrid', 'seed_18': seed18, 'referent_index_6': ref_idx6,
        'n_msg_blocks': n_msg, 'n_mode_18': n_18, 'n_mode_6': n_msg - n_18,
        'capacity_chars': max_message_for(cap),
    }


def decode_carter_hybrid(grid: List[List[int]],
                         ck: bytes, gk: bytes,
                         grid_size: int = GRID_SIZE) -> str:
    """Décode une grille encodée par encode_carter_hybrid (format v4). Lit
    nu depuis les 36 premières cases de la ligne 0. ValueError si clé
    incorrecte (même recherche C_PUB déterministe que l'encodeur — tâche 4)."""
    # C18-2 (audit G. Kerma, rév. 5) : voir encode_carter_hybrid.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    nu = symbols_to_nu(grid[0][:NU_SYMBOLS])
    gk_nu = derive_gk_nu(gk, nu, 'carterhybrid')
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, n_tot = _find_hybrid_grammar_with_c_pub(
        gk_nu, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}
    n_side_18 = grid_size // BLOCK_18

    masks = derive_masks(gk_ctr, n_tot + 512, 'carterhybrid')

    vals = []; ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        for gr, gc in _hybrid_positions(br18, bc18, g, ref18, ref6, gk_ctr, sweep_of_color, grid_size):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
            ni += 1

    return _decrypt(vals, ck, len(vals))


def carter_hybrid_fits(message: str, ck: bytes, gk: bytes,
                       grid_size: int = GRID_SIZE, _nu: bytes = None) -> bool:
    """Vérifie si le message tient dans la grille Carter-Hybrid avec la
    config dérivée (après redraw C_PUB, tâche 4)."""
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carterhybrid']:
        return False
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterhybrid')
    _, _, _, _, _, _, cap = _find_hybrid_grammar_with_c_pub(gk_nu, grid_size)
    return msg_bytes_len <= max_message_for(cap)


def carter_hybrid_capacity(gk: bytes, grid_size: int = GRID_SIZE, _nu: bytes = None) -> Dict:
    """Retourne les infos de capacité Carter-Hybrid pour cette clé (après
    redraw C_PUB, tâche 4). Format v4 : la capacité dépend de gk ET de nu."""
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carterhybrid')
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, cap = _find_hybrid_grammar_with_c_pub(
        gk_nu, grid_size)
    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_18  = sum(1 for g in grammar if g['role']==_MESSAGE and g['mode']==MODE_18)
    return {
        'n_msg_blocks': n_msg, 'n_mode_18': n_18, 'n_mode_6': n_msg - n_18,
        'capacity_chars': max_message_for(cap),
        'mode': 'carter-hybrid',
    }
