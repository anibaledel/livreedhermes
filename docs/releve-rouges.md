# Les rouges du site — relevé

*Mesuré le 2026-10-03 par `tools/releve_rouges.mjs` (`--md` pour ce tableau). Rien n'est
corrigé ici : la mesure d'abord, puis l'unification en un seul endroit.*

« Rouge » se calcule : teinte HSL dans [345°, 15°], saturation ≥ 0,35, luminosité dans
[0,15 ; 0,85]. Le magenta du corpus `#ee2a7b` (335°) en est exclu : c'est une couleur de
motif, pas de charte. Les niveaux de gris ne sont pas des rouges.

## Avant — `main` (6f3b01ef)

977 fichiers HTML, CSS et JS suivis par git (hors vendor/, pagefind/, *.min.js). **10 rouges distincts, 1065 occurrences.**

| rouge | teinte | occurrences | fichiers | sur #f2f2f0 | sur #000 / #0a0a0a / #111 | usages | où |
|---|---|---|---|---|---|---|---|
| `#db694c` | 12° | 1033 | 517 | 3.05:1 | 6.14 / 5.79 / 5.52 | motif (palette / défaut) 1032 · autre 1 | creation-motifs-yi-king.html, fonds-ecran.html, fr/motifs/bases-yang-h0.html… (517) |
| `#e0261b` | 3° | 21 | 11 | 4.20:1 | 4.46 / 4.21 / 4.01 | motif (palette / défaut) 8 · autre 6 · texte 2 · fond 2 · bordure 1 · accent (box-shadow) 1 · variable --red 1 | assets/couleurs.js, assets/soutien-gate.js, creation-bicolore-v2.html… (11) |
| `#b00020` | 349° | 2 | 2 | 6.53:1 | 2.87 / 2.70 / 2.58 | texte 2 | assets/selecteur-fonds.js, tools/planche_fonds.mjs |
| `#d64444` | 0° | 2 | 1 | 3.93:1 | 4.77 / 4.50 / 4.29 | variable --err 1 · fond 1 | carter-demo.html |
| `#e2261b` | 3° | 2 | 1 | 4.14:1 | 4.53 / 4.27 / 4.07 | autre 2 | style.css |
| `#f08080` | 0° | 1 | 1 | 2.31:1 | 8.10 / 7.64 / 7.29 | texte 1 | carter-demo.html |
| `#ff8a80` | 5° | 1 | 1 | 2.04:1 | 9.20 / 8.67 / 8.27 | texte 1 | fonds-ecran.html |
| `#e63b31` | 3° | 1 | 1 | 3.72:1 | 5.03 / 4.75 / 4.53 | variable --red 1 | style.css |
| `#5a120e` | 3° | 1 | 1 | 12.26:1 | 1.53 / 1.44 / 1.37 | variable --red-dim 1 | style.css |
| `#b3221a` | 3° | 1 | 1 | 5.93:1 | 3.16 / 2.98 / 2.84 | variable --red 1 | style.css |

Écartés (teinte hors de [345°, 15°]) : `#ee2a7b` 335° (1039), `#ee2e7b` 336° (1) — le magenta du corpus, pas un rouge.

## Le point de contraste, à trancher

Le site est **sombre** : son rouge de charte `--red` (`#e63b31`, `style.css`) sert surtout de
**texte** sur `--bg` `#000`, `--panel` `#0a0a0a` et les cartes au survol `#111` — 609
déclarations `color: var(--red)`, plus 82 bordures, fonds et ombres. Il a été choisi pour
passer le seuil du texte courant, 4,5:1, sur ces trois fonds (5,03 / 4,75 / 4,53).

| | sur #000 | sur #0a0a0a | sur #111 | sur #f2f2f0 |
|---|---|---|---|---|
| `#e0261b`, le rouge retenu | 4,46 | 4,21 | **4,01** | 4,20 |
| `#e63b31`, le `--red` actuel | 5,03 | 4,75 | 4,53 | 3,72 |

Aligner `--red` sur `#e0261b` fait passer le texte rouge **sous 4,5:1 sur les trois fonds
sombres** du site (et l'impression, `#b3221a`, à 4,71:1 sur papier blanc, resterait
lisible). C'est le cas « texte fin » : signalé, pas corrigé.

## Les autres rouges

- `#db694c` (1033 occurrences, 517 fichiers) : la **teinte par défaut de l'outil
  monochrome** des pages de motifs (`scripts/generate-motif-pages.js`), de
  `creation-motifs-yi-king.html` et du rendu tricolore « teinte unique » de
  `fonds-ecran.html` — une couleur de motif, d'où l'outil tire trois niveaux de luminance.
  Ni la charte, ni le gris `#808285` du rendu monochrome du site.
