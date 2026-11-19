/* © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande (page « À propos » du site)

   dataset-jsonld.js — UNE SEULE source pour les objets JSON-LD des dépôts de l'auteur (prompt 204 : Search Console, « Ensembles de données »).

   Google n'accepte un `Dataset` que s'il porte `name`, `description` ; il lit `creator` (une personne ou une organisation décrite, pas une référence
   `@id` seule), `license` (une URL) et, pour `citation`, un objet typé. Les trois générateurs qui écrivent des `Dataset` passent ici :
     - scripts/build-travaux.js        (travaux.html et les pages works des 9 langues) : noeudDepot(d, ctx), lang = langue de la page ;
     - scripts/build-travaux-pages.js  (travaux/<slug>/)                    : createur(), LICENCES ;
     - tools/build_research.py         (research/)                          : `node scripts/dataset-jsonld.js --research <id> [--lang en]`.
   Rien n'est inventé : les noms, descriptions, licences, DOI et versions viennent de data/travaux.json et de research/status.json
   (scripts/travaux-donnees.js les fusionne). Une version (`workExample`) reprend le nom, la description, la licence et le créateur de son dépôt parent.

   Usage en ligne de commande : node scripts/dataset-jsonld.js --research <research_id> [--lang fr|en|…]   écrit le nœud JSON sur la sortie standard. */
'use strict';
const SITE = 'https://anibal-amiot.com';
const AUTEUR = `${SITE}/a-propos.html#anibal-amiot`;
const doiUrl = (doi) => `https://doi.org/${doi}`;

const TYPES_SCHEMA = {
  book: 'Book', preprint: 'ScholarlyArticle', article: 'ScholarlyArticle', dataset: 'Dataset',
  software: 'SoftwareSourceCode', repository: 'SoftwareSourceCode', report: 'Report',
};
const LICENCES = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-NC 4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'AGPL v3': 'https://www.gnu.org/licenses/agpl-3.0.html',
  'AGPL-3.0': 'https://www.gnu.org/licenses/agpl-3.0.html',
};

// Le créateur : les valeurs du `Person` de a-propos.html (nom, adresse de la page, ORCID) ; ni adresse, ni téléphone, ni e-mail.
function createur() {
  return { '@type': 'Person', name: 'Anibal Edelberto Amiot', url: `${SITE}/a-propos.html`, sameAs: ['https://orcid.org/0009-0002-6414-9448'] };
}

