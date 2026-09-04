# Anibal Amiot — Webapp

Vitrine du travail d'Anibal Amiot (motifs textiles, tirages, impressions) — webapp HTML/JS légère, pensée pour être servie telle quelle sur GitHub Pages avec un nom de domaine personnalisé (anibal-amiot.com).

## Structure du projet

```
/
├── index.html       → structure de la page (en-tête, nav, zone de contenu)
├── style.css         → design (tokens couleur/typo, layout)
├── app.js            → moteur : lit content.json, gère la navigation par boutons
├── content.json       → TOUT le texte du site (titres, intros, meta SEO)
└── assets/
    └── logo-caducee.gif  → logo animé (caducée)
```

## Comment ça marche

C'est une **single-page app** avec routage par ancre (`#id`) :
- `index.html` charge `app.js`, qui lit `content.json` au démarrage.
- Chaque page/bouton (accueil, tirage livrée, création de motifs, impression 360, projets, contact) est une entrée dans `content.json`, sous `pages`.
- La navigation (`nav` dans `content.json`) génère automatiquement les boutons en haut de page.
- Cliquer un bouton change l'URL (`#tirage-livree`, etc.) sans recharger la page ; `app.js` réagit à ce changement et affiche le bon contenu.

**Conséquence pratique : pour modifier un texte, il ne faut pas toucher au code**, juste éditer `content.json`. Voir plus bas.

## Modifier le contenu (texte, SEO)

Ouvrir `content.json`. Chaque page a cette forme :

```json
"tirage-livree": {
  "metaTitle": "Tirage livrée — Anibal Amiot",
  "metaDescription": "Commande et suivi de tirages livrés à l'adresse du client.",
  "eyebrow": "Bouton 1",
  "title": "Tirage livrée",
  "intro": "Texte affiché sous le titre."
}
```

- `metaTitle` / `metaDescription` → balises SEO de la page (title + meta description).
- `eyebrow` → petit label au-dessus du titre.
- `title` → titre principal (H1).
- `intro` → paragraphe d'introduction. Actuellement, plusieurs pages ont un texte `"REMPLACER : ..."` — c'est un espace réservé, à remplacer par le contenu réel de chaque bouton au fur et à mesure qu'Anibal le valide.

Pas besoin de toucher `app.js` ou `index.html` pour ces changements.

## Ajouter une page/bouton

1. Dans `content.json`, ajouter une entrée dans `nav` (id + label du bouton).
2. Ajouter l'entrée correspondante dans `pages` avec le même `id`.
3. Rien d'autre à faire — le bouton et la page apparaissent automatiquement.

## Logo

Le logo actuel (`assets/logo-caducee.gif`) est un GIF animé en boucle (4 variantes du caducée). Si une occurrence de l'ancien logo traîne encore ailleurs dans le code (autre page ou export du site précédent), chercher les références à l'ancien fichier et les remplacer par `assets/logo-caducee.gif`.

## Déploiement (GitHub Pages + domaine OVH)

1. Pousser ces fichiers à la racine du repo (branche par défaut, ex. `main`).
2. Dans les réglages du repo GitHub → **Pages** → activer GitHub Pages sur la branche `main`, dossier racine `/`.
3. Toujours dans **Pages**, section **Custom domain**, renseigner `anibal-amiot.com`.
4. Côté OVH, sur la zone DNS du domaine, ajouter les enregistrements pointant vers GitHub Pages (4 enregistrements A vers les IP GitHub Pages, + éventuellement un CNAME pour `www`). Voir la doc officielle GitHub : `docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site`.
5. Configurer les redirections des domaines secondaires (`.fr`, `.net`) vers `.com` côté OVH, pour éviter le contenu dupliqué.

## Sitemap (sitemap.xml)

`sitemap.xml` n'est pas maintenu à la main : il est généré par `scripts/generate-sitemap.js`, qui liste automatiquement tous les fichiers de `articles/` et `hexagrammes/` (plus les pages fixes déclarées en haut du script) et calcule `<lastmod>` depuis la date du dernier commit Git de chaque fichier.

- **Automatique** : `.github/workflows/update-sitemap.yml` relance ce script à chaque push sur `main` et recommite `sitemap.xml` s'il a changé — rien à faire après avoir publié un nouvel article ou une nouvelle page d'hexagramme.
- **Manuel** (si besoin de vérifier avant de pousser, ou si les Actions GitHub sont désactivées) : `node scripts/generate-sitemap.js` depuis la racine du dépôt, puis committer `sitemap.xml`.
- Pour ajouter une page qui n'est ni un article ni un hexagramme (ex. une nouvelle page d'outil), l'ajouter à la liste `STATIC_PAGES` en haut du script.

## À venir

- Contenu réel des pages "tirage livrée", "création de motifs", "impression 360", "projets & fonds d'écran", "contact" (actuellement en placeholder `REMPLACER`).
- Version anglaise du contenu (prévue pour le démarchage institutionnel en Thaïlande).
- Images/visuels dans `assets/` (actuellement seul le logo y figure).