- `#ff8a80` (fonds-ecran, galerie d'animations) : le texte « H.264 indisponible » —
  9,2:1 sur le noir ; en `#e0261b`, 4,46:1.
- `#b00020` (`assets/selecteur-fonds.js`, `.sf-av`) : un avertissement en texte, sur le
  panneau clair du sélecteur (6,53:1 sur `#f2f2f0`) ; les pages sombres le surchargent en
  `var(--red)` (`assets/fond-ecran-fixe.css`).
- `#d64444`, `#f08080` : `carter-demo.html`, thème à part déclaré dans `style.css`.
- `#5a120e` (`--red-dim`) : décor seul, jamais de texte ; `#b3221a` : le `--red` d'impression.
- `#e2261b` : cité dans un commentaire de `style.css`, employé nulle part.
- `#c8102e` : couleur d'essai des tests (une couleur « choisie »), pas du site.

## Le texte rouge, classé par taille réelle

*Mesuré par `tools/releve_texte_rouge.mjs` : chaque déclaration `color: var(--red)` des
fichiers HTML et CSS, chaque élément qu'elle atteint ouvert dans Chromium à 1280 et 390 px —
taille et graisse calculées, fond opaque réel en remontant. Gros texte (WCAG 2) : ≥ 24 px,
ou ≥ 18,66 px en graisse ≥ 700, seuil 3:1 ; petit texte : le reste, seuil 4,5:1.*

**607 déclarations** dans les fichiers HTML et CSS (la 608ᵉ est le gabarit
`scripts/generate-motif-pages.js`, dont les 512 pages de motifs sont la sortie).

| | déclarations | avec `#e0261b` | avec `#e63b31` (actuel) |
|---|---|---|---|
| **gros texte** | **0** | — | — |
| petit texte sur fond sombre (`#000` 42, `#0a0a0a` 8, `#111` 1) — 11 à 20 px, graisse 300 ou 400 | 50 | **50 sous 4,5:1** (4,01 à 4,46) | 0 sous 4,5:1 (4,53 à 5,03) |
| petit texte sur blanc `#fff` — **une seule règle**, `.vue-fond .sf-av`, l'avertissement du sélecteur de fond, 10,5 px, répétée dans les 512 pages de motifs | 512 | 0 (4,71:1) | **512 sous 4,5:1** (4,17) |
| non rendu au chargement (état `.current`, `.active`, ou contenu créé au tirage) — tailles déclarées 8 à 18 px : du petit texte | 43 | sous 4,5:1 s'ils sont sur fond sombre | — |
| pas du texte (ligne active, conteneur) | 2 | — | — |

Ce que le rouge porte réellement : **des surtitres** (`header .eyebrow`, 11 à 14 px,
graisse 300), **des boutons et des appels** (« Lire en ligne », « Soutenir », « Tirer aux
pièces »), **l'état courant** de la navigation et des sélecteurs, et des mots-clés. Pas un
titre, pas un gros caractère. Hors des 512 copies d'une même règle, il reste **95
déclarations**, dont 50 mesurées et 43 non rendues — du petit texte presque partout.

Détail, déclaration par déclaration :


| déclarations | fichier | sélecteur | classe | taille min. | graisse | fond (pire) | #e0261b | #e63b31 | exemple |
|---|---|---|---|---|---|---|---|---|---|
| 512 | motifs/*.html, fr/motifs/*.html (gabarit generate-motif-pages.js) | `.vue-fond .sf-av` | petit texte | 10.5 px | 300 | #ffffff | 4.71:1 | 4.17:1 | no more contrast at a distance |
| 1 | articles.html:209 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | articles.html:210 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | articles/arlequin-trismegiste.html:200 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | articles/verticalite-damier-mosaique-echiquier.html:205 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | bicolore.html:492 | `style="…"` | non rendu | — | — | — | — | — |  |
| 1 | chiffres-et-sources.html:175 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | chiffres-et-sources.html:176 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | creation-bicolore-v2.html:67 | `.info-line .sf-av` | non rendu | — | — | — | — | — |  |
| 1 | creation-motifs-yi-king.html:88 | `header .eyebrow` | non rendu | — | — | — | — | — |  |
| 1 | creation-motifs-yi-king.html:285 | `.sel-card .group-label` | non rendu | — | — | — | — | — |  |
| 1 | creation-motifs-yi-king.html:364 | `.detail-pavage .tick.on` | non rendu | — | — | — | — | — |  |
| 1 | creation-motifs-yi-king.html:372 | `.detail-info .num-big` | non rendu | — | — | — | — | — |  |
| 1 | creation-motifs-yi-king.html:398 | `.pair-section .tag` | non rendu | — | — | — | — | — |  |
| 1 | en/articles/index.html:108 | `.home-cta a` | non rendu | — | — | — | — | — |  |
| 1 | en/articles/thrice-great-harlequin.html:202 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | en/articles/verticality-chequer-mosaic-chessboard.html:207 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | encodeur.html:92 | `.pro-locked-box button` | non rendu | — | — | — | — | — |  |
| 1 | fonds-ecran.html:132 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | fonds-ecran.html:133 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | galerie-patterns-unifies.html:127 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | galerie-patterns-unifies.html:128 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:192 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:193 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:224 | `.dice-btn.selected` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:237 | `.result-idea .kw` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:261 | `.hex-text-block .keyword` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:263 | `.hex-text-block .keyword-sub` | non rendu | — | — | — | — | — |  |
| 1 | impression.html:269 | `.hex-text-block .hex-title` | non rendu | — | — | — | — | — |  |
| 1 | index.html:135 | `.app-lang-btn.active` | non rendu | — | — | — | — | — |  |
| 1 | index.html:136 | `.book-bar .read-btn` | non rendu | — | — | — | — | — |  |
| 1 | index.html:227 | `.num-big` | non rendu | — | — | — | — | — |  |
| 1 | index.html:288 | `.trigram-card .txt .role` | non rendu | — | — | — | — | — |  |
| 1 | index.html:299 | `.xref-btn .n` | non rendu | — | — | — | — | — |  |
| 1 | index.html:303 | `.keyword` | non rendu | — | — | — | — | — |  |
| 1 | index.html:306 | `.keyword-sub` | non rendu | — | — | — | — | — |  |
| 1 | lexique.html:283 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | lexique.html:284 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | telechargements.html:85 | `.pro-locked-box button` | non rendu | — | — | — | — | — |  |
| 1 | unified-patterns.html:135 | `.num-big` | non rendu | — | — | — | — | — |  |
| 1 | unified-patterns.html:140 | `.keyword` | non rendu | — | — | — | — | — |  |
| 1 | unified-patterns.html:141 | `.keyword-sub` | non rendu | — | — | — | — | — |  |
| 1 | unified-patterns.html:173 | `.site-nav-btn[aria-current="page"]` | non rendu | — | — | — | — | — |  |
| 1 | unified-patterns.html:213 | `.site-nav-btn.current` | non rendu | — | — | — | — | — |  |
| 1 | assets/fond-ecran-fixe.css:11 | `.ff-description .sf-av, .ff-erreur` | pas du texte | — | — | — | — | — |  |
| 1 | cymatique.html:181 | `.gamme-row.on` | pas du texte | — | — | — | — | — |  |
| 1 | 404.html:33 | `.eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Erreur 404 |
| 1 | 404.html:41 | `.retour` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Retour à l'accueil |
| 1 | book-viewer/index.html:78 | `header .eyebrow` | petit texte | 11.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | book-viewer/index.html:90 | `.lang-btn.active` | petit texte | 10.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Français |
| 1 | book-viewer/index.html:120 | `.nav-btn:hover` | petit texte | 15.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | ‹ |
| 1 | contact.html:78 | `.contact-email` | petit texte | 20.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | anibaledel@gmail.com |
| 1 | creation-bicolore-v2.html:44 | `.gen-btn[aria-pressed="true"]` | petit texte | 12.0 px | 300 | #0a0a0a | 4.21:1 | 4.75:1 | L00° |
| 1 | creation-bicolore-v2.html:57 | `.info-line .badge.inverse` | petit texte | 11.0 px | 300 | #0a0a0a | 4.21:1 | 4.75:1 | inversée |
| 1 | creation-motifs-yi-king.html:158 | `.site-nav-btn.current` | petit texte | 13.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Multicolore |
| 1 | creation-motifs-yi-king.html:243 | `.cat-btn.active` | petit texte | 15.0 px | 400 | #0a0a0a | 4.21:1 | 4.75:1 | Bases16 images · 4 axes de base |
| 1 | creation-motifs-yi-king.html:244 | `.cat-btn.active .n` | petit texte | 12.5 px | 400 | #0a0a0a | 4.21:1 | 4.75:1 | 16 images · 4 axes de base |
| 1 | cymatique.html:88 | `header .kicker` | petit texte | 12.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | cymatique.html:127 | `.app-lang-btn.active` | petit texte | 12.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | FR |
| 1 | cymatique.html:137 | `.echelle-btn.active` | petit texte | 12.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | Ordinale |
| 1 | cymatique.html:158 | `button.active` | petit texte | 12.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | Ordinale |
| 1 | en/about/index.html:96 | `.patent-title .num` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | FR2840678 |
| 1 | en/book/index.html:68 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Read the book online → |
| 1 | en/index.html:49 | `.home-cta a` | petit texte | 15.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Read online |
| 1 | encodeur.html:124 | `.enc-btn` | petit texte | 11.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | Lancer la démonstration |
| 1 | encodeur.html:184 | `.site-nav-btn[aria-current="page"]` | petit texte | 13.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Encodeur |
| 1 | es/index.html:50 | `.home-cta a` | petit texte | 15.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Leer en línea |
| 1 | es/libro/index.html:68 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Leer el libro en línea → |
| 1 | fonds-ecran.html:68 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | fr/livre/index.html:68 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Lire le livre en ligne → |
| 1 | galerie-bicolore.html:28 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | galerie-bicolore.html:42 | `.controls button.active` | petit texte | 13.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Grain C8 — triangle |
| 1 | galerie-patterns-unifies.html:25 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | galerie-patterns-unifies.html:61 | `.controls button.active` | petit texte | 13.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Toutes (1024) |
| 1 | impression.html:88 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | impression.html:209 | `.cat-num` | petit texte | 13.0 px | 300 | #111111 | 4.01:1 | 4.53:1 | Catégorie I |
| 1 | impression.html:413 | `style="…"` | petit texte | 13.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Effectuer le tirage |
| 1 | impression.html:1604 | `style="…"` | petit texte | 13.5 px | 400 | #000000 | 4.46:1 | 5.03:1 | Effectuer le tirage |
| 1 | index.html:104 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | index.html:117 | `.home-menu a.home-menu-soutien` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Soutenir |
| 1 | index.html:120 | `.home-cta a` | petit texte | 14.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Lire en ligne |
| 1 | index.html:178 | `.axis-note b` | petit texte | 12.5 px | 400 | #0a0a0a | 4.21:1 | 4.75:1 | supérieur |
| 1 | index.html:208 | `.draw-btn` | petit texte | 14.0 px | 400 | #0a0a0a | 4.21:1 | 4.75:1 | Tirer aux pièces (6 traits) |
| 1 | profil.html:116 | `.patent-title .num` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | FR2840678 |
| 1 | ru/book/index.html:74 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Читать (FR) → |
| 1 | ru/index.html:49 | `.home-cta a` | petit texte | 15.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Читать онлайн |
| 1 | ru/support/index.html:59 | `.pro-cta` | petit texte | 12.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | Оплатить на французской странице |
| 1 | soutenir.html:43 | `.pro-cta` | petit texte | 12.0 px | 400 | #000000 | 4.46:1 | 5.03:1 | Soutenir |
| 1 | telechargements.html:98 | `.site-nav-btn[aria-current="page"]` | petit texte | 13.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | Motifs SVG |
| 1 | th/book/index.html:68 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | อ่านหนังสือออนไลน์ → |
| 1 | th/index.html:50 | `.home-cta a` | petit texte | 15.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | อ่านหนังสือออนไลน์ |
| 1 | unified-patterns.html:40 | `header .eyebrow` | petit texte | 14.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | La Livrée d'Hermès |
| 1 | unified-patterns.html:95 | `.axis-note b` | petit texte | 12.5 px | 400 | #0a0a0a | 4.21:1 | 4.75:1 | Tirage |
| 1 | zh/book/index.html:73 | `.book-btn.primary` | petit texte | 12.5 px | 300 | #000000 | 4.46:1 | 5.03:1 | 在线阅读（法文）→ |
| 1 | zh/index.html:49 | `.home-cta a` | petit texte | 15.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | 在线阅读 |
| 1 | zh/support/index.html:51 | `.pro-cta` | petit texte | 12.0 px | 300 | #000000 | 4.46:1 | 5.03:1 | 前往法文页面付款 |

## Les deux rouges, en distance perceptuelle

| | ΔE76 | ΔE2000 |
|---|---|---|
| `#e0261b` contre `#e63b31` | 8,7 | 4,2 |
| `#e0261b` contre `#db694c` | 31,3 | 11,5 |

Les valeurs d'Anibal (8,7 et 31,3) sont des ΔE76 ; en ΔE2000, la formule perceptuelle
corrigée, l'écart est plus petit, mais reste au-dessus du seuil de visibilité (≈ 2) dans les
deux cas. `#db694c` est une terre cuite, pas un rouge de la charte : elle reste où elle est.
