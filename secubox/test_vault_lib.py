# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
test_vault_lib.py — Tests du coffre SecuBox (vault_lib.py)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Câblage cascade v1 (2026-09-21, voir docs/CASCADE_V1.md) : premier fichier
de tests pour vault_lib.py — il n'en existait aucun avant ce chantier.
Couvre les trois exigences posées avant d'y toucher :
  1. un coffre écrit avec l'ancien format (ALG_CHACHA20_HKDF) reste lisible
     tel quel, sans conversion préalable ;
  2. l'octet algo lève l'ambiguïté à la lecture (lu, pas seulement écrit) ;
  3. la migration vers la cascade ne réécrit jamais un coffre sans
     sauvegarde — l'original est conservé jusqu'à relecture vérifiée du
     nouveau, et un crash à mi-migration laisse l'original intact.
"""

import os, secrets, tempfile, unittest
from unittest.mock import patch

import vault_lib
from vault_lib import (
    Vault, ALG_CHACHA20_HKDF, ALG_CASCADE_V1,
    MAGIC, VERSION, SALT_SIZE, MAC_SIZE, HEADER_SIZE,
    _derive_keys, _entry_key, _enc, _V1_LABELS,
)
import struct, json, hashlib, hmac as _hmac


def _tmp_path():
    fd, path = tempfile.mkstemp(suffix='.sbvault')
    os.close(fd)
    os.unlink(path)   # le fichier doit ne pas exister avant Vault.create()/save()
    return path


def _read(path: str) -> bytes:
    with open(path, 'rb') as f:
        return f.read()


def _build_raw_v1_vault(master_key: bytes, entries: dict) -> bytes:
    """Construit à la main un vault au format v1 (dérivation HKDF directe
    sur master_key, sans Argon2id) — reproduit ce que l'ancien save() aurait
    écrit avant l'introduction d'Argon2id (v1.2), pour vérifier que open()
    sait encore le lire. Aucune API publique ne produit plus ce format ;
    voir _key_material()/_labels() dans vault_lib.py."""
    salt = os.urandom(SALT_SIZE)
    keys = _derive_keys(master_key, salt, version=1)
    manifest = {n: {'sha256': hashlib.sha256(d).hexdigest(), 'size': len(d)}
                for n, d in entries.items()}
    manifest_enc = _enc(json.dumps(manifest).encode(), keys['manifest'], b'manifest')
    entries_blob = bytearray()
    for name, data in entries.items():
        ekey = _entry_key(keys['km'], name, salt, version=1)
        entry_enc = _enc(data, ekey, name.encode())
        entries_blob += struct.pack('>I', len(entry_enc)) + entry_enc
    header = MAGIC + bytes([1, ALG_CHACHA20_HKDF, 0, 0]) + salt
    payload = header + struct.pack('>I', len(manifest_enc)) + manifest_enc + bytes(entries_blob)
    mac = _hmac.new(keys['mac'], payload, hashlib.sha256).digest()
    return payload + mac


class TestLegacyFormatStillReadable(unittest.TestCase):
    """Exigence 1 : un coffre ancien reste lisible, sans conversion préalable."""

    def test_v1_vault_opens_and_decrypts(self):
        mk = secrets.token_bytes(32)
        entries = {'a.txt': b'contenu v1' * 10, 'b.bin': bytes(range(256))}
        path = _tmp_path()
        with open(path, 'wb') as f:
            f.write(_build_raw_v1_vault(mk, entries))
        try:
            v = Vault.open(path, mk)
            self.assertEqual(v.algo, ALG_CHACHA20_HKDF)
            for name, data in entries.items():
                self.assertEqual(v.get(name), data)
        finally:
            os.unlink(path)

    def test_v2_chacha_hkdf_vault_opens_unchanged(self):
        """Format actuel (v2, ALG_CHACHA20_HKDF) : doit continuer à se
        déchiffrer tel quel, sans passer par la cascade."""
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('secret.txt', b'contenu confidentiel' * 50)
        v.save()
        try:
            raw = _read(path)
            self.assertEqual(raw[4], VERSION)
            self.assertEqual(raw[5], ALG_CHACHA20_HKDF)
            v2 = Vault.open(path, mk)
            self.assertEqual(v2.algo, ALG_CHACHA20_HKDF)
            self.assertEqual(v2.get('secret.txt'), b'contenu confidentiel' * 50)
        finally:
            os.unlink(path)

    def test_save_never_silently_upgrades_algo(self):
        """Ouvrir un coffre ALG_CHACHA20_HKDF, ajouter une entrée, sauver :
        l'algo ne doit PAS changer tout seul (seule migrate_to_cascade migre)."""
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('x.txt', b'un')
        v.save()
        try:
            v2 = Vault.open(path, mk)
            v2.add('y.txt', b'deux')
            v2.save()
            raw = _read(path)
            self.assertEqual(raw[5], ALG_CHACHA20_HKDF,
                "save() a changé l'algo sans passer par migrate_to_cascade")
        finally:
            os.unlink(path)


