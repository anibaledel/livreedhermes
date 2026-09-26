# includes/ — les fragments partagés

Chaque fichier ici est la **source unique** d'une zone présente sur toutes les
pages. Aucune page ne porte de copie : `scripts/build-header.js` les recopie
entre des marqueurs, et `tools/check_header_sync.mjs` échoue si une page ne
correspond plus à ce que les fragments produiraient.

| Fragment | Zone | Marqueurs |
|---|---|---|
| `head-icons.html` | les icônes du site, dans `<head>` | `@head-icons:start` / `:end` |
| `header.html` | l'en-tête visible : le logo | `@header:start` / `:end` |
| `footer.html` | le pied partagé : navigation du site et licences, à la fin de `.wrap` | `@footer:start` / `:end` |

`{{BASE}}` est remplacé par le préfixe de remontée de chaque page (`""` à la
racine, `"../"` dans `articles/`, `"../../"` dans `en/book/`).

## Pourquoi un fragment et pas une copie

Un en-tête collé dans cent pages diverge à la première correction. C'est déjà
arrivé ici : trois formes d'en-tête coexistaient, trois pages portaient un
emplacement de traduction que le script n'alimentait jamais, et une quatrième
un `<div>` stylé en ligne au lieu de la classe commune. Rien ne le signalait.

## Le traducteur Google Translate a été retiré (2026-09-27)

Le site sert désormais quatre langues traduites à la main (`fr/livre/`,
`en/book/`, `es/libro/`, `th/book/`, `book-viewer/`). Le widget les
retraduisait par-dessus, rendant indistinguables les fautes d'origine et
celles de Google — ce qui annulait la relecture par des lecteurs natifs — et
les navigateurs proposent nativement une traduction. `scripts/build-header.js`
retire encore, à chaque passage, tout widget qu'une page porterait encore à la
main (`adopter()`), pour empêcher son retour.

## `<main>` et le pied

`scripts/build-header.js` pose aussi `<main>` entre `@main:start` et
`@main:end` : il ouvre après l'en-tête partagé et ferme avant la zone `.note`,
qui porte la navigation de bas de page et n'appartient pas au contenu propre à
la page. Une page qui possède déjà un `<main>` n'en reçoit pas un second — le
cas s'est produit sur `cymatique.html`, où la balise servait de conteneur de
grille ; elle y a été renommée en `.cym-workspace`.

Le pied porte le lien vers `profil.html`, qui n'avait que **deux** liens
entrants sur tout le site alors que c'est la page qui documente l'auteur. Elle
en a maintenant 93.

Les règles CSS du pied vivent dans `style.css`, avec les tokens : le CSS d'un
fragment a la même exigence de source unique que le fragment lui-même.

Les pages traduites à la main (`fr/livre/`, `en/book/`, `es/libro/`,
`th/book/`, `book-viewer/`) gardent leur propre pied — le pied partagé est
rédigé en français.
