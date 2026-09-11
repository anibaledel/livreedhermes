# Inspection v3 — état du code au regard de `carter_v6_fixes.tex`

Base : HEAD `4663ed0`. Aucune modification de code dans ce document — lecture seule (Tâche 0).

## 1. `PayloadToSymbols` aujourd'hui

Deux fonctions distinctes dans `stegano/crypto_core.py`, pas une seule :

- **`_bytes_to_syms(b, m)`** (payload) implémente déjà exactement le mécanisme de la
  Définition 3.6 (Bloc B) : `span = 2^(8·len(b))`, `k = α^m // span`,
  `u = int(b) + span·randbelow(k)`, sortie = `m` chiffres base-α de `u`
  (poids faible en premier via `divmod` répétés). C'est la même bijection
  `(x,y) ↦ x + 2^k·y` que la Définition 3.6, à ceci près que `m` est fixé
  en amont par `_sym_count()` plutôt que dérivé de `k` et `λ_s` par la
  formule entière recommandée — `_sym_count` fait `math.ceil(...)` en
  flottant (`math.log2`), pas une recherche entière. Écart mineur sur la
  méthode de calcul de `m`, pas sur la construction elle-même.
- **`_header_to_syms(length)` / `_syms_to_header(syms)`** (en-tête, ajout
  N1) : construction séparée, `u = length·k + randbelow(k)` avec
  `k = α^_SYM_HEADER // 2^32` choisi multiple de `α²` — ferme le biais
  11/44 sur les 2 symboles de poids faible, mais **la longueur reste un
  champ distinct, positionné en tête du flux, récupérable en clair par
  quiconque localise ces symboles** (c'est-à-dire quiconque a la
  grammaire — donc la clé). Voir §3.

**Code en nibbles restant : aucun** fonctionnellement — mais le nom de
variable `nibbles` (pour des symboles base-44, valeurs 0–43) subsiste
partout dans `carter.py`, `carter_random.py`, `secu_box.py`
(`encode_deniable`/`place`). Purement cosmétique, aucun impact sur les
valeurs, mais trompeur à la lecture et à corriger si la Tâche 2 renomme
le flux de toute façon.

## 2. Dérivation des masques

`_derive_masks(grammar_key, n)` existe **uniquement dans
`carter_random.py`** (pas dans `carter.py`, référent fixe — pas de
masque du tout là) :

```python
state = hashlib.sha256(grammar_key + b'position-masks-v1').digest()
# puis chaînage SHA-256(state) avec rejet vers [0, ALPHA_LEN)
```

Ce n'est **pas** un HKDF : c'est un chaînage SHA-256 direct, clé
implicite par concaténation (`grammar_key || b'position-masks-v1'`),
pas de paramètre `info` séparé au sens HKDF. La séparation de domaine
avec la grammaire elle-même repose sur le suffixe littéral
`'position-masks-v1'` étant distinct des `info=` HKDF utilisés par
`_grammar_individual`/`_grammar_meta` (`'grammar-individual'`,
`'meta-roles'`, `'block-forms'`, etc., eux en HKDF avec `salt=`
distinct type `b'Carter-random-v3'`/`b'Carter-meta-v3'`) — labels
distincts en pratique, mais deux mécanismes de dérivation différents
(SHA-256 chaîné vs HKDF) coexistent pour deux usages voisins. À
unifier si la Tâche 3 centralise les labels.

## 3. Où et comment la longueur est-elle encodée

En tête du flux de symboles (`_SYM_HEADER` premiers symboles), via
`_header_to_syms`/`_syms_to_header` (§1).

**Réponse directe à la question posée : N1 rend l'en-tête EXACTEMENT
UNIFORME (sur les 2 symboles de poids faible, statistiquement — preuve
arithmétique, pas asymptotique), mais NE LE REND PAS SECRET.**

