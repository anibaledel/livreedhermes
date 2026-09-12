# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
vectors_internal.py — Mode vecteurs de référence (tâche 7, format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Module INTERNE, non exporté par stegano_lib.py (voir
test_vectors_isolation.py pour la garantie). Génère vectors/carter_v3.json :
pour chaque instantiation, injecte les points de hasard exposés dans le
commit précédent (_nonce/_y/_leftover/_noise_seed/_k2/_pi/_rsk/_dsk) via
les fonctions de production RÉELLES (aucune réimplémentation de la
grammaire, du redraw ou du chiffrement — seule l'amorce de hasard change),
et capture chaque étape intermédiaire du calcul.

Convention de recherche des cas spéciaux (redraw, repli CR-1) : ces
propriétés sont des fonctions DÉTERMINISTES de master_key seul (voir
crypto_core._redraw_grammar_key) — on ne les injecte pas, on cherche une
clé qui les déclenche naturellement (par force brute sur un espace
restreint, taux mesurés en tâche 4 : 0.24%-0.67% de redraw selon la
variante, ~25% de repli CR-1 pour Carter-Random) et on fige ses octets
dans le vecteur.
"""

import hashlib
import json
import os
import struct
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import crypto_core as CC
import carter as CT
import carter_random as CR
import stegano_classic as SC
from stegano_lib import load_referent_256_v3, load_referent_360_v3, _carter_split

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'secubox'))
import secu_box as SB
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GENERATOR_COMMIT = "357afc0970dab3ad25a2ebea78b39fe502874c69"  # HEAD au moment de la génération

ROLE_LEGEND = {0: "pure", 1: "structured", 2: "message"}


# ── Utilitaires ────────────────────────────────────────────────────────────

def _hex(b: bytes) -> str:
    return b.hex()

def _grid_sha256(grid) -> str:
    flat = bytes(v for row in grid for v in row)
    return hashlib.sha256(flat).hexdigest()

def _grid_csv(grid) -> str:
    return '\n'.join(','.join(str(v) for v in row) for row in grid)

def _raw_mask_keystream(grammar_key: bytes, domain: bytes, n_bytes: int) -> bytes:
    """
    Keystream ChaCha20 brut AVANT rejet, pour le champ de diagnostic
    mask_keystream_raw_hex. Recalcule mask_key EXACTEMENT comme
    carter_random._derive_masks (même HKDF, même label) puis lit le
    keystream directement — sans appliquer la règle de rejet, à la
    différence de _derive_masks() elle-même (appelée séparément pour le
    champ "masks", garantissant que les deux sont cohérents).
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
    from cryptography.hazmat.primitives import hashes as _hh
    ML = CC.LABELS['mask_seed']
    mask_key = _HKDF(_hh.SHA256(), 32, salt=ML['salt'], info=domain).derive(grammar_key)
    ks = Cipher(algorithms.ChaCha20(mask_key, bytes(16)), mode=None).encryptor()
    return ks.update(b'\x00' * n_bytes)

def _normalize_leftover(n_pos: int, leftover: list) -> list:
    """
    m (symboles PtS) < n_pos (positions) sur 0 ou 1 position selon les cas
    (voir crypto_core._capacity_k) — le nombre EXACT de symboles de marge
    n'est connu qu'après avoir dérivé la grammaire (n_pos). Ajuste
    `leftover` à cette longueur exacte : tronque si trop long, complète par
    des zéros si trop court (valeur arbitraire mais déterministe — le
    vecteur documente la valeur RÉELLEMENT utilisée dans son champ
    "injected.leftover", donc aucune ambiguïté pour qui rejoue le vecteur).
    """
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    needed = n_pos - m
    leftover = list(leftover)
    if needed <= 0:
        return []
    if len(leftover) >= needed:
        return leftover[:needed]
    return leftover + [0] * (needed - len(leftover))

def _labels_export() -> dict:
    """Snapshot de crypto_core.LABELS, bytes en hex + ASCII lisible."""
    def conv(v):
        if isinstance(v, bytes):
            try:
                ascii_form = v.decode('ascii')
            except UnicodeDecodeError:
                ascii_form = None
            return {"hex": v.hex(), "ascii": ascii_form}
        if isinstance(v, dict):
            return {k: conv(x) for k, x in v.items()}
        return v
    return conv(CC.LABELS)


# ── Instrumentation du redraw (compte les tentatives via la fonction REELLE) ──

def _count_redraw_attempts(module, search_fn):
    """
    Instrumente module._redraw_grammar_key (namespace du module appelant --
    Python lie chaque import séparément, voir tâche 4) pour compter les
    tentatives réellement effectuées par search_fn(), qui doit appeler la
    fonction de recherche de PRODUCTION (_find_*_grammar_with_c_pub) sans
    aucune modification. Retourne (resultat_de_search_fn, nb_tentatives).
    """
    calls = [0]
    orig = module._redraw_grammar_key
    def spy(gk, variant, ctr):
        calls[0] += 1
        return orig(gk, variant, ctr)
    module._redraw_grammar_key = spy
    try:
        result = search_fn()
    finally:
        module._redraw_grammar_key = orig
    return result, calls[0]


# ── Carter-256 ───────────────────────────────────────────────────────────────

def gen_carter256_vector(vec_id, description, master_key, message, ref256,
                          nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CT._carter_split(master_key)
    ck = CC._commit_key(xchacha_key)

    (gk_ctr, grammar, n_pos), attempts = _count_redraw_attempts(
        CT, lambda: CT._find_grammar_with_c_pub(
            grammar_key, 'carter256',
            lambda gk: CT._carter_grammar(gk, ref256),
            lambda g: CT._carter_message_positions(g, ref256)))

    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    k = CC._capacity_k(n_pos)
    m = CC._smallest_m(k + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_carter256']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 32)
    masks = CC._derive_masks(gk_ctr, len(symbols), domain)

    grid = CC.random_grid(CT.CARTER_GRID, CT.CARTER_GRID, _noise_seed=noise_seed)
    sweep_of_color = grammar['sweep_of_color']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != CT._MESSAGE: continue
        br, bc = i // CT.CARTER_SIDE, i % CT.CARTER_SIDE
        for gr, gc in CT._carter_positions(br, bc, g, ref256, sweep_of_color):
            if nib_i >= len(symbols): break
            grid[gr][gc] = (symbols[nib_i] + masks[nib_i]) % CC.ALPHA_LEN; nib_i += 1

    decoded = CT.decode_carter(grid, master_key, ref256)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "carter256", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": CT.CARTER_GRID},
        "injected": {
            "nonce_hex": _hex(nonce), "y": str(y), "leftover": list(leftover) if leftover else [],
            "noise_seed_hex": _hex(noise_seed),
        },
        "derivation": {
            "commit_key_hex": _hex(ck),
            "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "n_pos": n_pos,
            # TODO v3-format (etape 10) : plus de color/orient (regle 6x6 --
            # rouge+bleu ensemble, aucun tirage de couleur/orientation) ;
            # sweep_of_color ajoute a la place, cle par couleur stegano.
            "grammar": [{"i": i, "role": g['role'], "form_id": g['form_id']}
                        for i, g in enumerate(grammar['blocks'])],
            "sweep_of_color": sweep_of_color,
            "hchacha20_subkey_hex": _hex(hchacha_subkey),
            "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y),
            "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message,
        "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Vecteurs négatifs (Carter-256) ──────────────────────────────────────────
# Les trois cas empruntent DÉLIBÉRÉMENT le même chemin de code
# (crypto_core._decrypt : le commitment HMAC est vérifié AVANT tout appel à
# _xchacha20_dec/Poly1305, voir lignes ~490-498) — ce n'est pas un hasard :
# c'est la propriété de sécurité à reproduire À L'IDENTIQUE dans LH-5
# (vérifier le commitment PUIS déchiffrer, jamais l'inverse, quelle que soit
# la nature de l'altération). "cellule_alteree" et "commitment_altere" ne se
# distinguent donc pas par le message d'erreur (identique dans les deux cas)
# mais par la MÉTHODE d'altération : le premier modifie un symbole déjà placé
# sur la grille (attaquant qui ignore la structure interne), le second
# modifie un octet du commitment HMAC lui-même avant tout placement
# (démontre que même une falsification portant précisément sur le tag de
# commitment, sans toucher le texte chiffré sous-jacent qu'il protège, est
# rejetée avant la moindre tentative de déchiffrement authentifié).

def gen_carter256_negative_vectors(vec_id_prefix, description_prefix,
                                    master_key, message, ref256,
                                    nonce, y, leftover, noise_seed):
    xchacha_key, grammar_key = CT._carter_split(master_key)
    gk_ctr, grammar, n_pos = CT._find_grammar_with_c_pub(
        grammar_key, 'carter256',
        lambda gk: CT._carter_grammar(gk, ref256),
        lambda g: CT._carter_message_positions(g, ref256))
    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)
    domain = CC.LABELS['mask_seed']['info_carter256']
    masks = CC._derive_masks(gk_ctr, len(symbols), domain)

    sweep_of_color = grammar['sweep_of_color']
    message_positions = []
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != CT._MESSAGE: continue
        br, bc = i // CT.CARTER_SIDE, i % CT.CARTER_SIDE
        message_positions.extend(CT._carter_positions(br, bc, g, ref256, sweep_of_color))

    # Positions couvertes par des blocs 'pure' (bruit CSPRNG du remplissage
    # initial, JAMAIS écrites par la boucle de placement ci-dessus) — sert
    # au vecteur "bruit altéré" plus bas.
    noise_positions = []
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != CT._PURE: continue
        br, bc = i // CT.CARTER_SIDE, i % CT.CARTER_SIDE
        r0, c0 = br * CT.CARTER_BLOCK, bc * CT.CARTER_BLOCK
        noise_positions.extend(
            (r0+r, c0+c) for r in range(CT.CARTER_BLOCK) for c in range(CT.CARTER_BLOCK))

    def _place(syms):
        grid = CC.random_grid(CT.CARTER_GRID, CT.CARTER_GRID, _noise_seed=noise_seed)
        for idx, (gr, gc) in enumerate(message_positions):
            if idx >= len(syms): break
            grid[gr][gc] = (syms[idx] + masks[idx]) % CC.ALPHA_LEN
        return grid

    base_grid = _place(symbols)
    decoded = CT.decode_carter(base_grid, master_key, ref256)
    assert decoded == message, "auto-verification (base valide) a echoue"

    def _try_decode(grid, key, ref):
        try:
            CT.decode_carter(grid, key, ref)
            return None
        except ValueError as e:
            return str(e)

    # 1) cellule altérée : un symbole déjà placé sur la grille est modifié
    #    (un attaquant qui ignore la structure interne du payload).
    cell_gr, cell_gc = message_positions[len(message_positions) // 2]
    grid_cell = [row[:] for row in base_grid]
    grid_cell[cell_gr][cell_gc] = (grid_cell[cell_gr][cell_gc] + 1) % CC.ALPHA_LEN
    err_cell = _try_decode(grid_cell, master_key, ref256)

    # 2) mauvaise clé : grille valide, clé de déchiffrement totalement différente
    #    (grammaire ET commit_key changent tous les deux avec la clé).
    wrong_key = bytes((b + 1) % 256 for b in master_key)
    err_wrong_key = _try_decode(base_grid, wrong_key, ref256)

    # 3) commitment altéré : falsifie l'octet 0 du commitment HMAC lui-même
    #    (les 32 premiers octets de `payload`) AVANT tout placement — le
    #    texte chiffré (`inner`) qu'il protège n'est jamais touché.
    tampered_payload = bytes([payload[0] ^ 0x01]) + payload[1:]
    tampered_symbols = CC.payload_to_symbols(tampered_payload, n_pos, _y=y, _leftover=leftover)
    grid_commit = _place(tampered_symbols)
    err_commit = _try_decode(grid_commit, master_key, ref256)

    assert err_cell is not None and 'commitment' in err_cell.lower(), \
        f"cellule alteree aurait du etre rejetee au commitment, obtenu : {err_cell!r}"
    assert err_commit is not None and 'commitment' in err_commit.lower(), \
        f"commitment altere aurait du etre rejete au commitment, obtenu : {err_commit!r}"
    assert err_wrong_key is not None, "mauvaise cle aurait du etre rejetee"

    common = {
        "instantiation": "carter256", "inputs": {
            "master_key_hex": _hex(master_key), "message": message, "grid_size": CT.CARTER_GRID,
        },
    }
    v_cell = {
        **common, "id": f"{vec_id_prefix}-cellule-alteree",
        "description": f"{description_prefix} — cellule altérée après placement.",
        "tamper": {"type": "cellule_alteree", "grid_row": cell_gr, "grid_col": cell_gc,
                   "original_value": base_grid[cell_gr][cell_gc],
                   "tampered_value": grid_cell[cell_gr][cell_gc]},
        "grid_sha256": _grid_sha256(grid_cell), "expected_result": "rejet",
        "expected_error": err_cell,
    }
    v_wrong_key = {
        **common, "id": f"{vec_id_prefix}-mauvaise-cle",
        "description": f"{description_prefix} — grille valide, clé de décodage incorrecte.",
        "tamper": {"type": "mauvaise_cle", "wrong_key_hex": _hex(wrong_key)},
        "grid_sha256": _grid_sha256(base_grid), "expected_result": "rejet",
        "expected_error": err_wrong_key,
    }
    v_commit = {
        **common, "id": f"{vec_id_prefix}-commitment-altere",
        "description": f"{description_prefix} — octet 0 du commitment HMAC falsifié "
                        f"avant placement (inner/ciphertext non touché).",
        "tamper": {"type": "commitment_altere",
                   "original_payload_byte0_hex": f"{payload[0]:02x}",
                   "tampered_payload_byte0_hex": f"{tampered_payload[0]:02x}",
                   "note": "seul l'octet 0 du commitment (32 premiers octets de payload) "
                           "est modifié ; inner (payload[32:]) est rechiffré identique, "
                           "voir crypto_core._encrypt — la falsification porte uniquement "
                           "sur le tag, jamais sur le texte chiffré qu'il protège."},
        "grid_sha256": _grid_sha256(grid_commit), "expected_result": "rejet",
        "expected_error": err_commit,
    }

    # 4) bruit altéré : une cellule d'un bloc 'pure' (jamais écrite par la
    #    boucle de placement, pur CSPRNG du remplissage initial) est
    #    modifiée — le décodage doit RÉUSSIR à l'identique, preuve que ces
    #    cellules ne portent aucune information (contraste direct avec les
    #    trois cas ci-dessus, où toute cellule MESSAGE altérée est rejetée).
    noise_gr, noise_gc = noise_positions[len(noise_positions) // 2]
    grid_noise = [row[:] for row in base_grid]
    grid_noise[noise_gr][noise_gc] = (grid_noise[noise_gr][noise_gc] + 1) % CC.ALPHA_LEN
    decoded_noise = CT.decode_carter(grid_noise, master_key, ref256)
    assert decoded_noise == message, \
        f"bruit altere aurait du laisser le decodage intact, obtenu : {decoded_noise!r}"
    v_noise = {
        **common, "id": f"{vec_id_prefix}-bruit-altere",
        "description": f"{description_prefix} — cellule de BRUIT (bloc pur) altérée : "
                        f"décodage réussi malgré tout, la cellule ne porte aucune information.",
        "tamper": {"type": "bruit_altere", "grid_row": noise_gr, "grid_col": noise_gc,
                   "original_value": base_grid[noise_gr][noise_gc],
                   "tampered_value": grid_noise[noise_gr][noise_gc]},
        "grid_sha256": _grid_sha256(grid_noise), "expected_result": "decode_ok",
        "expected_decode": decoded_noise,
    }

    return ([v_cell, v_wrong_key, v_commit, v_noise],
            [grid_cell, base_grid, grid_commit, grid_noise])


# ── Carter-360 ───────────────────────────────────────────────────────────────

def gen_carter360_vector(vec_id, description, master_key, message, ref360,
                          nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CT._carter360_split(master_key)
    ck = CC._commit_key(xchacha_key)
    (gk_ctr, grammar, n_pos), attempts = _count_redraw_attempts(
        CT, lambda: CT._find_grammar_with_c_pub(
            grammar_key, 'carter360',
            lambda gk: CT._carter360_grammar(gk, ref360),
            lambda g: CT._carter360_message_positions(g, ref360)))
    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_carter360']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 32)
    masks = CC._derive_masks(gk_ctr, len(symbols), domain)

    grid = CC.random_grid(CT.CARTER360_GRID, CT.CARTER360_GRID, _noise_seed=noise_seed)
    by_niveau = grammar['by_niveau']
    sweep_of_color = grammar['sweep_of_color']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != CT._MESSAGE: continue
        br, bc = i // CT.CARTER360_SIDE, i % CT.CARTER360_SIDE
        for gr, gc in CT._carter360_positions(br, bc, g, ref360, by_niveau, sweep_of_color):
            if nib_i >= len(symbols): break
            grid[gr][gc] = (symbols[nib_i] + masks[nib_i]) % CC.ALPHA_LEN; nib_i += 1

    decoded = CT.decode_carter_360(grid, master_key, ref360)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "carter360", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": CT.CARTER360_GRID},
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": list(leftover) if leftover else [],
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "commit_key_hex": _hex(ck), "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "n_pos": n_pos,
            # TODO v3-format (etape 10) : plus de color/orient/form_id
            # unique (regle niveaux -- 6 calques tires, un par niveau) ;
            # niveau_calque_idx et sweep_of_color ajoutes a la place.
            "grammar": [{"i": i, "role": g['role'], "niveau_calque_idx": g['niveau_calque_idx']}
                        for i, g in enumerate(grammar['blocks'])],
            "sweep_of_color": sweep_of_color,
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Carter-Mix ───────────────────────────────────────────────────────────────

def gen_cartermix_vector(vec_id, description, master_key, message, ref256, ref360,
                          nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CT._carter_mix_split(master_key)
    ck = CC._commit_key(xchacha_key)
    (gk_ctr, grammar, n_pos), attempts = _count_redraw_attempts(
        CT, lambda: CT._find_grammar_with_c_pub(
            grammar_key, 'cartermix',
            lambda gk: CT._carter_mix_grammar(gk, ref256, ref360),
            lambda g: CT._mix_message_positions(g, ref256, ref360)))
    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_cartermix']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 32)
    masks = CC._derive_masks(gk_ctr, len(symbols), domain)

    grid = CC.random_grid(CT.CARTER_MIX_GRID, CT.CARTER_MIX_GRID, _noise_seed=noise_seed)
    by_niveau = grammar['by_niveau']
    sweep_256, sweep_360 = grammar['sweep_256'], grammar['sweep_360']
    nib_i = 0
    for i, g in enumerate(grammar['blocks']):
        if g['role'] != CT._MESSAGE: continue
        mbr, mbc = i // CT.CARTER_MIX_SIDE, i % CT.CARTER_MIX_SIDE
        for gr, gc in CT._mix_positions(mbr, mbc, g, ref256, ref360, by_niveau, sweep_256, sweep_360):
            if nib_i >= len(symbols): break
            grid[gr][gc] = (symbols[nib_i] + masks[nib_i]) % CC.ALPHA_LEN; nib_i += 1

    decoded = CT.decode_carter_mix(grid, master_key, ref256, ref360)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "cartermix", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": CT.CARTER_MIX_GRID},
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": list(leftover) if leftover else [],
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "commit_key_hex": _hex(ck), "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "n_pos": n_pos,
            # TODO v3-format (etape 10) : plus de color/orient/form_id
            # unique cote 360 (regle niveaux) ; niveau_calque_idx present
            # seulement pour les meta-blocs ref=360, form_id seul pour 256.
            "grammar": [{"i": i, "role": g['role'], "ref": g['ref'],
                         **{k: v for k, v in g.items() if k not in ('role', 'ref')}}
                        for i, g in enumerate(grammar['blocks'])],
            "sweep_256": sweep_256, "sweep_360": sweep_360,
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Carter-Random ──────────────────────────────────────────────────────────

def gen_carterrandom_vector(vec_id, description, master_key, message, grid_size,
                             nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CR._carter_split(master_key)
    ck = CC._commit_key(xchacha_key)

    (gk_ctr, ref_idx, meta_mode, ref, grammar, n_pos), attempts = _count_redraw_attempts(
        CR, lambda: CR._find_random_grammar_with_c_pub(grammar_key, grid_size))
    sweep_of_color = {c: CR.derive_sweep_index(gk_ctr, c) for c in CR._RANDOM_STEGANO_COLORS}

    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_random']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 32)
    masks = CR._derive_masks(gk_ctr, len(symbols), domain)

    grid = CC.random_grid(grid_size, grid_size, _noise_seed=noise_seed)
    n_side_g = grid_size // CR.CELL_SIZE
    n_meta_g = n_side_g // CR.META
    ni = 0
    grammar_export = []
    if not meta_mode:
        for i, g in enumerate(grammar):
            grammar_export.append({"i": i, "role": g['role'], "form_id": g['form_id']})
            if g['role'] != CR._MESSAGE: continue
            br, bc = i // n_side_g, i % n_side_g
            form = ref[g['form_id']]
            r0, c0 = br * CR.CELL_SIZE, bc * CR.CELL_SIZE
            for pos in CR._form_stegano_positions(form, sweep_of_color):
                if ni >= len(symbols): break
                gr, gc = r0 + pos[0], c0 + pos[1]
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    grid[gr][gc] = (symbols[ni] + masks[ni]) % CC.ALPHA_LEN
                ni += 1
    else:
        for mi, mg in enumerate(grammar):
            grammar_export.append({"i": mi, "role": mg['role'], "sub": mg['sub']})
            if mg['role'] != CR._MESSAGE: continue
            mr, mc = mi // n_meta_g, mi % n_meta_g
            for ci, (br_off, bc_off) in enumerate(CR.CONC_ORDER):
                sg = mg['sub'][ci]
                form = ref[sg['form_id']]
                br, bc = mr * CR.META + br_off, mc * CR.META + bc_off
                r0, c0 = br * CR.CELL_SIZE, bc * CR.CELL_SIZE
                for pos in CR._form_stegano_positions(form, sweep_of_color):
                    if ni >= len(symbols): break
                    gr, gc = r0 + pos[0], c0 + pos[1]
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        grid[gr][gc] = (symbols[ni] + masks[ni]) % CC.ALPHA_LEN
                    ni += 1

    decoded = CR.decode_carter_random(grid, master_key, grid_size)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "carterrandom", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": grid_size},
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": leftover,
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "commit_key_hex": _hex(ck), "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "params": {"referent_index": ref_idx, "meta_mode": meta_mode},
            "sweep_of_color": sweep_of_color,
            "n_pos": n_pos,
            "grammar": grammar_export,
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Carter-18 ────────────────────────────────────────────────────────────────

def gen_carter18_vector(vec_id, description, master_key, message, grid_size,
                         nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CR._carter_split(master_key)
    ck = CC._commit_key(xchacha_key)

    (gk_ctr, seed, ref18, grammar, n_pos), attempts = _count_redraw_attempts(
        CR, lambda: CR._find_carter18_grammar_with_c_pub(grammar_key, grid_size))

    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_18']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 256)
    masks = CR._derive_masks(gk_ctr, n_pos, domain)

    grid = CC.random_grid(grid_size, grid_size, _noise_seed=noise_seed)
    n_side_18 = grid_size // CR.BLOCK_18
    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != CR._MESSAGE or ni >= len(symbols): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        form = ref18[g['form_id']]
        for r, c in form[g['dir']]:
            if ni >= len(symbols): break
            gr, gc = br18*CR.BLOCK_18+r, bc18*CR.BLOCK_18+c
            if 0 <= gr < grid_size and 0 <= gc < grid_size:
                grid[gr][gc] = (symbols[ni] + masks[ni]) % CC.ALPHA_LEN
            ni += 1

    decoded = CR.decode_carter_18(grid, master_key, grid_size)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "carter18", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": grid_size},
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": leftover,
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "commit_key_hex": _hex(ck), "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "params": {"seed": seed},
            "n_pos": n_pos,
            "grammar": [{"i": i, "role": g['role'], "form_id": g['form_id'], "dir": g['dir']}
                        for i, g in enumerate(grammar)],
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Carter-Hybrid ────────────────────────────────────────────────────────────

def gen_carterhybrid_vector(vec_id, description, master_key, message, grid_size,
                             nonce, y, leftover, noise_seed, include_grid_csv=False):
    xchacha_key, grammar_key = CR._carter_split(master_key)
    ck = CC._commit_key(xchacha_key)

    (gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, n_pos), attempts = _count_redraw_attempts(
        CR, lambda: CR._find_hybrid_grammar_with_c_pub(grammar_key, grid_size))
    sweep_of_color = {c: CR.derive_sweep_index(gk_ctr, c) for c in CR._RANDOM_STEGANO_COLORS}

    payload = CC._encrypt(message, xchacha_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(xchacha_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    domain = CC.LABELS['mask_seed']['info_hybrid']
    raw_keystream = _raw_mask_keystream(gk_ctr, domain, n_pos * 2 + 512)
    masks = CR._derive_masks(gk_ctr, n_pos, domain)

    grid = CC.random_grid(grid_size, grid_size, _noise_seed=noise_seed)
    n_side_18 = grid_size // CR.BLOCK_18
    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != CR._MESSAGE or ni >= len(symbols): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        if g['mode'] == CR.MODE_18:
            form = ref18[g['form_id']]
            for r, c in form[g['dir']]:
                if ni >= len(symbols): break
                gr, gc = br18*CR.BLOCK_18+r, bc18*CR.BLOCK_18+c
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    grid[gr][gc] = (symbols[ni] + masks[ni]) % CC.ALPHA_LEN
                ni += 1
        else:
            for sub_pos in CR._subblock_positions(br18, bc18, gk_ctr, ref6, sweep_of_color):
                for gr, gc in sub_pos:
                    if ni >= len(symbols): break
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        grid[gr][gc] = (symbols[ni] + masks[ni]) % CC.ALPHA_LEN
                    ni += 1

    decoded = CR.decode_carter_hybrid(grid, master_key, grid_size)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "carterhybrid", "description": description,
        "inputs": {"master_key_hex": _hex(master_key), "message": message, "grid_size": grid_size},
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": leftover,
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "commit_key_hex": _hex(ck), "xchacha_key_hex": _hex(xchacha_key),
            "grammar_key_hex": _hex(grammar_key),
            "redraw": {"attempts_tried": attempts, "ctr_used": attempts - 1,
                       "grammar_key_ctr_hex": _hex(gk_ctr)},
            "params": {"seed_18": seed18, "referent_index_6": ref_idx6},
            "sweep_of_color": sweep_of_color,
            "n_pos": n_pos,
            "grammar": [{"i": i, "role": g['role'], "mode": g['mode'],
                         "form_id": g['form_id'], "dir": g['dir']}
                        for i, g in enumerate(grammar)],
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
            "mask_domain_ascii": domain.decode('ascii'),
            "mask_keystream_raw_hex": _hex(raw_keystream),
            "masks": masks,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Stéganographie classique (Référent 256, clés B/C/2 explicites) ──────────
# Contrairement aux 6 variantes Carter, la géométrie n'est dérivée d'aucun
# secret : key_b/key_c/key_2 sont des clés explicites fournies par
# l'appelant (make_keys() les tire par secrets.* en production, mais le
# format n'exige aucune dérivation). Le vecteur fige donc des valeurs
# explicites plutôt que de rechercher un cas particulier.

def gen_classic_vector(vec_id, description, steg_key, message, key_b, key_2,
                        ref256, grid_size, nonce, y, leftover, noise_seed,
                        include_grid_csv=False):
    """ref256 : référent v3 (câblage production, étape 6, 2026-09-12) --
    plus de Clé C (orientations D4, sans rôle sur positions absolues) ni
    de tirage de couleur dans Clé 2 (rouge+bleu ensemble)."""
    n_pos = SC._classic_n_pos(key_b, grid_size)
    payload = CC._encrypt(message, steg_key, n_pos, _nonce=nonce)
    hchacha_subkey = CC.hchacha20(steg_key, nonce[:16])
    m = CC._smallest_m(CC._capacity_k(n_pos) + CC._LAMBDA_S)
    leftover = _normalize_leftover(n_pos, leftover)
    symbols = CC.payload_to_symbols(payload, n_pos, _y=y, _leftover=leftover)

    grid = SC.encode(message, steg_key, key_b, key_2, ref256, grid_size,
                      _nonce=nonce, _y=y, _leftover=leftover, _noise_seed=noise_seed)

    decoded = SC.decode(grid, steg_key, key_b, key_2, ref256, grid_size)
    assert decoded == message, f"auto-verification decode a echoue pour {vec_id}"

    vector = {
        "id": vec_id, "instantiation": "classic", "description": description,
        "inputs": {
            "steg_key_hex": _hex(steg_key), "message": message, "grid_size": grid_size,
            "key_b": list(key_b),
            "key_2": [{"form_id": d['form_id']} for d in key_2],
        },
        "injected": {"nonce_hex": _hex(nonce), "y": str(y), "leftover": leftover,
                     "noise_seed_hex": _hex(noise_seed)},
        "derivation": {
            "n_pos": n_pos,
            "hchacha20_subkey_hex": _hex(hchacha_subkey), "payload_hex": _hex(payload),
            "pts_m": m, "pts_y": str(y), "symbols": symbols,
        },
        "expected_decode": message, "grid_sha256": _grid_sha256(grid),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
    return vector, grid


# ── Déni plausible (secu_box.py, bloc C — tâche 5) ──────────────────────────
# π est injectée (mode vecteurs) : c'est elle qui fixe Br/Bd/bloc orphelin,
# donc c'est ELLE qu'il faut figer pour un vecteur reproductible — rsk/dsk
# le sont aussi (_rsk/_dsk), mais _fisher_yates elle-même n'est jamais
# appelée avec une clé (voir l'invariant documenté dans
# secu_box.encode_deniable). Encode ET Encode0 sont tous deux couverts.

def _deniable_block_list(role_label, block_indices, key_2):
    # TODO v3-format (etape 10) : plus de 'dir' depuis le cablage etape 5
    # (referent v3 6x6, plus l'ancien referent bariole a 4 directions).
    return [{"idx": idx, "role": role_label, "form_id": k2['form_id']}
            for idx, k2 in zip(block_indices, key_2)]

def _bd_expected(pi, grid_size):
    N = grid_size; B = N // 6; n_blocks = B * B
    half = n_blocks // 2
    return pi[half + 1:] if n_blocks % 2 else pi[half:]

def gen_deniable_vector(vec_id, description, real_message, duress_message,
                         grid_size, rsk, dsk, pi, noise_seed,
                         real_inject=None, duress_inject=None,
                         include_grid_csv=False):
    """
    Encode(m_r, m_d) ET Encode0(m_d) avec la MÊME π/dsk/duress_inject, pour
    que le vecteur montre directement (§ acceptance) que Bd/key_2 côté
    duress sont identiques dans les deux modes — l'invariant testé par
    TestDeniableStatistical côté code.
    """
    real_inject   = dict(real_inject or {})
    duress_inject = dict(duress_inject or {})

    # Br et Bd ont toujours la même taille fixe ⌊n_blocks/2⌋ (voir
    # secu_box._split_br_bd) — L (positions message) est donc connu AVANT
    # même de tirer pi, ce qui permet de normaliser _leftover ici comme pour
    # les 6 variantes Carter (voir _normalize_leftover).
    N = grid_size; B = N // 6; n_blocks = B * B
    # Cablage production etape 5 (2026-09-12) : 36 positions/bloc (mode
    # crypto, toutes les cases), plus 6 (ancien referent bariole).
    L_side = (n_blocks // 2) * 36
    if '_leftover' in real_inject:
        real_inject['_leftover'] = _normalize_leftover(L_side, real_inject['_leftover'])
    if '_leftover' in duress_inject:
        duress_inject['_leftover'] = _normalize_leftover(L_side, duress_inject['_leftover'])

    grid, dk_r, dk_d = SB.encode_deniable(
        real_message, duress_message, grid_size,
        _rsk=rsk, _dsk=dsk, _pi=pi, _noise_seed=noise_seed,
        _real_inject=real_inject, _duress_inject=duress_inject)

    grid0, dk_d0 = SB.encode_deniable0(
        duress_message, grid_size,
        _dsk=dsk, _pi=pi, _noise_seed=noise_seed,
        _duress_inject=duress_inject)

    real_out   = SB.decode_deniable(grid, dk_r, grid_size)
    duress_out = SB.decode_deniable(grid, dk_d, grid_size)
    duress0_out = SB.decode_deniable(grid0, dk_d0, grid_size)
    assert real_out == real_message, f"auto-verification (reel) a echoue pour {vec_id}"
    assert duress_out == duress_message, f"auto-verification (contrainte) a echoue pour {vec_id}"
    assert duress0_out == duress_message, f"auto-verification (Encode0) a echoue pour {vec_id}"
    assert dk_d['blocks'] == dk_d0['blocks'] == _bd_expected(pi, grid_size), \
        f"Bd devrait etre identique sous Encode et Encode0 pour {vec_id}"

    half = n_blocks // 2
    orphan = pi[half] if n_blocks % 2 else None

    _, gk_r = _carter_split(rsk)
    _, gk_d = _carter_split(dsk)
    domain = CC.LABELS['mask_seed']['info_deniable']
    L_r = len(dk_r['blocks']) * 36   # mode crypto, 36 positions/bloc (etape 5)
    L_d = len(dk_d['blocks']) * 36
    raw_keystream_r = _raw_mask_keystream(gk_r, domain, L_r * 2 + 32)
    raw_keystream_d = _raw_mask_keystream(gk_d, domain, L_d * 2 + 32)
    masks_r = CR._derive_masks(gk_r, L_r, domain)
    masks_d = CR._derive_masks(gk_d, L_d, domain)

    vector = {
        "id": vec_id, "instantiation": "deniable", "description": description,
        "inputs": {
            "real_message": real_message, "duress_message": duress_message,
            "grid_size": grid_size, "rsk_hex": _hex(rsk), "dsk_hex": _hex(dsk),
        },
        "injected": {
            "pi": list(pi), "noise_seed_hex": _hex(noise_seed),
            "real_inject": {k: (_hex(v) if isinstance(v, bytes) else v)
                             for k, v in real_inject.items()},
            "duress_inject": {k: (_hex(v) if isinstance(v, bytes) else v)
                               for k, v in duress_inject.items()},
        },
        "derivation": {
            "n_blocks": n_blocks, "half": half, "orphan_block_idx": orphan,
            "note": "Br=pi[:half], Bd=pi[half+1:] si n_blocks impair sinon pi[half:] "
                    "(voir secu_box._split_br_bd) ; l'orphelin n'est ecrit par personne.",
            "Br": {
                "blocks": dk_r['blocks'], "grammar_key_hex": _hex(gk_r),
                "mask_domain_ascii": domain.decode('ascii'),
                "mask_keystream_raw_hex": _hex(raw_keystream_r), "masks": masks_r,
                "block_list": _deniable_block_list("real", dk_r['blocks'], dk_r['key_2']),
            },
            "Bd": {
                "blocks": dk_d['blocks'], "grammar_key_hex": _hex(gk_d),
                "mask_domain_ascii": domain.decode('ascii'),
                "mask_keystream_raw_hex": _hex(raw_keystream_d), "masks": masks_d,
                "block_list": _deniable_block_list("duress", dk_d['blocks'], dk_d['key_2']),
            },
        },
        "expected_decode": {
            "real_via_dk_r": real_message,
            "duress_via_dk_d": duress_message,
            "duress_via_dk_d0_encode0": duress_message,
        },
        "grid_sha256": _grid_sha256(grid),
        "grid0_sha256_encode0": _grid_sha256(grid0),
    }
    if include_grid_csv:
        vector["grid_csv"] = _grid_csv(grid)
        vector["grid0_csv_encode0"] = _grid_csv(grid0)
    return vector, grid, grid0


# ── UTF-8 non-ASCII (positif) ────────────────────────────────────────────────
# Le clair est encodé en UTF-8 sans restriction d'alphabet (crypto_core.
# _message_to_bytes, révision du 2026-09-12) : ALPHABET/ALPHA_LEN ne décrivent
# QUE l'alphabet des symboles de grille (44 valeurs par cellule), un objet
# distinct du texte en clair. Un message accentué comme « déjà vu » est donc
# un cas de SUCCÈS ordinaire — voir gen_carter256_vector(), appelée
# directement dans generate_all() pour ce vecteur (aucune fonction dédiée
# n'est nécessaire ici, contrairement à l'ancienne version rejetée LH-1).


# ── Cas limites de longueur (Carter-256) ────────────────────────────────────
# Message vide (longueur 0) et message EXACTEMENT à C_PUB['carter256']
# OCTETS UTF-8 (150) — les deux bornes de la charge utile à longueur fixe
# (tâche 2). Réutilise gen_carter256_vector() telle quelle : ce sont des cas
# de succès, pas des rejets.

def gen_carter256_boundary_vectors(vec_id_prefix, master_key, ref256,
                                    nonce, y, leftover, noise_seed):
    empty_v, empty_g = gen_carter256_vector(
        f"{vec_id_prefix}-message-vide", "Message vide (longueur 0).",
        master_key, "", ref256, nonce, y, leftover, noise_seed)

    alphabet_no_space = CC.ALPHABET[1:]  # sans l'espace, pour un pavage simple
    boundary_msg = (alphabet_no_space * (CC.C_PUB['carter256'] // len(alphabet_no_space) + 1)
                    )[:CC.C_PUB['carter256']]
    # ASCII pur (1 octet/caractère) : longueur en caractères == longueur en
    # octets UTF-8 ici, ce qui simplifie la construction d'un message pile à
    # la frontière C_PUB (en OCTETS, format v3) sans avoir à compter des
    # points de code multi-octets.
    assert len(boundary_msg.encode('utf-8')) == CC.C_PUB['carter256']
    boundary_v, boundary_g = gen_carter256_vector(
        f"{vec_id_prefix}-c-pub-exact", f"Message de longueur EXACTE C_PUB={CC.C_PUB['carter256']} octets.",
        master_key, boundary_msg, ref256, nonce, y, leftover, noise_seed)

    return [empty_v, boundary_v], [empty_g, boundary_g]


# ── Assemblage du fichier vectors/carter_v3.json ────────────────────────────

# Clés spéciales trouvées par force brute sur des fonctions de PRODUCTION
# non modifiées (voir la convention documentée en tête de fichier) : ne
# JAMAIS régénérer aléatoirement, ces octets exacts sont ce qui garantit la
# reproductibilité du vecteur.
_MK_REDRAW_CARTER256 = bytes.fromhex(
    "e0dd43628e3077b947403ab22d91ebfccffd83eaef6e2cf1c5a36d5f342ffc48")
_MK_CR1_CARTERRANDOM = bytes.fromhex(
    "8374125baee5bd720daf25348737176109c420622e808c9be3c4219880e965d9")


# y (padding PayloadToSymbols, Définition 3.6) est GRAND et ALÉATOIRE dans
# TOUS les vecteurs SAUF carter256-basic-01, qui reste à y=0 : c'est le
# vecteur "vitrine" déjà vérifié indépendamment (revue manuelle du HChaCha20/
# sous-clé/déchiffrement/PtS) — le garder à y=0 isole EXACTEMENT une seule
# variable nouvelle (les masques) plutôt que d'invalider en même temps une
# vérification manuelle déjà faite. Partout ailleurs, y=0 est trompeur : en
# production y = secrets.randbelow(Q) est presque toujours un grand entier
# (Q atteint 10^19-10^20 selon la variante) — un vecteur figé à y=0 partout
# laisserait croire à tort qu'y est petit ou structuré. Chaque valeur
# ci-dessous a été tirée UNE FOIS par secrets.randbelow(Q) (Q recalculé pour
# le n_pos réel de son vecteur) puis figée en dur, pour rester reproductible.
_Y_CARTER256_REDRAW    = 315026600913985336601
_Y_CARTER360_BASIC      = 6445059058284360954
_Y_CARTERMIX_BASIC      = 26651063457506965199
_Y_CARTERRANDOM_BASIC   = 4141067831638074458
_Y_CARTERRANDOM_CR1     = 62650175422072468362
_Y_CARTER18_BASIC       = 7050798628124961890
_Y_CARTERHYBRID_BASIC   = 18828356724787626080
_Y_CLASSIC_BASIC        = 134034869517080008917
_Y_DENIABLE_REAL        = 21748169231046872990
_Y_DENIABLE_DURESS      = 107035887119794623319
_Y_CARTER256_NEG        = 45247765638722506571
_Y_CARTER256_UTF8       = 21248635146541447373
_Y_CARTER256_BOUNDARY   = 18442373562533863684


def generate_all(include_grid_csv_showcase=True):
    # Chargeurs uniques du dépôt (v3) -- tous les modes de generate_all()
    # (classique, Carter-256/360/Mix/Random/18/Hybrid, déni) y sont passés.
    ref256_v3 = load_referent_256_v3()
    ref360_v3 = load_referent_360_v3()
    nonce = bytes(range(24))
    noise_seed = bytes(reversed(range(32)))
    vectors = []
    grids = {}

    def add(v, g):
        vectors.append(v)
        grids[v["id"]] = g

    v, g = gen_carter256_vector(
        "carter256-basic-01", "Vecteur de base Carter-256.",
        bytes(range(32)), "HELLO WORLD", ref256_v3,
        nonce, 0, [], noise_seed, include_grid_csv=include_grid_csv_showcase)
    add(v, g)

    # TODO v3-format (etape 10) : _MK_REDRAW_CARTER256 a ete trouvee par
    # force brute pour declencher un redraw (ctr>=1) sous L'ANCIENNE
    # fonction de capacite (6 positions stegano/bloc) -- avec la nouvelle
    # regle (12 positions, rouge+bleu), cette cle ne declenche plus
    # forcement de redraw, et _Y_CARTER256_REDRAW/[2] (calcules pour
    # l'ancien n_pos post-redraw) ne sont plus valides pour le nouveau
    # n_pos. y=0/leftover=[] (comme carter256-basic-01) le temps de
    # rechercher une nouvelle cle de redraw sous la regle v3 a l'etape 10.
    v, g = gen_carter256_vector(
        "carter256-redraw-01", "Clé déclenchant un redraw (ctr>=1) pour Carter-256.",
        _MK_REDRAW_CARTER256, "REDRAW TRIGGERED", ref256_v3,
        nonce, 0, [], noise_seed)
    add(v, g)

    # TODO v3-format (etape 10) : _Y_CARTER360_BASIC calculee pour l'ancien
    # n_pos (tirage plat C1/C2/C3) -- regle par niveaux change Q. y=0 le
    # temps de retirer une valeur sous la regle v3 a l'etape 10.
    v, g = gen_carter360_vector(
        "carter360-basic-01", "Vecteur de base Carter-360.",
        bytes(range(32, 64)), "BONJOUR CARTER 360", ref360_v3,
        nonce, 0, [], noise_seed, include_grid_csv=include_grid_csv_showcase)
    add(v, g)

    # TODO v3-format (etape 10) : _Y_CARTERMIX_BASIC calculee pour l'ancien
    # n_pos -- y=0 le temps de retirer une valeur sous la regle v3.
    v, g = gen_cartermix_vector(
        "cartermix-basic-01", "Vecteur de base Carter-Mix (Ref256+Ref360).",
        bytes((i * 7 + 3) % 256 for i in range(32)),
        "CARTER MIX TEST", ref256_v3, ref360_v3,
        nonce, 0, [], noise_seed)
    add(v, g)

    # TODO v3-format (etape 10) : _Y_CARTERRANDOM_BASIC/_CR1 calculees pour
    # l'ancienne capacite (6 positions/bloc, referent bariole) -- la regle
    # v3 (12 positions, rouge+bleu) change Q, et _MK_CR1_CARTERRANDOM (cle
    # brute-forcee pour declencher le repli CR-1 sous l'ancienne formule)
    # peut ne plus declencher ce repli. y=0/leftover=[] le temps de
    # retirer de nouvelles valeurs sous la regle v3.
    v, g = gen_carterrandom_vector(
        "carterrandom-basic-01", "Vecteur de base Carter-Random (90×90).",
        bytes((i * 3 + 1) % 256 for i in range(32)), "CARTER RANDOM TEST", 90,
        nonce, 0, [], noise_seed)
    add(v, g)

    v, g = gen_carterrandom_vector(
        "carterrandom-cr1-01", "Clé déclenchant le repli CR-1 (méta→individuel).",
        _MK_CR1_CARTERRANDOM, "CR1 FALLBACK TEST", 90,
        nonce, 0, [], noise_seed)
    add(v, g)

    v, g = gen_carter18_vector(
        "carter18-basic-01", "Vecteur de base Carter-18.",
        bytes((i * 5 + 2) % 256 for i in range(32)), "CARTER 18 TEST", 90,
        nonce, _Y_CARTER18_BASIC, [], noise_seed)
    add(v, g)

    v, g = gen_carterhybrid_vector(
        "carterhybrid-basic-01", "Vecteur de base Carter-Hybrid.",
        bytes((i * 11 + 4) % 256 for i in range(32)), "CARTER HYBRID TEST", 90,
        nonce, _Y_CARTERHYBRID_BASIC, [], noise_seed)
    add(v, g)

    # TODO v3-format (etape 10) : _Y_CLASSIC_BASIC calculee pour l'ancien
    # n_pos (6 positions/sous-bloc) -- regle v3 (12, rouge+bleu) change Q.
    # y=0 le temps de retirer une valeur.
    steg_key = bytes((i * 13 + 5) % 256 for i in range(32))
    grid_size = 60; B = grid_size // 6; n_blocks = B * B
    key_b = [1] * n_blocks
    key_2 = [{'form_id': i % len(ref256_v3['forms'])} for i in range(n_blocks)]
    v, g = gen_classic_vector(
        "classic-basic-01", "Vecteur de base stegano_classic.",
        steg_key, "BONJOUR ANIBAL", key_b, key_2, ref256_v3, grid_size,
        nonce, 0, [], noise_seed)
    add(v, g)

    rsk = bytes((i * 17 + 6) % 256 for i in range(32))
    dsk = bytes((i * 19 + 7) % 256 for i in range(32))
    n_blocks_den = (90 // 6) ** 2
    pi = list(range(n_blocks_den))
    # Permutation fixe non-triviale (pas d'aléa ici : c'est π elle-même qui
    # est injectée pour la reproductibilité du vecteur, voir gen_deniable_vector).
    pi = pi[::2] + pi[1::2]
    half_den = n_blocks_den // 2   # 112 : taille de Br ET de Bd
    # TODO v3-format (etape 10) : plus de tirage de direction (cablage
    # production etape 5) -- un seul form_id par bloc, referent v3 6x6
    # choisi par select_referent_index (referent6x6_gen.py), pas
    # l'ancien referent bariole de carter_random.
    real_k2   = [{'form_id': (i * 3) % CR.N_FORMS} for i in range(half_den)]
    duress_k2 = [{'form_id': (i * 5 + 1) % CR.N_FORMS} for i in range(half_den)]
    v, g, g0 = gen_deniable_vector(
        "deniable-basic-01", "Déni plausible — Encode(m_r,m_d) et Encode0(m_d), même π/dsk.",
        "MESSAGE SECRET ANIBAL", "NOTES PERSO TEXTILE", 90, rsk, dsk, pi, noise_seed,
        real_inject={"_nonce": nonce, "_y": _Y_DENIABLE_REAL, "_leftover": [1], "_k2": real_k2},
        duress_inject={"_nonce": nonce[::-1], "_y": _Y_DENIABLE_DURESS, "_leftover": [2], "_k2": duress_k2},
        include_grid_csv=include_grid_csv_showcase)
    vectors.append(v)
    grids[v["id"] + "-encode"] = g
    grids[v["id"] + "-encode0"] = g0

    # TODO v3-format (etape 10) : _Y_CARTER256_NEG/_UTF8/_BOUNDARY ont ete
    # calculees pour l'ancien n_pos (6 positions stegano/bloc) -- Q differe
    # desormais (12 positions), ces constantes tombent hors plage. y=0/
    # leftover=[] le temps de retirer de nouvelles valeurs sous la regle v3
    # a l'etape 10 (comme carter256-basic-01, deja a y=0).
    neg_vecs, neg_grids = gen_carter256_negative_vectors(
        "carter256-neg", "Vecteurs négatifs Carter-256",
        bytes(range(32)), "HELLO WORLD", ref256_v3, nonce, 0, [], noise_seed)
    for vv, gg in zip(neg_vecs, neg_grids):
        vectors.append(vv)
        grids[vv["id"]] = gg

    v, g = gen_carter256_vector(
        "carter256-utf8-01", "Message UTF-8 non-ASCII (« déjà vu ») — cas de succès ordinaire.",
        bytes((i * 23 + 9) % 256 for i in range(32)), "déjà vu", ref256_v3,
        nonce, 0, [], noise_seed)
    add(v, g)

    boundary_vecs, boundary_grids = gen_carter256_boundary_vectors(
        "carter256-boundary", bytes(range(32)), ref256_v3, nonce, 0, [], noise_seed)
    for vv, gg in zip(boundary_vecs, boundary_grids):
        vectors.append(vv)
        grids[vv["id"]] = gg

    document = {
        "format_version": "carter-v3",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "generator_commit": GENERATOR_COMMIT,
        "generator_module": "stegano/vectors_internal.py",
        "alphabet": CC.ALPHABET,
        "alpha_len": CC.ALPHA_LEN,
        "role_legend": ROLE_LEGEND,
        "c_pub": dict(CC.C_PUB),
        "max_redraws": CC.MAX_REDRAWS,
        "rejection_rule": (
            "Échantillonnage par rejet (bruit de grille ET masques de position) : "
            "un keystream ChaCha20 (clé dédiée dérivée par HKDF) est lu par blocs "
            "d'octets bruts ; soit limit = 256 - (256 mod ALPHA_LEN) = 220 pour "
            "ALPHA_LEN=44 (masques/bruit) — pour les symboles PayloadToSymbols, la "
            "réduction est directe en base ALPHA_LEN, aucun rejet n'y est nécessaire. "
            "Un octet b du keystream est accepté ssi b < limit, auquel cas sa valeur "
            "utile est b % ALPHA_LEN (distribution exactement uniforme sur "
            "[0..ALPHA_LEN-1], sans biais modulo) ; b >= limit est jeté et le flux "
            "continue. Voir crypto_core.random_grid/_derive_masks pour "
            "l'implémentation de référence — LH-5 doit reproduire ce SEUIL "
            "(220) et cette règle (b < limit ? b % ALPHA_LEN : rejeté) telle quelle."
        ),
        "labels_used": _labels_export(),
        "vectors": vectors,
    }
    return document, grids


if __name__ == '__main__':
    doc, grids = generate_all()
    out_dir = os.path.join(REPO_ROOT, 'vectors')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'carter_v3.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
    print(f"{len(doc['vectors'])} vecteurs écrits dans {out_path}")
    for v in doc['vectors']:
        print(" -", v['id'])
