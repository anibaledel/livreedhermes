# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
carter.py — Façade de compatibilité : Carter 256/360/Mix
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réorganisation de stegano/ (2026-09, branche deux-cles) : la grammaire
(rôles, formes, positions, redraw) vit désormais dans grammar.py, la
dérivation des masques dans masks.py. Ce fichier ne garde que :
  - la séparation de clé propre à chaque variante (_carter*_split —
    encore basée sur une master_key unique ; le câblage vers les deux
    clés indépendantes ck/gk de keys.py est une étape ultérieure,
    distincte de cette réorganisation purement structurelle) ;
  - les fonctions publiques encode_*/decode_*/*_capacity, inchangées
    pour tout le code qui les appelle déjà (secu_box.py, stegano_lib.py,
    vectors_internal.py, la suite de tests) ;
  - le ré-export des symboles que stegano_lib.py et les tests importent
    directement d'ici (constantes, fonctions de grammaire) — aucun
    appelant existant n'a besoin de changer.

Aucun changement de comportement : chaque fonction encode_*/decode_*/
*_capacity est le copier-coller exact de sa version précédente, ses
dépendances de grammaire venant maintenant de grammar.py au lieu d'être
définies localement. Vérifié par la suite complète (149 tests) restant
verte à l'identique.
"""

from typing import List, Dict, Optional
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

from crypto_core import (
    ALPHA_LEN, LABELS, _encrypt, _decrypt, payload_to_symbols,
    max_payload_for, max_message_for, random_grid,
)
from stegano_classic import load_referent_360_v3
from masks import derive_masks
from keys import new_layout_nonce, derive_gk_nu, nu_to_symbols, symbols_to_nu, NU_SYMBOLS

from grammar import (
    _PURE, _STRUCTURED, _MESSAGE,
    _find_grammar_with_c_pub,
    CARTER_GRID, CARTER_BLOCK, CARTER_SIDE, CARTER_N,
    _carter_grammar, _carter_positions, _carter_message_positions,
    CARTER360_GRID, CARTER360_BLOCK, CARTER360_SIDE, CARTER360_N, _COLORS_360,
    _carter360_grammar, _carter360_positions, _carter360_message_positions,
    CARTER_MIX_GRID, CARTER_MIX_META, CARTER_MIX_SIDE, CARTER_MIX_N,
    _REF256, _REF360,
    _carter_mix_grammar, _mix_positions, _mix_message_positions,
)

# ── Séparation de clé (encore master_key unique — voir keys.py pour le
# format v4 à deux clés indépendantes, câblage à venir) ───────────────────────

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

def _carter360_split(master_key: bytes):
    """Séparation des clés pour Carter 360 (salt distinct du Carter 256).
    Labels centralisés dans crypto_core.LABELS['carter360'] (tâche 3)."""
    L = LABELS['carter360']
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['encrypt_info']).derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['grammar_info']).derive(master_key)
    return xchacha_key, grammar_key

def _carter_mix_split(master_key: bytes):
    """Séparation des clés pour Carter mixte (salt distinct).
    Labels centralisés dans crypto_core.LABELS['cartermix'] (tâche 3)."""
    L = LABELS['cartermix']
    xchacha_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['encrypt_info']).derive(master_key)
    grammar_key = _HKDF(_hashes.SHA256(), 32,
                         salt=L['split_salt'], info=L['grammar_info']).derive(master_key)
    return xchacha_key, grammar_key

# ── Carter-256 ──────────────────────────────────────────────────────────────────

def encode_carter(message: str, ck: bytes, gk: bytes,
                  ref256: Dict,
                  _nonce: bytes = None, _y: int = None,
                  _leftover: List[int] = None, _noise_seed: bytes = None,
                  _nu: bytes = None) -> List[List[int]]:
    """
    Encode un message dans une grille Carter 90×90 (format v4 : deux clés
    indépendantes, keys.py).

      ck : clé de contenu — chiffrement XChaCha20-Poly1305 et commitment.
      gk : clé de géométrie — grammaire (rôles, formes), balayages, masques,
           redraw. Plus aucune dérivation de l'une vers l'autre : connaître
           l'une ne donne rien sur l'autre.

    Nonce de disposition (obligatoire avec deux clés, voir keys.py) : nu
    (24 octets CSPRNG, tiré par grille) est écrit aux 36 premières cases
    de la ligne 0, en base 44 (keys.nu_to_symbols, sans champ longueur) --
    ces 36 cases sont retirées des positions lisibles du bloc qui les
    contient, quel que soit son rôle (voir grammar._is_nu_cell). gk_nu =
    derive_gk_nu(gk, nu, 'carter256') remplace gk dans TOUTE dérivation de
    géométrie et de masques de cette grille : sans nu, une même gk
    produirait toujours la même géométrie d'une grille à l'autre, un
    canal observable même sans connaître gk.

    Blocs 'message'    → positions = nibbles du message chiffré (ChaCha20-HKDF)
    Blocs 'structuré'  → positions = valeurs aléatoires (indiscernables)
    Blocs 'pur'        → tout aléatoire, aucune structure appliquée

    grid_to_csv() pour sérialiser, csv_to_grid() pour désérialiser.

    _nonce/_y/_leftover/_noise_seed/_nu (préfixés `_`, tâche 7 puis format
    v4) : injection interne pour le mode vecteurs — transmis tels quels à
    _encrypt/payload_to_symbols/random_grid/derive_gk_nu, None (défaut)
    préserve le tirage CSPRNG normal. Aucun appelant public ne les
    renseigne ; voir stegano/vectors_internal.py.
    """
    from crypto_core import C_PUB
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
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carter256')
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        gk_nu, 'carter256',
        lambda k: _carter_grammar(k, ref256),
        lambda g: _carter_message_positions(g, ref256))
    payload = _encrypt(message, ck, n_pos, _nonce=_nonce)
    # Même flux de symboles base-44 que les autres encodeurs — toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, n_pos, _y=_y, _leftover=_leftover)
    # Masques de position (2026-09-12) : même construction ChaCha20 que
    # Random/18/Hybrid/déni (masks.derive_masks), domaine propre à
    # Carter-256 — dérivés de gk_ctr (même clé que la grammaire : un
    # redraw retire les deux ensemble, voir _find_grammar_with_c_pub()).
    masks = derive_masks(gk_ctr, len(nibbles), 'carter256')

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
    # Nonce de disposition, écrit en dernier : les positions message
    # l'excluent déjà (grammar._is_nu_cell), aucun risque d'écrasement.
    for c, sym in enumerate(nu_to_symbols(nu)):
        grid[0][c] = sym
    return grid

def decode_carter(grid: List[List[int]], ck: bytes, gk: bytes,
                  ref256: Dict) -> str:
    """
    Décode une grille Carter (format v4). Lit nu depuis les 36 premières
    cases de la ligne 0, recalcule gk_nu, puis procède comme l'encodeur
    (même recherche C_PUB déterministe — tâche 4). Lève ValueError si la
    clé est incorrecte (tag Poly1305 invalide).
    """
    nu = symbols_to_nu(grid[0][:NU_SYMBOLS])
    gk_nu = derive_gk_nu(gk, nu, 'carter256')
    gk_ctr, grammar, n_pos = _find_grammar_with_c_pub(
        gk_nu, 'carter256',
        lambda k: _carter_grammar(k, ref256),
        lambda g: _carter_message_positions(g, ref256))
    masks = derive_masks(gk_ctr, n_pos, 'carter256')
    sweep_of_color = grammar['sweep_of_color']
    vals, ni = [], 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != _MESSAGE: continue
        br, bc = i // CARTER_SIDE, i % CARTER_SIDE
        for gr, gc in _carter_positions(br, bc, g, ref256, sweep_of_color):
            vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN); ni += 1
    return _decrypt(vals, ck, len(vals))

def carter_capacity(gk: bytes, ref256: Dict, _nu: bytes = None) -> Dict:
    """Retourne les statistiques de capacité de la grammaire dérivée
    (après redraw C_PUB, tâche 4 — reflète ce qu'encode_carter() utilise
    réellement, pas la grammaire brute avant recherche).

    Format v4 : la capacité dépend de gk ET de nu (gk_nu = derive_gk_nu),
    pas de gk seule -- un nu différent à chaque grille produit une
    grammaire différente. Sans _nu explicite (mode vecteurs), un nu frais
    est tiré : le résultat est donc représentatif d'UN tirage, pas une
    propriété fixe de la clé (contrairement au format v3)."""
    nu = _nu if _nu is not None else new_layout_nonce()
    gk_nu = derive_gk_nu(gk, nu, 'carter256')
    _, grammar, n_pos = _find_grammar_with_c_pub(
        gk_nu, 'carter256',
        lambda k: _carter_grammar(k, ref256),
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

# ── Carter-360 ──────────────────────────────────────────────────────────────────

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
    from crypto_core import C_PUB
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
    masks = derive_masks(gk_ctr, len(nibbles), 'carter360')

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
    masks = derive_masks(gk_ctr, n_pos, 'carter360')
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
        # identites MUT) -- voir grammar._carter360_grammar/_carter360_positions.
        'positions_bloc':   (n_pos / n_msg) if n_msg else 0,
        'nibbles':          n_pos,
        'bytes_utiles':     max_message_for(n_pos),
        'chars_max':        max_message_for(n_pos),
        'ambiguite':        f"1 message parmi {n_msg + n_str} blocs structurés",
    }

# ── Carter-Mix ──────────────────────────────────────────────────────────────────

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
    from crypto_core import C_PUB
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
    masks = derive_masks(gk_ctr, len(nibbles), 'cartermix')

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
    masks = derive_masks(gk_ctr, n_pos, 'cartermix')
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