// Licence d'un dépôt, en URL. « CC BY 4.0 (data), AGPL-3.0 (code) » : les données, à défaut les textes, à défaut la première (même règle que tools/build_research.py avant ce module).
function licenceUrl(texte) {
  if (!texte) return undefined;
  if (/^https?:\/\//.test(texte)) return texte;
  const parts = texte.split(',').map((p) => p.trim());
  const nom = (p) => p.replace(/\s*\(.*?\)\s*$/, '').trim();
  const choix = ['(data)', '(texts)', '(text)'].map((m) => parts.find((p) => p.endsWith(m))).find(Boolean) || parts[0];
  return LICENCES[nom(choix)] || undefined;
}

// La phrase du dépôt dans la langue de la page quand data/travaux.json la porte, sinon l'anglaise, sinon la française (rien n'est traduit ici).
function descriptionDe(d, lang) {
  if (d[lang]) return { texte: d[lang], langue: lang };
  if (lang !== 'fr' && d.en) return { texte: d.en, langue: 'en' };
  if (d.fr) return { texte: d.fr, langue: 'fr' };
  return d.en ? { texte: d.en, langue: 'en' } : undefined;
}

const idDepot = (d) => (d.doi ? doiUrl(d.doi) : d.url || `${SITE}/research/#en-${d.research_id}`);

// `citation` : un objet typé par DOI cité ; le nom est celui du dépôt quand le DOI est un des nôtres.
function citations(d, depots) {
  const nom = new Map();
  for (const x of depots || []) for (const doi of [x.doi, x.versionDoi, ...(x.toutesVersions || [])]) if (doi) nom.set(doi, x.titre);
  return d.cite.map((doi) => ({ '@type': 'CreativeWork', '@id': doiUrl(doi), url: doiUrl(doi), ...(nom.get(doi) ? { name: nom.get(doi) } : {}) }));
}

// Le nœud d'un dépôt. ctx : { lang, depots }. Un Dataset sort complet : name, description, creator, license (URL), url, isAccessibleForFree,
// et sa version (workExample) avec les mêmes champs.
function noeudDepot(d, ctx = {}) {
  const lang = ctx.lang || 'en';
  const type = TYPES_SCHEMA[d.type];
  const estDataset = type === 'Dataset';
  const n = { '@type': type, '@id': idDepot(d), name: d.titre, author: { '@id': AUTEUR } };
  if (estDataset) n.creator = createur();
  if (d.statut) n.creativeWorkStatus = d.statut.en;
  if (d.doi) {
    n.url = doiUrl(d.doi);
    n.identifier = [{ '@type': 'PropertyValue', propertyID: 'DOI', value: d.doi }];
    n.sameAs = doiUrl(d.doi);
  } else if (d.url) {
    n.codeRepository = d.url;
  } else {
    n.url = `${SITE}/research/#en-${d.research_id}`;
  }
  if (d.premiere) n.datePublished = d.premiere;
  else if (d.date && !d.version) n.datePublished = d.date;
  if (d.date && d.version) n.dateModified = d.date;
  if (d.version) n.version = d.version;
  if (d.langues) n.inLanguage = d.langues.length === 1 ? d.langues[0] : d.langues;
  const desc = estDataset ? descriptionDe(d, lang) : (d.en ? { texte: d.en } : undefined);
  if (desc) n.description = desc.texte;
  const licence = d.licence ? licenceUrl(d.licence) : undefined;
  if (licence) n.license = licence;
  if (d.doi) {
    n.isAccessibleForFree = true;
    n.publisher = { '@type': 'Organization', name: 'Zenodo' };
  }
  if (d.versionDoi) {
    const v = d.version ? `V${String(d.version).replace(/^v\.?/i, '')}` : '';
    const w = { '@type': type, '@id': doiUrl(d.versionDoi), identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: d.versionDoi } };
    if (d.version) w.version = d.version;
    if (estDataset) {
      // le nom du parent suivi de la version, sans la redoubler quand le titre la porte déjà (« … (V3.1) »)
      w.name = !v || d.titre.includes(`(${v})`) ? d.titre : `${d.titre} (${v})`;
      if (desc) w.description = desc.texte;
      w.creator = createur();
      w.url = doiUrl(d.versionDoi);
      if (licence) w.license = licence;
      w.isAccessibleForFree = true;
    }
    n.workExample = w;
  }
  if (d.cite) n.citation = citations(d, ctx.depots);
  if (d.anterieur) n.isBasedOn = { '@id': doiUrl(d.anterieur.doi) };
  return n;
}

module.exports = { SITE, AUTEUR, TYPES_SCHEMA, LICENCES, doiUrl, createur, licenceUrl, descriptionDe, idDepot, citations, noeudDepot };

if (require.main === module) {
  const a = process.argv.slice(2), i = a.indexOf('--research'), j = a.indexOf('--lang');
  if (i < 0 || !a[i + 1]) { console.error('Usage : node scripts/dataset-jsonld.js --research <research_id> [--lang en]'); process.exit(2); }
  const donnees = require('./travaux-donnees.js').charger();
  const d = donnees.depots.find((x) => x.research_id === a[i + 1]);
  if (!d) { console.error(`dataset-jsonld.js : research_id « ${a[i + 1]} » absent de data/travaux.json`); process.exit(1); }
  process.stdout.write(JSON.stringify(noeudDepot(d, { lang: j >= 0 ? a[j + 1] : 'en', depots: donnees.depots })));
}
