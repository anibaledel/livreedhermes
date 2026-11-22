// pavane-ui.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'INTERFACE de « Pavane — Voir sa musique » (prompt 211, §2 et §4). Bloc 1 : le sélecteur des trois modes (Défilé, Spectre, Entre-deux), les réglages communs (fond parmi les fonds proposés, motifs 64 · 128 · 256,
// couleurs, tracé rouge, rythme, densité), la scène, la pause, le plein écran, l'état dans l'adresse. Bloc 2 : les sources du son (morceau fourni, fichier, micro, note pure — assets/pavane-son.js), le chef d'orchestre
// du moteur image après image (assets/pavane-moteur.js), le déclencheur du défilé (minuteur ou pulsation), l'enregistrement de l'image et de 15 s de vidéo. Rien n'est lu hors du site : le corpus, les fonds, la liste
// des fonds proposés et les morceaux viennent du site ; le fichier et le micro restent sur l'appareil. L'interface n'est que de l'affichage : le choix des motifs est celui du moteur.
import { APLAT } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { varianteSvg } from './fonds-variantes.js';
import { fondsRetenus } from './fonds-retenus.js';
import { lireEtat, ecrireEtat, fusionnerRecherche, MODES, SOURCES, MORCEAUX, DECLENCHEURS, RYTHME_MIN, RYTHME_MAX, DENSITE_MIN, DENSITE_MAX, NOTE_MIN, NOTE_MAX } from './pavane-etat.js';
import { PALETTES, CLES_PALETTES, paireDe, paireValide } from './pavane-couleurs.js';
import { NIVEAUX_CORPUS } from './corpus-animation.js';
import { creerDefile, creerChef, listeDuNiveau, distancesDe, blocDuCorpus64, membreAffiche } from './pavane-moteur.js';
import { creerSon, frequenceDuCurseur, curseurDeFrequence } from './pavane-son.js';
import { texte } from './pavane-textes.js';

const RACINE = new URL('../', import.meta.url);
const PERIODE_MIN_REDUIT_S = 3; // « réduire les changements rapides » : jamais un motif plus court que 3 s
const FORMATS_VIDEO = ['video/mp4;codecs="avc1.640028,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1,mp4a.40.2"', 'video/mp4;codecs="h264,aac"', 'video/mp4;codecs="avc1.42E01E,opus"', 'video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']; // ceux de « Voir sa musique » : l'AAC d'abord
let compteur = 0;

