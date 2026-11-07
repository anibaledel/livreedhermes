// musique-chladni-ui.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'interface de musique-chladni.html. Elle relie le moteur (musique-chladni-moteur.js, sans
// DOM) au navigateur : sources audio, canevas, commandes, enregistrement, mode scène.
// Aucune phrase ici (tout est dans musique-chladni-textes.js) et aucun réglage de fonctionnalité
// (tout est dans musique-chladni-config.js). La page n'envoie RIEN : fichier, micro et audio
// capturé restent dans le navigateur.
import * as M from './musique-chladni-moteur.js';
import { CONFIG } from './musique-chladni-config.js';
import { TEXTES, texte as T } from './musique-chladni-textes.js';
import { PALETTES, PINTEREST_NIVEAUX_DE_GRIS, ENCRE, CREME, OR } from './couleurs.js';
import { chargerCollection, motifSvg, rasteriser } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const hexVersRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u} : ${r.status}`); return r.json(); });
const TAILLE = 720;
const MQ_CALME = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

// ---------- l'état ----------
const S = {
  donnees: null, coll: null, fondsOrdre: [], grilles: { bi: [], tri: [] }, corpus: { bi: null, tri: null },
  ordre: 12, rendu: 'bicolore', paire: 'creme', vue: 'signes', mode: M.MODES.IMAGE, pulsation: M.PULSATIONS.ATTAQUE, inspecter: false,
  fondMode: 'fixe', fondId: CONFIG.fonds.defaut, fondDepuis: 0,
  ...CONFIG.moteur, calme: MQ_CALME.matches, pause: false, signature: CONFIG.enregistrement.signature,
  source: null, sourceTexte: '', morceauIA: false,
  lissé: new Float64Array(M.NS12), dernier: { motif: -1, ancien: -1, fondu: 1, score: 0 }, t0: 0,
  champs: null, F: null, res: CONFIG.moteur.resolutionFigure, images: [], fps: 0,
};
const A = { ctx: null, an: null, sortie: null, dest: null, el: null, srcEl: null, srcNode: null, flux: null, essai: null, wake: null };
let pilote = null, detecteur = null, detecteurGrave = null, canvas, c2d, hors, hors2d, info, raf = 0, dernierMs = 0, projection = null;
let rec = null;

const corpusActif = () => (S.rendu === 'bicolore' ? S.corpus.bi : S.corpus.tri);
const grillesActives = () => (S.rendu === 'bicolore' ? S.grilles.bi : S.grilles.tri);
const palette = () => PALETTES[S.paire];

// ---------- les données ----------
function grilleDe(d, [fam, subA, subB, n]) {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const A = d.families[fam][subA], B = d.families[fam][subB];
  return d.layerOf.map((ligne, r) => ligne.map((pos, c) => (traits[pos - 1] === 1 ? A[r][c] : B[r][c])));
}
const octets = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** L'ordre des fonds du plus proche au plus proche, en partant du fond par défaut. */
function ordreDesFonds(coll) {
  const ids = [...coll.fonds.keys()], g = new Map();
  for (const id of ids) { const f = coll.fonds.get(id); g.set(id, [rasteriser(f, 0, 12), rasteriser(f, 1, 12)]); }
  const ham = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) s++; return s; };
  const dist = (a, b) => Math.min(ham(g.get(a)[0], g.get(b)[0]) + ham(g.get(a)[1], g.get(b)[1]), ham(g.get(a)[0], g.get(b)[1]) + ham(g.get(a)[1], g.get(b)[0]));
  const depart = ids.includes(CONFIG.fonds.defaut) ? CONFIG.fonds.defaut : ids[0], suite = [depart], reste = new Set(ids.filter((x) => x !== depart));
  while (reste.size) { const dernier = suite[suite.length - 1]; let best = null, bd = Infinity; for (const x of reste) { const d = dist(dernier, x); if (d < bd) { bd = d; best = x; } } suite.push(best); reste.delete(best); }
  return suite;
}

async function charger() {
  const [donnees, lum, jColl, jCalc] = await Promise.all([lJson('data/fonds_ecran_v1.json'), lJson('data/musique-chladni-12.json'), lJson('data/fonds/collection-v1.json'), lJson('data/fonds/collection-v1.calculs.json')]);
  S.donnees = donnees; S.lum = lum;
  S.coll = chargerCollection(jColl, { calculs: jCalc });
  S.fondsOrdre = ordreDesFonds(S.coll);
  S.grilles.bi = lum.entrees.map((e) => grilleDe(donnees, e));
  S.grilles.tri = lum.tricolore.entrees.map((e) => grilleDe(donnees, e));
  S.corpus.bi = M.creerCorpus(octets(lum.lum));
  S.corpus.tri = M.creerCorpus(octets(lum.tricolore.lum));
}

// ---------- le dessin ----------
function figureVersToile(couleursDe) {
  const R = S.res, img = hors2d.createImageData(R, R), d = img.data;
  for (let i = 0; i < S.F.length; i++) { const c = couleursDe(S.F[i]); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
  hors.width = hors.height = R; hors2d.putImageData(img, 0, 0);
  c2d.imageSmoothingEnabled = false; c2d.drawImage(hors, 0, 0, TAILLE, TAILLE);
}
function couleursFigure(vue) {
  if (S.rendu === 'bicolore') {
    const clair = hexVersRgb(palette()[0]), sombre = hexVersRgb(palette()[1]);
    return vue === 'lignes' ? (v) => (M.teinteLignes(v, S.seuilLignes) === 0 ? sombre : clair) : (v) => (M.teinteSignes(v) === 0 ? sombre : clair);
  }
  const [sombre, milieu, clair] = PINTEREST_NIVEAUX_DE_GRIS.map(hexVersRgb); // M, O, V
  return (v) => (Math.abs(v) < S.seuilLignes ? milieu : v > 0 ? sombre : clair);
}
const cacheImages = new Map();
function imageDuMotif(i) {
  const cle = `${i}|${S.fondId}|${palette().join()}`;
  let e = cacheImages.get(cle);
  if (!e) {
    e = { ok: false, img: new Image() };
    try {
      const { cases } = lectureBinaire(S.grilles.bi[i], `motif ${i}`);
      const svg = motifSvg(cases, palette(), S.coll.fonds.get(S.fondId), { size: TAILLE });
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      e.img.onload = () => { e.ok = true; URL.revokeObjectURL(url); };
      e.img.src = url;
    } catch (err) { e.erreur = err; }
    cacheImages.set(cle, e);
    if (cacheImages.size > 400) cacheImages.delete(cacheImages.keys().next().value);
  }
  return e.ok ? e.img : null;
}
function dessinerMotif(i, alpha) {
  if (i < 0) return;
  c2d.globalAlpha = alpha;
  if (S.rendu === 'bicolore') { const im = imageDuMotif(i); if (im) c2d.drawImage(im, 0, 0, TAILLE, TAILLE); }
  else {
    const [sombre, milieu, clair] = PINTEREST_NIVEAUX_DE_GRIS, g = S.grilles.tri[i], p = TAILLE / 12, ton = { M: sombre, O: milieu, V: clair };
    g.forEach((ligne, r) => ligne.forEach((c, k) => { c2d.fillStyle = ton[c]; c2d.fillRect(k * p, r * p, p + 1, p + 1); }));
  }
  c2d.globalAlpha = 1;
}
function dessiner(t) {
  const r = S.dernier, vue = M.vueAuTemps(S.vue, t);
  c2d.fillStyle = S.rendu === 'bicolore' ? palette()[0] : PINTEREST_NIVEAUX_DE_GRIS[2];
  c2d.fillRect(0, 0, TAILLE, TAILLE);
  if (vue === 'motif') {
    if (r.fondu < 1 && r.ancien >= 0) dessinerMotif(r.ancien, 1);
    dessinerMotif(r.motif, r.fondu < 1 && r.ancien >= 0 ? r.fondu : 1);
  } else if (M.calculerFigure(S.lissé, S.champs, S.F)) figureVersToile(couleursFigure(vue));
  if (projection && !projection.closed && projection.canvas) { const p = projection.canvas; if (p.width !== TAILLE) p.width = p.height = TAILLE; p.getContext('2d').drawImage(canvas, 0, 0); }
}

// ---------- le mode d'inspection ----------
function dessinerInspection() {
  const c = $('mcInspection'); if (!c || c.hidden) return;
  const g = c.getContext('2d'), W = c.width, H = c.height, n = M.NS12, pas = W / n;
  g.fillStyle = CREME; g.fillRect(0, 0, W, H);
  let nn = 0; for (let k = 0; k < n; k++) nn += S.lissé[k] * S.lissé[k]; nn = Math.sqrt(nn) || 1;
  const motif = S.dernier.motif, cible = motif >= 0 ? corpusActif().spectres[motif] : null;
  let mx = 0.0001; for (let k = 0; k < n; k++) mx = Math.max(mx, S.lissé[k] / nn, cible ? cible[k] : 0);
  for (let k = 0; k < n; k++) {
    const a = (S.lissé[k] / nn) / mx * (H - 8), b = cible ? cible[k] / mx * (H - 8) : 0;
    g.fillStyle = ENCRE; g.fillRect(k * pas + 1, H - a, pas / 2 - 1, a);
    g.fillStyle = OR; g.fillRect(k * pas + pas / 2, H - b, pas / 2 - 1, b);
  }
}

// ---------- la boucle ----------
function creerMoteur() {
  pilote = M.creerPilote(corpusActif(), { mode: S.mode, hysteresis: S.hysteresis, tenueMin: S.tenueMinImages, fondu: S.fonduSecondes, calme: S.calme, pulsation: S.pulsation });
  detecteur = M.creerDetecteurAttaques({ intervalleMin: S.intervalleMinSecondes, sensibilite: S.sensibilite });
  detecteurGrave = M.creerDetecteurAttaques({ fMin: 40, fMax: 160, intervalleMin: 0.5, sensibilite: S.sensibilite });
}
function prochainFond() { const i = S.fondsOrdre.indexOf(S.fondId); S.fondId = S.fondsOrdre[(i + 1) % S.fondsOrdre.length]; const s = $('mcFond'); if (s) s.value = S.fondId; }
function boucle(ms) {
  raf = requestAnimationFrame(boucle);
  if (ms - dernierMs < 1000 / S.imagesParSeconde - 3) return;
  const dt = ms - dernierMs; dernierMs = ms;
  S.fps = S.fps ? S.fps * 0.9 + (1000 / dt) * 0.1 : 1000 / dt;
  const t = (ms - S.t0) / 1000;
  if (A.an && S.source) {
    const db = new Float32Array(A.an.frequencyBinCount); A.an.getFloatFrequencyData(db);
    const brut = M.bandesDuSon(db, A.ctx.sampleRate, { fref: S.fref, pente: S.penteDesGraves });
    for (let k = 0; k < M.NS12; k++) S.lissé[k] = (1 - S.lissage) * S.lissé[k] + S.lissage * brut[k];
    const att = detecteur.traiter(db, A.ctx.sampleRate, t), grave = detecteurGrave.traiter(db, A.ctx.sampleRate, t);
    if (!S.pause) S.dernier = pilote.pas({ v: S.lissé, attaque: att.attaque, t });
    if (S.fondMode === 'grave' && grave.attaque) prochainFond();
  }
  if (S.fondMode === 'cycle' && t - S.fondDepuis >= CONFIG.fonds.cycleSecondes) { S.fondDepuis = t; prochainFond(); }
  dessiner(t);
  dessinerInspection();
  if (rec) composerEnregistrement();
  if (Math.floor(ms / 500) !== S.dernierInfo) { S.dernierInfo = Math.floor(ms / 500); majInfo(); adapterResolution(); }
}
function adapterResolution() { // 30 images/s d'abord : on baisse la résolution de la figure, pas la cadence
  if (!S.source || S.pause) { S.lent = 0; return; }
  S.lent = S.fps < S.imagesParSeconde * 0.85 ? (S.lent || 0) + 1 : 0;
  if (S.lent >= 4 && S.res > 48) { S.res = Math.max(48, Math.round(S.res * 0.8)); S.champs = M.creerChamps(S.res); S.F = new Float32Array(S.res * S.res); S.lent = 0; S.resReduite = true; }
}
function majPulsation() {
  const sel = $('mcPulsation'); if (!sel || !pilote) return;
  const e = pilote.pulsation(), a = $('mcAidePulsation');
  for (const o of sel.options) o.disabled = o.value !== M.PULSATIONS.ATTAQUE && !e.regulier;
  if (!e.regulier && S.pulsation !== M.PULSATIONS.ATTAQUE) { S.pulsation = M.PULSATIONS.ATTAQUE; sel.value = S.pulsation; appliquerEtat(); }
  if (a) a.textContent = `${T('pulsationAide')} ${e.regulier ? T('pulsationDetectee', { bpm: Math.round(e.bpm) }) : T('pulsationAucune')}`;
}
function majInfo() {
  const r = S.dernier, n = corpusActif().n;
  const parties = [S.source ? T('sourceActive', { source: S.sourceTexte }) : T('silence')];
  if (S.source && r.motif >= 0) parties.push(T('infoMotif', { i: r.motif + 1, n, score: r.score.toFixed(2) }));
  if (S.rendu === 'bicolore' && CONFIG.fonds.selecteur) parties.push(T('infoFond', { fond: S.fondId }));
  if (S.source) parties.push(T('infoImages', { fps: S.fps.toFixed(0) }));
  if (S.pause) parties.push(T('infoPause'));
  info.textContent = parties.join(' · ');
  majPulsation();
}

// ---------- l'audio ----------
async function audioPret() {
  if (!A.ctx) {
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.an = A.ctx.createAnalyser(); A.an.fftSize = 16384; A.an.smoothingTimeConstant = 0.5; A.an.minDecibels = -110;
    A.sortie = A.ctx.createGain(); A.an.connect(A.sortie); A.sortie.connect(A.ctx.destination);
    A.dest = A.ctx.createMediaStreamDestination(); A.an.connect(A.dest);
  }
  await A.ctx.resume();
}
function arreterSource() {
  if (A.el) { A.el.pause(); }
  if (A.srcNode) { try { A.srcNode.disconnect(); } catch { /* déjà détaché */ } A.srcNode = null; }
  if (A.flux) { A.flux.getTracks().forEach((p) => p.stop()); A.flux = null; }
  if (A.essai) { clearInterval(A.essai.timer); A.essai.noeuds.forEach((n) => { try { n.stop(); n.disconnect(); } catch { /* déjà arrêté */ } }); A.essai = null; }
  if (A.wake) { A.wake.release().catch(() => {}); A.wake = null; }
  S.source = null; S.sourceTexte = ''; S.morceauIA = false; S.lissé.fill(0); if (pilote) pilote.reinitialiser(); if (detecteur) detecteur.reinitialiser(); if (detecteurGrave) detecteurGrave.reinitialiser();
  S.dernier = { motif: -1, ancien: -1, fondu: 1, score: 0 };
  majBoutons();
}
async function demarrer(source, texte, { audible = true, ia = false } = {}) {
  erreur('');
  await audioPret();
  S.source = source; S.sourceTexte = texte; S.morceauIA = ia; S.t0 = performance.now(); S.fondDepuis = 0;
  A.sortie.gain.value = audible ? 1 : 0;
  if (CONFIG.scene.veilleEmpechee && navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { A.wake = w; }).catch(() => {});
  majBoutons();
}
function elementAudio() {
  if (!A.el) { A.el = new Audio(); A.el.crossOrigin = 'anonymous'; A.el.loop = true; A.el.addEventListener('error', () => { erreur(T('erreurFichier')); arreterSource(); }); }
  return A.el;
}
async function lireElement(url, source, texte, ia) {
  arreterSource(); await audioPret();
  const e = elementAudio(); e.src = url;
  if (!A.srcEl) A.srcEl = A.ctx.createMediaElementSource(e);
  A.srcNode = A.srcEl; A.srcEl.connect(A.an);
  await demarrer(source, texte, { audible: true, ia });
  try { await e.play(); } catch (err) { erreur(T('erreurAudio', { message: err.message })); arreterSource(); }
}
async function depuisFlux(flux, source, texte) {
  arreterSource(); await audioPret();
  A.flux = flux; A.srcNode = A.ctx.createMediaStreamSource(flux); A.srcNode.connect(A.an);
  flux.getAudioTracks().forEach((p) => p.addEventListener('ended', () => { if (A.flux === flux) { erreur(T('microCoupe')); arreterSource(); } }));
  await demarrer(source, texte, { audible: false });
}
async function ouvrirMicro(deviceId = null) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return erreur(T('erreurMicroAbsent'));
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, ...(deviceId ? { deviceId: { exact: deviceId } } : {}) } });
    await depuisFlux(flux, deviceId ? 'entree' : 'micro', deviceId ? T('sources').entree.replace('{nom}', nomEntree(deviceId)) : T('sources').micro);
    await listerEntrees();
  } catch (err) {
    erreur(err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? T('erreurMicroRefuse') : err && err.name === 'NotFoundError' ? T('erreurMicroAbsent') : T('erreurMicro', { message: err && err.message }));
  }
}
let entrees = [];
const nomEntree = (id) => (entrees.find((x) => x.deviceId === id) || {}).label || id;
async function listerEntrees() {
  if (!CONFIG.entrees.peripheriques || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  entrees = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
  const s = $('mcEntree'); if (!s) return;
  const courant = s.value; s.replaceChildren(el('option', { value: '' }, T('entreeDefaut')), ...entrees.map((d, i) => el('option', { value: d.deviceId }, d.label || `${T('entree')} ${i + 1}`)));
  s.value = courant;
}
async function capturerOnglet() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return erreur(T('erreurOnglet'));
  try {
    const flux = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    flux.getVideoTracks().forEach((p) => p.stop());
    if (!flux.getAudioTracks().length) { erreur(T('erreurOngletSansSon')); return; }
    await depuisFlux(new MediaStream(flux.getAudioTracks()), 'onglet', T('sources').onglet);
  } catch (err) { erreur(err && err.name === 'NotAllowedError' ? T('erreurOnglet') : T('erreurAudio', { message: err && err.message })); }
}
function musiqueEssai() { // les accords de la page test de l'auteur, sur l'ancrage de la page
  arreterSource();
  demarrer('essai', T('sources').essai, { audible: true }).then(() => {
    const noeuds = [], note = (freq, t, dur, g) => {
      const o = A.ctx.createOscillator(), e = A.ctx.createGain(); o.type = 'triangle'; o.frequency.value = freq;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.03); e.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      o.connect(e); e.connect(A.an); o.start(t); o.stop(t + dur + 0.05); noeuds.push(o);
    };
    const accords = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [2, 5, 9, 14]]; let pas = 0;
    const jouer = () => { const c = accords[Math.floor(pas / 4) % 4], n = c[pas % 4], f = S.fref * Math.pow(2, (n + (pas % 3) * 12) / 12); note(f, A.ctx.currentTime + 0.02, 0.9, 0.18); note(f * Math.sqrt(2.3), A.ctx.currentTime + 0.02, 0.6, 0.05); pas++; };
    A.essai = { noeuds, timer: setInterval(jouer, 260) }; jouer();
  }).catch((err) => erreur(T('erreurAudio', { message: err.message })));
}

// ---------- l'enregistrement (comme assets/outil-fond-ecran.js) ----------
const FORMATS_VIDEO = ['video/mp4;codecs="avc1.640028,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,opus"', 'video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
const choisirMime = () => (window.MediaRecorder ? FORMATS_VIDEO.find((t) => MediaRecorder.isTypeSupported(t)) || '' : '');
function dimensions(format) { return format === '916' ? [1080, 1920] : format === '45' ? [1080, 1350] : [1080, 1080]; }
function composerEnregistrement() {
  const { cible, c, W, H } = rec;
  c.fillStyle = S.rendu === 'bicolore' ? palette()[0] : PINTEREST_NIVEAUX_DE_GRIS[2]; c.fillRect(0, 0, W, H);
  const cote = Math.min(W, H), x = (W - cote) / 2, y = (H - cote) / 2;
  c.drawImage(canvas, x, y, cote, cote);
  if (S.signature) {
    const lignes = [CONFIG.enregistrement.signatureTexte]; if (S.morceauIA) lignes.push(CONFIG.enregistrement.ligneIA);
    const haut = 30 + lignes.length * 40, fond = hexVersRgb(PALETTES.creme[1]);
    c.fillStyle = `rgba(${fond[0]},${fond[1]},${fond[2]},0.55)`; c.fillRect(0, H - haut, W, haut);
    c.fillStyle = PALETTES.creme[0]; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 30px system-ui, sans-serif';
    lignes.forEach((l, i) => c.fillText(l, W / 2, H - haut + 28 + i * 40 + 12));
  }
}
function lancerEnregistrement() {
  if (rec) return arreterEnregistrement();
  if (!window.MediaRecorder || !canvas.captureStream) return erreur(T('enregIndispo'));
  if (!S.source) return erreur(T('enregSansSource'));
  const format = $('mcFormat').value, [W, H] = dimensions(format), cible = document.createElement('canvas'); cible.width = W; cible.height = H;
  const flux = new MediaStream(); cible.captureStream(30).getVideoTracks().forEach((p) => flux.addTrack(p));
  A.dest.stream.getAudioTracks().forEach((p) => flux.addTrack(p));
  const mime = choisirMime(); let mr;
  try { mr = mime ? new MediaRecorder(flux, { mimeType: mime }) : new MediaRecorder(flux); } catch (err) { return erreur(T('enregErreur', { message: err.message })); }
  const morceaux = []; rec = { cible, c: cible.getContext('2d'), W, H, mr, debut: performance.now(), minuteur: null };
  mr.ondataavailable = (e) => { if (e.data && e.data.size) morceaux.push(e.data); };
  mr.onstop = () => {
    clearInterval(rec.minuteur); flux.getTracks().forEach((p) => p.stop());
    const type = mr.mimeType || mime || 'video/webm', mp4 = /mp4/.test(type), blob = new Blob(morceaux, { type });
    const a = el('a', { href: URL.createObjectURL(blob), download: `musique-chladni-${S.ordre}-${S.rendu}-${S.vue}-${dimensions(format).join('x')}-${Date.now()}.${mp4 ? 'mp4' : 'webm'}` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    erreur(mp4 ? T('enregPret') : T('enregPret') + ' ' + T('enregWebm'), true);
    window.__derniereVideo = { type, octets: blob.size, largeur: W, hauteur: H }; rec = null; majBoutons();
  };
  mr.start(); majBoutons();
  const duree = CONFIG.enregistrement.dureesSecondes[0];
  rec.minuteur = setInterval(() => { const s = Math.ceil(duree - (performance.now() - rec.debut) / 1000); $('mcEnreg').textContent = T('enregEnCours', { s: Math.max(0, s) }); if (s <= 0) arreterEnregistrement(); }, 250);
}
function arreterEnregistrement() { if (rec && rec.mr.state !== 'inactive') rec.mr.stop(); }

// ---------- la scène ----------
let minuteurScene = 0;
function sceneActive() { return document.fullscreenElement === $('mcScene'); }
function basculerScene() {
  const s = $('mcScene');
  if (sceneActive()) { document.exitFullscreen(); return; }
  if (!s.requestFullscreen) return erreur(T('pleinEcranIndispo'));
  s.requestFullscreen().catch(() => erreur(T('pleinEcranIndispo')));
}
function veilleScene() {
  const s = $('mcScene'); s.classList.remove('mc-masque'); clearTimeout(minuteurScene);
  if (sceneActive()) minuteurScene = setTimeout(() => s.classList.add('mc-masque'), CONFIG.scene.masquerApresMs);
}
function ouvrirProjection() {
  const w = window.open('', 'musique-chladni-projection', 'popup,width=960,height=540');
  if (!w) return erreur(T('projectionBloquee'));
  w.document.title = T('titrePage'); w.document.body.style.cssText = 'margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh';
  const c = w.document.createElement('canvas'); c.width = c.height = TAILLE; c.style.cssText = 'max-width:100%;max-height:100vh;aspect-ratio:1'; w.document.body.append(c);
  projection = { closed: false, canvas: c, win: w }; w.addEventListener('pagehide', () => { projection = null; });
  w.document.addEventListener('keydown', (e) => { if (e.key === 'f' || e.key === 'F') c.requestFullscreen && c.requestFullscreen().catch(() => {}); });
}

// ---------- les commandes ----------
function erreur(msg, bonne = false) { const e = $('mcMessage'); if (!e) return; e.textContent = msg || ''; e.dataset.etat = msg ? (bonne ? 'ok' : 'erreur') : ''; }
function appliquerEtat() {
  pilote.reglages({ mode: S.mode, hysteresis: S.hysteresis, tenueMin: S.tenueMinImages, fondu: S.fonduSecondes, calme: S.calme, pulsation: S.pulsation });
  const calme = S.calme ? 3 : 1;
  detecteur.intervalle(S.intervalleMinSecondes * calme); detecteur.sensibilite(S.sensibilite); detecteurGrave.sensibilite(S.sensibilite);
}
function changerRendu(r) { S.rendu = r; creerMoteur(); appliquerEtat(); S.dernier = { motif: -1, ancien: -1, fondu: 1, score: 0 }; majBoutons(); }
function majBoutons() {
  const set = (id, vrai) => { const b = $(id); if (b) b.setAttribute('aria-pressed', String(!!vrai)); };
  for (const v of Object.keys(CONFIG.vues)) set(`mcVue-${v}`, S.vue === v);
  for (const m of Object.keys(CONFIG.pilotage)) set(`mcMode-${m}`, S.mode === m);
  for (const r of ['bicolore', 'tricolore']) set(`mcRendu-${r}`, S.rendu === r);
  for (const f of Object.keys(T('fondModes'))) set(`mcFondMode-${f}`, S.fondMode === f);
  set('mcMicro', S.source === 'micro'); set('mcEssai', S.source === 'essai'); set('mcOnglet', S.source === 'onglet'); set('mcPause', S.pause);
  const b = $('mcEnreg'); if (b && !rec) b.textContent = T('enreg'); if (b) b.setAttribute('aria-pressed', String(!!rec));
  const aide = $('mcAideVue'); if (aide) aide.textContent = T('vueAide')[S.vue] + (S.rendu === 'tricolore' && (S.vue === 'signes' || S.vue === 'lignes') ? ' ' + T('vueTricolore') : '');
  const ap = $('mcAidePilotage'); if (ap) ap.textContent = T('pilotageAide')[S.mode];
  const ar = $('mcAideRendu'); if (ar) ar.textContent = S.rendu === 'bicolore' ? T('renduAideBicolore') : T('renduAideTricolore');
  const af = $('mcAideFond'); if (af) af.textContent = T('fondAide')[S.fondMode].replace('{n}', CONFIG.fonds.cycleSecondes) + (S.rendu === 'tricolore' ? ' ' + T('fondNonBicolore') : '');
}
function bouton(id, libelle, onclick, pressable = false) { return el('button', { type: 'button', id, onclick, ...(pressable ? { 'aria-pressed': 'false' } : {}) }, libelle); }
function curseur(id, libelle, min, max, pas, valeur, onchange) {
  const sortie = el('output', { for: id }, String(valeur));
  const i = el('input', { type: 'range', id, min, max, step: pas, value: valeur, oninput: (e) => { sortie.textContent = e.target.value; onchange(Number(e.target.value)); } });
  return el('label', { class: 'mc-curseur', for: id }, el('span', {}, libelle), i, sortie);
}
const groupe = (titre, ...contenu) => el('fieldset', { class: 'mc-groupe' }, el('legend', {}, titre), ...contenu);

function construire() {
  const cmd = $('mcCommandes'); cmd.replaceChildren();
  // après un clic à la souris le bouton rend le focus : la barre d'espace bascule alors les modes (au clavier, elle active le bouton)
  if (!cmd.dataset.pret) { cmd.dataset.pret = '1'; cmd.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && e.detail > 0) b.blur(); }); }
  // le son
  const morceaux = CONFIG.entrees.morceaux ? el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('morceauxTitre') }, CONFIG.morceaux.map((m, i) => bouton(`mcMorceau-${m.id}`, T('morceau', { n: i + 1, note: T('notes')[m.id] }), () => lireElement(m.fichier, 'morceau', T('sources').morceau.replace('{n}', i + 1), true)))) : null;
  const fichier = el('input', { type: 'file', id: 'mcFichier', accept: 'audio/*', hidden: true, onchange: (e) => { const f = e.target.files[0]; if (f) lireElement(URL.createObjectURL(f), 'fichier', T('sources').fichier.replace('{nom}', f.name), false); } });
  cmd.append(groupe(T('sonTitre'),
    el('div', { class: 'mc-rangee' },
      CONFIG.entrees.fichier ? [fichier, bouton('mcBtnFichier', T('fichier'), () => fichier.click())] : null,
      CONFIG.entrees.micro ? bouton('mcMicro', T('micro'), () => (S.source === 'micro' ? arreterSource() : ouvrirMicro()), true) : null,
      CONFIG.entrees.musiqueEssai ? bouton('mcEssai', T('essai'), () => (S.source === 'essai' ? arreterSource() : musiqueEssai()), true) : null,
      CONFIG.entrees.captureOnglet ? bouton('mcOnglet', T('onglet'), capturerOnglet, true) : null,
      bouton('mcArreter', T('arreter'), arreterSource)),
    CONFIG.entrees.peripheriques ? el('label', { class: 'mc-curseur', for: 'mcEntree' }, el('span', {}, T('entree')), el('select', { id: 'mcEntree', onchange: (e) => (e.target.value ? ouvrirMicro(e.target.value) : S.source && S.source !== 'micro' && ouvrirMicro()) }, el('option', { value: '' }, T('entreeDefaut')))) : null,
    el('p', { class: 'mc-aide' }, T('entreeAide')),
    morceaux ? [el('h3', {}, T('morceauxTitre')), morceaux, el('p', { class: 'mc-aide', id: 'mcIA' }, T('mentionIA'))] : null));
  // le motif
  const ordres = el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('ordre') }, CONFIG.ordres.map((o) => el('button', { type: 'button', 'aria-pressed': String(o.ordre === S.ordre), disabled: !o.actif || null, title: o.actif ? null : o.raison }, o.actif ? T('ordreN', { n: o.ordre }) : T('ordreBientot', { n: o.ordre }))));
  const rendus = el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('rendu') }, ['bicolore', 'tricolore'].filter((r) => CONFIG.rendus[r]).map((r) => bouton(`mcRendu-${r}`, T(r), () => changerRendu(r), true)));
  const paires = el('label', { class: 'mc-curseur', for: 'mcPaire' }, el('span', {}, T('paire')), el('select', { id: 'mcPaire', onchange: (e) => { S.paire = e.target.value; cacheImages.clear(); } }, Object.keys(PALETTES).map((k) => el('option', { value: k }, `${PALETTES[k][0]} / ${PALETTES[k][1]}`))));
  cmd.append(groupe(T('formatTitre'), ordres, rendus, el('p', { class: 'mc-aide', id: 'mcAideRendu' }), paires));
  // la vue et le pilotage
  const vues = el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('vueTitre') }, Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]).map((v, i) => bouton(`mcVue-${v}`, `${i + 1}. ${T('vues')[v]}`, () => { S.vue = v; majBoutons(); }, true)));
  const modes = el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('pilotageTitre') }, Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m]).map((m) => bouton(`mcMode-${m}`, T('pilotage')[m], () => { S.mode = m; appliquerEtat(); majBoutons(); }, true)));
  cmd.append(groupe(T('vueTitre'), vues, el('p', { class: 'mc-aide', id: 'mcAideVue' })), groupe(T('pilotageTitre'), modes, el('p', { class: 'mc-aide', id: 'mcAidePilotage' })));
  if (CONFIG.pulsation) {
    cmd.append(groupe(T('pulsationTitre'),
      el('label', { class: 'mc-curseur', for: 'mcPulsation' }, el('span', {}, T('pulsationTitre')),
        el('select', { id: 'mcPulsation', onchange: (e) => { S.pulsation = e.target.value; appliquerEtat(); } }, Object.keys(T('pulsations')).map((k) => el('option', { value: k }, T('pulsations')[k])))),
      el('p', { class: 'mc-aide', id: 'mcAidePulsation' }, T('pulsationAide'))));
  }
  // le fond
  if (CONFIG.fonds.selecteur) {
    const fm = el('div', { class: 'mc-rangee', role: 'group', 'aria-label': T('fondTitre') }, Object.keys(T('fondModes')).map((f) => bouton(`mcFondMode-${f}`, T('fondModes')[f], () => { S.fondMode = f; S.fondDepuis = (performance.now() - S.t0) / 1000; majBoutons(); }, true)));
    const choix = el('label', { class: 'mc-curseur', for: 'mcFond' }, el('span', {}, T('fondChoix')), el('select', { id: 'mcFond', onchange: (e) => { S.fondId = e.target.value; } }, S.fondsOrdre.map((id) => el('option', { value: id }, id))));
    cmd.append(groupe(T('fondTitre'), fm, choix, el('p', { class: 'mc-aide', id: 'mcAideFond' })));
    choix.querySelector('select').value = S.fondId;
  }
  // les réglages
  cmd.append(groupe(T('reglagesTitre'),
    curseur('mcSens', T('sensibilite'), 0.3, 3, 0.1, S.sensibilite, (v) => { S.sensibilite = v; appliquerEtat(); }),
    curseur('mcLissage', T('lissage'), 0.05, 1, 0.05, S.lissage, (v) => { S.lissage = v; }),
    curseur('mcVitesse', T('vitesse'), 0.2, 2, 0.05, S.intervalleMinSecondes, (v) => { S.intervalleMinSecondes = v; appliquerEtat(); }),
    curseur('mcSeuil', T('seuil'), M.SEUIL_LIGNES_MIN, M.SEUIL_LIGNES_MAX, 0.01, S.seuilLignes, (v) => { S.seuilLignes = v; }),
    el('label', { class: 'mc-case' }, el('input', { type: 'checkbox', id: 'mcCalme', checked: S.calme || null, onchange: (e) => { S.calme = e.target.checked; appliquerEtat(); } }), T('calme')),
    el('p', { class: 'mc-aide' }, T('calmeAide')),
    el('label', { class: 'mc-case' }, el('input', { type: 'checkbox', id: 'mcPente', checked: S.penteDesGraves || null, onchange: (e) => { S.penteDesGraves = e.target.checked; } }), T('pente')),
    bouton('mcPause', T('pause'), () => { S.pause = !S.pause; majBoutons(); }, true),
    CONFIG.inspection ? [
      el('label', { class: 'mc-case' }, el('input', { type: 'checkbox', id: 'mcInspecter', onchange: (e) => { S.inspecter = e.target.checked; const c = $('mcInspection'); if (c) c.hidden = !S.inspecter; const l = $('mcLegendeInspection'); if (l) l.hidden = !S.inspecter; } }), T('inspecter')),
      el('p', { class: 'mc-aide' }, T('inspecterAide'))] : null));
  if (CONFIG.inspection && !$('mcInspection')) {
    $('mcInfo').after(el('canvas', { id: 'mcInspection', width: 720, height: 160, hidden: true, role: 'img', 'aria-label': T('inspectionLegende') }), el('p', { class: 'mc-aide', id: 'mcLegendeInspection', hidden: true }, T('inspectionLegende')));
  }
  // la scène
  const scene = [];
  if (CONFIG.scene.pleinEcran) scene.push(bouton('mcScenePleine', T('scene'), basculerScene));
  if (CONFIG.scene.fenetreProjection) scene.push(bouton('mcProjection', T('projection'), ouvrirProjection));
  cmd.append(groupe(T('sceneTitre'), el('div', { class: 'mc-rangee' }, scene), el('p', { class: 'mc-aide' }, `${T('sceneAide')} ${T('projectionAide')} ${CONFIG.scene.veilleEmpechee ? T('veille') : ''}`)));
  // l'enregistrement
  if (CONFIG.enregistrement.actif) {
    cmd.append(groupe(T('enregTitre'),
      el('label', { class: 'mc-curseur', for: 'mcFormat' }, el('span', {}, T('format')), el('select', { id: 'mcFormat' }, CONFIG.enregistrement.formats.map((f) => el('option', { value: f }, T('formats')[f])))),
      el('label', { class: 'mc-case' }, el('input', { type: 'checkbox', id: 'mcSignature', checked: S.signature || null, onchange: (e) => { S.signature = e.target.checked; } }), T('signature', { texte: CONFIG.enregistrement.signatureTexte })),
      bouton('mcEnreg', T('enreg'), lancerEnregistrement, true)));
  }
  cmd.append(groupe(T('raccourcisTitre'), el('dl', { class: 'mc-raccourcis' }, T('raccourcis').flatMap(([k, v]) => [el('dt', {}, el('kbd', {}, k)), el('dd', {}, v)]))));
  majBoutons();
}
function habiller() {
  for (const e of document.querySelectorAll('[data-t]')) e.textContent = T(e.dataset.t);
  document.title = T('titrePage');
  const voir = $('mcVoirAussi'); voir.replaceChildren(...T('voirAussi').map((c) => el('a', { class: 'mc-carte', href: c.href }, el('b', {}, c.titre), el('span', {}, c.texte))));
}
function clavier(e) {
  if (e.target.closest && e.target.closest('input[type=text],select,textarea')) return;
  const k = e.key.toLowerCase(), vues = Object.keys(CONFIG.vues).filter((v) => CONFIG.vues[v]);
  if (/^[1-4]$/.test(k) && vues[Number(k) - 1]) { S.vue = vues[Number(k) - 1]; majBoutons(); }
  else if (k === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); const ms = Object.keys(CONFIG.pilotage).filter((m) => CONFIG.pilotage[m]); S.mode = ms[(ms.indexOf(S.mode) + 1) % ms.length]; appliquerEtat(); majBoutons(); }
  else if (k === 'p') { S.pause = !S.pause; majBoutons(); }
  else if (k === 'f') basculerScene();
  else if (k === 'r') lancerEnregistrement();
  else if (k === 'm') changerRendu(S.rendu === 'bicolore' ? 'tricolore' : 'bicolore');
}

export async function monter() {
  canvas = $('mcCanvas'); c2d = canvas.getContext('2d'); info = $('mcInfo');
  hors = document.createElement('canvas'); hors2d = hors.getContext('2d');
  habiller();
  try { await charger(); } catch (err) { erreur(T('erreurAudio', { message: err.message })); return; }
  S.champs = M.creerChamps(S.res); S.F = new Float32Array(S.res * S.res);
  creerMoteur(); appliquerEtat(); construire();
  document.addEventListener('keydown', clavier);
  for (const ev of ['mousemove', 'pointerdown', 'keydown', 'touchstart']) document.addEventListener(ev, veilleScene);
  document.addEventListener('fullscreenchange', veilleScene);
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', listerEntrees);
  window.addEventListener('pagehide', arreterSource);
  raf = requestAnimationFrame(boucle);
  window.__musiqueChladni = { S, M, etat: () => ({ source: S.source, motif: S.dernier.motif, vue: S.vue, mode: S.mode, rendu: S.rendu, fps: S.fps, res: S.res, fond: S.fondId }), arreterSource, lireElement, ouvrirMicro, musiqueEssai };
}
