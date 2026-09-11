# LLDH-AEAD-v1 — Chiffrement authentifié à nonce étendu

**Statut :** spécification normative, état stable au 11 septembre 2026.
**Portée :** décrit exactement, octet par octet, la construction implémentée
dans `crypto_core.py` (`_chacha20_hkdf_enc` / `_chacha20_hkdf_dec`,
`_encrypt` / `_decrypt`). Un tiers qui suit ce document jusqu'au bout doit
pouvoir réimplémenter la construction dans un autre langage et produire un
chiffré binaire identique sur les mêmes entrées, ou échouer précisément là
où l'implémentation de référence échoue.

**Origine :** répond à LH-5 (audit G. Kerma). Le code renommait déjà la
construction (`_xchacha_enc` → `_chacha20_hkdf_enc`) et documentait l'écart
avec XChaCha20 en commentaire ; ce document en fait une spécification
autonome, vérifiable indépendamment du code source.

---

## 1. Ce que ce n'est pas

Cette construction **n'est pas XChaCha20-Poly1305** au sens du brouillon
IETF `draft-irtf-cfrg-xchacha`. Un chiffré produit ici ne se déchiffre
**pas** avec libsodium, PyNaCl, ou toute autre implémentation standard de
XChaCha20-Poly1305, et réciproquement.

La différence tient en une ligne : XChaCha20 dérive sa sous-clé de 32
octets par **HChaCha20** appliqué aux 16 premiers octets du nonce étendu ;
cette construction la dérive par **HKDF-SHA256**. La structure — nonce
étendu à 24 octets, sous-clé de session, ChaCha20-Poly1305 en dessous — est
la même. La primitive de dérivation ne l'est pas.

Aucune revendication de sécurité n'en dépend : HKDF-SHA256 est une
fonction pseudo-aléatoire au moins aussi solide que HChaCha20 pour cet
usage précis (dérivation d'une sous-clé à partir d'un nonce et d'une clé
maîtresse, sans exigence de compression de nonce supplémentaire). Le seul
enjeu est l'**interoperabilité** : personne ne doit supposer qu'un
composant XChaCha20 externe peut lire ces chiffrés.

## 2. Terminologie

| Terme | Sens |
|---|---|
| `key` | Clé de chiffrement, 32 octets. Appelée `steg_key` dans le code appelant. |
| `nonce` | 24 octets, tirés par `os.urandom(24)` à chaque appel de chiffrement. |
| `subkey` | Sous-clé de session, 32 octets, dérivée de `key` et `nonce`. |
| `plaintext` | Message en clair, octets ASCII stricts (voir §6). |
| `aad` | Données authentifiées non chiffrées. Toujours vide dans l'usage actuel du dépôt (`aad=b''`) ; le paramètre existe dans l'API mais n'est exercé par aucun appelant. |
| `ct` | Sortie de ChaCha20-Poly1305 : chiffré ‖ tag (16 octets). |
| `inner` | `nonce ‖ ct` — la sortie complète de `_chacha20_hkdf_enc`. |
| `commit` | HMAC-SHA256 de 32 octets, engagement de clé (§4). |
| `payload` | `commit ‖ inner` — la sortie complète de `_encrypt` (§4). |

Toutes les valeurs entières sont en big-endian sauf mention contraire.
Tous les XOR/opérations sur octets sont sur GF(2)⁸ standard.

## 3. Chiffrement authentifié — `_chacha20_hkdf_enc`

### 3.1 Dérivation de la sous-clé

```
nonce  = random(24)                                    # tiré par appel
subkey = HKDF-SHA256(
           ikm  = key,
           salt = nonce[0:16],
           info = "XChaCha20-HChaCha20-subkey",         # voir §3.3
           L    = 32,
         )
```

`HKDF-SHA256(ikm, salt, info, L)` est HKDF tel que défini par RFC 5869,
extraction et expansion sur SHA-256, longueur de sortie `L` octets.

### 3.2 Chiffrement

```
chacha_nonce = 0x00000000 ‖ nonce[16:24]                # 12 octets (96 bits)
ct           = ChaCha20-Poly1305(subkey).seal(chacha_nonce, plaintext, aad)
inner        = nonce ‖ ct
```

`ChaCha20-Poly1305` est la construction IETF RFC 8439 : nonce 96 bits,
clé 256 bits, tag Poly1305 de 16 octets en fin de sortie. Les quatre
premiers octets du nonce ChaCha20 sont fixés à zéro ; seuls les 8 derniers
octets du nonce étendu (`nonce[16:24]`) alimentent le compteur/nonce
interne du chiffrement de flux.

