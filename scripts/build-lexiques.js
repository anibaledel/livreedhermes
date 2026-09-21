/* ============================================================
   build-lexiques.js — engendre les lexiques traduits depuis
   data/lexiques_traduits.json.

   Pourquoi un générateur plutôt que deux fichiers écrits à la main : les
   pages traduites ont la MÊME structure et ne diffèrent que par leur texte.
   Deux copies auraient divergé à la première correction — c'est la maladie
   que ce dépôt a déjà payée trois fois (les gabarits recopiés, les trois
   copies de FACES, les deux dessins du référent des bandes).

   Le texte vit dans data/lexiques_traduits.json et nulle part ailleurs. Une
   correction d'Anibal se porte dans les données, pas dans le HTML : la page
   se régénère. Le JSON-LD est engendré depuis les mêmes champs que le corps
   visible, ce qui rend impossible qu'une FAQPage annonce une réponse absente
   de la page — l'écart que tools/check_jsonld_visible.py sanctionne.

   Les régions @head-icons, @hreflang et @header sont laissées à
   scripts/build-header.js, qui les pose ensuite depuis includes/ et
   scripts/langues.js. Ces pages n'ont ni traducteur ni pied partagé : elles
   sont traduites à la main, et leur imposer un pied français serait une
   régression pour leurs lecteurs (voir SANS_PIED dans build-header.js).

   Usage :
       node scripts/build-lexiques.js            écrit les pages
       node scripts/build-lexiques.js --verifie  échoue si une page diverge
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.dirname(__dirname);
const DONNEES = path.join(REPO_ROOT, 'data', 'lexiques_traduits.json');
const SITE = 'https://anibal-amiot.com';

const ech = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Le JSON-LD est du JSON dans du HTML : </script> dans une chaîne fermerait
// la balise. JSON.stringify ne s'en occupe pas, nous si.
const json = (v) => JSON.stringify(v, null, 2).replace(/<\//g, '<\\/');

// *La Livrée d'Hermès* du markdown devient une italique HTML.
const italiques = (s) => ech(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
// ... et disparaît purement dans le JSON-LD, qui veut du texte brut.
const brut = (s) => String(s).replace(/\*([^*]+)\*/g, '$1');