- *Uniforme* : oui, précisément. `_HEADER_SLOTS` (= `k` dans
  `_header_to_syms`) est construit multiple de `44²`, donc le terme
  `length·k` s'annule exactement mod 44 et mod 44² quel que soit
  `length` — les 2 symboles de poids faible ne dépendent QUE du
  rembourrage aléatoire, pas de la longueur. Ce n'est pas "moins
  biaisé", c'est une uniformité exacte démontrable (voir le message
  précédent où j'ai détaillé la preuve), et `TestHeaderUniformity`
  (44/44 valeurs observées) le confirme empiriquement.
- *Secret* : non. Une fois les symboles de l'en-tête localisés (ce qui
  exige la grammaire, donc la clé — un observateur sans clé ne sait
  même pas où regarder), la valeur `length` se récupère directement par
  `u // _HEADER_SLOTS`, sans dépendre d'aucune propriété
  cryptographique de `Π`. Le champ existe en dehors du payload chiffré,
  protégé uniquement par l'argument arithmétique ci-dessus — pas par
  l'IND$-CPA de `Π` (Assumption 2 / Hypothèse 2).

Le Bloc B ferme ce point en supprimant le champ séparé : la longueur
est chiffrée *à l'intérieur* du payload à taille fixe, donc protégée
par la même preuve IND$-CPA que le reste du message, et aucun champ
"longueur" distinct ne subsiste dans le flux de symboles. C'est un
changement d'architecture, pas un durcissement de N1 — les deux
mécanismes sont mutuellement exclusifs (le Bloc B élimine le besoin
même du champ que N1 protège). **Décision en attente (Tâche 2, comme
demandé) : remplacer `_header_to_syms`/`_syms_to_header` par la charge
utile à longueur fixe du Bloc B, ce qui supprime N1 en le rendant
inutile plutôt qu'en le corrigeant davantage.**

## 4. Schéma de déni — `Br`/`Bd` — **divergence probable, voir §6**

Fonction : `_derive_block_sequence(steg_key, counter, n_blocks)` dans
`secubox/secu_box.py`, HKDF(`salt=b'deniable-v3'`,
`info=b'deniable-blocks-v3-' + counter`) + Fisher–Yates.

