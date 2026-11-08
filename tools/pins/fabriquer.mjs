#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// fabriquer.mjs — la fabrique d'images d'épingles Pinterest des motifs bicolores (ordre 30, puis ordre 18), en local.
//
// Pour chaque motif, deux PNG verticaux 2:3 : la TUILE (la cellule seule, centrée sur le fond crème du site, 1000 × 1500) et le PAVAGE continu par
// translation (jamais de miroir), fait AVEC cette cellule et jamais avec une fenêtre plus large qu'elle : une seule tuile en largeur, c'est la fenêtre
// « 4 × l'ordre » des pages validées (2 × l'ordre cases de large). Ordre 30 : cellule de 60 × 60 cases, 17 points par case, pavage de 60 × 90 cases,
// 1020 × 1530. Ordre 18 : cellule de 36 × 36 cases, 28 points par case, pavage de 36 × 54 cases, 1008 × 1512. Un nombre entier de points par case, aucun
// rééchantillonnage ; l'image est centrée sur le centre de symétrie de la cellule, comme les vignettes de la page. Un bandeau discret en bas,
// « anibal-amiot.com · CC BY-NC 4.0 », et aucune autre inscription. Le rendu est celui de la galerie et de « Voir sa musique »
// (assets/musique-chladni-moteur.js : bande B2, état 0 = état 1 tourné de 90°, encre sur crème de assets/couleurs.js). Rien n'est envoyé nulle part :
// les fichiers restent dans pins/ (ignoré par git).
//
// Nommage déductible de l'identifiant : pins/o30/<id>-tuile.png, pins/o30/<id>-pavage.png (idem pins/o18/). Fichiers d'état et de textes : pins/etat.json,
// pins/textes.json (un titre anglais distinct par épingle ; description anglaise puis une phrase française ; lien vers la Galerie bicolore avec l'ancre).
// Publication : 12 par jour. Ordre 30 : la tuile d'un motif vient 7 jours au moins après son pavage. Ordre 18 : de même (7 jours), les collections alternées (aucun motif voisin ne suit). Un pas premier avec l'effectif écarte les voisins de la chaîne de proximité.
//
// Usage : node tools/pins/fabriquer.mjs --ordre 30 --lot-essai    les 6 premiers motifs de l'ordre 30, en tuile et en pavage (12 images)
//         node tools/pins/fabriquer.mjs --ordre 18 --lot-essai    3 motifs de 3 collections, en cellule et en pavage (6 images)
//         node tools/pins/fabriquer.mjs --ordre 30 --verifie      vérifie le lot (dimensions, cases carrées, titres distincts, ancres ; à l'ordre 18, la cellule
//                                                                 est celle de la vignette de « Voir sa musique », pixel pour pixel)
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../lib_fonds_site.mjs';
import * as M from '../../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SORTIE = path.join(ROOT, 'pins');
const PAGE_GALERIE = 'https://anibal-amiot.com/galerie-bicolore.html';
const args = process.argv.slice(2), verifie = args.includes('--verifie');
const ORDRE = Number((args[args.indexOf('--ordre') + 1]) || 30);
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const PAR_JOUR = 12, JPEG = null;
const CONF = {
  30: { g: 60, pxTuile: 13, pxPavage: 17, casesH: 90, collections: ['p30'], ecartJours: 7, tableau: { pavage: 'Seamless Patterns 30', tuile: 'Geometric tiles 30' }, tailleLot: 6, pas: 37 },
  18: { g: 36, pxTuile: 22, pxPavage: 28, casesH: 54, collections: ['b1971128', 'b16012838', 'b3016090', 'f613', 'f18', 'fpilote', 'p18'], ecartJours: 7, tableau: { pavage: 'Seamless Patterns 18', tuile: 'Geometric Tiles 18' }, tailleLot: 3, pas: 7 },
};
const C = CONF[ORDRE];
if (!C) { console.error('--ordre 30 ou 18'); process.exit(2); }
const LP = C.g * C.pxPavage, HP = C.casesH * C.pxPavage, LT = 1000, HT = 1500; // le pavage : 1020 × 1530 (ordre 30), 1008 × 1512 (ordre 18) ; la tuile : 1000 × 1500