function page(L) {
  const prof = '../'.repeat(L.dossier.split('/').length);   // en/lexicon -> ../../
  const fil = L.fil.map(([nom, href], i) => href
    ? `<a href="${href}">${ech(nom)}</a>`
    : `<span aria-current="page">${ech(nom)}</span>`).join('<span class="sep">/</span>');

  const termes = L.definitions.map((d) => ({
    '@type': 'DefinedTerm', name: brut(d.terme), description: brut(d.texte),
    inDefinedTermSet: L.url,
  }));
  const questions = L.questions.map((q) => ({
    '@type': 'Question', name: brut(q.question),
    acceptedAnswer: { '@type': 'Answer', text: brut(q.reponse) },
  }));

  return `<!DOCTYPE html>
<html lang="${L.code}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ech(L.titre)}</title>
<meta name="description" content="${ech(L.description)}">
<meta name="author" content="Anibal Edelberto Amiot">
<link rel="canonical" href="${L.url}">
<meta property="og:title" content="${ech(L.titre)}">
<meta property="og:description" content="${ech(L.description)}">
<meta property="og:image" content="${SITE}/assets/title-logo-footer-og.png">
<meta property="og:url" content="${L.url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ech(L.titre)}">
<meta name="twitter:description" content="${ech(L.description)}">
<meta name="twitter:image" content="${SITE}/assets/title-logo-footer-og.png">
<script type="application/ld+json">
${json({ '@context': 'https://schema.org', '@type': 'DefinedTermSet',
         name: brut(L.titre), url: L.url, inLanguage: L.code, hasDefinedTerm: termes })}
</script>
<script type="application/ld+json">
${json({ '@context': 'https://schema.org', '@type': 'FAQPage',
         inLanguage: L.code, mainEntity: questions })}
</script>
<script type="application/ld+json">
${json({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
         itemListElement: L.fil.map(([nom, href], i) => ({
           '@type': 'ListItem', position: i + 1, name: nom, item: href || L.url })) })}
</script>
<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  img, canvas, svg{ max-width:100%; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  header{ text-align:center; }
  header h1{ font-weight:400; font-size:calc(28px + var(--fs-bump)); letter-spacing:.05em; margin:8px 0 4px; }
  header p{ color:var(--dim); font-size:calc(15px + var(--fs-bump)); margin:0; }
  @media (max-width:768px){ header h1{ font-size:calc(22px + var(--fs-bump)); } }
  @media (max-width:480px){ header h1{ font-size:calc(19px + var(--fs-bump)); letter-spacing:.02em; } }

  .lex-body{ padding:24px 0 8px; }
  .lex-intro{
    max-width:64ch; margin:0 auto 34px; color:var(--dim); text-align:center;
    font-size:calc(14px + var(--fs-bump)); line-height:1.8;
  }
  .lex-section{ max-width:64ch; margin:0 auto 34px; text-align:center; }
  .lex-section h2{
    font-size:calc(12px + var(--fs-bump)); letter-spacing:.14em; text-transform:uppercase;
    color:var(--gold); font-weight:400; margin:0 0 12px;
    border-bottom:1px solid var(--line); padding-bottom:10px;
  }
  .lex-section p{ color:var(--dim); font-size:calc(14px + var(--fs-bump)); line-height:1.7; margin:0; }
  .lex-section i{ color:var(--white); font-style:italic; }

  .faq-block{ max-width:64ch; margin:46px auto 40px; text-align:left; padding-top:34px; border-top:1px solid var(--line); }
  .faq-block-title{
    font-size:calc(12px + var(--fs-bump)); letter-spacing:.14em; text-transform:uppercase;
    color:var(--gold); font-weight:400; margin:0 0 16px; text-align:center;
  }
  .faq-item{ border-top:1px solid var(--line); padding:14px 0; }
  .faq-item:last-child{ border-bottom:1px solid var(--line); }
  .faq-item summary{
    cursor:pointer; color:var(--white); font-size:calc(14.5px + var(--fs-bump));
    list-style:none; display:flex; justify-content:space-between; align-items:baseline; gap:12px;
  }
  .faq-item summary::-webkit-details-marker{ display:none; }
  .faq-item summary .q-mark{ color:var(--gold); font-size:calc(16px + var(--fs-bump)); flex-shrink:0; }
  .faq-item[open] summary .q-mark{ transform:rotate(45deg); display:inline-block; }
  .faq-item p{ color:var(--dim); font-size:calc(14px + var(--fs-bump)); line-height:1.7; margin:12px 0 0; }

  .lex-sources{
    max-width:64ch; margin:0 auto; color:var(--dim); text-align:center;
    font-size:calc(14px + var(--fs-bump)); line-height:1.7;
  }
  .lex-sources a, .lex-intro a{ color:var(--gold); text-decoration:none; }
  .lex-sources a:hover, .lex-intro a:hover{ text-decoration:underline; }

  .note{ margin-top:60px; padding-top:24px; border-top:1px solid var(--line); text-align:center; }
  .site-nav-row{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:18px auto 0; max-width:900px; }
  .site-nav-btn{
    border:1px solid var(--line-strong); background:transparent; color:var(--dim);
    font-size:calc(10.5px + var(--fs-bump)); letter-spacing:.08em; text-transform:uppercase;
    padding:9px 16px; cursor:pointer; text-decoration:none;
    transition:border-color .12s ease, color .12s ease;
  }
  .site-nav-btn:hover{ border-color:var(--gold); color:var(--gold); }
  .credit-line{
    display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap;
    font-size:calc(10px + var(--fs-bump)); color:var(--dim); margin-top:18px;
  }
  .credit-line .credit-sep{ opacity:.5; }
  .footer-title-logo{ display:flex; justify-content:center; margin:22px 0 4px; }
  .footer-title-logo img{ width:220px; max-width:70%; height:auto; opacity:.85; }

  @media (max-width:768px){
    .wrap{ padding:20px 16px 48px; }
    .lex-intro, .lex-section p, .lex-sources{ font-size:calc(14.5px + var(--fs-bump)); }
  }
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prof}style.css">
<link rel="stylesheet" href="${prof}assets/fonts.css">
<link rel="stylesheet" href="${prof}assets/breadcrumb.css">
<link rel="stylesheet" href="${prof}assets/atalanta-bg.css">
</head>
<body>
<div class="wrap">
<main>
  <div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-26-lexique.avif);">
  <header class="atalanta-block" style="padding:32px 24px;">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
    <nav class="breadcrumb" aria-label="${ech(L.h1)}">
      ${fil}
    </nav>
    <h1>${ech(L.h1)}</h1>
    <p>${ech(L.sous_titre)}</p>
  </header>
  </div>

<!-- @langues:start -->
<!-- @langues:end -->

  <div class="lex-body">
    <p class="lex-intro">${italiques(L.intro)}</p>

${L.definitions.map((d) => `    <section class="lex-section">
      <h2>${ech(d.terme)}</h2>
      <p>${italiques(d.texte)}</p>
    </section>
`).join('\n')}
    <div class="faq-block">
      <p class="faq-block-title">${ech(L.faq_titre)}</p>

${L.questions.map((q) => `      <details class="faq-item">
        <summary>${ech(q.question)}<span class="q-mark">＋</span></summary>
        <p>${italiques(q.reponse)}</p>
      </details>
`).join('\n')}    </div>

    <p class="lex-sources">${italiques(L.sources)}</p>
  </div>
</main>

<div class="note">
  <div class="site-nav-row">
${L.nav.map(([nom, href]) => `    <a class="site-nav-btn" href="${href}">${ech(nom)}</a>`).join('\n')}
  </div>
  <div class="credit-line">
    <span>${ech(L.credit)}</span>
  </div>
  <div class="footer-title-logo">
    <img src="${prof}assets/title-logo-footer.png" alt="La Livrée d'Hermès" width="264" height="65" loading="lazy">
  </div>
</div>
</div>
</body>
</html>
`;
}

