# Modules portables

Les modules de cette liste sont destinés à être repris hors du site : dans une
application, avec les motifs et la cymatique. Rien n'est construit pour cette
application aujourd'hui. Cette liste sert à ne pas perdre ce qui la rend
possible : des modules montés avec des paramètres, sans rien de propre à une
page.

## La règle

Un module portable ne prend **aucune dépendance au site** :

- **pas d'identifiant de page** : ni `document.getElementById`, ni sélecteur
  `#…` littéral. Le module reçoit l'élément où se monter (`section`, `racine`)
  et ne cherche qu'à l'intérieur, par classe ou par `data-r` ;
- **pas d'adresse du site** : ni `anibal-amiot.com`, ni page `….html` en dur.
  Une action qui mène ailleurs (Figer, par exemple) est une fonction passée en
  paramètre par la page ;
- **pas de lecture de données par leur chemin** : ni `fetch`, ni
  `readFile`, ni `import()`, ni `new URL('…', import.meta.url)`. Les données
  entrent par paramètre, déjà lues, comme `source` dans
  `monterOutilFondEcran(section, { source, … })` ;
- **pas de style global** : le module n'ajoute ni `<style>` ni feuille de
  style au document ;
- **pas d'import hors de la liste** : un module portable n'importe que des
  modules portables. Sans cette clause, la règle se contournerait d'un import.

Lire et écrire les paramètres de l'adresse courante (`location.search`,
`history.replaceState`) reste permis : ce n'est pas propre au site, toute page
ou vue d'application en a une.

Le contrôle `tools/check_modules_portables.mjs` fait respecter la règle, en CI,
à chaque PR. `--essai` vérifie qu'il mord : il viole chaque règle tour à tour
dans une copie temporaire, et s'assure qu'un commentaire qui cite les mêmes
motifs ne le fait pas échouer.

## La liste

Le contrôle lit la liste entre ces deux marqueurs, un chemin par ligne.

<!-- modules-portables:debut -->
```
assets/outil-fond-ecran.js
assets/animation-bicolore.js
assets/couleurs.js
assets/bicolore-fonds.js
assets/lecture-binaire.js
assets/proximite-binaire.js
assets/etat-fond-ecran.js
assets/svg-en-pixels.js
```
<!-- modules-portables:fin -->

| Module | Rôle |
|---|---|
| `assets/outil-fond-ecran.js` | L'outil d'animation : cartes, plein écran, micro, fichier audio, méditatif, Full Réactif, densité, pause, enregistrement. Monté deux fois sur `fonds-ecran.html`. |
| `assets/animation-bicolore.js` | La tuile bicolore de l'animation, sortie du moteur des pages. Sans lui, l'outil n'a que le tricolore. |
| `assets/couleurs.js` | Les couleurs, une seule fois : rouge, blanc, crème, encre, gris, et les palettes. |
| `assets/bicolore-fonds.js` | Le moteur des fonds : collection, lecture, SVG du motif et du pavage. |
| `assets/lecture-binaire.js` | La lecture binaire d'un motif (12 × 12, triangles et quarts). |
| `assets/proximite-binaire.js` | La distance entre deux motifs sur leur lecture binaire, pour le parcours. |
| `assets/etat-fond-ecran.js` | L'état partagé (collection, couleurs) : un seul écrivain. |
| `assets/svg-en-pixels.js` | La rastérisation d'un SVG du moteur, le chemin commun de l'animation et de l'export. |

## Ce qui n'est pas dans la liste, et pourquoi

| Fichier | Raison |
|---|---|
| `tools/video_reference.mjs` | Un outil du dépôt, pas un module. Il sert le dépôt entier en local, lit le registre `data/fonds/collections-pinterest.json` par son chemin, et dépose ses vidéos dans `assets/animations/` par `affiches_animations.mjs`. Il ne s'exécute pas dans une application. Ce qui s'y porterait, le rendu des images de la vidéo, est déjà dans la liste (`bicolore-fonds.js`, `lecture-binaire.js`, `svg-en-pixels.js`). |
| `assets/vue-fond-motif.js` | La vue des pages de motif : elle lit `data/fonds/collection-v1.json` par son chemin et pose `window.selecteurFonds`. Elle garde `svgEnPixels` en réexport, pour ses appelants. |
| `assets/vue-fond-ecran.js` | Le pilote du sélecteur sur les pages du site (`#ffCouleur1`, `#ffSelecteur`…) et le chargement des données par leur chemin. |
| `assets/selecteur-fonds.js` | Le sélecteur de collection ajoute sa feuille de style au `<head>` (`#sf-style`). Il sera nécessaire à l'application. Pour l'y faire entrer, il faudra que sa feuille de style voyage à côté de lui au lieu d'être injectée. |
| `assets/animation-collection.js` | Le moteur de la galerie d'animations, validée, à laquelle on ne touche pas : il porte `SITE = 'anibal-amiot.com'` et lit le registre par son chemin. |
| la cymatique | Elle n'existe pas encore en module : son code est dans `cymatique.html`. Il faudra l'extraire avant le portage. |

## Dépendances restantes, connues

Elles ne relèvent pas du contrôle, mais un portage devra s'en occuper :

- **le style de l'outil d'animation** (`.fe-stage`, `.fe-hud`, `.cat-card`…)
  est dans `fonds-ecran.html`. Le module n'en ajoute aucun, ce qui respecte la
  règle, mais il ne s'affiche correctement qu'avec cette feuille. Au portage,
  elle devra devenir un fichier qui accompagne le module ;
- **les textes d'aide** de l'outil citent la page Tirage et la galerie
  bicolore. C'est du texte, pas un lien, mais il faudra le réécrire pour
  l'application.
