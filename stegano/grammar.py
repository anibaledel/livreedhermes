# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
grammar.py — Rôles des blocs, formes, balayages, redraw (dérivé de gk)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Réorganisation de stegano/ (2026-09, branche deux-cles) : extrait de
carter.py et carter_random.py tout ce qui dérive la GÉOMÉTRIE d'une
grille depuis une clé — rôles de bloc, formes, positions de lecture,
recherche de redraw C_PUB — jusqu'ici dupliqué à l'identique dans les
deux fichiers. carter.py et carter_random.py deviennent des façades de
compatibilité : ils importent ces fonctions d'ici plutôt que de les
redéfinir, et conservent l'API publique (encode_*/decode_*/*_capacity)
inchangée pour tous les appelants existants.

Pure extraction, AUCUN changement de comportement : chaque fonction
ci-dessous est le copier-coller exact de sa version dans carter.py/
carter_random.py (seuls les imports ont changé). Vérifié par la suite
complète (149 tests) restant verte à l'identique après la réorganisation.

Nomenclature « gk » : au moment de cette extraction, les fonctions
ci-dessous reçoivent encore grammar_key issue de KeySplit(master_key)
(format v3) — le câblage vers gk_nu (format v4, deux clés + nonce de
disposition, voir keys.py) est une étape ultérieure, distincte de cette
réorganisation purement structurelle.
"""

import random
from typing import List, Dict, Tuple, Optional

from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hh

from crypto_core import LABELS, C_PUB, MAX_REDRAWS, _redraw_grammar_key, max_message_for
from sweep import derive_sweep_index, crypto_reading_order
from keys import NU_SYMBOLS
import referent6x6_gen as _R6

def _is_nu_cell(r: int, c: int) -> bool:
    """
    Format v4 (deux clés + nonce de disposition, keys.py) : le nonce nu
    occupe les NU_SYMBOLS=36 premières cases de la ligne 0 (colonnes
    0..35), quel que soit le bloc qui les contient et quel que soit son
    rôle -- ces positions sont retirées des positions LISIBLES de ce
    bloc. Utilisé par chaque fonction *_positions ci-dessous pour filtrer
    la géométrie, jamais en la réimplémentant.
    """
    return r == 0 and c < NU_SYMBOLS

# ── Rôles de bloc (partagés par les six variantes) ─────────────────────────────
_PURE, _STRUCTURED, _MESSAGE = 0, 1, 2

# ── Redraw générique (Carter-256/360/Mix) ──────────────────────────────────────

def _find_grammar_with_c_pub(grammar_key: bytes, variant: str,
                              grammar_fn, message_positions_fn):
    """
    Recherche déterministe (tâche 4, format v3) : essaie grammar_key_ctr pour
    ctr=0..MAX_REDRAWS-1 (voir crypto_core._redraw_grammar_key pour l'ordre
    exact de la dérivation complète) jusqu'à trouver une grammaire dont la
    capacité (max_message_for) est >= C_PUB[variant]. Retourne (grammar_key_ctr,
    grammar, n_pos) du premier succès — grammar_key_ctr est aussi la clé de
    dérivation des masques de position (voir encode_carter() dans carter.py) :
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

# ── Carter-256 : Référent 256, grille 90×90, blocs 6×6 ─────────────────────────
CARTER_GRID  = 90
CARTER_BLOCK = 6
CARTER_SIDE  = CARTER_GRID // CARTER_BLOCK    # 15 blocs par côté
CARTER_N     = CARTER_SIDE ** 2               # 225 blocs

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
    L = LABELS['carter256']
    km = _HKDF(_hh.SHA256(), CARTER_N * 2,
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
            if 0 <= r0+r < CARTER_GRID and 0 <= c0+c < CARTER_GRID
            and not _is_nu_cell(r0+r, c0+c)]

def _carter_message_positions(grammar: Dict, ref256: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    sweep_of_color = grammar['sweep_of_color']
    return sum(len(_carter_positions(i // CARTER_SIDE, i % CARTER_SIDE, g, ref256, sweep_of_color))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

# ── Carter-360 : Référent 360 Jacquard, grille 180×180, blocs 12×12 ────────────
CARTER360_GRID  = 180
CARTER360_BLOCK = 12
CARTER360_SIDE  = CARTER360_GRID // CARTER360_BLOCK   # 15
CARTER360_N     = CARTER360_SIDE ** 2                  # 225

_COLORS_360 = ['C1', 'C2', 'C3']

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
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
    L = LABELS['carter360']
    role_key = _HKDF(_hh.SHA256(), CARTER360_N,
                     salt=L['grammar_content_salt'],
                     info=L['grammar_content_info']).derive(master_key)
    calque_key = _HKDF(_hh.SHA256(), 32,
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
            if 0 <= r0+r < CARTER360_GRID and 0 <= c0+c < CARTER360_GRID
            and not _is_nu_cell(r0+r, c0+c)]

def _carter360_message_positions(grammar: Dict, ref360: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    by_niveau = grammar['by_niveau']
    sweep_of_color = grammar['sweep_of_color']
    return sum(len(_carter360_positions(i // CARTER360_SIDE, i % CARTER360_SIDE,
                                        g, ref360, by_niveau, sweep_of_color))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

# ── Carter-Mix : méta-blocs 12×12, Ref256 ou Ref360 selon la clé ───────────────
CARTER_MIX_GRID  = 180
CARTER_MIX_META  = 12           # méta-bloc 12×12
CARTER_MIX_SIDE  = 15           # méta-blocs par côté (180/12)
CARTER_MIX_N     = 225          # total méta-blocs
_REF256, _REF360 = 0, 1         # identifiants de référent

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
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
    L = LABELS['cartermix']
    km = _HKDF(_hh.SHA256(), CARTER_MIX_N * 3,
              salt=L['grammar_content_salt'],
              info=L['grammar_content_info']).derive(master_key)
    calque_key = _HKDF(_hh.SHA256(), 32,
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
                    if 0 <= gr < N and 0 <= gc < N and not _is_nu_cell(gr, gc):
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
                if 0 <= r0+r < N and 0 <= c0+c < N
                and not _is_nu_cell(r0+r, c0+c)]

def _mix_message_positions(grammar: Dict, ref256: Dict, ref360: Dict) -> int:
    """Nombre de positions rendues par les blocs message de cette grammaire."""
    by_niveau = grammar['by_niveau']
    sweep_256, sweep_360 = grammar['sweep_256'], grammar['sweep_360']
    return sum(len(_mix_positions(i // CARTER_MIX_SIDE, i % CARTER_MIX_SIDE,
                                  g, ref256, ref360, by_niveau, sweep_256, sweep_360))
               for i, g in enumerate(grammar['blocks']) if g['role'] == _MESSAGE)

# ── Carter-Random : référents 6×6 dérivés de la clé (individuel/méta) ──────────
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

# ── Carter-18 : blocs 18×18 concentriques aléatoires ───────────────────────────
# Spécification (planche 036, La Livrée d'Hermès) : grille 18×18 = 9 couches
# concentriques, couche k = 8k+4 cellules. 4 directions de lecture : couches
# 0→8, 8→0, paires, impaires. Positions internes mélangées par graine.

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

# ── Carter-Hybrid : mélange 18×18 concentrique + 6×6 selon la clé ──────────────
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
