# Chiffres et paramètres empiriques — format v3

La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

> Complète `docs/REFERENT_FORMAT_V3.md` (schéma, règle de lecture,
> validation) avec les mesures EMPIRIQUES : capacités par variante,
> propriétés statistiques, couverture de tests, labels HKDF complets.
> Toutes les mesures de ce document proviennent d'appels DIRECTS aux
> fonctions de PRODUCTION (jamais une réimplémentation séparée) — voir la
> suite `stegano/test_statistical.py` pour le code source de chaque
> mesure, et `docs/REFERENT_FORMAT_V3.md` §7 pour la méthodologie de
> calibration de C_PUB.

## 1. Capacités par variante (min / p1 / p5 / médiane / p95 / max)

Mesuré le 2026-09-12 sur N=3000 clés aléatoires par variante, en appelant
directement `carter_capacity`/`carter360_capacity`/`carter_mix_capacity`
(`carter.py`), `random_capacity`/`carter18_capacity`/
`carter_hybrid_capacity` (`carter_random.py`) — capacité RÉELLE après
redraw (jamais avant recherche de grammaire), pour les référents par
défaut de ce dépôt. Toutes les valeurs sont en **octets** du message
clair encodé UTF-8 (`crypto_core.max_message_for`), comme `C_PUB`.

| Variante | N | min | p1 | p5 | médiane | p95 | max |
|---|--:|--:|--:|--:|--:|--:|--:|
| carter256 | 3000 | 399 | 415 | 440 | 530 | 628 | 710 |
| carter360 | 3000 | 1865 | 1941 | 2034 | 2389 | 2776 | 3235 |
| cartermix | 3000 | 1875 | 1925 | 2028 | 2394 | 2776 | 3240 |
| carter18 | 3000 | 358 | 456 | 677 | 1340 | 2077 | 2888 |
| carterhybrid | 3000 | 259 | 309 | 456 | 898 | 1512 | 2642 |

`min` ≥ `C_PUB[variant]` pour chaque variante (garantie publique — voir
`REFERENT_FORMAT_V3.md` §7) ; les colonnes suivantes montrent l'étalement
réel au-dessus de ce plancher, dû à la variation naturelle du nombre de
blocs `message` tirés par la grammaire d'une clé à l'autre.

### 1.1 Carter-Random — répartition individuel/méta

Carter-Random (90×90 et 180×180) tire, par clé, entre deux régimes de
lecture — **individuel** (bloc à bloc, 6×6) et **méta** (méta-blocs
concentriques 18×18) — et bascule déterministiquement vers celui des deux
qui offre le PLUS de capacité pour cette clé précise (règle CR-1, audit
G. Kerma) : ce n'est donc pas un tirage 50/50, mais une répartition
mesurée empiriquement.

| Grille | N | Individuel | Méta | Individuel : min/p1/p5/méd/p95/max | Méta : min/p1/p5/méd/p95/max | Combiné : min/p1/p5/méd/p95/max |
|---|--:|--:|--:|---|---|---|
| 90×90 (carterrandom90) | 3000 | 2265 (75,5 %) | 735 (24,5 %) | 415/423/448/538/636/726 | 431/431/505/653/874/1095 | 415/431/456/554/726/1095 |
| 180×180 (carterrandom360) | 3000 | 2234 (74,5 %) | 766 (25,5 %) | 2151/2168/2225/2397/2585/2814 | 2200/2274/2348/2642/3158/3601 | 2151/2176/2233/2430/2864/3601 |

Le mode méta offre une capacité MÉDIANE plus élevée que le mode
individuel dans les deux géométries (653 > 538 pour 90×90, 2642 > 2397
pour 180×180) — cohérent avec la règle CR-1 (bascule vers le régime le
plus favorable) : si méta perd presque toujours sur une clé donnée, il
n'est presque jamais choisi ; le fait qu'il apparaisse ~25 % du temps
avec une capacité médiane supérieure montre qu'il l'emporte sur un
sous-ensemble de clés où sa géométrie concentrique rend mieux que le
découpage bloc à bloc.

