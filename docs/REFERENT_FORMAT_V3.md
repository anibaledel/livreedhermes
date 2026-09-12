# Format de référent v3

La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

> Base de spécification pour LH-5 (interopérabilité multi-implémentation).
> Décrit le format DÉCLARATIF de référent introduit par le câblage
> production du 2026-09-12 : le référent (quel qu'il soit) est un
> PARAMÈTRE d'exécution, lu par le code, jamais une valeur supposée à
> l'avance. Trois instances existent aujourd'hui dans ce dépôt — le
> référent 256 du livre, le référent 360 de l'auteur, le pool de 256
> référents 6×6 aléatoires — mais rien dans le format ne leur est
> spécifique : un référent personnalisé futur, respectant ce document et
> validé par `tools/validate_referent.py`, doit être utilisable sans
> modifier le code de lecture (`stegano/sweep.py`, `stegano/carter.py`,
> `stegano/stegano_classic.py`).

## 1. Vue d'ensemble

Un référent est un document JSON qui déclare :

- un jeu de **couleurs** (2 à N, un nom par couleur) ;
- un ensemble d'**items** — des *formes* (référent sans notion de niveau,
  ex. 6×6) ou des *calques* (référent à niveaux, ex. 360) — chacun
  associant des positions `(row, col)` de sa grille locale à une couleur ;
- pour chaque item, quelles couleurs portent de l'information **stégano**
  (`stegano_colors`) et, optionnellement, l'ordre dans lequel les
  consommer en mode **crypto** (`crypto_color_order`, voir §4) ;
- une identité (`referent_id`) calculée sur son contenu géométrique
  SEUL — voir §3.

Le format ne prescrit ni le nombre d'items, ni la taille de grille, ni le
nombre de couleurs : ce sont des choix DE CONTENU, pas de format. Les
seules obligations sont structurelles (§2, validées par
`tools/validate_referent.py::validate()`).

**Convention de ce document — capacité du format vs. état câblé.** Ce
document décrit une CAPACITÉ générique : un champ ou une règle peut être
valide et utilisable par n'importe quel référent conforme, sans qu'un
consommateur en production l'exploite déjà aujourd'hui. Chaque fois que
c'est le cas, un encadré **« État de l'implémentation »** le dit
explicitement — quel consommateur existe, lequel n'existe pas, ce qui
resterait à câbler pour qu'un autre référent en bénéficie. Cette
convention est directement issue de deux erreurs de conception trouvées
en écrivant ce document (§6) : `c_pub` déclaré dans le référent alors
qu'aucun code n'en avait besoin par référent (dépend du COUPLE référent×
variante), et `crypto_color_order` déclaré mais jamais lu par le seul
consommateur crypto existant. Un champ non consommé n'est pas une erreur
EN SOI — l'erreur est de ne pas le dire. Le tableau récapitulatif du §9
liste, pour chaque champ, son statut d'implémentation actuel.

## 2. Schéma

### 2.1 Champs requis

| Champ | Type | Sens |
|---|---|---|
| `format_version` | `str` | Fixé à `"referent-v3"` pour tout référent conforme à ce document. |
| `colors` | `list[str]` | Le jeu de couleurs déclaré, dans un ordre qui fait foi pour toute dérivation qui en a besoin (voir `crypto_color_order`). |
| `stegano_colors` | `list[str]` | Sous-ensemble de `colors` : les couleurs qui portent de l'information en mode stégano (Carter-256/360/Mix/Random/18/Hybrid, `stegano_classic`). Les couleurs hors de cette liste restent du bruit CSPRNG non structuré dans les blocs pure/structured, et ne sont jamais lues comme message dans les blocs message non plus. |
| `grid_size` | `int` | Côté de la grille LOCALE d'un item (ex. 6 pour un référent 6×6, 12 pour un référent 12×12/360). Toutes les positions `(row, col)` d'un item sont dans `[0, grid_size)²`. |
| `forms` OU `calques` | `list[dict]` | Les items du référent — voir §2.2. Un référent en déclare EXACTEMENT un des deux (jamais les deux, jamais ni l'un ni l'autre) ; `tools/validate_referent.py::_items_key()` prend le premier trouvé. |
| `referent_id` | `str` (hex, 64 car.) | SHA-256 du cœur canonique du référent — voir §3. Recalculable indépendamment par quiconque a le contenu géométrique, sert de preuve d'identité (ex. dans un vecteur de test). |