function main() {
  const verifie = process.argv.includes('--verifie');
  const donnees = JSON.parse(fs.readFileSync(DONNEES, 'utf8'));
  const ecarts = [];
  let ecrites = 0;
  for (const L of Object.values(donnees)) {
    const rel = path.join(L.dossier, 'index.html');
    const abs = path.join(REPO_ROOT, rel);
    const neuf = page(L);
    const actuel = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    // build-header.js pose ensuite ses régions : on ne compare que hors régions.
    const sansRegions = (s) => s === null ? null
      : s.replace(/[ \t]*<!-- @(head-icons|hreflang|header):start[\s\S]*?<!-- @\1:end -->\n?/g, '')
          .replace(/[ \t]*<!-- @langues:start[\s\S]*?<!-- @langues:end -->/g,
                   '<!-- @langues:start -->\n<!-- @langues:end -->');
    if (sansRegions(actuel) === neuf) continue;
    ecarts.push(rel);
    if (!verifie) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      // On réinjecte les régions existantes pour ne pas les perdre : c'est
      // build-header.js qui les possède, pas ce script.
      let sortie = neuf;
      if (actuel) {
        for (const nom of ['head-icons', 'hreflang']) {
          const m = actuel.match(new RegExp(`[ \\t]*<!-- @${nom}:start[\\s\\S]*?<!-- @${nom}:end -->`));
          if (m) sortie = sortie.replace('</head>', `${m[0]}\n</head>`);
        }
        const mh = actuel.match(/[ \t]*<!-- @header:start[\s\S]*?<!-- @header:end -->/);
        if (mh) sortie = sortie.replace('<main>', `${mh[0]}\n<main>`);
        const ml = actuel.match(/[ \t]*<!-- @langues:start[\s\S]*?<!-- @langues:end -->/);
        if (ml) sortie = sortie.replace(/[ \t]*<!-- @langues:start[\s\S]*?<!-- @langues:end -->/, ml[0]);
      }
      fs.writeFileSync(abs, sortie, 'utf8');
      ecrites++;
    }
  }
  if (verifie) {
    if (ecarts.length) {
      console.error(`${ecarts.length} lexique(s) traduit(s) ne correspondent plus à data/lexiques_traduits.json :`);
      for (const e of ecarts) console.error(`   ${e}`);
      console.error('\nRelancer : node scripts/build-lexiques.js');
      process.exit(1);
    }
    console.log(`Lexiques traduits conformes à data/lexiques_traduits.json (${Object.keys(donnees).length}).`);
  } else {
    console.log(`${ecrites} lexique(s) traduit(s) écrit(s) sur ${Object.keys(donnees).length}.`);
  }
}
main();