### 3.3 Note sur l'étiquette de domaine

L'argument `info` de HKDF vaut littéralement l'octet-chaîne
`"XChaCha20-HChaCha20-subkey"`. C'est un **reliquat historique** du nom
d'origine de la fonction, avant le renommage LH-5 — une étiquette de
séparation de domaine, sans effet de sécurité au-delà de rendre cette
dérivation distincte d'autres usages de HKDF dans le dépôt (`commit-v1`,
`key-commitment`, etc.). La modifier changerait la sous-clé dérivée et
casserait la compatibilité avec tout chiffré déjà produit : elle **doit**
rester telle quelle tant que le format n'est pas explicitement versionné à
la hausse (`LLDH-AEAD-v2`). Ce document la fige comme faisant partie du
format, malgré le nom trompeur qu'elle porte.

### 3.4 Déchiffrement — `_chacha20_hkdf_dec`

Inverse exact : `nonce, ct = inner[0:24], inner[24:]` ; la sous-clé se
recalcule à l'identique depuis `key` et `nonce[0:16]` ; `open()` rejette
si le tag Poly1305 ne vérifie pas, sans distinguer une clé fausse d'un
chiffré altéré (comportement voulu — voir §7).

## 4. Format du payload — `_encrypt` / `_decrypt`

```
header  = length_be32(32 + len(inner))                  # 4 octets, non transmis tel quel — voir §5
ck      = HKDF-SHA256(ikm=key, salt="commit-v1", info="key-commitment", L=32)
commit  = HMAC-SHA256(ck, header ‖ inner)                # 32 octets
payload = commit ‖ inner
```

`ck` (la clé de commitment) est **distincte** de `subkey` (la clé de
chiffrement) : dérivées séparément par HKDF avec des étiquettes de domaine
différentes (`key-commitment` contre `XChaCha20-HChaCha20-subkey`), sous
la même clé maîtresse `key`. Cette séparation ferme les attaques par
oracle de partitionnement (un chiffré ne peut être valide, au sens du
commitment, que sous une seule clé maîtresse).

Le déchiffrement vérifie `commit` **avant** toute tentative de
déchiffrement ChaCha20-Poly1305 (comparaison en temps constant,
`hmac.compare_digest`), et ne poursuit que si l'égalité tient.

### 4.1 Ordre des vérifications

1. `payload` fait au moins 32 octets, sinon rejet immédiat.
2. `commit_recv = payload[0:32]` ; `inner = payload[32:]`.
3. `header` est reconstruit depuis la longueur totale déjà lue en amont
   du flux de symboles (§5), **pas** retransportée dans `payload` — voir
   LH-4 ci-dessous.
4. `commit_calc = HMAC-SHA256(ck, header ‖ inner)` ; rejet si
   `commit_recv ≠ commit_calc`.
5. Déchiffrement ChaCha20-Poly1305 ; rejet si le tag est invalide.
6. Décodage ASCII strict du texte en clair ; rejet si non-ASCII (ne
   devrait jamais se produire si l'AEAD a vérifié, sauf corruption
   pathologique — voir §6).

Chaque rejet lève `ValueError` avec un message distinct ; aucun ne fuit
d'information sur *laquelle* des conditions a échoué au-delà du texte du
message (pas de canal temporel délibérément exploité par le code, mais
aucune revendication de résistance aux attaques temporelles au-delà de
`compare_digest` pour la comparaison du commitment elle-même).

## 5. En-tête de longueur — encodage base-44 à entropie pleine

Le payload n'est jamais transporté en octets bruts dans la grille : il est
réencodé en symboles sur l'alphabet `ALPHABET` (44 symboles, §5.3), avec
un en-tête de longueur en tête du flux.

### 5.1 Corps du payload

```
m       = _sym_count(len(payload))
                = ceil((8·len(payload) + 64) / log2(44))
span    = 2^(8·len(payload))
k       = 44^m // span
u       = int_be(payload) + span · random_below(k)
syms    = base_44_digits(u, m)                           # poids fort → faible
```

`_UNIFORM_MARGIN_BITS = 64` : l'écart à l'uniformité exacte de chaque
symbole est borné par 2⁻⁶⁴, par bourrage aléatoire dans les bits de poids
fort au-delà de `payload` lui-même.

### 5.2 En-tête de longueur (correctif N1)

