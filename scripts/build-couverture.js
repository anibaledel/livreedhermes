#!/usr/bin/env node
/* ============================================================
   build-couverture.js — la phrase canonique des langues du site.

   L'accueil disait « quatre langues » et montrait six drapeaux. La phrase
   qui dit ce qui existe dans quelle langue ne s'écrit donc plus à la main :
   elle se CALCULE, ici, depuis les mêmes sources que le reste du site —

     le livre, déposé       data/travaux.json, dépôt Zenodo du livre, champ langues
     le livre, sur le site  scripts/livres.js : PDF et pages présents (lisible),
                            ou non (en préparation) — calculé depuis le dépôt
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

   Plus rien n'est déclaré à la main (2026-10-04) : la liste des éditions
   « en préparation » est devenue l'état calculé du livre dans chaque langue
   de scripts/langues.js. Trois états, que la phrase distingue : déposé
   (Zenodo), lisible sur le site sans être déposé, en préparation. Avec sept
   langues de périmètres différents, aucune formule courte ne serait vraie.
   Les langues et les pages qui portent la phrase sortent aussi de
   scripts/langues.js (l'ordre de la table ; chaque accueil traduit).

   Usage : node scripts/build-couverture.js            écrit
           node scripts/build-couverture.js --verifie  échoue si une page diverge
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { GROUPES, LANGUES } = require('./langues.js');
const { livres } = require('./livres.js');

const ROOT = path.resolve(__dirname, '..');
const TRAVAUX = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/travaux.json'), 'utf8'));

const ORDRE = Object.keys(LANGUES);
const depose = TRAVAUX.depots.find((d) => d.type === 'book').langues;
const LIVRES = livres();
const surLeSite = LIVRES.filter((l) => l.pret && !depose.includes(l.code)).map((l) => l.code);
const enPreparation = LIVRES.filter((l) => !l.pret).map((l) => l.code);
for (const l of depose) {
  if (!LIVRES.find((x) => x.code === l && x.pret)) throw new Error(`build-couverture.js : « ${l} » est déposé (data/travaux.json) mais son édition n'est pas sur le site (scripts/livres.js).`);
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
// Chinois, russe, portugais et hindi : à relire (TODO-RELECTURE.md).
const et = (mot, sep = ', ') => (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(sep)} ${mot} ${xs[xs.length - 1]}`);
const T = {
  fr: {
    noms: { fr: 'français', en: 'anglais', es: 'espagnol', th: 'thaï', zh: 'chinois simplifié', ru: 'russe', pt: 'portugais', hi: 'hindi' },
    objets: { accueil: "l'accueil", livre: 'la présentation du traité', lexique: 'le lexique', travaux: 'la liste des travaux', outils: 'la page des outils', soutien: 'la page de soutien', hexagrammes: `les ${N.hexagrammes} hexagrammes`, articles: 'les articles', motifs: `les ${N.motifs} pages de motifs` },
    liste: et('et'),
    phrase: (pub, site, prep, cl) => `Le traité est publié en ${pub}${site.t ? ` ; il se lit aussi sur ce site en ${site.t}` : ''}${prep.t ? ` ; ${prep.n > 1 ? 'ses éditions' : 'son édition'} en ${prep.t} ${prep.n > 1 ? 'sont' : 'est'} en préparation` : ''}. Sur ce site, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' existent' : ''} en ${c.langues}`).join(' ; ')}.`,
  },
  en: {
    noms: { fr: 'French', en: 'English', es: 'Spanish', th: 'Thai', zh: 'Simplified Chinese', ru: 'Russian', pt: 'Portuguese', hi: 'Hindi' },
    objets: { accueil: 'the home page', livre: 'the treatise page', lexique: 'the lexicon', travaux: 'the list of works', outils: 'the tools page', soutien: 'the support page', hexagrammes: `the ${N.hexagrammes} hexagrams`, articles: 'the articles', motifs: `the ${N.motifs} pattern pages` },
    liste: et('and'),
    phrase: (pub, site, prep, cl) => `The treatise is published in ${pub}${site.t ? `; it can also be read on this site in ${site.t}` : ''}${prep.t ? `; its ${prep.t} edition${prep.n > 1 ? 's are' : ' is'} in preparation` : ''}. On this site, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' exist' : ''} in ${c.langues}`).join('; ')}.`,
  },
  es: {
    noms: { fr: 'francés', en: 'inglés', es: 'español', th: 'tailandés', zh: 'chino simplificado', ru: 'ruso', pt: 'portugués', hi: 'hindi' },
    objets: { accueil: 'la portada', livre: 'la página del tratado', lexique: 'el léxico', travaux: 'la lista de trabajos', outils: 'la página de herramientas', soutien: 'la página de apoyo', hexagrammes: `los ${N.hexagrammes} hexagramas`, articles: 'los artículos', motifs: `las ${N.motifs} páginas de motivos` },
    liste: et('y'),
    phrase: (pub, site, prep, cl) => `El tratado está publicado en ${pub}${site.t ? `; también puede leerse aquí en ${site.t}` : ''}${prep.t ? `; ${prep.n > 1 ? 'sus ediciones' : 'su edición'} en ${prep.t} ${prep.n > 1 ? 'están' : 'está'} en preparación` : ''}. En este sitio, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' existen' : ''} en ${c.langues}`).join('; ')}.`,
  },
  th: {
    noms: { fr: 'ฝรั่งเศส', en: 'อังกฤษ', es: 'สเปน', th: 'ไทย', zh: 'จีนตัวย่อ', ru: 'รัสเซีย', pt: 'โปรตุเกส', hi: 'ฮินดี' },
    objets: { accueil: 'หน้าแรก', livre: 'หน้าตำรา', lexique: 'อภิธานศัพท์', travaux: 'รายการผลงาน', outils: 'หน้าเครื่องมือ', soutien: 'หน้าสนับสนุน', hexagrammes: `ฉักลักษณ์ทั้ง ${N.hexagrammes}`, articles: 'บทความ', motifs: `หน้าลวดลาย ${N.motifs} หน้า` },
    liste: (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(' ')} และ${xs[xs.length - 1]}`),
    phrase: (pub, site, prep, cl) => `ตำรานี้ตีพิมพ์เป็นภาษา${pub}${site.t ? ` และอ่านได้บนเว็บไซต์นี้เป็นภาษา${site.t}` : ''}${prep.t ? ` ส่วนฉบับภาษา${prep.t} อยู่ระหว่างการจัดทำ` : ''} ในเว็บไซต์นี้ ${cl.map((c) => `${c.objets} มีเป็นภาษา${c.langues}`).join(' ')}`,
  },
  zh: {
    noms: { fr: '法语', en: '英语', es: '西班牙语', th: '泰语', zh: '简体中文', ru: '俄语', pt: '葡萄牙语', hi: '印地语' },
    objets: { accueil: '首页', livre: '论著页面', lexique: '词汇表', travaux: '研究存档列表', outils: '工具页面', soutien: '支持页面', hexagrammes: `全部 ${N.hexagrammes} 卦`, articles: '文章', motifs: `全部 ${N.motifs} 个图案页面` },
    liste: (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join('、')}和${xs[xs.length - 1]}`),
    phrase: (pub, site, prep, cl) => `本论著已出版${pub}版本${site.t ? `；本网站另提供${site.t}版本在线阅读` : ''}${prep.t ? `；${prep.t}版本正在准备中` : ''}。本网站中，${cl.map((c) => `${c.objets}有${c.langues}版本`).join('；')}。`,
  },
  ru: {
    noms: { fr: 'французском', en: 'английском', es: 'испанском', th: 'тайском', zh: 'упрощённом китайском', ru: 'русском', pt: 'португальском', hi: 'хинди' },
    objets: { accueil: 'главная страница', livre: 'страница трактата', lexique: 'глоссарий', travaux: 'список публикаций', outils: 'страница инструментов', soutien: 'страница поддержки', hexagrammes: `${N.hexagrammes} гексаграммы`, articles: 'статьи', motifs: `${N.motifs} страниц узоров` },
    liste: et('и'),
    phrase: (pub, site, prep, cl) => `Трактат издан на ${pub} языках${site.t ? `; на этом сайте его можно прочитать также на ${site.t}` : ''}${prep.t ? `; ${prep.n > 1 ? 'издания' : 'издание'} на ${prep.t} ${prep.n > 1 ? 'готовятся' : 'готовится'}` : ''}. На этом сайте ${cl.map((c, i) => `${c.objets}${i === 0 ? ' есть' : ' —'} на ${c.langues}`).join('; ')}.`,
  },
  pt: {
    noms: { fr: 'francês', en: 'inglês', es: 'espanhol', th: 'tailandês', zh: 'chinês simplificado', ru: 'russo', pt: 'português', hi: 'hindi' },
    objets: { accueil: 'a página inicial', livre: 'a página do tratado', lexique: 'o léxico', travaux: 'a lista de trabalhos', outils: 'a página das ferramentas', soutien: 'a página de apoio', hexagrammes: `os ${N.hexagrammes} hexagramas`, articles: 'os artigos', motifs: `as ${N.motifs} páginas de padrões` },
    liste: et('e'),
    phrase: (pub, site, prep, cl) => `O tratado está publicado em ${pub}${site.t ? `; lê-se também neste site em ${site.t}` : ''}${prep.t ? `; ${prep.n > 1 ? 'as suas edições' : 'a sua edição'} em ${prep.t} ${prep.n > 1 ? 'estão' : 'está'} em preparação` : ''}. Neste site, ${cl.map((c, i) => `${c.objets}${i === 0 ? ' existem' : ''} em ${c.langues}`).join('; ')}.`,
  },
  hi: {
    noms: { fr: 'फ़्रेंच', en: 'अंग्रेज़ी', es: 'स्पेनिश', th: 'थाई', zh: 'सरलीकृत चीनी', ru: 'रूसी', pt: 'पुर्तगाली', hi: 'हिन्दी' },
    objets: { accueil: 'मुखपृष्ठ', livre: 'ग्रंथ का पृष्ठ', lexique: 'शब्दावली', travaux: 'कृतियों की सूची', outils: 'उपकरणों का पृष्ठ', soutien: 'सहयोग का पृष्ठ', hexagrammes: `सभी ${N.hexagrammes} हेक्साग्राम`, articles: 'लेख', motifs: `${N.motifs} पैटर्न-पृष्ठ` },
    liste: et('और'),
    phrase: (pub, site, prep, cl) => `यह ग्रंथ ${pub} में प्रकाशित है${site.t ? `; इसे इस साइट पर ${site.t} में भी पढ़ा जा सकता है` : ''}${prep.t ? `; इसके ${prep.t} ${prep.n > 1 ? 'संस्करण' : 'संस्करण'} तैयार हो रहे हैं` : ''}। इस साइट पर ${cl.map((c) => `${c.objets} ${c.langues} में उपलब्ध हैं`).join('; ')}।`,
  },
};
// Une langue déclarée sans table de textes, ou sans le nom d'une autre langue :
// la phrase ne s'écrirait qu'à moitié. Le script refuse plutôt que de deviner.
for (const l of ORDRE) {
  if (!T[l]) throw new Error(`build-couverture.js : pas de textes pour « ${l} » (table T) — voir docs/ajouter-une-langue.md`);
  for (const k of ORDRE) if (!T[l].noms[k]) throw new Error(`build-couverture.js : T.${l}.noms n'a pas « ${k} »`);
}

function phrase(lang) {
  const t = T[lang];
  const noms = (ls) => t.liste(ls.map((l) => t.noms[l]));
  const groupe = (ls) => ({ t: ls.length ? noms(trie(ls)) : '', n: ls.length });
  return t.phrase(noms(trie(depose)), groupe(surLeSite), groupe(enPreparation),
    clauses.map((c) => ({ objets: t.liste(c.objets.map((o) => t.objets[o])), langues: noms(c.langues) })));
}

// Les pages qui portent la phrase, et leur langue : l'accueil de chaque langue
// déclarée (scripts/langues.js), et la page du traité.
const PAGES = [
  ...ORDRE.filter((l) => LANGUES[l].pages.accueil !== undefined).map((l) => [`${LANGUES[l].pages.accueil}index.html`, l]),
  ['la-livree-d-hermes.html', 'fr'],
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
