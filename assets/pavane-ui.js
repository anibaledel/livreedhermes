// pavane-ui.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'INTERFACE de « Pavane — Voir sa musique » (prompt 211, §2 et §4) — premier bloc : le sélecteur des trois modes (Défilé, Spectre, Entre-deux), les réglages communs (fond parmi
// les fonds proposés, motifs 64 · 128 · 256, couleurs, tracé rouge, rythme, densité), la scène, la pause, le plein écran, l'état dans l'adresse. Le Défilé au minuteur marche ; les sources
// sonores (morceau fourni, fichier, micro, note pure) et les modes Spectre et Entre-deux sonores viennent au bloc suivant. Rien n'est lu hors du site : le corpus, les fonds et la liste des fonds proposés
// viennent de data/ ; aucun chargement distant. L'interface n'est que de l'affichage : le choix des motifs est celui du moteur (assets/pavane-moteur.js).
import { APLAT } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { varianteSvg } from './fonds-variantes.js';
import { fondsRetenus } from './fonds-retenus.js';
import { NOM_COMPLET } from './pavane-nom.js';
import { lireEtat, ecrireEtat, MODES, RYTHME_MIN, RYTHME_MAX, DENSITE_MIN, DENSITE_MAX } from './pavane-etat.js';
import { PALETTES, CLES_PALETTES, paireDe, paireValide } from './pavane-couleurs.js';
import { NIVEAUX_CORPUS } from './corpus-animation.js';
import { creerDefile, listeDuNiveau, distancesDe } from './pavane-moteur.js';
import { texte } from './pavane-textes.js';

const RACINE = new URL('../', import.meta.url);
const PERIODE_MIN_REDUIT_S = 3; // « réduire les changements rapides » : jamais un motif plus court que 3 s
let compteur = 0;

const el = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v === false || v === null || v === undefined) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); }
  for (const c of enfants.flat()) if (c) e.append(c);
  return e;
};
async function json(chemin) { const r = await fetch(new URL(chemin, RACINE)); if (!r.ok) throw new Error(`${chemin} : ${r.status}`); return r.json(); }
function ajouterCss() { const href = new URL('assets/pavane.css', RACINE).href; if (!document.querySelector(`link[href="${href}"]`)) document.head.append(el('link', { rel: 'stylesheet', href })); }