**Confirmé : `Bd` ne dépend PAS du flux HKDF de `dsk` avec saut des
indices de `Br`** — ce n'était le cas que dans l'ancienne v2
(`_derive_block_order` avec `exclude=`), déjà remplacée. Chaque
`(dsk, counter)` produit une permutation complète et indépendante,
rien n'est filtré depuis un flux canonique commun. La faille v2
précise décrite dans la Remarque du Bloc C ("Why the v5 construction
was not deniable") **n'existe pas** dans le code actuel.

**Mais** `encode_deniable` fait ceci :

```python
r_counter = 0
real_seq  = _derive_block_sequence(rsk, r_counter, n_blocks)
real_set  = set(real_seq[:n_real])
for d_counter in range(65536):
    duress_seq = _derive_block_sequence(dsk, d_counter, n_blocks)
    if not real_set & set(duress_seq[:n_duress]):
        break
duress_keys = {'steg_key': dsk, 'counter': d_counter, ...}
```

`d_counter` est **cherché** jusqu'à disjonction avec `real_set`, puis
**stocké dans `dk_d`** (`duress_keys['counter']`). Voir §6 — c'est ce
qui divergerait de la Définition 1 révisée.

## 5. Comportement en cas de dépassement de capacité

`carter18_fits`/`carter_hybrid_fits`/`random_fits` (et l'équivalent
`carter_capacity`/`carter360_capacity`/`carter_mix_capacity` dans
`carter.py`) sont des fonctions séparées, appelées *avant* l'encodage
par l'appelant (CLI, démo JS) — mais `encode_carter*`/
`encode_carter_random*` font aussi leur propre vérification interne
(`if len(nibbles) > cap: raise ValueError(...)`) **avant toute
écriture dans la grille** : confirmé, aucune grille partielle n'est
jamais retournée, l'exception est levée avant le premier `grid[gr][gc]
= ...`.

**Mais** la capacité elle-même est **dépendante de la clé** (mode
individuel vs méta, CR-1/CR-1b) et **aucune borne publique `C_PUB`
n'existe** : un message qui échoue sur une clé peut réussir sur une
autre, et l'échec est une `ValueError` explicite et observable
(affichée telle quelle par `secu_box_cli.py`, `carter-demo.html`). Un
correspondant qui contrôle les messages envoyés à une clé fixe peut en
principe faire une recherche dichotomique sur la capacité exacte et
apprendre quelque chose sur `gk` (mode, nombre approximatif de blocs
message) — exactement le canal que le Bloc D signale
("Capacity and encoding failures"). La Tâche 4 (`C_PUB` + redérivation
par compteur jusqu'à satisfaction) n'existe pas dans le code actuel :
travail neuf, pas de conflit avec l'existant.

## 6. Labels HKDF — liste complète

| Fichier | salt | info |
|---|---|---|
| crypto_core.py | (nonce[:16], par appel) | `XChaCha20-HChaCha20-subkey` |
| crypto_core.py | `commit-v1` | `key-commitment` |
| carter.py (256) | `Carter-v2` | `encrypt` / `grammar` |
| carter.py (256 grammaire) | `Carter-grammar-v1` | `block-roles-and-forms` |
| carter.py (360) | `Carter360-v2` | `encrypt` / `grammar` |
| carter.py (360 grammaire) | `Carter360-grammar-v1` | `block-roles-360-forms` |
| carter.py (Mix) | `CarterMix-v2` | `encrypt` / `grammar` |
| carter.py (Mix grammaire) | `CarterMix-v1` | `mixed-256-360-grammar` |
| carter_random.py (split) | *(hérité de carter.py `Carter-v2`, même fonction `_carter_split`)* | |
| carter_random.py (params) | `Carter-params-v3` | `seed-and-mode` |
| carter_random.py (grammaire ind.) | `Carter-random-v3` | `grammar-individual` |
| carter_random.py (grammaire méta) | `Carter-meta-v3` | `meta-roles` / `block-forms` |
| carter_random.py (masques) | *(SHA-256 chaîné, pas HKDF)* | `position-masks-v1` (suffixe concaténé) |
| carter_random.py (Carter-18 grammaire) | `Carter-18-v1` | `grammar-18` |
| carter_random.py (Carter-18 seed) | `Carter-18-seed-v1` | `seed` |
| carter_random.py (Hybrid grammaire) | `Carter-hybrid-v1` | `grammar-hybrid` |
| carter_random.py (Hybrid sous-blocs) | `Carter-hybrid-sub` | `bytes([br18, bc18])` *(par appel, pas un label fixe)* |
| carter_random.py (Hybrid seed 18/6) | `Carter-hybrid-seed` / `Carter-hybrid-seed6` | `seed` / `seed6` |
| secu_box.py (identité) | *(salt n[:16] par appel)* | `XChaCha20-HChaCha20-subkey` |
| secu_box.py (pending) | `SecuBox-Pending-v1` | `ephemeral-at-rest` |
| secu_box.py (déni, `_derive_block_sequence`) | `deniable-v3` | `deniable-blocks-v3-<counter 4B>` |
| vault_lib.py | *(salt nonce[:16])* | `XChaCha20-HChaCha20-subkey` |

**Observation :** `crypto_core._chacha20_hkdf_enc`, `secu_box.py`
(identité + session), et `vault_lib.py` **dupliquent tous les trois**
la même construction HKDF-subkey avec le même `info` littéral
(`XChaCha20-HChaCha20-subkey`) — trois implémentations indépendantes
du même calcul plutôt qu'une primitive partagée. Pas un problème de
sécurité en soi (labels identiques par construction, pas par accident),
mais la Tâche 1 (vrai XChaCha20/HChaCha20) touchera ces trois
fichiers séparément si elle n'est appliquée qu'à `crypto_core.py`.

Pas de collision de label observée par ailleurs.

---

## Divergence majeure signalée (règle "arrête-toi et signale-le")

**Le schéma de déni actuel (LH-2 v3, mergé il y a plusieurs commits)
diverge probablement de la Définition 1 révisée (Bloc C), sur un point
différent de la faille v2 déjà documentée :**

La Définition 1 révisée exige que la partition `π` (donc `B_d`) soit
tirée **indépendamment de `rsk` et `dsk`**, précisément pour que la loi
de `(G, dk_d)` soit identique dans les mondes `b=1` et `b=0` (preuve du
Théorème 1, jeu `H_2`). Dans le code actuel, `d_counter` — stocké tel
quel dans `dk_d`, donc dans la vue de l'adversaire — est choisi par une
**recherche qui dépend de `real_set`**, donc de l'existence et de la
taille du message réel :

- Si aucun message réel n'existait (monde `b=0`, non implémenté
  aujourd'hui mais c'est précisément le mode que Remarque (ii) du Bloc C
  exige d'offrir pour que la déniabilité ait un sens), `real_set` serait
  vide et `d_counter = 0` réussirait **systématiquement au premier
  essai**.
- Quand un message réel existe et occupe une fraction significative des
  225 blocs (typiquement ~50 % pour un message de taille moyenne),
  trouver par hasard une permutation entièrement disjointe dès
  `counter = 0` est statistiquement improbable — `d_counter` sera donc
  presque toujours `> 0`, et généralement d'autant plus grand que
  `real_set` est grand.

**`d_counter` (dans `dk_d`, donc observable par le coerceur) a donc une
loi différente selon qu'un message réel existe ou non** — c'est
exactement le type de signal que la construction "π indépendante" du
Bloc C élimine. Je ne l'ai pas quantifié précisément (pas de borne
calculée sur l'avantage distinguant qu'offre ce signal), et il est
possible qu'il soit négligeable en pratique pour de petits messages —
mais ça ne correspond pas à la propriété prouvée par le Théorème 1
révisé, et l'API actuelle n'offre de toute façon aucun mode
`Den.Encode0` pour que la question se pose en usage réel.

**Second point, plus direct :** `encode_deniable` n'a pas de mode
"un seul message, l'autre absent" — les deux paramètres
`real_message`/`duress_message` sont obligatoires. Sans mode
`Den.Encode0` réellement exposé et utilisable, la déniabilité n'a pas
de sens opérationnel (Remarque (ii) du Bloc C) : même avec un schéma
prouvé sûr, si tout grillage en circulation porte structurellement
deux messages, le fait même de détenir `dk_d` révèle qu'un `dk_r`
existe.

**Mise à jour après la version corrigée du prompt** : la Tâche 5
demande explicitement qu'"aucune dérivation de position n'utilise
dsk" et que `Br`/`Bd` viennent d'un tirage de `π` indépendant des
deux clés, stocké directement dans `dk_r`/`dk_d` (pas de `counter`
recalculé). C'est exactement ce qui règle la fuite décrite ci-dessus
: en remplaçant `_derive_block_sequence(dsk, counter, ...)` +
recherche par `π` indépendant, il n'y a plus de `counter`
dsk-dépendant à stocker, donc plus de signal de ce type possible. Je
ne traite donc plus ceci comme une divergence bloquante mais comme la
confirmation que la Tâche 5 est nécessaire telle que spécifiée (pas
une simple extension de LH-2 v3) : remplacement complet de
`_derive_block_sequence`/du mécanisme par compteur, pas une
modification incrémentale.

## Autres points sans divergence identifiée

- Task 0 Q1/Q3 : écart d'architecture (Bloc B) mais pas de contradiction —
  travail neuf (Tâche 2).
- Q5 : `C_PUB` absent mais pas de contradiction — travail neuf (Tâche 4).
- Q6 : labels distincts en pratique, pas de collision, mais dérivation
  du masque hors HKDF et triplication de la construction XChaCha20-HKDF
  à centraliser (Tâche 1 et 3).
