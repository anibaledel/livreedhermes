# outils-site-v2 — état du chantier

Chantier mené sur la branche `outils-site-v2`, créée depuis `origin/main`
(commit `df20c9e`, PR #120 fusionnée). Un commit par tâche, chacun
relançable seul. Aucune PR fusionnée vers `main` sans validation de
l'auteur — voir la PR ouverte à la fin de ce document.

Vérification commune à chaque tâche : la page concernée ouverte dans un
navigateur (serveur statique local), console sans erreur — via
`mcp__claude-in-chrome` (`tools/check_pages_console.mjs` existe mais
nécessite `playwright`, absent de cet environnement ; non installé pour ne
pas ajouter de dépendance non demandée). Les captures avant/après demandées
par la règle 7 n'ont pas été jointes aux messages de commit (pas de mécanisme
de pièce jointe disponible ici) ; chaque commit décrit en revanche
précisément ce qui a été vérifié et comment.

## A. `impression.html`

**A1 — Libellés catégories I/III.** Fait. Le statique et le dictionnaire
disaient deux choses différentes (« 16 motifs · tirage direct » vs « 64
motifs · teinte fixe... ») ; unifiés. Vérifié : texte rendu identique au
gabarit FR, quatre langues.

**A2 — Compter juste.** Fait, avec A1. « 64 hexagrammes · 4 096 calques »
(I/III/IV), « 6 familles × 4 teintes · 64 hexagrammes · 4 096 calques »
(II). Calculé depuis `NATURE_SLUGS.length` et `KINGWEN_BY_CHRONO.length`,
jamais écrit — voir `formatMillier`/`substituerComptesTirage` dans
`impression.html`. Vérifié : texte affiché = valeurs calculées.

**A4 — Export grille (moteur).** Fait. `CalqueEngine.gridToPNG`/`gridToJSON`
dans `assets/calque-engine.js`, boutons dans `impression.html`. Vérifié en
local (catégorie IV, tirage réel) : `grille.png` fait 12×12 px, `grille.json`
contient les 144 cases résolues en V/M/O et l'hexagramme du tirage.

**A3 — Lien permanent d'un tirage.** Fait. `?cat=&famille=&teinte=&tirage=`,
rejeu exact via `forcedSlugs`. Bug trouvé et corrigé en testant : `yang-mut`/
`yin-mut` portent déjà un tiret, donc `join('-')`/`split('-')` est
irréversible — `splitTirageParam()` répare par appariement le plus long
d'abord (même remède que `splitFamilyId`, qui a le même problème). Vérifié :
les 3 formes (I/III, II, IV) rejouées donnent un `state.item.id` identique
à l'original.

**A5 — Lien vers les données.** Fait. Ligne sous l'outil, lien relatif vers
`chiffres-et-sources.html`, quatre langues (réutilise les traductions déjà
établies dans `en/lexicon`, `es/lexico`, `th/lexicon`).

## B. `creation-motifs-yi-king.html`

**B1 — Lien permanent d'une composition.** Fait. `?n1..n6=<file>&palette=
<V,M,O>` ; rejeu par `itemsForCat('les60')` + recalcul du rôle Créateur/
Réceptif par `yangScore` (même règle que `buildResultArea`). Piège trouvé :
`PALETTE` est un `const` mutable en place partout ailleurs — une
réaffectation directe aurait levé une exception ; le rejeu réécrit
`paletteState` et rejoue `applyPaletteToSite()`, en basculant d'abord
`colorMode` par un vrai clic si le mode Monochrome par défaut est actif.
Vérifié : rejeu restitue les mêmes `picked.file`, le même chrono, la même
palette.

**B2 — Export grille.** Fait, réutilise les fonctions d'A4. Boutons à côté
de « Créer le SVG » (motif principal et les deux pavages de paire).
Vérifié : téléchargement réel, JSON cohérent avec l'hexagramme affiché.

**B4 — Texte d'en-tête.** Fait. « 60 natures, 6 niveaux de traits... » →
« 60 images, 6 niveaux, 360 calques », calculé depuis
`data/referent_360_v3.json` (`n_identities`, niveaux distincts des calques,
`n_calques`).

**B3 — Export broderie.** Vérifié, rien à faire : `generateInkstitchSVG`/
`downloadGridSVG` (déjà présents, wired aux boutons « Créer le SVG ») SONT
l'export broderie numérique (format Ink/Stitch) — il vit sur cette page.
Mais la mention « un export pour broderie numérique » que la consigne
attribue à la page d'accueil et à `a-propos.html` est introuvable sur
`main` : recherche de « broderie »/« embroidery »/« Ink-Stitch » sur tout le
dépôt (`index.html`, `a-propos.html`, `outils.html`, tous les `.md`) — zéro
résultat en dehors d'un article sans rapport (broderie textile réelle, pas
un export logiciel). Rien retiré ni ajouté sur une promesse que je ne
retrouve pas : à confirmer avec l'auteur si le texte existe ailleurs (autre
branche, autre session) que je n'ai pas sous les yeux.

Cette page n'a pas de dictionnaire multilingue (`UI`/`LANG`) — contrairement
à `impression.html`. B1/B2/B4 restent donc en français seul, comme le reste
de la page (Google Translate assure la traduction à la volée, comportement
déjà en place).

## C. `galerie-patterns-unifies.html`

**C1 — Vocabulaire de la FAQ.** Fait. « matrices »/« harmonie 12/12/6/6 »/
« 8 Unified Patterns » → familles (8 sur 15), grilles (512), pavages (256),
demi-décalage, orbites (128), règle d'arête. Même mise à jour dans le
JSON-LD FAQPage et le bloc visible. Page français seul, pas de traduction.

**C4 — Export grille.** Fait, réutilise A4/B2. Boutons à côté des deux
exports SVG existants.

**C3 — Fréquence spatiale k².** Fait fonctionnellement (affichage + filtre),
module partagé `assets/spatial-k2.mjs`. **Réserve non résolue** : le jeu de
valeurs obtenu, {1, 5, 8, 9, 13, 17, 25, 29, 37, 41, 45, 61} (12 valeurs),
ne correspond pas aux neuf valeurs annoncées {1, 2, 4, 5, 8, 9, 10, 13, 20}.
Essayé sans succès avant de m'arrêter : DFT sur la grille 3-teintes
complète ; DFT sur le masque binaire structurel (position gouvernée par
yang/yin, indépendant des teintes — 7 valeurs sur les 64 hexagrammes,
partiellement recoupantes) ; DFT sur « teinte X vs reste » pour chacune des
3 teintes (même résultat que la grille complète). `cymatique.html` n'a pas
cette fonction sur `main` au moment de cette branche (elle vit dans une
branche cymatique distincte, non fusionnée) — je n'ai donc pas pu comparer
à son implémentation réelle pour trouver l'écart. À trancher par l'auteur :
soit il connaît la méthode exacte qui donne les neuf valeurs, soit le
nombre annoncé vient de cette autre branche et les deux devront être
réconciliés à la fusion.

**C2 — Théorèmes exposés.** Fait. Orbites sous Γ = D4 (8) × σ (demi-décalage,
2) × S3 (permutation des 3 teintes, 6) = 96, calculées côté client.
Représentant = forme minimale en ordre lexicographique parmi les 96
transformées. Autocontrôle au chargement : 128 orbites distinctes trouvées
sur les 1024 constructions — confirmé indépendamment par
`tools/cube_edges.py` (déjà dans le dépôt, section « Orbites de Γ »,
groupe `<σ, D4, S3>` identique) :

```
python tools/cube_edges.py
...
Orbites de Γ (Section 4 et Remarque de la Section 6)
    corpus   : 128 orbites ; grilles du corpus par orbite : {4: 128}
