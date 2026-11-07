// galerie-bicolore-ordres.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'extension de la « Galerie bicolore » (galerie-bicolore.html) aux ordres 30 (88 motifs) et 18
// (1 280 motifs en 7 collections) : un sélecteur d'ordre 12 / 18 / 30 ; l'ordre 12 est le contenu
// d'origine de la page, inchangé et caché seulement. Les données sont les blocs de structure de
// data/musique-chladni/ (champ lb : un quartet par case, grille 36 × 36 à l'ordre 18, 60 × 60 à
// l'ordre 30) ; le rendu est celui de la page « Voir sa musique » (assets/musique-chladni-moteur.js,
// bande B2, état 0 = état 1 tourné de 90°). Aucun calcul de lecture nouveau.
//
// Chaque motif a une ancre stable `#<identifiant>` (o30-p01-c1…) : le préfixe o18- ou o30- choisit
// l'ordre à l'ouverture de la page et fait défiler jusqu'au motif. Les vignettes (tuile seule) se
// dessinent à la demande, seulement quand elles approchent de l'écran, et se libèrent en le quittant.
// Un clic ouvre le pavage continu (2 × 2 par translation, jamais de miroir). Pas de téléchargement
// SVG : la machine à SVG du site (assets/bicolore-fonds.js) est écrite pour la grille 12 × 12.
import * as M from './musique-chladni-moteur.js';
import { chargerCollection, rasteriser } from './bicolore-fonds.js';
import { PALETTES } from './couleurs.js';
import { texte as T } from './galerie-bicolore-ordres-textes.js';
import { texte as TM } from './musique-chladni-textes.js';

