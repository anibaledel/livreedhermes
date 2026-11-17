# Le livre sur livre-medias — état et procédure (prompt 192, étape 2)

Les PDF et les pages du lecteur de la nouvelle édition sont servis par le dépôt public
`anibaledel/livre-medias` (GitHub Pages), pas par ce site. **Français et anglais** le sont depuis
le 17 novembre 2026 ; les neuf autres langues restent « en préparation » (ou sur l'ancienne
édition de `book-viewer/`, pour es, th, zh, ru, pt, hi) tant que leur PDF ne répond pas.

## Où est quoi

| | adresse | constante |
|---|---|---|
| PDF | `MEDIAS_PDF/la-livree-d-hermes-anibal-amiot-<code>.pdf` (à la racine) | `scripts/langues.js` |
| pages du lecteur | `MEDIAS_PAGES/<code>/<page>.webp` (une image 1920 × 1080 par page du PDF) | `scripts/langues.js` |
| langues servies | `data/livre/editions-medias.json` | `tools/verifie_livre_medias.mjs --ecrire` |
| correspondance des pages | `data/livre/concordance.json` | `tools/concordance_livre.py` |

Changer le dossier des PDF : modifier `MEDIAS_PDF` dans `scripts/langues.js`, relancer
`node tools/verifie_livre_medias.mjs --ecrire`, puis
`node tools/retarget_livre_medias.mjs --ancienne <ancienne adresse>` (réécrit les pages écrites à la
main) et les générateurs (`scripts/build-langues.js`, `tools/livre_html.py fr|en`…).

## Les deux paginations

- **Ancienne édition** (111 pages, `PAGE_CODES`) : `book-viewer/`, pour es, th, zh, ru, pt, hi — et,
  tant que les chapitres du livre en HTML en dépendent, les anciens fichiers fr et en.
- **Nouvelle édition** (115 pages du FICHIER, `PAGE_CODES_115`) : couverture et préliminaires
  `000A`, `000B`, puis un code par numéro imprimé `001` à `110`, et la page DOI et les deux pages de
  fin `111A`, `111B`, `111C`. La page `n` du fichier porte le numéro `n − 2` de la page 4 (« 2 ») à la
  page 113 (« 111 »). Le livre fait 111 pages plus la couverture : aucun texte public ne dit 115.
- Un code désigne une AUTRE page d'une édition à l'autre (« 063 » : le début de « Trame » dans
  l'ancienne, le début de la partie VII.I = `081` dans la nouvelle). Tout lien qui porte un code passe
  par la concordance (`scripts/livres.js`, `codeDansEdition`, `pagesTrame`) ; la visionneuse la
  traverse quand on change d'édition.

## À décider (Anibal)

1. **Les chapitres du livre en HTML** (`fr/livre/chapitre-N/`, `en/book/chapter-N/`) gardent le texte,
   les planches, le découpage et les légendes de l'ANCIENNE édition (ceux que vous avez validés le
   4 octobre) ; seuls leurs liens vers le PDF et le lecteur visent la nouvelle, par la concordance. Les
   regénérer sur la nouvelle édition demande un nouveau découpage et de nouvelles légendes.
2. **Anciens fichiers fr et en de `book-viewer/`** (PDF + pages, environ 75 Mo) : non retirés, car ces
   chapitres et deux pages (`arithmogeometrie.html`, `en/arithmogeometry/`) les chargent encore
   (voir `docs/livre-medias-liens-a-retarger.md`). Ils partiront sur `archive-medias` quand 1. sera tranché.
3. **PDF non linéarisés** : ceux de livre-medias n'ont pas de dictionnaire `/Linearized`
   (`tools/check_livres_medias.py --lineaire`) ; le navigateur doit presque tout charger avant la
   première page. Une réexportation linéarisée règle l'écart.
