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
