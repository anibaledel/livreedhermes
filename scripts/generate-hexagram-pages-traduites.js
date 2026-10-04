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
const path = require('path');
const crypto = require('crypto');
const DATA = require('./extract-hexagram-data.js');
const A = require('./hexagrammes-adresses.js');
const MOTIFS = require('./generate-motif-pages.js');
const { rendre } = require('./build-header.js');
const { htmlNavTiles } = require('./nav-tiles.js');

const ROOT = path.resolve(__dirname, '..');
const PREFIXE = '../../';
const SITE = 'https://anibal-amiot.com';
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
};
const L = {
  en: {
    locale: 'en_US', datePublished: '2026-10-01',
    date: (y, m, d) => `${MOIS.en[m - 1]} ${d}, ${y}`,
    home: 'Home', homeUrl: `${SITE}/en/`, book: 'The book', bookUrl: `${SITE}/en/book/`, lexiconUrl: `${SITE}/en/lexicon/`,
    hexagrams: 'Hexagrams', breadcrumb: 'Breadcrumb',
    hexName: (c, n) => `Hexagram ${c} — ${n}`,
    title: (c, p, n) => `Hexagram ${c} — ${p}, ${n}`,
    description: (c, p, n, kw) => `Hexagram ${c} (${p}, ${n}, King Wen no. ${kw}): judgement, image, trigrams and the magic square of La Livrée d'Hermès.`,
    sub: (c, kw, hz) => `Chronological no. <b>${c}</b> (binary-weight order) · King Wen no. (traditional) ${kw} · ${hz}`,
    by: (date) => `By <a href="${SITE}/a-propos.html">Anibal Edelberto Amiot</a> — Updated ${date}`,
    alt: (c, n) => `Magic square / tiling associated with hexagram ${c} (${n})`,
    figcaption: "Tiling of the magic square associated with this hexagram, La Livrée d'Hermès.",
    upper: 'Upper trigram', lower: 'Lower trigram', image: 'Image', judgement: 'Judgement', sixLines: 'The six lines',
    pos: ['First line', 'Second line', 'Third line', 'Fourth line', 'Fifth line', 'Sixth line'],
    readBook: 'Read the passage in the book (ch. 7.1) →', board: 'See it on the interactive board →', create: "Create this hexagram's pattern →",
    source: (bookHref, frHref) => `<b>Source</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">chapter 7.1 (pp. 63–68)</a>. <a href="${frHref}">French version of this page</a>.`,
    lexicon: (href) => `For the notions used here — magic square, layer and casting, the Yi Jing — see the <a href="${href}">project lexicon</a>.`,
    motifsHeading: 'The patterns of this hexagram',
    motifsIntro: 'Eight 12×12 Jacquard patterns are generated from this hexagram, one for each admissible family of the system. Each has its own page: cell, tiling, recolourings and data.',
    motifsComplement: (link, c, b) => `This hexagram is the binary complement of hexagram ${link} (63 − ${c} = ${b}): its patterns have exactly the same shape, only their colours are permuted. Here are the eight patterns of hexagram ${b}, one for each admissible family.`,
    neighbours: 'Neighbouring hexagrams', sharing: 'Hexagrams sharing a trigram',
    sameUpper: (s, n) => `Same upper trigram (${s} ${n}): `, sameLower: (s, n) => `Same lower trigram (${s} ${n}): `,
    back: '← All 64 hexagrams',
    indexTitle: "Hexagrams — La Livrée d'Hermès",
    indexDescription: "The 64 hexagrams of the Yi Jing in the site's chronological order: judgement, image, trigrams and the magic square associated with each.",
    indexH1: 'The 64 hexagrams',
    indexSub: 'Each hexagram of the Yi Jing, in the chronological (binary-weight) order used on this site, with its judgement, image, trigrams and associated magic square.',
    revue: null,
  },
  es: {
    locale: 'es_ES', datePublished: '2026-10-01',
    date: (y, m, d) => `${d} de ${MOIS.es[m - 1]} de ${y}`,
    home: 'Inicio', homeUrl: `${SITE}/es/`, book: 'El libro', bookUrl: `${SITE}/es/libro/`, lexiconUrl: `${SITE}/es/lexico/`,
    hexagrams: 'Hexagramas', breadcrumb: 'Ruta de navegación',
    hexName: (c, n) => `Hexagrama ${c} — ${n}`,
    title: (c, p, n) => `Hexagrama ${c} — ${p}, ${n}`,
    description: (c, p, n, kw) => `Hexagrama ${c} (${p}, ${n}, n.º King Wen ${kw}): juicio, imagen, trigramas y el cuadrado mágico de La Livrée d'Hermès.`,
    sub: (c, kw, hz) => `N.º cronológico <b>${c}</b> (orden por pesos binarios) · n.º King Wen (tradicional) ${kw} · ${hz}`,
    by: (date) => `Por <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — Actualizado el ${date}`,
    alt: (c, n) => `Cuadrado mágico / teselado asociado al hexagrama ${c} (${n})`,
    figcaption: "Teselado del cuadrado mágico asociado a este hexagrama, La Livrée d'Hermès.",
    upper: 'Trigrama superior', lower: 'Trigrama inferior', image: 'Imagen', judgement: 'Juicio', sixLines: 'Los seis rasgos',
    pos: ['Primer rasgo', 'Segundo rasgo', 'Tercer rasgo', 'Cuarto rasgo', 'Quinto rasgo', 'Sexto rasgo'],
    readBook: 'Leer el pasaje en el libro (cap. 7.1) →', board: 'Verlo en el tablero interactivo →', create: 'Crear el motivo de este hexagrama →',
    source: (bookHref, frHref) => `<b>Fuente</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">capítulo 7.1 (pp. 63–68)</a>. <a href="${frHref}" hreflang="fr">Versión francesa de esta página</a>.`,
    lexicon: (href) => `Para las nociones empleadas aquí — cuadrado mágico, capa y tirada, el Yi King — consulte el <a href="${href}">léxico del proyecto</a>.`,
    motifsHeading: 'Los motivos de este hexagrama',
    motifsIntro: 'De este hexagrama se generan ocho motivos Jacquard de 12×12, uno por cada familia admisible del sistema. Cada uno tiene su página (en inglés): celda, teselado, recoloreados y datos.',
    motifsComplement: (link, c, b) => `Este hexagrama es el complemento binario del hexagrama ${link} (63 − ${c} = ${b}): sus motivos tienen exactamente la misma forma; solo se permutan sus colores. Estos son los ocho motivos del hexagrama ${b}, uno por cada familia admisible (páginas en inglés).`,
    neighbours: 'Hexagramas vecinos', sharing: 'Hexagramas que comparten un trigrama',
    sameUpper: (s, n) => `Mismo trigrama superior (${s} ${n}): `, sameLower: (s, n) => `Mismo trigrama inferior (${s} ${n}): `,
    back: '← Los 64 hexagramas',
    indexTitle: "Hexagramas — La Livrée d'Hermès",
    indexDescription: 'Los 64 hexagramas del Yi King en el orden cronológico del sitio: juicio, imagen, trigramas y el cuadrado mágico asociado a cada uno.',
    indexH1: 'Los 64 hexagramas',
    indexSub: 'Cada hexagrama del Yi King, en el orden cronológico (por pesos binarios) que usa este sitio, con su juicio, su imagen, sus trigramas y el cuadrado mágico asociado.',
    // Même mention que cymatique.html (UI.es.i18nReviewNote).
    revue: 'Traducción en revisión — si detectas un error, indícalo.',
  },
  th: {
    locale: 'th_TH', datePublished: '2026-10-01',
    date: (y, m, d) => `${d} ${MOIS.th[m - 1]} ${y}`,
    home: 'หน้าแรก', homeUrl: `${SITE}/th/`, book: 'หนังสือ', bookUrl: `${SITE}/th/book/`, lexiconUrl: `${SITE}/th/lexicon/`,
    hexagrams: 'ฉักลักษณ์', breadcrumb: 'เส้นทางนำทาง',
    hexName: (c, n) => `ฉักลักษณ์ที่ ${c} — ${n}`,
    title: (c, p, n) => `ฉักลักษณ์ที่ ${c} — ${p}, ${n}`,
    description: (c, p, n, kw) => `ฉักลักษณ์ที่ ${c} (${p}, ${n}, ลำดับ King Wen ที่ ${kw}): คำตัดสิน ภาพลักษณ์ ตรีลักษณ์ และจัตุรัสกลของ La Livrée d'Hermès`,
    sub: (c, kw, hz) => `ลำดับตามเวลา <b>${c}</b> (เรียงตามน้ำหนักฐานสอง) · ลำดับ King Wen (ดั้งเดิม) ${kw} · ${hz}`,
    by: (date) => `โดย <a href="${SITE}/a-propos.html" hreflang="fr">Anibal Edelberto Amiot</a> — ปรับปรุงเมื่อ ${date}`,
    alt: (c, n) => `จัตุรัสกล / การปูลายที่สัมพันธ์กับฉักลักษณ์ที่ ${c} (${n})`,
    figcaption: "การปูลายของจัตุรัสกลที่สัมพันธ์กับฉักลักษณ์นี้, La Livrée d'Hermès",
    upper: 'ตรีลักษณ์บน', lower: 'ตรีลักษณ์ล่าง', image: 'ภาพลักษณ์', judgement: 'คำตัดสิน', sixLines: 'หกเส้น',
    pos: ['เส้นที่หนึ่ง', 'เส้นที่สอง', 'เส้นที่สาม', 'เส้นที่สี่', 'เส้นที่ห้า', 'เส้นที่หก'],
    readBook: 'อ่านตอนนี้ในหนังสือ (บทที่ 7.1) →', board: 'ดูบนกระดานแบบโต้ตอบ →', create: 'สร้างลวดลายของฉักลักษณ์นี้ →',
    source: (bookHref, frHref) => `<b>ที่มา</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${bookHref}">บทที่ 7.1 (หน้า 63–68)</a> · <a href="${frHref}" hreflang="fr">หน้านี้ฉบับภาษาฝรั่งเศส</a>`,
    lexicon: (href) => `สำหรับแนวคิดที่ใช้ในหน้านี้ — จัตุรัสกล ชั้นลายและการเสี่ยงทาย อี้จิง — ดู<a href="${href}">อภิธานศัพท์ของโครงการ</a>`,
    motifsHeading: 'ลวดลายของฉักลักษณ์นี้',
    motifsIntro: 'ลวดลายแจ็คการ์ดขนาด 12×12 จำนวนแปดลายสร้างขึ้นจากฉักลักษณ์นี้ หนึ่งลายต่อหนึ่งตระกูลที่ยอมรับได้ของระบบ แต่ละลายมีหน้าของตนเอง (ภาษาอังกฤษ): เซลล์ การปูลาย การเปลี่ยนสี และข้อมูล',
    motifsComplement: (link, c, b) => `ฉักลักษณ์นี้เป็นส่วนเติมเต็มฐานสองของฉักลักษณ์ ${link} (63 − ${c} = ${b}) ลวดลายของฉักลักษณ์นี้จึงมีรูปทรงเหมือนกันทุกประการ ต่างกันเพียงการสลับสี ต่อไปนี้คือลวดลายแปดลายของฉักลักษณ์ที่ ${b} หนึ่งลายต่อหนึ่งตระกูล (หน้าภาษาอังกฤษ)`,
    neighbours: 'ฉักลักษณ์ข้างเคียง', sharing: 'ฉักลักษณ์ที่มีตรีลักษณ์ร่วมกัน',
    sameUpper: (s, n) => `ตรีลักษณ์บนเดียวกัน (${s} ${n}): `, sameLower: (s, n) => `ตรีลักษณ์ล่างเดียวกัน (${s} ${n}): `,
    back: '← ฉักลักษณ์ทั้ง 64',
    indexTitle: "ฉักลักษณ์ — La Livrée d'Hermès",
    indexDescription: 'ฉักลักษณ์ทั้ง 64 ของอี้จิง เรียงตามลำดับเวลาของเว็บไซต์: คำตัดสิน ภาพลักษณ์ ตรีลักษณ์ และจัตุรัสกลที่สัมพันธ์กับแต่ละฉักลักษณ์',
    indexH1: 'ฉักลักษณ์ทั้ง 64',
    indexSub: 'ฉักลักษณ์แต่ละตัวของอี้จิง เรียงตามลำดับเวลา (ตามน้ำหนักฐานสอง) ที่ใช้ในเว็บไซต์นี้ พร้อมคำตัดสิน ภาพลักษณ์ ตรีลักษณ์ และจัตุรัสกลที่สัมพันธ์กัน',
    // Même mention que cymatique.html (UI.th.i18nReviewNote).
    revue: 'การแปลอยู่ระหว่างการตรวจทาน — หากพบข้อผิดพลาด กรุณาแจ้งให้ทราบ',
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
  const hexLink = (i) => `<a href="${A.url(i.chrono, lang)}">${i.chrono} — ${escapeHtml(i.pinyin)}, ${escapeHtml(i.name)}</a>`;

  function motifsHtml(chrono) {
    const base = chrono < 32 ? chrono : 63 - chrono;
    const intro = chrono < 32 ? l.motifsIntro : l.motifsComplement(hexLink(info[base]), chrono, base);
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

  const bookHref = `${SITE}/book-viewer/index.html?read=${lang}&amp;page=063`;
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
    const title = l.title(chrono, pinyin, name);
    const description = l.description(chrono, pinyin, name, kw);

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
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE}/assets/hexagrammes/${chrono}.png">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${l.locale}">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/assets/hexagrammes/${chrono}.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": ${JSON.stringify(l.hexName(chrono, name))},
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
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(l.home)}, "item": "${l.homeUrl}" },
    { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(l.book)}, "item": "${l.bookUrl}" },
    { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(l.hexagrams)}, "item": "${A.url(null, lang)}" },
    { "@type": "ListItem", "position": 4, "name": ${JSON.stringify(l.hexName(chrono, name))}, "item": "${url}" }
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
        <a href="${l.homeUrl}">${l.home}</a><span class="sep">/</span><a href="${l.bookUrl}">${l.book}</a><span class="sep">/</span><a href="${A.url(null, lang)}">${l.hexagrams}</a><span class="sep">/</span><span aria-current="page">${escapeHtml(l.hexName(chrono, name))}</span>
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
          <img src="${PREFIXE}assets/hexagrammes/${chrono}.png" alt="${escapeHtml(l.alt(chrono, name))}" width="480" height="480">
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
        <a class="cta-btn" href="${SITE}/creation-motifs-yi-king.html">${l.create}</a>
      </div>

      <hr>
      <p class="article-sources">${l.source(bookHref, A.url(chrono, 'fr'))}</p>
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
    fs.writeFileSync(outPath, garderZones(rendu, ancien), 'utf8');
  }

  // ---------- index ----------
  const url = A.url(null, lang);
  const items = info.map((i) => `    <a class="hex-grid-item" href="${A.url(i.chrono, lang)}">${i.chrono} — ${escapeHtml(i.pinyin)}, ${escapeHtml(i.name)}</a>`).join('\n');
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
${info.map((i) => `    { "@type": "DefinedTerm", "name": ${JSON.stringify(l.hexName(i.chrono, i.name))}, "url": "${A.url(i.chrono, lang)}" }`).join(',\n')}
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

  <div class="hex-grid">
${items}
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
  fs.writeFileSync(outPath, garderZones(html, ancien), 'utf8');
  console.log(`Généré 64 pages + index dans ${A.DOSSIER[lang]}/`);
}

for (const lang of ['en', 'es', 'th']) genererLangue(lang);