/** Monte l'application dans `racine`. Rend { etat(), motif(), arreter() }. */
export async function monterPavane(racine, { langue = 'fr', recherche = location.search, historique = true } = {}) {
  ajouterCss();
  const T = (cle, v) => texte(langue, cle, v), id = `pv${++compteur}`;
  racine.classList.add('pv');
  racine.setAttribute('aria-label', NOM_COMPLET);
  racine.replaceChildren(el('p', { role: 'status', text: T('chargement') }));
  let corpus, proposes, definitions;
  try {
    [corpus, proposes, definitions] = await Promise.all([json('data/corpus-256.json'), json('data/fonds/demi-periode.json').then(fondsRetenus), json('data/fonds/fonds-echange.json')]);
  } catch (e) { racine.replaceChildren(el('p', { role: 'alert', text: T('erreur') })); throw e; }
  const fonds = new Map([['P', APLAT], ...definitions.fonds.map((f) => [f.id, f])]);
  for (const code of proposes) if (!fonds.has(code)) throw new Error(`pavane-ui.js : le fond proposé « ${code} » n'a pas de définition`);
  const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
  const reduitMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };

  let { etat } = lireEtat(recherche, proposes);
  let reduit = reduitMq.matches, enPause = false, ids = [], defile = null, idCourant = null, minuteur = null, couche = 0, dernierePaireValide = null;
  const cache = new Map();

  // ---------- le DOM ----------
  const radiosMode = MODES.map((m) => {
    const phrase = el('p', { id: `${id}-p-${m}`, text: T(m === 'entre-deux' ? 'entreDeuxP' : `${m}P`) });
    const radio = el('input', { type: 'radio', name: `${id}-mode`, value: m, 'aria-describedby': phrase.id });
    return { m, radio, boite: el('div', { class: 'pv-mode' }, el('label', {}, radio, el('span', { text: T(m === 'entre-deux' ? 'entreDeux' : m) })), phrase) };
  });
  const modes = el('fieldset', { class: 'pv-modes' }, el('legend', { text: T('modes') }), ...radiosMode.map((r) => r.boite));
  const sources = el('div', { class: 'pv-sources', id: `${id}-sources`, hidden: true, text: T('sources') });
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
  const rRythme = el('input', { type: 'range', min: String(RYTHME_MIN), max: String(RYTHME_MAX), step: '0.5', id: `${id}-rythme` });
  const lRythme = el('label', {}, rRythme), nRythme = el('span');
  lRythme.prepend(nRythme);
  const rDensite = el('input', { type: 'range', min: String(DENSITE_MIN), max: String(DENSITE_MAX), step: '1', id: `${id}-densite` });
  const nDensite = el('span'), lDensite = el('label', {}, nDensite, rDensite);
  const bPause = el('button', { type: 'button' }), bPlein = el('button', { type: 'button', text: T('pleinEcran') });
  const reglages = el('div', { class: 'pv-reglages', role: 'group', 'aria-label': T('reglages') },
    el('label', {}, el('span', { text: T('fond') }), selFond), choixCorpus,
    el('label', {}, el('span', { text: T('palette') }), selPalette), personnalise, erreur,
    el('label', {}, cTrace, el('span', { text: T('trace') })), lRythme, lDensite, el('div', { class: 'pv-actions' }, bPause, bPlein));
  racine.replaceChildren(modes, sources, el('div', { class: 'pv-corps' }, el('div', {}, scene, statut), reglages), el('p', { class: 'pv-flash', text: T('flash') }));
  racine.classList.toggle('pv-reduit', reduit);

  // ---------- le rendu ----------
  const paire = () => paireDe(etat.palette, etat.c0, etat.c1) || [...PALETTES['creme-encre']];
  function svgDe(idMotif) {
    const cle = [idMotif, etat.fond, paire().join(), etat.trace].join('|');
    if (!cache.has(cle)) {
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      const cases = lectureBinaire(parId.get(idMotif).tricolore, idMotif).cases;
      cache.set(cle, `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(varianteSvg(cases, paire(), fonds.get(etat.fond), { size: 480, prefixe: `${id}-`, trace: etat.trace }))}")`);
    }
    return cache.get(cle);
  }
  function afficher(idMotif) {
    idCourant = idMotif;
    const prochaine = couches[1 - couche], actuelle = couches[couche];
    const taille = `${100 / etat.densite}% auto`; // des tuiles carrées : la hauteur suit la largeur de l'image
    prochaine.style.backgroundImage = svgDe(idMotif); prochaine.style.backgroundSize = taille;
    prochaine.classList.add('visible'); actuelle.classList.remove('visible'); couche = 1 - couche;
    const e = parId.get(idMotif), f = e.familles[0];
    scene.dataset.motif = idMotif;
    statut.textContent = enPause ? T('enPause') : (etat.mode === 'defile' ? T('motif', { kw: e.kingwen_par_famille[f], n: e.n_site_par_famille[f] }) : T('attenteSon'));
  }

  // ---------- le moteur ----------
  function reconstruire() {
    ids = etat.mode === 'defile' ? listeDuNiveau(corpus, etat.corpus) : listeDuNiveau(corpus, 64);
    defile = creerDefile({ n: ids.length, distance: distancesDe(corpus, ids), graine: 1 });
    afficher(ids[etat.mode === 'defile' ? defile.suivant().i : 0]);
    armer();
  }
  function armer() {
    clearInterval(minuteur); minuteur = null;
    if (etat.mode !== 'defile' || enPause) return;
    const s = Math.max(etat.rythme, reduit ? PERIODE_MIN_REDUIT_S : 0.5);
    minuteur = setInterval(() => afficher(ids[defile.suivant().i]), s * 1000);
  }

  // ---------- l'état ----------
  function ecrireAdresse() { if (historique) history.replaceState(null, '', `${location.pathname}${ecrireEtat(etat)}${location.hash}`); }
  function refleter() {
    for (const r of radiosMode) r.radio.checked = r.m === etat.mode;
    sources.hidden = etat.mode === 'defile';
    selFond.value = etat.fond;
    for (const { n, radio } of radiosCorpus) radio.checked = n === etat.corpus;
    choixCorpus.hidden = etat.mode !== 'defile';
    selPalette.value = etat.palette; personnalise.hidden = etat.palette !== 'perso';
    const [c0, c1] = paire(); inC0.value = c0; inC1.value = c1; dernierePaireValide = [c0, c1];
    cTrace.checked = etat.trace;
    rRythme.value = String(etat.rythme); nRythme.textContent = T('rythme', { s: String(etat.rythme).replace('.', langue === 'fr' || langue === 'es' || langue === 'pt' || langue === 'de' || langue === 'it' || langue === 'ru' ? ',' : '.') });
    lRythme.hidden = etat.mode !== 'defile';
    rDensite.value = String(etat.densite); nDensite.textContent = T('densite', { n: etat.densite });
    bPause.textContent = enPause ? T('reprendre') : T('pause'); bPause.setAttribute('aria-pressed', String(enPause));
    racine.classList.toggle('pv-reduit', reduit);
  }
  const changer = (partie, { refaire = false } = {}) => { etat = { ...etat, ...partie }; ecrireAdresse(); refleter(); if (refaire) reconstruire(); else if (idCourant) afficher(idCourant); else reconstruire(); };

  for (const { m, radio } of radiosMode) radio.addEventListener('change', () => radio.checked && changer({ mode: m }, { refaire: true }));
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
  rRythme.addEventListener('input', () => { etat = { ...etat, rythme: Number(rRythme.value) }; ecrireAdresse(); refleter(); armer(); });
  rDensite.addEventListener('input', () => changer({ densite: Number(rDensite.value) }));
  const basculerPause = () => { enPause = !enPause; refleter(); armer(); if (idCourant) afficher(idCourant); };
  bPause.addEventListener('click', basculerPause);
  const pleinEcran = () => { const r = scene.requestFullscreen || scene.webkitRequestFullscreen; if (r) r.call(scene).catch(() => {}); };
  bPlein.addEventListener('click', pleinEcran);
  const surTouche = (ev) => {
    if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const cible = ev.target, interactif = cible && cible.closest && cible.closest('input, select, textarea, button, a, [contenteditable]');
    if (interactif && !(cible === scene)) return;
    if (ev.key === ' ') { ev.preventDefault(); basculerPause(); } else if (ev.key === 'f' || ev.key === 'F') { ev.preventDefault(); pleinEcran(); }
  };
  document.addEventListener('keydown', surTouche);
  const surReduit = () => { reduit = reduitMq.matches; refleter(); armer(); };
  if (reduitMq.addEventListener) reduitMq.addEventListener('change', surReduit);

  refleter(); reconstruire();
  return {
    etat: () => ({ ...etat }), motif: () => idCourant, enPause: () => enPause, reduit: () => reduit, fondsProposes: () => [...proposes],
    arreter() { clearInterval(minuteur); document.removeEventListener('keydown', surTouche); },
  };
}
