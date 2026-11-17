# archive-medias — médias gardés hors de la publication

Cette branche ne contient que des fichiers qui ont quitté `main` pour alléger le site publié
(GitHub Pages refuse, par intermittence, de déployer une publication de plus de 1 Go).
**Rien n'a été supprimé** : chaque fichier est ici, au même chemin que sur `main` avant le
2026-11-06.

- `assets/animations/anciennes/` et `assets/motifs-pinterest/anciennes/` : les exportations
  remplacées (palette dans le nom du dossier ou du fichier), telles que `main` les portait.
- `assets/animations/<CODE>-1080x1920.mp4` et `…-affiche.png` : les ORIGINAUX des 32 vidéos
  réencodées le 2026-11-06 (H.264, CRF 26). `B2` et `P` n'ont pas été réencodées.
- `data/fonds/collections-pinterest.json` : le registre dans l'état de ces fichiers (empreintes
  SHA-256 des originaux).

Pour remettre un fichier : `git fetch origin archive-medias` puis
`git checkout origin/archive-medias -- <chemin>`.

## Ajout du 2026-11-17 (prompt 200, étape B)

- `assets/motifs-pinterest/` en entier (6 531 fichiers : pavages, cellules, corpus, encre crème, séries par
  collection) et `assets/motifs-svg/` en entier (3 536 SVG), tels que `main` les portait au commit `f87f22547`,
  aux mêmes chemins. Ils ne sont plus servis par le site ; aucune page indexée ne les chargeait.
- Les contrôles `tools/check_export_pinterest.mjs`, `tools/check_epingles_images.mjs` et
  `tools/check_echantillon_site.mjs` lisent cette branche (`tools/lib_archive.mjs`) et le disent (« ARCHIVÉ : … »).
- Pour restaurer en local : `node tools/restaurer_archive.mjs assets/motifs-pinterest assets/motifs-svg`.
