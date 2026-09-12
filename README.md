# La Livrée d'Hermès — site d'Anibal Amiot

Site de **La Livrée d'Hermès**, le travail d'Anibal Edelberto Amiot autour du
Yi King, des motifs textiles génératifs et de la stéganographie géométrique.
Site statique servi tel quel — pas d'étape de compilation, pas de framework :
chaque page est un fichier HTML autonome que l'on peut ouvrir depuis le disque.

Les pages lourdes (galerie des 884 motifs, encodeur, impression) embarquent leur
JavaScript en ligne. Ce qui est partagé entre plusieurs pages vit dans
`assets/*.js` et se charge par une balise `<script src>`.

## Ce que contient le dépôt

```
/
├── index.html                       tirage Yi King (page d'accueil)
├── tirage-livree-hermes.html        tirage et numérotation binaire
├── creation-motifs-yi-king.html     création de motifs
├── impression.html                  impression 360
├── galerie-884-patterns-unifies.html galerie des 884 motifs unifiés
├── unified-patterns.html            présentation des motifs unifiés
├── fonds-ecran.html                 fonds d'écran
├── articles.html + articles/        six articles de fond
├── hexagrammes/                     index + 64 pages, une par hexagramme (générées)
├── lexique.html, a-propos.html, profil.html, contact.html
├── pro.html, pro-contenu.html, pro-succes.html    palier Pro (99 €)
├── soutien-succes.html              retour de paiement du soutien
├── encodeur.html                    SecuBox : stéganographie et chiffrement
├── book-viewer/                     liseuse du livre + PDF (fr, en, es, th)
├── fr/livre/, en/book/, es/libro/, th/book/       pages de vente du livre
├── assets/                          images, motifs, JS partagé (~7 700 fichiers)
├── data/                            référents géométriques 256 et 360
├── scripts/                         génération hors ligne (Node)
├── worker/                          backend Cloudflare Worker (Stripe)
├── stegano/, secubox/, disk/        implémentations Python de SecuBox
└── sitemap.xml, robots.txt, .htaccess
```

`motifs (4).html` et `pages.html` ne sont que des redirections conservées pour
les anciens liens.

## JavaScript partagé (`assets/`)

| Fichier | Rôle |
|---|---|
| `calque-engine.js` | moteur de composition des motifs : reconstruit la grille de calques pour chaque nature de trait (Yang, Yang mutant, Yin, Yin mutant) |
| `articles-data.js` | source unique des métadonnées d'articles, lue par `articles.html` et par chaque page d'article |
| `soutien-gate.js` | soutien à prix libre — verrouille les téléchargements SVG et PDF |
| `pro-gate.js` | palier Pro à prix fixe, jeton distinct de celui du soutien |
| `share-widget.js` | bloc « Partager cette page » |

Les deux paliers sont indépendants : posséder l'un ne donne pas accès à l'autre.
Les jetons vivent sous deux clés `localStorage` distinctes (`soutien_token`,
`pro_token`) et sont vérifiés auprès du Worker.

## Modifier le contenu

Le texte est **dans les pages HTML**. Pour changer un paragraphe, éditer le
fichier de la page concernée.

Deux exceptions, où il ne faut pas toucher au HTML :

- **Métadonnées d'articles** (titre, catégorie, date, ordre) →
  `assets/articles-data.js`. La grille de `articles.html` et la navigation
  précédent/suivant de chaque article en découlent.
- **Pages d'hexagrammes** → elles sont générées, voir ci-dessous. Une
  modification faite à la main dans `hexagrammes/` sera écrasée à la
  prochaine génération.

## Génération hors ligne (`scripts/`)

Ces scripts ne tournent **pas** dans le navigateur : ils produisent des fichiers
que l'on commite ensuite. `cd scripts && npm install` avant la première
utilisation (dépendances : `@napi-rs/canvas`, `pdfkit`, `archiver`).

| Script | Produit |
|---|---|
| `extract-hexagram-data.js` | extrait les tables d'hexagrammes depuis `index.html` |
| `generate-hexagram-assets.js` | un PNG de carré/pavage par hexagramme → `assets/hexagrammes/` |
| `generate-hexagram-pages.js` | les 64 pages `hexagrammes/<n>-<pinyin>-<nom>.html` |
| `export-galerie-884.js` | SVG + JPEG Pinterest + métadonnées + archive ZIP |
| `export-galerie-884-hires.js` | PNG 4096×4096 (Pinterest, Adobe Stock) |
| `export-galerie-884-pinterest.js` | PNG au format Pinterest, pour publication programmée |
| `export-galerie-884-vector.js` | 884 SVG par catégorie (cellules/pavages × tricolore/monochrome) |
| `generate-sitemap.js` | `sitemap.xml` |

La chaîne des hexagrammes s'exécute dans l'ordre du tableau : les données
d'abord, puis les images, puis les pages qui les référencent.

## Sitemap

`sitemap.xml` n'est pas maintenu à la main. `scripts/generate-sitemap.js` liste
automatiquement `articles/` et `hexagrammes/`, y ajoute les pages fixes
déclarées dans `STATIC_PAGES` en tête du script, et calcule chaque `<lastmod>`
depuis la date du dernier commit Git du fichier.

