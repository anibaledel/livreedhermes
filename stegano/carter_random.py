# (c) Anibal Edelberto Amiot 2026 - La Livree d'Hermes
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
carter_random.py  v3 — Encodage Carter avec référents aléatoires 6×6

Architecture (câblage production, étape 6, 2026-09-12 -- remplace l'ancien
référent bariolé local) :
  - Cellule unique : 6×6 (90÷6=15 blocs par côté, 225 blocs, 25 méta-blocs)
  - 256 référents v3 (rouge/bleu/vert/jaune, ChaCha20 -- referent6x6_gen.py)
  - Stégano = rouge+bleu ensemble (12 positions/forme), triées par balayage
    (stegano/sweep.py) -- plus de tirage de direction (l'ancien référent
    bariolé n'a pas de notion de couleur, ses formes étaient génériques)
  - Mode individuel OU méta-concentrique (3×3 → 18×18), dérivé de la clé
  - Lecture concentrique dans les méta-blocs : noyau → anneau → coins

Paramètres dérivés de la clé (transparents pour l'appelant) :
  referent_index ∈ [0,255] (select_referent_index, un octet sans réduction
  modulo)  ×  mode ∈ {2}  → 512 configurations globales, toutes
  inaccessibles sans la clé. La forme est tirée par bloc dans la grammaire
  (entropie de grammaire, non de configuration globale). Le mode méta
  bascule vers le mode individuel si sa capacité est insuffisante pour la
  clé donnée (CR-1, voir _derive_params).

Module autonome au sens où aucun fichier n'est chargé ICI : referent6x6_gen.
get_referent_cached() régénère le référent choisi depuis son seul index
(déterministe, ChaCha20 -- pas de fichier JSON). Réutilise les primitives
déjà auditées de stegano_lib.py (séparation de clé Carter, chiffrement,
flux de symboles base-44 uniforme) plutôt que d'en dupliquer une version
propre à ce fichier.
"""

import random
from typing import List, Dict, Tuple, Optional

from stegano_lib import (
    ALPHA_LEN, LABELS, C_PUB, MAX_REDRAWS, _redraw_grammar_key,
    _encrypt, _decrypt, payload_to_symbols, max_message_for,
    _carter_split, _PURE, _STRUCTURED, _MESSAGE, random_grid, _derive_masks,
)
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hh
import referent6x6_gen as _R6
from sweep import derive_sweep_index, crypto_reading_order

# ── Constantes ─────────────────────────────────────────────────────────────────
GRID_SIZE  = 90
CELL_SIZE  = 6
N_SIDE     = GRID_SIZE // CELL_SIZE   # 15 blocs par côté
N_BLOCKS   = N_SIDE * N_SIDE          # 225 blocs
META       = 3                         # méta-bloc = 3×3 blocs = 18×18 pixels
N_META     = N_SIDE // META            # 5 méta-blocs par côté
N_META_TOT = N_META * N_META          # 25 méta-blocs
N_DIR      = 4
N_FORMS    = 256

# Carter-18 UNIQUEMENT (referent 18x18, get_referent_18/_carter18_seed plus
# bas) -- hors perimetre du cablage etape 6 (regle 6x6 rouge/bleu/vert/
# jaune, referent6x6_gen.py) : Carter-Random n'utilise plus SEEDS depuis
# ce commit (select_referent_index, 256 referents), mais Carter-18 garde
# son propre choix parmi ces 10 graines fixes, un systeme de referent
# entierement distinct (18x18, sans notion de couleur) que cette regle ne
# couvre pas.
SEEDS = [42, 137, 999, 271, 1337, 31415, 27182, 61803, 65537, 99991]

# Ordre concentrique dans un méta-bloc 3×3
# Noyau (1) → anneau cardinal (4) → coins (4) = 9 blocs
CONC_ORDER = [
    (1, 1),
    (0, 1), (1, 0), (1, 2), (2, 1),
    (0, 0), (0, 2), (2, 0), (2, 2),
]

# ── Masques de position — distribution uniforme sur [0..ALPHA_LEN-1] ──────────
# Même principe que le fix de valeur appliqué à stegano_lib.encode_carter() :
# masquer chaque symbole rend les cellules message indiscernables du bruit
# même si la géométrie des référents générés dynamiquement produit une
# distribution de positions moins régulière que le Référent 256 fixe.
#
# CR-3 (audit G. Kerma) : les valeurs sont déjà uniformes par construction
# (sortie XChaCha20 + rejection sampling base-44 — voir
# crypto_core.payload_to_symbols). Ce masque additif (nibble + mask, mod
# ALPHA_LEN) n'apporte donc pas d'uniformité supplémentaire. Il est
# conservé comme couche défensive, mais ne doit pas être présenté comme
# la source de l'indiscernabilité, et ne doit pas être réemployé ailleurs
# tel quel : il dérive de grammar_key SEUL, sans aléa propre à la grille
# (même grammar_key -> mêmes masques à chaque appel), ce qui n'est pas la
# propriété qu'on attendrait d'un masque cryptographique générique.
#
# Tâche 3 (format v3) : Random/18/Hybrid réutilisent tous _carter_split
# (Carter-256), donc le même grammar_key pour une master_key donnée —
# _derive_masks(grammar_key, n) ne dépendant que de ces deux valeurs, les
# trois variantes dérivaient jusqu'ici EXACTEMENT le même flux de masques
# sous la même clé. `domain` (un des LABELS['mask_seed']['info_*'])
# domaine-sépare désormais l'amorce par variante.
#
# Migration ChaCha20 (suite tâche 3, avant tâche 4) : remplace la chaîne
# SHA-256 non standard (h_{i+1} = SHA256(h_i), bespoke) par le flux
# ChaCha20 lui-même — mask_key = HKDF-SHA256(grammar_key, salt, info=domain)
# puis masques = keystream ChaCha20(mask_key, nonce=0) + rejet vers Z44.
# Nonce nul sans risque de réutilisation clé+nonce : mask_key est une clé
# dédiée à cet unique usage (dérivée fraîchement par HKDF, jamais utilisée
# pour chiffrer quoi que ce soit d'autre), pas une clé de chiffrement
# générique réemployée. Avantages sur la chaîne SHA-256 : construction
# nommée/standard (plus auditable qu'une chaîne bespoke), flux non borné
# sans contournement (HKDF-Expand seul est borné à 255×32 octets — ici
# seule l'AMORCE passe par HKDF, le flux lui-même vient de ChaCha20, sans
# limite pratique), et réutilise le même primitif que le port JS doit de
# toute façon implémenter pour HChaCha20/XChaCha20 (tâche 1) — un seul
# cœur ChaCha20 à porter et auditer côté JS, pas deux constructions
# distinctes.
#
# Pipeline d'écriture unique (2026-09-12) : _derive_masks() a déménagé dans
# crypto_core.py, partagée désormais par les 6 variantes Carter ET le déni
# plausible (secu_box.py) — ré-exportée ici par le seul import ci-dessus
# (via stegano_lib), aucun appelant de ce module ne change.

# ── Référent 6×6 (câblage production, étape 6, 2026-09-12) ─────────────────────
# Remplace ENTIÈREMENT l'ancien générateur bariolé local (_generate_form/
# _make_referent/get_referent/SEEDS, Mersenne Twister) : les référents sont
# désormais les 256 référents ChaCha20 normatifs de referent6x6_gen.py
# (déjà construits, voir stegano/referent6x6_gen.py et docs/
# PAPER_NUMBERS_v3.md §5.3), choisis par UN octet de grammar_key sans
# réduction modulo (256 référents = 256 valeurs possibles). get_referent()
# reste exposé (ré-export de get_referent_cached) pour compatibilité des
# appelants existants (secu_box.py l'a déjà adopté directement à l'étape 5).

def get_referent(ref_idx: int):
    """Référent 6×6 (256 formes v3, rouge/bleu/vert/jaune) -- ré-export de
    referent6x6_gen.get_referent_cached (cache mémoire complet, 256
    référents possibles)."""
    return _R6.get_referent_cached(ref_idx)

_RANDOM_STEGANO_COLORS = list(_R6.STEGANO_COLORS)   # ['blue', 'orange']

def _form_stegano_positions(form: Dict, sweep_of_color: Dict) -> List[Tuple[int, int]]:
    """Positions stégano (blue+orange ensemble, 12) d'une forme, triées par
    balayage -- règle v3 6×6, remplace form[dir] (l'ancien référent
    bariolé n'a pas de notion de couleur)."""
    cells_by_niveau = {0: {c: [tuple(p) for p in form[c]] for c in _RANDOM_STEGANO_COLORS}}
    return crypto_reading_order(cells_by_niveau, _RANDOM_STEGANO_COLORS,
                                 _R6.GRID_SIZE, sweep_of_color)

# ── Dérivation des paramètres clé ───────────────────────────────────────────────
def _derive_params(grammar_key: bytes,
                    grid_size: int = GRID_SIZE) -> Tuple[int, bool]:
    """
    Retourne (ref_idx, meta_mode) depuis grammar_key. ref_idx ∈ [0,255]
    (select_referent_index, un octet sans réduction modulo -- étape 6).
    meta_mode=True  : lecture par méta-blocs 18×18 (concentrique)
    meta_mode=False : lecture bloc à bloc 6×6

    CR-1 (audit G. Kerma, rév. 3) : bascule déterministe vers le mode
    individuel quand le mode méta offre moins de capacité que le mode
    individuel pour cette clé — comparaison directe plutôt qu'un seuil fixe.

    CR-1b (audit G. Kerma, rév. 3) : grid_size est propagé pour calibrer
    la comparaison sur la géométrie effectivement encodée (90×90 ou
    180×180) — tous les appelants doivent transmettre leur grid_size réel,
    sinon la comparaison porte sur la mauvaise géométrie.

    Labels centralisés dans crypto_core.LABELS['carterrandom'] (tâche 3).
    """
    PL = LABELS['carterrandom']
    km = _HKDF(_hh.SHA256(), 4, salt=PL['params_salt'],
               info=PL['params_info']).derive(grammar_key)
    ref_idx  = _R6.select_referent_index(grammar_key)
    meta_raw = km[1] < 128   # ~50 % de chances

    if meta_raw:
        ref = get_referent(ref_idx)
        sweep_of_color = {c: derive_sweep_index(grammar_key, c) for c in _RANDOM_STEGANO_COLORS}

        # Capacité méta sur la géométrie effectivement encodée
        n_meta_side = grid_size // (CELL_SIZE * META)
        mg          = _grammar_meta(grammar_key, ref,
                                     n_meta_tot=n_meta_side * n_meta_side,
                                     n_meta=n_meta_side)
        n_msg_meta  = sum(1 for x in mg if x['role'] == _MESSAGE)
        cap_meta    = n_msg_meta * META * META * 12

        # Capacité individuelle pour la même clé et la même géométrie
        n_side_ind = grid_size // CELL_SIZE
        gi         = _grammar_individual(grammar_key, ref, n_side=n_side_ind)
        n_msg_ind  = sum(1 for x in gi if x['role'] == _MESSAGE)
        cap_ind    = n_msg_ind * 12

        # Bascule déterministe : méta seulement si meilleur que individuel
        meta_mode = cap_meta >= cap_ind
    else:
        meta_mode = False

    return ref_idx, meta_mode

# ── Grammaire individuelle ──────────────────────────────────────────────────────
def _grammar_individual(grammar_key: bytes,
                        ref: List[Dict],
                        n_side: int = N_SIDE) -> List[Dict]:
    """n_side² blocs, chacun avec rôle + forme (256 formes v3, 1 octet
    direct, aucun rejet nécessaire -- plus de tirage de direction, le
    référent v3 encode déjà des positions absolues par couleur).
    Labels centralisés dans crypto_core.LABELS['carterrandom'] (tâche 3)."""
    n_blocks = n_side * n_side
    GL = LABELS['carterrandom']
    km = _HKDF(_hh.SHA256(), n_blocks * 2,
               salt=GL['grammar_individual_salt'],
               info=GL['grammar_individual_info']).derive(grammar_key)
    return [{
        'role':    _PURE if km[i*2] < 85 else (_STRUCTURED if km[i*2] < 170
                   else _MESSAGE),
        'form_id': km[i*2+1],
    } for i in range(n_blocks)]

# ── Grammaire méta-blocs ────────────────────────────────────────────────────────
def _grammar_meta(grammar_key: bytes,
                  ref: List[Dict],
                  n_meta_tot: int = N_META_TOT,
                  n_meta: int = N_META) -> List[Dict]:
    """
    25 méta-blocs (5×5), chacun avec rôle + 9 sous-blocs (une forme
    chacun, plus de direction -- voir _grammar_individual). La lecture au
    sein d'un méta-bloc suit l'ordre concentrique CONC_ORDER.
    Labels centralisés dans crypto_core.LABELS['carterrandom'] (tâche 3).
    """
    ML = LABELS['carterrandom']
    km1 = _HKDF(_hh.SHA256(), n_meta_tot * 2,
                salt=ML['grammar_meta_salt'], info=ML['grammar_meta_roles_info']).derive(grammar_key)
    km2 = _HKDF(_hh.SHA256(), n_meta_tot * META * META,
                salt=ML['grammar_meta_salt'], info=ML['grammar_meta_forms_info']).derive(grammar_key)
    grammar = []
    for mi in range(n_meta_tot):
        role = (_PURE if km1[mi*2] < 85
                else (_STRUCTURED if km1[mi*2] < 170 else _MESSAGE))
        sub = [{'form_id': km2[mi*9+bi]} for bi in range(META * META)]
        grammar.append({'role': role, 'sub': sub, 'n_meta': n_meta})
    return grammar

def _random_c_pub_key(grid_size: int) -> str:
    """
    Nom de la cible C_PUB pour cette géométrie. Seules 90 et 180 sont
    utilisées dans ce dépôt (encode_carter_random / encode_carter_random_360) ;
    toute autre valeur est traitée comme la grande géométrie par défaut.
    """
    return 'carterrandom90' if grid_size == GRID_SIZE else 'carterrandom360'

def _find_random_grammar_with_c_pub(grammar_key: bytes, grid_size: int):
    """
    Recherche déterministe (tâche 4, format v3) pour Carter Random : essaie
    grammar_key_ctr pour ctr=0..MAX_REDRAWS-1 (voir
    crypto_core._redraw_grammar_key pour l'ordre exact). À CHAQUE tentative,
    ref_idx, mode (bascule CR-1 comprise) ET grammaire sont re-dérivés
    ENSEMBLE depuis le même grammar_key_ctr — un redraw ne touche jamais un
    seul de ces éléments isolément.

    Retourne (grammar_key_ctr, ref_idx, meta_mode, ref, grammar, n_pos) du
    premier succès. Lève ValueError après MAX_REDRAWS échecs — jamais de
    grille construite, même partielle.
    """
    c_pub_key = _random_c_pub_key(grid_size)
    n_side_g     = grid_size // CELL_SIZE
    n_meta_g     = n_side_g  // META
    n_meta_tot_g = n_meta_g * n_meta_g
    for ctr in range(MAX_REDRAWS):
        gk_ctr = _redraw_grammar_key(grammar_key, 'carterrandom', ctr)
        ref_idx, meta_mode = _derive_params(gk_ctr, grid_size)
        ref = get_referent(ref_idx)
        if not meta_mode:
            grammar = _grammar_individual(gk_ctr, ref, n_side_g)
            n_msg   = sum(1 for g in grammar if g['role'] == _MESSAGE)
            n_pos   = n_msg * 12
        else:
            grammar = _grammar_meta(gk_ctr, ref, n_meta_tot_g, n_meta_g)
            n_msg   = sum(1 for g in grammar if g['role'] == _MESSAGE)
            n_pos   = n_msg * META * META * 12
        if max_message_for(n_pos) >= C_PUB[c_pub_key]:
            return gk_ctr, ref_idx, meta_mode, ref, grammar, n_pos
    raise ValueError(
        f"Échec de dérivation de grammaire après {MAX_REDRAWS} tentatives : "
        f"régénérer la clé maître (capacité cible C_PUB={C_PUB[c_pub_key]} "
        f"caractères non atteinte).")

# ── Encode ──────────────────────────────────────────────────────────────────────
def encode_carter_random(message: str,
                          master_key: bytes,
                          grid_size: int = GRID_SIZE,
                          _nonce: bytes = None, _y: int = None,
                          _leftover: List[int] = None, _noise_seed: bytes = None) -> Tuple[List, Dict]:
    """
    Encode un message dans une grille 90×90.
    Tous les paramètres géométriques sont dérivés de master_key.

    _nonce/_y/_leftover/_noise_seed (préfixés `_`, tâche 7) : injection
    interne pour le mode vecteurs — voir carter.encode_carter(). Le
    redraw (ctr), le mode (CR-1) et les masques restent 100% déterministes
    depuis master_key seul, aucune injection n'y est nécessaire.
    """
    xchacha_key, grammar_key = _carter_split(master_key)
    c_pub_key = _random_c_pub_key(grid_size)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS
    # UTF-8 du message (pas des caractères — voir crypto_core._message_to_bytes).
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB[c_pub_key]:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB[c_pub_key]} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    n_side_g  = grid_size // CELL_SIZE
    n_meta_g  = n_side_g  // META

    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed, mode (CR-1 compris) et grammaire redérivés ensemble à chaque
    # tentative, voir _find_random_grammar_with_c_pub().
    gk_ctr, ref_idx, meta_mode, ref, grammar, cap = _find_random_grammar_with_c_pub(
        grammar_key, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}

    payload = _encrypt(message, xchacha_key, cap, _nonce=_nonce)
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
    masks = _derive_masks(gk_ctr, len(nibbles) + 128, LABELS['mask_seed']['info_random'])
    nib_i = 0

    if not meta_mode:
        # ── Mode individuel : bloc à bloc ──
        for i, g in enumerate(grammar):
            if g['role'] != _MESSAGE: continue
            br, bc = i // n_side_g, i % n_side_g
            form   = ref[g['form_id']]
            r0, c0 = br * CELL_SIZE, bc * CELL_SIZE
            for pos in _form_stegano_positions(form, sweep_of_color):
                if nib_i >= len(nibbles): break
                gr, gc = r0 + pos[0], c0 + pos[1]
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN
                nib_i += 1
        mode_str  = 'individual'
        n_msg_out = sum(1 for g in grammar if g['role'] == _MESSAGE)

    else:
        # ── Mode méta-concentrique : méta-blocs 18×18 ──
        # grammar/cap déjà dérivés plus haut par la recherche C_PUB (tâche 4).
        for mi, mg in enumerate(grammar):
            if mg['role'] != _MESSAGE: continue
            mr, mc = mi // n_meta_g, mi % n_meta_g
            for ci, (br_off, bc_off) in enumerate(CONC_ORDER):
                sg     = mg['sub'][ci]
                form   = ref[sg['form_id']]
                br, bc = mr * META + br_off, mc * META + bc_off
                r0, c0 = br * CELL_SIZE, bc * CELL_SIZE
                for pos in _form_stegano_positions(form, sweep_of_color):
                    if nib_i >= len(nibbles): break
                    gr, gc = r0 + pos[0], c0 + pos[1]
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        grid[gr][gc] = (nibbles[nib_i] + masks[nib_i]) % ALPHA_LEN
                    nib_i += 1
        mode_str  = 'meta'
        n_msg_out = sum(1 for g in grammar if g['role'] == _MESSAGE)

    return grid, {
        'referent_index': ref_idx, 'mode': mode_str, 'meta_mode': meta_mode,
        'n_msg_blocks': n_msg_out, 'capacity_chars': max_message_for(cap),
    }

# ── Decode ──────────────────────────────────────────────────────────────────────
def decode_carter_random(grid: List, master_key: bytes,
                          grid_size: int = GRID_SIZE) -> str:
    """Décode une grille 90×90 (même recherche C_PUB déterministe que
    l'encodeur — tâche 4)."""
    xchacha_key, grammar_key = _carter_split(master_key)
    gk_ctr, ref_idx, meta_mode, ref, grammar, cap = _find_random_grammar_with_c_pub(
        grammar_key, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}
    n_side_g  = grid_size // CELL_SIZE
    n_meta_g  = n_side_g  // META

    masks = _derive_masks(gk_ctr, grid_size * grid_size, LABELS['mask_seed']['info_random'])
    vals, nib_i = [], 0

    if not meta_mode:
        for i, g in enumerate(grammar):
            if g['role'] != _MESSAGE: continue
            br, bc = i // n_side_g, i % n_side_g
            form   = ref[g['form_id']]
            r0, c0 = br * CELL_SIZE, bc * CELL_SIZE
            for pos in _form_stegano_positions(form, sweep_of_color):
                gr, gc = r0 + pos[0], c0 + pos[1]
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    vals.append((grid[gr][gc] - masks[nib_i]) % ALPHA_LEN)
                nib_i += 1
    else:
        for mi, mg in enumerate(grammar):
            if mg['role'] != _MESSAGE: continue
            mr, mc = mi // n_meta_g, mi % n_meta_g
            for ci, (br_off, bc_off) in enumerate(CONC_ORDER):
                sg     = mg['sub'][ci]
                form   = ref[sg['form_id']]
                br, bc = mr * META + br_off, mc * META + bc_off
                r0, c0 = br * CELL_SIZE, bc * CELL_SIZE
                for pos in _form_stegano_positions(form, sweep_of_color):
                    gr, gc = r0 + pos[0], c0 + pos[1]
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        vals.append((grid[gr][gc] - masks[nib_i]) % ALPHA_LEN)
                    nib_i += 1

    return _decrypt(vals, xchacha_key, len(vals))

# ── Utilitaires ─────────────────────────────────────────────────────────────────
def random_fits(message: str, master_key: bytes,
                 grid_size: int = GRID_SIZE) -> bool:
    """Vérifie si le message tient dans la grille avec la config dérivée
    (après redraw C_PUB, tâche 4 — reflète ce qu'encode_carter_random()
    utilise réellement)."""
    c_pub_key = _random_c_pub_key(grid_size)
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB[c_pub_key]:
        return False
    _, grammar_key = _carter_split(master_key)
    _, _, _, _, _, n_pos = _find_random_grammar_with_c_pub(grammar_key, grid_size)
    return msg_bytes_len <= max_message_for(n_pos)

def random_capacity(master_key: bytes, grid_size: int = GRID_SIZE) -> Dict:
    """Retourne la capacité disponible pour une clé donnée (après redraw
    C_PUB, tâche 4)."""
    _, grammar_key = _carter_split(master_key)
    gk_ctr, ref_idx, meta_mode, ref, grammar, n_pos = _find_random_grammar_with_c_pub(
        grammar_key, grid_size)
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
def encode_carter_random_360(message: str, master_key: bytes) -> Tuple[List, Dict]:
    """Carter Random sur grille 180×180 (4× plus de blocs, capacité ~4×)."""
    return encode_carter_random(message, master_key, grid_size=180)

def decode_carter_random_360(grid: List, master_key: bytes) -> str:
    """Décode une grille Carter Random 180×180."""
    return decode_carter_random(grid, master_key, grid_size=180)


# ══════════════════════════════════════════════════════════════════════════════
# CARTER-18 : blocs 18×18 concentriques aléatoires
# ── Spécification (planche 036, La Livrée d'Hermès) ──────────────────────────
# Grille 18×18 = 9 couches concentriques, couche k = 8k+4 cellules.
# 4 directions de lecture : couches 0→8, 8→0, paires, impaires.
# Les positions à l'intérieur de chaque couche sont mélangées par graine.
# Un référent 18×18 = 256 formes × 4 directions × positions aléatoires.
#
# Porté depuis une livraison externe (paquet d'export) : l'original importait
# _byte_to_syms/_derive_masks depuis un crypto_core.py/carter.py qui n'existent
# pas sous cette forme dans ce dépôt, et dimensionnait la capacité en
# "nibbles // 2 - 76" (2 symboles par octet fixes + 76 octets de surcoût AEAD)
# — une arithmétique propre au format de payload de cette livraison, pas à
# celui de ce dépôt (payload_to_symbols() produit un nombre de symboles
# variable par octet, marge d'uniformité incluse ; _AEAD_OVERHEAD vaut 72 ici,
# pas 76). Reconstruit avec payload_to_symbols()/max_message_for(), comme le
# fait déjà encode_carter_random() ci-dessus — la géométrie (couches,
# directions, référent 18×18) est inchangée.
# ══════════════════════════════════════════════════════════════════════════════

BLOCK_18   = 18          # côté du bloc
N_LAYERS   = 9           # couches concentriques (k=0..8)
N_FORMS_18 = 256         # formes par référent 18×18
N_DIR_18   = 4           # directions de lecture

# Sélection des couches par direction
_LAYERS_BY_DIR = [
    list(range(9)),        # dir 0 : 0→8 (noyau→périphérie) — 324 positions
    list(range(8,-1,-1)),  # dir 1 : 8→0 (périphérie→noyau) — 324 positions
    list(range(0,9,2)),    # dir 2 : couches paires 0,2,4,6,8 — 180 positions
    list(range(1,9,2)),    # dir 3 : couches impaires 1,3,5,7 — 144 positions
]

# Nombre de positions par direction (précalculé)
_POSITIONS_PER_DIR = [sum(8*k+4 for k in layers) for layers in _LAYERS_BY_DIR]
# = [324, 324, 180, 144]


def _layer_cells(k: int) -> List[Tuple[int,int]]:
    """
    Retourne les (row, col) de la couche k dans une grille 18×18.
    Couche 0 = noyau 2×2 (lignes 8-9, colonnes 8-9).
    Couche k = anneau [8-k-1 .. 8+k+1] × [8-k-1 .. 8+k+1] - intérieur.
    """
    r_min = BLOCK_18//2 - k - 1
    r_max = BLOCK_18//2 + k
    c_min = BLOCK_18//2 - k - 1
    c_max = BLOCK_18//2 + k

    cells = []
    for r in range(r_min, r_max+1):
        for c in range(c_min, c_max+1):
            # Uniquement la bordure (pas l'intérieur de l'anneau)
            if r == r_min or r == r_max or c == c_min or c == c_max:
                if 0 <= r < BLOCK_18 and 0 <= c < BLOCK_18:
                    cells.append((r, c))
    return cells


def _build_form_18(rng: 'random.Random') -> List[List[Tuple[int,int]]]:
    """
    Construit une forme 18×18 : pour chaque direction, la liste ordonnée
    des positions de lecture (couches dans l'ordre de la direction, positions
    à l'intérieur de chaque couche mélangées aléatoirement).
    Retourne une liste de 4 listes de (row, col).
    """
    # Pré-calculer les cellules de chaque couche (mélangées une fois par forme)
    layer_cells_shuffled = []
    for k in range(N_LAYERS):
        cells = _layer_cells(k)
        rng.shuffle(cells)
        layer_cells_shuffled.append(cells)

    dirs = []
    for layer_order in _LAYERS_BY_DIR:
        positions = []
        for k in layer_order:
            positions.extend(layer_cells_shuffled[k])
        dirs.append(positions)
    return dirs


_CACHE_18: Dict[int, List] = {}

def get_referent_18(seed: int) -> List[List[List[Tuple[int,int]]]]:
    """
    Génère (ou retourne depuis le cache) le référent 18×18 pour une graine
    donnée. Retourne une liste de N_FORMS_18=256 formes.
    Chaque forme = liste de 4 directions.
    Chaque direction = liste ordonnée de (row, col).
    Non cryptographique par conception (référents publics).
    """
    if seed not in _CACHE_18:
        rng = random.Random(seed)
        _CACHE_18[seed] = [_build_form_18(rng) for _ in range(N_FORMS_18)]
    return _CACHE_18[seed]


def _grammar_18(grammar_key: bytes,
                grid_size: int = GRID_SIZE) -> List[Dict]:
    """
    Dérive la grammaire Carter-18 depuis grammar_key.
    Grille grid_size×grid_size divisée en (grid_size//18)² méta-blocs 18×18.
    Retourne la liste des méta-blocs avec rôle, form_id, dir_id.
    Labels centralisés dans crypto_core.LABELS['carter18'] (tâche 3).
    """
    n_side_18 = grid_size // BLOCK_18   # ex. 5 pour grid 90×90
    n_blocks_18 = n_side_18 * n_side_18  # ex. 25
    L18 = LABELS['carter18']
    km = _HKDF(_hh.SHA256(), n_blocks_18 * 3,
                salt=L18['grammar_salt'],
                info=L18['grammar_info']).derive(grammar_key)
    return [{
        'role':    _PURE if km[i*3] < 85 else (_STRUCTURED if km[i*3] < 170
                   else _MESSAGE),
        'form_id': (km[i*3+1] * N_FORMS_18) // 256,
        'dir':     km[i*3+2] % N_DIR_18,
    } for i in range(n_blocks_18)]


def _carter18_seed(grammar_key: bytes) -> int:
    """Graine du référent 18×18 pour cette clé (dérivation partagée encode/decode).
    Labels centralisés dans crypto_core.LABELS['carter18'] (tâche 3)."""
    L18 = LABELS['carter18']
    idx = int.from_bytes(
        _HKDF(_hh.SHA256(), 4, salt=L18['seed_salt'],
              info=L18['seed_info']).derive(grammar_key), 'big') % len(SEEDS)
    return SEEDS[idx]


def _find_carter18_grammar_with_c_pub(grammar_key: bytes, grid_size: int):
    """
    Recherche déterministe (tâche 4, format v3) pour Carter-18 : essaie
    grammar_key_ctr pour ctr=0..MAX_REDRAWS-1 (voir
    crypto_core._redraw_grammar_key). Seed du référent ET grammaire sont
    re-dérivés ENSEMBLE depuis le même grammar_key_ctr à chaque tentative.
    Retourne (grammar_key_ctr, seed, ref18, grammar, cap) du premier succès.
    Lève ValueError après MAX_REDRAWS échecs.
    """
    for ctr in range(MAX_REDRAWS):
        gk_ctr = _redraw_grammar_key(grammar_key, 'carter18', ctr)
        seed  = _carter18_seed(gk_ctr)
        ref18 = get_referent_18(seed)
        grammar = _grammar_18(gk_ctr, grid_size)
        cap = sum(_POSITIONS_PER_DIR[g['dir']]
                  for g in grammar if g['role'] == _MESSAGE)
        if max_message_for(cap) >= C_PUB['carter18']:
            return gk_ctr, seed, ref18, grammar, cap
    raise ValueError(
        f"Échec de dérivation de grammaire après {MAX_REDRAWS} tentatives : "
        f"régénérer la clé maître (capacité cible C_PUB={C_PUB['carter18']} "
        f"caractères non atteinte).")

def encode_carter_18(message: str,
                     master_key: bytes,
                     grid_size: int = GRID_SIZE,
                     _nonce: bytes = None, _y: int = None,
                     _leftover: List[int] = None, _noise_seed: bytes = None) -> Tuple[List[List[int]], Dict]:
    """
    Carter-18 : encode sur grille grid_size×grid_size avec méta-blocs 18×18.

    Chaque méta-bloc 18×18 porte ses symboles en ordre concentrique — noyau
    d'abord pour dir 0, périphérie d'abord pour dir 1, couches paires/impaires
    pour dir 2/3. Les positions à l'intérieur de chaque couche sont mélangées
    aléatoirement par la graine (publique) du référent.

    Capacité nettement supérieure à Carter-256 (324 positions par méta-bloc
    message en direction 0/1, contre 6 par bloc en Carter-256).

    _nonce/_y/_leftover/_noise_seed (tâche 7) : voir encode_carter_random().
    """
    # C18-2 (audit G. Kerma, rév. 5) : grid_size doit être multiple de BLOCK_18,
    # sinon n_side_18 = grid_size // BLOCK_18 tronque silencieusement et les
    # méta-blocs ne pavent plus la grille correctement.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    xchacha_key, grammar_key = _carter_split(master_key)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS UTF-8.
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carter18']:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB['carter18']} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    n_side_18 = grid_size // BLOCK_18
    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed du référent et grammaire redérivés ensemble à chaque tentative.
    gk_ctr, seed, ref18, grammar, cap = _find_carter18_grammar_with_c_pub(
        grammar_key, grid_size)

    payload = _encrypt(message, xchacha_key, cap, _nonce=_nonce)
    # Même flux de symboles base-44 que encode_carter_random() ci-dessus —
    # charge utile à longueur fixe (format v3, tâche 2) : toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    nibbles = payload_to_symbols(payload, cap, _y=_y, _leftover=_leftover)

    masks = _derive_masks(gk_ctr, len(nibbles) + 256, LABELS['mask_seed']['info_18'])
    # Remplissage bulk CSPRNG — voir encode_carter_random().
    grid  = random_grid(grid_size, grid_size, _noise_seed=_noise_seed)

    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE or ni >= len(nibbles): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        form = ref18[g['form_id']]
        for r, c in form[g['dir']]:
            if ni >= len(nibbles): break
            gr, gc = br18*BLOCK_18+r, bc18*BLOCK_18+c
            if 0 <= gr < grid_size and 0 <= gc < grid_size:
                grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
            ni += 1

    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    return grid, {
        'seed': seed, 'grid_size': grid_size, 'mode': 'carter-18',
        'n_msg_blocks': n_msg, 'capacity_chars': max_message_for(cap),
    }


def decode_carter_18(grid: List[List[int]],
                     master_key: bytes,
                     grid_size: int = GRID_SIZE) -> str:
    """Décode une grille encodée par encode_carter_18. ValueError si clé
    incorrecte (même recherche C_PUB déterministe que l'encodeur — tâche 4)."""
    # C18-2 (audit G. Kerma, rév. 5) : voir encode_carter_18.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    xchacha_key, grammar_key = _carter_split(master_key)
    gk_ctr, seed, ref18, grammar, n_tot_pos = _find_carter18_grammar_with_c_pub(
        grammar_key, grid_size)
    n_side_18 = grid_size // BLOCK_18

    masks = _derive_masks(gk_ctr, n_tot_pos + 256, LABELS['mask_seed']['info_18'])

    vals = []; ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br18, bc18 = blk // n_side_18, blk % n_side_18
        form = ref18[g['form_id']]
        for r, c in form[g['dir']]:
            gr, gc = br18*BLOCK_18+r, bc18*BLOCK_18+c
            if 0 <= gr < grid_size and 0 <= gc < grid_size:
                vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
            ni += 1
    return _decrypt(vals, xchacha_key, len(vals))


def carter18_fits(message: str, master_key: bytes,
                  grid_size: int = GRID_SIZE) -> bool:
    """Vérifie si le message tient dans la grille Carter-18 avec la config
    dérivée (après redraw C_PUB, tâche 4)."""
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carter18']:
        return False
    _, grammar_key = _carter_split(master_key)
    _, _, _, _, cap = _find_carter18_grammar_with_c_pub(grammar_key, grid_size)
    return msg_bytes_len <= max_message_for(cap)


def carter18_capacity(master_key: bytes, grid_size: int = GRID_SIZE) -> Dict:
    """Retourne les infos de capacité Carter-18 pour cette clé (après
    redraw C_PUB, tâche 4)."""
    _, grammar_key = _carter_split(master_key)
    gk_ctr, seed, ref18, grammar, cap = _find_carter18_grammar_with_c_pub(
        grammar_key, grid_size)
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


# ══════════════════════════════════════════════════════════════════════════════
# CARTER-HYBRID : mélange 18×18 concentrique + 6×6 selon la clé
# ── Architecture ──────────────────────────────────────────────────────────────
# Sur une grille grid_size×grid_size, (grid_size//18)² méta-blocs 18×18.
# La grammaire dérivée de la clé assigne chaque méta-bloc message à l'un
# de deux modes de lecture :
#   • MODE_18 : lecture concentrique sur l'ensemble 18×18 (jusqu'à 324 positions)
#   • MODE_6  : lecture en 9 sous-blocs 6×6 indépendants (54 positions)
# Les méta-blocs MODE_18 absorbent l'essentiel du message (haute capacité).
# Les méta-blocs MODE_6 complètent avec un grain plus fin.
# Déterministe : encodeur et décodeur dérivent le même plan depuis la clé —
# le mode par bloc dépend de la clé, pas de la longueur du message.
#
# Même remarque de portage que Carter-18 ci-dessus : reconstruit sur
# payload_to_symbols()/max_message_for() plutôt que sur l'arithmétique à
# 2 symboles/octet + 76 octets de la livraison d'origine.
# ══════════════════════════════════════════════════════════════════════════════

MODE_18 = 0  # lecture concentrique 18×18
MODE_6  = 1  # lecture en 9 sous-blocs 6×6


def _grammar_hybrid(grammar_key: bytes,
                    grid_size: int = GRID_SIZE) -> List[Dict]:
    """
    Dérive la grammaire hybride : rôle + mode de lecture pour chaque
    méta-bloc 18×18. Le mode (MODE_18 / MODE_6) est dérivé de la clé.
    Labels centralisés dans crypto_core.LABELS['carterhybrid'] (tâche 3).
    """
    n_side_18 = grid_size // BLOCK_18
    n_blocks  = n_side_18 * n_side_18
    LH = LABELS['carterhybrid']
    km = _HKDF(_hh.SHA256(), n_blocks * 4,
                salt=LH['grammar_salt'],
                info=LH['grammar_info']).derive(grammar_key)
    return [{
        'role':    _PURE if km[i*4] < 85 else (
                   _STRUCTURED if km[i*4] < 170 else _MESSAGE),
        'mode':    MODE_18 if km[i*4+1] < 128 else MODE_6,
        'form_id': (km[i*4+2] * N_FORMS_18) // 256,  # pour MODE_18
        'dir':     km[i*4+3] % N_DIR_18,              # pour MODE_18
    } for i in range(n_blocks)]


def _subblock_positions(br18: int, bc18: int,
                        grammar_key: bytes,
                        ref6: List[Dict],
                        sweep_of_color: Dict) -> List[List[Tuple[int,int]]]:
    """
    Pour un méta-bloc 18×18 en MODE_6 : dérive les positions stégano de
    lecture pour chacun des 9 sous-blocs 6×6 internes, via le référent v3
    (rouge+bleu ensemble, 12/sous-bloc -- règle v3, câblage étape 6,
    remplace le tirage de direction sur l'ancien référent bariolé).
    Retourne une liste de 9 listes de (row_abs, col_abs). L'info HKDF
    (position du méta-bloc) est nécessairement dynamique par appel ; le
    salt est centralisé dans crypto_core.LABELS['carterhybrid'] (tâche 3).
    `sweep_of_color` : dérivé UNE FOIS par appel encode/decode (pas par
    sous-bloc), voir encode_carter_hybrid/decode_carter_hybrid.
    """
    km_sub = _HKDF(_hh.SHA256(), 9,
                   salt=LABELS['carterhybrid']['subblock_salt'],
                   info=bytes([br18, bc18])).derive(grammar_key)
    positions = []
    for sub in range(9):
        sr, sc = sub // 3, sub % 3
        form = ref6[km_sub[sub]]
        sub_pos = [(br18*BLOCK_18 + sr*CELL_SIZE + r,
                    bc18*BLOCK_18 + sc*CELL_SIZE + c)
                   for r, c in _form_stegano_positions(form, sweep_of_color)]
        positions.append(sub_pos)
    return positions


def _carter_hybrid_seeds(grammar_key: bytes) -> Tuple[int, int]:
    """(seed_18, ref_idx_6) pour cette clé (dérivation partagée encode/
    decode). seed_18 : Carter-18, hors périmètre du câblage étape 6, reste
    choisi parmi SEEDS (10 valeurs). ref_idx_6 : référent 6×6 v3, choisi
    par select_referent_index (un octet, sans réduction modulo -- étape 6,
    remplace le tirage parmi SEEDS pour ce côté). Labels centralisés dans
    crypto_core.LABELS['carterhybrid'] (tâche 3)."""
    LH = LABELS['carterhybrid']
    idx18 = int.from_bytes(
        _HKDF(_hh.SHA256(), 4, salt=LH['seed18_salt'],
              info=LH['seed18_info']).derive(grammar_key), 'big') % len(SEEDS)
    seed6_key = _HKDF(_hh.SHA256(), 32, salt=LH['seed6_salt'],
                       info=LH['seed6_info']).derive(grammar_key)
    ref_idx6 = _R6.select_referent_index(seed6_key)
    return SEEDS[idx18], ref_idx6


def _hybrid_capacity_positions(grammar: List[Dict]) -> int:
    """Positions totales disponibles pour les blocs message de cette
    grammaire. 9*12 pour MODE_6 (règle v3, rouge+bleu ensemble par
    sous-bloc -- remplace 9*6 d'une seule direction avant ce commit)."""
    return sum(
        _POSITIONS_PER_DIR[g['dir']] if g['mode'] == MODE_18 else 9*12
        for g in grammar if g['role'] == _MESSAGE)


def _find_hybrid_grammar_with_c_pub(grammar_key: bytes, grid_size: int):
    """
    Recherche déterministe (tâche 4, format v3) pour Carter-Hybrid : essaie
    grammar_key_ctr pour ctr=0..MAX_REDRAWS-1 (voir
    crypto_core._redraw_grammar_key). seed18 (Carter-18), ref_idx6
    (référent v3 6×6) ET la grammaire sont re-dérivés ENSEMBLE depuis le
    même grammar_key_ctr à chaque tentative. Retourne (grammar_key_ctr,
    seed18, ref_idx6, ref18, ref6, grammar, cap) du premier succès. Lève
    ValueError après MAX_REDRAWS échecs.
    """
    for ctr in range(MAX_REDRAWS):
        gk_ctr = _redraw_grammar_key(grammar_key, 'carterhybrid', ctr)
        seed18, ref_idx6 = _carter_hybrid_seeds(gk_ctr)
        ref18 = get_referent_18(seed18)
        ref6  = get_referent(ref_idx6)
        grammar = _grammar_hybrid(gk_ctr, grid_size)
        cap = _hybrid_capacity_positions(grammar)
        if max_message_for(cap) >= C_PUB['carterhybrid']:
            return gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, cap
    raise ValueError(
        f"Échec de dérivation de grammaire après {MAX_REDRAWS} tentatives : "
        f"régénérer la clé maître (capacité cible C_PUB={C_PUB['carterhybrid']} "
        f"caractères non atteinte).")

def encode_carter_hybrid(message: str,
                         master_key: bytes,
                         grid_size: int = GRID_SIZE,
                         _nonce: bytes = None, _y: int = None,
                         _leftover: List[int] = None, _noise_seed: bytes = None) -> Tuple[List[List[int]], Dict]:
    """
    Carter-Hybrid : mélange 18×18 concentrique + 6×6 sous-blocs.

    Les méta-blocs message en MODE_18 offrent une haute capacité (jusqu'à
    324 positions) ; ceux en MODE_6 complètent en grain plus fin (54
    positions, 9 sous-blocs 6×6). Le mode par bloc est dérivé de la clé,
    pas du message : pas d'adaptation à la longueur qui distinguerait un
    message court d'un message long depuis la seule géométrie.

    _nonce/_y/_leftover/_noise_seed (tâche 7) : voir encode_carter_random().
    """
    # C18-2 (audit G. Kerma, rév. 5) : grid_size doit être multiple de BLOCK_18,
    # sinon n_side_18 = grid_size // BLOCK_18 tronque silencieusement et les
    # méta-blocs ne pavent plus la grille correctement.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    xchacha_key, grammar_key = _carter_split(master_key)
    # C_PUB (tâche 4) : seuil public, indépendant de la clé — voir
    # carter.encode_carter() pour la justification complète. En OCTETS UTF-8.
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carterhybrid']:
        raise ValueError(
            f"Message trop long : {msg_bytes_len} > C_PUB={C_PUB['carterhybrid']} "
            f"octets (capacité publique garantie, indépendante de la clé).")
    n_side_18 = grid_size // BLOCK_18
    # Recherche C_PUB (tâche 4) : redraw déterministe jusqu'à satisfaction —
    # seed18/ref_idx6 et grammaire redérivés ensemble à chaque tentative.
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, cap = _find_hybrid_grammar_with_c_pub(
        grammar_key, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}

    # Charge utile à longueur fixe (format v3, tâche 2) : toutes les
    # positions message portent un symbole de charge utile, aucun en-tête.
    payload = _encrypt(message, xchacha_key, cap, _nonce=_nonce)
    nibbles = payload_to_symbols(payload, cap, _y=_y, _leftover=_leftover)

    masks = _derive_masks(gk_ctr, len(nibbles) + 512, LABELS['mask_seed']['info_hybrid'])
    # Remplissage bulk CSPRNG — voir encode_carter_random().
    grid  = random_grid(grid_size, grid_size, _noise_seed=_noise_seed)

    ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE or ni >= len(nibbles): continue
        br18, bc18 = blk // n_side_18, blk % n_side_18

        if g['mode'] == MODE_18:
            form = ref18[g['form_id']]
            for r, c in form[g['dir']]:
                if ni >= len(nibbles): break
                gr, gc = br18*BLOCK_18+r, bc18*BLOCK_18+c
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
                ni += 1
        else:  # MODE_6
            for sub_pos in _subblock_positions(br18, bc18, gk_ctr, ref6, sweep_of_color):
                for gr, gc in sub_pos:
                    if ni >= len(nibbles): break
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        grid[gr][gc] = (nibbles[ni] + masks[ni]) % ALPHA_LEN
                    ni += 1
                if ni >= len(nibbles): break

    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_18  = sum(1 for g in grammar if g['role']==_MESSAGE and g['mode']==MODE_18)
    return grid, {
        'mode': 'carter-hybrid', 'seed_18': seed18, 'referent_index_6': ref_idx6,
        'n_msg_blocks': n_msg, 'n_mode_18': n_18, 'n_mode_6': n_msg - n_18,
        'capacity_chars': max_message_for(cap),
    }


def decode_carter_hybrid(grid: List[List[int]],
                         master_key: bytes,
                         grid_size: int = GRID_SIZE) -> str:
    """Décode une grille encodée par encode_carter_hybrid. ValueError si clé
    incorrecte (même recherche C_PUB déterministe que l'encodeur — tâche 4)."""
    # C18-2 (audit G. Kerma, rév. 5) : voir encode_carter_hybrid.
    if grid_size % BLOCK_18 != 0:
        raise ValueError(f"grid_size={grid_size} n'est pas multiple de BLOCK_18={BLOCK_18}")
    xchacha_key, grammar_key = _carter_split(master_key)
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, n_tot = _find_hybrid_grammar_with_c_pub(
        grammar_key, grid_size)
    sweep_of_color = {c: derive_sweep_index(gk_ctr, c) for c in _RANDOM_STEGANO_COLORS}
    n_side_18 = grid_size // BLOCK_18

    masks = _derive_masks(gk_ctr, n_tot + 512, LABELS['mask_seed']['info_hybrid'])

    vals = []; ni = 0
    for blk, g in enumerate(grammar):
        if g['role'] != _MESSAGE: continue
        br18, bc18 = blk // n_side_18, blk % n_side_18

        if g['mode'] == MODE_18:
            form = ref18[g['form_id']]
            for r, c in form[g['dir']]:
                gr, gc = br18*BLOCK_18+r, bc18*BLOCK_18+c
                if 0 <= gr < grid_size and 0 <= gc < grid_size:
                    vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
                ni += 1
        else:
            for sub_pos in _subblock_positions(br18, bc18, gk_ctr, ref6, sweep_of_color):
                for gr, gc in sub_pos:
                    if 0 <= gr < grid_size and 0 <= gc < grid_size:
                        vals.append((grid[gr][gc] - masks[ni]) % ALPHA_LEN)
                    ni += 1

    return _decrypt(vals, xchacha_key, len(vals))


def carter_hybrid_fits(message: str, master_key: bytes,
                       grid_size: int = GRID_SIZE) -> bool:
    """Vérifie si le message tient dans la grille Carter-Hybrid avec la
    config dérivée (après redraw C_PUB, tâche 4)."""
    msg_bytes_len = len(message.encode('utf-8'))
    if msg_bytes_len > C_PUB['carterhybrid']:
        return False
    _, grammar_key = _carter_split(master_key)
    _, _, _, _, _, _, cap = _find_hybrid_grammar_with_c_pub(grammar_key, grid_size)
    return msg_bytes_len <= max_message_for(cap)


def carter_hybrid_capacity(master_key: bytes, grid_size: int = GRID_SIZE) -> Dict:
    """Retourne les infos de capacité Carter-Hybrid pour cette clé (après
    redraw C_PUB, tâche 4)."""
    _, grammar_key = _carter_split(master_key)
    gk_ctr, seed18, ref_idx6, ref18, ref6, grammar, cap = _find_hybrid_grammar_with_c_pub(
        grammar_key, grid_size)
    n_msg = sum(1 for g in grammar if g['role'] == _MESSAGE)
    n_18  = sum(1 for g in grammar if g['role']==_MESSAGE and g['mode']==MODE_18)
    return {
        'n_msg_blocks': n_msg, 'n_mode_18': n_18, 'n_mode_6': n_msg - n_18,
        'capacity_chars': max_message_for(cap),
        'mode': 'carter-hybrid',
    }
