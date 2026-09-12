# Port JS — Étape 0 : inventaire (aucune modification)

La Livrée d'Hermès — 2026-09-12, branche `js-v3` (créée depuis `v3-format`)

> Ce document ne modifie aucun fichier de production. Toutes les
> affirmations ci-dessous sont vérifiées par lecture directe du code aux
> chemins cités, pas déduites d'un docstring ou d'un commentaire seul.

## ⚠ Constat préalable, hors périmètre du port mais urgent

**`encodeur.html` (page payante, outil Carter réellement exposé aux
utilisateurs Partenaires) encode aujourd'hui les deux modes stéganographiques
(« classique » Référent 256/360 ET « Carter 90×90 ») avec la faille
d'encodage par nibbles que le format v3 Python a corrigée côté serveur.**

- `stegEncode`/`stegDecode` (mode classique, ligne ~752) et `encodeCarter`/
  `decodeCarter` (mode Carter, ligne ~957) convertissent chacun le
  ciphertext en **nibbles 4 bits** (`b>>4`, `b&0xF` — valeurs `0..15`) et les
  écrivent **directement**, sans keystream de masque, aux positions message
  d'une grille dont le bruit de fond couvre `0..43` (`ALPHABET.length`,
  ligne 581).
- Résultat : les cellules message sont mathématiquement confinées à
  `[0,15]` pendant que le bruit environnant couvre `[0,43]` — une cellule
  ≥ 16 ne peut PAS être une cellule message. C'est exactement le défaut
  que le format v3 Python a éliminé côté serveur en remplaçant l'encodage
  nibble-par-nibble par `payload_to_symbols()` (flux de symboles base-44
  uniforme) — la faille est documentée dans ce dépôt comme celle qui avait
  compromis l'encodage en v5, et corrigée depuis.
- C'est indépendant de la question AES-GCM/XChaCha20 : même avec un AEAD
  parfait, la géométrie du placement fuit ici la localisation des cellules
  message sans qu'aucune clé ne soit nécessaire pour les repérer (il reste
  à les déchiffrer, mais leur existence et leur position sont déjà
  observables).
- Portée : uniquement les deux modes inline de `encodeur.html`. Le module
  `js/carter_random.js` (utilisé par `carter-demo.html`, accès libre) N'A
  PAS ce défaut — il utilise déjà `payloadToSymbols`/`bytesToSyms` (flux
  base-44 uniforme, voir §1) et un masque de position dérivé.

Je ne corrige rien (Étape 0, lecture seule) — signalé comme demandé par les
« Règles de travail » pour toute divergence bloquante. À vous de me dire si
ceci doit être traité avant ou en parallèle du port (c'est un bug de
production indépendant du port lui-même, qui pourrait se corriger sans
attendre XChaCha20 : il suffirait de router `encodeur.html` vers le même
`payloadToSymbols` déjà présent dans `js/crypto_core.js`).

## Situation de départ : trois implémentations JS indépendantes, pas une

| Implémentation | Fichier | Page qui l'utilise | Accès |
|---|---|---|---|
| « Classique » Référent 256/360 (Clé B/C/2) | inline dans `encodeur.html` | `encodeur.html`, onglet Chiffrement | Payant (Partenaire) |
| « Carter 90×90 » (grammaire à 3 rôles, référent fixe) | inline dans `encodeur.html`, lignes 840–980 | `encodeur.html`, onglet Grille Carter | Payant (Partenaire) |
| « Carter Random » (référents 6×6 dérivés de la clé) | `js/carter_random.js` + `js/crypto_core.js` + `js/sha256.js` | `carter-demo.html` | Libre |

`encodeur.html` ne charge **aucun** fichier de `js/` (vérifié : aucun
`import`/`<script src="js/...">` dans le fichier). Les deux implémentations
inline et le module `js/` ont chacun leur propre AEAD, leurs propres labels
HKDF et leur propre schéma de grammaire — ce ne sont pas trois vues du même
code, ce sont trois lignées distinctes, à des stades de correction
différents. Le tableau ci-dessous ne couvre donc que `js/` (le module que
ce prompt demande de porter) ; les deux implémentations inline de
`encodeur.html` sont traitées séparément en fin de section 2.

## 1. Contenu de `js/`

