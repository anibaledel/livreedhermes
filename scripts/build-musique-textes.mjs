#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// build-musique-textes.mjs — les textes de « Voir sa musique » dans 7 langues (en, es, th, zh, ru, pt, hi).
//
// Source : data/musique-chladni/traductions/<langue>.json, un objet PLAT « chemin → texte » (chemin = les clés de TEXTES.fr jointes par un point : « modes.image.0 »,
// « voirAussi.2.titre »). Ce script :
//   1. contrôle chaque langue contre le français : mêmes chemins, mêmes {noms} entre accolades, aucun texte vide ;
//   2. réécrit, dans assets/musique-chladni-textes.js, la zone entre « // @langues:start » et « // @langues:end » : un objet par langue, de même forme que `fr` ;
//   3. écrit docs/relecture-langues/<langue>.md (th, zh, ru, pt, hi) et docs/relecture-langues/en-es.md : le tableau clé / français / traduction pour les lecteurs natifs.
// Usage : node scripts/build-musique-textes.mjs            écrit
//         node scripts/build-musique-textes.mjs --verifie  échoue si le fichier ou les tableaux de relecture sont périmés
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), FICHIER = path.join(ROOT, 'assets/musique-chladni-textes.js'), verifie = process.argv.includes('--verifie');
const LANGUES = ['en', 'es', 'th', 'zh', 'ru', 'pt', 'hi', 'de', 'it', 'ja'], NOMS = { en: 'English', es: 'Español', th: 'ไทย', zh: '简体中文', ru: 'Русский', pt: 'Português (Portugal)', hi: 'हिन्दी', de: 'Deutsch', it: 'Italiano', ja: '日本語' };
const source = readFileSync(FICHIER, 'utf8'), AVANT = '  // @langues:start', APRES = '  // @langues:end';
// le français : lu dans le fichier lui-même, sans la zone des langues
const sansZone = source.includes(AVANT) ? source.slice(0, source.indexOf(AVANT)) + source.slice(source.indexOf(APRES) + APRES.length) : source;
const { TEXTES } = await import(`data:text/javascript;base64,${Buffer.from(sansZone).toString('base64')}`);
const fr = TEXTES.fr, plat = {};
const aplatir = (o, p) => { for (const [k, v] of Object.entries(o)) { const q = p ? `${p}.${k}` : k; if (typeof v === 'string') plat[q] = v; else aplatir(v, q); } };
aplatir(fr, '');
const noms = (t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const erreurs = [], objets = {}, traductions = {}, statique = JSON.parse(readFileSync(path.join(ROOT, 'data/musique-chladni/traductions/statique.json'), 'utf8'));
for (const l of LANGUES) {
  const t = JSON.parse(readFileSync(path.join(ROOT, `data/musique-chladni/traductions/${l}.json`), 'utf8')); traductions[l] = t;
  for (const k of Object.keys(plat)) {
    if (typeof t[k] !== 'string' || !t[k].trim()) { erreurs.push(`${l} : « ${k} » manque`); continue; }
    if (noms(t[k]) !== noms(plat[k])) erreurs.push(`${l} : « ${k} » : les {noms} diffèrent (${noms(plat[k])} / ${noms(t[k])})`);
  }
  for (const k of Object.keys(t)) if (!(k in plat)) erreurs.push(`${l} : « ${k} » n'existe pas en français`);
  const rebatir = (o, p) => (Array.isArray(o) ? o.map((v, i) => (typeof v === 'string' ? t[`${p}.${i}`] : rebatir(v, `${p}.${i}`))) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? t[p ? `${p}.${k}` : k] : rebatir(v, p ? `${p}.${k}` : k)])));
  objets[l] = rebatir(fr, '');
}
if (erreurs.length) { for (const e of erreurs.slice(0, 40)) console.error('ÉCHEC ' + e); process.exit(1); }
const zone = `${AVANT} — engendré par scripts/build-musique-textes.mjs depuis data/musique-chladni/traductions/<langue>.json, ne pas éditer ici\n` + LANGUES.map((l) => `  ${l}: ${JSON.stringify(objets[l], null, 2).replace(/\n/g, '\n  ')},`).join('\n') + `\n${APRES}`;
let neuf;
if (source.includes(AVANT)) neuf = source.slice(0, source.indexOf(AVANT)) + zone + source.slice(source.indexOf(APRES) + APRES.length);
else { const fin = source.indexOf('\n};\nexport const LANGUE_DEFAUT'); if (fin < 0) throw new Error('fin de TEXTES introuvable'); neuf = source.slice(0, fin + 1) + zone + source.slice(fin); }

