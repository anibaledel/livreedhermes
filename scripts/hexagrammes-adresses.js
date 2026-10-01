/* ============================================================
   Adresses des pages hexagrammes, en français et en anglais.

   Source unique pour les deux générateurs (generate-hexagram-pages.js,
   generate-hexagram-pages-en.js), les paires de traduction de
   scripts/langues.js et les liens des pages motifs : une adresse calculée à
   un seul endroit ne peut pas diverger d'un fichier à l'autre.

     FR  hexagrammes/<chrono>-<pinyin>-<nom français>.html
     EN  en/hexagrams/<chrono>-<pinyin>-<english name>.html
   ============================================================ */
const DATA = require('./extract-hexagram-data.js');

const SITE = 'https://anibal-amiot.com';

function slugify(str) {
  return String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function slug(chrono, lang) {
  const kw = DATA.KINGWEN_BY_CHRONO[chrono];
  const [pinyin, nom] = (lang === 'en' ? DATA.HEX_KW_EN : DATA.HEX_KW)[kw];
  return `${chrono}-${slugify(pinyin)}-${slugify(nom)}.html`;
}

const DOSSIER = { fr: 'hexagrammes', en: 'en/hexagrams' };

// Fichier dans le dépôt et adresse publique d'une page (chrono) ou de l'index (null).
function fichier(chrono, lang) {
  return chrono === null ? `${DOSSIER[lang]}/index.html` : `${DOSSIER[lang]}/${slug(chrono, lang)}`;
}
function url(chrono, lang) {
  return chrono === null ? `${SITE}/${DOSSIER[lang]}/` : `${SITE}/${DOSSIER[lang]}/${slug(chrono, lang)}`;
}

module.exports = { slug, fichier, url, DOSSIER };
