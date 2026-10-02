#!/usr/bin/env node
/* ============================================================
   Liste des dépôts (Zenodo) d'Anibal Amiot, depuis data/travaux.json.

   Une liste de dépôts se met à jour souvent — nouvelle version, nouveau
   DOI, licence changée — et elle était recopiée à la main dans quatre
   fichiers qui finissaient par se contredire (versions, licences, DOI
   d'une fiche remplacée). Ce script les écrit tous depuis la même source :

     travaux.html        la liste (zone @travaux) et le JSON-LD (zone @travaux-ld)
     en/works/index.html les mêmes, en anglais
     CITATION.cff        le bloc references: (tout dépôt sauf le livre,
                         déjà en preferred-citation)
     llms.txt            la section des dépôts (zone @travaux)

   Le JSON-LD décrit chaque dépôt par son DOI « toutes versions » (@id,
   identifier, sameAs) — celui qu'il faut citer — et sa dernière version
   connue en workExample, pour que moteurs et assistants relient les deux.

   Usage : node scripts/build-travaux.js            écrit les fichiers
           node scripts/build-travaux.js --verifie  échoue si l'un est périmé
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DONNEES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/travaux.json'), 'utf8'));
const SITE = 'https://anibal-amiot.com';
const AUTEUR = `${SITE}/a-propos.html#anibal-amiot`;

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const doiUrl = (doi) => `https://doi.org/${doi}`;

const TYPES = {
  book: { schema: 'Book', cff: 'book', fr: 'Livre', en: 'Book' },
  preprint: { schema: 'ScholarlyArticle', cff: 'article', fr: 'Prépublication', en: 'Preprint' },
  dataset: { schema: 'Dataset', cff: 'data', fr: 'Jeu de données', en: 'Dataset' },
  software: { schema: 'SoftwareSourceCode', cff: 'software', fr: 'Code et données', en: 'Code and data' },
  repository: { schema: 'SoftwareSourceCode', cff: 'software', fr: 'Dépôt de code', en: 'Code repository' },
  report: { schema: 'Report', cff: 'report', fr: 'Compte rendu', en: 'Report' },
};
const LICENCES = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-NC 4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'AGPL v3': 'https://www.gnu.org/licenses/agpl-3.0.html',
};
for (const d of DONNEES.depots) {
  if (!TYPES[d.type]) throw new Error(`data/travaux.json : type inconnu « ${d.type} » (${d.titre})`);
  if (d.licence && !LICENCES[d.licence]) throw new Error(`data/travaux.json : licence inconnue « ${d.licence} » (${d.titre})`);
  if (!DONNEES.sections.some((s) => s.id === d.section)) throw new Error(`data/travaux.json : section inconnue « ${d.section} » (${d.titre})`);
  if (!d.doi && !d.url) throw new Error(`data/travaux.json : ni doi ni url (${d.titre})`);
}

const MOIS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
function dateLisible(iso, lang) {
  const [a, m, j] = iso.split('-').map(Number);
  return lang === 'fr' ? `${j === 1 ? '1er' : j} ${MOIS.fr[m - 1]} ${a}` : `${MOIS.en[m - 1]} ${j}, ${a}`;
}

const T = {
  fr: { toutes: 'toutes versions, à citer', version: 'version', cetteVersion: 'DOI de cette version', premiere: 'première version le', anterieur: 'voir aussi la' },
  en: { toutes: 'all versions, to cite', version: 'version', cetteVersion: 'DOI of this version', premiere: 'first version', anterieur: 'see also the' },
};

function itemHtml(d, lang) {
  const t = T[lang];
  const lignes = [`        <li>`, `          <cite>${escapeHtml(d.titre)}</cite>`,
    `          <p class="travaux-desc">${escapeHtml(d[lang])}</p>`];
  if (d.doi) lignes.push(`          <a href="${doiUrl(d.doi)}">doi:${d.doi}</a>${d.versionDoi ? ` <span class="travaux-toutes">(${t.toutes})</span>` : ''}`);
  else lignes.push(`          <a href="${escapeHtml(d.url)}">${escapeHtml(d.url.replace(/^https:\/\//, ''))}</a>`);
  const meta = [TYPES[d.type][lang]];
  if (d.version) meta.push(`${t.version} ${escapeHtml(d.version)}${d.date ? `, ${dateLisible(d.date, lang)}` : ''}`);
  else if (d.date) meta.push(dateLisible(d.date, lang));
  if (d.premiere && d.premiere !== d.date) meta.push(`${t.premiere} ${dateLisible(d.premiere, lang)}`);
  if (d.versionDoi) meta.push(`<a href="${doiUrl(d.versionDoi)}">${t.cetteVersion}</a>`);
  if (d.licence) meta.push(escapeHtml(d.licence));
  if (d.anterieur) meta.push(`${t.anterieur} <a href="${doiUrl(d.anterieur.doi)}">${escapeHtml(d.anterieur[lang])}</a>`);
  lignes.push(`          <span class="travaux-meta">${meta.join(' · ')}</span>`, `        </li>`);
  return lignes.join('\n');
}

function listeHtml(lang) {
  const blocs = DONNEES.sections.map((s) => {
    const items = DONNEES.depots.filter((d) => d.section === s.id);
    if (!items.length) return '';
    return `    <div class="profile-section">\n      <h2>${escapeHtml(s[lang])}</h2>\n      <ul class="travaux-list">\n`
      + items.map((d) => itemHtml(d, lang)).join('\n') + `\n      </ul>\n    </div>`;
  }).filter(Boolean);
  return `<!-- @travaux:start — engendré depuis data/travaux.json (scripts/build-travaux.js) -->\n`
    + blocs.join('\n\n') + `\n    <!-- @travaux:end -->`;
}

function noeud(d) {
  const type = TYPES[d.type].schema;
  const n = { '@type': type, '@id': d.doi ? doiUrl(d.doi) : d.url, name: d.titre, author: { '@id': AUTEUR } };
  if (d.doi) {
    n.url = doiUrl(d.doi);
    n.identifier = [{ '@type': 'PropertyValue', propertyID: 'DOI', value: d.doi }];
    n.sameAs = doiUrl(d.doi);
  } else {
    n.codeRepository = d.url;
  }
  if (d.premiere) n.datePublished = d.premiere;
  else if (d.date && !d.version) n.datePublished = d.date;
  if (d.date && d.version) n.dateModified = d.date;
  if (d.version) n.version = d.version;
  if (d.langues) n.inLanguage = d.langues.length === 1 ? d.langues[0] : d.langues;
  n.description = d.en;
  if (d.licence) n.license = LICENCES[d.licence];
  if (d.doi) {
    n.isAccessibleForFree = true;
    n.publisher = { '@type': 'Organization', name: 'Zenodo' };
  }
  if (d.versionDoi) {
    n.workExample = { '@type': type, '@id': doiUrl(d.versionDoi), version: d.version || undefined,
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: d.versionDoi } };
    if (!d.version) delete n.workExample.version;
  }
  if (d.cite) n.citation = d.cite.map((doi) => ({ '@id': doiUrl(doi) }));
  if (d.anterieur) n.isBasedOn = { '@id': doiUrl(d.anterieur.doi) };
  return n;
}

function ldHtml(lang, url, nom) {
  const graphe = [
    { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: nom, inLanguage: lang,
      author: { '@id': AUTEUR }, about: { '@id': AUTEUR },
      hasPart: DONNEES.depots.map((d) => ({ '@id': d.doi ? doiUrl(d.doi) : d.url })) },
    { '@type': 'Person', '@id': AUTEUR, name: 'Anibal Edelberto Amiot',
      sameAs: ['https://www.wikidata.org/wiki/Q141191562', 'https://orcid.org/0009-0002-6414-9448'] },
    ...DONNEES.depots.map(noeud),
  ];
  return `<!-- @travaux-ld:start — engendré depuis data/travaux.json (scripts/build-travaux.js) -->\n`
    + `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graphe }, null, 2)}\n</script>\n`
    + `<!-- @travaux-ld:end -->`;
}

function citationCff() {
  const lignes = ['references:'];
  for (const d of DONNEES.depots) {
    if (d.type === 'book' || !d.doi) continue;
    lignes.push(`  - type: ${TYPES[d.type].cff}`, '    title: >-', `      ${d.titre}`,
      '    authors:', '      - family-names: Amiot', '        given-names: Anibal Edelberto',
      '        orcid: https://orcid.org/0009-0002-6414-9448',
      `    year: ${(d.premiere || d.date).slice(0, 4)}`, `    doi: ${d.doi}`);
    if (d.version) lignes.push(`    version: "${d.version}"`);
  }
  return lignes.join('\n') + '\n';
}

function llms() {
  const lignes = ['<!-- @travaux:start — engendré depuis data/travaux.json (scripts/build-travaux.js) -->',
    '## Dépôts de recherche / Research deposits', '',
    'Cite the DOI « all versions » below; every deposit is open and time-stamped on Zenodo.',
    'Full list, in French: https://anibal-amiot.com/travaux.html · in English:',
    'https://anibal-amiot.com/en/works/', ''];
  for (const d of DONNEES.depots) {
    if (!d.doi) continue;
    const v = d.version ? `, version ${d.version}` : '';
    lignes.push(`- ${d.titre} (${TYPES[d.type].en.toLowerCase()}${v}): https://doi.org/${d.doi}`);
    lignes.push(`  ${d.en}`);
  }
  lignes.push('<!-- @travaux:end -->');
  return lignes.join('\n');
}

const verifie = process.argv.includes('--verifie');
let perimes = 0;
function ecrire(rel, transformer) {
  const abs = path.join(ROOT, rel);
  const avant = fs.readFileSync(abs, 'utf8');
  const apres = transformer(avant);
  if (avant === apres) { console.log(`OK    ${rel}`); return; }
  if (verifie) { perimes++; console.error(`PÉRIMÉ ${rel}`); return; }
  fs.writeFileSync(abs, apres);
  console.log(`ÉCRIT ${rel}`);
}
function zone(s, nom, contenu, rel) {
  const re = new RegExp(`<!-- @${nom}:start[\\s\\S]*?<!-- @${nom}:end -->`);
  if (!re.test(s)) throw new Error(`${rel} : zone @${nom} introuvable`);
  return s.replace(re, () => contenu);
}

for (const [rel, lang, url, nom] of [
  ['travaux.html', 'fr', `${SITE}/travaux.html`, 'Travaux — Anibal Edelberto Amiot'],
  ['en/works/index.html', 'en', `${SITE}/en/works/`, 'Research deposits — Anibal Edelberto Amiot'],
]) {
  ecrire(rel, (s) => zone(zone(s, 'travaux', listeHtml(lang), rel), 'travaux-ld', ldHtml(lang, url, nom), rel));
}
ecrire('CITATION.cff', (s) => {
  const i = s.indexOf('\nreferences:');
  if (i === -1) throw new Error('CITATION.cff : bloc references: introuvable');
  return s.slice(0, i + 1) + citationCff();
});
ecrire('llms.txt', (s) => zone(s, 'travaux', llms(), 'llms.txt'));

if (perimes) {
  console.error('Relancer : node scripts/build-travaux.js');
  process.exit(1);
}
