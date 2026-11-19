#!/usr/bin/env node
/* ============================================================
   Les 64 pages hexagrammes traduites et leur index :
     en/hexagrams/   anglais — textes qu'affiche déjà l'échiquier d'index.html
                     en anglais (HEX_KW_EN, IMAGE_EN, LINE_COMMENT_EN,
                     TRIGRAMS_EN, via extract-hexagram-data.js) ;
     es/hexagramas/  espagnol \  data/hexagrammes_traduits.json, traduits du
     th/hexagrams/   thaï     /  français et en cours de relecture (mention
                                 visible sur chaque page).

   Jumelles des pages françaises de generate-hexagram-pages.js. Ce qui est
   partagé, et repris tel quel plutôt que recopié :
     - les adresses (hexagrammes-adresses.js), d'où viennent aussi les
       groupes hreflang de scripts/langues.js ;
     - la feuille de style, lue dans la page française générée (même mise en
       page) — lancer donc generate-hexagram-pages.js AVANT ce script ;
     - l'en-tête, le pied (dans la langue de la page) et les icônes
       (includes/, via build-header.js) ; le bloc de tuiles (nav-tiles.js),
       dans la langue de la page et vers ses pages traduites (2026-10-04) ;
     - les familles et adresses des motifs (generate-motif-pages.js) : les
       pages espagnoles et thaïes renvoient aux motifs anglais.

   dateModified suit la même règle que les pages françaises : elle ne bouge
   que si le texte éditorial change (empreinte SHA-256 en tête de <head>).

   Usage : node scripts/generate-hexagram-pages.js && node scripts/generate-hexagram-pages-traduites.js
           puis node scripts/build-header.js (hreflang, rangée de langues).
   ============================================================ */
const fs = require('fs');
const HEXDESC = require('./hexagram-description.js');
const HT = require('./hexagram-titres.js'); // titres : le numéro King Wen d'abord (prompt 205)
const path = require('path');
const crypto = require('crypto');
const DATA = require('./extract-hexagram-data.js');
const A = require('./hexagrammes-adresses.js');
const MOTIFS = require('./generate-motif-pages.js');
const { rendre } = require('./build-header.js');
const { htmlNavTiles } = require('./nav-tiles.js');

const ROOT = path.resolve(__dirname, '..');

// --verifie (prompt 208, D6) : rien n'est écrit ; chaque page est engendrée en mémoire, passée par build-header.js (traiter) et comparée au fichier en place.
const VERIFIE = process.argv.includes('--verifie');
const PERIMEES = [];
function ecrire(chemin, contenu) {
  if (!VERIFIE) { fs.writeFileSync(chemin, contenu, 'utf8'); return; }
  const rel = path.relative(ROOT, chemin).split(path.sep).join('/');
  const attendu = require('./build-header.js').traiter(rel, contenu);
  if (!fs.existsSync(chemin) || fs.readFileSync(chemin, 'utf8') !== attendu) PERIMEES.push(rel);
}
const PREFIXE = '../../';
const SITE = 'https://anibal-amiot.com';
// un lien vers une page du site vise sa version dans la langue de la page, si elle existe
const { adresseDans, annonceVers, espaceAvant } = require('./langues.js');
const TODAY = new Date().toISOString().slice(0, 10);
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function traitsFromChrono(chrono) {
  const r = Math.floor(chrono / 8), c = chrono % 8;
  return [c & 1, (c >> 1) & 1, (c >> 2) & 1, r & 1, (r >> 1) & 1, (r >> 2) & 1];
}
const trigramValue = (b) => b[0] + b[1] * 2 + b[2] * 4;

// Même tracé que les pages françaises (traitSVG de generate-hexagram-pages.js).
function traitSVG(bit) {
  const W = 160, H = 18, midY = H / 2;
  if (bit === 1) return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY - 3}" width="${W}" height="6" fill="var(--white)"/></svg>`;
  const gap = 26, segW = (W - gap) / 2;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY - 3}" width="${segW}" height="6" fill="var(--red)"/><rect x="${segW + gap}" y="${midY - 3}" width="${segW}" height="6" fill="var(--red)"/></svg>`;
}

// La feuille de style de la page française, reprise telle quelle.
function stylePageFr(fichierFr) {
  const html = fs.readFileSync(path.join(ROOT, fichierFr), 'utf8');
  const m = html.match(/<style>[\s\S]*?<\/style>/);
  if (!m) throw new Error(`${fichierFr} : <style> introuvable — lancer generate-hexagram-pages.js d'abord`);
  return m[0];
}

// ---------- textes : anglais depuis index.html, espagnol et thaï depuis data/ ----------
function textes(lang) {
  if (lang === 'en') {
    return {
      hex: (kw) => { const [pinyin, name, judgementTitle, judgement] = DATA.HEX_KW_EN[kw]; return { pinyin, name, judgementTitle, judgement, image: DATA.IMAGE_EN[kw] }; },
      line: (pos, bit) => DATA.LINE_COMMENT_EN[pos][bit],
      trigram: (v) => DATA.TRIGRAMS_EN[v],
    };
  }
  const T = A.TRADUITS[lang];
  return {
    hex: (kw) => T.hexagrams[kw],
    line: (pos, bit) => T.lineComments[pos][bit],
    trigram: (v) => T.trigrams[v],
  };
}