// ---------- le plan : les motifs de l'ordre, leur rang, leurs textes ----------
const jb = lire(`data/musique-chladni/bloc-${ORDRE}-structure.json`), defs = { collections1830: lire('data/musique-chladni/collections-18-30.json'), sym12: { indices: [] }, centrale12: { indices: [] } };
const colonnes = M.definirCollections(ORDRE, defs);
const blocs = new Map(C.collections.map((id) => [id, M.preparerBlocStructure(jb, { id, indices: colonnes.find((d) => d.id === id).indices })]));
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
// par collection, les motifs de la chaîne de proximité parcourue d'un pas premier avec l'effectif ; les collections sont alternées
const parCol = C.collections.map((id) => { const b = blocs.get(id); let pas = C.pas; while (pgcd(pas, b.n) !== 1) pas++; return Array.from({ length: b.n }, (_, k) => ({ id: b.ids[b.chain[(k * pas) % b.n]], j: b.chain[(k * pas) % b.n], col: id })); });
const motifs = []; for (let k = 0; k < Math.max(...parCol.map((l) => l.length)); k++) for (const l of parCol) if (l[k]) motifs.push(l[k]);
const N = motifs.length, pins = [];
// 12 par jour ; chaque jour : jusqu'à 6 cellules dont le pavage est sorti 7 jours au moins plus tôt, le reste en pavages (puis, une fois les pavages épuisés, des cellules)
{
  const jourPavage = new Map(); let ip = 0, ic = 0;
  const eligible = (jour) => ic < N && jourPavage.has(motifs[ic].id) && jourPavage.get(motifs[ic].id) <= jour - C.ecartJours;
  for (let jour = 1; ip < N || ic < N; jour++) {
    const duJour = []; let cellules = 0;
    while (cellules < (ip < N ? PAR_JOUR / 2 : PAR_JOUR) && eligible(jour)) { duJour.push({ ...motifs[ic], type: 'tuile' }); ic++; cellules++; }
    while (duJour.length < PAR_JOUR && ip < N) { duJour.push({ ...motifs[ip], type: 'pavage' }); jourPavage.set(motifs[ip].id, jour); ip++; }
    while (duJour.length < PAR_JOUR && eligible(jour)) { duJour.push({ ...motifs[ic], type: 'tuile' }); ic++; }
    for (const p of duJour) pins.push({ ...p, rang: pins.length, jour });
  }
}
for (const p of pins) p.fichier = `o${ORDRE}/${p.id}-${p.type}.png`;
const cases = `${C.g} × ${C.g}`;
const textes = pins.map((p) => {
  const pav = p.type === 'pavage', lien = `${PAGE_GALERIE}#${p.id}`;
  const titre = pav ? `Geometric seamless pattern · order ${ORDRE} · ${p.id} · bicolor` : `Geometric tile · order ${ORDRE} · ${p.id} · bicolor`;
  const description = (pav
    ? `Geometric seamless pattern, order ${ORDRE}, ${p.id}: a bicolor Jacquard tile of ${cases} cells, repeated by translation without mirrors, from La Livrée d'Hermès. CC BY-NC 4.0. See it in the gallery: ${lien}`
    : `Geometric tile, order ${ORDRE}, ${p.id}: one ${cases} cell bicolor Jacquard tile of the seamless pattern from La Livrée d'Hermès. CC BY-NC 4.0. See it in the gallery: ${lien}`)
    + (pav ? ` Motif géométrique bicolore pour Jacquard, ordre ${ORDRE} : pavage continu, sans miroir.` : ` Tuile géométrique bicolore pour Jacquard, ordre ${ORDRE} : la cellule seule.`);
  return { ordre: ORDRE, fichier: p.fichier, id: p.id, collection: p.col, type: p.type, rang: p.rang, jour: p.jour, tableau: C.tableau[p.type], titre, description, lien };
});

// ---------- le lot d'essai ----------
const lot = [];
if (ORDRE === 30) { for (let k = 0; k < C.tailleLot; k++) { lot.push(pins.find((p) => p.type === 'tuile' && p.id === motifs[k].id)); lot.push(pins.find((p) => p.type === 'pavage' && p.id === motifs[k].id)); } }
else { for (const id of ['b1971128', 'f613', 'p18']) { const m = motifs.find((x) => x.col === id); lot.push(pins.find((p) => p.type === 'tuile' && p.id === m.id)); lot.push(pins.find((p) => p.type === 'pavage' && p.id === m.id)); } }
const lotTextes = lot.map((p) => textes.find((t) => t.fichier === p.fichier));
const nomLot = ORDRE === 30 ? 'lot-essai-12' : 'lot-essai-18-6', nomPlanche = ORDRE === 30 ? 'planche-contact-12.png' : 'planche-contact-18-6.png';

