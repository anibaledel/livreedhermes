# includes/ — les fragments partagés

Chaque fichier ici est la **source unique** d'une zone présente sur toutes les
pages. Aucune page ne porte de copie : `scripts/build-header.js` les recopie
entre des marqueurs, et `tools/check_header_sync.mjs` échoue si une page ne
correspond plus à ce que les fragments produiraient.

| Fragment | Zone | Marqueurs |
|---|---|---|
| `head-icons.html` | les icônes du site, dans `<head>` | `@head-icons:start` / `:end` |
| `header.html` | l'en-tête visible : logo puis traducteur | `@header:start` / `:end` |
| `translate-slot.html` | l'emplacement du widget, inséré dans `header.html` à la place de `{{TRADUCTEUR}}` | — |
| `translate-script.html` | le chargement du widget, avant `</body>` | `@translate:start` / `:end` |
| `footer.html` | le pied partagé : navigation du site et licences, à la fin de `.wrap` | `@footer:start` / `:end` |

`{{BASE}}` est remplacé par le préfixe de remontée de chaque page (`""` à la
racine, `"../"` dans `articles/`, `"../../"` dans `en/book/`).

## Pourquoi un fragment et pas une copie

Un en-tête collé dans cent pages diverge à la première correction. C'est déjà
arrivé ici : trois formes d'en-tête coexistaient, trois pages portaient un
emplacement de traduction que le script n'alimentait jamais, et une quatrième
un `<div>` stylé en ligne au lieu de la classe commune. Rien ne le signalait.

## Pourquoi le script est en fin de page et le widget dans l'en-tête

`translate-script.html` charge `element.js` depuis Google, en synchrone. Placé
dans l'en-tête, il bloquerait le rendu de tout ce qui suit — or le logo est
l'élément le plus gros du premier écran. Le script va donc avant `</body>`,
tandis que l'emplacement **visible** du widget reste dans l'en-tête, sous le
logo : c'est le `<div id="google_translate_element">` que Google remplit une
fois chargé.

## Le traducteur n'est pas partout

Les pages du livre (`fr/livre/`, `en/book/`, `es/libro/`, `th/book/`) et
`book-viewer/` en sont exclues : elles sont déjà traduites à la main, une
traduction automatique par-dessus n'aurait pas de sens. L'exclusion est une
liste déclarée dans `scripts/build-header.js`, pas un second fragment — la
source reste unique, l'exception est une donnée.

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
