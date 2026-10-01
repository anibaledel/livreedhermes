#!/usr/bin/env node
/* ============================================================
   Les 64 pages hexagrammes en anglais (en/hexagrams/) et leur index.

   Jumelles des pages françaises de generate-hexagram-pages.js, avec les
   textes anglais qu'affiche déjà l'échiquier d'index.html en anglais
   (HEX_KW_EN, IMAGE_EN, LINE_COMMENT_EN, TRIGRAMS_EN, extraits par
   extract-hexagram-data.js) : aucune traduction nouvelle ici, seulement les
   libellés de la page.

   Ce qui est partagé, et repris tel quel plutôt que recopié :
     - les adresses FR/EN (hexagrammes-adresses.js), d'où viennent aussi les
       paires hreflang de scripts/langues.js ;
     - la feuille de style de la page, lue dans la page française générée
       (même mise en page, aucune seconde copie à tenir à jour) — lancer
       donc generate-hexagram-pages.js AVANT ce script ;
     - l'en-tête, le pied, les icônes (includes/, via build-header.js) et le
       bloc de tuiles anglais (nav-tiles.js, comme les pages motifs) ;
     - les familles et adresses des motifs (generate-motif-pages.js).

   dateModified suit la même règle que les pages françaises : elle ne bouge
   que si le texte éditorial change (empreinte SHA-256 en tête de <head>).

   Usage : node scripts/generate-hexagram-pages.js && node scripts/generate-hexagram-pages-en.js
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
const OUT_DIR = path.join(ROOT, A.DOSSIER.en);
fs.mkdirSync(OUT_DIR, { recursive: true });
const PREFIXE = '../../';
const SITE = 'https://anibal-amiot.com';

const ICONES = rendre('head-icons', PREFIXE);
const PIED = rendre('footer', PREFIXE);
const EN_TETE = rendre('header', PREFIXE, 'en');

const DATE_PUBLISHED = '2026-10-01';
const TODAY = new Date().toISOString().slice(0, 10);
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const formatDateEn = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS_EN[m - 1]} ${d}, ${y}`; };

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
const POS_LABELS = ['First line', 'Second line', 'Third line', 'Fourth line', 'Fifth line', 'Sixth line'];

// La feuille de style de la page française, reprise telle quelle.
function stylePageFr(fichierFr) {
  const html = fs.readFileSync(path.join(ROOT, fichierFr), 'utf8');
  const m = html.match(/<style>[\s\S]*?<\/style>/);
  if (!m) throw new Error(`${fichierFr} : <style> introuvable — lancer generate-hexagram-pages.js d'abord`);
  return m[0];
}

const info = [];
for (let chrono = 0; chrono < 64; chrono++) {
  const kw = DATA.KINGWEN_BY_CHRONO[chrono];
  const traits = traitsFromChrono(chrono);
  const [pinyin, nameEn] = DATA.HEX_KW_EN[kw];
  info.push({ chrono, kw, pinyin, nameEn, traits, lowerVal: trigramValue(traits.slice(0, 3)), upperVal: trigramValue(traits.slice(3, 6)) });
}
const hexLink = (i) => `<a href="${A.url(i.chrono, 'en')}">${i.chrono} — ${escapeHtml(i.pinyin)}, ${escapeHtml(i.nameEn)}</a>`;

function motifsHtml(chrono) {
  const base = chrono < 32 ? chrono : 63 - chrono;
  const intro = chrono < 32
    ? 'Eight 12×12 Jacquard patterns are generated from this hexagram, one for each admissible family of the system. Each has its own page: cell, tiling, recolourings and data.'
    : `This hexagram is the binary complement of hexagram ${hexLink(info[base])} (63 − ${chrono} = ${base}): its patterns have exactly the same shape, only their colours are permuted. Here are the eight patterns of hexagram ${base}, one for each admissible family.`;
  const cartes = MOTIFS.ORDERED_FAMILIES.map((fam) => {
    const slug = MOTIFS.motifSlug(fam, base);
    return `        <a class="motif-card" href="${SITE}/motifs/${slug}.html"><img src="${PREFIXE}assets/motifs-preview/${slug}.png" alt="" width="96" height="96" loading="lazy"><span>${escapeHtml(MOTIFS.FAMILY_LABEL.en[fam])}</span></a>`;
  }).join('\n');
  return `<h2>The patterns of this hexagram</h2>
      <p>${intro}</p>
      <div class="motif-grid">
${cartes}
      </div>`;
}

const fileFrPremier = A.fichier(0, 'fr');
const STYLE = stylePageFr(fileFrPremier);

for (const h of info) {
  const { chrono, kw, pinyin, nameEn, traits } = h;
  const [, , judgementTitle, judgementText] = DATA.HEX_KW_EN[kw];
  const imageText = DATA.IMAGE_EN[kw];
  const hanzi = DATA.HANZI_BY_KW[kw] || '';
  const lower = DATA.TRIGRAMS_EN[h.lowerVal];
  const upper = DATA.TRIGRAMS_EN[h.upperVal];
  const url = A.url(chrono, 'en');
  const prev = info[(chrono + 63) % 64], next = info[(chrono + 1) % 64];
  const sameUpper = info.filter((x) => x.chrono !== chrono && x.upperVal === h.upperVal);
  const sameLower = info.filter((x) => x.chrono !== chrono && x.lowerVal === h.lowerVal);
  const title = `Hexagram ${chrono} — ${pinyin}, ${nameEn}`;
  const description = `Hexagram ${chrono} (${pinyin}, ${nameEn}, King Wen no. ${kw}): judgement, image, trigrams and the magic square of La Livrée d'Hermès.`;

  const lines = traits.map((bit, i) => `      <div class="hexline">
        <div class="hexline-body"><b>${POS_LABELS[i]}</b><p>${escapeHtml(DATA.LINE_COMMENT_EN[i + 1][bit])}</p></div>
      </div>`).join('\n');
  const column = traits.slice().reverse().map((bit) => `<div class="hexline-glyph small">${traitSVG(bit)}</div>`).join('\n');
  const trigramCard = (t, lbl) => `        <div class="trigram-card">
          <div class="sym">${t.symbol}</div>
          <div class="lbl">${lbl}</div>
          <b>${escapeHtml(t.name)}</b> — ${escapeHtml(t.nature)}, ${escapeHtml(t.image)}<br>
          <span class="role">${escapeHtml(t.role)}</span>
        </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
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
<meta property="og:locale" content="en_US">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/assets/hexagrammes/${chrono}.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": ${JSON.stringify(`Hexagram ${chrono} — ${nameEn}`)},
  "description": ${JSON.stringify(description)},
  "inLanguage": "en",
  "inDefinedTermSet": "${SITE}/en/lexicon/",
  "url": "${url}",
  "datePublished": "${DATE_PUBLISHED}",
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
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
    { "@type": "ListItem", "position": 2, "name": "The book", "item": "${SITE}/en/book/" },
    { "@type": "ListItem", "position": 3, "name": "Hexagrams", "item": "${A.url(null, 'en')}" },
    { "@type": "ListItem", "position": 4, "name": ${JSON.stringify(`Hexagram ${chrono} — ${nameEn}`)}, "item": "${url}" }
  ]
}
</script>
${STYLE}
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
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${SITE}/">Home</a><span class="sep">/</span><a href="${SITE}/en/book/">The book</a><span class="sep">/</span><a href="${A.url(null, 'en')}">Hexagrams</a><span class="sep">/</span><span aria-current="page">Hexagram ${chrono} — ${escapeHtml(nameEn)}</span>
      </nav>
      <!-- @langues:start --><!-- @langues:end -->

      <h1 class="article-title">Hexagram ${chrono} — ${escapeHtml(pinyin)}, ${escapeHtml(nameEn)}</h1>
      <p class="article-sub">Chronological no. <b>${chrono}</b> (binary-weight order) · King Wen no. (traditional) ${kw} · ${escapeHtml(hanzi)}</p>
      <p class="article-date">By <a href="${SITE}/a-propos.html">Anibal Edelberto Amiot</a> — Updated @@DATE_EN@@</p>
    </div>
    </div>

    <div class="article-content">
      <div class="hex-figure">
        <div class="hex-column">
${column}
        </div>
        <figure class="hex-square">
          <img src="${PREFIXE}assets/hexagrammes/${chrono}.png" alt="Magic square / tiling associated with hexagram ${chrono} (${escapeHtml(nameEn)})" width="480" height="480">
          <figcaption>Tiling of the magic square associated with this hexagram, La Livrée d'Hermès.</figcaption>
        </figure>
      </div>

      <div class="trigram-row">
${trigramCard(upper, 'Upper trigram')}
${trigramCard(lower, 'Lower trigram')}
      </div>

      <div class="keyword">Image</div>
      <div class="keyword-sub">${escapeHtml(nameEn)}</div>
      <p>${escapeHtml(imageText)}</p>

      <div class="keyword">Judgement</div>
      <div class="keyword-sub">${escapeHtml(judgementTitle)}</div>
      <p>${escapeHtml(judgementText)}</p>

      <h2>The six lines</h2>
      <div class="hexlines-list">
${lines}
      </div>

      <div class="cta-row">
        <a class="cta-btn" href="${SITE}/book-viewer/index.html?read=en&amp;page=063">Read the passage in the book (ch. 7.1) →</a>
        <a class="cta-btn" href="${SITE}/?chrono=${chrono}">See it on the interactive board →</a>
        <a class="cta-btn" href="${SITE}/creation-motifs-yi-king.html">Create this hexagram's pattern →</a>
      </div>

      <hr>
      <p class="article-sources"><b>Source</b>: <i>La Livrée d'Hermès</i>, Anibal Amiot — <a href="${SITE}/book-viewer/index.html?read=en&amp;page=063">chapter 7.1 (pp. 63–68)</a>. <a href="${A.url(chrono, 'fr')}">French version of this page</a>.</p>
      <p><i>For the notions used here — magic square, layer and casting, the Yi Jing — see the <a href="${SITE}/en/lexicon/">project lexicon</a>.</i></p>

      ${motifsHtml(chrono)}

      <h2>Neighbouring hexagrams</h2>
      <p>${hexLink(prev)} · ${hexLink(next)}</p>

      <h2>Hexagrams sharing a trigram</h2>
      <p>Same upper trigram (${upper.symbol} ${escapeHtml(upper.name)}): ${sameUpper.map(hexLink).join(' · ')}</p>
      <p>Same lower trigram (${lower.symbol} ${escapeHtml(lower.name)}): ${sameLower.map(hexLink).join(' · ')}</p>
    </div>

    <a class="article-back-bottom" href="${A.url(null, 'en')}">← All 64 hexagrams</a>
  </div>

</main>
<!-- @main:end -->
${htmlNavTiles(A.fichier(chrono, 'en'), PREFIXE, 'en')}
${PIED}
</div>
<script>document.getElementById('credit-year').textContent = new Date().getFullYear();</script>
<script src="${PREFIXE}assets/share-widget.js" data-label="Share this page"></script>
<script src="${PREFIXE}assets/soutien-gate.js"></script>
</body>
</html>
`;

  // Empreinte du seul texte éditorial : la date ne bouge que s'il change.
  const empreinte = crypto.createHash('sha256').update(JSON.stringify({
    chrono, kw, pinyin, nameEn, hanzi, judgementTitle, judgementText, imageText,
    traits: traits.map((bit, i) => DATA.LINE_COMMENT_EN[i + 1][bit]), lower, upper,
  })).digest('hex');
  const outPath = path.join(ROOT, A.fichier(chrono, 'en'));
  const ancien = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
  const empreinteAncienne = ancien && (ancien.match(/<!-- @contenu sha256:([0-9a-f]{64})/) || [])[1];
  const dateAncienne = ancien && (ancien.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/) || [])[1];
  const dateModified = dateAncienne && empreinteAncienne === empreinte ? dateAncienne : TODAY;

  let rendu = html.split('@@DATE_ISO@@').join(dateModified).split('@@DATE_EN@@').join(formatDateEn(dateModified))
    .replace('<head>', `<head>\n<!-- @contenu sha256:${empreinte} — empreinte du texte éditorial seul ; voir scripts/generate-hexagram-pages-en.js -->`);
  // build-header.js pose ensuite hreflang, rangée de langues et zones partagées :
  // reprendre ce qu'il a déjà posé évite de défaire son travail à chaque passage.
  if (ancien) {
    for (const zone of ['hreflang', 'langues']) {
      const re = new RegExp(`[ \\t]*<!-- @${zone}:start[\\s\\S]*?<!-- @${zone}:end -->`);
      const m = ancien.match(re);
      if (m) rendu = rendu.match(re) ? rendu.replace(re, m[0]) : rendu.replace('</head>', `${m[0]}\n</head>`);
    }
  }
  fs.writeFileSync(outPath, rendu, 'utf8');
}

// ---------- index en/hexagrams/ ----------
{
  const url = A.url(null, 'en');
  const title = "Hexagrams — La Livrée d'Hermès";
  const description = "The 64 hexagrams of the Yi Jing in the site's chronological order: judgement, image, trigrams and the magic square associated with each.";
  const items = info.map((i) => `    <a class="hex-grid-item" href="${A.url(i.chrono, 'en')}">${i.chrono} — ${escapeHtml(i.pinyin)}, ${escapeHtml(i.nameEn)}</a>`).join('\n');
  const styleIndex = stylePageFr(A.fichier(null, 'fr'));
  const outPath = path.join(ROOT, A.fichier(null, 'en'));
  const ancien = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE}/assets/hexagrammes/0.png">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": ${JSON.stringify(title)},
  "description": ${JSON.stringify(description)},
  "inLanguage": "en",
  "url": "${url}",
  "hasPart": [
${info.map((i) => `    { "@type": "DefinedTerm", "name": ${JSON.stringify(`Hexagram ${i.chrono} — ${i.nameEn}`)}, "url": "${A.url(i.chrono, 'en')}" }`).join(',\n')}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
    { "@type": "ListItem", "position": 2, "name": "The book", "item": "${SITE}/en/book/" },
    { "@type": "ListItem", "position": 3, "name": "Hexagrams", "item": "${url}" }
  ]
}
</script>
${styleIndex}
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
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${SITE}/">Home</a><span class="sep">/</span><a href="${SITE}/en/book/">The book</a><span class="sep">/</span><span aria-current="page">Hexagrams</span>
    </nav>
    <!-- @langues:start --><!-- @langues:end -->

    <h1 class="page-title">The 64 hexagrams</h1>
    <p class="page-sub">Each hexagram of the Yi Jing, in the chronological (binary-weight) order used on this site, with its judgement, image, trigrams and associated magic square.</p>
  </div>
  </div>

  <div class="hex-grid">
${items}
  </div>

</main>
<!-- @main:end -->
${htmlNavTiles(A.fichier(null, 'en'), PREFIXE, 'en')}
${PIED}
</div>
<script>document.getElementById('credit-year').textContent = new Date().getFullYear();</script>
<script src="${PREFIXE}assets/share-widget.js" data-label="Share this page"></script>
<script src="${PREFIXE}assets/soutien-gate.js"></script>
</body>
</html>
`;
  if (ancien) {
    for (const zone of ['hreflang', 'langues']) {
      const re = new RegExp(`[ \\t]*<!-- @${zone}:start[\\s\\S]*?<!-- @${zone}:end -->`);
      const m = ancien.match(re);
      if (m) html = html.match(re) ? html.replace(re, m[0]) : html.replace('</head>', `${m[0]}\n</head>`);
    }
  }
  fs.writeFileSync(outPath, html, 'utf8');
}

console.log(`Généré 64 pages + index dans ${A.DOSSIER.en}/`);