// ---------- le rendu, dans Chromium (canvas, texte du bandeau, PNG) ----------
const RENDU = `async (spec) => {
  const M = await import('/assets/musique-chladni-moteur.js'), { chargerCollection, rasteriser } = await import('/assets/bicolore-fonds.js'), { PALETTES } = await import('/assets/couleurs.js');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [jb, jColl, jCalc, defs] = await Promise.all([spec.fichierBloc, 'data/fonds/collection-v1.json', 'data/fonds/collection-v1.calculs.json', 'data/musique-chladni/collections-18-30.json'].map((u) => fetch('/' + u).then((r) => r.json())));
  const coll = chargerCollection(jColl, { calculs: jCalc }), etats = M.etatsDeCase(Uint8Array.from(rasteriser(coll.fonds.get(M.BANDE_DEFAUT), 0, 60), (x) => (x === 1 ? 1 : 0)), 60);
  const blocs = {}; for (const id of spec.collections) blocs[id] = M.preparerBlocStructure(jb, { id, indices: M.definirCollections(spec.ordre, { collections1830: defs, sym12: { indices: [] }, centrale12: { indices: [] } }).find((d) => d.id === id).indices });
  const ink = rgb(PALETTES.creme[1]), fond = rgb(PALETTES.creme[0]);
  const tuile = (col, j, T) => { const A = M.masqueBicolore(blocs[col], j, etats, T), c = document.createElement('canvas'); c.width = c.height = T; const x = c.getContext('2d'), im = x.createImageData(T, T), d = im.data;
    for (let i = 0; i < T * T; i++) { const k = A[i] / 255; d[i * 4] = fond[0] + (ink[0] - fond[0]) * k; d[i * 4 + 1] = fond[1] + (ink[1] - fond[1]) * k; d[i * 4 + 2] = fond[2] + (ink[2] - fond[2]) * k; d[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); return c; };
  const bandeau = (x, L, H) => { const h = 64; x.fillStyle = 'rgba(' + ink.join(',') + ',0.55)'; x.fillRect(0, H - h, L, h); x.fillStyle = 'rgb(' + fond.join(',') + ')'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '600 26px system-ui, sans-serif'; x.fillText('anibal-amiot.com · CC BY-NC 4.0', L / 2, H - h / 2); };
  const image = (p) => {
    const c = document.createElement('canvas'), x = c.getContext('2d'); let L, H, pas, tp;
    if (p.type === 'tuile') { L = spec.LT; H = spec.HT; c.width = L; c.height = H; x.fillStyle = 'rgb(' + fond.join(',') + ')'; x.fillRect(0, 0, L, H); const tc = tuile(p.col, p.j, spec.g * spec.pxTuile); tp = tc.width; pas = tc.width / blocs[p.col].grid; x.drawImage(tc, Math.round((L - tc.width) / 2), Math.round((H - 64 - tc.height) / 2)); }
    else { L = spec.LP; H = spec.HP; c.width = L; c.height = H; x.fillStyle = 'rgb(' + fond.join(',') + ')'; x.fillRect(0, 0, L, H); const t = tuile(p.col, p.j, spec.g * spec.pxPavage), T = t.width; tp = T; pas = T / blocs[p.col].grid; const base = Math.round((H - T) / 2); // une seule cellule en largeur, centrée sur son centre de symétrie
      for (let k = -2; k <= 2; k++) x.drawImage(t, 0, base + k * T); }
    bandeau(x, L, H); c.__mesure = { fichier: p.fichier, type: p.type, ordre: spec.ordre, largeur: c.width, hauteur: c.height, casesTuile: blocs[p.col].grid, pasPixels: pas, pasEntier: Number.isInteger(pas), tuilePixels: tp, casesParCoteLargeur: p.type === 'pavage' ? c.width / pas : blocs[p.col].grid, casesParCoteHauteur: p.type === 'pavage' ? c.height / pas : blocs[p.col].grid }; return c; };
  const sortie = [], toiles = [];
  for (const p of spec.pins) { const c = image(p); toiles.push(c); sortie.push({ fichier: p.fichier, mesure: c.__mesure, png: c.toDataURL('image/png').split(',')[1] }); }
  // la planche contact : colonnes de vignettes de hauteur 375, une ligne d'étiquette sous chacune
  const h = 375, e = 22, cols = spec.colonnes, lignes = Math.ceil(toiles.length / cols), ws = toiles.map((c) => Math.round(h * c.width / c.height)), w = Math.max(...ws);
  const pl = document.createElement('canvas'); pl.width = cols * w + (cols + 1) * 10; pl.height = lignes * (h + e) + (lignes + 1) * 10; const px = pl.getContext('2d');
  px.fillStyle = '#111'; px.fillRect(0, 0, pl.width, pl.height); px.font = '11px system-ui, sans-serif'; px.fillStyle = '#ddd'; px.textAlign = 'left'; px.textBaseline = 'middle';
  toiles.forEach((c, i) => { const X = 10 + (i % cols) * (w + 10), Y = 10 + Math.floor(i / cols) * (h + e + 10); px.drawImage(c, X, Y, ws[i], h); px.fillText(spec.pins[i].fichier.replace(/^o\\d+\\//, '') + ' (' + c.width + ' × ' + c.height + ')', X + 2, Y + h + e / 2); });
  return { images: sortie, planche: pl.toDataURL('image/png').split(',')[1] };
}`;