| Fichier | Rôle | Portable tel quel | À refaire pour le v3 |
|---|---|---|---|
| `sha256.js` (82 lignes) | SHA-256 pur JS, FIPS 180-4, synchrone | **Oui, intégralement.** Le SHA-256 ne change pas entre l'ancienne et la v3. Reste utile pour toute boucle serrée où `crypto.subtle.digest` (async) coûterait trop cher en dispatch. | — |
| `crypto_core.js` — `randomBytes`, `utf8ToBytes`, `concatBytes`, `randomUint32s`, `randomSymbols` | Utilitaires purs, remplissage CSPRNG en bloc | **Oui.** `randomSymbols` reproduit déjà le principe de `crypto_core.random_grid` (un seul appel `getRandomValues` + rejection sampling), même alphabet 44. | — |
| `crypto_core.js` — `hkdf`, `hmacSha256`, `hmacEqual` | HKDF-SHA256 et HMAC-SHA256 via Web Crypto | **Oui pour le mécanisme.** Web Crypto expose HKDF/HMAC-SHA256 nativement, identique aux deux langages. | Vérifier chaque `salt`/`info` appelant contre `crypto_core.LABELS` (ex. `commitKey` utilise `'commit-v1'` ; le Python v3 utilise `'commit-v3'`, voir §4 de `PAPER_NUMBERS_v3.md`) — labels à réaligner un par un, pas la fonction HKDF elle-même. |
| `crypto_core.js` — `bytesToSyms`/`symsToBytes`/`randomBigInt` | Cœur BigInt de PayloadToSymbols (Définition PtS) | **L'arithmétique BigInt, oui** (borne `k = floor(ALPHA_LEN^m / span)`, remplissage aléatoire uniforme dans `[0,k)` — c'est exactement `_bytes_to_syms` côté Python). | La fonction autour (`payloadToSymbols`, `SYM_HEADER = symCount(4)`) reconstruit l'ANCIEN schéma à en-tête séparé (charge utile de longueur variable + en-tête de longueur à part). Le format v3 (`payload_to_symbols(payload, L, ...)`) exige un `L` obligatoire et une longueur chiffrée **à l'intérieur** du payload (charge utile à longueur fixe, tâche 2 du format v3) — à refaire entièrement, réutilisant seulement le cœur BigInt. |
| `crypto_core.js` — `aesGcmEnc`/`aesGcmDec`, `encrypt`/`decrypt` | AEAD + key commitment | **Non.** AES-256-GCM substitue XChaCha20-Poly1305 (choix déjà pris et documenté dans ce dépôt, voir note en tête de fichier et memory `livreedhermes-crypto-primitive-substitution` — **ce prompt demande explicitement l'inverse : un ChaCha20 pur JS pour l'interopérabilité bit-exacte**, voir « Point à trancher » plus bas). Format `[32B HMAC][nonce(12)+ct+tag(16)]`, en-tête à part — à refaire selon le format v3 (`commit ‖ nonce(24) ‖ ct ‖ tag`, XChaCha20-Poly1305 avec HChaCha20 natif). |
| `carter_random.js` — `MersenneTwister` | Reproduction de `random.Random` de Python (Mersenne Twister 32 bits) | **Oui, mais pas pour l'usage actuel.** Le pool de référents 6×6 est passé en v3 à une génération ChaCha20 (`referent6x6_gen.py`), donc cette classe ne sert plus à ça. **Elle reste nécessaire telle quelle pour Carter-18/Carter-Hybrid** : leur référent 18×18 utilise encore `random.Random(seed)` côté Python (`carter_random.py::get_referent_18`, jamais migré vers ChaCha20, `SEEDS = [42, 137, 999, 271, 1337, 31415, 27182, 61803, 65537, 99991]`) — à valider bit-exact contre un vecteur si Carter-18/Hybrid entrent un jour dans le périmètre JS. | — pour Carter-18/Hybrid ; à remplacer entièrement par une génération ChaCha20 pour le pool 6×6 (Carter-Random individuel/méta, Carter-Hybrid mode 6×6). |
| `carter_random.js` — `generateForm`/`makeReferent`/`getReferent` | Génération du référent 6×6 « bariolé » (direction 0-3, contrainte de run ≤ 2, pas de notion de couleur) | **Non pour le pool 6×6 actuel.** C'est l'ANCIEN référent (voir la note de `carter_random.py` : « l'ancien référent bariolé n'a pas de notion de couleur, ses formes étaient génériques » — remplacé par 256 référents rouge/bleu/vert/jaune générés par ChaCha20, `referent6x6_gen.py`). À refaire entièrement (portage de `referent6x6_gen.py`, dépend du cœur ChaCha20 de l'Étape 1). | |
| `carter_random.js` — `carterSplit`, `deriveMasks`, `deriveParams`, `grammarIndividual`, `grammarMeta` | Séparation de clé, masques, dérivation de grammaire | **La structure algorithmique est bien celle du v3** (rôles pur/structuré/message par HKDF, bascule individuel/méta) — mais 3 défauts précis : (1) labels partiellement erronés — `deriveParams` utilise le salt `'Carter-params-v3'`, le vrai label v3 est `'Carter-random-params-v3'` (`LABELS['carterrandom']['params_salt']`) ; `grammarMeta` utilise `'Carter-meta-v3'`, le vrai label est `'Carter-random-meta-v3'` — dans les deux cas il manque le segment `random`. `grammarIndividual`, lui, est déjà EXACT (`'Carter-random-v3'`/`'grammar-individual'`, identique à `LABELS['carterrandom']['grammar_individual_salt/info']`). (2) `deriveMasks` chaîne du SHA-256 — le v3 Python dérive les masques par keystream ChaCha20 (`_derive_masks`), construction différente. (3) **Aucune recherche de redraw C_PUB** (tâche 4 du format v3, `_find_random_grammar_with_c_pub`) : le JS dérive une seule grammaire et échoue si elle est trop petite, sans jamais retirer avec un compteur — toute la garantie de capacité publique minimale (`C_PUB`) est absente. | Labels à corriger (2 lignes), masques à refaire sur ChaCha20 (Étape 1), et **la boucle de redraw C_PUB est un morceau d'algorithme entier à ajouter**, pas un ajustement de label. |

## 2. Ce que `encodeur.html` appelle exactement, et ce qui casse si le format change

`encodeur.html` n'importe rien de `js/` — ses deux modes stéganographiques
sont des fonctions inline, indépendantes du module porté par ce prompt :

- **Mode classique** (`stegEncode`/`stegDecode`, Référent 256/360, Clé
  B/C/2) : charge `data/referent_256.json` + `data/referent_360.json`
  (ancien format, 155 Ko + 362 Ko). Dérivation de clé PBKDF2(passphrase,
  sel aléatoire 16 octets, 300 000 itérations) — pas un `master_key` brut
  de 32 octets comme côté Python `secu_box`/`carter.py`. AEAD AES-256-GCM,
  nibbles bruts (voir le constat en tête de document).
- **Mode Carter 90×90** (`encodeCarter`/`decodeCarter`, lignes 840–980) :
  même PBKDF2, grammaire dérivée par HKDF avec le salt `'Carter-grammar-v1'`
  (ni même le label de `js/carter_random.js` `'Carter-v2'`, ni celui du
  Python v3) et une structure `{role, form_id, color: blue/orange, orient:
  0-7}` — c'est l'ANCIEN schéma Carter-256 avec orientation D4 et tirage
  d'UNE seule couleur, antérieur même au « référent bariolé » de
  `carter_random.js`. Le v3 Python a supprimé l'orientation D4 et lit
  rouge+bleu ENSEMBLE (règle de lecture v3, `_carter_positions`). Seul
  Carter-256/90×90 est implémenté ici ; le commentaire du fichier le dit
  explicitement (« les variantes 360 et mixte exigent le Référent 360
  complet, pas encore disponible dans /data/ »).

**Ce qui casse si le format serveur change (déjà vrai aujourd'hui, avant
tout travail de ce prompt)** : rien ne casse au sens where "ça marchait
avant" — ces deux modes n'ont jamais été interopérables avec le format v3
Python, ni même avec `js/carter_random.js`. Ils lisent/écrivent un format
qui leur est propre, à trois lignées de distance du serveur actuel. Le
travail de ce prompt (porter `js/crypto_core.js`/`carter_random.js`) ne les
touche pas et ne les corrige pas automatiquement — **Étape 5 dit
explicitement que `encodeur.html` n'est modifié qu'en dernier**, donc ces
deux implémentations inline resteront sur l'ancien format jusque-là, faille
nibble comprise.

## 3. Variantes Carter à couvrir — périmètre proposé

Sept variantes existent côté Python : Carter-256, Carter-360, Carter-Mix,
Carter-Random-90, Carter-Random-360, Carter-18, Carter-Hybrid. Aucune n'est
portée aujourd'hui au format v3 (celle qui s'en rapproche le plus,
Carter-Random dans `js/carter_random.js`, reste sur l'ancien référent
bariolé et sans redraw C_PUB, voir §1).

