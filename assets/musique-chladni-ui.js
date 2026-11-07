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
  donnees: null, blocs: {}, coll: null, bandes: new Map(),
  lisse: new Float64Array(M.NS12), tSim: 0, teinte: 200, acc: 0, fps: 0, source: null, etat: '',
  seuil: C.seuilAttaques, intervalle: C.intervalleMinSecondes, lissage: C.lissage, pente: C.penteDesGraves,
  calme: MQ_CALME.matches, pulsation: M.PULSATIONS.ATTAQUE, pause: false, signature: CONFIG.enregistrement.signature,
  perso: { ink: rgb(ENCRE), bg: rgb(CREME) }, tuileEssai: C.tuileFenetre, lent: 0, resReduite: false, ia: false,
};
const CFG0 = { mode: 'image', fmt: 12, col: 'tri', view: 'signes', fond: 'B2', pal: 'creme' };
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
async function charger() {
  const [donnees, jColl, jCalc] = await Promise.all([lJson('data/musique-chladni-12.json'), lJson('data/fonds/collection-v1.json'), lJson('data/fonds/collection-v1.calculs.json')]);
  S.donnees = donnees; S.coll = chargerCollection(jColl, { calculs: jCalc });
  for (const id of ['tri', 'bi']) { S.blocs[id] = M.preparerBloc(donnees, id); const e = M.controlerBloc(S.blocs[id]); if (e.length) throw new Error(e.join(' ; ')); }
  for (const id of M.BANDES) if (!S.coll.fonds.get(id)) throw new Error(T('bandeManque', { id }));
}
function etats(id) { // les deux états d'une case : le fond, et le même fond tourné de 90° (mode unique, forcé ici)
  if (!S.bandes.has(id)) S.bandes.set(id, M.etatsDeCase(Uint8Array.from(rasteriser(S.coll.fonds.get(id), 0, 60), (x) => (x === 1 ? 1 : 0)), 60));
  return S.bandes.get(id);
}

// ---------- les tuiles (un motif, une vue, des couleurs) ----------
const cacheTuiles = new Map();
function tuile(col, j, vue, fond, c, T) {
  const bloc = S.blocs[col], pal = couleurs(c), cle = `${T}|${col}|${j}|${vue}|${vue === 'pavage' && col === 'bi' ? fond : ''}|${paletteCle(c)}`;
  let t = cacheTuiles.get(cle); if (t) { cacheTuiles.delete(cle); cacheTuiles.set(cle, t); return t; } // LRU
  const A8 = new Uint8Array(T * T);
  if (vue === 'pavage') { if (col === 'tri') M.masqueTricolore(bloc, j, T, A8); else M.masqueBicolore(bloc, j, etats(fond), T, A8); }
  else M.figure12(M.champ12(bloc, j), T, vue, A8);
  t = document.createElement('canvas'); t.width = t.height = T;
  const x = t.getContext('2d'), im = x.createImageData(T, T), d = im.data, [ink, bg, mid] = pal, tri3 = col === 'tri' && vue === 'pavage' && mid;
  for (let i = 0; i < T * T; i++) {
    let r, g, b; const a = A8[i];
    if (tri3) { const q = a === 255 ? ink : a === 128 ? mid : bg; [r, g, b] = q; }
    else { const k = a / 255; r = bg[0] + (ink[0] - bg[0]) * k; g = bg[1] + (ink[1] - bg[1]) * k; b = bg[2] + (ink[2] - bg[2]) * k; }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0); cacheTuiles.set(cle, t); if (cacheTuiles.size > 260) cacheTuiles.delete(cacheTuiles.keys().next().value);
  return t;
}
/** Le pavage 2 × 2 par translation (jamais de miroir), qui continue à remplir un cadre plus long que large. */
function pavage(ctx, W, H, t, alpha) {
  const s = Math.min(W, H) / CONFIG.pavage, ox = (W - s * Math.ceil(W / s)) / 2, oy = (H - s * Math.ceil(H / s)) / 2;
  ctx.globalAlpha = alpha; for (let y = oy; y < H; y += s) for (let x = ox; x < W; x += s) ctx.drawImage(t, x, y, s, s); ctx.globalAlpha = 1;
}