```

`chiffres-et-sources.html` portait déjà la ligne « 512 / 256 / 128 »
(`cube_edges.py`) — rien à y ajouter, le chiffre ne change pas, une
deuxième page le montre maintenant aussi.

## D. `encodeur.html`

**D1 — Texte Référent 256.** Fait. Les 256 ne sont pas des rotations ; ce
sont toutes les colorations satisfaisant les critères I à IV (dénombrement
exhaustif, 128 par chiralité, article *The Ansate Cross*).

**D2 — Texte Référent 360.** Fait. « 15 harmonies × 24 cartes » → « 60
images × 6 niveaux = 360 calques (15 familles × 4 natures) ».

**D3 — Deux versions du référent 256.** Fait. L'onglet Référents affiche
maintenant `REF256_V3` (celui que l'encodage emploie) au lieu de l'ancien
`referent_256.json` (2 couleurs blue/orange) — `REF256_V3` porte 4 couleurs
(rouge/bleu/vert/jaune), dont rouge+bleu sont les `stegano_colors`
réellement significatives. `referent_256.json` reste chargé, encore utilisé
ailleurs par `diskBuildTables` (chiffrement disque, hors périmètre de
cette tâche). Vérifié : position survolée = position réellement utilisée
par l'encodage (comparaison directe des tableaux `bleu_positions`/
`rouge_positions`).

**D4 — Variantes non portées.** Fait. `CARTER_VARIANTS` ne garde que
`carter256`/`carterrandom` ; les cinq autres retirées du sélecteur, la
mention reste une fois dans l'onglet À propos (phrase déjà présente).

**D5 — Cohérence avec le papier v6.** Fait, liste seule comme demandé,
rien réécrit : `docs/encodeur_coherence_v6.md` — texte visible (lignes 493,
516, 544) et commentaires de code (1627-1630, 1729-1731, 1757-1762,
1850-1856) qui attribuent une propriété de sécurité prouvée (max_DDT,
branch number, dénombrement de configurations) à la couche géométrique.

**D6 — Application installable.** Fait. `encodeur.webmanifest` +
`encodeur-sw.js` (cache-first minimal : la page, les 6 `js/*.js`
réellement importés — `carter-core.js` et sa fermeture de dépendances —,
les deux référents v3). Rien touché au code de chiffrement. **Réserve** :
la seule icône disponible dans `assets/nav-icons/` pour cette page fait
128×128 (`encodeur.png`), sous le 192×192 que Lighthouse préfère pour
l'installabilité stricte — pas de nouvelle image fabriquée, la consigne
demandait les icônes existantes ; Lighthouse n'a pas été exécuté dans cet
environnement (pas d'outil disponible), la vérification s'est arrêtée à
l'enregistrement effectif du service worker et au peuplement du cache (9
fichiers), vérifiés en direct dans le navigateur.

## Ce qui reste à faire avant fusion

1. **C3** — réconcilier le jeu de valeurs k² avec celui annoncé, ou avec
   l'implémentation de la branche cymatique une fois fusionnée.
2. **B3** — confirmer si la mention « export pour broderie numérique »
   existe quelque part que je n'ai pas vu, sinon rien à faire (déjà
   correct : la fonctionnalité existe et n'est pas mal promise).
3. **D6** — passer Lighthouse une fois un environnement adapté disponible ;
   fournir une icône 192×192+ si l'auteur veut la stricte conformité PWA.
4. Captures avant/après par tâche, si l'auteur les veut jointes après coup.

## Pull request

Ouverte vers `main` depuis `outils-site-v2`, non fusionnée — en attente de
validation de l'auteur, comme demandé.