L'en-tête ne réutilise **pas** `_bytes_to_syms` sur la longueur brute :
une longueur a une entropie propre faible (souvent la même d'un message à
l'autre), et bourrer ses bits de poids **faible** — comme le fait le
schéma général du §5.1 pour un payload chiffré déjà uniforme — y laisse un
biais résiduel exploitable sans clé (voir le commentaire N1 dans le code
pour la démonstration numérique : 11 valeurs sur 44 accessibles au
symbole de poids faible, avant correctif).

L'en-tête inverse la position du bourrage :

```
SYM_HEADER = _sym_count(4)                                # symboles pour 4 octets
HEADER_SPAN  = 2^32
HEADER_SLOTS = 44^SYM_HEADER // HEADER_SPAN                # k, multiple de 44²
u = longueur · HEADER_SLOTS + random_below(HEADER_SLOTS)
header_syms = base_44_digits(u, SYM_HEADER)
```

La longueur occupe les bits de poids **fort** de `u`, le bourrage aléatoire
les bits de poids **faible** — l'inverse du corps du payload. Parce que
`HEADER_SLOTS` est multiple de 44² (démonstration : `44^SYM_HEADER` est
divisible par `2^32` puisque `44^SYM_HEADER = 2^(2·SYM_HEADER) · 11^SYM_HEADER`
et `2·SYM_HEADER ≥ 32` pour les tailles de payload en usage), les deux
symboles de poids faible de l'en-tête sont **exactement** uniformes sur
`[0..43]`, quelle que soit la longueur. La récupération est
`longueur = u // HEADER_SLOTS`.

### 5.3 Alphabet

```
ALPHABET  = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-"
ALPHA_LEN = 44
```

Index 0 = espace, 1–26 = A–Z, 27–36 = 0–9, 37–43 = `.,;:!?-`.

## 6. Alphabet du message en clair (correctif LH-1)

Le texte en clair est mis en majuscules puis vérifié caractère par
caractère contre `ALPHABET`. Tout caractère hors alphabet — y compris les
accents (`é`, `à`…), les minuscules déjà couvertes par la mise en
majuscule, ou toute ponctuation non listée — lève `ValueError` avant tout
chiffrement, avec la liste triée des caractères refusés et un conseil de
translittération. **Aucune troncature ni substitution silencieuse** ne se
produit — comportement antérieur au correctif LH-1, où `errors='replace'`
remplaçait silencieusement par `?`.

## 7. Considérations de sécurité

- **Confidentialité et intégrité** : entièrement portées par
  ChaCha20-Poly1305 (256 bits de clé, tag 128 bits), pas par la
  construction du nonce étendu ni par la couche géométrique en amont.
- **Réutilisation de nonce** : `nonce` est tiré par `os.urandom(24)` à
  chaque appel, jamais dérivé d'un compteur ni d'un état partagé. Sous
  l'hypothèse standard d'un CSPRNG correct, la probabilité de collision
  sur 192 bits est négligeable pour tout volume de messages réaliste.
- **Key commitment** : ferme les attaques par oracle de partitionnement
  (un même chiffré ne peut jamais déchiffrer valablement sous deux clés
  différentes). Fondé sur HMAC-SHA256, résistance de commitment
  équivalente à la résistance de collision/préimage de SHA-256.
- **Non-interopérabilité assumée** : voir §1. Un intégrateur qui a besoin
  d'interopérer avec du XChaCha20-Poly1305 standard doit implémenter
  HChaCha20 et changer l'étiquette `info` du §3.3 — ce qui casse la
  compatibilité avec les chiffrés déjà produits sous ce format et
  justifierait un numéro de version (`LLDH-AEAD-v2`).
- **Pas de confidentialité persistante par message** : cette construction
  ne fournit aucun cliquet. Elle sert de couche AEAD à `key` fixée ;
  la confidentialité persistante, quand elle existe, est fournie par la
  couche d'établissement de session au-dessus (X3DH triple-DH,
  `secu_box.py`), pas ici.

## 8. Vecteurs de référence

Voir `stegano/test_regression.py` (classes A, C, D, E) pour des vecteurs
déterministes couvrant la dérivation de sous-clé, le format du payload et
l'aller-retour chiffrement/déchiffrement, ainsi que
`VECTEURS-REFERENCE.md` à la racine du dépôt pour un jeu de vecteurs
autonome, au format JSON, indépendant de l'implémentation Python — conçu
pour une réimplémentation dans un autre langage.

## 9. Historique

| Date | Changement |
|---|---|
| 2026-09-10 | Renommage `_xchacha_enc`/`_xchacha_dec` → `_chacha20_hkdf_enc`/`_chacha20_hkdf_dec` (LH-5). |
| 2026-09-11 | Ce document — spécification normative autonome, vérifiable indépendamment du code. |
