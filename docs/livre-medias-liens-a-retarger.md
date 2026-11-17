# Liens vers book-viewer/ à retarger sur MEDIAS_BASE (étape 2 du prompt 192)

Quand les PDF et les pages WebP passeront dans le dépôt public `anibaledel/livre-medias`, ces pages
chargent encore `book-viewer/…` depuis le site et doivent passer sur `MEDIAS_BASE`, avec la visionneuse :

- `arithmogeometrie.html` — `book-viewer/pages/fr/031.webp` (planche 031, figure de l'exemple d'ordre 12) ;
- `en/arithmogeometry/index.html` — `book-viewer/pages/en/031.webp` (même planche, édition anglaise).

Ajoutées par le prompt 194 (point 3). À étendre si d'autres pages citent une planche du livre.

**Mise à jour (17 novembre 2026, prompt 192 étape 2)** : ces deux pages gardent la planche de l'ANCIENNE édition
(`book-viewer/pages/fr|en/031.webp`), donc les anciens fichiers fr et en restent dans `book-viewer/` ; la nouvelle
édition est servie par livre-medias (voir `docs/livre-medias-etape-2.md`). Quand elles passeront sur la planche
de la nouvelle édition (même figure : concordance `031` → `045`), les anciens fichiers pourront être archivés.
