#!/usr/bin/env node
/* ============================================================
   build-outils-langues.js — les outils dont le texte est DÉJÀ traduit, sortis
   à une adresse par langue (prompt-cc-outils-langues.md, étape 1).

   cymatique.html, 360-calques.html et tirage-livree-hermes.html portent leur
   texte en plusieurs langues dans un dictionnaire JavaScript (UI.fr, UI.en…),
   mais à une seule adresse : la traduction bascule au clic, et un moteur de
   recherche ne la voit pas. Ce script écrit, depuis la page française et
   rien d'autre, une page par langue à son adresse (en/cymatics/…) :

     1. la langue est fixée : la ligne qui la choisissait au chargement
        (localStorage, ?lang=) devient « let LANG = '<langue>'; » ;
     2. le texte que le script de la page pose au chargement est écrit EN DUR
        dans le HTML, depuis le même dictionnaire : les éléments
        data-i18n / data-i18n-html, et ceux que applyUILang() remplit par leur
        id. La page se lit sans JavaScript, et un moteur y trouve sa langue ;
     3. les textes hors dictionnaire (titre, description, fil d'Ariane,
        données structurées) viennent de data/outils-langues.json, chacun avec
        sa provenance ; le texte français à remplacer doit être présent, sinon
        le script échoue — une page française corrigée ne laisse pas sa
        traduction dériver en silence ;
     4. les chemins relatifs prennent le préfixe de la profondeur (../../) :
        attributs, url() des styles, et chaînes du script qui nomment un
        fichier ou un dossier de la racine du dépôt ;
     5. les boutons de langue (FR / EN / ES / TH) deviennent des liens vers
        les pages de chaque langue ;
     6. adresse propre : canonical, og:url, données structurées.

   Le reste — en-tête, pied, navigation, hreflang — est posé par
   scripts/build-header.js (traiter(), appelé ici) depuis scripts/langues.js,
   qui tire ses groupes de traduction du même fichier de données.

   La page française n'est PAS touchée par ce script : seul build-header.js
   lui ajoute son bloc hreflang, comme à toute page d'un groupe.

   Usage : node scripts/build-outils-langues.js            écrit les pages
           node scripts/build-outils-langues.js --verifie  échoue si l'une est périmée
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://anibal-amiot.com';
const DONNEES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/outils-langues.json'), 'utf8'));
const { LANGUES, hreflangDeCode, adresseDans, annoncerLiens } = require('./langues.js');
const { phrase } = require('./build-couverture.js');

const echTexte = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const echAttr = (s) => echTexte(s).replace(/"/g, '&quot;');

// ---- lecture du dictionnaire de la page ----------------------------------
// L'objet littéral « const UI = { … }; », lu en sautant chaînes et commentaires,
// puis évalué à part : c'est un littéral sans référence extérieure.
function finAccolade(s, j) {
  // l'accolade (objet) ou le crochet (tableau) ouvert en j
  const [ouvre, ferme] = s[j] === '[' ? ['[', ']'] : ['{', '}'];
  let p = 0, chaine = null;
  for (let k = j; k < s.length; k++) {
    const c = s[k];
    if (chaine) {
      if (c === '\\') { k++; continue; }
      if (c === chaine) chaine = null;
      continue;
    }
    if (c === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k); continue; }
    if (c === '/' && s[k + 1] === '*') { k = s.indexOf('*/', k) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { chaine = c; continue; }
    if (c === ouvre) p++;
    else if (c === ferme) { p--; if (p === 0) return k; }
  }
  throw new Error('accolade non fermée');
}
function dictionnaire(s, source) {
  const i = s.indexOf('const UI = {');
  if (i === -1) throw new Error(`${source} : pas de « const UI = { » — rien à sortir`);
  const j = s.indexOf('{', i);
  return vm.runInNewContext(`(${s.slice(j, finAccolade(s, j) + 1)})`);
}
// ---- tableaux de données du script, traduits (étape 4) -------------------
// Une page sans dictionnaire peut porter ses textes dans des tableaux du
// script (« const HEX_KW = { … }; » : les 64 hexagrammes). Ils ne passent pas
// par la table des textes : leur traduction existe déjà ailleurs, et elle est
// lue là, jamais recopiée — l'anglais dans les tableaux de la page du tirage
// (HEX_KW_EN, IMAGE_EN), l'espagnol et le thaï dans
// data/hexagrammes_traduits.json, ceux des pages d'hexagrammes traduites.
// « donnees » : [{ "const": nom du tableau, "forme": comment le lire }].
function litteral(s, nom, source) {
  const m = new RegExp(`const ${nom} = [{[]`).exec(s);
  if (!m) throw new Error(`${source} : pas de « const ${nom} = { » ni « const ${nom} = [ »`);
  const j = m.index + m[0].length - 1;
  const k = finAccolade(s, j);
  return { j, k, valeur: vm.runInNewContext(`(${s.slice(j, k + 1)})`) };
}
const HEXAGRAMMES = {};
function hexagrammes(lang) {
  if (HEXAGRAMMES[lang]) return HEXAGRAMMES[lang];
  const out = {};
  if (lang === 'en') {
    const t = fs.readFileSync(path.join(ROOT, 'tirage-livree-hermes.html'), 'utf8');
    const kw = litteral(t, 'HEX_KW_EN', 'tirage-livree-hermes.html').valeur;
    const im = litteral(t, 'IMAGE_EN', 'tirage-livree-hermes.html').valeur;
    for (const n of Object.keys(kw)) out[n] = { name: kw[n][1], keyword: kw[n][2], judgement: kw[n][3], image: im[n] };
  } else {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hexagrammes_traduits.json'), 'utf8'));
    if (!d[lang]) throw new Error(`data/hexagrammes_traduits.json : pas de langue « ${lang} »`);
    for (const [n, h] of Object.entries(d[lang].hexagrams)) out[n] = { name: h.name, keyword: h.judgementTitle, judgement: h.judgement, image: h.image };
  }
  for (let n = 1; n <= 64; n++) {
    for (const c of ['name', 'keyword', 'judgement', 'image']) {
      if (!out[n] || !out[n][c]) throw new Error(`hexagrammes (${lang}) : n° ${n}, « ${c} » manque`);
    }
  }
  return (HEXAGRAMMES[lang] = out);
}
// Les textes propres à l'outil de création (ses mots-clés quand ils diffèrent
// de ceux du tirage, ses jugements de paires, ses idées médianes) : écrits
// pour l'étape 4, chacun avec son français — qui doit être celui de la page.
const TEXTES_CREATION = 'data/outils-langues/creation-motifs-yi-king-textes.json';
// Les 32 textes de paires, lus par leur mot-clé français ; le texte français
// doit être celui de la page, sinon la traduction a dérivé.
const PAIRES_32 = 'data/outils-langues/paires-32.json';
let paires32 = null;
function paire32(motcle, texte, lang) {
  paires32 = paires32 || JSON.parse(fs.readFileSync(path.join(ROOT, PAIRES_32), 'utf8')).paires;
  const e = paires32.find((x) => x.fr.keyword === motcle);
  if (!e) throw new Error(`${PAIRES_32} : pas de paire « ${motcle} »`);
  if (e.fr.text !== texte) throw new Error(`${PAIRES_32} : le texte français de « ${motcle} » n'est plus celui de la page, la traduction a dérivé`);
  if (!e[lang]) throw new Error(`${PAIRES_32} : « ${motcle} » n'a pas de traduction « ${lang} »`);
  return e[lang];
}
let textesCreation = null;
const creation = () => textesCreation || (textesCreation = JSON.parse(fs.readFileSync(path.join(ROOT, TEXTES_CREATION), 'utf8')));
// Le mot-clé d'un hexagramme : celui du tirage quand l'outil reprend le même
// (sa traduction existe), sinon celui de la table des mots-clés.
let motsClesTirage = null;
function motCle(fr, n, lang) {
  if (!motsClesTirage) {
    const t = fs.readFileSync(path.join(ROOT, 'tirage-livree-hermes.html'), 'utf8');
    motsClesTirage = litteral(t, 'HEX_KW', 'tirage-livree-hermes.html').valeur;
  }
  if (n && motsClesTirage[n] && motsClesTirage[n][2] === fr) return hexagrammes(lang)[n].keyword;
  for (const k of Object.keys(motsClesTirage)) if (motsClesTirage[k][2] === fr) return hexagrammes(lang)[k].keyword;
  const m = creation().motsCles[fr];
  if (!m || !m[lang]) throw new Error(`${TEXTES_CREATION} : mot-clé « ${fr} » sans traduction « ${lang} »`);
  return m[lang];
}
function texteCreation(table, cle, fr, lang) {
  const e = creation()[table][cle];
  if (!e) throw new Error(`${TEXTES_CREATION} : ${table} « ${cle} » manque`);
  if (e.fr !== fr) throw new Error(`${TEXTES_CREATION} : ${table} « ${cle} » — le français de la page a changé, la traduction a dérivé`);
  if (!e[lang]) throw new Error(`${TEXTES_CREATION} : ${table} « ${cle} » sans « ${lang} »`);
  return e[lang];
}
// Chaque forme garde du tableau français tout ce qui n'est pas du texte
// (pinyin, numéros) et n'en remplace que le texte.
const FORMES = {
  // HEX_FR[kw] = { chrono, name, pinyin, image_title, image_text, jugement_title, jugement_text }
  hexFr: (fr, h, lang) => JSON.stringify(Object.fromEntries(Object.entries(fr).map(([n, e]) => [n, {
    ...e, name: h[n].name, image_title: h[n].name, image_text: h[n].image,
    jugement_title: motCle(e.jugement_title, n, lang), jugement_text: h[n].judgement,
  }]))),
  // PAIRS_FR[n] = { a, b, motcle, jugement } — les 32 paires du livre
  paires: (fr, h, lang) => JSON.stringify(Object.fromEntries(Object.entries(fr).map(([n, e]) => [n, {
    ...e, motcle: motCle(e.motcle, null, lang), jugement: texteCreation('paires', n, e.jugement, lang),
  }]))),
  // ASSETS[catégorie] = [{ …, label: 'Yang fixe / Yin mutant' }] — l'étiquette
  // des 60 images, traduite terme à terme ; aucune étiquette traduite ne doit
  // garder un terme français de la table (sinon la génération échoue)
  assets: (fr, h, lang) => {
    const termes = Object.entries(creation().etiquettes).sort((a, b) => b[0].length - a[0].length);
    const traduire = (l) => termes.reduce((t, [f, tr]) => t.split(f).join(tr[lang]), l);
    const out = Object.fromEntries(Object.entries(fr).map(([cat, liste]) => [cat, liste.map((e) => ({ ...e, label: traduire(e.label) }))]));
    for (const liste of Object.values(out)) for (const e of liste) {
      if (termes.some(([f, tr]) => tr[lang] !== f && new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (/\p{L}$/u.test(f) ? '(?!\\p{L})' : ''), 'u').test(e.label))) throw new Error(`${TEXTES_CREATION} : étiquette « ${e.label} » restée en français (${lang})`);
    }
    return JSON.stringify(out);
  },
  // PAIRES_32[chrono] = { title, text } — l'idée médiane, lue par son titre
  idees: (fr, h, lang) => JSON.stringify(Object.fromEntries(Object.entries(fr).map(([n, e]) => [n,
    texteCreation('idees', e.title, e.text, lang)]))),
  // Les 32 textes de paires (mot-clé et texte), communs à 360 calques et aux
  // fonds d'écran, traduits une fois dans data/outils-langues/paires-32.json :
  // PAIRS32[n] = { …, keyword, text } (fonds d'écran) ;
  // PAIRS_32 = [[kwA, kwB, mot-clé, texte], …] (360 calques).
  paires32: (fr, h, lang) => JSON.stringify(Object.fromEntries(Object.entries(fr).map(([n, e]) => [n, {
    ...e, ...paire32(e.keyword, e.text, lang),
  }]))),
  paires32Liste: (fr, h, lang) => `[\n${fr.map(([a, b, motcle, texte]) => {
    const t = paire32(motcle, texte, lang);
    return `  ${JSON.stringify([a, b, t.keyword, t.text])}`;
  }).join(',\n')}\n]`,
  // HEX_KW[kw] = [pinyin, nom, mot-clé, texte du Jugement]
  hexKw: (fr, h) => `{\n${Object.keys(fr).map((n) => `${n}:${JSON.stringify([fr[n][0], h[n].name, h[n].keyword, h[n].judgement])}`).join(',\n')}\n}`,
  // IMAGE_FR[kw] = texte de l'Image
  image: (fr, h) => `{\n${Object.keys(fr).map((n) => `${n}:${JSON.stringify(h[n].image)}`).join(',\n')}\n}`,
};
function donneesTraduites(s, p, lang, nomPage) {
  for (const d of p.donnees || []) {
    const forme = FORMES[d.forme];
    if (!forme) throw new Error(`${nomPage} : forme de données inconnue « ${d.forme} »`);
    const { j, k, valeur } = litteral(s, d.const, nomPage);
    const attendu = d.entrees || 64;
    if (Object.keys(valeur).length !== attendu) throw new Error(`${nomPage} : ${d.const} n'a pas ${attendu} entrées`);
    s = s.slice(0, j) + forme(valeur, hexagrammes(lang), lang) + s.slice(k + 1);
  }
  return s;
}

