// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// hexagram-titres.js — le titre d'une page d'hexagramme : le numéro King Wen (le numéro TRADITIONNEL, celui que les gens cherchent) d'abord,
// le numéro du site ensuite (prompt 205 : la Search Console montre des impressions pour « hexagrama 56 », « 43 », « 42 »… alors que la page 56 du site est
// Pi, le n° 12 de King Wen). Partagé par generate-hexagram-pages.js (fr), generate-hexagram-pages-traduites.js (en, es, th, de, it, ja) et
// tools/check_hexagrammes_deux_numeros.mjs (les libellés du « numéro du site » y servent à lire l'ordre).
//
//   titre(lang, c, pinyin, nom, kw)      « Hexagrama 12 — Pi, El Estancamiento (n.º 56 del sitio) »        h1, fil d'Ariane, listes
//   nomCourt(lang, c, nom, kw)           « Hexagrama 12 — El Estancamiento (n.º 56 del sitio) »            fil d'Ariane, DefinedTerm
//   titreMeta(lang, …)                   le titre suivi de « | La Livrée d'Hermès » ; en écriture latine ou cyrillique, le nom du site est retiré
//                                        d'abord (jamais le numéro, jamais le nom de l'hexagramme) quand le tout dépasse 60 caractères
//   enTete(lang, c, pinyin, nom, kw)     « Hexagrama 12 (Pi, El Estancamiento ; n.º 56 del sitio) » : le début de la meta description
//   lien(lang, c, pinyin, nom, kw)       « 12 — Pi, El Estancamiento (n.º 56 del sitio) » : le texte d'un lien « Voir aussi »
'use strict';

const SITE_NOM = "La Livrée d'Hermès", MAX = 60;

// mot « hexagramme » et libellé « numéro du site » de chaque langue (ceux de leurs textes : colonnes « N° (site) » des tables, article-sub)
const L = {
  fr: { mot: 'Hexagramme', site: (c) => `n° ${c} du site`, latin: true },
  en: { mot: 'Hexagram', site: (c) => `no. ${c} on this site`, latin: true },
  es: { mot: 'Hexagrama', site: (c) => `n.º ${c} del sitio`, latin: true },
  de: { mot: 'Hexagramm', site: (c) => `Nr. ${c} der Website`, latin: true },
  it: { mot: 'Esagramma', site: (c) => `n. ${c} del sito`, latin: true },
  th: { mot: 'ฉักลักษณ์ที่', site: (c) => `เลขของเว็บไซต์ ${c}`, latin: false },
  ja: { mot: '卦', site: (c) => `サイトの番号 ${c}`, latin: false, cjk: true },
};

const long = (s) => [...s].length;

function titre(lang, c, p, n, kw) {
  const l = L[lang];
  return l.cjk ? `${l.mot} ${kw} — ${p}、${n}（${l.site(c)}）` : `${l.mot} ${kw} — ${p}, ${n} (${l.site(c)})`;
}
function nomCourt(lang, c, n, kw) {
  const l = L[lang];
  return l.cjk ? `${l.mot} ${kw} — ${n}（${l.site(c)}）` : `${l.mot} ${kw} — ${n} (${l.site(c)})`;
}
function titreMeta(lang, c, p, n, kw) {
  const t = titre(lang, c, p, n, kw), avec = `${t} | ${SITE_NOM}`;
  return L[lang].latin && long(avec) > MAX ? t : avec;
}
function enTete(lang, c, p, n, kw) {
  const l = L[lang];
  return l.cjk ? `${l.mot} ${kw}（${p}、${n}；${l.site(c)}）` : `${l.mot} ${kw} (${p}, ${n}${lang === 'fr' ? ' ;' : ';'} ${l.site(c)})`;
}
function lien(lang, c, p, n, kw) {
  const l = L[lang];
  return l.cjk ? `${kw} — ${p}、${n}（${l.site(c)}）` : `${kw} — ${p}, ${n} (${l.site(c)})`;
}
// pour le contrôle : le libellé du numéro du site, sous forme d'expression régulière à capturer (le numéro du site)
const motifSite = (lang) => {
  const marque = L[lang].site('\u0000').split('\u0000').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`${marque[0]}(\\d{1,2})${marque[1]}`);
};

module.exports = { SITE_NOM, MAX, L, titre, nomCourt, titreMeta, enTete, lien, motifSite };