// la même préparation que RENDU, dans la page « Voir sa musique » : la cellule de la fabrique contre celle de la vignette (T = 360), valeur pour valeur
const COMPARER = `async (spec) => {
  const M = await import('/assets/musique-chladni-moteur.js'), { chargerCollection, rasteriser } = await import('/assets/bicolore-fonds.js'), { PALETTES } = await import('/assets/couleurs.js');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [jb, jColl, jCalc, defs] = await Promise.all([spec.fichierBloc, 'data/fonds/collection-v1.json', 'data/fonds/collection-v1.calculs.json', 'data/musique-chladni/collections-18-30.json'].map((u) => fetch('/' + u).then((r) => r.json())));
  const coll = chargerCollection(jColl, { calculs: jCalc }), etats = M.etatsDeCase(Uint8Array.from(rasteriser(coll.fonds.get(M.BANDE_DEFAUT), 0, 60), (x) => (x === 1 ? 1 : 0)), 60);
  const bloc = M.preparerBlocStructure(jb, { id: spec.col, indices: M.definirCollections(spec.ordre, { collections1830: defs, sym12: { indices: [] }, centrale12: { indices: [] } }).find((d) => d.id === spec.col).indices });
  const ink = rgb(PALETTES.creme[1]), fond = rgb(PALETTES.creme[0]), T = 360, j = bloc.ids.indexOf(spec.ident);
  const A = M.masqueBicolore(bloc, j, etats, T), mine = new Uint8ClampedArray(T * T * 4);
  for (let i = 0; i < T * T; i++) { const k = A[i] / 255; mine[i * 4] = fond[0] + (ink[0] - fond[0]) * k; mine[i * 4 + 1] = fond[1] + (ink[1] - fond[1]) * k; mine[i * 4 + 2] = fond[2] + (ink[2] - fond[2]) * k; mine[i * 4 + 3] = 255; }
  const S = window.__voirSaMusique.S, jPage = S.blocs.get(spec.col).ids.indexOf(spec.ident);
  const page = window.__voirSaMusique.tuile(spec.col, jPage, 'pavage', 'B2', { mode: 'image', fmt: 18, col: spec.col, view: 'pavage', fond: 'B2', pal: 'creme' }, T).getContext('2d').getImageData(0, 0, T, T).data;
  let diff = 0; for (let i = 0; i < mine.length; i++) if (mine[i] !== page[i]) diff++;
  return { diff, n: mine.length, memeIndice: j === jPage };
}`;

const ecrire = (rel, contenu) => { const f = path.join(SORTIE, rel); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, contenu); return f; };
const csv = (lignes, cols) => [cols.join(';'), ...lignes.map((l) => cols.map((c) => `"${String(l[c]).replace(/"/g, '""')}"`).join(';'))].join('\n') + '\n';
const ouvrirPage = async (serveur, nav) => { const page = await nav.newPage({ viewport: { width: 1100, height: 900 } }); await page.goto(`${serveur.url}/includes/head-icons.html`); return page; };

