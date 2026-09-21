# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
SecuBox Vault v1.2 — Stockage chiffré de fichiers
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Historique des versions :
  v1.0 : PBKDF2-SHA256 + ChaCha20-Poly1305
  v1.1 : ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5 ; nonce 24B) + clé MAC dédiée + anti-DoS + versioning
  v1.2 : Argon2id remplace PBKDF2 (memory-hard, résistant GPU/ASIC)

Les vaults v1 restent lisibles : leur dérivation (HKDF direct sur la clé
maître, libellés en -v1) est conservée et choisie par l'octet de version de
l'en-tête. Un vault v1 ouvert puis enregistré est migré en v2.

Le KDF n'est exécuté qu'une fois par vault, quel que soit le nombre
d'entrées : le matériel dérivé est étendu par HKDF pour chaque fichier.

Format du vault (.sbvault) :
  [4B magic "SBVT"][1B version][1B algo][2B reserved]
  [32B salt Argon2id][4B manifest_size][manifest chiffré]
  [entrées chiffrées...][32B HMAC-SHA256 (clé dérivée)]

KDF : Argon2id — time=3, memory=64MB, parallelism=4
  Résistance GPU : facteur ×1000 vs PBKDF2-SHA256 (memory-hard)

Cascade v1 (câblage 2026-09-21, voir docs/CASCADE_V1.md) : l'octet algo,
écrit depuis toujours mais jamais LU avant ce câblage, distingue désormais
sans ambiguïté à la lecture le chiffrement historique par entrée
(ALG_CHACHA20_HKDF, ChaCha20-Poly1305 seul) de la cascade
(ALG_CASCADE_V1, AES-256-GCM(ChaCha20-Poly1305) — même principe que
crypto_core.py::encrypt_cascade, dupliqué ici plutôt qu'importé : aucun
chemin d'import établi entre secubox/ et stegano/ pour du code partagé
[seuls le CLI et les tests y insèrent stegano/ dans sys.path localement],
et le coffre n'a aucun consommateur JS — l'interopérabilité byte-à-byte
avec le cœur JS de la cascade Carter n'a pas de rôle à jouer ici. Couche
intérieure : la construction ChaCha20-Poly1305 à nonce étendu par HKDF
déjà en place dans ce fichier [_enc/_dec], pas HChaCha20 standard —
choix délibéré de rester auto-suffisant, même raisonnement déjà posé pour
secu_box.py::_chacha20_hkdf_enc2). Un vault écrit en ALG_CHACHA20_HKDF
reste lisible tel quel, sans conversion : l'octet algo lu détermine le
chemin de déchiffrement, il n'y a rien à deviner ni à essayer dans les
deux sens. Passer un vault existant en cascade est une migration
EXPLICITE (voir migrate_to_cascade ci-dessous) : jamais un effet de bord
silencieux de save().
"""

import os, json, hashlib, struct, secrets, hmac as _hmac
from typing import Dict, List, Optional
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305, AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes as _h
from argon2.low_level import hash_secret_raw, Type as Argon2Type

MAGIC            = b'SBVT'
VERSION          = 2               # v1.2 : Argon2id
ALG_CHACHA20_HKDF = 1   # LH-5 : renomme depuis ALG_XCHACHA20, valeur inchangee (format sur disque)
ALG_CASCADE_V1   = 2    # cascade v1 (2026-09-21) : AES-256-GCM(ChaCha20-Poly1305), voir docs/CASCADE_V1.md
SALT_SIZE        = 32
MAC_SIZE         = 32
HEADER_SIZE      = 4 + 1 + 1 + 2 + SALT_SIZE   # 40 bytes

# Paramètres Argon2id (OWASP 2024)
ARGON2_TIME      = 3               # itérations
ARGON2_MEMORY    = 65536           # 64 MB — memory-hard
ARGON2_PARALLEL  = 4               # threads
ARGON2_LEN       = 64              # 64 bytes → split en sous-clés

# Limites anti-DoS
MAX_MANIFEST_SIZE = 64 * 1024 * 1024
MAX_ENTRY_SIZE    = 512 * 1024 * 1024
MAX_ENTRIES       = 65536

# ── KDF Argon2id ──────────────────────────────────────────────────────────────
def _argon2id(passphrase_or_key: bytes, salt: bytes) -> bytes:
    """
    Dérive 64 bytes via Argon2id.
    Résistant GPU/ASIC : chaque tentative nécessite 64 MB de RAM.
    """
    return hash_secret_raw(
        secret=passphrase_or_key,
        salt=salt[:16],             # Argon2 salt : 16 bytes minimum
        time_cost=ARGON2_TIME,
        memory_cost=ARGON2_MEMORY,
        parallelism=ARGON2_PARALLEL,
        hash_len=ARGON2_LEN,
        type=Argon2Type.ID,
    )

# CORRECTIF AUDIT 2026-09-10 — compatibilité v1.
# open() acceptait « version in (1, 2) » mais ne connaissait que la
# dérivation v2. Un vault v1, dont les sous-clés viennent d'un HKDF appliqué
# directement à master_key avec des libellés en -v1, échouait donc à la
# vérification du MAC et s'entendait répondre « Vault corrompu ou clé
# incorrecte » — un message qui accuse l'utilisateur d'une erreur de clé pour
# ce qui n'est qu'un format antérieur. Les deux dérivations coexistent
# désormais, choisies par l'octet de version lu dans l'en-tête.
#
# CORRECTIF AUDIT 2026-09-10 — un seul Argon2id par vault.
# _entry_key() relançait un Argon2id complet (64 Mo, time=3) par entrée, à
# l'ouverture comme à l'enregistrement : environ 70 ms et 64 Mo de churn par
# fichier, linéairement. La borne « anti-DoS » MAX_ENTRIES autorisait ainsi
# plus d'une heure de calcul pour un vault légitime. Le matériel est
# maintenant dérivé une fois et étendu par HKDF pour chaque entrée — ce que
# _derive_keys() faisait déjà juste à côté. La sortie est inchangée octet
# pour octet : les vaults v2 existants restent lisibles.

_V1_LABELS = {'manifest': b'SecuBox-Vault-Manifest-v1',
              'mac':      b'SecuBox-Vault-MAC-v1',
              'entry':    'SecuBox-Vault-Entry-v1:'}
_V2_LABELS = {'manifest': b'SecuBox-Vault-Manifest-v2',
              'mac':      b'SecuBox-Vault-MAC-v2',
              'entry':    'SecuBox-Vault-Entry-v2:'}

def _labels(version: int) -> Dict:
    return _V1_LABELS if version == 1 else _V2_LABELS

def _key_material(master_key: bytes, salt: bytes, version: int) -> bytes:
    """
    Matériel dont dérivent toutes les sous-clés du vault.

    v1 : master_key telle quelle — le HKDF était appliqué directement.
    v2 : Argon2id(master_key, salt), memory-hard.

    À dériver UNE fois par vault, puis à passer à _entry_key().
    """
    return master_key if version == 1 else _argon2id(master_key, salt)

def _derive_keys(master_key: bytes, salt: bytes,
                 version: int = VERSION) -> Dict[str, bytes]:
    """
    Sous-clés du vault. La clé 'km' porte le matériel à réutiliser pour les
    entrées, afin de ne pas relancer le KDF une fois par fichier.
    """
    km  = _key_material(master_key, salt, version)
    lab = _labels(version)

    def sub(info: bytes) -> bytes:
        return HKDF(_h.SHA256(), 32, salt=salt, info=info).derive(km)

    return {
        'manifest': sub(lab['manifest']),
        'mac':      sub(lab['mac']),
        'km':       km,
    }

def _entry_key(km: bytes, entry_name: str, salt: bytes,
               version: int = VERSION) -> bytes:
    """Clé par entrée : HKDF du matériel déjà dérivé, avec le nom du fichier."""
    return HKDF(_h.SHA256(), 32, salt=salt,
                info=f'{_labels(version)["entry"]}{entry_name}'.encode()).derive(km)

# ── ChaCha20-Poly1305 à nonce étendu par HKDF ─────────────────────────────────
# LH-5 (audit G. Kerma) : renommée depuis _xchacha_subkey. Pas du XChaCha20
# standard (sous-clé HKDF-SHA256, pas HChaCha20) — non interopérable avec
# libsodium/PyNaCl. Le HKDF info= reste 'XChaCha20-HChaCha20-subkey' tel
# quel : c'est un libellé de dérivation figé dans le format, pas un nom
# d'API ; le changer romprait le déchiffrement des vaults déjà créés.
def _chacha20_hkdf_subkey(key: bytes, nonce_24: bytes):
    return (HKDF(_h.SHA256(), 32, salt=nonce_24[:16],
                 info=b'XChaCha20-HChaCha20-subkey').derive(key),
            b'\x00\x00\x00\x00' + nonce_24[16:])

def _enc(data: bytes, key: bytes, aad: bytes = b'') -> bytes:
    nonce = os.urandom(24)
    sk, cn = _chacha20_hkdf_subkey(key, nonce)
    return nonce + ChaCha20Poly1305(sk).encrypt(cn, data, aad or None)

def _dec(data: bytes, key: bytes, aad: bytes = b'') -> bytes:
    nonce, ct = data[:24], data[24:]
    sk, cn = _chacha20_hkdf_subkey(key, nonce)
    return ChaCha20Poly1305(sk).decrypt(cn, ct, aad or None)

# ── Cascade v1 — AES-256-GCM(ChaCha20-Poly1305(plaintext)) ───────────────────
# Même principe que crypto_core.py::encrypt_cascade/decrypt_cascade (voir
# docs/CASCADE_V1.md) : deux algorithmes, deux clés dérivées indépendamment
# (jamais l'une de l'autre), toujours les deux, rien à négocier. Couche
# intérieure = _enc/_dec ci-dessus (déjà en place dans ce fichier), couche
# extérieure = AES-256-GCM avec une clé indépendante k2. `aad` (le nom de
# l'entrée, ou b'manifest') authentifie les DEUX couches, comme dans
# crypto_core.py.
_CASCADE_SPLIT_SALT = b'SecuBox-Vault-cascade-v1'
_CASCADE_INNER_INFO = b'SecuBox-Vault-cascade-inner-v1'
_CASCADE_OUTER_INFO = b'SecuBox-Vault-cascade-outer-v1'

def _cascade_split(key: bytes):
    """k1 (couche intérieure), k2 (couche extérieure) — dérivées
    indépendamment de `key`, jamais l'une à partir de l'autre."""
    k1 = HKDF(_h.SHA256(), 32, salt=_CASCADE_SPLIT_SALT, info=_CASCADE_INNER_INFO).derive(key)
    k2 = HKDF(_h.SHA256(), 32, salt=_CASCADE_SPLIT_SALT, info=_CASCADE_OUTER_INFO).derive(key)
    return k1, k2

def _enc_cascade(data: bytes, key: bytes, aad: bytes = b'') -> bytes:
    k1, k2 = _cascade_split(key)
    inner  = _enc(data, k1, aad)     # N1(24) ‖ C ‖ T1(16)
    nonce2 = os.urandom(12)
    outer  = AESGCM(k2).encrypt(nonce2, inner, aad or None)
    return nonce2 + outer

def _dec_cascade(data: bytes, key: bytes, aad: bytes = b'') -> bytes:
    k1, k2 = _cascade_split(key)
    nonce2, outer = data[:12], data[12:]
    inner = AESGCM(k2).decrypt(nonce2, outer, aad or None)
    return _dec(inner, k1, aad)

# ── Vault ─────────────────────────────────────────────────────────────────────
class Vault:
    """
    Vault chiffré SecuBox v1.2.
    KDF : Argon2id (time=3, mem=64MB) — résistant GPU.
    Chiffrement : ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5) par entrée.
    Intégrité : HMAC-SHA256 global (clé dédiée).
    """

    def __init__(self, path: str, master_key: bytes,
                 salt: bytes, entries: Dict, algo: int = ALG_CHACHA20_HKDF):
        self.path       = path
        self.master_key = master_key
        self.salt       = salt
        self._entries   = entries
        self.algo       = algo

    @classmethod
    def create(cls, path: str, master_key: bytes, algo: int = ALG_CASCADE_V1) -> 'Vault':
        """Nouveau vault vide. algo=ALG_CASCADE_V1 par défaut (cascade
        toujours appliquée pour un vault créé aujourd'hui, sans négociation
        — même principe que le reste du câblage cascade). Passer
        algo=ALG_CHACHA20_HKDF n'a de sens que pour construire délibérément
        un vault à l'ancien format (tests, comparaison)."""
        salt = os.urandom(SALT_SIZE)
        return cls(path, master_key, salt, {}, algo=algo)

    @classmethod
    def open(cls, path: str, master_key: bytes) -> 'Vault':
        with open(path, 'rb') as f:
            raw = f.read()

        if len(raw) < HEADER_SIZE + 4 + MAC_SIZE:
            raise ValueError("Vault trop court ou corrompu")
        if raw[:4] != MAGIC:
            raise ValueError("Fichier non reconnu (magic invalide)")

        version = raw[4]
        if version not in (1, 2):
            raise ValueError(f"Version {version} non supportée")

        # Câblage cascade (2026-09-21) : l'octet algo, écrit depuis toujours
        # mais jamais lu avant ce câblage, lève désormais l'ambiguïté à la
        # lecture -- un coffre dit lui-même s'il est en cascade ou non, rien
        # à deviner ni à essayer dans les deux sens.
        algo = raw[5]
        if algo not in (ALG_CHACHA20_HKDF, ALG_CASCADE_V1):
            raise ValueError(f"Algorithme {algo} non supporté (format v{version})")

        salt = raw[8:8+SALT_SIZE]

        # HMAC avant toute allocation [anti-DoS]
        keys    = _derive_keys(master_key, salt, version)
        mac_key = keys['mac']
        payload = raw[:-MAC_SIZE]
        if not _hmac.compare_digest(raw[-MAC_SIZE:],
                                     _hmac.new(mac_key, payload,
                                               hashlib.sha256).digest()):
            raise ValueError(f"Vault corrompu ou clé incorrecte "
                             f"(format v{version})")

        rest          = payload[HEADER_SIZE:]
        manifest_size = struct.unpack('>I', rest[:4])[0]
        if manifest_size > MAX_MANIFEST_SIZE:
            raise ValueError(f"Manifest trop grand : {manifest_size} bytes")
        if len(rest) < 4 + manifest_size:
            raise ValueError("Manifest tronqué")

        mkey         = keys['manifest']
        manifest_dec = _dec_cascade if algo == ALG_CASCADE_V1 else _dec
        manifest_raw = manifest_dec(rest[4:4+manifest_size], mkey, b'manifest')
        manifest     = json.loads(manifest_raw)

        if len(manifest) > MAX_ENTRIES:
            raise ValueError(f"Trop d'entrées : {len(manifest)}")

        cursor  = 4 + manifest_size
        entries = {}
        entry_dec = _dec_cascade if algo == ALG_CASCADE_V1 else _dec
        for name, meta in manifest.items():
            if cursor + 4 > len(rest):
                raise ValueError(f"Entrée '{name}' tronquée")
            entry_size = struct.unpack('>I', rest[cursor:cursor+4])[0]
            if entry_size > MAX_ENTRY_SIZE:
                raise ValueError(f"Entrée '{name}' trop grande")
            if cursor + 4 + entry_size > len(rest):
                raise ValueError(f"Entrée '{name}' tronquée (données)")
            cursor += 4
            ekey = _entry_key(keys['km'], name, salt, version)
            data = entry_dec(rest[cursor:cursor+entry_size], ekey, name.encode())
            if hashlib.sha256(data).hexdigest() != meta['sha256']:
                raise ValueError(f"Hash invalide pour '{name}'")
            entries[name] = {'data': data,
                             'sha256': meta['sha256'],
                             'size': len(data)}
            cursor += entry_size

        return cls(path, master_key, salt, entries, algo=algo)

    def add(self, name: str, data: bytes) -> None:
        h = hashlib.sha256(data).hexdigest()
        self._entries[name] = {'data': data, 'sha256': h, 'size': len(data)}

    def get(self, name: str) -> bytes:
        if name not in self._entries:
            raise KeyError(f"'{name}' absent du vault")
        return self._entries[name]['data']

    def remove(self, name: str) -> None:
        """
        Retire une entrée du vault.

        N'EFFACE PAS le clair de la mémoire. La ligne d'écrasement d'avant
        réassignait la référence à des octets aléatoires ; les `bytes` de
        Python étant immuables, l'objet d'origine survivait intact jusqu'au
        passage du ramasse-miettes, et toute autre référence — celle de
        l'appelant, par exemple — continuait de le lire. L'écrasement était
        donc sans effet, et le laisser en place entretenait la croyance
        inverse. CPython ne permet pas de garantir cet effacement : les
        `bytes` sont immuables, l'allocateur peut recopier, et rien
        n'empêche la pagination sur disque.

        Un secret qui ne doit pas survivre en mémoire relève du système
        d'exploitation (pages verrouillées, chiffrement de la swap), pas de
        cette bibliothèque. Après save(), le fichier ne contient plus
        l'entrée : c'est la seule suppression que ce module assure.
        """
        if name not in self._entries:
            raise KeyError(f"'{name}' absent du vault")
        del self._entries[name]

    def list(self) -> List[Dict]:
        return [{'name': n, 'size': m['size'],
                 'sha256': m['sha256'][:16]+'...'}
                for n, m in self._entries.items()]

    def save(self) -> None:
        # Toujours écrit en v2 (KDF) : un vault v1 ouvert puis enregistré
        # est migré vers Argon2id, sans changer ni sa passphrase ni son
        # sel. L'ALGORITHME de chiffrement (self.algo), lui, n'est JAMAIS
        # changé implicitement ici : passer d'ALG_CHACHA20_HKDF à
        # ALG_CASCADE_V1 est une migration explicite (migrate_to_cascade
        # ci-dessous), qui garde l'original tant que la relecture du
        # nouveau format n'est pas vérifiée -- un save() ordinaire ne doit
        # jamais faire courir ce risque en silence. save() écrit ici avec
        # l'algo que ce Vault porte déjà (celui lu par open(), ou celui
        # choisi à create()).
        keys     = _derive_keys(self.master_key, self.salt, VERSION)
        mkey     = keys['manifest']
        mac_key  = keys['mac']
        enc      = _enc_cascade if self.algo == ALG_CASCADE_V1 else _enc

        manifest = {n: {'sha256': m['sha256'], 'size': m['size']}
                    for n, m in self._entries.items()}
        manifest_enc = enc(json.dumps(manifest).encode(), mkey, b'manifest')

        entries_blob = bytearray()
        for name, meta in self._entries.items():
            ekey      = _entry_key(keys['km'], name, self.salt, VERSION)
            entry_enc = enc(meta['data'], ekey, name.encode())
            entries_blob += struct.pack('>I', len(entry_enc)) + entry_enc

        header  = MAGIC + bytes([VERSION, self.algo, 0, 0]) + self.salt
        payload = (header
                   + struct.pack('>I', len(manifest_enc))
                   + manifest_enc
                   + bytes(entries_blob))
        mac = _hmac.new(mac_key, payload, hashlib.sha256).digest()

        tmp = self.path + '.tmp'
        with open(tmp, 'wb') as f:
            f.write(payload + mac)
        os.replace(tmp, self.path)

    def secure_delete(self) -> None:
        """
        Écrase le fichier d'octets aléatoires, puis le supprime.

        Le nom promet plus que ce que la méthode peut tenir. L'écrasement
        en place ne détruit les données que sur un support qui réécrit
        vraiment les mêmes secteurs. Ce n'est le cas ni d'un SSD, dont le
        nivellement d'usure écrit ailleurs et laisse l'ancien bloc lisible
        jusqu'au ramasse-miettes du contrôleur, ni d'un système de fichiers
        journalisé ou copy-on-write (APFS, Btrfs, ZFS, ext4 en data=journal),
        ni d'un instantané ou d'une sauvegarde déjà pris. Des copies peuvent
        également subsister dans la swap ou le cache de pages.

        Sur un disque à plateaux sans instantané, l'écrasement fait son
        office. Partout ailleurs, considérer que le fichier a seulement été
        délié, et se reposer sur le chiffrement — c'est lui, et non
        l'écrasement, qui protège un vault dont le support a été saisi.
        """
        if os.path.exists(self.path):
            with open(self.path, 'wb') as f:
                f.write(secrets.token_bytes(os.path.getsize(self.path)))
            os.unlink(self.path)

    def verify(self) -> bool:
        try:
            Vault.open(self.path, self.master_key)
            return True
        except Exception:
            return False

    @staticmethod
    def migrate_to_cascade(old_path: str, new_path: str, master_key: bytes) -> 'Vault':
        """
        Migre un coffre existant (n'importe quelle version/algo lisible par
        open(), y compris un ALG_CHACHA20_HKDF déjà migré v1→v2) vers la
        cascade v1, dans NEW_PATH — JAMAIS dans old_path.

        C'est le seul endroit du dépôt où une erreur peut rendre des
        données irrécupérables : une réécriture en place qui échoue à
        mi-chemin détruirait ce qu'elle voulait protéger. La discipline ici
        est donc :
          1. old_path n'est JAMAIS ouvert en écriture par cette fonction —
             seulement lu, via Vault.open(). Un crash à n'importe quel
             instant de la migration laisse old_path bit pour bit
             identique à avant l'appel.
          2. new_path est écrit (Vault.save(), déjà atomique par
             tmp+os.replace — voir save()), PUIS relu depuis le disque
             (pas depuis l'objet en mémoire : une vraie relecture, clé
             comprise) et comparé entrée par entrée, au bit près, au
             contenu d'origine.
          3. Si l'écriture, la relecture ou la comparaison échoue, new_path
             (et son .tmp éventuel) est supprimé et une exception est
             levée — old_path n'a jamais bougé.
          4. En cas de succès, old_path est laissé TEL QUEL : cette
             fonction ne le supprime JAMAIS. C'est à l'appelant de décider,
             une fois satisfait de la relecture, quand s'en défaire (voir
             Vault.secure_delete côté appelant) — jamais une décision
             prise ici en silence.

        Lève ValueError si new_path == old_path (la garantie n°1 perdrait
        son sens), ou si la relecture/comparaison échoue.
        """
        if os.path.abspath(old_path) == os.path.abspath(new_path):
            raise ValueError(
                "migrate_to_cascade : new_path doit différer de old_path — "
                "l'original doit rester intact pendant toute la migration.")

        old = Vault.open(old_path, master_key)
        original = {name: bytes(meta['data']) for name, meta in old._entries.items()}

        def _cleanup_new():
            for p in (new_path, new_path + '.tmp'):
                if os.path.exists(p):
                    os.unlink(p)

        new = Vault(new_path, master_key, old.salt, dict(old._entries), algo=ALG_CASCADE_V1)
        try:
            new.save()
        except Exception as e:
            _cleanup_new()
            raise ValueError(
                f"Migration : échec de l'écriture du nouveau format — "
                f"original conservé intact ({e})") from e

        try:
            reread = Vault.open(new_path, master_key)
        except Exception as e:
            _cleanup_new()
            raise ValueError(
                f"Migration : le nouveau fichier ne se relit pas — "
                f"original conservé intact ({e})") from e

        if set(reread._entries) != set(original):
            _cleanup_new()
            raise ValueError(
                "Migration : l'ensemble des entrées diffère après relecture "
                "— original conservé intact.")
        for name, data in original.items():
            if reread._entries[name]['data'] != data:
                _cleanup_new()
                raise ValueError(
                    f"Migration : le contenu de '{name}' diffère après "
                    f"relecture (comparaison bit à bit) — original conservé intact.")

        return reread