Chaque item (`forms[i]` ou `calques[i]`) porte ses positions sous des
clés `<couleur>_positions` — une liste de `[row, col]` — une par couleur
qu'il utilise. Une couleur absente d'un item n'y contribue aucune
position (ex. un calque 360 à 2 couleurs seulement, voir §5.2).

### 2.2 `forms` vs `calques`

- **`forms`** (référent SANS notion de niveau — ex. le 256 du livre, le
  pool 6×6) : chaque forme est un item autonome, généralement identifié
  par un entier `id` séquentiel (`0..n_forms-1`). Choisi par tirage d'un
  index dans `[0, n_forms)` (voir §4.1) — un octet suffit si
  `n_forms == 256` (aucune réduction modulo nécessaire, voir
  `stegano/referent6x6_gen.py::select_referent_index`).
- **`calques`** (référent À niveaux — ex. le 360 de l'auteur) : chaque
  calque porte en plus `niveau` (entier, le niveau auquel il appartient)
  et, par convention de ce dépôt, `famille`/`teinte` (l'identité dont il
  est l'une des tranches). `layer_of` (voir §2.3) associe alors CHAQUE
  case de la grille locale à SON niveau — un calque de niveau N ne doit
  avoir de positions QUE sur les cases dont `layer_of[row][col] == N`
  (règle 1, §5).

### 2.3 Champs optionnels

| Champ | Sens |
|---|---|
| `layer_of` | Matrice `grid_size × grid_size` d'entiers : le niveau de chaque case locale. Présent SEULEMENT pour un référent à niveaux (`calques`). Sans lui, le référent est traité comme sans notion de niveau, même si ses items ont un champ `niveau` par ailleurs (voir `tools/validate_referent.py::has_niveau`). |
| `crypto_color_order` | Permutation de `colors` : l'ordre dans lequel un consommateur EN MODE CRYPTO (toutes les cases d'un item, pas seulement `stegano_colors` — voir §4.2) doit lire les couleurs. Capacité du FORMAT, applicable à un référent de taille quelconque (6×6, 12×12, ou toute autre) — absent = aucun mode crypto défini pour ce référent, ce qui est légitime tant qu'aucun consommateur n'en a besoin. Si présent, DOIT être une permutation exacte de `colors` (validé, §5) — `stegano_colors` doit en être un sous-ensemble. **État de l'implémentation (2026-09-12)** : un seul consommateur crypto existe en production, `secu_box.py` (mode déni), câblé exclusivement sur le pool 6×6 — voir §4.2. Le référent 12×12/360 NE DÉCLARE PAS ce champ (absent, pas juste ignoré) faute de consommateur ; il devra le déclarer si un futur mode crypto 12×12 apparaît. |
| `color_hues_hex` | `{couleur: "#rrggbb"}` — teinte de référence par couleur, purement cosmétique/traçabilité (utilisée pour la RÉSOLUTION couleur↔hex lors de l'extraction depuis un SVG source, voir `tools/generate_referent_256.py::CONFIRMED_COLOR_HEX`). Jamais lue par le code de lecture. |
| `referent_kind` | Étiquette libre identifiant la NATURE du référent (`referent_256_book`, `referent_360`, `referent_6x6_chacha` pour les trois instances de ce dépôt). Non requis par la validation générique (`tools/validate_referent.py` reste agnostique — les contrôles informatifs §5.3/5.4 se déclenchent sur la FORME du contenu, jamais sur ce champ) ; aucune branche du code de LECTURE ne le teste. Les trois générateurs de ce dépôt l'incluent néanmoins dans leur `core` (§3) — c'est un choix DE CE générateur, pas une obligation du format : deux référents au contenu géométrique identique mais à `referent_kind` différent auraient, chez ces générateurs, des `referent_id` différents. |
| `generated_at_utc`, `generator_tool` | Métadonnées de traçabilité, explicitement EXCLUES du calcul de `referent_id` (§3) — deux régénérations du même contenu à des dates différentes doivent produire le même `referent_id`. |
| `referent_index` | Pour un référent tiré d'un POOL indexé (ex. le 6×6 : `n ∈ [0,255]`), son index dans le pool. Fait partie du cœur canonique pour ce cas précis (deux référents d'index différents dans le même pool ont des `referent_id` différents par construction). |
| tout autre champ | Un référent peut porter des champs supplémentaires propres à son contenu (ex. `n_forms`/`n_calques`/`n_identities`/`extraction_rule`/`numbering_rule`/`chiralite_repartition`/`diag`/`legacy_crosscheck`/`invariant_48_48_48` dans les trois référents de ce dépôt) : ils documentent CE référent précis, ne sont exigés par aucune règle générique, et n'entrent jamais dans `referent_id`. |

> **État de l'implémentation (2026-09-12).** `c_pub` n'est PAS et ne sera
> JAMAIS un champ de ce format — décision de l'auteur corrigeant une
> erreur de conception antérieure (§6) : la capacité publique garantie
> dépend du COUPLE (référent, variante qui le lit), jamais du référent
> seul, donc un champ unique dans le référent ne peut jamais être
> correct pour toutes ses variantes. Elle vit exclusivement dans
> `crypto_core.C_PUB`, indexée par variante (§7). Un référent qui déclare
> un `c_pub` viole ce document.

## 3. `referent_id`

```
core = {  # UNIQUEMENT ces clés, triées, sans generated_at_utc/generator_tool
          # ni AUCUN champ recalculé après coup (au premier rang c_pub,
          # qui n'existe d'ailleurs plus dans ce format -- voir §2.3)
    'format_version', 'referent_kind'(si le générateur choisit de l'inclure),
    'grid_size', 'colors', 'color_hues_hex'(si présent),
    'stegano_colors', 'crypto_color_order'(si présent),
    'layer_of'(si à niveaux), 'referent_index'(si issu d'un pool),
    'forms' OU 'calques',
}
referent_id = SHA256( JSON(core, sort_keys=True, separators=(',',':'), ensure_ascii=False) ).hexdigest()
```

Exactement quels champs entrent dans `core` est un choix DU GÉNÉRATEUR de
CE référent (voir `tools/generate_referent_256.py::generate_v3_json`,
`generate_referent_360.py::generate_v3_json`,
`generate_referent_6x6.py::_full_doc` pour les trois cœurs actuels — ils
diffèrent légèrement : le 360 n'a par exemple pas de
`crypto_color_order`) — la règle FIXE, elle, est double :

1. **Identité géométrique uniquement.** Tout ce qui décrit la GÉOMÉTRIE
   et les RÈGLES DE LECTURE du référent (couleurs, tailles, positions,
   niveaux) doit entrer dans `core`. Deux référents avec le même `core`
   SONT le même référent (même clés dérivées, même comportement).
2. **Jamais de métadonnée non-identitaire.** `generated_at_utc`,
   `generator_tool`, et TOUTE valeur recalculée APRÈS coup sur un
   référent déjà généré (au premier rang desquels un `c_pub`, si un tel
   champ existait) sont exclus — sinon régénérer à une autre date, ou
   recalibrer, changerait silencieusement `referent_id`, et donc l'info
   HKDF qui en dépend, et donc les clés déjà dérivées pour ce référent.

Chaque générateur de ce dépôt expose sa propre fonction
`compute_referent_id(core)` / `canonical_json_bytes(core)`
(`json.dumps(core, sort_keys=True, separators=(',',':'), ensure_ascii=False)`
puis SHA-256) ; `test_referent_360_v3.py::test_referent_id_stable_across_
recompute` et l'équivalent pour le 256 vérifient que reconstruire `core`
depuis le document publié et recalculer son SHA-256 reproduit exactement
`referent_id`.

## 4. Règle de lecture déclarative

Le référent ne dit PAS comment il est lu — il fournit les COULEURS et les
POSITIONS ; l'ORDRE de lecture est calculé au moment de l'encodage/
décodage, à partir de la clé, par `stegano/sweep.py` (balayages) combiné
à `stegano_colors`/`crypto_color_order` (couleurs). Deux modes de lecture
coexistent, mutuellement exclusifs par consommateur :

### 4.1 Mode stégano (Carter-256/360/Mix/Random/18/Hybrid, `stegano_classic`)

Seules les couleurs de `stegano_colors` portent l'information, et
SEULEMENT dans les blocs de rôle `message` (les blocs `pure`/`structured`
restent du bruit CSPRNG non structuré, inchangé par le référent). Pour un
item choisi (une forme, ou — référent à niveaux — les calques choisis à
chaque niveau), les positions de `stegano_colors` sont lues ENSEMBLE,
dans l'ordre `crypto_reading_order(cells, stegano_colors, grid_size,
sweep_of_color)` (voir `stegano/sweep.py`) : niveaux croissants d'abord
(un seul niveau pour un référent sans notion de niveau), puis
`stegano_colors` dans son ordre déclaré, chaque couleur triée par son
PROPRE balayage.

- Référent 6×6 (256 formes, `stegano_colors=[blue,orange]`, 6+6 cases) :
  12 positions stégano par bloc message (sur 36 cases au total).
- Référent 12×12/360 (`stegano_colors=[violet]`) : à chaque niveau, UN
  calque de ce niveau est tiré (parmi ceux qui existent) ; ses positions
  violettes (0, 8 ou 16 selon le calque) sont lues. Sur les 6 niveaux
  d'un bloc message, la moyenne mesurée est ~48 positions (voir
  `docs/PAPER_NUMBERS_v3.md` §5.4 — l'ancien tirage à une seule couleur
  parmi 294 formes plates rendait 0 position pour 44,9 % des blocs, un
  défaut structurel corrigé par ce même câblage).

### 4.2 Mode crypto (secu_box.py, déni plausible — UNIQUEMENT)

TOUTES les cases d'un item portent de l'information, dans l'ordre
`crypto_reading_order(cells, crypto_color_order, grid_size,
sweep_of_color)` — niveaux croissants d'abord, puis `crypto_color_order`
(pas `stegano_colors`), chaque couleur triée par son propre balayage. Un
seul tirage de forme par bloc (pas de sélection de sous-ensemble de
couleurs : toute la forme est lue).

- Référent 6×6 : 36 positions par bloc (les 36 cases), contre 12 en mode
  stégano pour le MÊME référent — c'est la différence entre les deux
  modes, pas une propriété d'un référent différent.

> **État de l'implémentation (2026-09-12).** Le format permet à N'IMPORTE
> QUEL référent, de taille quelconque, de déclarer `crypto_color_order`
> pour un usage crypto (validé par `tools/validate_referent.py`, §5) —
> mais à ce jour, un SEUL consommateur crypto existe en production :
> `secu_box.py::_deniable_positions` (mode déni), câblé EXCLUSIVEMENT sur
> le pool de 256 référents 6×6 (`referent6x6_gen.py`, sélection par
> `select_referent_index`). Il lit `referent6x6_gen.CRYPTO_COLOR_ORDER`
> (déclaré une fois dans ce module, identique au `crypto_color_order`
> écrit dans les JSON publiés par `tools/generate_referent_6x6.py` — un
> seul référent par pool, donc un seul jeu de couleurs, donc pas de
> document JSON par instance à lire au runtime pour les 254 référents non
> publiés en JSON complet, voir §7).
>
> **Il n'existe AUCUN chemin de code crypto pour le référent 256 du livre
> ni pour le référent 360** — donc aucun chemin 144-cases (12×12
> complet) non plus. `crypto_color_order` est déclaré dans
> `referent_256_v3.json` (schéma complet, capacité disponible pour un
> consommateur futur) mais ABSENT de `referent_360_v3.json` — cohérent
> avec la règle du §1 : aucun consommateur ne le lirait aujourd'hui. Si
> un mode crypto 12×12 apparaît un jour, `referent_360_v3.json` DEVRA
> déclarer ce champ à ce moment-là.
>
> **Risque de confusion pour LH-5, résolu (2026-09-12) :** `secu_box.py`
> contenait DEUX mécanismes distincts portant le mot « déniable »/
> « deniable », sans rapport l'un avec l'autre : le mode crypto ci-dessus
> (`_deniable_positions`/`_place_deniable`/`_read_deniable`,
> partitionnement de blocs Br/Bd, référent 6×6 uniquement, ce que ce
> document appelle « mode crypto », §5.6 du papier) et
> `carter_random_deniable`/`carter_random_deniable_360` (deux encodages
> STÉGANO Carter-Random 90×90/180×180 INDÉPENDANTS sous deux clés
> différentes sur la même grille, aucun partitionnement de blocs). Un
> lecteur de LH-5 qui aurait cherché « le » mécanisme de déni plausible
> de ce dépôt aurait pu légitimement confondre les deux. Vérifié : les
> deux fonctions `carter_random_deniable*` n'avaient aucun appelant,
> aucun test, et ne correspondaient à aucun paragraphe du papier —
> supprimées. Seul le mode crypto ci-dessus fait foi ; repris depuis le
> tag `v2-final` et l'historique git si l'approche devait resservir un
> jour.

### 4.3 Balayages (8, dérivés de la clé)

Un balayage = un coin de départ (haut-gauche/haut-droit/bas-gauche/
bas-droit) × un axe primaire (horizontal/vertical), soit 8 combinaisons
(`stegano/sweep.py::SWEEPS`). `derive_sweep_index(key, color)` en tire UN
par couleur (1 octet HKDF-SHA256, `% 8` sans biais puisque `256 % 8 ==
0`), à partir de `grammar_key_ctr` (retiré ENTIER avec le reste de la
grammaire en cas de redraw — jamais un balayage isolé) : FIXE pour toute
la grammaire d'un message donné, la même couleur est donc toujours lue
dans le même ordre partout où elle apparaît. `sort_by_sweep` applique
ensuite ce balayage aux positions LOCALES d'un item (coordonnées
`[0, grid_size)`), jamais aux coordonnées globales de la grille complète.

## 5. Règles de validation (`tools/validate_referent.py`)

Génériques — indépendantes du contenu esthétique, doivent tenir pour
TOUT référent conforme à ce document (erreurs = référent INVALIDE,
refusé) :

1. **Un seul niveau par item**, si le référent en a une notion
   (`layer_of` présent ET tous les items portent `niveau`) : aucune
   position d'un item de niveau N ne doit tomber sur une case dont
   `layer_of` déclare un niveau différent. Un référent sans `layer_of` (ex.
   le 6×6) n'est pas soumis à cette règle, même si ses items portaient
   incidemment un champ `niveau`.
2. **Cases distinctes** : dans un même item, aucune position `(row,col)`
   n'apparaît sous plus d'une couleur.
3. **Couleurs du jeu déclaré** : toute clé `<couleur>_positions` d'un item
   doit correspondre à une couleur listée dans `colors`.
4. **Position stégano garantie** (règle révisée 2026-09-12) : référent à
   niveaux — à CHAQUE niveau distinct, au moins UN calque de ce niveau a
   des positions stégano (un calque isolé PEUT être vide, seul un niveau
   ENTIÈREMENT vide de stégano est une erreur) ; référent sans niveau — au
   moins UNE forme du référent entier a des positions stégano.
5. **`crypto_color_order`, si présent, est une permutation EXACTE de
   `colors`** (aucune couleur ajoutée, omise ou dupliquée) — et
   `stegano_colors` doit en être un sous-ensemble (câblage 2026-09-12,
   suite à la découverte que ce champ n'était lu par aucun consommateur
   avant cette date, voir §6).
6. **`stegano_colors` est un sous-ensemble de `colors`** (indépendamment
   de `crypto_color_order`).

Informatives (avertissements, jamais bloquantes — propres au CONTENU par
défaut de ce dépôt, un référent personnalisé peut légitimement ne pas les
respecter) : l'invariant 48/48/48 par identité famille/teinte du 360
(§5.2), et la composition 6/6/12/12 par forme du pool 6×6 (§5.3).

## 6. Un champ n'a sa place dans ce format QUE s'il est réellement lu

Deux erreurs de conception ont été trouvées et corrigées le 2026-09-12,
en préparant ce document — consignées ici pour que LH-5 ne les
reproduise pas :

- **`c_pub` dans le référent** (corrigé) : un champ unique ne peut pas
  être correct, la capacité publique dépendant du COUPLE (référent,
  variante). Retiré du format ; vit uniquement dans `crypto_core.C_PUB`,
  indexé par variante (§7).
- **`crypto_color_order` jamais lu** (corrigé) : déclaré dans le JSON,
  mais le seul consommateur crypto reconstruisait l'ordre en dur
  (`SMALL_COLORS + LARGE_COLORS`) sans jamais lire le champ — un référent
  personnalisé à ordre différent aurait été silencieusement ignoré.
  Câblé : `secu_box.py` lit maintenant `referent6x6_gen.CRYPTO_COLOR_
  ORDER`, elle-même la source unique aussi utilisée par le générateur de
  JSON (plus de duplication susceptible de diverger).

La règle qui s'en dégage pour tout champ futur de ce format : s'il existe
un consommateur en production, ce consommateur DOIT lire le champ depuis
le référent (jamais le présupposer, jamais le reconstruire d'une autre
source qui pourrait diverger) ; s'il n'a pas encore de consommateur,
c'est légitime (voir `crypto_color_order` pour 256/360 ci-dessus), mais
doit être noté explicitement comme tel plutôt que de laisser croire à une
garantie qui n'existe pas.

## 7. Calibration (capacité publique garantie)

`C_PUB` (capacité publique garantie, en OCTETS UTF-8 — voir
`crypto_core._message_to_bytes`) vit EXCLUSIVEMENT dans
`crypto_core.C_PUB`, un dict indexé par VARIANTE (pas par référent) :

```
C_PUB = {
    'carter256': ..., 'carter360': ..., 'cartermix': ...,
    'carterrandom90': ..., 'carterrandom360': ...,
    'carter18': ..., 'carterhybrid': ...,
}
```

Méthode (inchangée depuis la tâche 4, 2026-09-11) : la plus grande valeur
telle que le taux de REDRAW (pas le taux d'échec) reste < 1 % sur N clés
tirées au hasard, mesurée en appelant DIRECTEMENT les fonctions de
recherche de grammaire de PRODUCTION (jamais une réimplémentation),
`crypto_core.C_PUB[variant]` temporairement substitué puis restauré.

Deux outils, selon que la variante reçoit un référent EXPLICITE ou en
sélectionne un dans un POOL par clé :

- **`tools/calibrate_referent.py`** — carter256, carter360, cartermix :
  les trois seules variantes paramétrées par un référent explicite
  (Ref256 et/ou Ref360). Calibre un COUPLE (référent, variante) à la
  fois ; `--apply` (écriture dans `crypto_core.C_PUB`) refusé si le
  référent donné n'est pas celui effectivement chargé par défaut en
  production — une valeur C_PUB n'a de sens que pour le référent
  réellement utilisé. Sans argument, calibre les trois variantes pour les
  référents par défaut et affiche un tableau (référent × variante).
- **`tools/recalibrate_carter_v3.py`** — carterrandom90/360, carterhybrid
  (carter18 non recalibré, géométrie inchangée par le câblage) : ces
  variantes sélectionnent leur référent PAR CLÉ dans un pool (256
  référents 6×6, ou 10 graines 18×18 pour Carter-18/le côté 18×18 de
  Hybrid) — il n'y a pas de « référent unique » à calibrer, la mesure sur
  N clés aléatoires échantillonne déjà naturellement l'ensemble du pool.

`stegano/test_regression.py::TestCPub::test_c_pub_keys_match_wired_
variants` recoupe les deux sources (les variantes de
`recalibrate_carter_v3.VARIANTS` + `carter18`) contre les clés de
`crypto_core.C_PUB` : aucune variante câblée sans entrée, aucune entrée
orpheline.

## 8. Les trois instances de ce dépôt

| | Référent 256 (livre) | Référent 360 (auteur) | Pool 6×6 (256 référents) |
|---|---|---|---|
| Fichier | `data/referent_256_v3.json` | `data/referent_360_v3.json` | Généré à la volée (`stegano/referent6x6_gen.py`) ; 2 instances de débogage publiées en JSON complet (`data/referent_6x6_index{0,1}_v3.json`) + `data/referents_6x6_v3_hashes.json` (SHA-256 des 256) |
| `referent_kind` | `referent_256_book` | `referent_360` | `referent_6x6_chacha` |
| `grid_size` | 6 | 12 | 6 |
| Items | 256 `forms` | 360 `calques` (60 identités × 6 niveaux) | 256 `forms` par référent |
| `colors` | rouge/bleu/vert/jaune | violet/magenta/orange | blue/orange/green/yellow |
| `stegano_colors` | rouge, bleu | violet | blue, orange |
| `crypto_color_order` | rouge/bleu/vert/jaune (déclaré, **aucun consommateur**) | absent (aucun consommateur) | blue/orange/green/yellow (**consommé par secu_box.py**) |
| Consommateurs stégano | `carter.py` (Carter-256, côté 256 de Carter-Mix), `stegano_classic.py` | `carter.py` (Carter-360, côté 360 de Carter-Mix) | `carter_random.py` (Random/Hybrid MODE_6) |
| Consommateur crypto | aucun | aucun | `secu_box.py` (mode déni) |
| Génération | `tools/generate_referent_256.py`, depuis un SVG source (`data/referent_256_src/`, CC BY-NC 4.0 — voir `data/referent_256_src/LICENSE.md`) | `tools/generate_referent_360.py`, depuis 360 SVG par calque (`data/referent_360_src/`, même licence) | `stegano/referent6x6_gen.py`, algorithme ChaCha20 normatif, AUCUNE source externe (public, sans secret) |

Un futur référent personnalisé (LH-5) n'est tenu à AUCUNE de ces valeurs
précises — seulement au schéma (§2) et aux règles de validation (§5).

## 9. Récapitulatif — champ, obligation, consommateur, statut

| Champ | Obligatoire | Consommateur(s) en production | Statut |
|---|---|---|---|
| `format_version` | Oui | Aucune branche de comportement (valeur figée `"referent-v3"`) | Câblé — vérifié à l'écriture (générateurs), jamais lu pour décider d'un comportement |
| `colors` | Oui | `tools/validate_referent.py` (règle 3, 6) ; source de `stegano_colors`/`crypto_color_order` | Câblé |
| `stegano_colors` | Oui | `carter.py`, `carter_random.py`, `stegano_classic.py`, `secu_box.py` (mode déni, référentiel 6×6) | Câblé — lu par TOUS les consommateurs stégano en production |
| `grid_size` | Oui | Tous les consommateurs (dimension locale des positions) | Câblé |
| `forms` / `calques` | Oui (l'un des deux) | Tous les consommateurs | Câblé |
| `referent_id` | Oui | Tests de stabilité (`test_referent_360_v3.py`, équivalent 256), vecteurs de test | Câblé comme identité/preuve — jamais lu par le chemin d'encodage/décodage lui-même |
| `layer_of` | Non (requis seulement si le référent a une notion de niveau) | `tools/validate_referent.py` (règle 1) ; `carter.py`/`carter_random.py` pour dériver les niveaux d'un référent à calques | Câblé pour le 360 ; sans objet pour un référent sans niveau |
| `crypto_color_order` | Non | `secu_box.py::_deniable_positions`, **pool 6×6 UNIQUEMENT** | **Partiellement câblé** — capacité générique du format (§4.2), un seul consommateur réel à ce jour ; absent de `referent_360_v3.json` faute de consommateur |
| `color_hues_hex` | Non | Aucun (cosmétique/traçabilité d'extraction) | **Jamais consommé par le code de lecture** — légitime, informatif par nature |
| `referent_kind` | Non | Aucun (aucune branche de comportement ne le teste) | **Jamais consommé par le code de lecture** — informatif, mais entre dans `referent_id` chez les trois générateurs actuels (choix de CE générateur, §3) |
| `generated_at_utc`, `generator_tool` | Non | Aucun | **Jamais consommé** — traçabilité pure, explicitement exclu de `referent_id` |
| `referent_index` | Non (requis seulement si issu d'un pool indexé) | `referent6x6_gen.py` (fait partie de l'identité pour distinguer les 256 référents du pool) | Câblé pour le pool 6×6 |
| `c_pub` | **Interdit** (§2.3, §6) | — | **Retiré du format** le 2026-09-12 (n'a jamais eu de sens comme champ unique — vit dans `crypto_core.C_PUB`, §7) |
| autres champs propres au contenu (`n_forms`, `extraction_rule`, `invariant_48_48_48`, etc.) | Non | Aucun | Informatifs, propres au référent qui les déclare, jamais lus par un consommateur générique |

## Annexe — autres présuppositions de couleurs relevées (2026-09-12)

En corrigeant `crypto_color_order`, une recherche plus large de code qui
présuppose un jeu de couleurs plutôt que de le lire depuis le référent a
été menée sur `stegano/` et `secubox/` :

- `stegano/carter_random.py::_RANDOM_STEGANO_COLORS` dérivait déjà de
  `referent6x6_gen.SMALL_COLORS` (source unique, pas de duplication) —
  changé pour lire le nom `STEGANO_COLORS`, désormais déclaré
  explicitement dans `referent6x6_gen.py` avec ce nom (même valeur).
- `tools/generate_referent_6x6.py` dupliquait `COLORS`/`STEGANO_COLORS`
  en local — même défaut de conception que `c_pub` (deux sources qui
  auraient pu diverger). Remplacé par des alias vers les constantes de
  `stegano/referent6x6_gen.py`.
- `disk/disk_lib.py` et `disk/cryptanalyse_spn.py` codent `'blue'`/
  `'orange'` en dur (S-box de chiffrement disque, diversification
  géométrique). **Confirmé hors périmètre** de ce format : ce sous-
  système lit directement les anciens `data/referent_256.json`/
  `referent_360.json` (schéma pré-v3), a son propre chargeur
  `load_referents()` totalement indépendant de `stegano_classic.py`, et
  n'a aucun rapport avec les référents v3 ni avec Carter/secu_box. Un
  commentaire d'en-tête a été ajouté aux deux fichiers pour éviter toute
  confusion à un futur lecteur.
- Aucune autre présupposition de couleur trouvée dans `stegano/carter.py`,
  `stegano/stegano_classic.py`, `stegano/sweep.py` ou `stegano/crypto_
  core.py` : ces modules lisent `colors`/`stegano_colors` génériquement
  depuis le référent qu'on leur passe.