// ---------- libellés de page ----------
const MOIS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};
const L = {
  en: {
    locale: 'en_US', datePublished: '2026-10-01',
    date: (y, m, d) => `${MOIS.en[m - 1]} ${d}, ${y}`,
    home: 'Home', homeUrl: `${SITE}/en/`, book: 'The book', bookUrl: `${SITE}/en/book/`, lexiconUrl: `${SITE}/en/lexicon/`,
    hexagrams: 'Hexagrams', breadcrumb: 'Breadcrumb',
    hexName: (c, n, kw) => HT.nomCourt('en', c, n, kw),
    title: (c, p, n, kw) => HT.titre('en', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('en', c, p, n, kw)}: judgement, image, trigrams, magic square.`, `${HT.enTete('en', c, p, n, kw)}: judgement, image, magic square.`, `${HT.enTete('en', c, p, n, kw)}: judgement, magic square.`],
    sub: (c, kw, hz) => `Binary index <b>${c}</b> (0 to 63; the site's "chronological no.", binary-weight order) · traditional King Wen no. <b>${kw}</b> · ${hz}`,
    by: (date) => `By <a href="${SITE}/${adresseDans('a-propos.html', 'en')}">Anibal Edelberto Amiot</a> — Updated ${date}`,
    alt: (c, n, kw) => `Magic square / tiling associated with hexagram ${c} (King Wen no. ${kw}, ${n})`,
    figcaption: "Tiling of the magic square associated with this hexagram, La Livrée d'Hermès.",
    upper: 'Upper trigram', lower: 'Lower trigram', image: 'Image', judgement: 'Judgement', sixLines: 'The six lines',
    pos: ['First line', 'Second line', 'Third line', 'Fourth line', 'Fifth line', 'Sixth line'],
    readBook: 'Read the passage in the book (ch. 7.1) →', board: 'See it on the interactive board →', create: "Create this hexagram's pattern →",
    source: (bookHref, frHref, pp) => `<b>Source</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">chapter 7.1 (pp. ${pp.du}–${pp.au})</a>. <a href="${frHref}">French version of this page</a>.`,
    lexicon: (href) => `For the notions used here — magic square, layer and casting, the Yi Jing — see the <a href="${href}">project lexicon</a>.`,
    motifsHeading: 'The patterns of this hexagram',
    motifsIntro: 'Eight 12×12 Jacquard patterns are generated from this hexagram, one for each admissible family of the system. Each has its own page: cell, tiling, recolourings and data.',
    motifsComplement: (link, c, b, kwb) => `This hexagram is the binary complement of hexagram ${link} (63 − ${c} = ${b}): its patterns have exactly the same shape, only their colours are permuted. Here are the eight patterns of hexagram ${b} (King Wen no. ${kwb}), one for each admissible family.`,
    neighbours: 'Neighbouring hexagrams', sharing: 'Hexagrams sharing a trigram',
    sameUpper: (s, n) => `Same upper trigram (${s} ${n}): `, sameLower: (s, n) => `Same lower trigram (${s} ${n}): `,
    back: '← All 64 hexagrams',
    indexTitle: "The 64 Yi Jing hexagrams: names, numbers and trigrams | La Livrée d'Hermès",
    indexDescription: "The 64 Yi Jing hexagrams with name, number (chronological and King Wen) and trigrams; for each, the judgement, image and magic square.",
    indexH1: 'The 64 hexagrams',
    indexSub: 'Each hexagram of the Yi Jing, in the chronological (binary-weight) order used on this site, with its judgement, image, trigrams and associated magic square.',
    indexH2: "What is a hexagram?",
    indexIntro: "A Yi Jing hexagram is a figure of six lines, solid (yang) or broken (yin): there are 64, each made of two stacked trigrams. This page lists them in the site's chronological order (binary weights, 0 to 63) with the traditional King Wen number. Open one to read its judgement, image, six lines and associated magic square. To draw one at random, try the <a href=\"{TIRAGE}\">free Yi King draw</a>.",
    indexCaption: "The 64 hexagrams: number, name and trigrams",
    indexCols: ["No. (site)", "King Wen", "Hexagram", "Lower trigram", "Upper trigram"],
    revue: null,
  },
  es: {
    locale: 'es_ES', datePublished: '2026-10-01',
    date: (y, m, d) => `${d} de ${MOIS.es[m - 1]} de ${y}`,
    home: 'Inicio', homeUrl: `${SITE}/es/`, book: 'El libro', bookUrl: `${SITE}/es/libro/`, lexiconUrl: `${SITE}/es/lexico/`,
    hexagrams: 'Hexagramas', breadcrumb: 'Ruta de navegación',
    hexName: (c, n, kw) => HT.nomCourt('es', c, n, kw),
    title: (c, p, n, kw) => HT.titre('es', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('es', c, p, n, kw)}: juicio, imagen, trigramas y cuadrado mágico.`, `${HT.enTete('es', c, p, n, kw)}: juicio, imagen y cuadrado mágico.`, `${HT.enTete('es', c, p, n, kw)}: juicio y cuadrado mágico.`],
    sub: (c, kw, hz) => `Índice binario <b>${c}</b> (0 a 63; «n.º cronológico» del sitio, orden por pesos binarios) · n.º tradicional King Wen <b>${kw}</b> · ${hz}`,
    by: (date) => `Por <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — Actualizado el ${date}`,
    alt: (c, n, kw) => `Cuadrado mágico / teselado asociado al hexagrama ${c} (n.º King Wen ${kw}, ${n})`,
    figcaption: "Teselado del cuadrado mágico asociado a este hexagrama, La Livrée d'Hermès.",
    upper: 'Trigrama superior', lower: 'Trigrama inferior', image: 'Imagen', judgement: 'Juicio', sixLines: 'Los seis rasgos',
    pos: ['Primer rasgo', 'Segundo rasgo', 'Tercer rasgo', 'Cuarto rasgo', 'Quinto rasgo', 'Sexto rasgo'],
    readBook: 'Leer el pasaje en el libro (cap. 7.1) →', board: 'Verlo en el tablero interactivo →', create: 'Crear el motivo de este hexagrama →',
    source: (bookHref, frHref, pp) => `<b>Fuente</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">capítulo 7.1 (pp. ${pp.du}–${pp.au})</a>. <a href="${frHref}" hreflang="fr">Versión francesa de esta página</a>.`,
    lexicon: (href) => `Para las nociones empleadas aquí — cuadrado mágico, capa y tirada, el Yi King — consulte el <a href="${href}">léxico del proyecto</a>.`,
    motifsHeading: 'Los motivos de este hexagrama',
    motifsIntro: 'De este hexagrama se generan ocho motivos Jacquard de 12×12, uno por cada familia admisible del sistema. Cada uno tiene su página (en inglés): celda, teselado, recoloreados y datos.',
    motifsComplement: (link, c, b, kwb) => `Este hexagrama es el complemento binario del hexagrama ${link} (63 − ${c} = ${b}): sus motivos tienen exactamente la misma forma; solo se permutan sus colores. Estos son los ocho motivos del hexagrama ${b} (n.º King Wen ${kwb}), uno por cada familia admisible (páginas en inglés).`,
    neighbours: 'Hexagramas vecinos', sharing: 'Hexagramas que comparten un trigrama',
    sameUpper: (s, n) => `Mismo trigrama superior (${s} ${n}): `, sameLower: (s, n) => `Mismo trigrama inferior (${s} ${n}): `,
    back: '← Los 64 hexagramas',
    indexTitle: "Los 64 hexagramas del Yi King: nombres y números | La Livrée d'Hermès",
    indexDescription: "Los 64 hexagramas del Yi King con su nombre, su número (cronológico y King Wen) y sus trigramas; de cada uno, juicio, imagen y cuadrado mágico.",
    indexH1: 'Los 64 hexagramas',
    indexSub: 'Cada hexagrama del Yi King, en el orden cronológico (por pesos binarios) que usa este sitio, con su juicio, su imagen, sus trigramas y el cuadrado mágico asociado.',
    indexH2: "¿Qué es un hexagrama?",
    indexIntro: "Un hexagrama del Yi King es una figura de seis líneas, continuas (yang) o partidas (yin): son 64, cada una formada por dos trigramas superpuestos. Esta página los lista en el orden cronológico del sitio (pesos binarios, de 0 a 63), con el número tradicional King Wen. Abre uno para leer su juicio, su imagen, sus seis líneas y el cuadrado mágico asociado. Para sacar uno al azar, prueba la <a href=\"{TIRAGE}\">tirada del I Ching gratis</a>.",
    indexCaption: "Los 64 hexagramas: número, nombre y trigramas",
    indexCols: ["N.º (sitio)", "King Wen", "Hexagrama", "Trigrama inferior", "Trigrama superior"],
    // Même mention que chladni.html (UI.es.i18nReviewNote).
    revue: 'Traducción en revisión — si detectas un error, indícalo.',
  },
  th: {
    locale: 'th_TH', datePublished: '2026-10-01',
    date: (y, m, d) => `${d} ${MOIS.th[m - 1]} ${y}`,
    home: 'หน้าแรก', homeUrl: `${SITE}/th/`, book: 'หนังสือ', bookUrl: `${SITE}/th/book/`, lexiconUrl: `${SITE}/th/lexicon/`,
    hexagrams: 'ฉักลักษณ์', breadcrumb: 'เส้นทางนำทาง',
    hexName: (c, n, kw) => HT.nomCourt('th', c, n, kw),
    title: (c, p, n, kw) => HT.titre('th', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('th', c, p, n, kw)}: คำตัดสิน ภาพลักษณ์ ตรีลักษณ์ จัตุรัสกล`, `${HT.enTete('th', c, p, n, kw)}: คำตัดสิน ภาพลักษณ์ จัตุรัสกล`, `${HT.enTete('th', c, p, n, kw)}: คำตัดสิน จัตุรัสกล`],
    sub: (c, kw, hz) => `ดัชนีฐานสอง <b>${c}</b> (0 ถึง 63 ; ลำดับตามเวลาของเว็บไซต์ เรียงตามน้ำหนักฐานสอง) · ลำดับ King Wen (ดั้งเดิม) <b>${kw}</b> · ${hz}`,
    by: (date) => `โดย <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — ปรับปรุงเมื่อ ${date}`,
    alt: (c, n, kw) => `จัตุรัสกล / การปูลายที่สัมพันธ์กับฉักลักษณ์ที่ ${c} (ลำดับ King Wen ที่ ${kw}, ${n})`,
    figcaption: "การปูลายของจัตุรัสกลที่สัมพันธ์กับฉักลักษณ์นี้, La Livrée d'Hermès",
    upper: 'ตรีลักษณ์บน', lower: 'ตรีลักษณ์ล่าง', image: 'ภาพลักษณ์', judgement: 'คำตัดสิน', sixLines: 'หกเส้น',
    pos: ['เส้นที่หนึ่ง', 'เส้นที่สอง', 'เส้นที่สาม', 'เส้นที่สี่', 'เส้นที่ห้า', 'เส้นที่หก'],
    readBook: 'อ่านตอนนี้ในหนังสือ (บทที่ 7.1) →', board: 'ดูบนกระดานแบบโต้ตอบ →', create: 'สร้างลวดลายของฉักลักษณ์นี้ →',
    source: (bookHref, frHref, pp) => `<b>ที่มา</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">บทที่ 7.1 (หน้า ${pp.du}–${pp.au})</a> · <a href="${frHref}" hreflang="fr">หน้านี้ฉบับภาษาฝรั่งเศส</a>`,
    lexicon: (href) => `สำหรับแนวคิดที่ใช้ในหน้านี้ — จัตุรัสกล ชั้นลายและการเสี่ยงทาย อี้จิง — ดู<a href="${href}">อภิธานศัพท์ของโครงการ</a>`,
    motifsHeading: 'ลวดลายของฉักลักษณ์นี้',
    motifsIntro: 'ลวดลายแจ็คการ์ดขนาด 12×12 จำนวนแปดลายสร้างขึ้นจากฉักลักษณ์นี้ หนึ่งลายต่อหนึ่งตระกูลที่ยอมรับได้ของระบบ แต่ละลายมีหน้าของตนเอง (ภาษาอังกฤษ): เซลล์ การปูลาย การเปลี่ยนสี และข้อมูล',
    motifsComplement: (link, c, b, kwb) => `ฉักลักษณ์นี้เป็นส่วนเติมเต็มฐานสองของฉักลักษณ์ ${link} (63 − ${c} = ${b}) ลวดลายของฉักลักษณ์นี้จึงมีรูปทรงเหมือนกันทุกประการ ต่างกันเพียงการสลับสี ต่อไปนี้คือลวดลายแปดลายของฉักลักษณ์ที่ ${b} (ลำดับ King Wen ที่ ${kwb}) หนึ่งลายต่อหนึ่งตระกูล (หน้าภาษาอังกฤษ)`,
    neighbours: 'ฉักลักษณ์ข้างเคียง', sharing: 'ฉักลักษณ์ที่มีตรีลักษณ์ร่วมกัน',
    sameUpper: (s, n) => `ตรีลักษณ์บนเดียวกัน (${s} ${n}): `, sameLower: (s, n) => `ตรีลักษณ์ล่างเดียวกัน (${s} ${n}): `,
    back: '← ฉักลักษณ์ทั้ง 64',
    indexTitle: "ฉักลักษณ์ทั้ง 64 ของอี้จิง: ชื่อ เลข และตรีลักษณ์ | La Livrée d'Hermès",
    indexDescription: "ฉักลักษณ์ทั้ง 64 ของอี้จิง พร้อมชื่อ เลขลำดับ (ตามเว็บไซต์และ King Wen) และตรีลักษณ์ แต่ละรูปมีคำตัดสิน ภาพลักษณ์ และจัตุรัสกล",
    indexH1: 'ฉักลักษณ์ทั้ง 64',
    indexSub: 'ฉักลักษณ์แต่ละตัวของอี้จิง เรียงตามลำดับเวลา (ตามน้ำหนักฐานสอง) ที่ใช้ในเว็บไซต์นี้ พร้อมคำตัดสิน ภาพลักษณ์ ตรีลักษณ์ และจัตุรัสกลที่สัมพันธ์กัน',
    indexH2: "ฉักลักษณ์ คืออะไร",
    indexIntro: "ฉักลักษณ์ของอี้จิงคือรูปหกเส้น เป็นเส้นเต็ม (หยาง) หรือเส้นขาด (หยิน) มีทั้งหมด 64 รูป แต่ละรูปประกอบด้วยตรีลักษณ์สองชั้นซ้อนกัน หน้านี้เรียงตามลำดับเวลาของเว็บไซต์ (น้ำหนักฐานสอง 0 ถึง 63) พร้อมเลขลำดับ King Wen แบบดั้งเดิม เปิดแต่ละรูปเพื่ออ่านคำตัดสิน ภาพลักษณ์ หกเส้น และจัตุรัสกลที่เกี่ยวข้อง หากต้องการสุ่มสักรูป ลอง<a href=\"{TIRAGE}\">ทอยอี้จิงฟรี</a>",
    indexCaption: "ฉักลักษณ์ทั้ง 64: เลข ชื่อ และตรีลักษณ์",
    indexCols: ["เลข (เว็บไซต์)", "King Wen", "ฉักลักษณ์", "ตรีลักษณ์ล่าง", "ตรีลักษณ์บน"],
    // Même mention que chladni.html (UI.th.i18nReviewNote).
    revue: 'การแปลอยู่ระหว่างการตรวจทาน — หากพบข้อผิดพลาด กรุณาแจ้งให้ทราบ',
  },

  de: {
    locale: 'de_DE', datePublished: '2026-11-17',
    date: (y, m, d) => `${d}. ${MOIS.de[m - 1]} ${y}`,
    home: 'Startseite', homeUrl: `${SITE}/de/`, book: 'Das Buch', bookUrl: `${SITE}/de/book/`, lexiconUrl: `${SITE}/de/lexicon/`,
    hexagrams: 'Hexagramme', breadcrumb: 'Brotkrümelnavigation',
    hexName: (c, n, kw) => HT.nomCourt('de', c, n, kw),
    title: (c, p, n, kw) => HT.titre('de', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('de', c, p, n, kw)}: Urteil, Bild, Trigramme, magisches Quadrat.`, `${HT.enTete('de', c, p, n, kw)}: Urteil, Bild, magisches Quadrat.`, `${HT.enTete('de', c, p, n, kw)}: Urteil, magisches Quadrat.`],
    sub: (c, kw, hz) => `Binärindex <b>${c}</b> (0 bis 63; „chronologische Nr.“ der Website, Ordnung nach Binärgewichten) · traditionelle King-Wen-Nr. <b>${kw}</b> · ${hz}`,
    by: (date) => `Von <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — Aktualisiert am ${date}`,
    alt: (c, n, kw) => `Magisches Quadrat / Parkettierung zu Hexagramm ${c} (King-Wen-Nr. ${kw}, ${n})`,
    figcaption: "Parkettierung des magischen Quadrats zu diesem Hexagramm, La Livrée d'Hermès.",
    upper: 'Oberes Trigramm', lower: 'Unteres Trigramm', image: 'Bild', judgement: 'Urteil', sixLines: 'Die sechs Linien',
    pos: ['Erste Linie', 'Zweite Linie', 'Dritte Linie', 'Vierte Linie', 'Fünfte Linie', 'Sechste Linie'],
    readBook: 'Die Stelle im Buch lesen (Kap. 7.1) →', board: 'Auf dem interaktiven Brett ansehen →', create: 'Das Muster dieses Hexagramms erstellen →',
    source: (bookHref, frHref, pp) => `<b>Quelle</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">Kapitel 7.1 (S. ${pp.du}–${pp.au})</a>. <a href="${frHref}" hreflang="fr">Französische Fassung dieser Seite</a>.`,
    lexicon: (href) => `Zu den hier verwendeten Begriffen — magisches Quadrat, Schicht und Wurf, das I Ging — siehe das <a href="${href}">Lexikon des Projekts</a>.`,
    motifsHeading: 'Die Muster dieses Hexagramms',
    motifsIntro: 'Aus diesem Hexagramm entstehen acht Jacquard-Muster im Format 12×12, eines je zulässiger Familie des Systems. Jedes hat seine eigene Seite (auf Englisch): Zelle, Parkettierung, Umfärbungen und Daten.',
    motifsComplement: (link, c, b, kwb) => `Dieses Hexagramm ist das binäre Komplement des Hexagramms ${link} (63 − ${c} = ${b}): Seine Muster haben genau dieselbe Form, nur ihre Farben sind vertauscht. Hier die acht Muster des Hexagramms ${b} (King-Wen-Nr. ${kwb}), eines je zulässiger Familie (Seiten auf Englisch).`,
    neighbours: 'Benachbarte Hexagramme', sharing: 'Hexagramme mit gemeinsamem Trigramm',
    sameUpper: (s, n) => `Gleiches oberes Trigramm (${s} ${n}): `, sameLower: (s, n) => `Gleiches unteres Trigramm (${s} ${n}): `,
    back: '← Alle 64 Hexagramme',
    indexTitle: "Die 64 Hexagramme des I Ging: Namen und Nummern | La Livrée d'Hermès",
    indexDescription: "Die 64 Hexagramme des I Ging mit Name, Nummer (chronologisch und nach King Wen) und Trigrammen; zu jedem Urteil, Bild und magisches Quadrat.",
    indexH1: 'Die 64 Hexagramme',
    indexSub: 'Jedes Hexagramm des I Ging in der chronologischen Ordnung (nach Binärgewichten), die diese Website verwendet, mit Urteil, Bild, Trigrammen und zugehörigem magischem Quadrat.',
    indexH2: 'Was ist ein Hexagramm?',
    indexIntro: 'Ein Hexagramm des I Ging ist eine Figur aus sechs Linien, durchgezogen (Yang) oder unterbrochen (Yin): Es gibt 64, jedes aus zwei übereinanderliegenden Trigrammen gebildet. Diese Seite listet sie in der chronologischen Ordnung der Website (Binärgewichte, 0 bis 63) mit der traditionellen King-Wen-Nummer. Öffnen Sie eines, um sein Urteil, sein Bild, seine sechs Linien und das zugehörige magische Quadrat zu lesen. Um zufällig eines zu ziehen, probieren Sie das <a href="{TIRAGE}">kostenlose I-Ging-Orakel</a>.',
    indexCaption: 'Die 64 Hexagramme: Nummer, Name und Trigramme',
    indexCols: ['Nr. (Website)', 'King Wen', 'Hexagramm', 'Unteres Trigramm', 'Oberes Trigramm'],
    revue: 'Übersetzung noch nicht geprüft — wenn Sie einen Fehler finden, melden Sie ihn bitte.',
  },
  it: {
    locale: 'it_IT', datePublished: '2026-11-17',
    date: (y, m, d) => `${d} ${MOIS.it[m - 1]} ${y}`,
    home: 'Home', homeUrl: `${SITE}/it/`, book: 'Il libro', bookUrl: `${SITE}/it/book/`, lexiconUrl: `${SITE}/it/lexicon/`,
    hexagrams: 'Esagrammi', breadcrumb: 'Percorso di navigazione',
    hexName: (c, n, kw) => HT.nomCourt('it', c, n, kw),
    title: (c, p, n, kw) => HT.titre('it', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('it', c, p, n, kw)}: giudizio, immagine, trigrammi, quadrato magico.`, `${HT.enTete('it', c, p, n, kw)}: giudizio, immagine, quadrato magico.`, `${HT.enTete('it', c, p, n, kw)}: giudizio, quadrato magico.`],
    sub: (c, kw, hz) => `Indice binario <b>${c}</b> (da 0 a 63; «n. cronologico» del sito, ordine per pesi binari) · n. tradizionale King Wen <b>${kw}</b> · ${hz}`,
    by: (date) => `Di <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — Aggiornato il ${date}`,
    alt: (c, n, kw) => `Quadrato magico / pavimentazione associati all'esagramma ${c} (n. King Wen ${kw}, ${n})`,
    figcaption: "Pavimentazione del quadrato magico associato a questo esagramma, La Livrée d'Hermès.",
    upper: 'Trigramma superiore', lower: 'Trigramma inferiore', image: 'Immagine', judgement: 'Giudizio', sixLines: 'Le sei linee',
    pos: ['Prima linea', 'Seconda linea', 'Terza linea', 'Quarta linea', 'Quinta linea', 'Sesta linea'],
    readBook: 'Leggere il passo nel libro (cap. 7.1) →', board: 'Vederlo sulla scacchiera interattiva →', create: 'Creare il motivo di questo esagramma →',
    source: (bookHref, frHref, pp) => `<b>Fonte</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">capitolo 7.1 (pp. ${pp.du}–${pp.au})</a>. <a href="${frHref}" hreflang="fr">Versione francese di questa pagina</a>.`,
    lexicon: (href) => `Per le nozioni usate qui — quadrato magico, strato ed estrazione, l'I Ching — vedi il <a href="${href}">lessico del progetto</a>.`,
    motifsHeading: 'I motivi di questo esagramma',
    motifsIntro: 'Da questo esagramma si generano otto motivi Jacquard 12×12, uno per ogni famiglia ammissibile del sistema. Ciascuno ha la sua pagina (in inglese): cella, pavimentazione, ricolorazioni e dati.',
    motifsComplement: (link, c, b, kwb) => `Questo esagramma è il complemento binario dell'esagramma ${link} (63 − ${c} = ${b}): i suoi motivi hanno esattamente la stessa forma, solo i colori sono permutati. Ecco gli otto motivi dell'esagramma ${b} (n. King Wen ${kwb}), uno per ogni famiglia ammissibile (pagine in inglese).`,
    neighbours: 'Esagrammi vicini', sharing: 'Esagrammi che condividono un trigramma',
    sameUpper: (s, n) => `Stesso trigramma superiore (${s} ${n}): `, sameLower: (s, n) => `Stesso trigramma inferiore (${s} ${n}): `,
    back: '← Tutti i 64 esagrammi',
    indexTitle: "I 64 esagrammi dell'I Ching: nomi e numeri | La Livrée d'Hermès",
    indexDescription: "I 64 esagrammi dell'I Ching con nome, numero (cronologico e King Wen) e trigrammi; per ciascuno giudizio, immagine e quadrato magico.",
    indexH1: 'I 64 esagrammi',
    indexSub: "Ogni esagramma dell'I Ching, nell'ordine cronologico (per pesi binari) usato da questo sito, con il suo giudizio, la sua immagine, i suoi trigrammi e il quadrato magico associato.",
    indexH2: "Che cos'è un esagramma?",
    indexIntro: "Un esagramma dell'I Ching è una figura di sei linee, intere (yang) o spezzate (yin): sono 64, ciascuno formato da due trigrammi sovrapposti. Questa pagina li elenca nell'ordine cronologico del sito (pesi binari, da 0 a 63), con il numero tradizionale King Wen. Aprine uno per leggere il suo giudizio, la sua immagine, le sue sei linee e il quadrato magico associato. Per estrarne uno a caso, prova l'<a href=\"{TIRAGE}\">estrazione dell'I Ching gratis</a>.",
    indexCaption: 'I 64 esagrammi: numero, nome e trigrammi',
    indexCols: ['N. (sito)', 'King Wen', 'Esagramma', 'Trigramma inferiore', 'Trigramma superiore'],
    revue: 'Traduzione non ancora rivista — se noti un errore, segnalacelo.',
  },
  ja: {
    locale: 'ja_JP', datePublished: '2026-11-17',
    date: (y, m, d) => `${y}年${MOIS.ja[m - 1]}${d}日`,
    home: 'ホーム', homeUrl: `${SITE}/ja/`, book: '本', bookUrl: `${SITE}/ja/book/`, lexiconUrl: `${SITE}/ja/lexicon/`,
    hexagrams: '六十四卦', breadcrumb: 'パンくずリスト',
    hexName: (c, n, kw) => HT.nomCourt('ja', c, n, kw),
    title: (c, p, n, kw) => HT.titre('ja', c, p, n, kw),
    description: (c, p, n, kw) => [`${HT.enTete('ja', c, p, n, kw)}：卦辞、象、八卦、魔方陣。`, `${HT.enTete('ja', c, p, n, kw)}：卦辞、象、魔方陣。`, `${HT.enTete('ja', c, p, n, kw)}：卦辞、魔方陣。`],
    sub: (c, kw, hz) => `二進インデックス <b>${c}</b>（0〜63。サイトの「時系列番号」、二進の重みによる順序）· 伝統的な文王の順序 <b>${kw}</b> · ${hz}`,
    by: (date) => `<a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> 著 — ${date}更新`,
    alt: (c, n, kw) => `卦 ${c}（文王の順序 ${kw}、${n}）に対応する魔方陣と敷き詰め`,
    figcaption: 'この卦に対応する魔方陣の敷き詰め。La Livrée d\'Hermès より。',
    upper: '上卦', lower: '下卦', image: '象', judgement: '卦辞', sixLines: '六つの爻',
    pos: ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'],
    readBook: '本の該当箇所を読む（7.1章）→', board: 'インタラクティブな盤で見る →', create: 'この卦の紋様をつくる →',
    source: (bookHref, frHref, pp) => `<b>出典</b>：<i>La Livrée d'Hermès</i>、Anibal Amiot — <a href="${bookHref}">7.1章（${pp.du}〜${pp.au}ページ）</a>。<a href="${frHref}" hreflang="fr">このページのフランス語版</a>。`,
    lexicon: (href) => `ここで使う概念――魔方陣、層とくじ、易経――は<a href="${href}">プロジェクトの用語集</a>を参照。`,
    motifsHeading: 'この卦の紋様',
    motifsIntro: 'この卦から、システムの許容される家族ごとに一つ、計八つの 12×12 ジャカード紋様が生まれます。それぞれに専用ページ（英語）があり、セル、敷き詰め、色替え、データを載せています。',
    motifsComplement: (link, c, b, kwb) => `この卦は卦 ${link} の二進補数です（63 − ${c} = ${b}）。紋様の形はまったく同じで、色だけが入れ替わります。以下は卦 ${b}（文王の順序 ${kwb}）の八つの紋様で、許容される家族ごとに一つです（英語のページ）。`,
    neighbours: '隣り合う卦', sharing: '同じ八卦を共有する卦',
    sameUpper: (s, n) => `同じ上卦（${s} ${n}）：`, sameLower: (s, n) => `同じ下卦（${s} ${n}）：`,
    back: '← 六十四卦の一覧',
    indexTitle: '易経の六十四卦：名前と番号 | La Livrée d\'Hermès',
    indexDescription: '易経の六十四卦を、名前、番号（時系列と文王の順序）、八卦とともに一覧。各卦に卦辞、象、魔方陣を付けています。',
    indexH1: '六十四卦',
    indexSub: 'このサイトで使う時系列（二進の重み）の順序で、易経の各卦を、卦辞、象、八卦、対応する魔方陣とともに載せています。',
    indexH2: '卦とは何か',
    indexIntro: '易経の卦は六つの爻でできた図形で、爻は陽（実線）か陰（破線）です。全部で六十四あり、それぞれ二つの八卦が上下に重なってできています。このページは、サイトの時系列の順序（二進の重み、0〜63）で、伝統的な文王の順序の番号とともに並べています。一つ開けば、その卦辞、象、六つの爻、対応する魔方陣が読めます。無作為に一つ引くには、<a href="{TIRAGE}">無料の易経占い</a>をお試しください。',
    indexCaption: '六十四卦：番号、名前、八卦',
    indexCols: ['番号（サイト）', '文王の順序', '卦', '下卦', '上卦'],
    revue: 'この翻訳はまだ校閲されていません。誤りを見つけたらお知らせください。',
  },
};

// Zones posées ensuite par build-header.js : reprises du fichier en place.
function garderZones(rendu, ancien) {
  if (!ancien) return rendu;
  for (const zone of ['hreflang', 'langues']) {
    const re = new RegExp(`[ \\t]*<!-- @${zone}:start[\\s\\S]*?<!-- @${zone}:end -->`);
    const m = ancien.match(re);
    if (m) rendu = re.test(rendu) ? rendu.replace(re, m[0]) : rendu.replace('</head>', `${m[0]}\n</head>`);
  }
  return rendu;
}

const STYLE = stylePageFr(A.fichier(0, 'fr'));
const STYLE_INDEX = stylePageFr(A.fichier(null, 'fr'));
const NOTE_REVUE_CSS = '<style>.i18n-review-note{ font-size:calc(11.5px + var(--fs-bump)); color:var(--dim); font-style:italic; margin:6px 0 0; }</style>';

function genererLangue(lang) {
  // la page de création de motifs n'existe pas encore dans toutes les langues : le lien l'annonce avant le clic
  const annonceCreation = annonceVers('creation-motifs-yi-king.html', lang);
  const l = L[lang];
  const tx = textes(lang);
  fs.mkdirSync(path.join(ROOT, A.DOSSIER[lang]), { recursive: true });
  const ICONES = rendre('head-icons', PREFIXE);
  const PIED = rendre('footer', PREFIXE, lang);
  const EN_TETE = rendre('header', PREFIXE, lang);
  // Le bloc de tuiles, dans la langue de la page (nav-tiles.js, huit langues).
  const tuiles = (fichier) => htmlNavTiles(fichier, PREFIXE, lang);
  const scriptAnnee = "<script>document.getElementById('credit-year').textContent = new Date().getFullYear();</script>\n";
  const revue = l.revue ? `\n      <p class="i18n-review-note">${escapeHtml(l.revue)}</p>` : '';
  const revueIndex = l.revue ? `\n    <p class="i18n-review-note">${escapeHtml(l.revue)}</p>` : '';
  const cssRevue = l.revue ? `\n${NOTE_REVUE_CSS}` : '';

  const info = [];
  for (let chrono = 0; chrono < 64; chrono++) {
    const kw = DATA.KINGWEN_BY_CHRONO[chrono];
    const traits = traitsFromChrono(chrono);
    const h = tx.hex(kw);
    info.push({ chrono, kw, pinyin: h.pinyin, name: h.name, traits, lowerVal: trigramValue(traits.slice(0, 3)), upperVal: trigramValue(traits.slice(3, 6)) });
  }
  const hexLink = (i) => `<a href="${A.url(i.chrono, lang)}">${escapeHtml(HT.lien(lang, i.chrono, i.pinyin, i.name, i.kw))}</a>`;

  function motifsHtml(chrono) {
    const base = chrono < 32 ? chrono : 63 - chrono;
    const intro = chrono < 32 ? l.motifsIntro : l.motifsComplement(hexLink(info[base]), chrono, base, info[base].kw);
    const cartes = MOTIFS.ORDERED_FAMILIES.map((fam) => {
      const slug = MOTIFS.motifSlug(fam, base);
      return `        <a class="motif-card" href="${SITE}/motifs/${slug}.html"${lang === 'en' ? '' : ' hreflang="en"'}><img src="${PREFIXE}assets/motifs-preview/${slug}.png" alt="" width="96" height="96" loading="lazy"><span>${escapeHtml(MOTIFS.FAMILY_LABEL.en[fam])}</span></a>`;
    }).join('\n');
    return `<h2>${l.motifsHeading}</h2>
      <p>${intro}</p>
      <div class="motif-grid">
${cartes}
      </div>`;
  }

  // la visionneuse n'ouvre que les éditions parues (scripts/livres.js) : de, it, ja « en préparation » renvoient à l'anglaise
  const lecture = ((require('./livres.js').livres().find((x) => x.code === lang)) || {}).pret ? lang : 'en';
  // le code de la page « Trame » et les numéros imprimés du chapitre 7.1 : ceux de l'édition lue
  // (scripts/livres.js : 063 à 068 dans l'ancienne, 081 à 086 dans celle de livre-medias)
  const pp = require('./livres.js').pagesTrame(lecture);
  const bookHref = `${SITE}/book-viewer/index.html?read=${lecture}&amp;page=${pp.code}`;
  for (const h of info) {
    const { chrono, kw, pinyin, name, traits } = h;
    const { judgementTitle, judgement, image } = tx.hex(kw);
    const hanzi = DATA.HANZI_BY_KW[kw] || '';
    const lower = tx.trigram(h.lowerVal);
    const upper = tx.trigram(h.upperVal);
    const url = A.url(chrono, lang);
    const prev = info[(chrono + 63) % 64], next = info[(chrono + 1) % 64];
    const sameUpper = info.filter((x) => x.chrono !== chrono && x.upperVal === h.upperVal);
    const sameLower = info.filter((x) => x.chrono !== chrono && x.lowerVal === h.lowerVal);
    const title = l.title(chrono, pinyin, name, kw);
    // <title>, og:title, twitter:title et JSON-LD name : le titre du <h1> suivi du nom du site (retiré d'abord, en écriture latine, quand le tout dépasse 60 caractères : scripts/hexagram-titres.js)
    const titleMeta = HT.titreMeta(lang, chrono, pinyin, name, kw);
    const description = HEXDESC.description(judgement, l.description(chrono, pinyin, name, kw));

    const lines = traits.map((bit, i) => `      <div class="hexline">
        <div class="hexline-body"><b>${l.pos[i]}</b><p>${escapeHtml(tx.line(i + 1, bit))}</p></div>
      </div>`).join('\n');
    const column = traits.slice().reverse().map((bit) => `<div class="hexline-glyph small">${traitSVG(bit)}</div>`).join('\n');
    const trigramCard = (t, lbl) => `        <div class="trigram-card">
          <div class="sym">${t.symbol}</div>
          <div class="lbl">${lbl}</div>
          <b>${escapeHtml(t.name)}</b> — ${escapeHtml(t.nature)}, ${escapeHtml(t.image)}<br>
          <span class="role">${escapeHtml(t.role)}</span>
        </div>`;

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(titleMeta)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(titleMeta)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE}/assets/hexagrammes/${chrono}.png">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${l.locale}">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(titleMeta)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/assets/hexagrammes/${chrono}.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": ${JSON.stringify(l.hexName(chrono, name, kw))},
  "description": ${JSON.stringify(description)},
  "inLanguage": "${lang}",
  "inDefinedTermSet": "${l.lexiconUrl}",
  "url": "${url}",
  "datePublished": "${l.datePublished}",
  "dateModified": "@@DATE_ISO@@",
  "author": {
    "@type": "Person",
    "name": "Anibal Edelberto Amiot",
    "url": "${SITE}/a-propos.html"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "${url}#page",
  "url": "${url}",
  "name": ${JSON.stringify(titleMeta)},
  "description": ${JSON.stringify(description)},
  "inLanguage": "${lang}",
  "isPartOf": { "@id": "${SITE}/#website" },
  "license": "https://creativecommons.org/licenses/by-nc/4.0/"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(l.home)}, "item": "${l.homeUrl}" },
    { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(l.book)}, "item": "${l.bookUrl}" },
    { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(l.hexagrams)}, "item": "${A.url(null, lang)}" },
    { "@type": "ListItem", "position": 4, "name": ${JSON.stringify(l.hexName(chrono, name, kw))}, "item": "${url}" }
  ]
}
</script>
${STYLE}${cssRevue}
<link rel="stylesheet" href="${PREFIXE}style.css">
<link rel="stylesheet" href="${PREFIXE}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">
<link rel="stylesheet" href="${PREFIXE}assets/fonts.css">
<link rel="stylesheet" href="${PREFIXE}assets/atalanta-bg.css">
${ICONES}
</head>
<body>
<div class="wrap">
${EN_TETE}
<!-- @main:start -->
<main id="contenu">
  <div class="article-body">
    <div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-4-hexagrammes.avif);">
    <div class="atalanta-block" style="padding:28px 24px;">
      <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
      <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
      <nav class="breadcrumb" aria-label="${l.breadcrumb}">
        <a href="${l.homeUrl}">${l.home}</a><span class="sep">/</span><a href="${l.bookUrl}">${l.book}</a><span class="sep">/</span><a href="${A.url(null, lang)}">${l.hexagrams}</a><span class="sep">/</span><span aria-current="page">${escapeHtml(l.hexName(chrono, name, kw))}</span>
      </nav>
      <!-- @langues:start --><!-- @langues:end -->

      <h1 class="article-title">${escapeHtml(title)}</h1>
      <p class="article-sub">${l.sub(chrono, kw, escapeHtml(hanzi))}</p>
      <p class="article-date">${l.by('@@DATE_TEXTE@@')}</p>${revue}
    </div>
    </div>

    <div class="article-content">
      <div class="hex-figure">
        <div class="hex-column">
