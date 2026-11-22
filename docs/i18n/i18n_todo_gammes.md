# i18n — page « Les gammes » (prompt 219)

Pages écrites : français (`gammes.html`) et anglais (`en/pattern-scales/index.html`), depuis `data/gammes.json` (clé `textes`) par `scripts/build-gammes.js`.
Les autres langues n'ont PAS de page : aucun hreflang vers elles, et les liens des galeries traduites (es, th) vont à la page française avec l'annonce « (francés) », « (ภาษาฝรั่งเศส) ».

À faire pour ajouter une langue : un bloc `textes.<langue>` et un bloc `adresses.<langue>` dans `data/gammes.json` (mêmes clés que `fr`), la page déclarée dans `scripts/langues.js` (déjà tirée de `adresses`), puis `node scripts/build-gammes.js && node scripts/build-header.js`. Les noms des gammes (Tricolore, Ellipses, Chevrons, Trois bandes, Bande centrale, Bandes larges, Six gammes) restent en français.