const el = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v === false || v === null || v === undefined) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); }
  for (const c of enfants.flat()) if (c) e.append(c);
  return e;
};
async function json(chemin) { const r = await fetch(new URL(chemin, RACINE)); if (!r.ok) throw new Error(`${chemin} : ${r.status}`); return r.json(); }
function ajouterCss() { const href = new URL('assets/pavane.css', RACINE).href; if (!document.querySelector(`link[href="${href}"]`)) document.head.append(el('link', { rel: 'stylesheet', href })); }
function telecharger(blob, nom) { const a = el('a', { href: URL.createObjectURL(blob), download: nom }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

/** Monte l'application dans `racine`. Rend { etat(), motif(), arreter(), enregistrerImage(), enregistrerVideo(secondes) … }. */
export async function monterPavane(racine, { langue = 'fr', recherche = location.search, historique = true } = {}) {
  ajouterCss();
  const T = (cle, v) => texte(langue, cle, v), id = `pv${++compteur}`;
  racine.classList.add('pv');
  racine.setAttribute('aria-label', T('titreApp'));
  racine.replaceChildren(el('p', { role: 'status', text: T('chargement') }));
  let corpus, proposes, definitions;
  try {
    [corpus, proposes, definitions] = await Promise.all([json('data/corpus-256.json'), json('data/fonds/demi-periode.json').then(fondsRetenus), json('data/fonds/fonds-echange.json')]);
  } catch (e) { racine.replaceChildren(el('p', { role: 'alert', text: T('erreur') })); throw e; }
  const fonds = new Map([['P', APLAT], ...definitions.fonds.map((f) => [f.id, f])]);
  for (const code of proposes) if (!fonds.has(code)) throw new Error(`pavane-ui.js : le fond proposé « ${code} » n'a pas de définition`);
  const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
  const reduitMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
  const bloc64 = blocDuCorpus64(corpus), ids64 = listeDuNiveau(corpus, 64), distance64 = distancesDe(corpus, ids64);
  const son = creerSon();

  let { etat } = lireEtat(recherche, proposes);
  // le micro est la source de départ (prompt 220) : jamais demandé au chargement, seulement au bouton « Activer le micro » ; refusé ou impossible, un morceau d'exemple le remplace, en le disant.
  // Un lien qui fixe la source (?source=…, ?piste=…) garde le dessus : alors, pas de repli.
  let microParDefaut = etat.source === 'micro' && !new URLSearchParams(recherche).has('source');
  let reduit = reduitMq.matches || etat.reduit, enPause = false, ids = [], defile = null, chef = null, idCourant = null, minuteur = null, rafId = null, couche = 0, dernierePaireValide = null, svgCourant = null, noteStatut = '', enregistrement = null;
  const cache = new Map();

  // ---------- le DOM ----------
  const radiosMode = MODES.map((m) => {
    const phrase = el('p', { id: `${id}-p-${m}`, text: T(m === 'entre-deux' ? 'entreDeuxP' : `${m}P`) });
    const radio = el('input', { type: 'radio', name: `${id}-mode`, value: m, 'aria-describedby': phrase.id });
    return { m, radio, boite: el('div', { class: 'pv-mode' }, el('label', {}, radio, el('span', { text: T(m === 'entre-deux' ? 'entreDeux' : m) })), phrase) };
  });
  const modes = el('fieldset', { class: 'pv-modes' }, el('legend', { text: T('modes') }), ...radiosMode.map((r) => r.boite));
  // les sources du son
  const radiosSource = SOURCES.map((sr) => ({ sr, radio: el('input', { type: 'radio', name: `${id}-source`, value: sr }) }));
  const choixSource = el('fieldset', { class: 'pv-choix' }, el('legend', { text: T('sources') }), ...radiosSource.map(({ sr, radio }) => el('label', {}, radio, el('span', { text: T(`src${sr[0].toUpperCase()}${sr.slice(1)}`) }))));
  const selMorceau = el('select', { id: `${id}-morceau`, 'aria-label': T('srcMorceau') }, ...MORCEAUX.map((m, i) => el('option', { value: m, text: T('morceauN', { n: i + 1 }) })));
  const inFichier = el('input', { type: 'file', accept: 'audio/*', id: `${id}-fichier`, 'aria-label': T('choisirFichier') });
  const bMicro = el('button', { type: 'button', text: T('activerMicro') });
  const rNote = el('input', { type: 'range', min: '0', max: '1000', step: '1', id: `${id}-note`, 'aria-label': T('srcNote') }), nNote = el('span'), lNote = el('label', {}, nNote, rNote);
  const bJouer = el('button', { type: 'button' });
  const mention = el('p', { class: 'pv-mention', hidden: true, text: T('mentionIA') });
  const erreurSon = el('p', { class: 'pv-erreur', role: 'alert', hidden: true });
  const sources = el('div', { class: 'pv-sources', id: `${id}-sources`, hidden: true }, choixSource, el('div', { class: 'pv-source-reglage' }, selMorceau, inFichier, bMicro, lNote, bJouer), mention, erreurSon);
  const radiosDecl = DECLENCHEURS.map((d) => ({ d, radio: el('input', { type: 'radio', name: `${id}-decl`, value: d }) }));
  const choixDecl = el('fieldset', { class: 'pv-choix' }, el('legend', { text: T('declencheur') }), ...radiosDecl.map(({ d, radio }) => el('label', {}, radio, el('span', { text: T(d === 'minuteur' ? 'declMinuteur' : 'declPulsation') }))));
  const couches = [el('div', { class: 'pv-couche' }), el('div', { class: 'pv-couche' })];
  const scene = el('div', { class: 'pv-scene', role: 'img', 'aria-label': T('scene'), tabindex: '0' }, ...couches);
  const statut = el('p', { class: 'pv-etat', role: 'status', 'aria-live': 'polite' });
  const selFond = el('select', { id: `${id}-fond` }, ...proposes.map((c) => el('option', { value: c, text: T(`fond_${c}`) })));
  const radiosCorpus = NIVEAUX_CORPUS.map((n) => ({ n, radio: el('input', { type: 'radio', name: `${id}-corpus`, value: String(n) }) }));
  const choixCorpus = el('fieldset', { class: 'pv-choix' }, el('legend', { text: T('corpus') }), ...radiosCorpus.map(({ n, radio }) => el('label', {}, radio, el('span', { text: T(`corpus${n}`) }))));
  const selPalette = el('select', { id: `${id}-palette` }, ...CLES_PALETTES.map((c) => el('option', { value: c, text: T(`palette_${c}`) })));
  const inC0 = el('input', { type: 'color', id: `${id}-c0` }), inC1 = el('input', { type: 'color', id: `${id}-c1` });
  const personnalise = el('div', { hidden: true }, el('label', {}, el('span', { text: T('couleurFond') }), inC0), el('label', {}, el('span', { text: T('couleurFigure') }), inC1));
  const erreur = el('p', { class: 'pv-erreur', role: 'alert', hidden: true, text: T('contrasteRefus') });
  const cTrace = el('input', { type: 'checkbox', id: `${id}-trace` });
  // « Mouvement réduit » (prompt 223) : la préférence du système OU la case (clé d'adresse `reduit`) ; il impose au rythme une période d'au moins PERIODE_MIN_REDUIT_S (0,33 changement par seconde, bien sous les 3 par seconde de WCAG 2.3.1)
  const cReduit = el('input', { type: 'checkbox', id: `${id}-reduit` }), nReduit = el('small', { class: 'pv-doux', hidden: true, text: T('reduitSysteme') });
  // l'avertissement photosensible : au premier lancement (mémorisé dans localStorage, dans un try/catch : sans stockage, il revient à chaque ouverture), puis un lien près des réglages
  const CLE_AVERT = 'pv-avertissement-lu';
  const avertLu = () => { try { return localStorage.getItem(CLE_AVERT) === '1'; } catch { return false; } };
  const bOk = el('button', { type: 'button', text: T('avertOk') });
  const avert = el('div', { class: 'pv-avert', role: 'note', id: `${id}-avert`, hidden: avertLu() }, el('p', { text: T('avert') }), bOk);
  const bAvert = el('button', { type: 'button', class: 'pv-lien', 'aria-controls': `${id}-avert`, 'aria-expanded': String(!avertLu()), text: T('avertLien') });
  const rRythme = el('input', { type: 'range', min: String(RYTHME_MIN), max: String(RYTHME_MAX), step: '0.5', id: `${id}-rythme` });
  const lRythme = el('label', {}, rRythme), nRythme = el('span');
  lRythme.prepend(nRythme);
  const rDensite = el('input', { type: 'range', min: String(DENSITE_MIN), max: String(DENSITE_MAX), step: '1', id: `${id}-densite` });
  const nDensite = el('span'), lDensite = el('label', {}, nDensite, rDensite);
  const bPause = el('button', { type: 'button' }), bPlein = el('button', { type: 'button', text: T('pleinEcran') });
  const bImage = el('button', { type: 'button', text: T('enregImage') }), bVideo = el('button', { type: 'button', text: T('enregVideo') });
  const reglages = el('div', { class: 'pv-reglages', role: 'group', 'aria-label': T('reglages') },
    choixDecl, el('label', {}, el('span', { text: T('fond') }), selFond), choixCorpus,
    el('label', {}, el('span', { text: T('palette') }), selPalette), personnalise, erreur,
    el('label', {}, cTrace, el('span', { text: T('trace') })), el('label', {}, cReduit, el('span', { text: T('reduitCase') }), nReduit), lRythme, lDensite, el('div', { class: 'pv-actions' }, bPause, bPlein, bImage, bVideo), bAvert);
  racine.replaceChildren(el('h2', { class: 'pv-titre' }, T('titreApp')), avert, modes, sources, el('div', { class: 'pv-corps' }, el('div', {}, scene, statut), reglages), el('p', { class: 'pv-flash', text: T('flash') }));
  racine.classList.toggle('pv-reduit', reduit);

  // ---------- le rendu ----------
  const paire = () => paireDe(etat.palette, etat.c0, etat.c1) || [...PALETTES['creme-encre']];
  function svgDe(idMotif, taille = 480) {
    const cle = [idMotif, etat.fond, paire().join(), etat.trace, taille].join('|');
    if (!cache.has(cle)) {
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      const cases = lectureBinaire(parId.get(idMotif).tricolore, idMotif).cases;
      cache.set(cle, varianteSvg(cases, paire(), fonds.get(etat.fond), { size: taille, prefixe: `${id}-`, trace: etat.trace }));
    }
    return cache.get(cle);
  }
  const urlDe = (svg) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  function libelle(idMotif) { const e = parId.get(idMotif), f = e.familles[0]; return T('motif', { kw: e.kingwen_par_famille[f], n: e.n_site_par_famille[f] }); }
  function afficher(idMotif, note = '') {
    idCourant = idMotif; noteStatut = note;
    const prochaine = couches[1 - couche], actuelle = couches[couche];
    svgCourant = svgDe(idMotif);
    prochaine.style.backgroundImage = urlDe(svgCourant); prochaine.style.backgroundSize = `${100 / etat.densite}% auto`; // des tuiles carrées : la hauteur suit la largeur de l'image
    prochaine.classList.add('visible'); actuelle.classList.remove('visible'); couche = 1 - couche;
    scene.dataset.motif = idMotif;
    dire();
  }
  function dire() {
    if (!idCourant) return;
    const sonne = son.actif !== null;
    let t = libelle(idCourant);
    if (etat.mode !== 'defile' || etat.declencheur === 'pulsation') { if (!sonne) t = `${t} — ${T('rienNeJoue')}`; }
    if (noteStatut) t = `${t} — ${noteStatut}`;
    statut.textContent = enPause ? T('enPause') : t;
  }
  // le motif à montrer pour un indice du moteur : dans la liste du défilé, ou le membre voulu de la classe du représentant (spectre, entre-deux)
  const motifDe = (i) => (etat.mode === 'defile' ? ids[i] : membreAffiche(corpus, bloc64.ids[i], etat.corpus, 0));

  // ---------- le moteur ----------
  const besoinSon = () => etat.mode !== 'defile' || etat.declencheur === 'pulsation';
  function reconstruire() {
    cancelAnimationFrame(rafId); rafId = null; clearInterval(minuteur); minuteur = null;
    ids = etat.mode === 'defile' ? listeDuNiveau(corpus, etat.corpus) : ids64;
    const distance = etat.mode === 'defile' ? distancesDe(corpus, ids) : distance64;
    defile = creerDefile({ n: ids.length, distance, graine: 1 });
    chef = creerChef({ mode: etat.mode, declencheur: etat.declencheur, periodeS: etat.rythme, graine: 1, liste: { n: ids.length, distance }, bloc: bloc64, distance: distance64, tenueMinS: reduit ? PERIODE_MIN_REDUIT_S : 0 });
    if (etat.mode === 'defile') afficher(ids[defile.suivant().i]); else afficher(ids64[0]);
    armer();
  }
  function armer() {
    clearInterval(minuteur); minuteur = null; cancelAnimationFrame(rafId); rafId = null;
    if (enPause) return;
    if (etat.mode === 'defile' && etat.declencheur === 'minuteur') {
      const s = Math.max(etat.rythme, reduit ? PERIODE_MIN_REDUIT_S : 0.5);
      minuteur = setInterval(() => afficher(ids[defile.suivant().i]), s * 1000);
    } else if (besoinSon()) boucle();
  }
  function boucle() {
    rafId = requestAnimationFrame(() => {
      const im = son.image();
      if (im) {
        const r = chef.image({ db: im.db, sampleRate: im.sampleRate, t: performance.now() / 1000 });
        if (r.changer && r.i >= 0) afficher(motifDe(r.i), r.repli ? T('repli') : '');
        else if (r.repli !== undefined && (r.repli ? T('repli') : '') !== noteStatut) { noteStatut = r.repli ? T('repli') : ''; dire(); }
      }
      if (!enPause && besoinSon()) boucle();
    });
  }

  // ---------- l'état ----------
  function ecrireAdresse() { if (historique) history.replaceState(null, '', `${location.pathname}${historique === 'fusion' ? fusionnerRecherche(location.search, etat) : ecrireEtat(etat)}${location.hash}`); }
  function refleter() {
    for (const r of radiosMode) r.radio.checked = r.m === etat.mode;
    const audio = etat.mode !== 'defile' || etat.declencheur === 'pulsation';
    sources.hidden = !audio;
    for (const { sr, radio } of radiosSource) radio.checked = sr === etat.source;
    selMorceau.value = etat.morceau; selMorceau.hidden = etat.source !== 'morceau';
    inFichier.hidden = etat.source !== 'fichier'; bMicro.hidden = etat.source !== 'micro'; lNote.hidden = etat.source !== 'note';
    rNote.value = String(curseurDeFrequence(etat.note)); nNote.textContent = T('frequence', { hz: etat.note });
    bJouer.hidden = etat.source === 'micro' || etat.source === 'fichier'; bJouer.textContent = son.actif ? T('arreter') : T('jouer');
    mention.hidden = etat.source !== 'morceau';
    for (const { d, radio } of radiosDecl) radio.checked = d === etat.declencheur;
    choixDecl.hidden = etat.mode !== 'defile';
    selFond.value = etat.fond;
    for (const { n, radio } of radiosCorpus) radio.checked = n === etat.corpus;
    choixCorpus.hidden = etat.mode !== 'defile';
    selPalette.value = etat.palette; personnalise.hidden = etat.palette !== 'perso';
    const [c0, c1] = paire(); inC0.value = c0; inC1.value = c1; dernierePaireValide = [c0, c1];
    cTrace.checked = etat.trace;
    const virgule = ['fr', 'es', 'pt', 'de', 'it', 'ru'].includes(langue);
    const ry = reduit ? Math.max(etat.rythme, PERIODE_MIN_REDUIT_S) : etat.rythme; // aucun rythme plus rapide que la limite quand le mouvement est réduit
    rRythme.min = String(reduit ? PERIODE_MIN_REDUIT_S : RYTHME_MIN); rRythme.value = String(ry); nRythme.textContent = T('rythme', { s: String(ry).replace('.', virgule ? ',' : '.') });
    cReduit.checked = reduit; cReduit.disabled = reduitMq.matches; nReduit.hidden = !reduitMq.matches;
    lRythme.hidden = !(etat.mode === 'entre-deux' || (etat.mode === 'defile' && etat.declencheur === 'minuteur'));
    rDensite.value = String(etat.densite); nDensite.textContent = T('densite', { n: etat.densite });
    bPause.textContent = enPause ? T('reprendre') : T('pause'); bPause.setAttribute('aria-pressed', String(enPause));
    racine.classList.toggle('pv-reduit', reduit);
  }
  const changer = (partie, { refaire = false } = {}) => { etat = { ...etat, ...partie }; ecrireAdresse(); refleter(); if (refaire) reconstruire(); else if (idCourant) afficher(idCourant, noteStatut); else reconstruire(); };
  const messageSon = (cle) => { erreurSon.hidden = !cle; erreurSon.textContent = cle ? T(cle) : ''; };

  for (const { m, radio } of radiosMode) radio.addEventListener('change', () => radio.checked && changer({ mode: m }, { refaire: true }));
  for (const { d, radio } of radiosDecl) radio.addEventListener('change', () => radio.checked && changer({ declencheur: d }, { refaire: true }));
  for (const { sr, radio } of radiosSource) radio.addEventListener('change', () => { if (!radio.checked) return; microParDefaut = false; son.arreter(); messageSon(null); changer({ source: sr }); });
  async function lancer() {
    messageSon(null);
    try {
      if (etat.source === 'morceau') await son.jouerMorceau(etat.morceau); else if (etat.source === 'note') await son.jouerNote(etat.note);
      refleter(); armer(); dire();
    } catch { messageSon('erreurFichier'); }
  }
  selMorceau.addEventListener('change', () => { changer({ morceau: selMorceau.value }); if (son.actif === 'morceau') lancer(); });
  bJouer.addEventListener('click', () => { if (son.actif === etat.source) { son.arreter(); refleter(); dire(); } else lancer(); });
  inFichier.addEventListener('change', async () => {
    const f = inFichier.files && inFichier.files[0]; if (!f) return;
    messageSon(null);
    try { await son.jouerFichier(f); refleter(); armer(); dire(); } catch { messageSon('erreurFichier'); }
  });
  bMicro.addEventListener('click', async () => {
    messageSon(null);
    try { await son.activerMicro(); refleter(); armer(); dire(); }
    catch {
      if (!microParDefaut) return messageSon('erreurMicro');
      microParDefaut = false; changer({ source: 'morceau' }); await lancer(); // le morceau d'exemple prend la place, et on le dit (sans bloquer : l'interface reste utilisable)
      if (son.actif === 'morceau') messageSon('microRepli');
    }
  });
  rNote.addEventListener('input', () => { const hz = Math.min(NOTE_MAX, Math.max(NOTE_MIN, frequenceDuCurseur(Number(rNote.value)))); etat = { ...etat, note: hz }; ecrireAdresse(); nNote.textContent = T('frequence', { hz }); if (son.actif === 'note') son.changerNote(hz); });
  selFond.addEventListener('change', () => changer({ fond: selFond.value }));
  for (const { n, radio } of radiosCorpus) radio.addEventListener('change', () => radio.checked && changer({ corpus: n }, { refaire: true }));
  selPalette.addEventListener('change', () => {
    if (selPalette.value === 'perso') { const [a, b] = paire(); changer({ palette: 'perso', c0: a, c1: b }); } else changer({ palette: selPalette.value });
  });
  const surCouleur = () => {
    if (paireValide(inC0.value, inC1.value)) { erreur.hidden = true; changer({ palette: 'perso', c0: inC0.value.toLowerCase(), c1: inC1.value.toLowerCase() }); }
    else { erreur.hidden = false; [inC0.value, inC1.value] = dernierePaireValide; } // un fond identique à la figure est impossible : on revient à la dernière paire valide
  };
  inC0.addEventListener('change', surCouleur); inC1.addEventListener('change', surCouleur);
  cTrace.addEventListener('change', () => changer({ trace: cTrace.checked }));
  rRythme.addEventListener('input', () => { etat = { ...etat, rythme: Number(rRythme.value) }; ecrireAdresse(); refleter(); reconstruireChefSeulement(); armer(); });
  const reconstruireChefSeulement = () => { chef = creerChef({ mode: etat.mode, declencheur: etat.declencheur, periodeS: etat.rythme, graine: 1, liste: { n: ids.length, distance: etat.mode === 'defile' ? distancesDe(corpus, ids) : distance64 }, bloc: bloc64, distance: distance64, tenueMinS: reduit ? PERIODE_MIN_REDUIT_S : 0 }); };
  rDensite.addEventListener('input', () => changer({ densite: Number(rDensite.value) }));
  const basculerPause = () => { enPause = !enPause; refleter(); armer(); if (idCourant) afficher(idCourant, noteStatut); };
  bPause.addEventListener('click', basculerPause);
  const pleinEcran = () => { const r = scene.requestFullscreen || scene.webkitRequestFullscreen; if (r) r.call(scene).catch(() => {}); };
  bPlein.addEventListener('click', pleinEcran);
  const surTouche = (ev) => {
    if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (!racine.contains(ev.target)) return; // les touches ne valent que dans l'application : la page « Voir sa musique » a les siennes
    const cible = ev.target, interactif = cible && cible.closest && cible.closest('input, select, textarea, button, a, [contenteditable]');
    if (interactif && !(cible === scene)) return;
    if (ev.key === ' ') { ev.preventDefault(); basculerPause(); } else if (ev.key === 'f' || ev.key === 'F') { ev.preventDefault(); pleinEcran(); }
  };
  document.addEventListener('keydown', surTouche);
  cReduit.addEventListener('change', () => { etat = { ...etat, reduit: cReduit.checked }; reduit = reduitMq.matches || etat.reduit; ecrireAdresse(); refleter(); reconstruireChefSeulement(); armer(); });
  bOk.addEventListener('click', () => { try { localStorage.setItem(CLE_AVERT, '1'); } catch { /* stockage absent ou refusé : l'avertissement reviendra */ } avert.hidden = true; bAvert.setAttribute('aria-expanded', 'false'); bAvert.focus(); });
  bAvert.addEventListener('click', () => { avert.hidden = !avert.hidden; bAvert.setAttribute('aria-expanded', String(!avert.hidden)); if (!avert.hidden) avert.scrollIntoView({ block: 'nearest' }); });
  const surReduit = () => { reduit = reduitMq.matches || etat.reduit; refleter(); reconstruireChefSeulement(); armer(); };
  if (reduitMq.addEventListener) reduitMq.addEventListener('change', surReduit);

  // ---------- l'enregistrement : l'image, et 15 s de vidéo (les formats de « Voir sa musique », l'AAC d'abord) ----------
  const nomFichier = (ext, dim) => `pavane-${idCourant}-${dim}-${Date.now()}.${ext}`;
  function chargerImage(svg) { return new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }); }
  function peindre(c, W, H, image) { // la scène en plein cadre : la tuile répétée `densite` fois sur la largeur
    const t = W / etat.densite; c.fillStyle = paire()[0]; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += t) for (let x = 0; x < W; x += t) c.drawImage(image, x, y, t, t);
  }
  async function enregistrerImage(taille = 1080) {
    if (!idCourant) return null;
    const image = await chargerImage(svgCourant), cv = el('canvas', { width: String(taille), height: String(taille) });
    peindre(cv.getContext('2d'), taille, taille, image);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const nom = nomFichier('png', `${taille}x${taille}`); telecharger(blob, nom);
    return { blob, nom };
  }
  async function enregistrerVideo(secondes = 15, taille = 1080) {
    if (enregistrement) return enregistrement.promesse;
    const cv = el('canvas', { width: String(taille), height: String(taille) });
    if (!window.MediaRecorder || !cv.captureStream) { erreurSon.hidden = false; erreurSon.textContent = T('erreurEnreg'); return null; }
    const flux = new MediaStream(); cv.captureStream(30).getVideoTracks().forEach((p) => flux.addTrack(p));
    if (son.actif) son.flux.getAudioTracks().forEach((p) => flux.addTrack(p.clone()));
    const mime = FORMATS_VIDEO.find((t) => MediaRecorder.isTypeSupported(t)) || '';
    let mr; try { mr = mime ? new MediaRecorder(flux, { mimeType: mime }) : new MediaRecorder(flux); } catch { erreurSon.hidden = false; erreurSon.textContent = T('erreurEnreg'); return null; }
    const c = cv.getContext('2d'), morceaux = []; let image = await chargerImage(svgCourant), dernierMotif = idCourant;
    const debut = performance.now();
    const dessiner = async () => {
      if (dernierMotif !== idCourant) { dernierMotif = idCourant; image = await chargerImage(svgCourant); }
      peindre(c, taille, taille, image);
      const lignes = [T('titreApp'), ...(son.actif === 'morceau' ? [T('mentionIA')] : [])]; // la signature (le nom), et la mention de l'IA pour les morceaux fournis
      const haut = 20 + lignes.length * 34; c.fillStyle = 'rgba(19,19,24,0.6)'; c.fillRect(0, taille - haut, taille, haut);
      c.fillStyle = '#f2f2f2'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 26px "Noto Sans SC LDH", "Noto Sans Thai LDH", "Noto Sans Devanagari LDH", "Roboto Condensed LDH", system-ui, sans-serif';
      lignes.forEach((l, i) => c.fillText(l, taille / 2, taille - haut + 26 + i * 34));
    };
    const promesse = new Promise((resolve) => {
      mr.ondataavailable = (e) => { if (e.data && e.data.size) morceaux.push(e.data); };
      mr.onstop = () => {
        clearInterval(enregistrement.tick); flux.getTracks().forEach((p) => p.stop());
        const type = mr.mimeType || mime || 'video/webm', mp4 = /mp4/.test(type), blob = new Blob(morceaux, { type });
        const nom = nomFichier(mp4 ? 'mp4' : 'webm', `${taille}x${taille}`); telecharger(blob, nom);
        bVideo.textContent = T('enregVideo'); bVideo.setAttribute('aria-pressed', 'false'); enregistrement = null;
        resolve({ blob, nom, type, octets: blob.size, aac: /mp4a|aac/.test(type) });
      };
    });
    enregistrement = { promesse, mr, tick: null };
    await dessiner(); mr.start(250); bVideo.setAttribute('aria-pressed', 'true');
    enregistrement.tick = setInterval(() => {
      dessiner(); const s = Math.ceil(secondes - (performance.now() - debut) / 1000); bVideo.textContent = T('enregEnCours', { s: Math.max(0, s) });
      if (s <= 0 && mr.state !== 'inactive') mr.stop();
    }, 33);
    return promesse;
  }
  bImage.addEventListener('click', () => { enregistrerImage(); });
  bVideo.addEventListener('click', () => { if (enregistrement) enregistrement.mr.stop(); else enregistrerVideo(15); });

  refleter(); reconstruire();
  return {
    etat: () => ({ ...etat }), motif: () => idCourant, enPause: () => enPause, reduit: () => reduit, fondsProposes: () => [...proposes], sonActif: () => son.actif, enregistrerImage, enregistrerVideo,
    arreter() { clearInterval(minuteur); cancelAnimationFrame(rafId); son.arreter(); document.removeEventListener('keydown', surTouche); },
  };
}
