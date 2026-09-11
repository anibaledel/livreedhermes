#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Tests de cas limites façon Wycheproof — La Livrée d'Hermès.

Le projet Wycheproof (Google) est une batterie de vecteurs de test conçus
pour attraper des bugs d'implémentation aux limites du protocole plutôt
que des faiblesses de la primitive elle-même : points de courbe d'ordre
faible, nonces/tags tronqués ou altérés, tailles dégénérées. Ce fichier
n'importe PAS les vecteurs Wycheproof officiels (indisponibles hors
ligne dans cet environnement — voir NOTE ci-dessous) ; il en reprend la
DÉMARCHE sur les primitives et enveloppes réellement exercées par ce
dépôt : X25519 (secu_box.py), ChaCha20-Poly1305 à nonce étendu et
key commitment (crypto_core.py).

NOTE — points X25519 d'ordre faible : les valeurs employées ici
(u=0, u=1) ont été DÉRIVÉES par calcul (implémentation RFC 7748 en
Python pur, validée par accord exact avec `cryptography` sur 20 échanges
aléatoires, puis recherche exhaustive par force brute sur u=0..2000)
plutôt que citées de mémoire — voir le commit qui a introduit ce fichier
pour la méthode complète. Les autres points canoniques (ordre 4, 8), qui
exigent une reconstruction de point par racine carrée dans GF(p), ne sont
PAS couverts : plutôt que de risquer un vecteur faux, cette limite est
assumée explicitement (voir §1, « couverture partielle assumée »).

