#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Vérificateur INDÉPENDANT de VECTEURS-REFERENCE.json.

Volontairement, ce script n'importe AUCUN module du dépôt (ni secu_box.py,
ni vault_lib.py, ni crypto_core.py) : il ne recalcule qu'à partir des
primitives cryptographiques de bas niveau (X25519, HKDF-SHA256, Argon2id,
ChaCha20-Poly1305, HMAC-SHA256) et des descriptions de SPEC-LLDH-AEAD-v1.md
et des commentaires de secu_box.py/vault_lib.py.

Réussir ce script prouve deux choses distinctes :
  1. que les vecteurs sont reproductibles (pas un artefact d'une seule
     exécution du générateur) ;
  2. que la spécification écrite suffit à réimplémenter la construction
     sans lire le code source — c'est le critère normatif de LH-5.

Usage : python3 verify_vecteurs.py [chemin/vers/VECTEURS-REFERENCE.json]
"""
import sys, json, hashlib, hmac, struct

from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from argon2.low_level import hash_secret_raw, Type as Argon2Type


def hkdf_sha256(ikm: bytes, salt: bytes, info: bytes, length: int) -> bytes:
    return HKDF(hashes.SHA256(), length, salt, info).derive(ikm)


def x25519_dh(priv_raw: bytes, peer_pub_raw: bytes) -> bytes:
    priv = X25519PrivateKey.from_private_bytes(priv_raw)
    from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PublicKey
    return priv.exchange(X25519PublicKey.from_public_bytes(peer_pub_raw))


def verifier_x3dh(bloc) -> int:
    print(f"\n== X3DH triple-DH ({bloc['session_info']!r}) ==")
    echecs = 0
    for nom, v in bloc['vecteurs'].items():
        ida_raw, epha_raw = bytes.fromhex(v['identite_a_privee']), bytes.fromhex(v['ephemere_a_privee'])
        idb_raw, ephb_raw = bytes.fromhex(v['identite_b_privee']), bytes.fromhex(v['ephemere_b_privee'])

        ida_pub = X25519PrivateKey.from_private_bytes(ida_raw).public_key().public_bytes_raw()
        epha_pub = X25519PrivateKey.from_private_bytes(epha_raw).public_key().public_bytes_raw()
        idb_pub = X25519PrivateKey.from_private_bytes(idb_raw).public_key().public_bytes_raw()
        ephb_pub = X25519PrivateKey.from_private_bytes(ephb_raw).public_key().public_bytes_raw()

        assert ida_pub.hex() == v['identite_a_publique']
        assert epha_pub.hex() == v['ephemere_a_publique']
        assert idb_pub.hex() == v['identite_b_publique']
        assert ephb_pub.hex() == v['ephemere_b_publique']

        dh_ee = x25519_dh(epha_raw, ephb_pub)
        dh_es = x25519_dh(epha_raw, idb_pub)
        dh_se = x25519_dh(ida_raw, ephb_pub)

        session_info = bloc['session_info'].encode()
        if ida_pub < idb_pub:
            cross, ids, ephs = dh_es + dh_se, ida_pub + idb_pub, epha_pub + ephb_pub
        else:
            cross, ids, ephs = dh_se + dh_es, idb_pub + ida_pub, ephb_pub + epha_pub

        km = hkdf_sha256(dh_ee + cross, session_info, ids + ephs, 64)
        session_id = hkdf_sha256(km, session_info, b'session-id', 8).hex()

        ok = (km.hex() == v['km_attendu'] and session_id == v['session_id_attendu'])
        print(f"  {nom} : {'OK' if ok else 'ÉCHEC'}")
        echecs += not ok
    return echecs


def verifier_vault(bloc) -> int:
    print(f"\n== Argon2id du coffre ==")
    p = bloc['vecteurs']['cas_1']['parametres_argon2id']
    echecs = 0
    for nom, v in bloc['vecteurs'].items():
        master_key = bytes.fromhex(v['master_key'])
        salt = bytes.fromhex(v['salt'])
        km = hash_secret_raw(
            secret=master_key, salt=salt[:16],
            time_cost=p['time_cost'], memory_cost=p['memory_cost'],
            parallelism=p['parallelism'], hash_len=p['hash_len'],
            type=Argon2Type.ID)
        manifest = hkdf_sha256(km, salt, b'SecuBox-Vault-Manifest-v2', 32)
        mac = hkdf_sha256(km, salt, b'SecuBox-Vault-MAC-v2', 32)
        entry = hkdf_sha256(km, salt, b'SecuBox-Vault-Entry-v2:mon_secret.txt', 32)

        ok = (km.hex() == v['km_attendu']
              and manifest.hex() == v['manifest_key_attendue']
              and mac.hex() == v['mac_key_attendue']
              and entry.hex() == v['entry_key_attendue_pour_mon_secret.txt'])
        print(f"  {nom} : {'OK' if ok else 'ÉCHEC'}")
        echecs += not ok
    return echecs


def verifier_aead(bloc) -> int:
    print(f"\n== LLDH-AEAD-v1 ==")
    echecs = 0
    for nom, v in bloc['vecteurs'].items():
        key = bytes.fromhex(v['key'])
        nonce24 = bytes.fromhex(v['nonce_24_octets'])
        pt = v['plaintext_ascii'].encode('ascii')

        subkey = hkdf_sha256(key, nonce24[:16], b'XChaCha20-HChaCha20-subkey', 32)
        chacha_nonce = b'\x00' * 4 + nonce24[16:]
        ct = ChaCha20Poly1305(subkey).encrypt(chacha_nonce, pt, None)
        inner = nonce24 + ct

        ck = hkdf_sha256(key, b'commit-v1', b'key-commitment', 32)
        header = struct.pack('>I', 32 + len(inner))
        commit = hmac.new(ck, header + inner, hashlib.sha256).digest()
        payload = commit + inner

        ok = (subkey.hex() == v['subkey_attendue']
              and ck.hex() == v['commit_key_attendue']
              and ct.hex() == v['ciphertext_plus_tag_attendu']
              and commit.hex() == v['commit_attendu']
              and payload.hex() == v['payload_complet_attendu'])
        print(f"  {nom} : {'OK' if ok else 'ÉCHEC'}")
        echecs += not ok
    return echecs


def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else 'VECTEURS-REFERENCE.json'
    with open(chemin) as f:
        data = json.load(f)

    total_echecs = 0
    total_echecs += verifier_x3dh(data['x3dh_triple_dh'])
    total_echecs += verifier_vault(data['vault_argon2id'])
    total_echecs += verifier_aead(data['lldh_aead_v1'])

    print()
    if total_echecs == 0:
        print("Tous les vecteurs vérifiés — reproductibles depuis les seules "
              "primitives de bas niveau, sans dépendre du code du dépôt.")
        return 0
    print(f"ÉCHEC — {total_echecs} vecteur(s) non reproduit(s).")
    return 1


if __name__ == '__main__':
    sys.exit(main())