${column}
        </div>
        <figure class="hex-square">
          <img src="${PREFIXE}assets/hexagrammes/${chrono}.png" alt="${escapeHtml(l.alt(chrono, name, kw))}" width="480" height="480">
          <figcaption>${escapeHtml(l.figcaption)}</figcaption>
        </figure>
      </div>

      <div class="trigram-row">
${trigramCard(upper, l.upper)}
${trigramCard(lower, l.lower)}
      </div>

      <div class="keyword">${l.image}</div>
      <div class="keyword-sub">${escapeHtml(name)}</div>
      <p>${escapeHtml(image)}</p>

      <div class="keyword">${l.judgement}</div>
      <div class="keyword-sub">${escapeHtml(judgementTitle)}</div>
      <p>${escapeHtml(judgement)}</p>

      <h2>${l.sixLines}</h2>
      <div class="hexlines-list">
${lines}
      </div>

      <div class="cta-row">
        <a class="cta-btn" href="${bookHref}">${l.readBook}</a>
        <a class="cta-btn" href="${SITE}/?chrono=${chrono}">${l.board}</a>
        <a class="cta-btn" href="${SITE}/${adresseDans('creation-motifs-yi-king.html', lang)}"${annonceCreation ? ` hreflang="${annonceCreation.hreflang}"` : ''}>${l.create}${annonceCreation ? espaceAvant(annonceCreation.texte) + annonceCreation.texte : ''}</a>
      </div>

      <hr>
      <p class="article-sources">${l.source(bookHref, A.url(chrono, 'fr'), pp)}</p>
      <p><i>${l.lexicon(l.lexiconUrl)}</i></p>

      ${motifsHtml(chrono)}

      <h2>${l.neighbours}</h2>
      <p>${hexLink(prev)} · ${hexLink(next)}</p>

      <h2>${l.sharing}</h2>
      <p>${l.sameUpper(upper.symbol, escapeHtml(upper.name))}${sameUpper.map(hexLink).join(' · ')}</p>
      <p>${l.sameLower(lower.symbol, escapeHtml(lower.name))}${sameLower.map(hexLink).join(' · ')}</p>
    </div>

    <a class="article-back-bottom" href="${A.url(null, lang)}">${l.back}</a>
  </div>

