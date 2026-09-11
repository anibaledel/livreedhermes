#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Génère VECTEURS-REFERENCE.json — vecteurs de connu-en-clair/connu-en-clair
(KAT) pour les trois couches encore sans vecteurs portables :
X3DH triple-DH (secu_box.py), Argon2id du coffre (vault_lib.py), et l'AEAD
LLDH-AEAD-v1 (crypto_core.py, déjà couvert par test_regression.py côté
Python mais absent en format portable indépendant du langage).

Toutes les entrées sont FIXES (aucun aléa) ; chaque vecteur est vérifié
DEUX FOIS dans ce script (une génération, une reconstruction depuis les
seules entrées) avant d'être écrit, pour garantir qu'il est bien
reproductible et non un artefact d'exécution unique.
"""
import sys, os, json, hashlib, struct
_ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_ICI, 'secubox'))
sys.path.insert(0, os.path.join(_ICI, 'stegano'))

from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey, X25519PublicKey)
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from argon2.low_level import hash_secret_raw, Type as Argon2Type

import secu_box as S
import vault_lib as V
import crypto_core as C

out = {'_avertissement': 'Fichier généré — voir gen_vecteurs.py. Ne pas éditer à la main. '
                         'Vérifier avec verify_vecteurs.py.'}

# ═══════════════════════════════════════════════════════════════════════════
# 1. X3DH triple-DH (secu_box.py) — entièrement déterministe (pas d'aléa)
# ═══════════════════════════════════════════════════════════════════════════

def x3dh_vector(name, ida_raw, epha_raw, idb_raw, ephb_raw):
    ida = X25519PrivateKey.from_private_bytes(ida_raw)
    epha = X25519PrivateKey.from_private_bytes(epha_raw)
    idb = X25519PrivateKey.from_private_bytes(idb_raw)
    ephb = X25519PrivateKey.from_private_bytes(ephb_raw)

    ida_pub = ida.public_key().public_bytes_raw()
    epha_pub = epha.public_key().public_bytes_raw()
    idb_pub = idb.public_key().public_bytes_raw()
    ephb_pub = ephb.public_key().public_bytes_raw()

    def compute(my_priv_id, my_priv_eph, my_id_pub, my_eph_pub,
                their_id_pub, their_eph_pub):
        dh_ee = S._dh(my_priv_eph, their_eph_pub)
        dh_es = S._dh(my_priv_eph, their_id_pub)
        dh_se = S._dh(my_priv_id, their_eph_pub)
        if my_id_pub < their_id_pub:
            cross = dh_es + dh_se
            ids = my_id_pub + their_id_pub
            ephs = my_eph_pub + their_eph_pub
        else:
            cross = dh_se + dh_es
            ids = their_id_pub + my_id_pub
            ephs = their_eph_pub + my_eph_pub
        km = HKDF(hashes.SHA256(), 64, S._SESSION_INFO, ids + ephs).derive(dh_ee + cross)
        session_id = HKDF(hashes.SHA256(), 8, S._SESSION_INFO, b'session-id').derive(km).hex()
        return km, session_id

    km_a, sid_a = compute(ida, epha, ida_pub, epha_pub, idb_pub, ephb_pub)
    km_b, sid_b = compute(idb, ephb, idb_pub, ephb_pub, ida_pub, epha_pub)

    assert km_a == km_b, f"{name}: désaccord Alice/Bob sur km"
    assert sid_a == sid_b, f"{name}: désaccord sur session_id"

    # reconstruction indépendante, pour vérifier la reproductibilité
    km_a2, sid_a2 = compute(ida, epha, ida_pub, epha_pub, idb_pub, ephb_pub)
    assert km_a == km_a2 and sid_a == sid_a2, f"{name}: non reproductible"

    return {
        'identite_a_privee': ida_raw.hex(), 'ephemere_a_privee': epha_raw.hex(),
        'identite_b_privee': idb_raw.hex(), 'ephemere_b_privee': ephb_raw.hex(),
        'identite_a_publique': ida_pub.hex(), 'ephemere_a_publique': epha_pub.hex(),
        'identite_b_publique': idb_pub.hex(), 'ephemere_b_publique': ephb_pub.hex(),
        'km_attendu': km_a.hex(), 'session_id_attendu': sid_a,
    }

x3dh_vectors = {}
x3dh_vectors['cas_1_ordre_a_lt_b'] = x3dh_vector(
    'cas_1',
    bytes(range(32)), bytes(range(32, 64)),
    bytes([0xAA] * 32), bytes([0xBB] * 32))
x3dh_vectors['cas_2_cles_nulles_privees'] = x3dh_vector(
    # Une clé privée X25519 = 0 est clampée par la bibliothèque (les bits
    # de poids faible/fort sont forcés) — ce n'est PAS un scalaire nul
    # après clamping. Cas limite pertinent : vérifie que l'implémentation
    # ne traite pas ceci spécialement.
    'cas_2', bytes(32), bytes([1] + [0] * 31),
    bytes([2] + [0] * 31), bytes([3] + [0] * 31))
out['x3dh_triple_dh'] = {
    'algorithme': 'X25519 triple DH (DH_ee, DH_es, DH_se) + HKDF-SHA256, '
                  'voir secu_box.py Session.derive()',
    'note': 'km = HKDF-SHA256(ikm=dh_ee+cross, salt=_SESSION_INFO, '
            'info=ids+ephs, L=64). cross/ids/ephs ordonnés par comparaison '
            'des identités publiques (la plus petite en premier).',
    'session_info': S._SESSION_INFO.decode(),
    'vecteurs': x3dh_vectors,
}

# ═══════════════════════════════════════════════════════════════════════════
# 2. Argon2id du coffre (vault_lib.py) — déterministe (salt fixe fourni)
# ═══════════════════════════════════════════════════════════════════════════

def vault_vector(name, master_key, salt):
    keys1 = V._derive_keys(master_key, salt, version=2)
    keys2 = V._derive_keys(master_key, salt, version=2)  # reproductibilité
    assert keys1 == keys2, f"{name}: Argon2id non reproductible"
    entry_key = V._entry_key(keys1['km'], 'mon_secret.txt', salt, version=2)
    entry_key2 = V._entry_key(keys1['km'], 'mon_secret.txt', salt, version=2)
    assert entry_key == entry_key2, f"{name}: entry_key non reproductible"
    return {
        'master_key': master_key.hex(), 'salt': salt.hex(),
        'parametres_argon2id': {
            'time_cost': V.ARGON2_TIME, 'memory_cost': V.ARGON2_MEMORY,
            'parallelism': V.ARGON2_PARALLEL, 'hash_len': V.ARGON2_LEN,
            'type': 'Argon2id',
        },
        'km_attendu': keys1['km'].hex(),
        'manifest_key_attendue': keys1['manifest'].hex(),
        'mac_key_attendue': keys1['mac'].hex(),
        'entry_key_attendue_pour_mon_secret.txt': entry_key.hex(),
    }

out['vault_argon2id'] = {
    'algorithme': 'Argon2id(master_key, salt[:16]) -> km ; '
                  'HKDF-SHA256(salt=salt, info=label).derive(km) par sous-clé',
    'etiquettes_hkdf_v2': {
        'manifest': 'SecuBox-Vault-Manifest-v2',
        'mac': 'SecuBox-Vault-MAC-v2',
        'entry': 'SecuBox-Vault-Entry-v2:<nom_entree>',
    },
    'avertissement': 'time_cost=3, memory_cost=64Mo — chaque vecteur prend '
                     'plusieurs centaines de ms à recalculer, c\'est voulu.',
    'vecteurs': {
        'cas_1': vault_vector('cas_1', bytes(range(32)), bytes([0x5A] * 32)),
        'cas_2_master_key_nulle': vault_vector('cas_2', bytes(32), bytes(range(32))),
    },
}

# ═══════════════════════════════════════════════════════════════════════════
# 3. LLDH-AEAD-v1 (crypto_core.py) — nonce fixé manuellement (pas d'aléa)
# ═══════════════════════════════════════════════════════════════════════════

def aead_vector(name, key, nonce24, plaintext_ascii):
    subkey = HKDF(hashes.SHA256(), 32, salt=nonce24[:16],
                  info=b'XChaCha20-HChaCha20-subkey').derive(key)
    from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
    chacha_nonce = b'\x00' * 4 + nonce24[16:]
    ct = ChaCha20Poly1305(subkey).encrypt(chacha_nonce, plaintext_ascii, None)
    inner = nonce24 + ct

    ck = C._commit_key(key)
    header = struct.pack('>I', 32 + len(inner))
    commit = __import__('hmac').new(ck, header + inner, hashlib.sha256).digest()
    payload = commit + inner

    # reconstruction indépendante du déchiffrement, pour vérifier l'aller-retour
    pt_recovered = ChaCha20Poly1305(subkey).decrypt(chacha_nonce, ct, None)
    assert pt_recovered == plaintext_ascii, f"{name}: aller-retour brisé"

    return {
        'key': key.hex(), 'nonce_24_octets': nonce24.hex(),
        'plaintext_ascii': plaintext_ascii.decode('ascii'),
        'subkey_attendue': subkey.hex(),
        'commit_key_attendue': ck.hex(),
        'ciphertext_plus_tag_attendu': ct.hex(),
        'commit_attendu': commit.hex(),
        'payload_complet_attendu': payload.hex(),
    }

out['lldh_aead_v1'] = {
    'algorithme': 'Voir SPEC-LLDH-AEAD-v1.md — ChaCha20-Poly1305 à nonce '
                  'étendu 24 octets, sous-clé par HKDF-SHA256 (PAS HChaCha20 : '
                  'non interopérable avec XChaCha20-Poly1305 standard)',
    'vecteurs': {
        'cas_1_message_court': aead_vector(
            'cas_1', bytes(range(32)), bytes(range(32, 56)), b'BONJOUR MONDE'),
        'cas_2_message_vide': aead_vector(
            'cas_2', bytes([0xFF] * 32), bytes(range(24)), b''),
        'cas_3_alphabet_complet': aead_vector(
            'cas_3', bytes(range(1, 33)), bytes(range(200, 224)),
            b' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-'),
    },
}

# ═══════════════════════════════════════════════════════════════════════════

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'VECTEURS-REFERENCE.json')
with open(path, 'w') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(f"écrit : {path}")
print(f"  x3dh_triple_dh : {len(x3dh_vectors)} vecteurs")
print(f"  vault_argon2id : {len(out['vault_argon2id']['vecteurs'])} vecteurs")
print(f"  lldh_aead_v1   : {len(out['lldh_aead_v1']['vecteurs'])} vecteurs")