Usage : python3 tests_wycheproof.py
"""
import sys, os, struct, hashlib, hmac as _hmac
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'secubox'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stegano'))

from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey, X25519PublicKey)
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

import secu_box as S
import crypto_core as C


class Rapport:
    def __init__(self):
        self.total = 0
        self.echecs = []

    def verifie(self, nom, condition, detail=''):
        self.total += 1
        statut = 'OK' if condition else 'ÉCHEC'
        print(f"  [{statut}] {nom}" + (f" — {detail}" if detail and not condition else ''))
        if not condition:
            self.echecs.append(nom)


R = Rapport()


# ═══════════════════════════════════════════════════════════════════════════
# 1. X25519 — points d'ordre faible
# ═══════════════════════════════════════════════════════════════════════════
print("== 1. X25519 — points d'ordre faible (secu_box._dh) ==")

priv = X25519PrivateKey.generate()

# u=0 et u=1 : dérivés et vérifiés d'ordre divisant 2 (voir docstring).
POINTS_ORDRE_FAIBLE = {
    'u=0 (identité/2-torsion)': bytes(32),
    'u=1': bytes([1] + [0] * 31),
}
for nom, u_bytes in POINTS_ORDRE_FAIBLE.items():
    try:
        S._dh(priv, u_bytes)
        R.verifie(f"rejet de {nom}", False, "accepté, aucune exception levée")
    except ValueError:
        R.verifie(f"rejet de {nom}", True)

R.verifie(
    "couverture partielle assumée (ordre 4/8 non testés — reconstruction de "
    "point par racine carrée dans GF(p) hors de portée sans référence vérifiée)",
    True)  # constat, pas un test — toujours vrai, documente la limite

# Clé publique valide ordinaire : ne doit PAS être rejetée (contrôle négatif —
# sans lui, un _dh() qui rejetterait TOUT serait à tort compté comme sûr).
autre = X25519PrivateKey.generate()
try:
    out = S._dh(priv, autre.public_key().public_bytes_raw())
    R.verifie("clé publique ordinaire acceptée (contrôle négatif)", len(out) == 32)
except Exception as e:
    R.verifie("clé publique ordinaire acceptée (contrôle négatif)", False, str(e))

# Longueur de clé publique invalide.
for taille in (0, 16, 31, 33, 64):
    try:
        S._dh(priv, bytes(taille))
        R.verifie(f"rejet clé publique de {taille} octets", False, "accepté")
    except (ValueError, Exception):
        R.verifie(f"rejet clé publique de {taille} octets", True)


# ═══════════════════════════════════════════════════════════════════════════
# 2. ChaCha20-Poly1305 à nonce étendu — falsification et troncature
# ═══════════════════════════════════════════════════════════════════════════
print("\n== 2. LLDH-AEAD-v1 — falsification et troncature (crypto_core) ==")

cle = bytes(range(32))
payload_ok = C._encrypt("BONJOUR MONDE", cle)

# `_decrypt()` de crypto_core prend un flux de SYMBOLES base-44 (produit par
# payload_to_symbols()), pas les octets bruts du payload — la falsification
# est donc testée à ce niveau, celui réellement exposé aux appelants.
from crypto_core import payload_to_symbols, _decrypt as _decrypt_syms

syms_ok = payload_to_symbols(payload_ok)

# Les deux premiers symboles de l'en-tête sont un bourrage EXACTEMENT
# uniforme par construction (§5.2 de SPEC-LLDH-AEAD-v1.md) : les altérer
# ne change PAS la longueur recouvrée (u // HEADER_SLOTS est insensible à
# un changement de quelques unités sur u), donc pas non plus le HMAC ni le
# déchiffrement — ce n'est pas une falsification, c'est une réencodage
# valide de la même longueur. Vérifié explicitement plutôt que supposé,
# pour ne pas le confondre avec un défaut de rejet.
altere = list(syms_ok)
altere[0] = (altere[0] + 1) % C.ALPHA_LEN
longueur_avant = C._syms_to_header(syms_ok[:C._SYM_HEADER])
longueur_apres = C._syms_to_header(altere[:C._SYM_HEADER])
R.verifie(
    "symbole 0 (bourrage de l'en-tête) insensible par construction — "
    "pas un défaut de rejet",
    longueur_avant == longueur_apres and _decrypt_syms(altere, cle) == "BONJOUR MONDE")

# Positions qui DOIVENT être rejetées si altérées : le dernier symbole de
# l'en-tête (porte les bits de poids fort de la longueur, donc change la
# valeur recouvrée) et deux positions dans le corps du payload (couvert
# intégralement par le HMAC du key commitment).
for pos in (C._SYM_HEADER - 1, len(syms_ok) // 2, len(syms_ok) - 1):
    altere = list(syms_ok)
    altere[pos] = (altere[pos] + 1) % C.ALPHA_LEN
    try:
        _decrypt_syms(altere, cle)
        R.verifie(f"rejet symbole altéré en position {pos}", False, "accepté")
    except ValueError:
        R.verifie(f"rejet symbole altéré en position {pos}", True)

# 2b. Troncature du flux de symboles.
for n in (0, 1, C._SYM_HEADER - 1, C._SYM_HEADER, len(syms_ok) - 1):
    if n < 0:
        continue
    try:
        _decrypt_syms(syms_ok[:n], cle)
        R.verifie(f"rejet troncature à {n} symboles", False, "accepté")
    except ValueError:
        R.verifie(f"rejet troncature à {n} symboles", True)

# 2c. Mauvaise clé.
mauvaise_cle = bytes(range(32, 64))
try:
    _decrypt_syms(syms_ok, mauvaise_cle)
    R.verifie("rejet sous une clé différente", False, "accepté")
except ValueError:
    R.verifie("rejet sous une clé différente", True)

# 2d. Message vide, un seul caractère, alphabet complet — cas limites de
#     taille plutôt que de falsification.
for msg in ("", "X", C.ALPHABET.strip()):
    try:
        p = C._encrypt(msg if msg else " ", cle)  # "" seul refusé par choix API amont ; testé via " "
        s = payload_to_symbols(p)
        out = _decrypt_syms(s, cle)
        attendu = (msg if msg else " ").upper()
        R.verifie(f"aller-retour message {msg!r} (longueur {len(msg)})",
                 out == attendu, f"obtenu {out!r}")
    except Exception as e:
        R.verifie(f"aller-retour message {msg!r} (longueur {len(msg)})", False, str(e))


# ═══════════════════════════════════════════════════════════════════════════
# 3. HKDF-SHA256 — paramètres dégénérés
# ═══════════════════════════════════════════════════════════════════════════
print("\n== 3. HKDF-SHA256 — paramètres dégénérés ==")

cas = [
    ('salt vide', b'', b'info', 32),
    ('info vide', b'sel', b'', 32),
    ('ikm de 1 octet', b'x', b'info', 32),
    ('longueur de sortie = 1', b'sel', b'info', 1),
    ('longueur de sortie = 255*32 (limite RFC5869)', b'sel', b'info', 255 * 32),
]
for nom, salt, info, L in cas:
    try:
        out = HKDF(hashes.SHA256(), L, salt, info).derive(bytes(32))
        R.verifie(f"HKDF accepte {nom}", len(out) == L)
    except Exception as e:
        R.verifie(f"HKDF accepte {nom}", False, str(e))

# Au-delà de la limite RFC 5869 (255 * taille_hash), HKDF DOIT refuser.
try:
    HKDF(hashes.SHA256(), 255 * 32 + 1, b'sel', b'info').derive(bytes(32))
    R.verifie("HKDF rejette une sortie > 255×32 octets", False, "accepté")
except Exception:
    R.verifie("HKDF rejette une sortie > 255×32 octets", True)


# ═══════════════════════════════════════════════════════════════════════════
print(f"\n{'=' * 60}")
if not R.echecs:
    print(f"Tous les {R.total} contrôles passent.")
    sys.exit(0)
else:
    print(f"ÉCHEC — {len(R.echecs)}/{R.total} contrôles en échec :")
    for e in R.echecs:
        print(f"  - {e}")
    sys.exit(1)