// ---------- une fenêtre : sa configuration, son pilote, son rendu ----------
class Fenetre {
  constructor(cv, cap) { this.cv = cv; this.ctx = cv.getContext('2d'); this.cap = cap; this.cfg = null; this.p = null; this.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 }; }
  options() { return { mode: this.cfg.mode, hysteresis: C.hysteresis, tenueMin: C.tenueMinImages, fondu: C.fonduSecondes, calme: S.calme, pulsation: S.pulsation }; }
  setCfg(c) {
    const ancienne = this.cfg; this.cfg = { ...c };
    if (!this.p || !ancienne || ancienne.col !== c.col) { this.p = M.creerPilote(S.blocs[c.col], this.options()); this.dernier = { motif: 0, ancien: -1, fondu: 1, score: 0 }; }
    else this.p.reglages(this.options());
    const colInfo = T('collections')[c.col], vue = T('vues')[c.view][0], variante = c.col === 'bi' && c.view === 'pavage' ? ` · ${T('fond', { id: c.fond })}` : '';
    this.cap.textContent = T('legendeFenetre', { mode: T('modes')[c.mode][0], collection: colInfo[0], vue, fond: variante, palette: T('palettes')[c.pal][0] });
  }
  reglages() { if (this.p) this.p.reglages(this.options()); }
  pas(attaque) { if (!S.pause) this.dernier = this.p.pas({ v: S.lisse, attaque, t: S.tSim }); }
  peindre(ctx = this.ctx, W = this.cv.width, H = this.cv.height, T = C.tuileFenetre) {
    const c = this.cfg, pal = couleurs(c), d = this.dernier;
    ctx.fillStyle = hex(pal[1]); ctx.fillRect(0, 0, W, H);
    if (d.fondu < 1 && d.ancien >= 0) { pavage(ctx, W, H, tuile(c.col, d.ancien, c.view, c.fond, c, T), 1); pavage(ctx, W, H, tuile(c.col, d.motif, c.view, c.fond, c, T), d.fondu); }
    else pavage(ctx, W, H, tuile(c.col, d.motif, c.view, c.fond, c, T), 1);
  }
}