class TestAlgoByteDisambiguation(unittest.TestCase):
    """Exigence 2 : l'octet algo lève l'ambiguïté à la lecture."""

    def test_create_defaults_to_cascade(self):
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk)   # algo par défaut
        v.add('f', b'data')
        v.save()
        try:
            raw = _read(path)
            self.assertEqual(raw[5], ALG_CASCADE_V1,
                "Vault.create() sans argument devrait écrire ALG_CASCADE_V1 par défaut")
        finally:
            os.unlink(path)

    def test_cascade_vault_round_trip(self):
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CASCADE_V1)
        v.add('doc.txt', 'Message en cascade — accents inclus, é è ü.'.encode('utf-8'))
        v.add('bin', secrets.token_bytes(4096))
        v.save()
        try:
            v2 = Vault.open(path, mk)
            self.assertEqual(v2.algo, ALG_CASCADE_V1)
            self.assertEqual(v2.get('doc.txt'),
                              'Message en cascade — accents inclus, é è ü.'.encode('utf-8'))
        finally:
            os.unlink(path)

    def test_unknown_algo_byte_rejected(self):
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CASCADE_V1)
        v.add('f', b'data')
        v.save()
        try:
            raw = bytearray(_read(path))
            raw[5] = 99   # algo inconnu
            with open(path, 'wb') as f:
                f.write(raw)
            with self.assertRaises(ValueError):
                Vault.open(path, mk)
        finally:
            os.unlink(path)

    def test_wrong_key_rejected_both_algos(self):
        mk = secrets.token_bytes(32)
        wrong = secrets.token_bytes(32)
        for algo in (ALG_CHACHA20_HKDF, ALG_CASCADE_V1):
            with self.subTest(algo=algo):
                path = _tmp_path()
                v = Vault.create(path, mk, algo=algo)
                v.add('f', b'secret')
                v.save()
                try:
                    with self.assertRaises(ValueError):
                        Vault.open(path, wrong)
                finally:
                    os.unlink(path)

    def test_tampered_cascade_ciphertext_rejected(self):
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CASCADE_V1)
        v.add('f', b'0123456789' * 20)
        v.save()
        try:
            raw = bytearray(_read(path))
            raw[-MAC_SIZE - 1] ^= 0xFF   # altère un octet de données, avant le HMAC final
            with open(path, 'wb') as f:
                f.write(raw)
            with self.assertRaises(ValueError):
                Vault.open(path, mk)
        finally:
            os.unlink(path)