// ---------- un lot de jours : les images d'un lot, le manifeste de programmation, la vérification ----------
// node tools/pins/fabriquer.mjs --ordre 30 --lot-jours 1-7 --debut 2026-11-12 --nom lot-01
// Les épingles du plan dont le jour est dans l'intervalle, dans l'ordre de publication : pins/<nom>/<id>-<type>.png, manifeste-<nom>.json (la date, le rang dans la
// journée — jamais l'heure —, le tableau, l'adresse brute de l'image, le titre, la description en français, le texte alternatif en anglais, le lien et le motif).
const pngDeLot = (nom, f) => { const fp = path.join(SORTIE, nom, f); return existsSync(fp) ? readFileSync(fp) : null; };
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
if (opt('--lot-jours')) {
  const [j1, j2] = opt('--lot-jours').split('-').map(Number), debut = opt('--debut'), nom = opt('--nom') || 'lot-01', DEPOT = 'anibaledel/motifs-pins';
  const sel = pins.filter((p) => p.jour >= j1 && p.jour <= j2).sort((a, b) => a.rang - b.rang);
  const dateDuJour = (jour) => { const d = new Date(`${debut}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + jour - j1); return d.toISOString().slice(0, 10); };
  const parJour = {}; const entrees = sel.map((p) => {
    parJour[p.jour] = (parJour[p.jour] || 0) + 1; const t = textes.find((x) => x.fichier === p.fichier), pav = p.type === 'pavage', fichier = `${p.id}-${p.type}.png`;
    return {
      date: dateDuJour(p.jour), rang: parJour[p.jour], tableau: t.tableau, url_image: `https://raw.githubusercontent.com/${DEPOT}/main/${nom}/${fichier}`, titre: t.titre,
      description: pav
        ? `Motif géométrique bicolore sans couture, ordre ${ORDRE}, ${p.id} : une tuile Jacquard de ${cases} cases répétée par translation, sans miroir, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir dans la galerie : ${t.lien}`
        : `Tuile géométrique bicolore, ordre ${ORDRE}, ${p.id} : une tuile Jacquard de ${cases} cases, motif de base à répéter, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir dans la galerie : ${t.lien}`,
      texte_alternatif: pav
        ? `Black and cream geometric seamless pattern, order ${ORDRE}, ${p.id}: a ${cases} cell bicolor Jacquard tile repeated by translation.`
        : `Black and cream geometric tile, order ${ORDRE}, ${p.id}: a single ${cases} cell bicolor Jacquard tile on a cream background.`,
      lien: t.lien, motif_id: p.id, type: p.type, ordre: ORDRE, fichier,
    };
  });
  const serveur = await servirDepot(ROOT), nav = await chromium.launch(); const mes = [];
  try {
    const page = await ouvrirPage(serveur, nav);
    const spec = { ordre: ORDRE, g: C.g, pxTuile: C.pxTuile, pxPavage: C.pxPavage, LT, HT, LP, HP, collections: C.collections, fichierBloc: `data/musique-chladni/bloc-${ORDRE}-structure.json`, colonnes: 4, pins: sel.map((p) => ({ id: p.id, j: p.j, col: p.col, type: p.type, fichier: `${p.id}-${p.type}.png` })) };
    const r = await page.evaluate(`(${RENDU})(${JSON.stringify(spec)})`);
    for (const im of r.images) { ecrire(`${nom}/${im.fichier}`, Buffer.from(im.png, 'base64')); mes.push(im.mesure); }
    ecrire(`manifeste-${nom}.json`, JSON.stringify({ lot: nom, depot: DEPOT, ordre: ORDRE, du: dateDuJour(j1), au: dateDuJour(j2), par_jour: PAR_JOUR, epingles: entrees }, null, 1) + '\n');
    ecrire(`${nom}/manifeste-${nom}.json`, JSON.stringify({ lot: nom, depot: DEPOT, ordre: ORDRE, du: dateDuJour(j1), au: dateDuJour(j2), par_jour: PAR_JOUR, epingles: entrees }, null, 1) + '\n');
    // la vérification du lot : fichiers, dimensions, pas entier, titres, jours, ancres de la Galerie bicolore
    const bad = [];
    for (const e of entrees) { const b = pngDeLot(nom, e.fichier), d = b && b.readUInt32BE(12) === 0x49484452 ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null, [L, H] = e.type === 'tuile' ? [LT, HT] : [LP, HP]; if (!(d && d[0] === L && d[1] === H)) bad.push(`${e.fichier} : ${d ? d.join(' × ') : 'absent'}`); }
    for (const m of mes) if (!(m.pasEntier && m.casesTuile === C.g)) bad.push(`${m.fichier} : pas ${m.pasPixels}, ${m.casesTuile} cases`);
    if (new Set(entrees.map((e) => e.titre)).size !== entrees.length) bad.push('titres en double');
    if (Object.entries(parJour).some(([j, n]) => n > PAR_JOUR || (n < PAR_JOUR && Number(j) < j2))) bad.push(`jours incomplets : ${JSON.stringify(parJour)}`); // seul le dernier jour du lot peut avoir moins de 12 épingles
    let ancresOk = 0; for (const e of entrees) { await page.goto(`${serveur.url}/galerie-bicolore.html#${e.motif_id}`); try { await page.waitForFunction(([i, o]) => !!document.getElementById(i) && window.__galerieOrdres && window.__galerieOrdres.etat().ordre === o, [e.motif_id, ORDRE], { timeout: 30000 }); ancresOk++; } catch { bad.push(`ancre #${e.motif_id}`); } }
    if (bad.length) { for (const b of bad) console.error('ÉCHEC ' + b); process.exit(1); }
    const octets = entrees.reduce((a, e) => a + pngDeLot(nom, e.fichier).length, 0), parTab = {}; for (const e of entrees) parTab[e.tableau] = (parTab[e.tableau] || 0) + 1;
    console.log(`${nom} : ${entrees.length} épingles du ${dateDuJour(j1)} au ${dateDuJour(j2)} (${JSON.stringify(parJour)}), par tableau ${JSON.stringify(parTab)}, ${(octets / 1e6).toFixed(2)} Mo, pas entiers, titres distincts, ${ancresOk} ancres ouvertes sur l'ordre ${ORDRE}.`);
  } finally { await nav.close(); if (serveur.fermer) serveur.fermer(); }
  process.exit(0);
}