const DIR = 'data/musique-chladni/';
const $ = (id) => document.getElementById(id);
const lJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u} : ${r.status}`); return r.json(); });
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const COLS_DE = {}; // id de collection → ordre
const COLLECTIONS = { 18: ['b1971128', 'b16012838', 'b3016090', 'f613', 'f18', 'fpilote', 'p18'], 30: ['p30'] };
for (const [o, l] of Object.entries(COLLECTIONS)) for (const c of l) COLS_DE[c] = Number(o);
const TITRES = Object.fromEntries(Object.keys(COLS_DE).map((c) => [c, TM('collections')[c] ? TM('collections')[c][0] : c])); // les titres : ceux de « Voir sa musique »

const S = { jb: {}, defs: null, etat: null, blocs: new Map(), ordre: 12, observateur: null, rendus: 0 };
const ink = rgb(PALETTES.creme[1]), fond = rgb(PALETTES.creme[0]);

async function preparerRendu() { // la bande B2 et sa rotation de 90° : l'état 1 et l'état 0 d'une case
  if (S.etat) return S.etat;
  const [jColl, jCalc] = await Promise.all([lJson('data/fonds/collection-v1.json'), lJson('data/fonds/collection-v1.calculs.json')]);
  const coll = chargerCollection(jColl, { calculs: jCalc }), f = coll.fonds.get(M.BANDE_DEFAUT);
  S.etat = M.etatsDeCase(Uint8Array.from(rasteriser(f, 0, 60), (x) => (x === 1 ? 1 : 0)), 60);
  return S.etat;
}
async function chargerOrdre(o) {
  if (!S.defs) { const [c, s] = await Promise.all([lJson(`${DIR}collections-18-30.json`), lJson(`${DIR}sym12-indices.json`)]); S.defs = { collections1830: c, sym12: s, centrale12: { indices: [] } }; }
  if (!S.jb[o]) S.jb[o] = await lJson(`${DIR}bloc-${o}-structure.json`);
  await preparerRendu();
}
function blocDe(o, id) {
  const cle = `${o}:${id}`;
  if (!S.blocs.has(cle)) { const def = M.definirCollections(o, S.defs).find((d) => d.id === id); S.blocs.set(cle, M.preparerBlocStructure(S.jb[o], { id, indices: def.indices })); }
  return S.blocs.get(cle);
}

// ---------- les vignettes, à la demande ----------
function peindre(canvas, bloc, j, T0) {
  const A = M.masqueBicolore(bloc, j, S.etat, T0);
  canvas.width = canvas.height = T0;
  const x = canvas.getContext('2d'), im = x.createImageData(T0, T0), d = im.data;
  for (let i = 0; i < T0 * T0; i++) { const k = A[i] / 255; d[i * 4] = fond[0] + (ink[0] - fond[0]) * k; d[i * 4 + 1] = fond[1] + (ink[1] - fond[1]) * k; d[i * 4 + 2] = fond[2] + (ink[2] - fond[2]) * k; d[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
}
const TUILE_PX = (g) => Math.min(240, g * 4); // 4 points par case, 240 au plus
function observateur() {
  if (S.observateur) return S.observateur;
  S.observateur = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      const b = e.target, c = b.querySelector('canvas'), bloc = S.blocs.get(b.dataset.bloc), j = Number(b.dataset.j);
      if (e.isIntersecting && !b.dataset.dessinee) { peindre(c, bloc, j, TUILE_PX(bloc.grid)); b.dataset.dessinee = '1'; S.rendus++; }
      else if (!e.isIntersecting && b.dataset.dessinee) { c.width = 0; c.height = 0; delete b.dataset.dessinee; } // libère la mémoire hors de l'écran
    }
  }, { rootMargin: '500px 0px' });
  return S.observateur;
}

// ---------- le pavage continu ----------
function ouvrirPave(bloc, j, colId) {
  const dlg = $('ordresPave'), id = bloc.ids[j], T0 = 360, tuile = document.createElement('canvas');
  peindre(tuile, bloc, j, T0);
  const c = $('ordresPaveToile'); c.width = c.height = T0 * 2; const x = c.getContext('2d');
  for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) x.drawImage(tuile, q * T0, r * T0);
  c.setAttribute('aria-label', T('paveAlt', { id }));
  $('ordresPaveTitre').textContent = T('paveTitre', { id });
  $('ordresPaveInfo').textContent = T('paveInfo', { collection: TITRES[colId], n: bloc.ordre, g: bloc.grid });
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

// ---------- les sections ----------
function construireSection(o, id, titre) {
  const bloc = blocDe(o, id), sec = document.createElement('section'), h = document.createElement('h3'), liste = document.createElement('div');
  sec.className = 'coll-sup'; sec.id = `coll-${o}-${id}`; sec.setAttribute('aria-labelledby', `${sec.id}-t`);
  h.id = `${sec.id}-t`; h.textContent = T('section', { titre, n: bloc.n });
  liste.className = 'grille-sup'; liste.setAttribute('role', 'list'); liste.style.setProperty('--ratio', '1');
  const obs = observateur(), frag = document.createDocumentFragment();
  for (const j of bloc.chain) { // classé par proximité : la chaîne de voisinage de la collection
    const b = document.createElement('button'), cv = document.createElement('canvas');
    b.type = 'button'; b.id = bloc.ids[j]; b.className = 'tuile-sup'; b.dataset.bloc = `${o}:${id}`; b.dataset.j = String(j); b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', T('tuile', { id: bloc.ids[j] })); cv.setAttribute('aria-hidden', 'true');
    cv.width = cv.height = 0; b.append(cv);
    b.addEventListener('click', () => { for (const s of document.querySelectorAll('.tuile-sup.selected')) s.classList.remove('selected'); b.classList.add('selected'); ouvrirPave(bloc, j, id); });
    frag.append(b);
  }
  liste.append(frag); sec.append(h, liste);
  return { sec, boutons: [...liste.children], obs };
}
async function montrerOrdre(o) {
  S.ordre = o;
  for (const b of document.querySelectorAll('#ordreControles button')) { const on = Number(b.dataset.ordre) === o; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); }
  const sup = $('ordresSup'), o12 = $('ordre12'), stats = [$('stats'), $('statsNote')];
  o12.hidden = o !== 12; sup.hidden = o === 12; for (const e of stats) if (e) e.hidden = o !== 12;
  if (o === 12) return;
  $('ordresTitre').textContent = ''; $('ordresEtat').textContent = T('chargement', { n: o }); $('ordresSections').replaceChildren();
  try { await chargerOrdre(o); } catch (err) { $('ordresEtat').textContent = T('erreur', { n: o, message: err.message }); return; }
  if (S.ordre !== o) return; // l'utilisateur a changé d'ordre pendant le chargement
  const g = M.GRILLE[o], cols = COLLECTIONS[o], total = cols.reduce((a, c) => a + blocDe(o, c).n, 0);
  $('ordresTitre').textContent = T('titre', { n: o, m: total.toLocaleString('fr-FR'), c: cols.length });
  $('ordresIntro').textContent = T('intro', { g });
  $('ordresEtat').textContent = '';
  const frag = document.createDocumentFragment(), tous = [];
  for (const c of cols) { const { sec, boutons, obs } = construireSection(o, c, TITRES[c]); frag.append(sec); tous.push(...boutons.map((b) => [b, obs])); }
  $('ordresSections').replaceChildren(frag);
  for (const [b, obs] of tous) obs.observe(b);
}
function ordreDeHash() { const m = /^#o(18|30)-/.exec(location.hash); return m ? Number(m[1]) : null; }
async function allerAuMotif() {
  const o = ordreDeHash(); if (!o) return;
  if (S.ordre !== o || $('ordresSup').hidden) await montrerOrdre(o);
  const e = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (e && e.classList.contains('tuile-sup')) { for (const s of document.querySelectorAll('.tuile-sup.selected')) s.classList.remove('selected'); e.classList.add('selected'); e.scrollIntoView({ block: 'center' }); }
}

function monter() {
  const g = document.querySelector('#ordreControles'); g.setAttribute('aria-label', T('ordreGroupe'));
  for (const b of g.querySelectorAll('button')) { b.textContent = T('ordre', { n: b.dataset.ordre }); b.addEventListener('click', () => { if (location.hash && ordreDeHash()) history.replaceState(null, '', location.pathname + location.search); montrerOrdre(Number(b.dataset.ordre)); }); }
  $('ordresPaveFermer').textContent = T('fermer'); $('ordresPaveFermer').addEventListener('click', () => $('ordresPave').close());
  window.addEventListener('hashchange', allerAuMotif);
  window.__galerieOrdres = { etat: () => ({ ordre: S.ordre, rendus: S.rendus, dessinees: document.querySelectorAll('.tuile-sup[data-dessinee]').length, tuiles: document.querySelectorAll('.tuile-sup').length, sections: [...document.querySelectorAll('.coll-sup')].map((s) => [s.id, s.querySelectorAll('.tuile-sup').length]) }), pret: () => allerAuMotif() };
  allerAuMotif();
}
monter();