// les tableaux de relecture
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), PORTES = await import(`file://${path.join(ROOT, 'assets/trois-portes.js')}`), LIB = require('./nav-tiles-libelles.js'), TUILES = require('./nav-tiles.js').TUILES, OUTILS_SUPPORT = JSON.parse(readFileSync(path.join(ROOT, 'data/outils-langues/outils-support.json'), 'utf8')).langues;
const cellule = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const tableau = (titre, lignes, l) => (lignes.length ? `\n### ${titre}\n\n| Clé | Français | ${NOMS[l]} |\n|---|---|---|\n` + lignes.map(([k, a, b]) => `| \`${k}\` | ${cellule(a)} | ${cellule(b)} |`).join('\n') + '\n' : '');
const SOURCE_FR_OUTILS = { titre: 'Outils', desc: "Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer." }, SOURCE_FR_SOUTIEN = { titre: 'Soutenir', intro: "Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile.", cta: "Aller à la page française pour payer", nota: 'Le paiement est sécurisé par Stripe. Montant libre, don facultatif.', h2: 'Ce que finance votre soutien', b: 'Le temps de recherche, de développement et de traduction', p: 'La construction des motifs, des outils du site et leur documentation en quatre langues.' };
const md = (l) => {
  const tuile = TUILES.find((t) => t.id === 'voir-sa-musique'), tl = l === 'en' ? tuile.en : LIB.TUILES_I18N['voir-sa-musique'][l];
  const portes = ['titre', 'chladni', 'musique', 'fonds'].map((k) => [`trois-portes.${k}`, [].concat(PORTES.TEXTES.fr[k]).join(' · '), [].concat(PORTES.TEXTES[l][k]).join(' · ')]);
  let out = `## ${NOMS[l]} (\`${l}\`)\n` + tableau('Voir sa musique — interface (`assets/musique-chladni-textes.js`)', Object.keys(plat).map((k) => [k, plat[k], traductions[l][k]]), l)
    + tableau('Voir sa musique — métadonnées de la page', [['titre, h1', "Voir sa musique — La Livrée d'Hermès", traductions[l].titrePage], ['og:description', statique.fr.ogDescription, statique[l].ogDescription], ['twitter:description', statique.fr.twitterDescription, statique[l].twitterDescription]], l)
    + tableau("Barre « Trois portes » (`assets/trois-portes.js`)", portes, l)
    + tableau('Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)', [['label', tuile.fr.label, tl.label], ['excerpt', tuile.fr.excerpt, tl.excerpt]], l);
  if (OUTILS_SUPPORT[l]) {
    const o = OUTILS_SUPPORT[l];
    out += tableau('Page « Outils » (`data/outils-langues/outils-support.json`)', [['titre', SOURCE_FR_OUTILS.titre, o.outils.titre], ['description', SOURCE_FR_OUTILS.desc, o.outils.desc], ['intro', SOURCE_FR_OUTILS.desc, o.outils.intro], ['note « page en français »', '—', o.note], ['Accueil (fil d\'Ariane)', 'Accueil', o.home]], l)
      + tableau('Page « Soutenir »', [['titre', SOURCE_FR_SOUTIEN.titre, o.soutien.titre], ['description', "Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits.", o.soutien.desc], ['intro', SOURCE_FR_SOUTIEN.intro, o.soutien.intro], ['bouton', SOURCE_FR_SOUTIEN.cta, o.soutien.cta], ['note', SOURCE_FR_SOUTIEN.nota, o.soutien.nota], ['h2', SOURCE_FR_SOUTIEN.h2, o.soutien.h2], ['b', SOURCE_FR_SOUTIEN.b, o.soutien.b], ['p', SOURCE_FR_SOUTIEN.p, o.soutien.p]], l);
  }
  return out;
};
const ENTETE = (titre, note) => `# ${titre}\n\nGénéré par \`node scripts/build-musique-textes.mjs\` depuis \`data/musique-chladni/traductions/<langue>.json\` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. ${note}\n\nPage concernée : « Voir sa musique » (\`musique-chladni.html\` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir \`TODO-RELECTURE.md\`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.\n\n`;
const fichiers = new Map();
for (const l of ['th', 'zh', 'ru', 'pt', 'hi', 'de', 'it', 'ja']) fichiers.set(`docs/relecture-langues/${l}.md`, ENTETE(`Relecture — « Voir sa musique » en ${NOMS[l]}`, 'À relire par un locuteur natif.') + md(l));
fichiers.set('docs/relecture-langues/en-es.md', ENTETE('Relecture — « Voir sa musique » en anglais et en espagnol', 'Relues par Anibal lui-même.') + md('en') + '\n' + md('es'));

