#!/usr/bin/env node
/* ============================================================
   build-couverture.js — la phrase canonique des langues du site.

   L'accueil disait « quatre langues » et montrait six drapeaux. La phrase
   qui dit ce qui existe dans quelle langue ne s'écrit donc plus à la main :
   elle se CALCULE, ici, depuis les mêmes sources que le reste du site —

     le livre (PDF)         data/travaux.json, dépôt du livre, champ langues
     les pages traduites    scripts/langues.js, GROUPES (accueil, livre,
                            lexique, travaux, outils, soutien, hexagrammes,
                            articles)
     les pages de motifs    les fichiers motifs/*.html (anglais) et
                            fr/motifs/*.html (français), comptés

   — et se pose entre les marqueurs @couverture des pages listées plus bas.
   Elle NOMME les langues au lieu de les compter : « en français, anglais,
   espagnol et thaï » ne peut pas contredire un drapeau, « en quatre
   langues » le pouvait. Les seuls nombres (64 hexagrammes, 256 motifs)
   sortent d'un compte.

   Une seule chose est déclarée plutôt que calculée : les éditions du livre
   EN PRÉPARATION (EDITIONS_EN_PREPARATION). Aucun fichier ne peut le dire —
   c'est un travail en cours d'Anibal. Quand un PDF paraît, sa langue passe
   dans data/travaux.json et sort de cette liste ; le script refuse qu'une
   langue soit à la fois publiée et en préparation.

   Usage : node scripts/build-couverture.js            écrit
           node scripts/build-couverture.js --verifie  échoue si une page diverge
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { GROUPES } = require('./langues.js');

const ROOT = path.resolve(__dirname, '..');
const TRAVAUX = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/travaux.json'), 'utf8'));
const EDITIONS_EN_PREPARATION = ['zh', 'ru'];

const ORDRE = ['fr', 'en', 'es', 'th', 'zh', 'ru'];
const livre = TRAVAUX.depots.find((d) => d.type === 'book').langues;
for (const l of EDITIONS_EN_PREPARATION) {
  if (livre.includes(l)) throw new Error(`build-couverture.js : « ${l} » est à la fois publié (data/travaux.json) et en préparation.`);
}

// Langues de chaque objet du site, calculées.
const groupe = (nom) => {
  const g = GROUPES.find((x) => x.nom === nom);
  if (!g) throw new Error(`build-couverture.js : groupe « ${nom} » absent de scripts/langues.js`);
  return g.pages.map(([l]) => l);
};
const hexagrammes = GROUPES.filter((g) => /^hexagramme-\d+$/.test(g.nom));
const fichiersMotifs = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.html') && f !== 'index.html');
const motifsEn = fichiersMotifs('motifs').length;
const motifsFr = fichiersMotifs('fr/motifs').length;
if (motifsEn !== motifsFr) throw new Error(`build-couverture.js : ${motifsEn} motifs anglais pour ${motifsFr} français`);
const OBJETS = [
  ['accueil', groupe('accueil')],
  ['livre', groupe('livre')],
  ['lexique', groupe('lexique')],
  ['travaux', groupe('travaux')],
  ['outils', groupe('outils')],
  ['soutien', groupe('soutien')],
  ['hexagrammes', groupe('hexagrammes')],
  ['articles', groupe('articles')],
  ['motifs', ['fr', 'en']],
];
// Toutes les pages d'hexagramme ont les langues de l'index : sinon la phrase mentirait.
for (const g of hexagrammes) {
  if (g.pages.map(([l]) => l).join() !== groupe('hexagrammes').join()) {
    throw new Error(`build-couverture.js : ${g.nom} n'a pas les langues de l'index des hexagrammes`);
  }
}
const N = { hexagrammes: hexagrammes.length, motifs: motifsEn };

// Regroupe les objets qui ont exactement les mêmes langues, du plus couvert au moins.
const trie = (ls) => ORDRE.filter((l) => ls.includes(l));
const clauses = [];
for (const [obj, ls] of OBJETS) {
  const cle = trie(ls).join(',');
  const c = clauses.find((x) => x.cle === cle);
  if (c) c.objets.push(obj); else clauses.push({ cle, langues: trie(ls), objets: [obj] });
}
clauses.sort((a, b) => b.langues.length - a.langues.length);

// ---- Les textes, langue par langue ---------------------------------------
// Chinois et russe : à relire (TODO-RELECTURE.md).
const et = (mot, sep = ', ') => (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(sep)} ${mot} ${xs[xs.length - 1]}`);
const T = {
  fr: {
    noms: { fr: 'français', en: 'anglais', es: 'espagnol', th: 'thaï', zh: 'chinois simplifié', ru: 'russe' },
    objets: { accueil: "l'accueil", livre: 'la présentation du traité', lexique: 'le lexique', travaux: 'la liste des travaux', outils: 'la page des outils', soutien: 'la page de soutien', hexagrammes: `les ${N.hexagrammes} hexagrammes`, articles: 'les articles', motifs: `les ${N.motifs} pages de motifs` },
    liste: et('et'),
    phrase: (pub, prep, cl) => `Le traité est publié en ${pub} ; ses éditions en ${prep} sont en préparation. Sur ce site, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' existent' : ''} en ${c.langues}`).join(' ; ')}.`,
  },
  en: {
    noms: { fr: 'French', en: 'English', es: 'Spanish', th: 'Thai', zh: 'Simplified Chinese', ru: 'Russian' },
    objets: { accueil: 'the home page', livre: 'the treatise page', lexique: 'the lexicon', travaux: 'the list of works', outils: 'the tools page', soutien: 'the support page', hexagrammes: `the ${N.hexagrammes} hexagrams`, articles: 'the articles', motifs: `the ${N.motifs} pattern pages` },
    liste: et('and'),
    phrase: (pub, prep, cl) => `The treatise is published in ${pub}; its ${prep} editions are in preparation. On this site, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' exist' : ''} in ${c.langues}`).join('; ')}.`,
  },
  es: {
    noms: { fr: 'francés', en: 'inglés', es: 'español', th: 'tailandés', zh: 'chino simplificado', ru: 'ruso' },
    objets: { accueil: 'la portada', livre: 'la página del tratado', lexique: 'el léxico', travaux: 'la lista de trabajos', outils: 'la página de herramientas', soutien: 'la página de apoyo', hexagrammes: `los ${N.hexagrammes} hexagramas`, articles: 'los artículos', motifs: `las ${N.motifs} páginas de motivos` },
    liste: et('y'),
    phrase: (pub, prep, cl) => `El tratado está publicado en ${pub}; sus ediciones en ${prep} están en preparación. En este sitio, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' existen' : ''} en ${c.langues}`).join('; ')}.`,
  },
  th: {
    noms: { fr: 'ฝรั่งเศส', en: 'อังกฤษ', es: 'สเปน', th: 'ไทย', zh: 'จีนตัวย่อ', ru: 'รัสเซีย' },
    objets: { accueil: 'หน้าแรก', livre: 'หน้าตำรา', lexique: 'อภิธานศัพท์', travaux: 'รายการผลงาน', outils: 'หน้าเครื่องมือ', soutien: 'หน้าสนับสนุน', hexagrammes: `ฉักลักษณ์ทั้ง ${N.hexagrammes}`, articles: 'บทความ', motifs: `หน้าลวดลาย ${N.motifs} หน้า` },
    liste: (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(' ')} และ${xs[xs.length - 1]}`),
    phrase: (pub, prep, cl) => `ตำรานี้ตีพิมพ์เป็นภาษา${pub} ส่วนฉบับภาษา${prep} อยู่ระหว่างการจัดทำ ในเว็บไซต์นี้ ${cl.map((c) => `${c.objets} มีเป็นภาษา${c.langues}`).join(' ')}`,
  },
  zh: {
    noms: { fr: '法语', en: '英语', es: '西班牙语', th: '泰语', zh: '简体中文', ru: '俄语' },
    objets: { accueil: '首页', livre: '论著页面', lexique: '词汇表', travaux: '研究存档列表', outils: '工具页面', soutien: '支持页面', hexagrammes: `全部 ${N.hexagrammes} 卦`, articles: '文章', motifs: `全部 ${N.motifs} 个图案页面` },
    liste: (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join('、')}和${xs[xs.length - 1]}`),
    phrase: (pub, prep, cl) => `本论著已出版${pub}版本；${prep}版本正在准备中。本网站中，${cl.map((c) => `${c.objets}有${c.langues}版本`).join('；')}。`,
  },
  ru: {
    noms: { fr: 'французском', en: 'английском', es: 'испанском', th: 'тайском', zh: 'упрощённом китайском', ru: 'русском' },
    objets: { accueil: 'главная страница', livre: 'страница трактата', lexique: 'глоссарий', travaux: 'список публикаций', outils: 'страница инструментов', soutien: 'страница поддержки', hexagrammes: `${N.hexagrammes} гексаграммы`, articles: 'статьи', motifs: `${N.motifs} страниц узоров` },
    liste: et('и'),
    phrase: (pub, prep, cl) => `Трактат издан на ${pub} языках; издания на ${prep} готовятся. На этом сайте ${cl.map((c, i) => `${c.objets}${i === 0 ? ' есть' : ' —'} на ${c.langues}`).join('; ')}.`,
  },
};

function phrase(lang) {
  const t = T[lang];
  const noms = (ls) => t.liste(ls.map((l) => t.noms[l]));
  return t.phrase(noms(trie(livre)), noms(EDITIONS_EN_PREPARATION),
    clauses.map((c) => ({ objets: t.liste(c.objets.map((o) => t.objets[o])), langues: noms(c.langues) })));
}

// Les pages qui portent la phrase, et leur langue.
const PAGES = [
  ['index.html', 'fr'], ['la-livree-d-hermes.html', 'fr'],
  ['en/index.html', 'en'], ['es/index.html', 'es'], ['th/index.html', 'th'],
  ['zh/index.html', 'zh'], ['ru/index.html', 'ru'],
];

if (process.argv.includes('--montre')) { for (const l of ORDRE) console.log(`${l} : ${phrase(l)}`); process.exit(0); }

const verifie = process.argv.includes('--verifie');
let ecarts = 0;
for (const [rel, lang] of PAGES) {
  const abs = path.join(ROOT, rel);
  const s = fs.readFileSync(abs, 'utf8');
  const re = /<!-- @couverture:start[\s\S]*?<!-- @couverture:end -->/;
  if (!re.test(s)) throw new Error(`${rel} : marqueurs @couverture absents`);
  const zone = `<!-- @couverture:start — engendré par scripts/build-couverture.js, ne pas éditer ici -->${phrase(lang)}<!-- @couverture:end -->`;
  const apres = s.replace(re, () => zone);
  if (apres === s) continue;
  ecarts++;
  if (verifie) console.error(`PÉRIMÉ ${rel}`);
  else { fs.writeFileSync(abs, apres); console.log(`ÉCRIT ${rel}`); }
}
if (verifie && ecarts) { console.error('Relancer : node scripts/build-couverture.js'); process.exit(1); }
if (!ecarts) console.log(`Phrase canonique conforme sur les ${PAGES.length} pages.`);