### 1.2 Carter-Mix — répartition des méta-blocs entre Ref256 et Ref360

Carter-Mix (§1) affiche une capacité médiane (2394) quasiment identique à
Carter-360 seul (2389). Vérifié le 2026-09-12 (mesure dédiée, N=3000
clés, `carter._carter_mix_grammar`/`_mix_positions` appelées directement,
production, jamais réimplémenté) : **le mélange fonctionne toujours** —
ce n'est pas une panne, c'est une conséquence attendue du câblage.

| Mesure | Résultat |
|---|--:|
| Blocs message tirés Ref256 (fraction) | 49,97 % ± 5,78 % (std) |
| Blocs message tirés Ref360 (fraction) | 50,03 % ± 5,78 % (std) |
| Positions totales issues de Ref256 | 50,0 % du total |
| Positions totales issues de Ref360 | 50,0 % du total |
| Positions moyennes / bloc message Ref256 | 48,00 (4 sous-blocs 6×6 × 12, réplication identique) |
| Positions moyennes / bloc message Ref360 | 48,01 (union des violettes, 6 niveaux) |

Le tirage `ref = REF256 si octet<128 sinon REF360` (`carter.py::_carter_
mix_grammar`) reste un tirage 50/50 sans biais, intact. Ce qui a changé,
c'est qu'**avant le câblage production, Ref256 et Ref360 ne rendaient PAS
le même nombre de positions stégano par bloc** (ancien schéma : une seule
couleur lue, comptage différent selon le référent) — Carter-Mix
produisait alors une capacité dépendant réellement de LA PROPORTION de
blocs tirés de chaque référent pour une clé donnée. Depuis que la règle
de lecture v3 fait converger les deux référents vers ~48 positions/bloc
chacun (rouge+bleu ensemble pour Ref256, union multi-niveaux pour
Ref360), **mélanger les deux à 50/50 produit une distribution de
capacité statistiquement indiscernable de Carter-360 seul** — la variable
"quel référent tire ce bloc" n'a presque plus d'effet sur la capacité
totale, seulement sur la forme géométrique de chaque bloc. Ce n'est donc
plus un mélange de deux capacités différentes, mais un mélange de deux
GÉOMÉTRIES à capacité équivalente — une réduction réelle, mais attendue,
de ce que Carter-Mix apporte par rapport à Carter-360 seul en termes de
capacité (la valeur ajoutée de Carter-Mix reste entière du point de vue
de l'indistinguabilité géométrique : un observateur ne sait toujours pas,
sans clé, si un bloc donné vient de Ref256 ou de Ref360).

## 2. Propriétés statistiques (indistinguabilité, avalanche, dérivation)

Mesuré le 2026-09-12 (`stegano/test_statistical.py`, suite complète
verte, scipy installé — aucun test statistique sous scipy skippé dans
cet environnement).

### 2.1 Entropie / uniformité par variante

| Variante | H (bits/cellule) | E[V] | Std | Valeurs uniques |
|---|--:|--:|--:|--:|
| Carter 256 | 5,4561 | 21,30 | 12,71 | 44 |
| Carter 360 | 5,4585 | 21,51 | 12,73 | 44 |
| Carter Mix | 5,4587 | 21,49 | 12,78 | 44 |
| Random 90 | 5,4558 | 21,62 | 12,67 | 44 |
| Random 360 | 5,4583 | 21,57 | 12,69 | 44 |
| Carter-18 | 5,4552 | 21,83 | 12,63 | 44 |
| Carter-Hybrid | 5,4562 | 21,63 | 12,70 | 44 |
| **Idéal (uniforme, 44 symboles)** | **5,4594** | **21,50** | **12,70** | **44** |

### 2.2 Chi² d'indistinguabilité (grille vs. bruit uniforme)

