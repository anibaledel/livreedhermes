#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
calibrate_referent.py — Calibre c_pub pour un référent (format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Règle de la tâche 4 (inchangée) : c_pub est la plus grande valeur telle que
le taux de redraw (MAX_REDRAWS=10 tentatives) reste < 1 % sur 10 000 clés
tirées au hasard. La bibliothèque refuse un référent sans c_pub (voir
tools/validate_referent.py).

Ceci est un PROTOTYPE de calibration autonome (pas la grammaire de
production — carter.py n'est pas modifié tant que la conception n'est pas
validée) : simule la grammaire décrite dans la conception du référent 360
paramétrable — pour chaque bloc message, 6 niveaux, chacun tirant un
calque ∈ [0..59] par REJET SANS BIAIS (jamais de modulo), les positions
stégano (violettes) du calque tiré à ce niveau étant les positions
réellement lues (0, 8 ou 16 selon le calque — voir data/referent_360_v3.json).
Redraw déterministe : le compteur ctr entre à la racine de la dérivation
depuis grammar_key, un redraw retire l'ensemble des 6 tirages de calque
ensemble (jamais un niveau isolément) — même principe que le redraw
Carter existant (tâche 4).
"""
import hashlib
import json
import os
import secrets
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, 'stegano'))
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
import crypto_core as CC   # primitive pure et deja en production : max_message_for()

MAX_REDRAWS = 10
N_NIVEAUX = 6


def load_referent(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def _calques_by_niveau(doc):
    """{niveau: [calque, ...]} -- groupe les calques par niveau (1..6),
    dans un ordre STABLE (trié par famille/teinte) pour que le tirage par
    index soit reproductible."""
    by_niveau = {n: [] for n in range(1, N_NIVEAUX + 1)}
    for calque in sorted(doc['calques'], key=lambda c: (c['famille'], c['teinte'], c['niveau'])):
        by_niveau[calque['niveau']].append(calque)
    for n in by_niveau:
        assert len(by_niveau[n]) == 60, f"niveau {n} : {len(by_niveau[n])} calques, 60 attendus"
    return by_niveau


def _rejection_index_60(keystream_bytes_iter):
    """Tire un index dans [0..59] par rejet, SANS biais modulo : limit =
    256 - (256 % 60) = 240, un octet b<240 donne b%60, b>=240 est rejeté."""
    limit = 256 - (256 % 60)
    for b in keystream_bytes_iter:
        if b < limit:
            return b % 60
    raise RuntimeError("keystream épuisé sans octet accepté (ne devrait jamais arriver)")


def _grammar_key_ctr(grammar_key: bytes, ctr: int) -> bytes:
    return _HKDF(_hashes.SHA256(), 32, salt=b'referent360-redraw-v3',
                 info=b'redraw-root|ctr=' + ctr.to_bytes(4, 'big')).derive(grammar_key)


CARTER360_N_BLOCKS = 225   # 15x15 blocs 12x12 sur une grille 180x180 (meme grammaire que carter.py)


def _block_role(role_byte: int) -> str:
    """Meme repartition que _carter_grammar/_carter360_grammar existants :
    <85 pur, <170 structure, sinon message (~1/3 chacun)."""
    return 'pure' if role_byte < 85 else ('structured' if role_byte < 170 else 'message')


def _n_pos_for_key(grammar_key_ctr: bytes, by_niveau, stegano_color_keys):
    """Grammaire a 225 blocs (meme repartition de roles que Carter-360
    existant) : pour CHAQUE bloc message, 6 tirages independants (un par
    niveau), calque in [0..59] par rejet sans biais -- n_pos = somme sur
    TOUS les blocs message des positions stegano (violettes) des calques
    tires. Une seule cle de bloc a la fois, jamais un bloc isole."""
    role_key = _HKDF(_hashes.SHA256(), CARTER360_N_BLOCKS, salt=b'referent360-roles-v3',
                      info=b'block-roles').derive(grammar_key_ctr)
    calque_key = _HKDF(_hashes.SHA256(), 32, salt=b'referent360-calque-tirage-v3',
                        info=b'niveau-calque-index').derive(grammar_key_ctr)
    keystream = Cipher(algorithms.ChaCha20(calque_key, bytes(16)), mode=None).encryptor()
    # Sur-tirage large : jusqu'a 225*6 tirages, ~6.25% de rejet chacun (limite=240/256).
    buf = keystream.update(b'\x00' * (CARTER360_N_BLOCKS * N_NIVEAUX * 4))
    it = iter(buf)

    n_pos = 0
    for block in range(CARTER360_N_BLOCKS):
        if _block_role(role_key[block]) != 'message':
            continue
        for niveau in range(1, N_NIVEAUX + 1):
            idx = _rejection_index_60(it)
            calque = by_niveau[niveau][idx]
            for color_key in stegano_color_keys:
                n_pos += len(calque.get(color_key, []))
    return n_pos


def measure_redraw_rate(doc, c_pub_candidate, n_keys=10000):
    by_niveau = _calques_by_niveau(doc)
    stegano_color_keys = [f'{c}_positions' for c in doc['stegano_colors']]

    fails = 0
    redraws = 0
    caps = []
    for _ in range(n_keys):
        grammar_key = secrets.token_bytes(32)
        success = False
        for ctr in range(MAX_REDRAWS):
            gk_ctr = _grammar_key_ctr(grammar_key, ctr)
            n_pos = _n_pos_for_key(gk_ctr, by_niveau, stegano_color_keys)
            cap = CC.max_message_for(n_pos)
            if cap >= c_pub_candidate:
                if ctr > 0:
                    redraws += 1
                caps.append(cap)
                success = True
                break
        if not success:
            fails += 1
    return {
        'c_pub_candidate': c_pub_candidate, 'n_keys': n_keys,
        'redraw_rate_pct': round(100 * redraws / n_keys, 3),
        'fail_rate_pct': round(100 * fails / n_keys, 4),
        'mean_capacity': round(sum(caps) / len(caps), 1) if caps else None,
    }


CARTER6X6_N_BLOCKS = 225   # 15x15 blocs 6x6 sur une grille 90x90 (Carter-256/Carter-Random)


def _n_pos_for_key_6x6(grammar_key_ctr: bytes, forms, stegano_color_keys):
    """Grammaire a 225 blocs (meme repartition de roles) : pour CHAQUE bloc
    message, UN tirage de forme (in [0..255] par octet, AUCUN rejet
    necessaire car 256 divise 256 exactement) -- n_pos = somme sur tous les
    blocs message des positions stegano (12 par forme, constant par
    construction 6/6/12/12 -- voir generate_referent_6x6.py)."""
    role_key = _HKDF(_hashes.SHA256(), CARTER6X6_N_BLOCKS, salt=b'referent6x6-roles-v3',
                      info=b'block-roles').derive(grammar_key_ctr)
    form_key = _HKDF(_hashes.SHA256(), CARTER6X6_N_BLOCKS, salt=b'referent6x6-forme-tirage-v3',
                      info=b'block-form-index').derive(grammar_key_ctr)
    n_pos = 0
    for block in range(CARTER6X6_N_BLOCKS):
        if _block_role(role_key[block]) != 'message':
            continue
        form = forms[form_key[block]]   # 256 formes, 1 octet, aucun rejet
        for color_key in stegano_color_keys:
            n_pos += len(form.get(color_key, []))
    return n_pos


def measure_redraw_rate_6x6(doc, c_pub_candidate, n_keys=10000):
    forms = doc['forms']
    assert len(forms) == 256, f"256 formes attendues, {len(forms)} trouvees"
    stegano_color_keys = [f'{c}_positions' for c in doc['stegano_colors']]

    fails = 0
    redraws = 0
    caps = []
    for _ in range(n_keys):
        grammar_key = secrets.token_bytes(32)
        success = False
        for ctr in range(MAX_REDRAWS):
            gk_ctr = _grammar_key_ctr(grammar_key, ctr)
            n_pos = _n_pos_for_key_6x6(gk_ctr, forms, stegano_color_keys)
            cap = CC.max_message_for(n_pos)
            if cap >= c_pub_candidate:
                if ctr > 0:
                    redraws += 1
                caps.append(cap)
                success = True
                break
        if not success:
            fails += 1
    return {
        'c_pub_candidate': c_pub_candidate, 'n_keys': n_keys,
        'redraw_rate_pct': round(100 * redraws / n_keys, 3),
        'fail_rate_pct': round(100 * fails / n_keys, 4),
        'mean_capacity': round(sum(caps) / len(caps), 1) if caps else None,
    }


def calibrate_6x6(doc, n_keys=10000, target_redraw_pct=1.0):
    forms = doc['forms']
    stegano_color_keys = [f'{c}_positions' for c in doc['stegano_colors']]

    raw_caps = []
    for _ in range(2000):
        grammar_key = secrets.token_bytes(32)
        gk0 = _grammar_key_ctr(grammar_key, 0)
        n_pos = _n_pos_for_key_6x6(gk0, forms, stegano_color_keys)
        raw_caps.append(CC.max_message_for(n_pos))
    raw_caps.sort()
    p1 = raw_caps[len(raw_caps) // 100]
    print(f"  [calibrate-6x6] capacite brute (ctr=0, N=2000) : min={raw_caps[0]} p1={p1} "
          f"median={raw_caps[len(raw_caps)//2]} max={raw_caps[-1]}")

    lo, hi = 1, max(p1, 1)
    best = None
    while lo <= hi:
        mid = (lo + hi) // 2
        m = measure_redraw_rate_6x6(doc, mid, n_keys=n_keys)
        print(f"  [calibrate-6x6] c_pub={mid} -> redraw={m['redraw_rate_pct']}% "
              f"fail={m['fail_rate_pct']}%")
        if m['redraw_rate_pct'] < target_redraw_pct and m['fail_rate_pct'] == 0.0:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def calibrate(doc, n_keys=10000, target_redraw_pct=1.0):
    """Recherche par dichotomie/balayage la plus grande c_pub_candidate
    telle que le taux de redraw mesuré reste < target_redraw_pct %."""
    by_niveau = _calques_by_niveau(doc)
    stegano_color_keys = [f'{c}_positions' for c in doc['stegano_colors']]

    # Mesure la distribution de n_pos brute (ctr=0 seul, sans redraw) pour
    # borner la recherche -- meme methodologie que la tache 4.
    raw_caps = []
    for _ in range(2000):
        grammar_key = secrets.token_bytes(32)
        gk0 = _grammar_key_ctr(grammar_key, 0)
        n_pos = _n_pos_for_key(gk0, by_niveau, stegano_color_keys)
        raw_caps.append(CC.max_message_for(n_pos))
    raw_caps.sort()
    p1 = raw_caps[len(raw_caps) // 100]
    print(f"  [calibrate] capacite brute (ctr=0, N=2000) : min={raw_caps[0]} p1={p1} "
          f"median={raw_caps[len(raw_caps)//2]} max={raw_caps[-1]}")

    lo, hi = 1, p1
    best = None
    while lo <= hi:
        mid = (lo + hi) // 2
        m = measure_redraw_rate(doc, mid, n_keys=n_keys)
        print(f"  [calibrate] c_pub={mid} -> redraw={m['redraw_rate_pct']}% "
              f"fail={m['fail_rate_pct']}%")
        if m['redraw_rate_pct'] < target_redraw_pct and m['fail_rate_pct'] == 0.0:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO_ROOT, 'data', 'referent_360_v3.json')
    doc = load_referent(path)
    is_6x6 = (doc.get('grid_size') == 6)
    print(f"Calibration de {path} (referent_id={doc['referent_id']}, grid_size={doc.get('grid_size')})")

    if is_6x6:
        c_pub = calibrate_6x6(doc)
        final_check = measure_redraw_rate_6x6(doc, c_pub, n_keys=10000)
    else:
        c_pub = calibrate(doc)
        final_check = measure_redraw_rate(doc, c_pub, n_keys=10000)

    print(f"c_pub retenu : {c_pub}")
    print(f"Verification finale (N=10000) : {final_check}")

    doc['c_pub'] = c_pub
    doc['c_pub_calibration'] = {
        'rule': 'plus grand c_pub tel que redraw < 1% sur 10000 cles (tache 4)',
        'measured_redraw_rate_pct': final_check['redraw_rate_pct'],
        'measured_fail_rate_pct': final_check['fail_rate_pct'],
        'n_keys': 10000,
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2)
    print(f"c_pub={c_pub} ecrit dans {path} (referent_id inchange : {doc['referent_id']})")
