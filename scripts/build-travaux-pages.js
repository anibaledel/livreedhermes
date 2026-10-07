#!/usr/bin/env node
/* ============================================================
   build-travaux-pages.js — une page par dépôt Zenodo, travaux/<slug>/,
   portant le résumé de la fiche, recopié tel quel (corpus lisible, lot des
   pages, 7 octobre 2026).

   Pourquoi : un PDF derrière un DOI n'est ni indexé comme une page, ni
   lisible d'une requête. La description Zenodo de chaque dépôt est le texte
   d'Anibal ; posée sur une page du site, avec ses métadonnées savantes
   (balises citation_* que lit Google Scholar, JSON-LD, canonical sur le site
   et sameAs vers le DOI), elle rend chaque travail lisible sans quitter le
   site. Le texte intégral viendra ensuite, œuvre par œuvre, depuis les
   sources déposées — jamais depuis un PDF.

   Sources, et rien d'autre :
     data/travaux.json        le registre (titre affiché, DOI, licence, page)
     data/zenodo/depots.json  l'instantané des fiches (description, date,
                              version, créateurs et ORCID, fichiers)
   Une entrée du registre a une page quand elle porte « page » (le slug).

   Le résumé n'est ni reformulé, ni traduit, ni résumé. Il est rendu selon
   la forme que la fiche lui donne :
     - HTML (la plupart des fiches) : on ne garde que les balises de mise en
       forme (p, strong, b, em, i, sub, sup, code, br, listes, liens http) ;
     - texte brut : une ligne vide sépare deux paragraphes, un saut de ligne
       reste un saut de ligne, une adresse http devient un lien ;
     - markdown en bloc de citation (Chapitre VIII) : chaque ligne commence
       par « > » — c'est l'enveloppe, pas une citation dans le texte ; on
       ôte ce niveau, puis *italique*, **gras** et `code` sont rendus, les
       retours à la ligne d'un même paragraphe se rejoignent.
   La langue du résumé (attribut lang) est relevée, pas déclarée : fr si le
   texte porte plus de mots-outils français qu'anglais.

   Usage : node scripts/build-travaux-pages.js            écrit les pages
           node scripts/build-travaux-pages.js --verifie  échoue si une page diverge
   Puis : node scripts/build-header.js (en-tête, pied, tuiles), comme partout.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://anibal-amiot.com';
const ORCID = '0009-0002-6414-9448';
const AUTEUR = `${SITE}/a-propos.html#anibal-amiot`;
const registre = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/travaux.json'), 'utf8'));
const instantane = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/zenodo/depots.json'), 'utf8'));
const fiches = new Map(instantane.depots.filter((d) => d.conceptDoi)
  .map((d) => [String(d.conceptDoi).startsWith('10.') ? d.conceptDoi : `10.5281/zenodo.${d.conceptDoi}`, d]));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LICENCES = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-NC 4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'AGPL v3': 'https://www.gnu.org/licenses/agpl-3.0.html',
};
const TYPES = {
  book: ['Book', 'Livre'], preprint: ['ScholarlyArticle', 'Prépublication'], dataset: ['Dataset', 'Jeu de données'],
  software: ['SoftwareSourceCode', 'Code et données'], report: ['Report', 'Compte rendu'],
};
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const dateFr = (iso) => { const [a, m, j] = iso.split('-').map(Number); return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`; };

// ---- le résumé, selon sa forme ----------------------------------------------
const PERMISES = new Set(['p', 'strong', 'b', 'em', 'i', 'sub', 'sup', 'code', 'br', 'ul', 'ol', 'li', 'a']);
function htmlPermis(s) {
  // un « < » ou « > » du texte lui-même (« a > b ») s'encode ; les balises restent
  s = s.split(/(<\/?[a-zA-Z][^<>]*>)/).map((x, i) => (i % 2 ? x : x.replace(/</g, '&lt;').replace(/>/g, '&gt;'))).join('');
  return s.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, ferme, nom, attrs) => {
    const n = nom.toLowerCase();
    if (!PERMISES.has(n)) return '';
    if (n === 'a' && !ferme) {
      const href = (/\shref="(https?:[^"]*)"/i.exec(attrs) || [])[1];
      return href ? `<a href="${href}">` : '';
    }
    return `<${ferme}${n}>`;
  });
}
const lier = (s) => s.replace(/https?:\/\/[^\s<)]+[^\s<).,;:]/g, (u) => `<a href="${u}">${u}</a>`);
function enLigne(s) { // markdown en ligne, sur un texte déjà échappé
  return s.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function resume(texte) {
  const t = texte.replace(/\r\n/g, '\n').trim();
  if (/<\/?(p|strong|i|em|sub|sup|code|br|ul|li)\b/i.test(t)) return { forme: 'html', html: htmlPermis(t) };
  const lignes = t.split('\n');
  if (lignes.filter((l) => l.trim()).every((l) => l.startsWith('>'))) {
    const corps = lignes.map((l) => l.replace(/^>\s?/, '')).join('\n');
    const paras = corps.split(/\n\s*\n/).map((p) => `<p>${enLigne(esc(p.trim()).replace(/\n/g, ' '))}</p>`);
    return { forme: 'markdown en bloc de citation', html: paras.join('\n') };
  }
  const paras = t.split(/\n\s*\n/).map((p) => `<p>${lier(esc(p.trim())).replace(/\n/g, '<br>\n')}</p>`);
  return { forme: 'texte brut', html: paras.join('\n') };
}
const texteSeul = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&times;/g, '×').replace(/\s+/g, ' ').trim();
function langueDe(texte) {
  const mots = texte.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ']+/);
  const fr = mots.filter((w) => ['le', 'la', 'les', 'des', 'du', 'et', 'est', 'une', 'sur', 'dans'].includes(w)).length;
  const en = mots.filter((w) => ['the', 'of', 'and', 'is', 'a', 'on', 'in', 'which', 'every'].includes(w)).length;
  return fr > en ? 'fr' : 'en';
}

// ---- le style de travaux.html, recopié (même apparence) ----------------------
const travaux = fs.readFileSync(path.join(ROOT, 'travaux.html'), 'utf8');
const STYLE = (travaux.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const LIENS_CSS = [...travaux.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => `<link rel="stylesheet" href="/${m[1].replace(/^\//, '')}">`).join('\n');

function page(d, f) {
  const url = `${SITE}/travaux/${d.page}/`;
  const r = resume(f.description_texte || '');
  const lang = langueDe(texteSeul(r.html));
  const desc = texteSeul(r.html);
  const metaDesc = desc.length > 158 ? `${desc.slice(0, 157).replace(/\s+\S*$/, '')}…` : desc;
  const [schema, typeFr] = TYPES[d.type];
  const pdfs = (Array.isArray(f.fichiers) ? f.fichiers : []).filter((x) => /\.pdf$/i.test(x.nom));
  const pdfPrincipal = pdfs.find((x) => /French/i.test(x.nom)) || pdfs[0];
  const createurs = (f.createurs || []).length ? f.createurs : [{ nom: 'Amiot, Anibal Edelberto', orcid: ORCID }];
  const date = f.publication_date;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', '@id': AUTEUR, name: 'Anibal Edelberto Amiot', sameAs: ['https://www.wikidata.org/wiki/Q141191562', `https://orcid.org/${ORCID}`] },
      {
        '@type': schema, '@id': `${url}#travail`, name: f.titre, url, inLanguage: lang,
        author: { '@id': AUTEUR },
        identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: d.doi },
        sameAs: `https://doi.org/${d.doi}`,
        datePublished: d.premiere || date,
        ...(d.premiere && d.premiere !== date ? { dateModified: date } : {}),
        ...(f.version ? { version: f.version } : {}),
        ...(LICENCES[d.licence] ? { license: LICENCES[d.licence] } : {}),
        isPartOf: { '@type': 'CollectionPage', '@id': `${SITE}/travaux.html`, name: 'Travaux — Anibal Amiot' },
        description: desc,
      },
    ],
  };
  const citation = [
    ['citation_title', f.titre],
    ...createurs.map((c) => ['citation_author', c.nom]),
    ...createurs.filter((c) => c.orcid).map((c) => ['citation_author_orcid', `https://orcid.org/${c.orcid}`]),
    ['citation_publication_date', date.replace(/-/g, '/')],
    ['citation_doi', d.doi],
    ['citation_publisher', 'Zenodo'],
    ...(f.version ? [['citation_version', f.version]] : []),
    ...(pdfPrincipal ? [['citation_pdf_url', pdfPrincipal.lien.replace(/\/content$/, '').replace('/api/records/', '/records/') + '?download=1']] : []),
    ['citation_abstract_html_url', url],
    ['citation_language', lang],
  ].map(([k, v]) => `<meta name="${k}" content="${esc(v)}">`).join('\n');
  const meta = [
    ['Auteur', createurs.map((c) => `${esc(c.nom)}${c.orcid ? ` (<a href="https://orcid.org/${c.orcid}">ORCID ${c.orcid}</a>)` : ''}`).join(', ')],
    ['Type', typeFr],
    ['Date', `${dateFr(date)}${d.premiere && d.premiere !== date ? ` (première version le ${dateFr(d.premiere)})` : ''}`],
    ...(f.version ? [['Version', esc(f.version)]] : []),
    ['Licence', `${LICENCES[d.licence] ? `<a href="${LICENCES[d.licence]}">${esc(d.licence)}</a>` : esc(d.licence || '')}${f.licence ? ` <span class="travail-zenodo">(fiche Zenodo : <code>${esc(f.licence)}</code>)</span>` : ''}`],
    ['DOI', `<a href="https://doi.org/${d.doi}">${d.doi}</a> (toutes versions, à citer)${f.versionDoi_reel ? ` · <a href="https://doi.org/${f.versionDoi_reel}">DOI de cette version</a>` : ''}`],
  ].map(([k, v]) => `        <dt>${k}</dt><dd>${v}</dd>`).join('\n');
  const fichiers = pdfs.length
    ? `\n      <p class="travail-pdf">Lire le texte déposé : ${pdfs.map((x) => `<a href="${x.lien.replace(/\/content$/, '').replace('/api/records/', '/records/')}?download=1">${esc(x.nom)}</a>`).join(' · ')}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(f.titre)} — Anibal Amiot</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(f.titre)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${SITE}/assets/og_image_anibal_amiot.png">
<!-- balises citation_* : ce que lit Google Scholar (engendrées par scripts/build-travaux-pages.js) -->
${citation}
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
${STYLE}
<style>
  .travail-meta{ display:grid; grid-template-columns:max-content 1fr; gap:6px 16px; margin:18px 0 26px; }
  .travail-meta dt{ font-weight:600; }
  .travail-meta dd{ margin:0; }
  .travail-resume{ max-width:72ch; line-height:1.6; }
  .travail-zenodo, .travail-source{ opacity:.75; font-size:.92em; }
  .profile-body a{ color:var(--gold); text-decoration:none; }
  .profile-body a:hover{ text-decoration:underline; }
  .travail-resume code{ font-size:.92em; }
</style>
${LIENS_CSS}
<!-- @head-icons:start — engendré depuis includes/, ne pas éditer ici (voir scripts/build-header.js) -->
<!-- @head-icons:end -->
</head>
<body>
<div class="wrap">
<!-- @header:start — engendré depuis includes/, ne pas éditer ici (voir scripts/build-header.js) -->
<!-- @header:end -->
<!-- @main:start -->
<main id="contenu">
  <div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-37-profil.avif);">
  <header class="atalanta-block" style="padding:32px 24px;">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="${SITE}/">Accueil</a><span class="sep">/</span><a href="${SITE}/travaux.html">Travaux</a><span class="sep">/</span><span aria-current="page">${esc(d.titre)}</span>
    </nav>
    <h1>${esc(f.titre)}</h1>
  </header>
  </div>

  <div class="profile-body">
    <div class="profile-section">
      <dl class="travail-meta">
${meta}
      </dl>
      <h2>Résumé</h2>
      <div class="travail-resume" lang="${lang}">
${r.html}
      </div>
      <p class="travail-source">Texte de la fiche Zenodo, recopié tel quel (${r.forme}), relevé le ${instantane.recupere_le_utc.slice(0, 10)}.</p>${fichiers}
      <p><a href="${SITE}/travaux.html">Tous les travaux</a></p>
    </div>
  </div>
</main>
<!-- @main:end -->
</div>
<!-- @navtiles:start — engendré depuis scripts/nav-tiles.js, ne pas éditer ici (voir scripts/build-header.js) -->
<!-- @navtiles:end -->
<!-- @footer:start — engendré depuis includes/, ne pas éditer ici (voir scripts/build-header.js) -->
<!-- @footer:end -->
<!-- @analytics:start — engendré depuis includes/analytics.json, ne pas éditer ici (voir scripts/build-header.js) -->
<!-- @analytics:end -->
</body>
</html>
`;
}

// ---- écrire, ou vérifier ----------------------------------------------------
// Les zones entre marqueurs appartiennent à build-header.js : la comparaison
// les ignore, pour que les deux scripts ne se contredisent pas.
const ZONES_HEADER = 'head-icons|hreflang|header|langues|navtiles|footer|analytics';
const sansZones = (s) => s.replace(new RegExp(`(<!-- @(${ZONES_HEADER}):start[^>]*-->)[\\s\\S]*?(<!-- @\\2:end -->)`, 'g'), '$1$3');
const verifie = process.argv.includes('--verifie');
const ecarts = [];
let n = 0;
for (const d of registre.depots) {
  if (!d.page) continue;
  const f = fiches.get(d.doi);
  if (!f) { ecarts.push(`${d.page} : aucune fiche Zenodo pour ${d.doi} dans data/zenodo/depots.json`); continue; }
  const rel = `travaux/${d.page}/index.html`, abs = path.join(ROOT, rel);
  const neuf = page(d, f);
  n++;
  if (verifie) {
    if (!fs.existsSync(abs) || sansZones(fs.readFileSync(abs, 'utf8')) !== sansZones(neuf)) ecarts.push(`${rel} : diffère de sa génération`);
    continue;
  }
  // garder ce que build-header a posé entre les marqueurs
  let sortie = neuf;
  if (fs.existsSync(abs)) {
    const ancien = fs.readFileSync(abs, 'utf8');
    for (const m of ancien.matchAll(new RegExp(`<!-- @(${ZONES_HEADER}):start[^>]*-->[\\s\\S]*?<!-- @\\1:end -->`, 'g'))) {
      sortie = sortie.replace(new RegExp(`<!-- @${m[1]}:start[^>]*-->[\\s\\S]*?<!-- @${m[1]}:end -->`), () => m[0]);
    }
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, sortie);
}
if (ecarts.length) { for (const e of ecarts) console.error(`ÉCART ${e}`); console.error('\nRelancer : node scripts/build-travaux-pages.js puis node scripts/build-header.js'); process.exit(1); }
console.log(verifie ? `Pages des travaux à jour : ${n}.` : `Pages des travaux écrites : ${n} (travaux/<slug>/index.html). Puis : node scripts/build-header.js`);
