// musique-chladni-ui.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'interface de « Voir sa musique » (musique-chladni.html), d'après la maquette validée par
// l'auteur : deux fenêtres (Validé / Essai) alimentées par UNE seule analyse du son, six en-têtes
// dont chaque clic déroule un panneau de choix (survol = aperçu dans l'essai), pavage 2 × 2 par
// translation. Elle relie le moteur (musique-chladni-moteur.js, sans DOM) au navigateur : sources
// audio, canevas, enregistrement, plein écran, fenêtre de projection.
// Aucune phrase ici (tout est dans musique-chladni-textes.js), aucun réglage de fonctionnalité
// (tout est dans musique-chladni-config.js), aucune couleur recopiée (assets/couleurs.js).
// La page n'envoie RIEN : fichier, micro et audio capturé restent dans le navigateur.
import * as M from './musique-chladni-moteur.js';
import { CONFIG } from './musique-chladni-config.js';
import { texte as T } from './musique-chladni-textes.js';
import { PALETTES, ENCRE, CREME, GRIS } from './couleurs.js';
import { chargerCollection, rasteriser } from './bicolore-fonds.js';
import { monterSemaine } from './musique-chladni-semaine.js';

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); }
  for (const c of enfants.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const lJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u} : ${r.status}`); return r.json(); });
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const MQ_CALME = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const C = CONFIG.moteur;

// ---------- l'état ----------
const S = {
  donnees: null, blocs: new Map(), jb: {}, charges: {}, defs: null, tailles: {}, profils: new Map(), constructions: 0, coll: null, bandes: new Map(),
  tSim: 0, teinte: 200, acc: 0, fps: 0, source: null, etat: '',
  seuil: C.seuilAttaques, intervalle: C.intervalleMinSecondes, lissage: C.lissage, pente: C.penteDesGraves,
  calme: MQ_CALME.matches, figure: 'motif', loi: M.LOIS.RACINE, cPlaque: C.cPlaque, pulsation: M.PULSATIONS.ATTAQUE, pause: false, signature: CONFIG.enregistrement.signature,
  perso: { ink: rgb(ENCRE), bg: rgb(CREME) }, tuileEssai: C.tuileFenetre, lent: 0, resReduite: false, ia: false,
};
const DIR = 'data/musique-chladni/';
const FMT_DE = {}; for (const o of CONFIG.ordres) for (const c of o.collections) FMT_DE[c] = o.ordre;
const colDefaut = (fmt) => CONFIG.ordres.find((o) => o.ordre === fmt).collections.find((c) => CONFIG.collections[c]);
const CFG0 = { mode: 'image', fmt: 12, col: 'tri', view: 'signes', fond: 'B2', pal: 'creme' };
const bloc = (c) => S.blocs.get(c.col) || null;
const profilDe = (b) => { if (!S.profils.has(b.profil)) S.profils.set(b.profil, { shells: b.shells, fref: b.fref, lisse: new Float64Array(b.NS) }); return S.profils.get(b.profil); };
let valCfg = { ...CFG0 }, esel = { ...CFG0 };
const A = { ctx: null, an8: null, an2: null, entree: null, sortie: null, dest: null, el: null, srcEl: null, srcNode: null, flux: null, essai: null, wake: null, url: null };
let detecteur = null, valide = null, essaiF = null, rec = null, projection = null, enPleinEcran = false, minuteurScene = 0, dernierMs = 0, dernierInfo = -1;
const f8 = new Float32Array(4096), f2 = new Float32Array(1024);

// ---------- couleurs ----------
const hsl = (h, s, l) => { h /= 360; const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)); };
const PALETTES_PAGE = ['creme', 'monochrome', ...(CONFIG.couleursPerso ? ['perso'] : []), ...(CONFIG.teinteSuitLeSon ? ['son'] : [])];
function couleurs(c) { // [encre, fond, milieu?] en RGB
  if (c.pal === 'perso') return [S.perso.ink, S.perso.bg];
  if (c.pal === 'son') { const h = Math.round(S.teinte / 3) * 3; return [hsl(h, 0.6, 0.22), hsl(h, 0.4, 0.9)]; }
  const p = PALETTES[c.pal]; return c.pal === 'creme' ? [rgb(p[1]), rgb(p[0]), rgb(GRIS)] : [rgb(p[1]), rgb(p[0])]; // clair = bit 0 = fond ; encre = bit 1
}
const paletteCle = (c) => couleurs(c).map((x) => (x ? x.join(',') : '')).join('|');

// ---------- les données ----------
function construire(col) { // un bloc de structure : spectres du fichier, voisins et chaîne calculés dans la collection
  const o = FMT_DE[col], def = M.definirCollections(o, S.defs).find((d) => d.id === col);
  const b = M.preparerBlocStructure(S.jb[o], { id: col, indices: def.indices }); S.constructions++;
  const e = M.controlerBloc(b); if (e.length) throw new Error(e.join(' ; '));
  S.blocs.set(col, b); return b;
}
function chargerOrdre(o) { // 18 et 30 : à la demande, au premier choix du format
  if (!S.charges[o]) S.charges[o] = S.jb[o] ? Promise.resolve() : lJson(`${DIR}bloc-${o}-structure.json`).then((j) => { S.jb[o] = j; });
  return S.charges[o];
}
async function assurer(c) { if (S.blocs.has(c.col)) return; const o = FMT_DE[c.col]; if (!S.jb[o]) { message(T('chargementOrdre', { n: o })); await chargerOrdre(o); message(''); } if (!S.blocs.has(c.col)) construire(c.col); }
async function charger() {
  const [donnees, jColl, jCalc, jb12, c1830, sym12, centrale12] = await Promise.all([lJson('data/musique-chladni-12.json'), lJson('data/fonds/collection-v1.json'), lJson('data/fonds/collection-v1.calculs.json'), lJson(`${DIR}bloc-12-structure.json`), lJson(`${DIR}collections-18-30.json`), lJson(`${DIR}sym12-indices.json`), lJson(`${DIR}centrale12-indices.json`)]);
  S.donnees = donnees; S.coll = chargerCollection(jColl, { calculs: jCalc }); S.jb[12] = jb12; S.defs = { collections1830: c1830, sym12, centrale12 }; S.charges[12] = Promise.resolve();
  const tri = M.preparerBloc(donnees, 'tri'), e = M.controlerBloc(tri); if (e.length) throw new Error(e.join(' ; '));
  S.blocs.set('tri', tri);
  for (const col of ['bi', 'ce']) construire(col);
  for (const o of CONFIG.ordres) for (const d of M.definirCollections(o.ordre, S.defs)) S.tailles[d.id] = d.indices.length;
  S.tailles.tri = tri.n;
  for (const id of M.BANDES) if (!S.coll.fonds.get(id)) throw new Error(T('bandeManque', { id }));
}
function etats(id) { // les deux états d'une case : le fond, et le même fond tourné de 90° (mode unique, forcé ici)
  if (!S.bandes.has(id)) S.bandes.set(id, M.etatsDeCase(Uint8Array.from(rasteriser(S.coll.fonds.get(id), 0, 60), (x) => (x === 1 ? 1 : 0)), 60));
  return S.bandes.get(id);
}

// ---------- les tuiles (un motif, une vue, des couleurs) ----------
const cacheTuiles = new Map();
function tuile(col, j, vue, fond, c, T) {
  const bl = S.blocs.get(col), pal = couleurs(c), pr = profilDe(bl), sonCle = S.figure !== 'motif' && vue !== 'pavage' ? `|${S.figure}:${pr.sonCle || ''}` : ''; // option « figure du son » : jamais en pavage
  const cle = `${T}|${col}|${j}|${vue}|${vue === 'pavage' && col !== 'tri' ? fond : ''}|${paletteCle(c)}${sonCle}`;
  let t = cacheTuiles.get(cle); if (t) { cacheTuiles.delete(cle); cacheTuiles.set(cle, t); return t; } // LRU
  const A8 = new Uint8Array(T * T);
  if (vue === 'pavage') { if (col === 'tri') M.masqueTricolore(bl, j, T, A8); else M.masqueBicolore(bl, j, etats(fond), T, A8); }
  else if (!sonCle) M.figure(M.champ(bl, j), bl.grid, T, vue, A8);
  else { // « du son » : la somme des ondes de chaque cercle, pondérées par le vecteur du son ; « écart » : où elle diffère de la figure du motif
    M.figureDuSon(pr.sonV, bl.shells, bl.grid, T, vue, A8);
    if (S.figure === 'ecart') { const m = new Uint8Array(T * T); M.figure(M.champ(bl, j), bl.grid, T, vue, m); M.ecartDeFigures(m, A8, A8); }
  }
  t = document.createElement('canvas'); t.width = t.height = T;
  const x = t.getContext('2d'), im = x.createImageData(T, T), d = im.data, [ink, bg, mid] = pal, tri3 = col === 'tri' && vue === 'pavage' && mid;
  for (let i = 0; i < T * T; i++) {
    let r, g, b; const a = A8[i];
    if (tri3) { const q = a === 255 ? ink : a === 128 ? mid : bg; [r, g, b] = q; }
    else { const k = a / 255; r = bg[0] + (ink[0] - bg[0]) * k; g = bg[1] + (ink[1] - bg[1]) * k; b = bg[2] + (ink[2] - bg[2]) * k; }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0); cacheTuiles.set(cle, t); if (cacheTuiles.size > 120) cacheTuiles.delete(cacheTuiles.keys().next().value);
  return t;
}
// Combien de tuiles par côté dans une fenêtre : la fenêtre montre 2 × l'ordre cases de large (équilibre
// « 4 blocs de 12, de 18, de 30 » voulu par l'auteur) — 24 cases à l'ordre 12 (2 × 2 tuiles de 12 × 12),
// 36 à l'ordre 18 et 60 à l'ordre 30 (UNE tuile de 36 × 36, de 60 × 60 : un décalage de 18 ou de 30 cases
// donne l'image inversée, ce ne sont pas quatre copies).
const tuilesParCote = (fmt) => Math.max(1, (CONFIG.pavage * fmt) / M.GRILLE[fmt]);
// Le pavage par translation (jamais de miroir) : tuiles de `s` points (par défaut le cadre / le nombre de tuiles), centré, qui remplit tout le cadre.
function pavage(ctx, W, H, t, alpha, fmt = 12, s = Math.min(W, H) / tuilesParCote(fmt)) {
  const ox = (W - s * Math.ceil(W / s)) / 2, oy = (H - s * Math.ceil(H / s)) / 2;
  ctx.globalAlpha = alpha; for (let y = oy; y < H - 0.01; y += s) for (let x = ox; x < W - 0.01; x += s) ctx.drawImage(t, x, y, s, s); ctx.globalAlpha = 1;
}

// ---------- une fenêtre : sa configuration, son pilote, son rendu ----------
class Fenetre {
  constructor(cv, cap) { this.cv = cv; this.ctx = cv.getContext('2d'); this.cap = cap; this.cfg = null; this.p = null; this.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 }; }
  options() { return { mode: this.cfg.mode, hysteresis: C.hysteresis, tenueMin: C.tenueMinImages, fondu: C.fonduSecondes, calme: S.calme, pulsation: S.pulsation, facteurOctave: S.loi === M.LOIS.PLAQUE ? 2 : 4 }; }
  setCfg(c) {
    const ancienne = this.cfg; this.cfg = { ...c };
    if (!this.p || !ancienne || ancienne.col !== c.col) { this.p = M.creerPilote(S.blocs.get(c.col), this.options()); this.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 }; }
    else this.p.reglages(this.options());
    const colInfo = T('collections')[c.col], vue = T('vues')[c.view][0], variante = c.col !== 'tri' && c.view === 'pavage' ? ` · ${T('fond', { id: c.fond })}` : '';
    this.cap.textContent = T('legendeFenetre', { mode: T('modes')[c.mode][0], collection: colInfo[0], vue, fond: variante, palette: T('palettes')[c.pal][0] });
  }
  reglages() { if (this.p) this.p.reglages(this.options()); }
  pas(attaque) { if (!S.pause) this.dernier = this.p.pas({ v: profilDe(S.blocs.get(this.cfg.col)).lisse, attaque, t: S.tSim }); }
  peindre(ctx = this.ctx, W = this.cv.width, H = this.cv.height, T = C.tuileFenetre, s) {
    const c = this.cfg, pal = couleurs(c), d = this.dernier;
    ctx.fillStyle = hex(pal[1]); ctx.fillRect(0, 0, W, H);
    if (d.fondu < 1 && d.ancien >= 0) { pavage(ctx, W, H, tuile(c.col, d.ancien, c.view, c.fond, c, T), 1, c.fmt, s); pavage(ctx, W, H, tuile(c.col, d.motif, c.view, c.fond, c, T), d.fondu, c.fmt, s); }
    else pavage(ctx, W, H, tuile(c.col, d.motif, c.view, c.fond, c, T), 1, c.fmt, s);
  }
}

// ---------- l'analyse du son : UNE seule, pour les deux fenêtres ----------
/** Le vecteur du son de l'option « figure du son » : normalisé, arrondi à 16 niveaux (la clé du cache des tuiles ne change que si la figure change). */
function vecteurDuSon(pr) {
  let mx = 0; for (const x of pr.lisse) if (x > mx) mx = x;
  pr.sonT = S.tSim; pr.sonV = Float64Array.from(pr.lisse, (x) => (mx > 1e-9 ? Math.round(x / mx * 15) / 15 : 0)); pr.sonCle = mx > 1e-9 ? pr.sonV.join(',') : 'silence';
}
function analyser() {
  A.an8.getFloatFrequencyData(f8); A.an2.getFloatFrequencyData(f2);
  const sr = A.ctx.sampleRate, vus = new Set();
  for (const f of [valide, essaiF]) { // une analyse du son, un vecteur par profil de coquilles (fref et cercles K) utilisé par une fenêtre
    const pr = profilDe(S.blocs.get(f.cfg.col)); if (vus.has(pr)) continue; vus.add(pr);
    const brut = M.bandesDuSon(f8, sr, { fref: pr.fref, pente: S.pente, shells: pr.shells, loi: S.loi, c: S.cPlaque });
    for (let k = 0; k < pr.lisse.length; k++) pr.lisse[k] = (1 - S.lissage) * pr.lisse[k] + S.lissage * brut[k];
    if (S.figure !== 'motif' && S.tSim - (pr.sonT ?? -1) >= 0.1) vecteurDuSon(pr); // l'option « figure du son » : 10 figures par seconde au plus
  }
  if (valCfg.pal === 'son' || esel.pal === 'son') S.teinte = M.suivreTeinte(f8, sr, S.teinte);
  return detecteur.traiter(f2, sr, S.tSim).attaque;
}

// ---------- la boucle ----------
function boucle(ms) {
  requestAnimationFrame(boucle);
  const dt = Math.min(100, ms - dernierMs); dernierMs = ms;
  S.acc = Math.min(100, S.acc + dt); // borné : un onglet resté en arrière-plan ne rejoue pas des secondes
  const actif = A.ctx && S.source && A.ctx.state === 'running' && !document.hidden;
  if (actif) { let pas = 0; while (S.acc >= 33 && pas < 3) { S.acc -= 33; pas++; S.tSim += 0.033; const att = analyser(); valide.pas(att); essaiF.pas(att); } }
  else S.acc = 0;
  if (valide.dernier.fondu < 1) { valide.dernier.fondu = Math.min(1, valide.dernier.fondu + dt / 1000 / (C.fonduSecondes * (S.calme ? 3 : 1))); }
  if (essaiF.dernier.fondu < 1) { essaiF.dernier.fondu = Math.min(1, essaiF.dernier.fondu + dt / 1000 / (C.fonduSecondes * (S.calme ? 3 : 1))); }
  S.fps = S.fps ? S.fps * 0.92 + (1000 / Math.max(1, dt)) * 0.08 : 1000 / Math.max(1, dt);
  valide.peindre(); essaiF.peindre(undefined, undefined, undefined, S.tuileEssai);
  if (enPleinEcran) { const pc = $('vmPleinToile'); valide.peindre(pc.getContext('2d'), pc.width, pc.height, C.tuilePleinEcran, tuilePleinEcran(pc)); }
  if (projection && !projection.win.closed) { const c = projection.canvas; if (c.width !== 720) c.width = c.height = 720; valide.peindre(c.getContext('2d'), 720, 720, C.tuileFenetre); }
  if (rec) composer();
  if (Math.floor(ms / 500) !== dernierInfo) { dernierInfo = Math.floor(ms / 500); majInfo(); adapter(); if (esel.pal === 'son' || valCfg.pal === 'son') dessinerMiniatures(); }
}
function adapter() { // 30 images/s d'abord : on baisse la résolution de l'essai, pas la cadence
  const lent = S.source && S.fps < C.imagesParSeconde * 0.8; S.lent = lent ? S.lent + 1 : 0;
  if (S.lent >= 6 && S.tuileEssai > 180) { S.tuileEssai = Math.max(180, Math.round(S.tuileEssai * 0.75)); S.resReduite = true; S.lent = 0; }
}
// ---------- la lecture en clés (option, ordre 12) : un panneau replié, affichage seul ----------
let clesModule = null, clesAffiche = '';
async function majCles() {
  const d = $('vmCles'); if (!d || !CONFIG.options.lectureEnCles) return;
  d.hidden = valCfg.fmt !== 12; if (d.hidden || !d.open) return;
  const j = valide.dernier.motif, cle = `${valCfg.col}|${j}`; if (cle === clesAffiche) return; clesAffiche = cle;
  clesModule ||= await import('./cles-axes.js');
  const b = S.blocs.get(valCfg.col), l = clesModule.lectureEnCles(b, j), nom = (c) => `${T('clesNatures')[c.nature]} ${c.e > 0 ? '+' : ''}${String(c.e).replace('.', ',').replace('-', '−')}`;
  $('vmClesCorps').replaceChildren(el('p', { class: 'vm-aide' }, T('clesAide')), el('p', { class: 'vm-aide' }, T('clesMotif', { i: j + 1, n: b.n, collection: T('collections')[valCfg.col][0] })),
    ...l.figures.map((f) => el('div', { class: 'vm-ligne' }, el('b', {}, T('clesFigure')[f.nom]), ' : ', f.cles ? (f.cles.length ? T('clesActives', { n: f.cles.length, liste: f.cles.map(nom).join(' ; ') }) + (f.complement ? T('clesComplement') : '') : T('clesAucune')) : T('clesHors'))));
}
// ---------- « Pour comprendre » (option) : deux vues pédagogiques, aucun lien avec le son ----------
let comprendreMonte = false;
function peindrePM(cv, F, { signes = false } = {}) { // F : champ de −1 à 1 (Float32Array ou Int8Array), T × T
  const T = cv.width, x = cv.getContext('2d'), im = x.createImageData(T, T), [ink, bg] = couleurs(valCfg), d = im.data;
  for (let i = 0; i < T * T; i++) {
    const v = F[i], k = signes ? (v > 0 ? 1 : 0) : Math.abs(v) < 0.07 ? 1 : 0, o = i * 4, c = signes ? (k ? ink : bg) : (k ? ink : bg);
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0);
}
function monterComprendre() {
  if (comprendreMonte) return; comprendreMonte = true;
  const toile = (id, alt, t = 240) => el('canvas', { id, width: t, height: t, role: 'img', 'aria-label': alt, style: 'max-width:100%;height:auto;border:1px solid currentColor' });
  const paire = () => { const s = Number($('vmPaireS').value), F = M.pairesDegenerees(240, s, 4); // signes en aplat, ligne nodale par-dessus
    const cv = $('vmPaireToile'), x = cv.getContext('2d'), im = x.createImageData(240, 240), [ink, bg] = couleurs(valCfg), d = im.data;
    for (let i = 0; i < 240 * 240; i++) { const v = F[i], nod = Math.abs(v) < 0.07, c = nod ? ink : v > 0 ? [Math.round((ink[0] + bg[0] * 3) / 4), Math.round((ink[1] + bg[1] * 3) / 4), Math.round((ink[2] + bg[2] * 3) / 4)] : bg, o = i * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
    x.putImageData(im, 0, 0); $('vmPaireVal').textContent = s.toFixed(2); };
  const moire = () => { const ang = Number($('vmMoireAngle').value), per = Number($('vmMoirePer').value) / 100, T = 240, P = 20;
    const A = M.reseauPM(T, P, 0), B = M.reseauPM(T, P * per, ang * Math.PI / 180);
    peindrePM($('vmMoireA'), A, { signes: true }); peindrePM($('vmMoireB'), B, { signes: true }); peindrePM($('vmMoireP'), M.produitXnor(A, B), { signes: true });
    $('vmMoireAngleVal').textContent = ang.toFixed(1); $('vmMoirePerVal').textContent = Math.round(per * 100); };
  const rg = (id, min, max, pas, v, f) => el('input', { type: 'range', id, min, max, step: pas, value: v, oninput: f });
  $('vmComprendreCorps').replaceChildren(
    el('p', { class: 'vm-aide' }, T('comprendreAide')),
    el('h3', {}, T('paireTitre')), el('p', { class: 'vm-aide' }, T('paireAide')),
    el('div', { class: 'vm-ligne' }, el('label', { for: 'vmPaireS' }, T('paireMelange')), rg('vmPaireS', -1, 1, 0.05, 1, paire), el('output', { id: 'vmPaireVal', for: 'vmPaireS' }, '1.00')),
    toile('vmPaireToile', T('paireAlt')),
    el('h3', {}, T('moireTitre')), el('p', { class: 'vm-aide' }, T('moireAide')),
    el('div', { class: 'vm-ligne' }, el('label', { for: 'vmMoireAngle' }, T('moireAngle')), rg('vmMoireAngle', 0, 20, 0.5, 4, moire), el('output', { id: 'vmMoireAngleVal', for: 'vmMoireAngle' }, '4.0')),
    el('div', { class: 'vm-ligne' }, el('label', { for: 'vmMoirePer' }, T('moirePeriode')), rg('vmMoirePer', 90, 115, 1, 100, moire), el('output', { id: 'vmMoirePerVal', for: 'vmMoirePer' }, '100')),
    el('div', { class: 'vm-ligne', style: 'display:flex;gap:.6rem;flex-wrap:wrap' }, el('figure', { style: 'margin:0' }, toile('vmMoireA', T('moireA'), 240), el('figcaption', {}, T('moireA'))), el('figure', { style: 'margin:0' }, toile('vmMoireB', T('moireB'), 240), el('figcaption', {}, T('moireB'))), el('figure', { style: 'margin:0' }, toile('vmMoireP', T('moireAlt'), 240), el('figcaption', {}, T('moireProduit')))));
  paire(); moire();
}
function majInfo() {
  const j = valide.dernier.motif, n = S.blocs.get(valCfg.col).n, p = [S.etat || T('etatDepart')];
  if (S.source) { p.push(T('infoMotif', { i: j + 1, n })); p.push(T('infoImages', { fps: S.fps.toFixed(0) })); }
  if (S.resReduite) p.push(T('infoResolution'));
  $('vmInfo').textContent = p.join(' · ');
  majCles();
  const pu = valide.p.pulsation(), sel = $('vmPulsation'), aide = $('vmAidePulsation');
  if (sel) for (const o of sel.options) o.disabled = o.value !== M.PULSATIONS.ATTAQUE && !pu.regulier;
  if (!pu.regulier && S.pulsation !== M.PULSATIONS.ATTAQUE) { S.pulsation = M.PULSATIONS.ATTAQUE; if (sel) sel.value = S.pulsation; valide.reglages(); essaiF.reglages(); }
  if (aide) aide.textContent = `${T('pulsationAide')} ${pu.regulier ? T('pulsationDetectee', { bpm: Math.round(pu.bpm) }) : T('pulsationAucune')}`;
}
function message(t, bon = false) { const e = $('vmMessage'); e.textContent = t || ''; e.dataset.etat = t ? (bon ? 'ok' : 'erreur') : ''; }

// ---------- l'audio ----------
async function audioPret() {
  if (A.ctx) { await A.ctx.resume(); return; }
  A.ctx = new (window.AudioContext || window.webkitAudioContext)();
  A.an8 = A.ctx.createAnalyser(); A.an8.fftSize = 8192; A.an8.smoothingTimeConstant = 0; A.an8.minDecibels = -110;
  A.an2 = A.ctx.createAnalyser(); A.an2.fftSize = 2048; A.an2.smoothingTimeConstant = 0; A.an2.minDecibels = -110;
  A.entree = A.ctx.createGain(); A.sortie = A.ctx.createGain(); A.dest = A.ctx.createMediaStreamDestination();
  A.entree.connect(A.an8); A.entree.connect(A.an2); A.entree.connect(A.dest); A.entree.connect(A.sortie); A.sortie.connect(A.ctx.destination);
  await A.ctx.resume();
}
function arreterSource() {
  if (A.el) A.el.pause();
  if (A.srcNode) { try { A.srcNode.disconnect(); } catch { /* déjà détaché */ } A.srcNode = null; }
  if (A.flux) { A.flux.getTracks().forEach((p) => p.stop()); A.flux = null; } // un nouvel appel du micro arrête la piste précédente
  if (A.essai) { clearInterval(A.essai.timer); A.essai.noeuds.forEach((n) => { try { n.stop(); n.disconnect(); } catch { /* déjà arrêté */ } }); A.essai = null; }
  if (A.wake) { A.wake.release().catch(() => {}); A.wake = null; }
  S.source = null; S.ia = false; for (const pr of S.profils.values()) pr.lisse.fill(0); detecteur.reinitialiser(); valide.p.reinitialiser(); essaiF.p.reinitialiser();
  valide.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 }; essaiF.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 };
  $('vmLecture').textContent = T('lecture'); $('vmLecture').setAttribute('aria-pressed', 'false');
}
async function demarrer(source, etat, audible, ia = false) {
  message(''); await audioPret();
  S.source = source; S.etat = etat; S.ia = ia; S.tSim = 0; A.sortie.gain.value = audible ? 1 : 0; detecteur.reinitialiser();
  $('vmLecture').textContent = T('arreter'); $('vmLecture').setAttribute('aria-pressed', 'true');
  if (CONFIG.scene.veilleEmpechee && navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { A.wake = w; }).catch(() => {});
}
function elementAudio() {
  if (!A.el) { A.el = new Audio(); A.el.loop = true; A.el.addEventListener('ended', () => { if (S.source === 'fichier' || S.source === 'morceau') arreterSource(); }); A.el.addEventListener('error', () => { if (A.el.src) { message(T('erreurFichier')); arreterSource(); } }); }
  return A.el;
}
async function lireElement(url, source, etat, ia) {
  arreterSource(); await audioPret(); const e = elementAudio(); e.src = url;
  if (!A.srcEl) A.srcEl = A.ctx.createMediaElementSource(e);
  A.srcNode = A.srcEl; A.srcEl.connect(A.entree);
  await demarrer(source, etat, true, ia);
  try { await e.play(); } catch (err) { message(T('erreurAudio', { message: err.message })); arreterSource(); }
}
async function depuisFlux(flux, source, etat) {
  arreterSource(); await audioPret(); A.flux = flux; A.srcNode = A.ctx.createMediaStreamSource(flux); A.srcNode.connect(A.entree);
  flux.getAudioTracks().forEach((p) => p.addEventListener('ended', () => { if (A.flux === flux) { message(T('microCoupe')); arreterSource(); } }));
  await demarrer(source, etat, false);
}
let entrees = [];
async function listerEntrees() {
  if (!CONFIG.entrees.peripheriques || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  entrees = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
  const s = $('vmEntree'); if (!s) return; const v = s.value;
  s.replaceChildren(el('option', { value: '' }, T('entreeDefaut')), ...entrees.map((d, i) => el('option', { value: d.deviceId }, d.label || `${T('entree')} ${i + 1}`))); s.value = v;
}
async function ouvrirMicro() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return message(T('erreurMicroAbsent'));
  const id = $('vmEntree') ? $('vmEntree').value : '';
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, ...(id ? { deviceId: { exact: id } } : {}) } });
    await depuisFlux(flux, id ? 'entree' : 'micro', id ? T('etatEntree', { nom: (entrees.find((x) => x.deviceId === id) || {}).label || id }) : T('etatMicro')); await listerEntrees();
  } catch (err) { message(err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? T('erreurMicroRefuse') : err && err.name === 'NotFoundError' ? T('erreurMicroAbsent') : T('erreurMicro', { message: err && err.message })); }
}
async function capturerOnglet() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return message(T('erreurOnglet'));
  try {
    const flux = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); flux.getVideoTracks().forEach((p) => p.stop());
    if (!flux.getAudioTracks().length) return message(T('erreurOngletSansSon'));
    await depuisFlux(new MediaStream(flux.getAudioTracks()), 'onglet', T('etatOnglet'));
  } catch (err) { message(err && err.name === 'NotAllowedError' ? T('erreurOnglet') : T('erreurAudio', { message: err && err.message })); }
}
function musiqueEssai() { // les accords de la page test de l'auteur, sur l'ancrage de la page
  arreterSource();
  demarrer('essai', T('etatEssai'), true).then(() => {
    const noeuds = [], note = (f, t, dur, g) => { const o = A.ctx.createOscillator(), e = A.ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.03); e.gain.exponentialRampToValueAtTime(0.0005, t + dur); o.connect(e); e.connect(A.entree); o.start(t); o.stop(t + dur + 0.05); noeuds.push(o); };
    const accords = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [2, 5, 9, 14]]; let pas = 0;
    const jouer = () => { const c = accords[Math.floor(pas / 4) % 4], n = c[pas % 4], f = C.fref * Math.pow(2, (n + (pas % 3) * 12) / 12); note(f, A.ctx.currentTime + 0.02, 0.9, 0.18); note(f * Math.sqrt(2.3), A.ctx.currentTime + 0.02, 0.6, 0.05); pas++; };
    A.essai = { noeuds, timer: setInterval(jouer, 260) }; jouer();
  }).catch((err) => message(T('erreurAudio', { message: err.message })));
}
async function lecture() {
  if (S.source) return arreterSource();
  const v = $('vmSource').value;
  if (v === 'mic') return ouvrirMicro();
  if (v === 'onglet') return capturerOnglet();
  if (v === 'essai') return musiqueEssai();
  if (v === 'file') { if (!A.fichierUrl) return $('vmFichier').click(); return lireElement(A.fichierUrl, 'fichier', T('etatFichier', { nom: A.fichierNom }), false); }
  const m = CONFIG.morceaux.find((x) => x.id === v); if (m) return lireElement(m.fichier, 'morceau', T('etatMorceau'), true);
}

// ---------- l'enregistrement (comme assets/outil-fond-ecran.js) : les signes en plein cadre, le bandeau, rien d'autre ----------
const FORMATS_VIDEO = ['video/mp4;codecs="avc1.640028,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,opus"', 'video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
const dimensions = (f) => (f === '916' ? [1080, 1920] : f === '45' ? [1080, 1350] : [1080, 1080]);
function composer() {
  const { c, W, H } = rec;
  valide.peindre(c, W, H, C.tuilePleinEcran);
  if (S.signature) {
    const lignes = [CONFIG.enregistrement.signatureTexte]; if (S.ia) lignes.push(CONFIG.enregistrement.ligneIA);
    const haut = 30 + lignes.length * 40, e = rgb(ENCRE);
    c.fillStyle = `rgba(${e[0]},${e[1]},${e[2]},0.55)`; c.fillRect(0, H - haut, W, haut);
    c.fillStyle = CREME; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 30px system-ui, sans-serif';
    lignes.forEach((l, i) => c.fillText(l, W / 2, H - haut + 28 + i * 40 + 12));
  }
}
function lancerEnregistrement() {
  if (rec) return arreterEnregistrement();
  if (!window.MediaRecorder) return message(T('enregIndispo'));
  if (!S.source) return message(T('enregSansSource'));
  const format = $('vmFormatVideo').value, [W, H] = dimensions(format), cible = document.createElement('canvas'); cible.width = W; cible.height = H;
  if (!cible.captureStream) return message(T('enregIndispo'));
  const flux = new MediaStream(); cible.captureStream(30).getVideoTracks().forEach((p) => flux.addTrack(p)); A.dest.stream.getAudioTracks().forEach((p) => flux.addTrack(p));
  const mime = FORMATS_VIDEO.find((t) => MediaRecorder.isTypeSupported(t)) || ''; let mr;
  try { mr = mime ? new MediaRecorder(flux, { mimeType: mime }) : new MediaRecorder(flux); } catch (err) { return message(T('enregErreur', { message: err.message })); }
  const morceaux = []; rec = { c: cible.getContext('2d'), W, H, mr, debut: performance.now(), minuteur: null };
  mr.ondataavailable = (e) => { if (e.data && e.data.size) morceaux.push(e.data); };
  mr.onstop = () => {
    clearInterval(rec.minuteur); flux.getTracks().forEach((p) => p.stop());
    const type = mr.mimeType || mime || 'video/webm', mp4 = /mp4/.test(type), blob = new Blob(morceaux, { type });
    const a = el('a', { href: URL.createObjectURL(blob), download: `voir-sa-musique-${valCfg.col}-${valCfg.view}-${W}x${H}-${Date.now()}.${mp4 ? 'mp4' : 'webm'}` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    message(mp4 ? T('enregPret') : `${T('enregPret')} ${T('enregWebm')}`, true);
    window.__derniereVideo = { type, octets: blob.size, largeur: W, hauteur: H }; rec = null; $('vmEnreg').textContent = T('enreg'); $('vmEnreg').setAttribute('aria-pressed', 'false');
  };
  mr.start(); $('vmEnreg').setAttribute('aria-pressed', 'true');
  rec.minuteur = setInterval(() => { const s = Math.ceil(CONFIG.enregistrement.dureesSecondes[0] - (performance.now() - rec.debut) / 1000); $('vmEnreg').textContent = T('enregEnCours', { s: Math.max(0, s) }); if (s <= 0) arreterEnregistrement(); }, 250);
}
function arreterEnregistrement() { if (rec && rec.mr.state !== 'inactive') rec.mr.stop(); }

// ---------- plein écran (toujours la fenêtre validée) et projection ----------
// Le plein écran. Cause de l'ancien défaut : le canvas était dimensionné à l'écran (largeur × hauteur) mais la
// feuille de style lui imposait `aspect-ratio: 1` et `max-width/max-height` — le bitmap 16:9 était affiché dans
// une boîte carrée, donc étiré, et la scène ne couvrait pas l'écran. Maintenant : l'élément de la scène passe en
// plein écran par l'API Fullscreen (préfixe webkit en repli) ; sans elle (iPhone), la scène est en position fixe
// sur toute la fenêtre ; le canvas fait exactement la taille CSS de la scène × la densité de pixels (plafonnée),
// sans aucun étirement ; il est redessiné au changement de taille ou d'orientation.
let pleinNatif = false;
const pleinDemandeNatif = () => document.fullscreenElement || document.webkitFullscreenElement;
function calerPlein() {
  const f = $('vmPlein'), c = $('vmPleinToile'), cw = f.clientWidth || innerWidth, ch = f.clientHeight || innerHeight;
  let k = Math.min(window.devicePixelRatio || 1, 2); const px = cw * ch * k * k, PLAFOND = 4.2e6; if (px > PLAFOND) k *= Math.sqrt(PLAFOND / px); // la cadence d'abord
  const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  c.dataset.echelle = String(w / cw); // points du canvas par pixel CSS
}
// La taille d'une tuile en plein écran : l'échelle de case de la fenêtre validée (tuile de `grille` cases), en points du canvas.
function tuilePleinEcran(c) {
  const fmt = valCfg.fmt, g = M.GRILLE[fmt], cvF = $('vmValideToile'), cssFenetre = (cvF && cvF.getBoundingClientRect().width) || 260, caseCss = cssFenetre / (CONFIG.pavage * fmt);
  return caseCss * g * (Number(c.dataset.echelle) || 1);
}
function pleinEcran() {
  const f = $('vmPlein'), natif = f.requestFullscreen || f.webkitRequestFullscreen;
  f.hidden = false; enPleinEcran = true; f.classList.remove('vm-masque'); calerPlein(); veilleScene();
  const repli = () => { pleinNatif = false; message(T('pleinEcranRepli'), true); calerPlein(); }; // scène fixe sur toute la fenêtre
  if (!natif) return repli();
  pleinNatif = true;
  try { const p = natif.call(f); if (p && p.catch) p.catch(repli); } catch { repli(); }
}
function sortiePleinEcran() { const f = $('vmPlein'); f.hidden = true; enPleinEcran = false; pleinNatif = false; f.classList.remove('vm-masque'); }
function quitterPlein() { if (pleinDemandeNatif()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } sortiePleinEcran(); }
function veilleScene() { const f = $('vmPlein'); f.classList.remove('vm-masque'); clearTimeout(minuteurScene); if (enPleinEcran) minuteurScene = setTimeout(() => f.classList.add('vm-masque'), CONFIG.scene.masquerApresMs); }
function ouvrirProjection() {
  const w = window.open('', 'voir-sa-musique-projection', 'popup,width=960,height=540');
  if (!w) return message(T('projectionBloquee'));
  w.document.title = T('titrePage'); w.document.body.style.cssText = 'margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh';
  const c = w.document.createElement('canvas'); c.width = c.height = 720; c.style.cssText = 'max-width:100%;max-height:100vh;aspect-ratio:1'; w.document.body.append(c);
  projection = { win: w, canvas: c }; w.addEventListener('pagehide', () => { projection = null; });
}

// ---------- les six en-têtes et leurs panneaux ----------
const miniatures = [];
let cible = null;
function appliquer(cle, valeur) {
  const n = { ...esel, [cle]: valeur };
  if (cle === 'fmt') { n.col = colDefaut(valeur); n.view = 'pavage'; } // le format bascule sur « Cellules » et sur sa collection par défaut
  if (cle === 'col') n.fmt = FMT_DE[valeur];
  if (cle === 'fond') n.fond = M.resoudreBande(valeur);
  return n;
}
/** Montre une configuration dans l'essai ; l'ordre 18 ou 30 se charge d'abord, au premier choix. */
function viser(cfg) {
  cible = cfg; if (bloc(cfg)) { essaiF.setCfg(cfg); return; }
  assurer(cfg).then(() => { if (cible === cfg) essaiF.setCfg(cfg); rafraichir(); }).catch((err) => message(T('ordreIndisponible', { n: cfg.fmt, message: err.message })));
}
function option(groupe, cle, valeur, titre, detail, miniature, desactive = false) {
  const b = el('button', { type: 'button', class: 'vm-o', id: `vm-o-${groupe}-${valeur}`, 'data-g': groupe, 'data-k': valeur, 'aria-pressed': 'false', disabled: desactive || null, title: detail || '' },
    miniature ? el('canvas', { width: miniature === 'double' ? 136 : 68, height: 68, 'aria-hidden': 'true' }) : null, el('div', {}, el('b', {}, titre), detail ? el('small', {}, detail) : null));
  if (miniature) miniatures.push([b.querySelector('canvas'), cle, valeur]);
  const num = (v) => (isNaN(+v) ? v : +v);
  if (!desactive) {
    b.addEventListener('mouseenter', () => { viser(appliquer(cle, num(valeur))); });
    b.addEventListener('focus', () => { viser(appliquer(cle, num(valeur))); });
    b.addEventListener('click', () => { esel = appliquer(cle, num(valeur)); viser(esel); rafraichir(); });
  }
  return b;
}
function groupe(id, cle, titre, options) {
  const g = $(id), btn = el('button', { type: 'button', id: `${id}-btn`, 'aria-expanded': 'false', 'aria-controls': `${id}-pan` }, titre), pan = el('div', { class: 'vm-pan', id: `${id}-pan`, role: 'group', 'aria-label': titre }, options);
  g.replaceChildren(el('h3', {}, btn), pan);
  btn.addEventListener('click', (ev) => { ev.stopPropagation(); const ouvrir = !g.classList.contains('open'); fermerTout(); if (ouvrir) { g.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } });
  g.addEventListener('mouseleave', () => viser(esel));
  g.addEventListener('focusout', (e) => { if (!g.contains(e.relatedTarget)) viser(esel); });
}
function fermerTout() { for (const g of document.querySelectorAll('.vm-opts .vm-grp.open')) { g.classList.remove('open'); g.querySelector('button').setAttribute('aria-expanded', 'false'); } }
function construireGroupes() {
  miniatures.length = 0;
  const G = T('groupes');
  groupe('vm-g-mode', 'mode', G.mode, Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m]).map((m) => option('mode', 'mode', m, T('modes')[m][0], T('modes')[m][1])));
  groupe('vm-g-fmt', 'fmt', G.fmt, CONFIG.ordres.map((o) => option('fmt', 'fmt', String(o.ordre), o.actif ? T('format').titre.replace('{n}', o.ordre) : T('format').bientot.replace('{n}', o.ordre), o.actif ? T('format').detail.replace(/\{g\}/g, M.GRILLE[o.ordre]) : '', o.actif ? 'simple' : null, !o.actif)));
  groupe('vm-g-col', 'col', G.col, CONFIG.ordres.flatMap((o) => o.collections.filter((c) => CONFIG.collections[c]).map((c) => { const b = option('col', 'col', c, T('collections')[c][0], T('collections')[c][1].replace('{n}', S.tailles[c]), 'simple'); b.dataset.fmt = String(o.ordre); return b; })));
  groupe('vm-g-view', 'view', G.view, Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]).map((v) => option('view', 'view', v, T('vues')[v][0], T('vues')[v][1])));
  if (CONFIG.variantesDeCase) groupe('vm-g-fond', 'fond', G.fond, [el('p', { class: 'vm-aide' }, T('fondAide')), ...M.BANDES.map((id) => option('fond', 'fond', id, T('fond', { id }), '', 'double'))]);
  else $('vm-g-fond').remove();
  const pers = el('div', { id: 'vmPerso', class: 'vm-aide', hidden: true }, el('label', {}, T('persoMotif'), ' ', el('input', { type: 'color', id: 'vmPi', value: hex(S.perso.ink) })), ' ', el('label', {}, T('persoFond'), ' ', el('input', { type: 'color', id: 'vmPb', value: hex(S.perso.bg) })));
  groupe('vm-g-pal', 'pal', G.pal, [...PALETTES_PAGE.map((k) => option('pal', 'pal', k, T('palettes')[k][0], T('palettes')[k][1], 'simple')), pers, el('p', { class: 'vm-aide' }, T('tricoloreAide'))]);
  const persoChange = () => { S.perso = { ink: rgb($('vmPi').value), bg: rgb($('vmPb').value) }; esel = { ...esel, pal: 'perso' }; cacheTuiles.clear(); viser(esel); rafraichir(); };
  $('vmPi').addEventListener('input', persoChange); $('vmPb').addEventListener('input', persoChange);
}
function dessinerMiniatures() {
  const pal = couleurs(esel);
  for (const [cv, cle, valeur] of miniatures) {
    const x = cv.getContext('2d');
    if (cle === 'pal') {
      if (valeur === 'son') { const g = x.createLinearGradient(0, 0, 68, 68); for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hex(hsl(i * 50, 0.6, 0.4))); x.fillStyle = g; x.fillRect(0, 0, 68, 68); }
      else { const p = couleurs({ pal: valeur }); x.fillStyle = hex(p[1]); x.fillRect(0, 0, 68, 68); x.fillStyle = hex(p[0]); x.beginPath(); x.moveTo(68, 0); x.lineTo(68, 68); x.lineTo(0, 56); x.closePath(); x.fill(); }
    } else if (cle === 'fond') { // une seule case, de chaque côté : l'état 1, puis l'état 0 (le même fond tourné de 90°)
      const e = etats(valeur), im = x.createImageData(136, 68);
      for (let i = 0; i < 2; i++) for (let py = 0; py < 68; py++) for (let px = 0; px < 68; px++) { const on = (i ? e.a0 : e.a1)[Math.floor(py * e.R / 68) * e.R + Math.floor(px * e.R / 68)], c = on ? pal[0] : pal[1], o = (py * 136 + i * 68 + px) * 4; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255; }
      x.putImageData(im, 0, 0);
    } else { // format, collection : le motif lui-même (vue Cellules), jamais une figure « signes »
      const col = cle === 'col' ? valeur : colDefaut(+valeur);
      x.fillStyle = hex(pal[1]); x.fillRect(0, 0, 68, 68);
      if (S.blocs.has(col)) pavage(x, 68, 68, tuile(col, 0, 'pavage', esel.fond, { ...esel, col }, 360), 1, FMT_DE[col]); // la même fenêtre que les deux grandes : 2 × l'ordre cases de large
    }
  }
}
function rafraichir() {
  const marque = (g, vrai, val) => { for (const b of document.querySelectorAll(`.vm-o[data-g="${g}"]`)) { b.setAttribute('aria-pressed', String(vrai(b.dataset.k))); b.classList.toggle('val', val(b.dataset.k)); } };
  marque('mode', (k) => esel.mode === k, (k) => valCfg.mode === k); marque('fmt', (k) => esel.fmt === +k, (k) => valCfg.fmt === +k); marque('col', (k) => esel.col === k, (k) => valCfg.col === k);
  marque('view', (k) => esel.view === k, (k) => valCfg.view === k); marque('fond', (k) => esel.fond === k, (k) => valCfg.fond === k); marque('pal', (k) => esel.pal === k, (k) => valCfg.pal === k);
  for (const b of document.querySelectorAll('.vm-o[data-g="col"]')) b.hidden = Number(b.dataset.fmt) !== esel.fmt;
  const g = $('vm-g-fond'); if (g) g.hidden = esel.col === 'tri'; // la variante de case : collections bicolores, aux trois ordres
  $('vmPerso').hidden = esel.pal !== 'perso'; dessinerMiniatures();
}
function valider() { if (!bloc(esel)) return; valCfg = { ...esel }; valide.setCfg(valCfg); valide.p = M.creerPilote(bloc(valCfg), valide.options()); valide.p.copier(essaiF.p); valide.dernier = { ...essaiF.dernier }; rafraichir(); }
function annuler() { esel = { ...valCfg }; viser(esel); rafraichir(); }

// ---------- la page ----------
function reglagesAvances() {
  const curseur = (id, libelle, min, max, pas, v, f, aide) => { const o = el('output', { for: id }, String(v)); return el('div', { class: 'vm-ligne' }, el('label', { for: id }, libelle), el('input', { type: 'range', id, min, max, step: pas, value: v, oninput: (e) => { o.textContent = e.target.value; f(Number(e.target.value)); } }), o, aide ? el('small', { class: 'vm-aide' }, aide) : null); };
  const conteneur = $('vmReglages'); conteneur.replaceChildren(
    curseur('vmSeuil', T('sensibilite'), 0.15, 1, 0.05, S.seuil, (v) => { S.seuil = v; detecteur.seuil(v); }, T('sensibiliteAide')),
    curseur('vmIntervalle', T('intervalle'), 0.2, 1, 0.05, S.intervalle, (v) => { S.intervalle = v; detecteur.intervalle(v * (S.calme ? 3 : 1)); }, T('intervalleAide')),
    curseur('vmLissage', T('lissage'), 0.05, 1, 0.05, S.lissage, (v) => { S.lissage = v; }),
    CONFIG.pulsation ? el('div', { class: 'vm-ligne' }, el('label', { for: 'vmPulsation' }, T('pulsationTitre')), el('select', { id: 'vmPulsation', onchange: (e) => { S.pulsation = e.target.value; valide.reglages(); essaiF.reglages(); } }, Object.keys(T('pulsations')).map((k) => el('option', { value: k }, T('pulsations')[k]))), el('small', { class: 'vm-aide', id: 'vmAidePulsation' }, T('pulsationAide'))) : null,
    el('label', { class: 'vm-case' }, el('input', { type: 'checkbox', id: 'vmCalme', checked: S.calme || null, onchange: (e) => { S.calme = e.target.checked; detecteur.intervalle(S.intervalle * (S.calme ? 3 : 1)); valide.reglages(); essaiF.reglages(); } }), T('calme')), el('small', { class: 'vm-aide' }, T('calmeAide')),
    el('label', { class: 'vm-case' }, el('input', { type: 'checkbox', id: 'vmPente', checked: S.pente || null, onchange: (e) => { S.pente = e.target.checked; } }), T('pente')),
    ...(CONFIG.options.loiDeFrequence ? [el('div', { class: 'vm-ligne' }, el('label', { for: 'vmLoi' }, T('loiTitre')), el('select', { id: 'vmLoi', onchange: (e) => { S.loi = e.target.value; valide.reglages(); essaiF.reglages(); $('vmC').disabled = S.loi !== M.LOIS.PLAQUE; for (const pr of S.profils.values()) pr.lisse.fill(0); } }, Object.keys(T('loiChoix')).map((k) => el('option', { value: k, selected: S.loi === k || null }, T('loiChoix')[k]))), el('small', { class: 'vm-aide' }, T('loiAide'))),
      curseur('vmC', T('loiC'), 10, 100, 0.05, S.cPlaque, (v) => { S.cPlaque = v; })] : []),
    ...(CONFIG.options.figureDuSon ? [el('div', { class: 'vm-ligne' }, el('label', { for: 'vmFigure' }, T('figureTitre')), el('select', { id: 'vmFigure', onchange: (e) => { S.figure = e.target.value; for (const pr of S.profils.values()) { pr.sonT = undefined; pr.sonCle = ''; } if (S.figure !== 'motif') for (const pr of S.profils.values()) vecteurDuSon(pr); } }, Object.keys(T('figureChoix')).map((k) => el('option', { value: k, selected: S.figure === k || null }, T('figureChoix')[k]))), el('small', { class: 'vm-aide' }, T('figureAide')))] : []),
    el('button', { type: 'button', id: 'vmPause', 'aria-pressed': 'false', onclick: (e) => { S.pause = !S.pause; e.currentTarget.setAttribute('aria-pressed', String(S.pause)); } }, T('pauseImage')));
  if (CONFIG.options.loiDeFrequence) $('vmC').disabled = S.loi !== M.LOIS.PLAQUE; // c ne sert qu'à la loi de la plaque
}
function commandesScene() {
  const c = $('vmScene'); c.replaceChildren();
  if (CONFIG.scene.fenetreProjection) c.append(el('button', { type: 'button', id: 'vmProjection', onclick: ouvrirProjection }, T('projection')));
  c.append(el('p', { class: 'vm-aide' }, `${T('sceneAide')} ${CONFIG.scene.veilleEmpechee ? T('veille') : ''}`));
  const e = $('vmEnregistrement'); e.replaceChildren();
  if (CONFIG.enregistrement.actif) e.append(
    el('div', { class: 'vm-ligne' }, el('label', { for: 'vmFormatVideo' }, T('formatVideo')), el('select', { id: 'vmFormatVideo' }, CONFIG.enregistrement.formats.map((f) => el('option', { value: f }, T('format' + f))))),
    el('label', { class: 'vm-case' }, el('input', { type: 'checkbox', id: 'vmSignature', checked: S.signature || null, onchange: (ev) => { S.signature = ev.target.checked; } }), T('signature', { texte: CONFIG.enregistrement.signatureTexte })),
    el('button', { type: 'button', id: 'vmEnreg', 'aria-pressed': 'false', onclick: lancerEnregistrement }, T('enreg')));
  $('vmRaccourcis').replaceChildren(...T('raccourcis').flatMap(([k, v]) => [el('dt', {}, el('kbd', {}, k)), el('dd', {}, v)]));
}
function construireSon() {
  const src = $('vmSource'); src.replaceChildren(
    ...(CONFIG.entrees.morceaux ? CONFIG.morceaux.map((m, i) => el('option', { value: m.id }, T('morceau', { n: i + 1, note: T('notes')[m.id] }))) : []),
    CONFIG.entrees.fichier ? el('option', { value: 'file' }, T('sourceFichier')) : null, CONFIG.entrees.micro ? el('option', { value: 'mic' }, T('sourceMicro')) : null,
    CONFIG.entrees.musiqueEssai ? el('option', { value: 'essai' }, T('sourceEssai')) : null, CONFIG.entrees.captureOnglet ? el('option', { value: 'onglet' }, T('sourceOnglet')) : null);
  let precedent = src.value;
  src.addEventListener('change', () => { if (S.source) arreterSource(); if (src.value === 'file') { $('vmFichier').click(); } else precedent = src.value; });
  const f = $('vmFichier');
  f.addEventListener('change', (e) => { const fi = e.target.files[0]; if (!fi) { src.value = precedent; return; } if (A.fichierUrl) URL.revokeObjectURL(A.fichierUrl); A.fichierUrl = URL.createObjectURL(fi); A.fichierNom = fi.name; precedent = 'file'; if (S.source) arreterSource(); S.etat = T('etatFichier', { nom: fi.name }); });
  f.addEventListener('cancel', () => { src.value = precedent; }); // le choix de fichier annulé
  $('vmLecture').addEventListener('click', lecture); $('vmLecture').textContent = T('lecture');
  $('vmEntreeLigne').hidden = !CONFIG.entrees.peripheriques;
  $('vmEntree').replaceChildren(el('option', { value: '' }, T('entreeDefaut')));
}
function habiller() {
  for (const e of document.querySelectorAll('[data-t]')) e.textContent = T(e.dataset.t);
  document.title = T('titrePage');
  $('vmVoirAussi').replaceChildren(...T('voirAussi').map((c) => el('a', { class: 'vm-carte', href: c.href }, el('b', {}, c.titre), el('span', {}, c.texte))));
  $('vmValideTitre').replaceChildren(T('valide'), ' ', el('span', { class: 'vm-tag' }, T('valideTag')));
  $('vmEssaiTitre').replaceChildren(T('essai'), ' ', el('span', { class: 'vm-tag e' }, T('essaiTag')));
  $('vmValider').textContent = T('validerEssai'); $('vmAnnuler').textContent = T('annuler'); $('vmPleinBtn').textContent = T('pleinEcran'); $('vmQuitter').textContent = T('quitterPleinEcran');
  $('vmFenAide').textContent = T('fenetresAide'); $('vmMentionIA').textContent = T('mentionIA'); $('vmEntreeAide').textContent = T('entreeAide');
  $('vmValideToile').setAttribute('aria-label', T('fenetreValide')); $('vmEssaiToile').setAttribute('aria-label', T('fenetreEssai'));
  $('vmBasculeValide').textContent = T('basculeValide'); $('vmBasculeEssai').textContent = T('basculeEssai'); $('vmEntreeLabel').textContent = T('entree');
  $('vmSonLabel').textContent = T('sonChoix'); $('vmTitreReglages').textContent = T('reglagesTitre'); $('vmTitreScene').textContent = T('sceneTitre'); $('vmTitreEnreg').textContent = T('enregTitre'); $('vmTitreRacc').textContent = T('raccourcisTitre'); $('vmTitreCles').textContent = T('clesTitre'); $('vmTitreComprendre').textContent = T('comprendreTitre');
}
function clavier(e) {
  if (e.target.closest && e.target.closest('input,select,textarea')) return;
  const k = e.key.toLowerCase(), vues = Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]);
  if (e.key === 'Escape') { if (enPleinEcran) quitterPlein(); fermerTout(); return; }
  if (/^[1-3]$/.test(k) && vues[Number(k) - 1]) { esel = { ...esel, view: vues[Number(k) - 1] }; viser(esel); rafraichir(); }
  else if (k === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); const ms = Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m] && m !== M.MODES.OCTAVES); esel = { ...esel, mode: ms[(ms.indexOf(esel.mode) + 1) % ms.length] }; viser(esel); rafraichir(); }
  else if (k === 'p') { S.pause = !S.pause; $('vmPause').setAttribute('aria-pressed', String(S.pause)); }
  else if (k === 'v') valider(); else if (k === 'f') pleinEcran(); else if (k === 'r') lancerEnregistrement();
}

export async function monter() {
  habiller();
  monterSemaine(); // le bloc « La semaine » : indépendant des données de l'outil, masqué si son fichier manque
  try { await charger(); } catch (err) { message(T('erreurDonnees', { message: err.message })); return; }
  detecteur = M.creerDetecteurAttaques({ intervalleMin: S.intervalle, sigma: S.seuil });
  valide = new Fenetre($('vmValideToile'), $('vmValideCap')); essaiF = new Fenetre($('vmEssaiToile'), $('vmEssaiCap'));
  valide.setCfg(valCfg); essaiF.setCfg(esel);
  construireSon(); construireGroupes(); reglagesAvances(); commandesScene(); rafraichir();
  if (CONFIG.options.pourComprendre) { const d = $('vmComprendre'); d.hidden = false; d.addEventListener('toggle', () => { if (d.open) monterComprendre(); }); }
  $('vmValider').addEventListener('click', valider); $('vmAnnuler').addEventListener('click', annuler); $('vmPleinBtn').addEventListener('click', pleinEcran);
  $('vmQuitter').addEventListener('click', quitterPlein);
  $('vmBasculeValide').addEventListener('click', () => document.body.classList.remove('vm-essai-seul'));
  $('vmBasculeEssai').addEventListener('click', () => document.body.classList.add('vm-essai-seul'));
  document.addEventListener('click', (e) => { if (!e.target.closest('.vm-opts')) fermerTout(); });
  document.addEventListener('keydown', clavier);
  const changePlein = () => { if (!enPleinEcran) return; if (!pleinDemandeNatif() && pleinNatif) sortiePleinEcran(); else calerPlein(); }; // sorti par Échap, ou redimensionné
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, changePlein);
  for (const ev of ['resize', 'orientationchange']) window.addEventListener(ev, () => { if (enPleinEcran) calerPlein(); });
  for (const ev of ['mousemove', 'pointerdown', 'keydown', 'touchstart']) document.addEventListener(ev, veilleScene);
  document.addEventListener('visibilitychange', () => { S.acc = 0; });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', listerEntrees);
  window.addEventListener('pagehide', () => { arreterSource(); if (A.fichierUrl) URL.revokeObjectURL(A.fichierUrl); });
  requestAnimationFrame(boucle);
  window.__voirSaMusique = { S, M, etat: () => ({ source: S.source, motif: valide.dernier.motif, motifEssai: essaiF.dernier.motif, fondu: Math.min(valide.dernier.fondu, essaiF.dernier.fondu), valide: { ...valCfg }, essai: { ...esel }, fps: S.fps, tuileEssai: S.tuileEssai, teinte: S.teinte, constructions: S.constructions, blocs: [...S.blocs.keys()], n: valide.dernier && S.blocs.get(valCfg.col).n, msVoisins: Object.fromEntries([...S.blocs].map(([k, b]) => [k, b.msVoisins || 0])), memoireJs: performance.memory ? performance.memory.usedJSHeapSize : null }), arreterSource, lireElement, tuile, tuilesParCote, caseAttendue: () => tuilePleinEcran($('vmPleinToile')) / M.GRILLE[valCfg.fmt] };
}