</main>
<!-- @main:end -->
${tuiles(A.fichier(chrono, lang))}
${PIED}
</div>
${scriptAnnee}<script src="${PREFIXE}assets/share-widget.js"></script>
<script src="${PREFIXE}assets/soutien-gate.js"></script>
</body>
</html>
`;

    // Empreinte du seul texte éditorial : la date ne bouge que s'il change.
    const empreinte = crypto.createHash('sha256').update(JSON.stringify({
      chrono, kw, pinyin, nameEn: name, hanzi, judgementTitle, judgementText: judgement, imageText: image,
      traits: traits.map((bit, i) => tx.line(i + 1, bit)), lower, upper,
    })).digest('hex');
    const outPath = path.join(ROOT, A.fichier(chrono, lang));
    const ancien = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
    const empreinteAncienne = ancien && (ancien.match(/<!-- @contenu sha256:([0-9a-f]{64})/) || [])[1];
    const dateAncienne = ancien && (ancien.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/) || [])[1];
    const dateModified = dateAncienne && empreinteAncienne === empreinte ? dateAncienne : TODAY;
    const [y, m, d] = dateModified.split('-').map(Number);

    const rendu = html.split('@@DATE_ISO@@').join(dateModified).split('@@DATE_TEXTE@@').join(l.date(y, m, d))
      .replace('<head>', `<head>\n<!-- @contenu sha256:${empreinte} — empreinte du texte éditorial seul ; voir scripts/generate-hexagram-pages-traduites.js -->`);
    ecrire(outPath, garderZones(rendu, ancien));
  }

  // ---------- index ----------
  const url = A.url(null, lang);
  const tirage = `${SITE}/${adresseDans('tirage-livree-hermes.html', lang)}`;
  const tg = (v) => { const t = tx.trigram(v); return `${t.symbol} ${escapeHtml(t.name)}`; };
  const items = info.map((i) => `        <tr><th scope="row">${i.chrono}</th><td>${i.kw}</td><td><a href="${A.url(i.chrono, lang)}">${escapeHtml(i.pinyin)}, ${escapeHtml(i.name)}</a></td><td>${tg(i.lowerVal)}</td><td>${tg(i.upperVal)}</td></tr>`).join('\n');
  const outPath = path.join(ROOT, A.fichier(null, lang));
  const ancien = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(l.indexTitle)}</title>
<meta name="description" content="${escapeHtml(l.indexDescription)}">
<meta property="og:title" content="${escapeHtml(l.indexTitle)}">
<meta property="og:description" content="${escapeHtml(l.indexDescription)}">
<meta property="og:image" content="${SITE}/assets/hexagrammes/0.png">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${l.locale}">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(l.indexTitle)}">
<meta name="twitter:description" content="${escapeHtml(l.indexDescription)}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": ${JSON.stringify(l.indexTitle)},
  "description": ${JSON.stringify(l.indexDescription)},
  "inLanguage": "${lang}",
  "url": "${url}",
  "hasPart": [
${info.map((i) => `    { "@type": "DefinedTerm", "name": ${JSON.stringify(l.hexName(i.chrono, i.name, i.kw))}, "url": "${A.url(i.chrono, lang)}" }`).join(',\n')}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(l.home)}, "item": "${l.homeUrl}" },
    { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(l.book)}, "item": "${l.bookUrl}" },
    { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(l.hexagrams)}, "item": "${url}" }
  ]
}
</script>
${STYLE_INDEX}${cssRevue}
<link rel="stylesheet" href="${PREFIXE}style.css">
<link rel="stylesheet" href="${PREFIXE}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">
<link rel="stylesheet" href="${PREFIXE}assets/fonts.css">
<link rel="stylesheet" href="${PREFIXE}assets/atalanta-bg.css">
${ICONES}
</head>
<body>
<div class="wrap">
${EN_TETE}
<!-- @main:start -->
<main id="contenu">
  <div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-4-hexagrammes.avif);">
  <div class="atalanta-block" style="padding:28px 24px;">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
    <nav class="breadcrumb" aria-label="${l.breadcrumb}">
      <a href="${l.homeUrl}">${l.home}</a><span class="sep">/</span><a href="${l.bookUrl}">${l.book}</a><span class="sep">/</span><span aria-current="page">${l.hexagrams}</span>
    </nav>
    <!-- @langues:start --><!-- @langues:end -->

    <h1 class="page-title">${l.indexH1}</h1>
    <p class="page-sub">${l.indexSub}</p>${revueIndex}
  </div>
  </div>

  <section class="hex-intro">
    <h2>${l.indexH2}</h2>
    <p>${l.indexIntro.replace('{TIRAGE}', tirage)}</p>
  </section>

  <div class="hex-table-wrap">
    <table class="hex-table">
      <caption>${l.indexCaption}</caption>
      <thead><tr>${l.indexCols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
      <tbody>
${items}
      </tbody>
    </table>
  </div>

</main>
<!-- @main:end -->
${tuiles(A.fichier(null, lang))}
${PIED}
</div>
${scriptAnnee}<script src="${PREFIXE}assets/share-widget.js"></script>
<script src="${PREFIXE}assets/soutien-gate.js"></script>
</body>
</html>
`;
  ecrire(outPath, garderZones(html, ancien));
  if (!VERIFIE) console.log(`Généré 64 pages + index dans ${A.DOSSIER[lang]}/`);
}

for (const lang of ['en', 'es', 'th', 'de', 'it', 'ja']) genererLangue(lang);
if (VERIFIE) {
  if (PERIMEES.length) {
    console.error(`${PERIMEES.length} fichier(s) ne correspondent pas à ce que le générateur produit :`);
    for (const f of PERIMEES.slice(0, 20)) console.error(`   ${f}`);
    console.error('\nRelancer : node scripts/generate-hexagram-pages.js && node scripts/generate-hexagram-pages-traduites.js && node scripts/build-header.js');
    process.exit(1);
  }
  console.log('OK    generate-hexagram-pages-traduites : 6 langues × (64 pages + listing) à jour (rien écrit).');
}
