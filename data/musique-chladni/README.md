# data/musique-chladni/ — données de « Voir sa musique »

Blocs de structure des ordres 12, 18 et 30 (paquet n° 158, corpus v5 — voir `LISEZ-MOI.txt` et `SHA256SUMS.txt`), indices des collections, polygones des six bandes.
Contrôle : `node tools/musique_chladni_donnees.mjs`.

## `semaine.json` — le bloc « La semaine » (le seul fichier à changer chaque semaine)

Mise à jour hebdomadaire, en cinq lignes :

1. Poser les 7 nouvelles affiches `jour1.jpg` … `jour7.jpg` (360 × 640) dans `assets/semaine/`, en remplaçant les anciennes.
2. Remplacer `data/musique-chladni/semaine.json` : `semaine`, `titre`, et pour chaque jour `n`, `tonalite`, `date` (AAAA-MM-JJ, ou vide), `affiche`, puis `youtube` (l'identifiant de 11 caractères d'un Short) et/ou `tiktok` (l'URL de la vidéo) dès qu'elles sont publiées — sans l'un ni l'autre, la carte dit « bientôt ».
3. Lancer `node tools/semaine.mjs` : il vérifie les numéros, les affiches, les identifiants YouTube et les URL TikTok, et affiche un résumé.
4. Lancer `node tools/check_musique_chladni.mjs local` si la page a aussi changé.
5. Commit, puis push sur `main` : rien d'autre à toucher.

Les vidéos ne sont pas hébergées par le site. Aucune ressource de YouTube ou de TikTok n'est chargée avant le clic du visiteur sur une affiche.