const mesures = [];
if (!verifie) {
  const serveur = await servirDepot(ROOT), nav = await chromium.launch();
  try {
    const page = await ouvrirPage(serveur, nav);
    const spec = { ordre: ORDRE, g: C.g, pxTuile: C.pxTuile, pxPavage: C.pxPavage, LT, HT, LP, HP, collections: C.collections, fichierBloc: `data/musique-chladni/bloc-${ORDRE}-structure.json`, colonnes: ORDRE === 30 ? 4 : 3, pins: lot.map((p) => ({ id: p.id, j: p.j, col: p.col, type: p.type, fichier: p.fichier })) };
    const r = await page.evaluate(`(${RENDU})(${JSON.stringify(spec)})`);
    for (const im of r.images) ecrire(im.fichier, Buffer.from(im.png, 'base64'));
    mesures.push(...r.images.map((im) => im.mesure));
    ecrire(nomPlanche, Buffer.from(r.planche, 'base64'));
  } finally { await nav.close(); if (serveur.fermer) serveur.fermer(); }
  // le fichier d'état : toutes les épingles planifiées, tous les ordres déjà planifiés ; celles du lot sont « prête », les autres « a_fabriquer »
  const etatPath = path.join(SORTIE, 'etat.json'), textesPath = path.join(SORTIE, 'textes.json');
  const etat = existsSync(etatPath) ? JSON.parse(readFileSync(etatPath, 'utf8')) : { epingles: [] }, tx = existsSync(textesPath) ? JSON.parse(readFileSync(textesPath, 'utf8')) : { epingles: [] };
  const prets = new Set(lot.map((p) => p.fichier));
  etat.epingles = [...etat.epingles.filter((e) => e.ordre !== ORDRE), ...pins.map((p) => ({ ordre: ORDRE, fichier: p.fichier, rang: p.rang, jour: p.jour, tableau: C.tableau[p.type], etat: prets.has(p.fichier) ? 'prete' : 'a_fabriquer', date: null }))].sort((a, b) => a.ordre - b.ordre || a.rang - b.rang);
  tx.epingles = [...tx.epingles.filter((e) => e.ordre !== ORDRE), ...textes].sort((a, b) => a.ordre - b.ordre || a.rang - b.rang);
  ecrire('etat.json', JSON.stringify({ _doc: 'État de chaque épingle : a_fabriquer, prete, programmee, publiee ; date : AAAA-MM-JJ de la programmation ou de la publication, sinon null. C\'est ce fichier qui évite tout doublon. « tableau » : le nom exact du tableau Pinterest (l\'identifiant numérique est résolu côté Metricool).', par_jour: PAR_JOUR, epingles: etat.epingles }, null, 1) + '\n');
  ecrire('textes.json', JSON.stringify({ _doc: 'Textes des épingles (générés par tools/pins/fabriquer.mjs) : un titre anglais distinct par épingle.', epingles: tx.epingles }, null, 1) + '\n');
  const ctrlPath = path.join(SORTIE, 'controle-cases.json'), ctrl = existsSync(ctrlPath) ? JSON.parse(readFileSync(ctrlPath, 'utf8')) : { images: [] };
  ctrl.images = [...ctrl.images.filter((m) => m.ordre !== ORDRE), ...mesures].sort((a, b) => a.ordre - b.ordre || a.fichier.localeCompare(b.fichier));
  ecrire('controle-cases.json', JSON.stringify({ _doc: 'Pour chaque image du lot : le nombre de cases (tuile : la cellule entière ; pavage : cases par côté), le pas en points par case et la taille de l\'image, calculés à partir de la sortie du rendu (la cellule réellement dessinée), non estimés sur l\'image. pasEntier : un nombre entier de points par case, sans rééchantillonnage.', images: ctrl.images }, null, 1) + '\n');
  ecrire(`${nomLot}.json`, JSON.stringify(lotTextes, null, 1) + '\n');
  ecrire(`${nomLot}.csv`, csv(lotTextes, ['fichier', 'tableau', 'titre', 'lien', 'rang', 'jour', 'description']));
  console.log(`Ordre ${ORDRE} : ${lot.length} images dans ${SORTIE}/o${ORDRE}/, ${nomPlanche}, etat.json (${etat.epingles.length} épingles planifiées), textes.json, ${nomLot}.json et .csv. Rien n'est poussé.`);
}