**Carter-256 seul pour commencer, comme vous le proposez** — c'est aussi
mon choix si la décision m'était laissée, pour trois raisons vérifiées :

1. Référent le plus simple à charger : un seul fichier JSON fixe
   (`data/referent_256_v3.json`, voir §4), pas de génération dynamique à
   porter avant même d'avoir un ChaCha20 qui marche.
2. Grammaire la plus simple : 225 blocs 6×6, un rôle et un `form_id` par
   bloc (`_carter_grammar`), pas de méta-blocs, pas de bascule
   individuel/méta, pas de mode concentrique.
3. Vecteur complet disponible : `carter256-basic-01` dans
   `vectors/carter_v3.json` contient le `grid_csv` intégral (grille
   90×90 entière), donc l'Étape 3 peut comparer bit à bit sans dépendre
   d'un round-trip Python en parallèle.

Carter-360/Mix ajoutent la mécanique des calques (6 tirages par niveau,
référent 12×12) ; Carter-Random ajoute le redraw C_PUB et la génération
ChaCha20 du référent 6×6 ; Carter-18/Hybrid ajoutent la lecture
concentrique et `random.Random(seed)` (MersenneTwister, déjà disponible,
voir §1). Aucune de ces briques n'est requise pour valider l'interopérabilité
de bout en bout sur Carter-256 — elles peuvent suivre une par une sur le
même squelette (Étapes 1–2 communes à toutes les variantes).