// ---------- l'analyse du son : UNE seule, pour les deux fenêtres ----------
function analyser() {
  A.an8.getFloatFrequencyData(f8); A.an2.getFloatFrequencyData(f2);
  const sr = A.ctx.sampleRate, brut = M.bandesDuSon(f8, sr, { fref: C.fref, pente: S.pente });
  for (let k = 0; k < M.NS12; k++) S.lisse[k] = (1 - S.lissage) * S.lisse[k] + S.lissage * brut[k];
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
  if (enPleinEcran) valide.peindre($('vmPleinToile').getContext('2d'), $('vmPleinToile').width, $('vmPleinToile').height, C.tuilePleinEcran);
  if (projection && !projection.win.closed) { const c = projection.canvas; if (c.width !== 720) c.width = c.height = 720; valide.peindre(c.getContext('2d'), 720, 720, C.tuileFenetre); }
  if (rec) composer();
  if (Math.floor(ms / 500) !== dernierInfo) { dernierInfo = Math.floor(ms / 500); majInfo(); adapter(); if (esel.pal === 'son' || valCfg.pal === 'son') dessinerMiniatures(); }
}
function adapter() { // 30 images/s d'abord : on baisse la résolution de l'essai, pas la cadence
  const lent = S.source && S.fps < C.imagesParSeconde * 0.8; S.lent = lent ? S.lent + 1 : 0;
  if (S.lent >= 6 && S.tuileEssai > 180) { S.tuileEssai = Math.max(180, Math.round(S.tuileEssai * 0.75)); S.resReduite = true; S.lent = 0; }
}
function majInfo() {
  const j = valide.dernier.motif, n = S.blocs[valCfg.col].n, p = [S.etat || T('etatDepart')];
  if (S.source) { p.push(T('infoMotif', { i: j + 1, n })); p.push(T('infoImages', { fps: S.fps.toFixed(0) })); }
  if (S.resReduite) p.push(T('infoResolution'));
  $('vmInfo').textContent = p.join(' · ');
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
  S.source = null; S.ia = false; S.lisse.fill(0); detecteur.reinitialiser(); valide.p.reinitialiser(); essaiF.p.reinitialiser();
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
function pleinEcran() {
  const f = $('vmPlein'); if (!f.requestFullscreen) return message(T('pleinEcranIndispo'));
  f.hidden = false; const c = $('vmPleinToile'); c.width = Math.max(720, screen.width); c.height = Math.max(720, screen.height);
  f.requestFullscreen().then(() => { enPleinEcran = true; }).catch(() => { f.hidden = true; message(T('pleinEcranIndispo')); });
}
function sortiePleinEcran() { const f = $('vmPlein'); f.hidden = true; enPleinEcran = false; f.classList.remove('vm-masque'); }
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
function appliquer(cle, valeur) {
  const n = { ...esel, [cle]: valeur };
  if (cle === 'fmt') { n.col = 'tri'; n.view = 'pavage'; } // l'ordre 12 bascule la vue sur « Cellules »
  if (cle === 'col' && valeur === 'bi' && esel.view === 'pavage') n.view = 'pavage';
  return n;
}
function option(groupe, cle, valeur, titre, detail, miniature, desactive = false) {
  const b = el('button', { type: 'button', class: 'vm-o', id: `vm-o-${groupe}-${valeur}`, 'data-g': groupe, 'data-k': valeur, 'aria-pressed': 'false', disabled: desactive || null, title: detail || '' },
    miniature ? el('canvas', { width: miniature === 'double' ? 136 : 68, height: 68, 'aria-hidden': 'true' }) : null, el('div', {}, el('b', {}, titre), detail ? el('small', {}, detail) : null));
  if (miniature) miniatures.push([b.querySelector('canvas'), cle, valeur]);
  const num = (v) => (isNaN(+v) ? v : +v);
  if (!desactive) {
    b.addEventListener('mouseenter', () => { essaiF.setCfg(appliquer(cle, num(valeur))); });
    b.addEventListener('focus', () => { essaiF.setCfg(appliquer(cle, num(valeur))); });
    b.addEventListener('click', () => { esel = appliquer(cle, num(valeur)); essaiF.setCfg(esel); rafraichir(); });
  }
  return b;
}
function groupe(id, cle, titre, options) {
  const g = $(id), btn = el('button', { type: 'button', id: `${id}-btn`, 'aria-expanded': 'false', 'aria-controls': `${id}-pan` }, titre), pan = el('div', { class: 'vm-pan', id: `${id}-pan`, role: 'group', 'aria-label': titre }, options);
  g.replaceChildren(el('h3', {}, btn), pan);
  btn.addEventListener('click', (ev) => { ev.stopPropagation(); const ouvrir = !g.classList.contains('open'); fermerTout(); if (ouvrir) { g.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } });
  g.addEventListener('mouseleave', () => essaiF.setCfg(esel));
  g.addEventListener('focusout', (e) => { if (!g.contains(e.relatedTarget)) essaiF.setCfg(esel); });
}
function fermerTout() { for (const g of document.querySelectorAll('.vm-opts .vm-grp.open')) { g.classList.remove('open'); g.querySelector('button').setAttribute('aria-expanded', 'false'); } }
function construireGroupes() {
  miniatures.length = 0;
  const G = T('groupes');
  groupe('vm-g-mode', 'mode', G.mode, Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m]).map((m) => option('mode', 'mode', m, T('modes')[m][0], T('modes')[m][1])));
  groupe('vm-g-fmt', 'fmt', G.fmt, CONFIG.ordres.map((o) => option('fmt', 'fmt', String(o.ordre), o.actif ? T('format').titre.replace('{n}', o.ordre) : T('format').bientot.replace('{n}', o.ordre), o.actif ? T('format').detail.replace(/\{n\}/g, o.ordre).replace('{m}', S.blocs.tri.n + S.blocs.bi.n) : '', o.actif ? 'simple' : null, !o.actif)));
  groupe('vm-g-col', 'col', G.col, Object.keys(CONFIG.collections).filter((c) => CONFIG.collections[c]).map((c) => option('col', 'col', c, T('collections')[c][0], T('collections')[c][1].replace('{n}', S.blocs[c].n), 'simple')));
  groupe('vm-g-view', 'view', G.view, Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]).map((v) => option('view', 'view', v, T('vues')[v][0], T('vues')[v][1])));
  if (CONFIG.variantesDeCase) groupe('vm-g-fond', 'fond', G.fond, [el('p', { class: 'vm-aide' }, T('fondAide')), ...M.BANDES.map((id) => option('fond', 'fond', id, T('fond', { id }), '', 'double'))]);
  else $('vm-g-fond').remove();
  const pers = el('div', { id: 'vmPerso', class: 'vm-aide', hidden: true }, el('label', {}, T('persoMotif'), ' ', el('input', { type: 'color', id: 'vmPi', value: hex(S.perso.ink) })), ' ', el('label', {}, T('persoFond'), ' ', el('input', { type: 'color', id: 'vmPb', value: hex(S.perso.bg) })));
  groupe('vm-g-pal', 'pal', G.pal, [...PALETTES_PAGE.map((k) => option('pal', 'pal', k, T('palettes')[k][0], T('palettes')[k][1], 'simple')), pers, el('p', { class: 'vm-aide' }, T('tricoloreAide'))]);
  const persoChange = () => { S.perso = { ink: rgb($('vmPi').value), bg: rgb($('vmPb').value) }; esel = { ...esel, pal: 'perso' }; cacheTuiles.clear(); essaiF.setCfg(esel); rafraichir(); };
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
      const col = cle === 'col' ? valeur : 'tri'; x.drawImage(tuile(col, 0, 'pavage', esel.fond, { ...esel, col }, 360), 0, 0, 68, 68);
    }
  }
}
function rafraichir() {
  const marque = (g, vrai, val) => { for (const b of document.querySelectorAll(`.vm-o[data-g="${g}"]`)) { b.setAttribute('aria-pressed', String(vrai(b.dataset.k))); b.classList.toggle('val', val(b.dataset.k)); } };
  marque('mode', (k) => esel.mode === k, (k) => valCfg.mode === k); marque('fmt', (k) => esel.fmt === +k, (k) => valCfg.fmt === +k); marque('col', (k) => esel.col === k, (k) => valCfg.col === k);
  marque('view', (k) => esel.view === k, (k) => valCfg.view === k); marque('fond', (k) => esel.fond === k, (k) => valCfg.fond === k); marque('pal', (k) => esel.pal === k, (k) => valCfg.pal === k);
  const g = $('vm-g-fond'); if (g) g.hidden = esel.col !== 'bi';
  $('vmPerso').hidden = esel.pal !== 'perso'; dessinerMiniatures();
}
function valider() { valCfg = { ...esel }; valide.setCfg(valCfg); valide.p = M.creerPilote(S.blocs[valCfg.col], valide.options()); valide.p.copier(essaiF.p); valide.dernier = { ...essaiF.dernier }; rafraichir(); }
function annuler() { esel = { ...valCfg }; essaiF.setCfg(esel); rafraichir(); }

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
    el('button', { type: 'button', id: 'vmPause', 'aria-pressed': 'false', onclick: (e) => { S.pause = !S.pause; e.currentTarget.setAttribute('aria-pressed', String(S.pause)); } }, T('pauseImage')));
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
  $('vmSonLabel').textContent = T('sonChoix'); $('vmTitreReglages').textContent = T('reglagesTitre'); $('vmTitreScene').textContent = T('sceneTitre'); $('vmTitreEnreg').textContent = T('enregTitre'); $('vmTitreRacc').textContent = T('raccourcisTitre');
}
function clavier(e) {
  if (e.target.closest && e.target.closest('input,select,textarea')) return;
  const k = e.key.toLowerCase(), vues = Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]);
  if (e.key === 'Escape') { fermerTout(); return; }
  if (/^[1-3]$/.test(k) && vues[Number(k) - 1]) { esel = { ...esel, view: vues[Number(k) - 1] }; essaiF.setCfg(esel); rafraichir(); }
  else if (k === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); const ms = Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m]); esel = { ...esel, mode: ms[(ms.indexOf(esel.mode) + 1) % ms.length] }; essaiF.setCfg(esel); rafraichir(); }
  else if (k === 'p') { S.pause = !S.pause; $('vmPause').setAttribute('aria-pressed', String(S.pause)); }
  else if (k === 'v') valider(); else if (k === 'f') pleinEcran(); else if (k === 'r') lancerEnregistrement();
}