Seuil retenu : α=0,001, df=43 → chi²≤77,42 (α=0,05 → 59,3, réservé pour
comparaison). `échecs` = nombre de tirages (sur 10) dépassant le seuil.

**Correction (2026-09-12) :** Carter-360 et Carter-Mix n'avaient jusqu'ici
AUCUN test chi² dédié dans la suite — seul Carter-256 en avait un
(`test_chisq_carter_256`, χ² moyen jamais imprimé, seul `p` moyen
l'était). Corrigé : `stegano/test_statistical.py::TestChiSquare` factorise
maintenant la mesure (`_run`) et l'applique aux trois variantes, avec le
χ² moyen exposé pour chacune.

| Variante | chi² moyen | p moyen | Échecs/tirages |
|---|--:|--:|--:|
| Carter 256 | 45,7 | 0,458 | 0/10 |
| Carter 360 | 45,5 | 0,439 | 0/10 |
| Carter Mix | 37,6 | 0,674 | 0/10 |
| Random 90 | 40,3 | 0,591 | 0/10 |
| Random 360 | 45,6 | 0,445 | 0/10 |
| Carter-18 | 37,4 | 0,658 | 0/10 |
| Carter-Hybrid | 41,0 | 0,552 | 0/10 |

### 2.3 Autres propriétés (Carter-256, sauf mention contraire)

| Propriété | Mesure | Attendu |
|---|---|---|
| Autocorrélation spatiale (max_r) | 0,0100 | < 2/√8100 = 0,0222 |
| Sensibilité à la clé (XChaCha20-Poly1305) | mean=0,495 | ~0,50 |
| Avalanche de grammaire (Carter-256) | mean=0,437 | > 0,35 |
| Avalanche de grammaire (Carter-18) | mean=0,395 | > 0,35 |
| Avalanche de grammaire (Carter-Hybrid) | mean=0,465 | > 0,35 |
| Avalanche de grammaire (moyenne globale) | mean=0,453 | ~0,44 (théorique) |
| Avalanche message (cellules message) | mean=0,978 (n=12) | > 0,20 |
| Avalanche message (symboles) | mean=0,981 | > 0,80 |
| Entropie XChaCha20-Poly1305 (bit à bit) | 0,9999 bits/bit (prop. 1 = 0,4946) | ~1,0 |
| Longueur masquée (1 vs 49 car.) | 8 paires, n=6936, chi²=41,4, p=0,5425 | p non significatif |
| PtS chi² (nbytes=32, m=59, N=3000) | chi²=50,4, p=0,2038 | p non significatif |
| Corrélation série | chi²=37,6, df=1849, ratio=0,020 | ratio < 1 |
| Deux grilles (msgs différents, même clé) | 8 paires, n=7704, chi²=43,6, p=0,4444 | p non significatif |
| Round-trip Carter-18 | 20/20 clés valides, 0 échec | 0 échec |
| Round-trip Carter-Hybrid | 20/20 clés valides, 0 échec | 0 échec |
| Round-trip Carter-Random (30/100/150 car.) | 0,0 % refus (0/500 clés, les 3 longueurs) | < 2 % à 30 car. |

**Corrections (2026-09-12), deux libellés et une mesure :**

- « ChaCha20-HKDF » (sensibilité à la clé, entropie) renommé
  « XChaCha20-Poly1305 » : nom hérité de l'ANCIENNE construction à
  sous-clé dérivée par HKDF, remplacée par HChaCha20 natif
  (draft-irtf-cfrg-xchacha, `crypto_core.hchacha20`/`_xchacha20_enc`,
  tâche 1 du format v3). La mesure elle-même portait déjà sur la
  construction ACTUELLE — seul le nom était périmé. « Avalanche message
  (symboles) » reste correctement attribuée à « XChaCha20-Poly1305 +
  masques HKDF » : les MASQUES, contrairement au chiffrement, utilisent
  bien HKDF (`_derive_masks`) — ce n'est pas la même construction que le
  chiffrement du message, et son nom était déjà correct.
- **Avalanche message (cellules message) : 1,270 → 0,978, bug corrigé.**
  Une proportion ne peut pas dépasser 1 — c'était un bug de test, pas une
  propriété du système. `test_avalanche_message_bits` calculait son
  dénominateur (`n_msg_positions`, le nombre de positions message) via
  `_carter_grammar()` seule (la grammaire BRUTE au compteur de redraw
  ctr=0), alors que les grilles comparées sont produites par
  `encode_carter()`, qui applique en interne la recherche de redraw
  (`_find_grammar_with_c_pub`, tâche 4) : pour une clé dont le tirage
  ctr=0 est sous C_PUB=399 (environ la moitié des clés aléatoires, voir
  §1 — c'est le mécanisme même qui garantit `min ≥ C_PUB`), le VRAI
  n_pos utilisé par `encode_carter()` est plus grand que celui calculé
  par le test, et le nombre de cellules différentes (compté sur les
  grilles réelles, donc sur le vrai n_pos) peut dépasser ce dénominateur
  trop petit. Corrigé en dérivant `n_msg_positions` via
  `carter_capacity()['nibbles']`, qui reflète le n_pos RÉEL après redraw
  — la même valeur qu'utilise `encode_carter()`. La valeur corrigée
  (0,978) est cohérente avec ce que le test cherche à démontrer : un
  seul bit de message change TOUT le commitment (32 octets HMAC-SHA256)
  et TOUT le tag Poly1305 (16 octets) en plus de l'octet de texte chiffré
  lui-même, un avalanche quasi total sur les cellules message.

Ces mesures varient légèrement d'un lancement à l'autre (tirages
aléatoires, pas de graine fixe) : les valeurs ci-dessus sont celles d'un
lancement représentatif de la suite verte au 2026-09-12 (post-corrections
ci-dessus), pas des constantes figées — seuls les SEUILS (attendu) sont
contractuels.

## 3. Couverture de tests

| Fichier | Tests | Contenu |
|---|--:|---|
| `stegano/test_regression.py` | 49 | Vecteurs XChaCha20, dérivation de clés, grammaire Carter, format payload, fixtures, round-trip de bout en bout, variantes classiques, C_PUB |
| `stegano/test_statistical.py` | 32 | Entropie, chi² (256/360/Mix/Random90/360/18/Hybrid), avalanche, autocorrélation, corrélation série, capacité Carter-Random (individuel/méta) |
| `stegano/test_sweep.py` | 12 | Balayages (8), `derive_sweep_index`, `sort_by_sweep`, `crypto_reading_order` |
| `stegano/test_referent_360_v3.py` | 11 | Structure du référent 360, `c_pub` absent, `referent_id` stable |
| `stegano/test_referent6x6_v3.py` | 9 | Génération ChaCha20 (256 référents), `select_referent_index`, `c_pub` absent |
| `stegano/test_vectors_regeneration.py` | 9 | Régénération bit-exacte de `vectors/carter_v3.json`, décodage depuis grille régénérée/stockée (256, 360 et déni auto-contenus) |
| `stegano/test_vectors_isolation.py` | 8 | Chargeur unique du référent 360, comportement par défaut inchangé sans injection |
| **Total `stegano/`** | **130** | |
| `secubox/test_secu_box.py` | 15 | Identités X25519, session authentifiée, déni plausible (structure, statistique, round-trip) |
| **Total `secubox/`** | **15** | |
| `stegano/legacy/test_grid_90.py` | 4 | grid_90.py (hors production, voir §"Hors périmètre" de REFERENT_FORMAT_V3.md) |
| **Total général** | **149** | |

Aucun test marqué `skip` dans cette suite au 2026-09-12 (scipy installé
dans cet environnement — les branches `skipTest("scipy non installe")`
ne se déclenchent jamais ici, mais existent pour un environnement qui ne
l'aurait pas).

## 4. Labels HKDF (domaines de dérivation, `crypto_core.LABELS`)

Convention : `salt = 'Carter-<variante>-v3'` (ou `'commit-v3'` pour le
key commitment, partagé par tous les schémas — classique, Carter,
`grid_90` legacy) ; `info` = but précis de CETTE dérivation, distinct
pour toute paire (variante, but). Centralisés dans
`stegano/crypto_core.py::LABELS` pour que LH-5 les reprenne tels quels.

```python
LABELS = {
    'commit': {
        'salt': b'commit-v3', 'info': b'key-commitment',
    },
    'carter256': {
        'split_salt': b'Carter-256-v3', 'encrypt_info': b'encrypt',
        'grammar_info': b'grammar',
        'grammar_content_salt': b'Carter-256-grammar-v3',
        'grammar_content_info': b'block-roles-and-forms',
    },
    'carter360': {
        'split_salt': b'Carter-360-v3', 'encrypt_info': b'encrypt',
        'grammar_info': b'grammar',
        'grammar_content_salt': b'Carter-360-grammar-v3',
        'grammar_content_info': b'block-roles-360-forms',
        'niveau_calque_salt': b'Carter-360-niveau-calque-v3',
        'niveau_calque_info': b'niveau-calque-index',
    },
    'cartermix': {
        'split_salt': b'Carter-mix-v3', 'encrypt_info': b'encrypt',
        'grammar_info': b'grammar',
        'grammar_content_salt': b'Carter-mix-grammar-v3',
        'grammar_content_info': b'mixed-256-360-grammar',
        'niveau_calque_salt': b'Carter-mix-niveau-calque-v3',
        'niveau_calque_info': b'niveau-calque-index',
    },
    'carterrandom': {
        'params_salt': b'Carter-random-params-v3', 'params_info': b'seed-and-mode',
        'grammar_individual_salt': b'Carter-random-v3',
        'grammar_individual_info': b'grammar-individual',
        'grammar_meta_salt': b'Carter-random-meta-v3',
        'grammar_meta_roles_info': b'meta-roles',
        'grammar_meta_forms_info': b'block-forms',
    },
    'carter18': {
        'grammar_salt': b'Carter-18-v3', 'grammar_info': b'grammar-18',
        'seed_salt': b'Carter-18-seed-v3', 'seed_info': b'seed',
    },
    'carterhybrid': {
        'grammar_salt': b'Carter-hybrid-v3', 'grammar_info': b'grammar-hybrid',
        'seed18_salt': b'Carter-hybrid-seed-v3', 'seed18_info': b'seed-18',
        'seed6_salt': b'Carter-hybrid-seed6-v3', 'seed6_info': b'seed-6',
        'subblock_salt': b'Carter-hybrid-sub-v3',
    },
    'mask_seed': {
        'salt': b'Carter-masks-v3',
        'info_carter256': b'position-masks-carter256',
        'info_carter360': b'position-masks-carter360',
        'info_cartermix': b'position-masks-cartermix',
        'info_random': b'position-masks-random',
        'info_18': b'position-masks-18',
        'info_hybrid': b'position-masks-hybrid',
        'info_deniable': b'position-masks-deniable',
    },
    'sweep': {
        'salt': b'Carter-sweep-v3',
    },
    'referent6x6': {
        'salt': b'Carter-referent6x6-v3', 'select_info': b'select',
    },
    'redraw': {
        'carter256': b'Carter-256-redraw-v3', 'carter360': b'Carter-360-redraw-v3',
        'cartermix': b'Carter-mix-redraw-v3', 'carterrandom': b'Carter-random-redraw-v3',
        'carter18': b'Carter-18-redraw-v3', 'carterhybrid': b'Carter-hybrid-redraw-v3',
    },
}
```

Notes :

- `mask_seed` : POINT D'ENTRÉE labellisé, partagé par les 6 variantes
  Carter ET le déni plausible via `_derive_masks()` — chacune avec son
  propre domaine `info_*`. Avant le câblage de ce pipeline unique,
  Carter-256/360/Mix n'écrivaient AUCUN masque (vérifié par `git log -S`
  sur le tag `v2-final`), contrairement à Random/18/Hybrid/déni.
  `info_deniable` est le SEUL des sept domaines de masque lu par
  `secu_box.py` — voir `docs/REFERENT_FORMAT_V3.md` pour la distinction
  entre mode stégano et mode crypto.
- `redraw` : Random 90 et Random 360 PARTAGENT la même racine
  (`'carterrandom'`) — `grid_size` n'est pas secret et influence déjà la
  dérivation en aval via `_derive_params(grammar_key_ctr, grid_size)`,
  inutile de le dupliquer dans le label.
- `referent6x6` : deux dérivations DISTINCTES partagent ce salt racine,
  séparées par leur `info` — génération d'un référent `n` (IKM public
  fixe, aucun secret) vs. sélection du référent à l'encodage (depuis
  `gk`, secret) — voir `docs/REFERENT_FORMAT_V3.md` §4.1 et
  `stegano/referent6x6_gen.py`.
