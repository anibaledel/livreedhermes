# Vignettes animées : aperçus (lot abandonné le 7 octobre 2026)

Ce dossier garde les aperçus et les mesures, au cas où le sujet revienne. Rien ici n'est servi par une page, et les 19 icônes de `assets/nav-icons/` sont restées telles quelles.

Les aperçus portent sur l'icône `accueil`, à 72 px. Le dessin est relu dans `assets/nav-icons/accueil.png` (grille 12 × 12, 6 px par case). Les trois nuances viennent de `deriveShades`, **appelée** dans `unified-patterns.html` (fonction globale de la page, chargée dans Chromium) et non recopiée : voir `teintes.mjs`, qui se lance depuis `tools/`. Les couleurs obtenues sont dans `teintes.json`.

| Piste | Teintes de base | Images × durée | Poids | Page à 8 icônes / à 2 |
|---|---|---|---|---|
| `accueil-cycle.gif` | 0° → 330° par 30°, S et L du rouge #e0261b | 12 × 250 ms = 3 s | 15,5 Ko | +124 / +31 Ko |
| `accueil-quadri.gif` | jaune #f1a102, rouge #eb6725, bleu #316287, vert #94abbc | 4 × 750 ms = 3 s | 5,2 Ko | +42 / +10 Ko |
| `accueil-tricolore.gif` | violet #662d91, magenta #ee2a7b, orange #fbb040 | 3 × 1 s = 3 s | 3,9 Ko | +31 / +8 Ko |
| `accueil-fixe.png` | rouge #e0261b, l'image de repos (`prefers-reduced-motion`) | — | 281 o | — |

- **Parts des nuances :** 33,3 / 33,3 / 33,3 % (48 / 48 / 48 cases) sur chaque image, sans aucun autre pixel. L'icône est un carré plein : pas de transparence, donc rien ne bave sur le crème.
- **La planche :** `planche-72px.png` montre chaque image à 72 px sur le crème `#efeae0`.
- **La règle des nuances et ses copies :** voir `docs/regle-des-trois-nuances.md`.