function corpsFonction(s, nom) {
  const i = s.indexOf(`function ${nom}(`);
  if (i === -1) return '';
  const j = s.indexOf('{', i);
  return s.slice(j + 1, finAccolade(s, j));
}

// ---- ce que applyUILang() écrit, élément par élément ----------------------
// [id, cible, clé] — cible : 'text', 'html', ou 'attr:<nom>'. Les formes lues :
//   document.getElementById('ID').textContent|innerHTML|title = t('CLÉ')
//   document.getElementById('ID').setAttribute('ATTR', t('CLÉ'))
//   const a = document.getElementById('ID'), … ; a.textContent = t('CLÉ')
//   for (const k of ['a','b']) document.getElementById('PRE' + k).textContent = t(k)
//   for (let i = 1; i <= N; i++) { … ('PRE'+i) … t('CLÉ'+i) … }
// Une forme non reconnue n'est pas devinée : la page traduite garde alors le
// texte français à cet endroit jusqu'au chargement du script, et
// tools/check_outils_langues.mjs le voit (texte statique ≠ texte posé).
function deplierBoucles(corps) {
  corps = corps.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{([\s\S]*?)\n\s*\}/g,
    (m, v, a, b, inner) => {
      let out = '';
      for (let i = Number(a); i <= Number(b); i++) {
        out += inner.replace(new RegExp(`'([^']*)'\\s*\\+\\s*${v}\\b`, 'g'), `'$1${i}'`) + '\n';
      }
      return out;
    });
  corps = corps.replace(/for\s*\(\s*const\s+(\w+)\s+of\s+\[([^\]]*)\]\s*\)\s*\n?\s*([^;\n]+;)/g, (m, v, liste, stmt) =>
    liste.split(',').map((x) => x.trim().replace(/^'|'$/g, '')).filter(Boolean).map((k) =>
      stmt.replace(new RegExp(`'([^']*)'\\s*\\+\\s*${v}\\b`, 'g'), `'$1${k}'`).replace(new RegExp(`t\\(${v}\\)`, 'g'), `t('${k}')`)).join('\n'));
  return corps;
}
function affectations(corps) {
  corps = deplierBoucles(corps);
  const alias = {};
  for (const m of corps.matchAll(/(\w+)\s*=\s*document\.getElementById\('([^']+)'\)/g)) alias[m[1]] = m[2];
  const el = `(?:document\\.getElementById\\('([^']+)'\\)|\\b(${Object.keys(alias).join('|') || '\\$^'})\\b)`;
  const out = [];
  for (const m of corps.matchAll(new RegExp(`${el}\\.(textContent|innerHTML|title)\\s*=\\s*t\\('([^']+)'\\)`, 'g'))) {
    out.push([m[1] || alias[m[2]], { textContent: 'text', innerHTML: 'html', title: 'attr:title' }[m[3]], m[4]]);
  }
  for (const m of corps.matchAll(new RegExp(`${el}\\.setAttribute\\('([\\w-]+)',\\s*t\\('([^']+)'\\)\\)`, 'g'))) {
    out.push([m[1] || alias[m[2]], `attr:${m[3]}`, m[4]]);
  }
  return out;
}

// ---- un élément du HTML, par son attribut ----------------------------------
// [début de la balise ouvrante, fin de la balise ouvrante, début de la balise
// fermante, fin] — la fermante trouvée en comptant les balises du même nom.
const VIDES = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'wbr']);
function element(s, attrRe, depuis = 0) {
  const re = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\s${attrRe}[^>]*>`, 'g');
  re.lastIndex = depuis;
  const m = re.exec(s);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  const ouv = [m.index, m.index + m[0].length];
  if (VIDES.has(tag)) return [ouv[0], ouv[1], ouv[1], ouv[1]];
  const balise = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  balise.lastIndex = ouv[1];
  let p = 1, b;
  while ((b = balise.exec(s))) {
    if (b[1]) { if (--p === 0) return [ouv[0], ouv[1], b.index, b.index + b[0].length]; }
    else if (!b[0].endsWith('/>')) p++;
  }
  throw new Error(`balise <${tag}> non fermée (${attrRe})`);
}
function poserAttr(ouvrante, nom, valeur) {
  const re = new RegExp(`\\s${nom}="[^"]*"`);
  const a = ` ${nom}="${echAttr(valeur)}"`;
  return re.test(ouvrante) ? ouvrante.replace(re, a) : ouvrante.replace(/\s*\/?>$/, (f) => a + f);
}
function ecrire(s, attrRe, cible, valeur, nom) {
  let depuis = 0, n = 0, e;
  while ((e = element(s, attrRe, depuis))) {
    if (cible.startsWith('attr:')) {
      const ouv = poserAttr(s.slice(e[0], e[1]), cible.slice(5), valeur);
      s = s.slice(0, e[0]) + ouv + s.slice(e[1]);
      depuis = e[0] + ouv.length;
    } else {
      const corps = cible === 'text' ? echTexte(valeur) : valeur;
      s = s.slice(0, e[1]) + corps + s.slice(e[2]);
      depuis = e[1] + corps.length;
    }
    n++;
  }
  if (!n) throw new Error(`${nom} : aucun élément ${attrRe}`);
  return s;
}

