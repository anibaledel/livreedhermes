# Ajouter une langue

*Établi le 2026-10-04, avec le portugais (`pt`, portugais du Portugal). Le but : qu'une
huitième langue ne coûte plus un lot entier.*

Deux cas, selon ce qui arrive.

## A. Le livre paraît dans une langue déjà déclarée

C'est le cas du portugais aujourd'hui : la langue est déclarée et ses pages existent,
mais son édition est « en préparation ». Trois gestes suffisent, **sans toucher à la
structure** :

1. **Déposer le PDF**, au nom de la convention :
   `book-viewer/la-livree-d-hermes-anibal-amiot-<code>.pdf`.
2. **L'alléger et le linéariser** :
   `python3 tools/alleger_pdf.py book-viewer/la-livree-d-hermes-anibal-amiot-<code>.pdf`.
   Le contrôle `tools/check_pdf.py` (CI) refuse un PDF du lecteur au-delà de 25 Mo ou
   non linéarisé.
3. **Produire ses pages WebP** :
   `python3 tools/pages_webp.py <code>`. Il écrit une page par code de `PAGE_CODES`
   (111) dans `book-viewer/pages/<code>/`, à 1920 × 1080 en WebP qualité 82.

Puis régénérer et vérifier :

```
node scripts/build-langues.js
node scripts/build-couverture.js
node scripts/build-header.js
node scripts/build-langues.js --verifie
```

`scripts/livres.js` voit alors le PDF et les 111 pages : la langue passe de « en
préparation » à « parue ». Sans autre édition, tout ce qui suit change :

- les drapeaux des barres « Lire / PDF » des six pages qui les portent ;
- la visionneuse (`LANGS`, `ready`) ;
- les données structurées du livre (`workTranslation`) ;
- `sitemap-pdf.xml` ;
- les boutons de la page du livre dans cette langue ;
- la carte de son édition sur `la-livree-d-hermes.html` ;
- le bouton PDF de son accueil, dans sa langue, avec la taille mesurée ;
- `llms.txt` ;
- la phrase canonique, dans toutes les langues.

Le dépôt Zenodo, lui, ne change pas tout seul. Ce que la phrase appelle « publié »,
c'est le champ `langues` du dépôt du livre dans `data/travaux.json`, et on ne le
modifie que si le dépôt Zenodo l'est.

## B. Une langue nouvelle

Ce qui se **déclare** (une fois) :

1. **`scripts/langues.js`, table `LANGUES`** — une entrée :
   - `nom`, `autres` (l'intitulé « Autres langues : »), `hreflang` s'il diffère du
     code (`pt-PT`, `zh-Hans`), `drapeau` ;
   - `pages` : l'adresse de chacune de ses pages, par groupe (`livre`, `accueil`,
     `lexique`, `travaux`, `outils`, `soutien`…) ;
   - `edition` : la carte de l'édition (`titre`, `lire`, `preparation`) et les deux
     boutons de la page du livre (`boutonLire`, `boutonPdf`) ;
   - `accueil` (facultatif) : les boutons et la carte du traité de son accueil ;
   - `evitement` : le lien d'évitement « Aller au contenu » ;
   - `lecteur` : l'interface de la visionneuse quand le livre s'y lit dans
     cette langue (titre, « Page {code} — {i} / {n} », saut de page, aides,
     noms des flèches et de l'image, lien du PDF). Sans elle, la visionneuse
     garde le français et affiche « Interface en français ». Un caractère
     chinois nouveau demande `python3 tools/police_zh.py`.

   Les groupes de traduction, le hreflang, le sitemap, les rangées de langues, les
   barres de drapeaux et la visionneuse en sont **tirés** : aucune liste à compléter
   ailleurs.
2. **Ses textes**, là où une phrase se construit dans chaque langue :
   - `scripts/build-couverture.js` : une table `T.<code>`, et le nom de la nouvelle
     langue dans les tables des autres ; le script refuse de tourner si l'une manque ;
   - `scripts/build-travaux.js` : `TYPES`, `MOIS`, `T`, `PHRASE_LICENCES`, et la
     ligne de la page ;
   - `scripts/build-header.js` : `TEXTE_EVITEMENT` (le lien d'évitement).
3. **Ses données traduites** :
   - `data/lexiques_traduits.json` : une entrée, la page du lexique en sort ;
   - `data/travaux.json` : un champ `<code>` par section et par dépôt ;
   - `docs/terminologie-fr-en-es-th.md` : une colonne, dans l'ordre de
     `scripts/langues.js`, que `tools/check_glossaire.mjs` lit dans cet ordre.
4. **Ses pages rédigées** : `includes/footer-<code>.html` (repris d'office s'il
   existe), l'accueil, la page du livre, les outils et le soutien. Le plus simple est
   de partir des pages d'une langue de même forme, `pt/` ou `ru/`. Placer les
   marqueurs `@livre-acces`, `@autres-editions`, `@accueil-livre`, `@carte-livre` et
   `@couverture` comme dans `pt/`.

Puis régénérer, dans cet ordre :

```
node scripts/build-lexiques.js
node scripts/build-travaux.js
node scripts/build-langues.js
node scripts/build-couverture.js
node scripts/build-header.js
```

Si le livre est déjà là, faire ensuite le cas A.

## Ce que les contrôles vérifient, sans liste à tenir

Ils lisent la table `LANGUES`, pas une copie :

- `tools/check_glossaire.mjs` : une colonne par langue, une traduction par concept ;
- `tools/compte_hreflang.mjs` : les dossiers de langue, et la réciprocité de chaque
  hreflang ;
- `tools/check_doi_licences.mjs` : le DOI et la licence sur chaque page d'une langue
  ajoutée ;
- `tools/check_six_langues.mjs` : N × N destinations du sélecteur, et la tenue à
  390 px ;
- `tools/check_accessibilite.mjs` et `tools/check_pages_console.mjs` : les pages des
  langues ajoutées ;
- `tools/check_parcours_langues.mjs` : accueil → livre → visionneuse → PDF dans
  chaque langue parue, l'interface de la visionneuse comprise ;
- `scripts/build-langues.js --verifie` et `scripts/build-couverture.js --verifie` :
  rien d'engendré n'est en retard sur l'état du dépôt.

## Ce qui reste écrit à la main

Ce sont des **traductions**, pas de la structure : les pages rédigées, le lexique,
les textes des travaux, le pied de page, la colonne du glossaire. Une langue sans ces
textes ne peut pas exister sur le site ; une langue qui les a ne demande rien d'autre.
Les traductions faites par Claude sont à relire par un lecteur natif :
`TODO-RELECTURE.md`.
