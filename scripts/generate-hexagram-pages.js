/* ============================================================
   Génère les 64 pages statiques /hexagrammes/<chrono>-<pinyin>-<nom>.html
   à partir des données extraites de index.html (extract-hexagram-data.js)
   et des PNG déjà générés dans assets/hexagrammes/ (generate-hexagram-assets.js).
   Usage : node generate-hexagram-pages.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
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
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY-3}" width="${W}" height="6" fill="var(--red)"/></svg>`;
  }
  const gap = 26, segW = (W-gap)/2;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${midY-3}" width="${segW}" height="6" fill="var(--white)"/><rect x="${segW+gap}" y="${midY-3}" width="${segW}" height="6" fill="var(--white)"/></svg>`;
}

const POS_LABELS = ["Terre (base)","Terre (achèvement)","Homme (base)","Homme (achèvement)","Ciel (base)","Ciel (achèvement)"];

// correspondance article <-> jugement d'hexagramme déjà citée ailleurs sur le
// site (vérifiée manuellement) : verticalite-damier-mosaique-echiquier.html
// cite le jugement de l'hexagramme King-Wen 10 (履, Lǚ, « la Marche »).
const ARTICLE_LINKS_BY_KW = {
  10: { href: 'https://anibal-amiot.com/articles/verticalite-damier-mosaique-echiquier.html', label: "Cet hexagramme est cité dans l'article « Verticalité, damier, mosaïque et échiquier »" },
};

const pages = [];

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
  const title = `Hexagramme ${chrono} — ${pinyin}, ${nameFr}`;
  const description = `Hexagramme ${chrono} (${pinyin}, ${nameFr}, n° King Wen ${kwNum}) : jugement, trigrammes et carré magique de La Livrée d'Hermès.`;

  const linesHtml = traits.map((bit, i) => {
    const pos = i + 1;
    const text = DATA.LINE_COMMENT[pos][bit];
    return `      <div class="hexline">
        <div class="hexline-glyph">${traitSVG(bit)}</div>
        <div class="hexline-body"><b>${escapeHtml(POS_LABELS[i])}</b><p>${escapeHtml(text)}</p></div>
      </div>`;
  }).reverse().join('\n'); // affichage du haut (trait 6) vers le bas (trait 1), comme sur le site

  const hexColumn = traits.slice().reverse().map(bit => `<div class="hexline-glyph small">${traitSVG(bit)}</div>`).join('\n');

  const articleLink = ARTICLE_LINKS_BY_KW[kwNum];
  const articleLinkHtml = articleLink
    ? `<p><a href="${articleLink.href}">${escapeHtml(articleLink.label)}</a>.</p>`
    : '';

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
  "url": "${url}"
}
</script>
<style>
  :root{
    --bg:#000; --panel:#0a0a0a; --white:#f2f2f0; --dim:#f2f2f0;
    --red:#e0261b; --gold:#c9a15a; --line:#242424;
  }
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
  header h1{ font-weight:400; font-size:28px; letter-spacing:.05em; margin:8px 0 4px; }

  .article-body{ padding:24px 0 8px; }
  .article-back{ display:block; max-width:64ch; margin:0 auto 24px; color:var(--dim); font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; text-decoration:none; }
  .article-back:hover{ color:var(--gold); }
  .article-title{ max-width:64ch; margin:0 auto 4px; font-size:26px; font-weight:400; line-height:1.35; text-align:center; }
  .article-sub{ max-width:64ch; margin:0 auto 26px; color:var(--dim); font-size:12.5px; text-align:center; }
  .article-sub b{ color:var(--gold); font-weight:400; }
  .article-content{ max-width:68ch; margin:0 auto; text-align:center; color:var(--dim); font-size:15px; line-height:1.8; }
  .article-content h2{ color:var(--gold); font-size:15px; font-weight:400; letter-spacing:.02em; margin:34px 0 14px; text-align:center; }
  .article-content p{ margin:0 0 18px; }
  .article-content a{ color:var(--gold); text-decoration:none; }
  .article-content a:hover{ text-decoration:underline; }
  .article-content hr{ border:none; border-top:1px solid var(--line); margin:30px 0; }

  .hex-figure{ display:flex; justify-content:center; align-items:center; gap:32px; flex-wrap:wrap; margin:0 0 28px; }
  .hex-column{ display:flex; flex-direction:column; gap:8px; width:170px; }
  .hex-column .hexline-glyph{ flex:0 0 auto; padding-top:0; }
  .hex-column .hexline-glyph.small svg{ display:block; width:100%; height:16px; }
  .hex-square img{ width:220px; height:220px; border:1px solid var(--line); display:block; }
  .hex-square figcaption{ font-size:11px; color:var(--dim); margin-top:8px; font-style:italic; }

  .trigram-row{ display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin:0 0 28px; }
  .trigram-card{ border:1px solid var(--line); padding:16px 20px; max-width:260px; text-align:left; }
  .trigram-card .sym{ font-size:34px; color:var(--gold); line-height:1; margin-bottom:8px; }
  .trigram-card .lbl{ font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:4px; }
  .trigram-card b{ color:var(--white); font-weight:400; }
  .trigram-card .role{ color:var(--dim); font-size:12.5px; font-style:italic; }

  .keyword{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); margin:0 0 6px; }
  .keyword-sub{ font-size:16px; margin:0 0 12px; }

  .hexlines-list{ text-align:left; max-width:64ch; margin:0 auto 10px; }
  .hexline{ display:flex; align-items:flex-start; gap:16px; padding:12px 0; border-bottom:1px solid var(--line); }
  .hexline:last-child{ border-bottom:none; }
  .hexline-glyph{ flex:0 0 90px; padding-top:4px; }
  .hexline-glyph svg{ display:block; width:90px; height:14px; }
  .hexline-body b{ display:block; color:var(--gold); font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
  .hexline-body p{ margin:0; font-size:14px; line-height:1.65; }

  .cta-row{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin:32px 0 8px; }
  .cta-btn{ border:1px solid var(--line); color:var(--dim); font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:10px 18px; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .cta-btn:hover{ border-color:var(--gold); color:var(--gold); }

  .article-back-bottom{ display:block; max-width:64ch; margin:40px auto 0; color:var(--dim); font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; text-decoration:none; text-align:left; }
  .article-back-bottom:hover{ color:var(--gold); }

  .note{ margin-top:60px; padding-top:24px; border-top:1px solid var(--line); text-align:center; }
  .credit-line{ display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; font-size:10px; color:var(--dim); margin-top:10px; }
  .credit-line .credit-sep{ opacity:.5; }
  .credit-line-secondary{ margin-top:6px; display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--dim); }
  .credit-line-secondary a{ color:var(--dim); text-decoration:underline; }
  .credit-line-secondary a:hover{ color:var(--gold); }
  .site-nav-row{ display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:6px; }
  .site-nav-btn{ border:1px solid var(--line); background:transparent; color:var(--dim); font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; padding:9px 16px; cursor:pointer; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .site-nav-btn:hover{ border-color:var(--gold); color:var(--gold); }
  .footer-title-logo{ display:flex; justify-content:center; margin:22px 0 4px; }
  .footer-title-logo img{ width:220px; max-width:70%; height:auto; opacity:.85; }

  @media (max-width:768px){ .wrap{ padding:20px 16px 48px; } header h1{ font-size:22px; } }
  @media (max-width:480px){ .article-title{ font-size:21px; } .article-content{ font-size:14.5px; } .hex-square img{ width:170px; height:170px; } }
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/fonts.css">
</head>
<body>
<div class="wrap">
  <header>
    <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès" style="width:280px;max-width:80%;height:auto;display:block;margin:0 auto 10px;">
  </header>

  <div class="article-body">
    <a class="article-back" href="https://anibal-amiot.com/?chrono=${chrono}">← Voir cet hexagramme sur l'échiquier</a>

    <h1 class="article-title">Hexagramme ${chrono} — ${escapeHtml(pinyin)}, ${escapeHtml(nameFr)}</h1>
    <p class="article-sub">N° chronologique <b>${chrono}</b> (ordre par poids binaires) · n° King Wen (traditionnel) ${kwNum} · ${escapeHtml(hanzi || '')}</p>

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

      ${articleLinkHtml}

      <div class="cta-row">
        <a class="cta-btn" href="https://anibal-amiot.com/fr/livre/">Lire le livre en ligne →</a>
        <a class="cta-btn" href="https://anibal-amiot.com/?chrono=${chrono}">Voir sur l'échiquier interactif →</a>
      </div>

      <hr>
      <p><i>Pour comprendre les notions évoquées ici — carré magique, calque et tirage, Yi-King — consulte le <a href="https://anibal-amiot.com/lexique.html">lexique du projet</a>.</i></p>
    </div>

    <a class="article-back-bottom" href="https://anibal-amiot.com/?chrono=${chrono}">← Voir cet hexagramme sur l'échiquier</a>
  </div>

  <div class="note">
    <div class="site-nav-row">
      <a class="site-nav-btn" href="https://anibal-amiot.com/index.html">Accueil</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/">Tirage</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/lexique.html">Lexique</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/articles.html">Articles</a>
      <a class="site-nav-btn" href="https://anibal-amiot.com/fr/livre/">Le livre</a>
    </div>
    <div class="credit-line">
      <span>© <span id="credit-year">2026</span> Anibal Edelberto Amiot — Tous droits réservés</span>
      <span class="credit-sep">·</span>
      <span>Créé en collaboration avec Claude</span>
    </div>
    <div class="credit-line-secondary">
      <span>Hébergé par <a href="https://gk2.net" target="_blank" rel="noopener">https://gk2.net</a> – l'internet des créatifs</span>
    </div>
    <div class="footer-title-logo">
      <img src="../assets/title-logo-footer.png" alt="La Livrée d'Hermès">
    </div>
  </div>
</div>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT_DIR, slug), html, 'utf8');
  pages.push({ chrono, kwNum, slug, url });
}

fs.writeFileSync(path.join(__dirname, 'hexagram-pages-manifest.json'), JSON.stringify(pages, null, 2));
console.log('Généré', pages.length, 'pages dans', OUT_DIR);