// ---- les chemins relatifs ---------------------------------------------------
// La racine du dépôt, lue : un dossier se reconnaît suivi de « / », un fichier
// par son nom entier. « 'fr' » (un code de langue) n'est donc pas un chemin,
// « 'fr/livre/' » en est un.
const RACINE = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules');
const echRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NOMS = RACINE.map((e) => (e.isDirectory() ? `${echRe(e.name)}/` : `${echRe(e.name)}(?=[?#"'\`\\\\])`)).join('|');
const relatif = (u) => u && !/^([a-z][a-z0-9+.-]*:|\/|#|\?|\$\{|\.\.\/)/i.test(u) && !/['"+]/.test(u);
// Un lien vers une page du site vise sa version dans la langue de la page,
// quand elle existe (scripts/langues.js, adresseDans) : « fr/motifs/ » dans la
// page française devient « motifs/ » dans l'anglaise. Sauf un lien qui dit sa
// langue (hreflang) : le drapeau d'une édition vise CETTE édition.
function prefixerBalises(html, prefixe, lang) {
  const un = (u, choisie) => (relatif(u) ? prefixe + (choisie ? u.replace(/^\.\//, '') : adresseDans(u.replace(/^\.\//, ''), lang)) : u);
  return html
    .replace(/<[a-zA-Z][^>]*>/g, (balise) => balise
      .replace(/(\s(?:href|src|poster|action))="([^"]*)"/g, (m, a, u) => `${a}="${un(u, /\shreflang="/.test(balise))}"`)
      .replace(/(\ssrcset)="([^"]*)"/g, (m, a, v) => `${a}="${v.split(',').map((x) => {
        const [u, ...d] = x.trim().split(/\s+/);
        return [un(u), ...d].join(' ');
      }).join(', ')}"`))
    .replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => (relatif(u) ? `url(${q}${prefixe}${u}${q})` : m));
}
function prefixer(s, prefixe, lang) {
  // Le document en morceaux : hors <script>, les balises et les url() ; dans
  // un <script>, les chaînes qui nomment un fichier ou un dossier de la racine
  // (y compris celles d'un gabarit qui écrit du HTML). Les données
  // structurées (ld+json) ne portent que des adresses absolues.
  let out = '', i = 0;
  for (const m of s.matchAll(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g)) {
    out += prefixerBalises(s.slice(i, m.index), prefixe, lang) + prefixerBalises(m[1], prefixe, lang);
    out += /application\/ld\+json/.test(m[1])
      ? m[2]
      : m[2].replace(new RegExp(`(['"\`])(?:\\./)?(?=(?:${NOMS}))`, 'g'), `$1${prefixe}`);
    out += m[3];
    i = m.index + m[0].length;
  }
  return out + prefixerBalises(s.slice(i), prefixe, lang);
}

// Applique f au document hors du code des scripts : les morceaux entre deux
// <script> (balises comprises) et le contenu des données structurées.
function horsCode(s, f) {
  let out = '', i = 0;
  for (const m of s.matchAll(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g)) {
    out += f(s.slice(i, m.index) + m[1]) + (/application\/ld\+json/.test(m[1]) ? f(m[2]) : m[2]);
    i = m.index + m[1].length + m[2].length;
  }
  return out + f(s.slice(i));
}

// ---- une page --------------------------------------------------------------
function pageTraduite(p, lang, cfg, src) {
  const nomPage = `${p.source} (${lang})`;
  const fichier = `${cfg.dossier}index.html`;
  const prefixe = '../'.repeat(cfg.dossier.split('/').filter(Boolean).length);
  let s = src;
  s = s.replace(/<html([^>]*)\slang="fr"/, `<html$1 lang="${hreflangDeCode(lang)}"`);

  // 1 et 2 — pages À DICTIONNAIRE (étape 1) : la langue fixée, et le texte que
  // le script pose écrit en dur. Une page sans dictionnaire (étape 2) passe
  // directement à sa table de textes.
  if (p.langue) {
    const UI = dictionnaire(src, p.source);
    if (!UI[lang]) throw new Error(`${nomPage} : le dictionnaire n'a pas de langue « ${lang} »`);
    const t = (k) => (UI[lang][k] !== undefined ? UI[lang][k] : UI.fr[k]);
    if (!s.includes(p.langue)) throw new Error(`${nomPage} : la ligne « ${p.langue} » est absente`);
    s = s.replace(p.langue, `let LANG = '${lang}'; // page ${hreflangDeCode(lang)} (scripts/build-outils-langues.js)`);
    for (const k of Object.keys(UI.fr)) {
      if (s.includes(`data-i18n="${k}"`)) s = ecrire(s, `data-i18n="${k}"`, 'text', t(k), nomPage);
      if (s.includes(`data-i18n-html="${k}"`)) s = ecrire(s, `data-i18n-html="${k}"`, 'html', t(k), nomPage);
    }
    for (const [id, cible, k] of affectations(corpsFonction(src, 'applyUILang'))) {
      if (UI.fr[k] === undefined) continue;
      s = ecrire(s, `id="${id}"`, cible, t(k), nomPage);
    }
    for (const [id, cible, k] of p.affectations || []) s = ecrire(s, `id="${id}"`, cible, t(k), nomPage);
  }

  // 2 bis — les tableaux de données du script, depuis leur traduction existante
  s = donneesTraduites(s, p, lang, nomPage);

  // 3. les textes hors dictionnaire : la table de la page (une ligne, ses
  // traductions — étape 2) puis les remplacements propres à la langue. Chaque
  // texte français doit être présent ; les plus longs passent d'abord, pour
  // qu'un texte court contenu dans un long ne le coupe pas.
  // la table vit dans le fichier de données, ou dans un fichier à part
  // (data/outils-langues/<page>.json) quand elle est longue
  const textes = typeof p.textes === 'string' ? JSON.parse(fs.readFileSync(path.join(ROOT, p.textes), 'utf8')).textes : (p.textes || []);
  const table = textes.map((r) => {
    if (r[lang] === undefined) throw new Error(`${nomPage} : pas de traduction « ${lang} » pour « ${r.fr.slice(0, 80)} »`);
    return { fr: r.fr, trad: r[lang] };
  }).sort((a, b) => b.fr.length - a.fr.length);
  // les textes communs (fil d'Ariane) : appliqués là où ils se trouvent
  // — hors du code des scripts (les données structurées comprises) : un
  // dictionnaire UI.fr garde son français, c'est le repli de la page
  for (const r of DONNEES.communs || []) {
    if (r[lang] === undefined || !s.includes(r.fr)) continue;
    s = horsCode(s, (morceau) => morceau.split(r.fr).join(r[lang]));
  }
  for (const r of [...table, ...(cfg.remplacements || [])]) {
    if (!s.includes(r.fr)) throw new Error(`${nomPage} : texte français introuvable, la traduction a dérivé : « ${r.fr.slice(0, 80)} »`);
    s = s.split(r.fr).join(r.trad);
  }
  // la phrase canonique des langues du site, quand la page la porte, dans sa langue
  s = s.replace(/(<!-- @couverture:start[^>]*-->)[\s\S]*?(<!-- @couverture:end -->)/, (m, a, b) => a + phrase(lang) + b);
  s = s.replace(/<meta property="og:locale" content="fr_FR">/, `<meta property="og:locale" content="${cfg.ogLocale}">`);

  // 4. l'adresse propre
  s = s.split(`${SITE}/${p.source}`).join(`${SITE}/${cfg.dossier}`);

  // 5. les boutons de langue deviennent des liens
  s = s.replace(/<button type="button" class="app-lang-btn" data-lang="([a-z]{2})">([^<]*)<\/button>/g, (m, l, txt) => {
    const cible = l === 'fr' ? p.source : p.langues[l] && p.langues[l].dossier;
    if (!cible) return '';
    const courant = l === lang ? ' active" aria-current="page' : '';
    return `<a class="app-lang-btn${courant}" href="${cible}" hreflang="${hreflangDeCode(l)}" lang="${hreflangDeCode(l)}">${txt}</a>`;
  });

  // 6. les chemins
  s = prefixer(s, prefixe, lang);
  // un lien vers une page restée dans une autre langue le dit avant le clic
  s = horsCode(s, (x) => annoncerLiens(x, lang, fichier));
  return [fichier, s];
}

// Une page à politique de sécurité du contenu (l'encodeur) n'autorise ses
// scripts en ligne que par leur empreinte SHA-256 : la traduction et les
// chemins préfixés changent ces scripts, la politique est donc recalculée sur
// la page finale. Même calcul que tools/check_csp.mjs, qui le refait de son
// côté sur ces pages et échoue si la balise est périmée.
const BALISE_CSP = /(<meta http-equiv="Content-Security-Policy" content="[^"]*script-src 'self')((?: 'sha256-[A-Za-z0-9+/=]+')*)/;
function avecCsp(html) {
  if (!BALISE_CSP.test(html)) return html;
  const empreintes = [];
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || '';
    if (/\ssrc\s*=/.test(attrs)) continue;
    const type = (/\stype\s*=\s*"([^"]*)"/i.exec(attrs) || [, ''])[1];
    if (!/^(|text\/javascript|application\/javascript|module)$/i.test(type)) continue;
    const e = `'sha256-${crypto.createHash('sha256').update(m[2].replace(/\r\n?/g, '\n'), 'utf8').digest('base64')}'`;
    if (!empreintes.includes(e)) empreintes.push(e);
  }
  return html.replace(BALISE_CSP, (m, debut) => `${debut}${empreintes.map((e) => ` ${e}`).join('')}`);
}