export async function monter() {
  habiller();
  try { await charger(); } catch (err) { message(T('erreurDonnees', { message: err.message })); return; }
  detecteur = M.creerDetecteurAttaques({ intervalleMin: S.intervalle, sigma: S.seuil });
  valide = new Fenetre($('vmValideToile'), $('vmValideCap')); essaiF = new Fenetre($('vmEssaiToile'), $('vmEssaiCap'));
  valide.setCfg(valCfg); essaiF.setCfg(esel);
  construireSon(); construireGroupes(); reglagesAvances(); commandesScene(); rafraichir();
  $('vmValider').addEventListener('click', valider); $('vmAnnuler').addEventListener('click', annuler); $('vmPleinBtn').addEventListener('click', pleinEcran);
  $('vmQuitter').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); sortiePleinEcran(); });
  $('vmBasculeValide').addEventListener('click', () => document.body.classList.remove('vm-essai-seul'));
  $('vmBasculeEssai').addEventListener('click', () => document.body.classList.add('vm-essai-seul'));
  document.addEventListener('click', (e) => { if (!e.target.closest('.vm-opts')) fermerTout(); });
  document.addEventListener('keydown', clavier);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) sortiePleinEcran(); });
  for (const ev of ['mousemove', 'pointerdown', 'keydown', 'touchstart']) document.addEventListener(ev, veilleScene);
  document.addEventListener('visibilitychange', () => { S.acc = 0; });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', listerEntrees);
  window.addEventListener('pagehide', () => { arreterSource(); if (A.fichierUrl) URL.revokeObjectURL(A.fichierUrl); });
  requestAnimationFrame(boucle);
  window.__voirSaMusique = { S, M, etat: () => ({ source: S.source, motif: valide.dernier.motif, motifEssai: essaiF.dernier.motif, fondu: Math.min(valide.dernier.fondu, essaiF.dernier.fondu), valide: { ...valCfg }, essai: { ...esel }, fps: S.fps, tuileEssai: S.tuileEssai, teinte: S.teinte }), arreterSource, lireElement, tuile };
}
