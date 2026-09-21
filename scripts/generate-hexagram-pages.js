/* ============================================================
   Génère les 64 pages statiques /hexagrammes/<chrono>-<pinyin>-<nom>.html
   à partir des données extraites de index.html (extract-hexagram-data.js)
   et des PNG déjà générés dans assets/hexagrammes/ (generate-hexagram-assets.js).
   Usage : node generate-hexagram-pages.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DATA = require('./extract-hexagram-data.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'hexagrammes');
fs.mkdirSync(OUT_DIR, { recursive: true });

function traitsFromChrono(chrono){
  const r = Math.floor(chrono/8), c = chrono%8;
  return [c&1,(c>>1)&1,(c>>2)&1, r&1,(r>>1)&1,(r>>2)&1];
}
function trigramValue(bits3){ return bits3[0] + bits3[1]*2 + bits3[2]*4; }

function slugify(str){
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str){
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function traitSVG(bit){
  const W=160,H=18, midY=H/2;
  if(bit===1){
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY-3}" width="${W}" height="6" fill="var(--white)"/></svg>`;
  }
  const gap = 26, segW = (W-gap)/2;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY-3}" width="${segW}" height="6" fill="var(--red)"/><rect x="${segW+gap}" y="${midY-3}" width="${segW}" height="6" fill="var(--red)"/></svg>`;
}

const POS_LABELS = ["Premier trait","Deuxième trait","Troisième trait","Quatrième trait","Cinquième trait","Sixième trait"];

// correspondance article <-> jugement d'hexagramme déjà citée ailleurs sur le
// site (vérifiée manuellement) : verticalite-damier-mosaique-echiquier.html
// cite le jugement de l'hexagramme King-Wen 10 (履, Lǚ, « la Marche »).
const ARTICLE_LINKS_BY_KW = {
  10: { href: 'https://anibal-amiot.com/articles/verticalite-damier-mosaique-echiquier.html', label: "Cet hexagramme est cité dans l'article « Verticalité, damier, mosaïque et échiquier »" },
};

// Les 64 pages ont été créées le même jour (voir git log) ; dateModified suit
// le jour de régénération, pour rester cohérent avec le <lastmod> calculé
// par scripts/generate-sitemap.js (lui aussi basé sur la date du dernier
// commit qui touche chaque fichier).
const DATE_PUBLISHED = '2026-09-04';
const DATE_MODIFIED = new Date().toISOString().slice(0, 10);

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function formatDateFr(iso){
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
}
const BOOK_SOURCE_HTML = '<i>La Livrée d\'Hermès</i>, Anibal Amiot — <a href="https://anibal-amiot.com/book-viewer/index.html?read=fr&page=063">chapitre 7.1 « Trame » (p. 63 à 68)</a>';

// Lien de pied de page vers la page Soutien — occupe l'emplacement laissé
// vacant par l'ancien bouton "Devenir Partenaire" (palier pro retiré,
// voir espace-libre), après .footer-title-logo. Contrôle unique : l'ancien
// bouton modal #btnSoutienFooter a été retiré (doublon avec ce lien direct).
const SOUTIEN_TITLE = "Deviens Soutien de la Livrée d'Hermès — contribue à prix libre et débloque, de façon permanente, le téléchargement des fichiers SVG/PDF du livre.";
const SOUTIEN_LINK_HTML = `<a class="site-nav-btn" href="https://anibal-amiot.com/soutenir.html" style="display:inline-block; margin:14px 0;" title="${escapeHtml(SOUTIEN_TITLE)}">Devenir Soutien</a>`;
const FOOTER_CTA_SCRIPT = `<script src="https://anibal-amiot.com/assets/share-widget.js"></script>
<script src="https://anibal-amiot.com/assets/soutien-gate.js"></script>`;

const pages = [];

// Pré-calcul pour toutes les figures : nécessaire pour les liens croisés
// (précédent/suivant, trigrammes partagés) construits dans la boucle principale.
const allInfo = [];
for(let chrono = 0; chrono < 64; chrono++){
  const kwNum = DATA.KINGWEN_BY_CHRONO[chrono];
  const traits = traitsFromChrono(chrono);
  const [pinyin, nameFr] = DATA.HEX_KW[kwNum];
  const lowerVal = trigramValue(traits.slice(0,3));
  const upperVal = trigramValue(traits.slice(3,6));
  const slug = `${chrono}-${slugify(pinyin)}-${slugify(nameFr)}.html`;
  allInfo.push({ chrono, kwNum, pinyin, nameFr, lowerVal, upperVal, slug });
}

function hexLinkHtml(info){
  return `<a href="https://anibal-amiot.com/hexagrammes/${info.slug}">${info.chrono} — ${escapeHtml(info.pinyin)}, ${escapeHtml(info.nameFr)}</a>`;
}

for(let chrono = 0; chrono < 64; chrono++){
  const kwNum = DATA.KINGWEN_BY_CHRONO[chrono];
  const traits = traitsFromChrono(chrono);
  const [pinyin, nameFr, jugementTitle, jugementText] = DATA.HEX_KW[kwNum];
  const imageText = DATA.IMAGE_FR[kwNum];
  const hanzi = DATA.HANZI_BY_KW[kwNum];
  const lower = DATA.TRIGRAMS[trigramValue(traits.slice(0,3))];
  const upper = DATA.TRIGRAMS[trigramValue(traits.slice(3,6))];

  const slug = `${chrono}-${slugify(pinyin)}-${slugify(nameFr)}.html`;
  const url = `https://anibal-amiot.com/hexagrammes/${slug}`;

  const prevInfo = allInfo[(chrono - 1 + 64) % 64];
  const nextInfo = allInfo[(chrono + 1) % 64];
  const sameUpper = allInfo.filter(h => h.chrono !== chrono && h.upperVal === allInfo[chrono].upperVal);
  const sameLower = allInfo.filter(h => h.chrono !== chrono && h.lowerVal === allInfo[chrono].lowerVal);
  const title = `Hexagramme ${chrono} — ${pinyin}, ${nameFr}`;
  const description = `Hexagramme ${chrono} (${pinyin}, ${nameFr}, n° King Wen ${kwNum}) : jugement, trigrammes et carré magique de La Livrée d'Hermès.`;

  const linesHtml = traits.map((bit, i) => {
    const pos = i + 1;
    const text = DATA.LINE_COMMENT[pos][bit];
    return `      <div class="hexline">
        <div class="hexline-body"><b>${escapeHtml(POS_LABELS[i])}</b><p>${escapeHtml(text)}</p></div>
      </div>`;
  }).join('\n'); // affichage du premier trait (base) en haut vers le sixième (sommet) en bas — ordre de lecture, pas l'ordre de tirage traditionnel

  const hexColumn = traits.slice().reverse().map(bit => `<div class="hexline-glyph small">${traitSVG(bit)}</div>`).join('\n');

  const articleLink = ARTICLE_LINKS_BY_KW[kwNum];
  const sourcesHtml = `<p class="article-sources"><b>Sources</b> : ${BOOK_SOURCE_HTML}${articleLink ? `. <a href="${articleLink.href}">${escapeHtml(articleLink.label)}</a>` : ''}.</p>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="https://anibal-amiot.com/assets/hexagrammes/${chrono}.png">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<link rel="canonical" href="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="https://anibal-amiot.com/assets/hexagrammes/${chrono}.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "Hexagramme ${chrono} — ${escapeHtml(nameFr)}",
  "description": ${JSON.stringify(description)},
  "inDefinedTermSet": "https://anibal-amiot.com/lexique.html",
  "url": "${url}",
  "datePublished": "${DATE_PUBLISHED}",
  "dateModified": "${DATE_MODIFIED}",
  "author": {
    "@type": "Person",
    "name": "Anibal Edelberto Amiot",
    "url": "https://anibal-amiot.com/a-propos.html"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://anibal-amiot.com/" },
    { "@type": "ListItem", "position": 2, "name": "Le traité", "item": "https://anibal-amiot.com/la-livree-d-hermes.html" },
    { "@type": "ListItem", "position": 3, "name": "Hexagrammes", "item": "https://anibal-amiot.com/hexagrammes/" },
    { "@type": "ListItem", "position": 4, "name": ${JSON.stringify(`Hexagramme ${chrono} — ${nameFr}`)}, "item": "${url}" }
  ]
}
</script>
<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{
    margin:0; background:var(--bg); color:var(--white);
    min-height:100vh;
    overflow-x:hidden;
  }
  img, canvas, svg{ max-width:100%; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  header{ text-align:center; margin-bottom:28px; border-bottom:1px solid var(--line); padding-bottom:20px; }
  header h1{ font-weight:400; font-size:calc(28px + var(--fs-bump)); letter-spacing:.05em; margin:8px 0 4px; }
  .gtranslate-slot{ display:flex; justify-content:center; margin:10px 0 0; opacity:.75; }
  .gtranslate-slot:hover{ opacity:1; }
  .gtranslate-slot .goog-te-gadget{ font-family:Helvetica,Arial,sans-serif !important; font-size:0 !important; color:transparent !important; }
  .gtranslate-slot .goog-te-gadget-simple{
    background:transparent !important; border:1px solid var(--line) !important; border-radius:0 !important;
    padding:4px 10px !important; display:inline-flex !important; align-items:center !important;
  }
  .gtranslate-slot .goog-te-gadget-simple .goog-te-menu-value span{
    color:var(--dim) !important; font-size:calc(10px + var(--fs-bump)) !important; letter-spacing:.08em !important; text-transform:uppercase !important;
  }
  .gtranslate-slot img{ vertical-align:middle !important; }

  .breadcrumb{ max-width:64ch; margin:0 auto 20px; text-align:center; font-size:calc(11px + var(--fs-bump)); letter-spacing:.03em; color:var(--dim); }
  .breadcrumb a{ color:var(--dim); text-decoration:none; }
  .breadcrumb a:hover{ color:var(--gold); }
  .breadcrumb .sep{ margin:0 6px; opacity:.5; }
  .breadcrumb [aria-current]{ color:var(--gold); }

  .article-body{ padding:24px 0 8px; }
  .article-back{ display:block; max-width:64ch; margin:0 auto 24px; color:var(--dim); font-size:calc(11.5px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; text-decoration:none; }
  .article-back:hover{ color:var(--gold); }
  .article-title{ max-width:64ch; margin:0 auto 4px; font-size:calc(26px + var(--fs-bump)); font-weight:400; line-height:1.35; text-align:center; }
  .article-sub{ max-width:64ch; margin:0 auto 12px; color:var(--dim); font-size:calc(12.5px + var(--fs-bump)); text-align:center; }
  .article-sub b{ color:var(--gold); font-weight:400; }
  .article-date{ max-width:64ch; margin:0 auto 26px; color:var(--dim); font-size:calc(11.5px + var(--fs-bump)); font-style:italic; text-align:center; }
  .article-date a{ color:var(--dim); }
  .article-date a:hover{ color:var(--gold); }
  .article-sources{ font-size:calc(12.5px + var(--fs-bump)); opacity:.85; }
  .article-content{ max-width:68ch; margin:0 auto; text-align:center; color:var(--dim); font-size:calc(15px + var(--fs-bump)); line-height:1.8; }
  .article-content h2{ color:var(--gold); font-size:calc(15px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:34px 0 14px; text-align:center; }
  .article-content p{ margin:0 0 18px; }
  .article-content a{ color:var(--gold); text-decoration:none; }
  .article-content a:hover{ text-decoration:underline; }
  .article-content hr{ border:none; border-top:1px solid var(--line); margin:30px 0; }

  .hex-figure{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:32px; margin:0 0 28px; }
  .hex-figure .hex-column{ grid-column:1; justify-self:end; }
  .hex-figure .hex-square{ grid-column:2; }
  @media (max-width:600px){ .hex-figure{ grid-template-columns:1fr; justify-items:center; } .hex-figure .hex-column{ grid-column:1; justify-self:center; } .hex-figure .hex-square{ grid-column:1; } }
  .hex-column{ display:flex; flex-direction:column; gap:8px; width:170px; }
  .hex-column .hexline-glyph{ flex:0 0 auto; padding-top:0; }
  .hex-column .hexline-glyph.small svg{ display:block; width:100%; height:16px; }
  .hex-square img{ width:220px; height:220px; border:1px solid var(--line); display:block; }
  .hex-square figcaption{ font-size:calc(11px + var(--fs-bump)); color:var(--dim); margin-top:8px; font-style:italic; }

  .trigram-row{ display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin:0 0 28px; }
  .trigram-card{ border:1px solid var(--line); padding:16px 20px; max-width:260px; text-align:left; }
  .trigram-card .sym{ font-size:calc(34px + var(--fs-bump)); color:var(--gold); line-height:1; margin-bottom:8px; }
  .trigram-card .lbl{ font-size:calc(10.5px + var(--fs-bump)); letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:4px; }
  .trigram-card b{ color:var(--white); font-weight:400; }
  .trigram-card .role{ color:var(--dim); font-size:calc(12.5px + var(--fs-bump)); font-style:italic; }

  .keyword{ font-size:calc(11px + var(--fs-bump)); letter-spacing:.14em; text-transform:uppercase; color:var(--gold); margin:0 0 6px; }
  .keyword-sub{ font-size:calc(16px + var(--fs-bump)); margin:0 0 12px; }

  .hexlines-list{ text-align:left; max-width:64ch; margin:0 auto 10px; }
  .hexline{ display:flex; align-items:flex-start; gap:16px; padding:12px 0; border-bottom:1px solid var(--line); }
  .hexline:last-child{ border-bottom:none; }
  .hexline-glyph{ flex:0 0 90px; padding-top:4px; }
  .hexline-glyph svg{ display:block; width:90px; height:14px; }
  .hexline-body b{ display:block; color:var(--gold); font-size:calc(11.5px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
  .hexline-body p{ margin:0; font-size:calc(14px + var(--fs-bump)); line-height:1.65; }

  .cta-row{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin:32px 0 8px; }
  .cta-btn{ border:1px solid var(--line); color:var(--dim); font-size:calc(11px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; padding:10px 18px; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .cta-btn:hover{ border-color:var(--gold); color:var(--gold); }

  .article-back-bottom{ display:block; max-width:64ch; margin:40px auto 0; color:var(--dim); font-size:calc(11.5px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; text-decoration:none; }
  .article-back-bottom:hover{ color:var(--gold); }

  .note{ margin-top:60px; padding-top:24px; border-top:1px solid var(--line); text-align:center; }
  .credit-line{ display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; font-size:calc(10px + var(--fs-bump)); color:var(--dim); margin-top:10px; }
  .credit-line .credit-sep{ opacity:.5; }
  .site-nav-row{ display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:6px; }
  .site-nav-btn{ border:1px solid var(--line); background:transparent; color:var(--dim); font-size:calc(10.5px + var(--fs-bump)); letter-spacing:.08em; text-transform:uppercase; padding:9px 16px; cursor:pointer; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .site-nav-btn:hover{ border-color:var(--gold); color:var(--gold); }
  .footer-title-logo{ display:flex; justify-content:center; margin:22px 0 4px; }
  .footer-title-logo img{ width:220px; max-width:70%; height:auto; opacity:.85; }

  @media (max-width:768px){ .wrap{ padding:20px 16px 48px; } header h1{ font-size:calc(22px + var(--fs-bump)); } .gtranslate-slot, .gtranslate-slot *{ max-width:100%; } }
  @media (max-width:480px){ .article-title{ font-size:calc(21px + var(--fs-bump)); } .article-content{ font-size:calc(14.5px + var(--fs-bump)); } .hex-square img{ width:170px; height:170px; } }
</style>
<link rel="stylesheet" href="../style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="../assets/atalanta-bg.css">
</head>
<body>
<div class="wrap">
  <header>
    <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès" style="width:280px;max-width:80%;height:auto;display:block;margin:0 auto 10px;">
    <div id="google_translate_element" class="gtranslate-slot"></div>
  </header>

  <div class="article-body">
    <div class="atalanta-zone" style="--atalanta-plate:url(https://anibal-amiot.com/assets/atalanta/plate-4-hexagrammes.avif);">
    <div class="atalanta-block" style="padding:28px 24px;">
      <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
      <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
      <nav class="breadcrumb" aria-label="Fil d'Ariane">
        <a href="https://anibal-amiot.com/">Accueil</a><span class="sep">/</span><a href="https://anibal-amiot.com/la-livree-d-hermes.html">Le traité</a><span class="sep">/</span><a href="https://anibal-amiot.com/hexagrammes/">Hexagrammes</a><span class="sep">/</span><span aria-current="page">Hexagramme ${chrono} — ${escapeHtml(nameFr)}</span>
      </nav>

      <a class="article-back" href="https://anibal-amiot.com/?chrono=${chrono}">← Voir cet hexagramme sur l'échiquier</a>

      <h1 class="article-title">Hexagramme ${chrono} — ${escapeHtml(pinyin)}, ${escapeHtml(nameFr)}</h1>
      <p class="article-sub">N° chronologique <b>${chrono}</b> (ordre par poids binaires) · n° King Wen (traditionnel) ${kwNum} · ${escapeHtml(hanzi || '')}</p>
      <p class="article-date">Par <a href="https://anibal-amiot.com/a-propos.html">Anibal Edelberto Amiot</a> — Mis à jour le ${formatDateFr(DATE_MODIFIED)}</p>
    </div>
    </div>

    <div class="article-content">
      <div class="hex-figure">
        <div class="hex-column">
${hexColumn}
        </div>
        <figure class="hex-square">
          <img src="https://anibal-amiot.com/assets/hexagrammes/${chrono}.png" alt="Carré magique / pavage associé à l'hexagramme ${chrono} (${escapeHtml(nameFr)})">
          <figcaption>Pavage du carré magique associé à cet hexagramme, La Livrée d'Hermès.</figcaption>
        </figure>
      </div>

      <div class="trigram-row">
        <div class="trigram-card">
          <div class="sym">${upper.symbol}</div>
          <div class="lbl">Trigramme supérieur</div>
          <b>${escapeHtml(upper.name)}</b> — ${escapeHtml(upper.nature)}, ${escapeHtml(upper.image)}<br>
          <span class="role">${escapeHtml(upper.role)}</span>
        </div>
        <div class="trigram-card">
          <div class="sym">${lower.symbol}</div>
          <div class="lbl">Trigramme inférieur</div>
          <b>${escapeHtml(lower.name)}</b> — ${escapeHtml(lower.nature)}, ${escapeHtml(lower.image)}<br>
          <span class="role">${escapeHtml(lower.role)}</span>
        </div>
      </div>

      <div class="keyword">Image</div>
      <div class="keyword-sub">${escapeHtml(nameFr)}</div>
      <p>${escapeHtml(imageText)}</p>

      <div class="keyword">Jugement</div>
      <div class="keyword-sub">${escapeHtml(jugementTitle)}</div>
      <p>${escapeHtml(jugementText)}</p>

      <h2>Les six traits</h2>
      <div class="hexlines-list">
${linesHtml}
      </div>

      <div class="cta-row">
        <a class="cta-btn" href="https://anibal-amiot.com/book-viewer/index.html?read=fr&page=063">Lire le passage du livre (chap. 7.1) →</a>
        <a class="cta-btn" href="https://anibal-amiot.com/?chrono=${chrono}">Voir sur l'échiquier interactif →</a>
        <a class="cta-btn" href="https://anibal-amiot.com/creation-motifs-yi-king.html">Créer le motif de cet hexagramme →</a>
      </div>

      <hr>
      ${sourcesHtml}
      <p><i>Pour comprendre les notions évoquées ici — carré magique, calque et tirage, Yi-King — consulte le <a href="https://anibal-amiot.com/lexique.html">lexique du projet</a>.</i></p>

      <h2>Hexagrammes voisins</h2>
      <p>${hexLinkHtml(prevInfo)} · ${hexLinkHtml(nextInfo)}</p>

      <h2>Hexagrammes liés par un trigramme commun</h2>
      <p>Trigramme supérieur commun (${upper.symbol} ${escapeHtml(upper.name)}) : ${sameUpper.map(hexLinkHtml).join(' · ')}</p>
      <p>Trigramme inférieur commun (${lower.symbol} ${escapeHtml(lower.name)}) : ${sameLower.map(hexLinkHtml).join(' · ')}</p>
    </div>

    <a class="article-back-bottom" href="https://anibal-amiot.com/?chrono=${chrono}">← Voir cet hexagramme sur l'échiquier</a>
  </div>

  <div class="note">
    <div class="site-nav-row">
      <a class="site-nav-btn" href="https://anibal-amiot.com/index.html">Accueil</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/">Tirage</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/cymatique.html">Cymatique</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/lexique.html">Lexique</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/articles.html">Articles</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/hexagrammes/">Hexagrammes</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/fr/livre/">Le livre</a>
    </div>
    <div class="credit-line">
      <span>© <span id="credit-year">2026</span> Anibal Edelberto Amiot — Tous droits réservés</span>
      <span class="credit-sep">·</span>
      <span>Créé en collaboration avec Claude</span>
    </div>
    <div class="footer-title-logo">
      <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès">
    </div>
    ${SOUTIEN_LINK_HTML}
  </div>
</div>
<script type="text/javascript">
  function googleTranslateElementInit(){
    new google.translate.TranslateElement({pageLanguage: 'fr', autoDisplay: false}, 'google_translate_element');
  }
</script>
<script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
${FOOTER_CTA_SCRIPT}
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT_DIR, slug), html, 'utf8');
  pages.push({ chrono, kwNum, slug, url });
}

fs.writeFileSync(path.join(__dirname, 'hexagram-pages-manifest.json'), JSON.stringify(pages, null, 2));

// ============================================================
// Page de listing /hexagrammes/ — cible du fil d'Ariane "Hexagrammes" de
// chaque page hexagramme, et point d'entrée pour parcourir les 64 figures.
// ============================================================
const listingUrl = 'https://anibal-amiot.com/hexagrammes/';
const listingTitle = 'Hexagrammes — La Livrée d\'Hermès';
const listingDescription = 'Les 64 hexagrammes du Yi-King dans l\'ordre chronologique du site : jugement, trigrammes et carré magique associés à chacun.';

const gridItems = allInfo.map(info =>
  `        <a class="hex-grid-item" href="https://anibal-amiot.com/hexagrammes/${info.slug}">${info.chrono} — ${escapeHtml(info.pinyin)}, ${escapeHtml(info.nameFr)}</a>`
).join('\n');

const listingHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(listingTitle)}</title>
<meta name="description" content="${escapeHtml(listingDescription)}">
<meta property="og:title" content="${escapeHtml(listingTitle)}">
<meta property="og:description" content="${escapeHtml(listingDescription)}">
<meta property="og:image" content="https://anibal-amiot.com/assets/hexagrammes/0.png">
<meta property="og:url" content="${listingUrl}">
<meta property="og:type" content="website">
<link rel="canonical" href="${listingUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(listingTitle)}">
<meta name="twitter:description" content="${escapeHtml(listingDescription)}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": ${JSON.stringify(listingTitle)},
  "description": ${JSON.stringify(listingDescription)},
  "url": "${listingUrl}",
  "hasPart": [
${allInfo.map(info => `    { "@type": "DefinedTerm", "name": "Hexagramme ${info.chrono} — ${escapeHtml(info.nameFr)}", "url": "https://anibal-amiot.com/hexagrammes/${info.slug}" }`).join(',\n')}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://anibal-amiot.com/" },
    { "@type": "ListItem", "position": 2, "name": "Le traité", "item": "https://anibal-amiot.com/la-livree-d-hermes.html" },
    { "@type": "ListItem", "position": 3, "name": "Hexagrammes", "item": "${listingUrl}" }
  ]
}
</script>
<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  img{ max-width:100%; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  header{ text-align:center; margin-bottom:28px; border-bottom:1px solid var(--line); padding-bottom:20px; }
  .gtranslate-slot{ display:flex; justify-content:center; margin:10px 0 0; opacity:.75; }
  .gtranslate-slot:hover{ opacity:1; }
  .gtranslate-slot .goog-te-gadget{ font-family:Helvetica,Arial,sans-serif !important; font-size:0 !important; color:transparent !important; }
  .gtranslate-slot .goog-te-gadget-simple{
    background:transparent !important; border:1px solid var(--line) !important; border-radius:0 !important;
    padding:4px 10px !important; display:inline-flex !important; align-items:center !important;
  }
  .gtranslate-slot .goog-te-gadget-simple .goog-te-menu-value span{
    color:var(--dim) !important; font-size:calc(10px + var(--fs-bump)) !important; letter-spacing:.08em !important; text-transform:uppercase !important;
  }
  .gtranslate-slot img{ vertical-align:middle !important; }

  .breadcrumb{ max-width:64ch; margin:0 auto 20px; text-align:center; font-size:calc(11px + var(--fs-bump)); letter-spacing:.03em; color:var(--dim); }
  .breadcrumb a{ color:var(--dim); text-decoration:none; }
  .breadcrumb a:hover{ color:var(--gold); }
  .breadcrumb .sep{ margin:0 6px; opacity:.5; }
  .breadcrumb [aria-current]{ color:var(--gold); }

  .page-title{ max-width:64ch; margin:0 auto 8px; font-size:calc(26px + var(--fs-bump)); font-weight:400; line-height:1.35; text-align:center; }
  .page-sub{ max-width:64ch; margin:0 auto 30px; color:var(--dim); font-size:calc(14px + var(--fs-bump)); line-height:1.7; text-align:center; }

  .hex-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; margin:0 0 20px; }
  .hex-grid-item{
    border:1px solid var(--line); color:var(--dim); font-size:calc(12.5px + var(--fs-bump)); letter-spacing:.02em;
    padding:12px 14px; text-decoration:none; transition:border-color .12s ease, color .12s ease;
  }
  .hex-grid-item:hover{ border-color:var(--gold); color:var(--gold); }

  .note{
    margin-top:60px; padding-top:24px; border-top:1px solid var(--line); text-align:center;
    display:flex; flex-direction:column; align-items:center;
  }
  .credit-line{
    display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap;
    font-size:calc(10px + var(--fs-bump)); color:var(--dim); margin-top:10px;
  }
  .credit-line .credit-sep{ opacity:.5; }
  .site-nav-row{
    display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap;
    margin-top:6px; }
  .site-nav-btn{
    border:1px solid var(--line); background:transparent; color:var(--dim);
    font-size:calc(10.5px + var(--fs-bump)); letter-spacing:.08em; text-transform:uppercase; padding:9px 16px;
    cursor:pointer; text-decoration:none; transition:border-color .12s ease, color .12s ease;
  }
  .site-nav-btn:not(.disabled):hover{ border-color:var(--gold); color:var(--gold); }
  .site-nav-btn.disabled{ opacity:.35; cursor:default; }
  .nav-tiles{
    display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;
    max-width:840px; margin:18px auto 0;
  }
  .nav-tiles > .nav-tile:last-child:nth-child(odd){
    grid-column:1 / -1; max-width:calc(50% - 6px); justify-self:center;
  }
  .nav-tile{
    display:flex; flex-direction:row; align-items:center; gap:10px;
    padding:6px 10px; border:1px solid var(--line); text-decoration:none; color:var(--dim);
    transition:border-color .12s ease, color .12s ease;
  }
  .nav-tile:hover{ border-color:var(--gold); }
  .nav-tile-icon{
    width:72px; height:72px; flex-shrink:0; display:block;
    background-repeat:repeat; background-size:36px 36px;
    background-image:var(--rest-icon);
    image-rendering:pixelated;
  }
  .nav-tile:hover .nav-tile-icon{ background-image:var(--hover-icon); }
  @media (prefers-reduced-motion: reduce){
    .nav-tile:hover .nav-tile-icon{ background-image:var(--rest-icon); }
  }
  .nav-tile-body{ display:flex; flex-direction:column; justify-content:center; min-width:0; }
  .nav-tile-label{ font-size:calc(13px + var(--fs-bump)); letter-spacing:.04em; text-transform:uppercase; line-height:1.3; margin:0 0 3px; color:var(--white); }
  .nav-tile:hover .nav-tile-label{ color:var(--gold); }
  .nav-tile-excerpt{
    font-size:calc(11.5px + var(--fs-bump)); line-height:1.4; color:var(--dim); margin:0; min-height:calc((11.5px + var(--fs-bump)) * 2.8);
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .note > .center-logo-slot{ order:1; }
  .note > .nav-tiles{ order:2; }
  .note > .footer-caduceus{ order:3; }
  .note > .site-nav-btn{ order:4; }
  .note > .nav-tiles.nav-tiles-group-2{ order:5; }
  .note > .center-logo-slot.center-logo-slot-bottom{ order:6; }
  .note > .share-buttons{ order:7; }
  .note > .credit-line{ order:8; }
  .note > .footer-title-logo{ order:9; }
  .center-logo-slot{ display:flex; justify-content:center; margin:26px 0; }
  .center-logo-slot img{ width:60px; height:60px; opacity:.9; }
  .footer-title-logo{ display:flex; justify-content:center; margin:22px 0 4px; }
  .footer-title-logo img{ width:220px; max-width:70%; height:auto; opacity:.85; }
  .footer-caduceus{ display:flex; justify-content:center; margin:24px 0; }
  .footer-caduceus img{ height:clamp(240px, 21vw + 78px, 355.56px); width:auto; opacity:.9; }
  @media (max-width:768px){ .footer-caduceus img{ height:170px; } }

  @media (max-width:768px){ .wrap{ padding:20px 16px 48px; } .gtranslate-slot, .gtranslate-slot *{ max-width:100%; } }
</style>
<link rel="stylesheet" href="../style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="../assets/atalanta-bg.css">
</head>
<body>
<div class="wrap">
  <header>
    <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès" style="width:280px;max-width:80%;height:auto;display:block;margin:0 auto 10px;">
    <div id="google_translate_element" class="gtranslate-slot"></div>
  </header>

  <div class="atalanta-zone" style="--atalanta-plate:url(https://anibal-amiot.com/assets/atalanta/plate-4-hexagrammes.avif);">
  <div class="atalanta-block" style="padding:28px 24px;">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="https://anibal-amiot.com/">Accueil</a><span class="sep">/</span><a href="https://anibal-amiot.com/la-livree-d-hermes.html">Le traité</a><span class="sep">/</span><span aria-current="page">Hexagrammes</span>
    </nav>

    <h1 class="page-title">Les 64 hexagrammes</h1>
    <p class="page-sub">Chaque hexagramme du Yi-King, dans l'ordre chronologique (poids binaires) utilisé sur ce site, avec son jugement, ses trigrammes et le carré magique associé.</p>
  </div>
  </div>

  <div class="hex-grid">
${gridItems}
  </div>

  <div class="note">
    <div class="center-logo-slot">
      <img src="../assets/logo-static.gif" alt="La Livrée d'Hermès">
    </div>
    <div class="footer-caduceus">
      <img src="../assets/logo-caducee.gif" alt="La Livrée d'Hermès">
    </div>

    <div class="nav-tiles nav-tiles-group-2">
      <a class="nav-tile" href="https://anibal-amiot.com/index.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/accueil.png); --hover-icon:url(../assets/nav-icons/accueil-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Accueil</span><span class="nav-tile-excerpt">Le livre, ses planches et l'ensemble des outils.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/tirage.png); --hover-icon:url(../assets/nav-icons/tirage-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Tirage</span><span class="nav-tile-excerpt">Tirez un hexagramme au hasard et découvrez son carré.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/unified-patterns.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/unified-patterns.png); --hover-icon:url(../assets/nav-icons/unified-patterns-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Unified Patterns</span><span class="nav-tile-excerpt">Les 64 motifs des hexagrammes, personnalisables et téléchargeables en haute résolution.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/galerie-patterns-unifies.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/galerie.png); --hover-icon:url(../assets/nav-icons/galerie-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Galerie</span><span class="nav-tile-excerpt">Patterns unifiés, engendrés par mélange de teintes — sélectionnez un motif pour voir son pavage.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/telechargements.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/motifs-svg.png); --hover-icon:url(../assets/nav-icons/motifs-svg-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Motifs SVG</span><span class="nav-tile-excerpt">Téléchargez les calques d'impression en 4 catégories de combinaisons de traits, au format SVG.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/contact.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/contact.png); --hover-icon:url(../assets/nav-icons/contact-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Contact</span><span class="nav-tile-excerpt">Contactez l'auteur pour un projet ou une commande de motifs et tirages textiles.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/a-propos.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/a-propos.png); --hover-icon:url(../assets/nav-icons/a-propos-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">À propos</span><span class="nav-tile-excerpt">L'auteur et son livre, au croisement de la philosophie, des mathématiques et des sciences appliquées.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/lexique.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/lexique.png); --hover-icon:url(../assets/nav-icons/lexique-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Lexique</span><span class="nav-tile-excerpt">Dix notions clés pour comprendre La Livrée d'Hermès.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/articles.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/articles.png); --hover-icon:url(../assets/nav-icons/articles-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Articles</span><span class="nav-tile-excerpt">Réflexions et recherches autour de La Livrée d'Hermès.</span></span></a>
    </div>

    <div class="nav-tiles">
      <a class="nav-tile" href="https://anibal-amiot.com/fonds-ecran.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/fond-ecran.png); --hover-icon:url(../assets/nav-icons/fond-ecran-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Fond d'écran</span><span class="nav-tile-excerpt">Fonds d'écran textiles plein écran, réactifs au son ou en mode méditatif à rythme réglable.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/creation-motifs-yi-king.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/creation-motifs.png); --hover-icon:url(../assets/nav-icons/creation-motifs-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Créer un motif</span><span class="nav-tile-excerpt">Composez vos propres motifs textiles à partir des 60 natures du Yi King.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/bicolore.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/bicolore.png); --hover-icon:url(../assets/nav-icons/bicolore-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Motifs bicolores</span><span class="nav-tile-excerpt">Composez une cellule 12×12, six niveaux, chacun sa famille et sa teinte.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/encodeur.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/encodeur.png); --hover-icon:url(../assets/nav-icons/encodeur-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Encodeur</span><span class="nav-tile-excerpt">Encodage stéganographique géométrique par double référent, croix ansée et Jacquard.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/impression.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/impression.png); --hover-icon:url(../assets/nav-icons/impression-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Impression</span><span class="nav-tile-excerpt">Tirez et téléchargez les calques d'impression, prêts à imprimer.</span></span></a>
      <a class="nav-tile" href="https://anibal-amiot.com/cymatique.html"><span class="nav-tile-icon" style="--rest-icon:url(../assets/nav-icons/cymatique.png); --hover-icon:url(../assets/nav-icons/cymatique-hover.gif)"></span><span class="nav-tile-body"><span class="nav-tile-label">Cymatique</span><span class="nav-tile-excerpt">Le pavage dont la fréquence spatiale se rapproche le plus du son que vous émettez.</span></span></a>
    </div>

    ${SOUTIEN_LINK_HTML}

    <div class="center-logo-slot center-logo-slot-bottom">
      <img src="../assets/logo-static.gif" alt="La Livrée d'Hermès">
    </div>

    <div class="credit-line">
      <span>© <span id="credit-year">2026</span> Anibal Edelberto Amiot — Tous droits réservés</span>
      <span class="credit-sep">·</span>
      <span>Créé en collaboration avec Claude</span>
    </div>

    <div class="footer-title-logo">
      <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès">
    </div>
  </div>
</div>
<script type="text/javascript">
  function googleTranslateElementInit(){
    new google.translate.TranslateElement({pageLanguage: 'fr', autoDisplay: false}, 'google_translate_element');
  }
</script>
<script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
${FOOTER_CTA_SCRIPT}
</body>
</html>
`;

const listingDir = path.join(OUT_DIR);
fs.writeFileSync(path.join(listingDir, 'index.html'), listingHtml, 'utf8');

console.log('Généré', pages.length, 'pages dans', OUT_DIR, '+ la page de listing hexagrammes/index.html');

// Garde-fou : refuse de laisser passer une régression gk2.net dans le
// résultat écrit ci-dessus — voir scripts/check-no-gk2net.js, cette mention
// a déjà manqué revenir deux fois par ce générateur (corrigé le 2026-09-17).
try {
  execSync('node scripts/check-no-gk2net.js', { cwd: REPO_ROOT, stdio: 'inherit' });
} catch (e) {
  console.error('\n✗ gk2.net détecté dans le résultat généré ci-dessus (voir le détail plus haut) — corrige le gabarit avant de committer.');
  process.exit(1);
}