## 4. Chargement des référents côté JS

Deux familles bien distinctes côté Python, donc deux stratégies :

- **Référents fixes, dessinés par l'auteur** (Carter-256 = croix ansée,
  Carter-360 = calques Jacquard) : aucune génération possible, il faut
  télécharger les données.
  - `data/referent_256_v3.json` : **524 Ko** (155 Ko pour l'ancien
    `referent_256.json`, déjà chargé par `encodeur.html` aujourd'hui —
    donc pas un poids nouveau de nature, mais 3,4× plus lourd que
    l'existant).
  - `data/referent_360_v3.json` : **574 Ko** (contre 362 Ko pour l'ancien
    `referent_360.json`).
  - Pour Carter-256 seul (périmètre proposé §3) : **524 Ko** à charger,
    aucun autre fichier référent nécessaire.
- **Référents pseudo-aléatoires, dérivés de la clé** (pool 6×6 de
  Carter-Random/Hybrid, référent 18×18 de Carter-18/Hybrid) : générés à la
  volée côté Python (`referent6x6_gen.py` via ChaCha20 ; `get_referent_18`
  via `random.Random(seed)`), **jamais** lus depuis un fichier au moment de
  l'encodage/décodage — même si `data/referent_6x6_index0_v3.json` et
  `data/referent_6x6_index1_v3.json` existent sur disque (508 Ko chacun),
  ce sont des exports d'outillage (`tools/generate_referent_6x6.py`), pas
  un chemin de chargement de production. **Le JS doit faire pareil** :
  génération ChaCha20/MersenneTwister à la volée, zéro fichier JSON pour
  ces variantes — cohérent avec le choix déjà fait par
  `js/carter_random.js` aujourd'hui (`getReferent(seed)` régénère,
  ne télécharge rien).

Pour le périmètre Carter-256 proposé, un seul téléchargement est donc
nécessaire : **524 Ko** (`referent_256_v3.json`), à comparer aux 155 Ko que
`encodeur.html` charge déjà pour l'ancien référent — un poids plus que
doublé, à signaler si la page a une contrainte de temps de chargement.

## Point à trancher avant l'Étape 1

Une préférence a été enregistrée il y a deux jours dans ma mémoire durable :
« quand la référence Python adopte un primitif crypto absent de Web Crypto,
substituer l'équivalent natif le plus proche (AES-256-GCM) plutôt que
d'écrire ChaCha20 à la main » — exactement le choix déjà pris dans
`js/crypto_core.js` et `encodeur.html` aujourd'hui (voir §1, §2). **Ce
document demande explicitement l'inverse** : un ChaCha20/Poly1305/
XChaCha20 pur JS, parce que l'interopérabilité bit-exacte est maintenant
posée comme l'objectif principal (« Une grille encodée dans le navigateur
ne se décode donc pas avec l'outil Python, et réciproquement. C'est le
blocage principal de l'application »). Je note le changement de cap plutôt
que de le découvrir en cours de route : le confirmer avant l'Étape 1 me
suffit pour avancer, ce n'est pas un blocage — le raisonnement du document
(l'interop est maintenant le but, alors qu'elle était jugée sacrifiable
avant) me semble solide et je m'y range si vous confirmez.