function pages() {
  const { traiter } = require('./build-header.js');
  const out = [];
  for (const p of DONNEES.pages) {
    const src = fs.readFileSync(path.join(ROOT, p.source), 'utf8');
    for (const [lang, cfg] of Object.entries(p.langues)) {
      if (!LANGUES[lang]) throw new Error(`${p.source} : langue inconnue « ${lang} »`);
      const [fichier, brut] = pageTraduite(p, lang, cfg, src);
      out.push([fichier, avecCsp(traiter(fichier, brut))]);
    }
  }
  return out;
}

module.exports = { DONNEES };
if (require.main !== module) return;

const verifie = process.argv.includes('--verifie');
const perimees = [];
for (const [fichier, html] of pages()) {
  const abs = path.join(ROOT, fichier);
  const avant = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (avant === html) continue;
  perimees.push(fichier);
  if (!verifie) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, html); }
}
if (verifie) {
  if (perimees.length) {
    console.error(`${perimees.length} page(s) d'outils traduites ne correspondent pas à leur source :`);
    for (const f of perimees) console.error(`   ${f}`);
    console.error('\nRelancer : node scripts/build-outils-langues.js');
    process.exit(1);
  }
  console.log(`Pages d'outils traduites à jour (${DONNEES.pages.reduce((n, p) => n + Object.keys(p.langues).length, 0)}).`);
} else {
  console.log(`${perimees.length} page(s) d'outils traduites écrite(s).`);
}