- **Automatique** : `.github/workflows/update-sitemap.yml` relance le script à
  chaque push sur `main` et recommite `sitemap.xml` s'il a changé.
- **Manuel** : `node scripts/generate-sitemap.js` depuis la racine.
- Une page qui n'est ni un article ni un hexagramme doit être ajoutée à
  `STATIC_PAGES` pour apparaître.

`sitemap-pdf.xml` est en revanche maintenu à la main.

## Backend (`worker/`)

Cloudflare Worker qui gère les paiements Stripe des deux paliers et délivre les
jetons d'accès. Le site statique n'est pas modifié par ce Worker : il est
seulement appelé en `fetch()` depuis le navigateur, à
`livreedhermes-soutien.anibalamiot.workers.dev`.

Voir `worker/README.md` pour la mise en place (Stripe, KV, `wrangler deploy`).

## SecuBox — stéganographie et chiffrement

Deux implémentations parallèles, l'une en Python et l'autre en JavaScript, de
constructions géométriques originales (référents 256 et 360 dans `data/`) :

| Emplacement | Contenu |
|---|---|
| `stegano/stegano_lib.py` | dissimulation géométrique, grilles Carter 256 / 360 / Mix |
| `stegano/carter.py` | grille Carter autonome (256 / 360 / Mix / Random / 18 / Hybrid) |
| `secubox/secu_box.py` | identités X25519, échange de clés authentifié, déni plausible |
| `secubox/vault_lib.py` | vault de fichiers chiffré (Argon2id + ChaCha20-Poly1305 à nonce étendu par HKDF) |
| `secubox/secu_box_cli.py` | CLI `secu-box` |
| `disk/disk_lib.py` | chiffrement de fichiers (diversification géométrique + ChaCha20-Poly1305) |
| `encodeur.html` | portage navigateur (Web Crypto) |

Dépendances Python : `cryptography`, `argon2-cffi`.

`stegano/legacy/grid_90.py` (grille 90×90 à trois niveaux) est sorti du
chemin de production le 2026-09-12 : son rôle d'origine — banc d'essai pour
l'implantation des deux référents et bruit structurel dans le code — est
désormais couvert par les blocs pure/structured de Carter, vérifiés par des
preuves formelles. Conservé à titre de référence historique, avec ses
propres tests (`stegano/legacy/test_grid_90.py`), sur l'ancien schéma de
référent.

**Les deux implémentations ne sont pas interchangeables.** Le navigateur ne
dispose nativement ni d'Argon2id ni de la construction ChaCha20-Poly1305 à
nonce étendu par HKDF utilisée côté Python (LH-5 — ce n'est pas du
XChaCha20-Poly1305 standard) ; `encodeur.html` leur substitue PBKDF2 et
AES-256-GCM, et son échange de clés est authentifié par
comparaison hors bande d'une chaîne de 128 bits, là où la CLI Python lie les
identités long terme à la session par un triple DH. Les sessions dérivées de
part et d'autre ne se correspondent pas. Pour un usage sensible, préférer la
CLI Python. L'onglet « À propos » de `encodeur.html` détaille chaque écart.

La couche cryptographique repose sur des primitives standard ; la couche
géométrique est **en cours d'évaluation formelle** et n'est pas revendiquée
comme un chiffrement autonome. Un audit cryptologique a été mené le 2026-09-10
(voir l'historique Git). Mesures de performance sur matériel arm64 réel
(MOCHAbin) : voir [`BENCHMARKS_ARM64.md`](BENCHMARKS_ARM64.md).

## Déploiement

Site statique servi depuis la racine du dépôt, sur `anibal-amiot.com`.

`.htaccess` prend en charge la redirection HTTPS et les redirections des
anciennes URL — il n'est lu que par Apache, et resterait sans effet sur un
hébergement qui l'ignore (GitHub Pages, par exemple). Le dépôt ne contient pas
de fichier `CNAME`.

## Licences

Double licence : AGPL v3 pour l'usage non commercial (`LICENSE`), licence
commerciale sur demande (`LICENSE-COMMERCIAL`). Voir `NOTICE` pour les
attributions et le brevet FR2865054.

**Exception — sources du livre.** Les planches et fichiers sources de
*La Livrée d'Hermès* dans `data/referent_256_src/` et
`data/referent_360_src/` ne relèvent pas de l'AGPL v3 : ils sont diffusés
par l'auteur sous licence **Creative Commons Attribution - Pas d'Utilisation
Commerciale 4.0 International (CC BY-NC 4.0)**. Le code qui les lit
(`tools/`) et les référents JSON qu'il en dérive
(`data/referent_256_v3.json`, `data/referent_360_v3.json`, les référents
pseudo-aléatoires et leurs empreintes) restent sous AGPL v3. Détails :
[`data/referent_256_src/LICENSE.md`](data/referent_256_src/LICENSE.md),
[`data/referent_360_src/LICENSE.md`](data/referent_360_src/LICENSE.md).