def demo():
    import tempfile, time
    print("=== VAULT SECUBOX v1.2 — Argon2id ===\n")
    mk = secrets.token_bytes(32)

    # Benchmark KDF
    salt = os.urandom(SALT_SIZE)
    t0 = time.time()
    _derive_keys(mk, salt)
    t_kdf = (time.time() - t0) * 1000
    print(f"KDF Argon2id (64MB, time=3) : {t_kdf:.0f} ms")
    print(f"  → Attaque GPU : même durée (memory-hard)")
    print(f"  → PBKDF2 300k : ~0.1 ms GPU (×{int(t_kdf/0.1)} fois plus lent pour l'attaquant)\n")

    with tempfile.NamedTemporaryFile(suffix='.sbvault', delete=False) as f:
        path = f.name

    v = Vault.create(path, mk)
    v.add('secret.txt',  b'Contenu confidentiel ' * 100)
    v.add('config.json', b'{"api_key": "sk-secret"}')
    v.save()
    print(f"Vault créé  : {os.path.getsize(path)} bytes  (version={VERSION})")

    v2 = Vault.open(path, mk)
    print(f"Vault ouvert : {len(v2.list())} fichiers ✓")

    try:
        Vault.open(path, secrets.token_bytes(32))
    except ValueError as e:
        print(f"Mauvaise clé : {e} ✓")

    v2.secure_delete()
    print(f"Fichier écrasé puis supprimé ✓")
    print(f"  → sur SSD ou système de fichiers journalisé, l'écrasement ne")
    print(f"    détruit pas les blocs : c'est le chiffrement qui protège")
    print(f"\nChangements v1.2 :")
    print(f"  PBKDF2-SHA256 (300k)  →  Argon2id (time=3, mem=64MB)")
    print(f"  Résistance GPU/ASIC   : ×{int(t_kdf/0.1):,} vs PBKDF2")

if __name__ == '__main__':
    demo()