- Labels HORS de `crypto_core.LABELS`, non centralisés (périmètre
  différent, pas des dérivations Carter/référent) : la sous-clé
  XChaCha20/HChaCha20 (`salt=nonce[:16]`, `info=b'XChaCha20-HChaCha20-
  subkey'`, construction standard de l'extension de nonce) et
  `'SecuBox-Pending-v1'`/`'ephemeral-at-rest'` (chiffrement au repos
  d'une session en attente, `secu_box.py` — sans rapport avec les
  référents).

## 5. Choix du référent 6×6 parmi les 256

Depuis la décision de l'auteur du 2026-09-12, il existe **256 référents
6×6 aléatoires**, indexés `n ∈ [0, 255]`, générés par l'algorithme
normatif de `stegano/referent6x6_gen.py` (ChaCha20, remplace le Mersenne
Twister — voir ce module pour la spécification complète de la
génération elle-même). Cette section documente uniquement **le choix
DE QUEL référent utiliser** pour un encodage donné — une dérivation
distincte de la génération des référents.

### 5.1 Dérivation

```
selection_key = HKDF-SHA256(IKM=gk, salt='Carter-referent6x6-v3',
                             info='select', length=1)
index_referent = selection_key[0]        # ∈ [0, 255]
```

où `gk` est la clé de grammaire (`grammar_key`, secrète) déjà dérivée de
la clé maître pour la variante Carter concernée — la même clé qui pilote
déjà le reste de la grammaire (rôles de blocs, formes, masques). Aucune
nouvelle clé secrète n'est introduite : la sélection du référent est
juste une sortie HKDF supplémentaire de `gk`, domaine-séparée par
`info='select'` de toutes les autres dérivations qui en partent.

### 5.2 Pourquoi un seul octet, sans réduction modulo

`HKDF-Expand` avec une longueur de sortie demandée de **1 octet** produit
directement une valeur dans `[0, 255]` — c'est-à-dire exactement l'espace
des 256 index de référent possibles (`256 = 2⁸`). Il n'y a donc **aucune
réduction modulo à appliquer** : l'octet obtenu EST l'index, tel quel.

C'est une différence importante avec les autres tirages uniformes de ce
document (masques de position, formes des référents eux-mêmes, choix
d'une cellule parmi N < 256 valeurs) qui, eux, tirent un octet dans
`[0, 255]` puis DOIVENT rejeter les valeurs `≥ limit` (où
`limit = 256 − 256 % N`) avant de réduire par `% N`, sous peine d'un
léger biais modulo (les valeurs `< 256 % N` seraient sur-représentées).
Ici, `N = 256` exactement : `256 % 256 = 0`, donc `limit = 256` — AUCUN
octet ne serait jamais rejeté même si on appliquait la même règle. Le
faire quand même n'introduirait pas d'erreur, mais ajouterait du code de
rejet qui ne rejette jamais rien ; le tirage direct est aussi correct et
plus simple. Voir `stegano/referent6x6_gen.py::select_referent_index()`
pour l'implémentation.

### 5.3 Portée actuelle

Câblée en production depuis le 2026-09-12 : `carter_random.py`
(`_derive_params`, choix du référent 6×6 pour Carter-Random individuel/
méta) et `_carter_hybrid_seeds` (côté 6×6 de Carter-Hybrid MODE_6)
appellent `select_referent_index()` ; `secu_box.py` (`_deniable_positions`,
mode déni) l'appelle aussi directement, indépendamment de
`carter_random.py`. Testée par
`stegano/test_referent6x6_v3.py::TestSelectReferentIndex` et par les
suites de régression/vecteurs de chaque appelant.

Carter-18 (`_carter18_seed`) et le côté 18×18 de Carter-Hybrid restent en
dehors : ils choisissent leur propre référent 18×18 parmi les 10
`SEEDS` historiques (`carter_random.py`), un système de référent
entièrement distinct sans notion de couleur, que cette règle ne couvre
pas.

## 6. Recalibration C_PUB après le câblage production (2026-09-12)

Le câblage de la nouvelle règle de lecture (référent en paramètre — voir
les commits « Câblage production, étape N/10 ») fait passer les positions
stégano lues par bloc de 6 (une seule couleur, ancien schéma) à 12
(rouge+bleu ensemble, référent v3) pour Carter-256/360/Mix/Random, et de
6 à 12 par sous-bloc pour Carter-Hybrid MODE_6 — la capacité réelle
double approximativement pour ces six variantes. Les C_PUB antérieurs
(choisis pour l'ancienne géométrie) sont donc restés valables mais très
en-deçà de la capacité réellement atteignable : ils ont été recalibrés
par `tools/recalibrate_carter_v3.py`, avec la MÊME méthode que
l'étalonnage initial du 2026-09-11 (plus grand C_PUB tel que le taux de
**redraw** — pas le taux d'échec — reste < 1 % sur 10 000 clés), mais en
appelant directement les fonctions de recherche de grammaire de
PRODUCTION (`_find_*_grammar_with_c_pub`, `C_PUB` temporairement
substitué puis restauré), jamais une réimplémentation séparée.

| Variante          | C_PUB avant | C_PUB après | Facteur |
|-------------------|------------:|------------:|--------:|
| carter256         |         150 |         399 |   ×2,66 |
| carter360         |         230 |        1861 |   ×8,09 |
| cartermix         |         500 |        1872 |   ×3,74 |
| carterrandom90    |         150 |         415 |   ×2,77 |
| carterrandom360   |        1000 |        2144 |   ×2,14 |
| carterhybrid      |         100 |         246 |   ×2,46 |
| carter18          |         350 |         350 |    ×1,00 (inchangé, hors périmètre) |

Carter-360 gagne le plus (×8,09) parce que l'ancien tirage à une seule
couleur (C1/C2/C3) parmi 294 formes plates rendait 0 position pour 44,9 %
des blocs message (voir le commit de câblage étape 3) — un défaut
corrigé par la même occasion que le changement de règle, pas seulement
un doublement de capacité comme pour les autres variantes.

Toutes les valeurs sont en OCTETS du message encodé UTF-8 (voir
`crypto_core._message_to_bytes`), comme les C_PUB originaux.

**Depuis (2026-09-12, correction de conception) :** `c_pub` n'est plus un
champ du référent, et la méthode de calibration a été scindée selon que
la variante reçoit un référent explicite (`tools/calibrate_referent.py`
— carter256/360/mix, couple référent×variante) ou sélectionne son
référent par clé dans un pool (`tools/recalibrate_carter_v3.py`,
inchangé — carterrandom90/360, carterhybrid) — voir
`docs/REFERENT_FORMAT_V3.md` §6-7 pour le détail et la justification.