class TestMigrateToCascade(unittest.TestCase):
    """Exigence 3 : la migration ne réécrit jamais un coffre sans sauvegarde."""

    def test_migration_real_vault_byte_identical_content(self):
        """Crée un coffre à l'ancien format, migre-le, relit-le, vérifie
        le contenu identique au bit près — sur un vault réel, pas un vecteur."""
        mk = secrets.token_bytes(32)
        old_path, new_path = _tmp_path(), _tmp_path()
        v = Vault.create(old_path, mk, algo=ALG_CHACHA20_HKDF)
        entries = {
            'notes.txt': 'Notes confidentielles, é à ç.'.encode('utf-8'),
            'empty.bin': b'',
            'big.bin':   secrets.token_bytes(200_000),
            'zeros.bin': b'\x00' * 1000,
        }
        for name, data in entries.items():
            v.add(name, data)
        v.save()
        raw_before = _read(old_path)
        try:
            migrated = Vault.migrate_to_cascade(old_path, new_path, mk)
            self.assertEqual(migrated.algo, ALG_CASCADE_V1)

            raw_after = _read(old_path)
            self.assertEqual(raw_after, raw_before,
                "l'original a été modifié pendant la migration")

            for name, data in entries.items():
                self.assertEqual(migrated.get(name), data,
                    f"contenu de '{name}' différent après migration")

            reread_again = Vault.open(new_path, mk)
            for name, data in entries.items():
                self.assertEqual(reread_again.get(name), data)
        finally:
            for p in (old_path, new_path):
                if os.path.exists(p):
                    os.unlink(p)

    def test_migration_interrupted_mid_write_leaves_original_intact(self):
        """Casse la migration à mi-parcours (échec simulé au moment de
        l'écriture atomique du nouveau fichier) : le coffre d'origine doit
        rester intact, et aucun fichier neuf mi-écrit ne doit traîner."""
        mk = secrets.token_bytes(32)
        old_path, new_path = _tmp_path(), _tmp_path()
        v = Vault.create(old_path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('important.txt', b'ne doit jamais se perdre' * 500)
        v.save()
        raw_before = _read(old_path)
        try:
            with patch.object(vault_lib.os, 'replace',
                               side_effect=OSError('simulated crash mid-write')):
                with self.assertRaises(ValueError):
                    Vault.migrate_to_cascade(old_path, new_path, mk)

            raw_after = _read(old_path)
            self.assertEqual(raw_after, raw_before,
                "l'original a été corrompu par une migration interrompue")
            self.assertFalse(os.path.exists(new_path),
                "un fichier neuf mi-écrit a été laissé derrière")

            # L'original doit rester pleinement utilisable après l'échec.
            reopened = Vault.open(old_path, mk)
            self.assertEqual(reopened.get('important.txt'),
                              b'ne doit jamais se perdre' * 500)
        finally:
            for p in (old_path, new_path):
                if os.path.exists(p):
                    os.unlink(p)

    def test_migration_reread_mismatch_cleans_up_and_preserves_original(self):
        """Si la relecture du nouveau fichier ne correspond pas au contenu
        d'origine, la migration doit échouer, nettoyer new_path, et ne
        jamais toucher old_path — même sans crash, une divergence logique
        doit être traitée avec la même prudence qu'un crash."""
        mk = secrets.token_bytes(32)
        old_path, new_path = _tmp_path(), _tmp_path()
        v = Vault.create(old_path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('f.txt', b'contenu original')
        v.save()
        raw_before = _read(old_path)

        real_open = Vault.open
        def _corrupting_open(path, master_key):
            result = real_open(path, master_key)
            if path == new_path:
                result._entries['f.txt']['data'] = b'CONTENU CORROMPU'
            return result

        try:
            with patch.object(Vault, 'open', side_effect=_corrupting_open):
                with self.assertRaises(ValueError):
                    Vault.migrate_to_cascade(old_path, new_path, mk)

            raw_after = _read(old_path)
            self.assertEqual(raw_after, raw_before, "original modifié malgré l'échec de relecture")
            self.assertFalse(os.path.exists(new_path), "new_path non nettoyé après échec de comparaison")
        finally:
            for p in (old_path, new_path):
                if os.path.exists(p):
                    os.unlink(p)

    def test_migrate_refuses_same_path(self):
        mk = secrets.token_bytes(32)
        path = _tmp_path()
        v = Vault.create(path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('f', b'x')
        v.save()
        try:
            with self.assertRaises(ValueError):
                Vault.migrate_to_cascade(path, path, mk)
            # old_path doit rester ouvrable normalement après le refus.
            self.assertEqual(Vault.open(path, mk).get('f'), b'x')
        finally:
            os.unlink(path)

    def test_migrate_wrong_key_never_touches_old_path(self):
        mk = secrets.token_bytes(32)
        wrong = secrets.token_bytes(32)
        old_path, new_path = _tmp_path(), _tmp_path()
        v = Vault.create(old_path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('f', b'x')
        v.save()
        raw_before = _read(old_path)
        try:
            with self.assertRaises(ValueError):
                Vault.migrate_to_cascade(old_path, new_path, wrong)
            self.assertEqual(_read(old_path), raw_before)
            self.assertFalse(os.path.exists(new_path))
        finally:
            os.unlink(old_path)

    def test_migrate_does_not_delete_original_on_success(self):
        """Après une migration réussie, l'original doit toujours exister —
        cette fonction ne le supprime jamais, c'est une décision de l'appelant."""
        mk = secrets.token_bytes(32)
        old_path, new_path = _tmp_path(), _tmp_path()
        v = Vault.create(old_path, mk, algo=ALG_CHACHA20_HKDF)
        v.add('f', b'x')
        v.save()
        try:
            Vault.migrate_to_cascade(old_path, new_path, mk)
            self.assertTrue(os.path.exists(old_path), "l'original a été supprimé après une migration réussie")
        finally:
            for p in (old_path, new_path):
                if os.path.exists(p):
                    os.unlink(p)


if __name__ == '__main__':
    unittest.main(verbosity=2)