// ---------- la vérification du lot ----------
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
const pngDe = (rel) => { const f = path.join(SORTIE, rel); return existsSync(f) ? readFileSync(f) : null; };
const dim = (b) => (b && b.readUInt32BE(12) === 0x49484452 ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null);
const tailles = [];
for (const p of lot) { const b = pngDe(p.fichier), d = dim(b), [L, H] = p.type === 'tuile' ? [LT, HT] : [LP, HP]; if (b) tailles.push(b.length); ok(d && d[0] === L && d[1] === H, `${p.fichier} : ${d ? d.join(' × ') : 'absent'}, ${L} × ${H} attendus`); }
const tous = existsSync(path.join(SORTIE, 'textes.json')) ? JSON.parse(readFileSync(path.join(SORTIE, 'textes.json'), 'utf8')).epingles : textes;
ok(new Set(tous.map((t) => t.titre)).size === tous.length, 'des titres d\'épingles sont en double');
ok(textes.every((t) => t.description.includes('CC BY-NC 4.0') && t.description.includes(t.lien)), 'chaque description doit porter la licence et son lien');
for (const m of motifs) ok(pins.find((p) => p.id === m.id && p.type === 'tuile').jour - pins.find((p) => p.id === m.id && p.type === 'pavage').jour >= C.ecartJours, `motif ${m.id} : la cellule et le pavage sortent à moins de ${C.ecartJours} jours d'écart`);
{ const parJour = {}; for (const p of pins) parJour[p.jour] = (parJour[p.jour] || 0) + 1; ok(Object.values(parJour).every((n) => n <= PAR_JOUR), 'plus de 12 épingles un même jour'); }
{ const ctrl = existsSync(path.join(SORTIE, 'controle-cases.json')) ? JSON.parse(readFileSync(path.join(SORTIE, 'controle-cases.json'), 'utf8')).images.filter((m) => m.ordre === ORDRE) : [];
  ok(ctrl.length === lot.length, `controle-cases.json : ${ctrl.length} images, ${lot.length} attendues`);
  for (const m of ctrl) { ok(m.pasEntier && m.pasPixels === (m.type === 'tuile' ? C.pxTuile : C.pxPavage), `${m.fichier} : pas de ${m.pasPixels} points par case (${m.type === 'tuile' ? C.pxTuile : C.pxPavage} entiers attendus)`); ok(m.casesTuile === C.g, `${m.fichier} : ${m.casesTuile} cases, ${C.g} attendues`); if (m.type === 'pavage') ok(m.casesParCoteLargeur === C.g && m.casesParCoteHauteur === C.casesH, `${m.fichier} : pavage de ${m.casesParCoteLargeur} × ${m.casesParCoteHauteur} cases, ${C.g} × ${C.casesH} attendues`); } }