// la page traduite : ce que le HTML porte avant le script (métadonnées, titre, introduction), écrit pour scripts/build-outils-langues.js
const PAGE_BRUT = readFileSync(path.join(ROOT, 'musique-chladni.html'), 'utf8');
// Le texte de la page est dans le HTML, écrit ICI à la construction (prompt 202) : tout élément `data-t="clé"` reçoit le texte de
// assets/musique-chladni-textes.js (français), et tout `data-ta="clé"` son attribut alt. Une seule source : le JavaScript de la page ne
// réécrit plus que ce qui change (état du bouton, nom du motif). Les variables {s} {m} {i} {n} de la légende de l'image d'exemple viennent de
// data/musique-chladni/figure-exemple.json (valeurs MESURÉES par tools/figure_exemple_musique.mjs, pas écrites à la main).
const EXEMPLE = JSON.parse(readFileSync(path.join(ROOT, 'data/musique-chladni/figure-exemple.json'), 'utf8'));
const VARS = { s: EXEMPLE.seconde, m: Number(/^j(\d)/.exec(EXEMPLE.morceau)[1]), i: EXEMPLE.motif, n: EXEMPLE.sur };
const subst = (t) => t.replace(/\{(\w+)\}/g, (x, k) => (k in VARS ? String(VARS[k]) : x));
const echHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), echAttr = (t) => echHtml(t).replace(/"/g, '&quot;');
const RE_DATA_T = /(<(\w+)\b[^>]*\bdata-t="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g, RE_DATA_TA = /(<img\b[^>]*?\balt=")([^"]*)("[^>]*\bdata-ta="(\w+)")/g;
const remplir = (html, texteDe) => html
  .replace(RE_DATA_T, (m, ouvrante, balise, cle, contenu, fermante) => `${ouvrante}${echHtml(subst(texteDe(cle)))}${fermante}`)
  .replace(RE_DATA_TA, (m, avant, alt, apres, cle) => `${avant}${echAttr(subst(texteDe(cle)))}${apres}`);
const manquantes = [];
// la liste « Voir aussi » : écrite dans le HTML aussi (même structure que celle que la page construit au chargement)
const RE_CARTES = /<div class="vm-cartes" id="vmVoirAussi">[\s\S]*?<\/div>/;
const cartesDe = (get) => { const o = []; for (let i = 0; get(`voirAussi.${i}.href`) !== undefined; i++) o.push(`<a class="vm-carte" href="${echAttr(get(`voirAussi.${i}.href`))}"><b>${echHtml(get(`voirAussi.${i}.titre`))}</b><span>${echHtml(get(`voirAussi.${i}.texte`))}</span></a>`); return o.join(''); };
const PAGE_TEXTES = remplir(PAGE_BRUT, (cle) => { if (typeof fr[cle] !== 'string') { manquantes.push(cle); return ''; } return fr[cle]; });
const PAGE = PAGE_TEXTES.replace(RE_CARTES, () => `<div class="vm-cartes" id="vmVoirAussi">${cartesDe((k) => plat[k])}</div>`);
if (manquantes.length) { console.error(`ÉCHEC musique-chladni.html : data-t sans texte français dans musique-chladni-textes.js : ${[...new Set(manquantes)].join(', ')}`); process.exit(1); }
const dansPage = (x) => { if (!PAGE.includes(x)) throw new Error(`musique-chladni.html : texte français introuvable : « ${x.slice(0, 70)} »`); return x; };
const FR_STATIQUE = { titre: "Voir sa musique — La Livrée d'Hermès", og: statique.fr.ogDescription, twitter: statique.fr.twitterDescription };
const metaDescription = /<meta name="description" content="([^"]*)">/.exec(PAGE)[1];
const table = [
  { fr: dansPage(FR_STATIQUE.titre), cle: (l) => traductions[l].titrePage },
  { fr: dansPage(metaDescription), cle: (l) => traductions[l].description },
  { fr: dansPage(FR_STATIQUE.og), cle: (l) => statique[l].ogDescription },
  { fr: dansPage(FR_STATIQUE.twitter), cle: (l) => statique[l].twitterDescription },
  // les libellés que le script de la page pose au chargement : écrits en dur aussi (tools/check_outils_langues.mjs : la page se lit sans JavaScript)
  { fr: dansPage('<label id="vmSonLabel" for="vmSource">Son</label>'), cle: (l) => `<label id="vmSonLabel" for="vmSource">${traductions[l].sonChoix}</label>` },
  { fr: dansPage('<button type="button" id="vmLecture" class="vm-ecouter">Écouter</button>'), cle: (l) => `<button type="button" id="vmLecture" class="vm-ecouter">${traductions[l].ecouter}</button>` },
  { fr: dansPage('<label id="vmEntreeLabel" for="vmEntree">Entrée audio</label>'), cle: (l) => `<label id="vmEntreeLabel" for="vmEntree">${traductions[l].entree}</label>` },
  { fr: dansPage('<button type="button" id="vmBasculeValide">Validé</button><button type="button" id="vmBasculeEssai">Essai</button>'), cle: (l) => `<button type="button" id="vmBasculeValide">${traductions[l].basculeValide}</button><button type="button" id="vmBasculeEssai">${traductions[l].basculeEssai}</button>` },
  { fr: dansPage('<p class="vm-fen-titre" id="vmValideTitre">Validé</p>'), cle: (l) => `<p class="vm-fen-titre" id="vmValideTitre">${traductions[l].valide}</p>` },
  { fr: dansPage('<p class="vm-fen-titre" id="vmEssaiTitre">Essai</p>'), cle: (l) => `<p class="vm-fen-titre" id="vmEssaiTitre">${traductions[l].essai}</p>` },
  { fr: dansPage('<button type="button" id="vmValider" class="vm-av">Valider l\'essai</button><button type="button" id="vmAnnuler" class="vm-av">Annuler</button><button type="button" id="vmPleinBtn">Plein écran</button>'), cle: (l) => `<button type="button" id="vmValider" class="vm-av">${traductions[l].validerEssai}</button><button type="button" id="vmAnnuler" class="vm-av">${traductions[l].annuler}</button><button type="button" id="vmPleinBtn">${traductions[l].pleinEcran}</button>` },
  // les deux boutons du mode (« Plus d'options ») et le volet « Informations sur l'appareil » : leur texte est posé en dur, comme les autres libellés
  { fr: dansPage('<button type="button" id="vmPlus" aria-expanded="false">Plus d\'options</button>'), cle: (l) => `<button type="button" id="vmPlus" aria-expanded="false">${traductions[l].plusOptions}</button>` },
  { fr: dansPage('<button type="button" id="vmAppareilCopier">Copier</button>'), cle: (l) => `<button type="button" id="vmAppareilCopier">${traductions[l].appareilCopier}</button>` },
  { fr: dansPage('<summary id="vmTitreAppareil">Informations sur l\'appareil</summary>'), cle: (l) => `<summary id="vmTitreAppareil">${traductions[l].appareilTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreReglages">Réglages</summary>'), cle: (l) => `<summary id="vmTitreReglages">${traductions[l].reglagesTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreScene">La scène</summary>'), cle: (l) => `<summary id="vmTitreScene">${traductions[l].sceneTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreEnreg">Enregistrer</summary>'), cle: (l) => `<summary id="vmTitreEnreg">${traductions[l].enregTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreComprendre">Pour comprendre</summary>'), cle: (l) => `<summary id="vmTitreComprendre">${traductions[l].comprendreTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreCles">Lecture en clés</summary>'), cle: (l) => `<summary id="vmTitreCles">${traductions[l].clesTitre}</summary>` },
  { fr: dansPage('<summary id="vmTitreRacc">Raccourcis clavier</summary>'), cle: (l) => `<summary id="vmTitreRacc">${traductions[l].raccourcisTitre}</summary>` },
  { fr: dansPage('<button type="button" id="vmQuitter">Quitter le plein écran</button>'), cle: (l) => `<button type="button" id="vmQuitter">${traductions[l].quitterPleinEcran}</button>` },
  { fr: dansPage('<h2 id="vmSemaineTitre">La semaine</h2>'), cle: (l) => `<h2 id="vmSemaineTitre">${traductions[l].semaineTitre}</h2>` },
  { fr: dansPage('<p class="vm-aide" id="vmSemaineMention">Musique composée avec l\'IA par MC Claude.</p>'), cle: (l) => `<p class="vm-aide" id="vmSemaineMention">${traductions[l].semaineMention}</p>` },
];
// les éléments `data-t` (et les alt `data-ta`) de la page : une entrée chacun, engendrée — le français est le texte écrit ci-dessus, la traduction celle du JSON de la langue
for (const m of PAGE.matchAll(RE_DATA_T)) {
  const [tout, ouvrante, balise, cle] = m;
  table.push({ fr: dansPage(tout), cle: (l) => { if (typeof traductions[l][cle] !== 'string') throw new Error(`${l} : « ${cle} » manque`); return `${ouvrante}${echHtml(subst(traductions[l][cle]))}</${balise}>`; } });
}
table.push({ fr: dansPage(PAGE.match(RE_CARTES)[0]), cle: (l) => `<div class="vm-cartes" id="vmVoirAussi">${cartesDe((k) => traductions[l][k])}</div>` });
for (const m of PAGE.matchAll(RE_DATA_TA)) {
  const [tout, avant, alt, apres, cle] = m;
  table.push({ fr: dansPage(`alt="${alt}"`), cle: (l) => `alt="${echAttr(subst(traductions[l][cle]))}"` });
}
const tableJson = { _doc: "Textes statiques de musique-chladni.html et leurs traductions (engendré par scripts/build-musique-textes.mjs depuis data/musique-chladni/traductions/). « fr » : sous-chaîne EXACTE de la page française. Les traductions viennent de l'IA, à relire (docs/relecture-langues/).", textes: table.map((r) => ({ fr: r.fr, ...Object.fromEntries(LANGUES.map((l) => [l, r.cle(l)])) })) };
const entree = { source: 'musique-chladni.html', priorite: '0.8', textes: 'data/outils-langues/musique-chladni.json', langues: Object.fromEntries(LANGUES.map((l) => [l, { dossier: statique[l].dossier, ogLocale: statique[l].ogLocale, ...(statique[l].accueil ? { remplacements: [
  { fr: '<nav class="breadcrumb" aria-label="Fil d\'Ariane">', trad: `<nav class="breadcrumb" aria-label="${statique[l].ariaFil}">`, source: 'fil d\'Ariane des pages d\'outils de la langue (zh/tools/, ru/tools/, pt/tools/, hi/tools/)' },
  { fr: '<a href="https://anibal-amiot.com/">Accueil</a>', trad: `<a href="https://anibal-amiot.com/${l}/">${statique[l].accueil}</a>`, source: 'fil d\'Ariane des pages d\'outils de la langue' },
] } : {}) }])) };
const cheminOutils = path.join(ROOT, 'data/outils-langues.json'), outils = JSON.parse(readFileSync(cheminOutils, 'utf8'));
const i = outils.pages.findIndex((p) => p.source === 'musique-chladni.html'); if (i >= 0) outils.pages[i] = entree; else outils.pages.push(entree);
fichiers.set('data/outils-langues/musique-chladni.json', JSON.stringify(tableJson, null, 2) + '\n');
fichiers.set('musique-chladni.html', PAGE);
fichiers.set('data/outils-langues.json', JSON.stringify(outils, null, 2) + '\n');

if (verifie) {
  const perimes = [];
  if (neuf !== source) perimes.push('assets/musique-chladni-textes.js');
  for (const [f, c] of fichiers) if (!existsSync(path.join(ROOT, f)) || readFileSync(path.join(ROOT, f), 'utf8') !== c) perimes.push(f);
  if (perimes.length) { console.error(`PÉRIMÉ : ${perimes.join(', ')} — relancer node scripts/build-musique-textes.mjs`); process.exit(1); }
  console.log(`Textes de « Voir sa musique » à jour : ${LANGUES.length} langues, ${Object.keys(plat).length} textes chacune, mêmes {noms} que le français.`); process.exit(0);
}
writeFileSync(FICHIER, neuf);
mkdirSync(path.join(ROOT, 'docs/relecture-langues'), { recursive: true });
for (const [f, c] of fichiers) writeFileSync(path.join(ROOT, f), c);
console.log(`${LANGUES.length} langues × ${Object.keys(plat).length} textes écrits dans assets/musique-chladni-textes.js ; ${fichiers.size} fichiers de relecture.`);
