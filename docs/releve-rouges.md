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