const serveur2 = await servirDepot(ROOT), nav2 = await chromium.launch(); let periodes = null, ancres = 0, vignette = null;
try {
  const page = await ouvrirPage(serveur2, nav2);
  // cases carrées : la période du pavage (translation exacte) est la même en x et en y, et vaut g cases de pxPavage points
  const f = pngDe(lot.find((p) => p.type === 'pavage').fichier);
  if (f) periodes = await page.evaluate(async ([b64, attendu]) => {
    const im = new Image(); await new Promise((r) => { im.onload = r; im.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, Hh = c.height - 70; // sans le bandeau
    const periode = (dx, dy) => { for (let p = attendu - 40; p <= attendu + 40; p++) { let bon = true; for (let k = 0; k < 4000 && bon; k++) { const X = (k * 7919) % (W - (dx ? p : 0)), Y = (k * 104729) % (Hh - (dy ? p : 0)); if (X < 0 || Y < 0 || Y + (dy ? p : 0) >= Hh) continue; const a = (Y * W + X) * 4, b = ((Y + (dy ? p : 0)) * W + X + (dx ? p : 0)) * 4; if (d[a] !== d[b] || d[a + 1] !== d[b + 1] || d[a + 2] !== d[b + 2]) bon = false; } if (bon) return p; } return null; };
    // en largeur, une seule cellule : la période en x est cherchée par la translation de la cellule entière (la fenêtre fait exactement une cellule)
    return { x: W === attendu ? attendu : periode(1, 0), y: periode(0, 1), largeur: W, attendu };
  }, [f.toString('base64'), C.g * C.pxPavage]);
  ok(periodes && periodes.largeur === C.g * C.pxPavage && periodes.y === periodes.attendu, `cases carrées : largeur ${periodes && periodes.largeur} (une cellule de ${C.g} × ${C.pxPavage} = ${C.g * C.pxPavage}), période en y ${periodes && periodes.y}`);
  // les liens : l'ancre de chaque motif du lot existe dans la Galerie bicolore étendue, et l'ordre est choisi à l'ouverture
  for (const id of [...new Set(lotTextes.map((t) => t.id))]) {
    await page.goto(`${serveur2.url}/galerie-bicolore.html#${id}`);
    try { await page.waitForFunction(([i, o]) => !!document.getElementById(i) && window.__galerieOrdres && window.__galerieOrdres.etat().ordre === o, [id, ORDRE], { timeout: 30000 }); ancres++; } catch { ok(false, `l'ancre #${id} n'ouvre pas l'ordre ${ORDRE} sur ce motif`); }
  }
  // la cellule de la page « Voir sa musique » : même motif, même rendu, pixel pour pixel
  if (ORDRE === 18) {
    await page.goto(`${serveur2.url}/musique-chladni.html`); await page.waitForFunction(() => window.__voirSaMusique);
    vignette = [];
    for (const id of ['b1971128', 'f613', 'p18']) {
      await page.click('#vm-g-fmt-btn'); await page.click('#vm-o-fmt-18'); await page.click('#vm-g-col-btn'); await page.click(`#vm-o-col-${id}`); await page.click('#vmValider');
      await page.waitForFunction((i) => window.__voirSaMusique.etat().blocs.includes(i), id, { timeout: 30000 }); await page.mouse.click(5, 5);
      const m = lotTextes.find((t) => t.collection === id);
      const r = await page.evaluate(`(${COMPARER})(${JSON.stringify({ ordre: ORDRE, col: id, ident: m.id, fichierBloc: `data/musique-chladni/bloc-${ORDRE}-structure.json`, collections: C.collections })})`);
      ok(r.diff === 0, `la cellule de ${m.id} diffère de la vignette de « Voir sa musique » (${r.diff} valeurs sur ${r.n})`);
      vignette.push(`${m.id} (${r.n / 4} points comparés)`);
    }
  }
} finally { await nav2.close(); if (serveur2.fermer) serveur2.fermer(); }
if (echecs.length) { for (const e of echecs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log(`Lot vérifié (ordre ${ORDRE}) : ${lot.length} fichiers (pavage ${LP} × ${HP}, tuile ${LT} × ${HT}), ${tailles.reduce((a, b) => a + b, 0) / 1e6} Mo, pavage : une cellule de ${C.g * C.pxPavage} points de large, période en y ${periodes.y} (cases de ${C.pxPavage} points, carrées), ${tous.length} titres distincts, ${ancres} ancres de la Galerie bicolore ouvertes sur l'ordre ${ORDRE}${vignette ? `, vignette de la page lue pour ${vignette.length} motifs` : ''}.`);
process.exit(0);
