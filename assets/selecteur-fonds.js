// selecteur-fonds.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le sélecteur de fond — UN composant, écrit une fois, pour toutes les pages
// qui posent un fond sur un motif (création bicolore v2 d'abord ; pages de
// motifs et fond d'écran ensuite, avec ce même fichier).
//
// Une liste à échantillons, sur le modèle d'un sélecteur de polices :
// chaque ligne montre LE MOTIF EN COURS rendu dans son fond, dans la même
// fenêtre de 4 × 4 cases pour toutes les lignes (fenetreEquilibree() :
// environ moitié de chaque valeur, pour ne pas avantager les fonds
// chargés). Deux <symbol> par fond, des <use> pour les seize cases : la
// liste se redessine quand le motif change, et le temps du redessin est
// mesuré (racine.dataset.redessinMs).
//
// Chaque ligne : le code (chasse fixe), le nom (romain), et une ligne de
// métadonnées qui ne dit que ce qui est vrai pour la famille du fond :
//   orientation   — le mode, et le raccord pour les bandes ;
//   quantité      — contraste à distance : |1 − 2f| (ou mesuré) ;
//   superposition — le glyphe, l'échelle, et le contraste.
// Tous les chiffres sortent du moteur (bicolore-fonds.js) ou de ses calculs
// enregistrés (data/fonds/collection-v1.calculs.json).
//
// Ordre par construction : l'aplat, les bandes orthogonales, les bandes
// diagonales, les polygones d'orientation, les fonds de quantité, les
// superpositions. Clavier : flèches pour parcourir, Entrée pour choisir,
// Échap pour fermer.

import { symbolesDe, symbolesCoupesDe, hrefDeCase, lecture, contrasteDe, couvertureA, decomposer, GLYPHES, SEUIL_CONTRASTE, APLAT, GRID } from './bicolore-fonds.js';

const TEXTES = {
  fr: {
    titre: 'Fond', choisir: 'Choisir le fond', liste: 'Fonds et superpositions',
    groupes: ['Aplat', 'Bandes orthogonales', 'Bandes diagonales', 'Polygones — orientation', 'Fonds de quantité', 'Superpositions'],
    orientation: 'orientation', quantite: 'quantité', raccord: 'raccord',
    modes: { rotation: 'rotation', miroir: 'miroir', echange: 'échange', nature: 'nature' },
    dp: ' : ', identique: 'identique à', contraste: 'contraste à distance', avert: 'plus de contraste à distance', direction: 'se lit par la direction',
    echelle: 'échelle', sans: 'sans glyphe', sansNom: 'aucune superposition', fraction: 'fraction',
    glyphes: { carre: 'carré', rond: 'rond', losange: 'losange', croix: 'croix', etoile: 'étoile' },
    nombres: ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'],
    bandes: (n) => `${n} bandes`, largeurs: (l) => `bandes ${l}`, diag: ' en diagonale', triangles: 'triangles',
    suffixes: { miroir: ', en miroir', echange: ', couleurs échangées', nature: '' },
    nature: (a, b) => `${a} ou ${b}`, inactif: 'Les fonds se posent sur la lecture C1 : un bit par case.',
  },
  en: {
    titre: 'Ground', choisir: 'Choose the ground', liste: 'Grounds and overlays',
    groupes: ['Solid', 'Orthogonal bands', 'Diagonal bands', 'Polygons — orientation', 'Quantity grounds', 'Overlays'],
    orientation: 'orientation', quantite: 'quantity', raccord: 'join',
    modes: { rotation: 'rotation', miroir: 'mirror', echange: 'exchange', nature: 'nature' },
    dp: ': ', identique: 'identical to', contraste: 'contrast at a distance', avert: 'no more contrast at a distance', direction: 'reads by direction',
    echelle: 'scale', sans: 'none', sansNom: 'no overlay', fraction: 'fraction',
    glyphes: { carre: 'square', rond: 'circle', losange: 'lozenge', croix: 'cross', etoile: 'star' },
    nombres: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    bandes: (n) => `${n} bands`, largeurs: (l) => `${l} bands`, diag: ', diagonal', triangles: 'triangles',
    suffixes: { miroir: ', mirrored', echange: ', colours exchanged', nature: '' },
    nature: (a, b) => `${a} or ${b}`, inactif: 'Grounds sit on the C1 reading: one bit per cell.',
  },
};
const RACCORDS = { fr: { franc: 'franc', 'inversé': 'inversé', aucun: 'aucun' }, en: { franc: 'clean', 'inversé': 'inverted', aucun: 'none' } };
const textes = (lang) => TEXTES[lang] || TEXTES.fr;
const pct = (x) => `${Math.round(x * 100)} %`;
const pct1 = (x, lang) => `${(x * 100).toFixed(1).replace('.', lang === 'fr' ? ',' : '.')} %`;
const echelleTexte = (s, lang) => s.toFixed(2).replace('.', lang === 'fr' ? ',' : '.');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Le nom d'un fond, en romain : donné par la collection (`nom`), ou lu sur
// le dessin pour les bandes (le code dit la même chose, autrement).
function nomDeBandes(def, T) {
  const d = def.largeurs.reduce((a, b) => { while (b) [a, b] = [b, a % b]; return a; });
  const reduites = def.largeurs.map((w) => w / d);
  const egales = reduites.every((w) => w === 1);
  if (egales && def.nombre === 2 && def.angle === 45) return T.triangles;
  return (egales ? T.bandes(T.nombres[def.nombre] || def.nombre) : T.largeurs(reduites.join('-'))) + (def.angle === 45 ? T.diag : '');
}
export function nomDuFond(f, lang = 'fr') {
  const T = textes(lang);
  if (f.nom) return f.nom[lang] || f.nom.fr;
  if (f.mode === 'nature') return T.nature(nomDeBandes(f.v0, T), nomDeBandes(f.v1, T));
  if (f.type === 'bandes') return nomDeBandes(f, T) + (T.suffixes[f.mode] || '');
  return f.id;
}

// La ligne de métadonnées d'un fond : ce qui est vrai pour sa famille.
export function metaDuFond(f, lang = 'fr') {
  const T = textes(lang);
  const identite = f.calcul.identique && f.calcul.identique.length ? ` · ${T.identique} ${f.calcul.identique.join(', ')}` : '';
  if (f.calcul.famille === 'orientation') {
    const m = [T.orientation, T.modes[f.mode]];
    if (f.calcul.raccord) m.push(`${T.raccord} ${RACCORDS[lang] ? RACCORDS[lang][f.calcul.raccord] : f.calcul.raccord}`);
    return { texte: m.join(' · ') + identite, avertissement: null };
  }
  const l = lecture(f);
  return { texte: `${T.quantite} · ${T.contraste}${T.dp}${pct(l.contraste)}${identite}`, avertissement: l.avertissement ? T.avert : null };
}

// Une superposition à l'échelle s : sa couverture et son contraste sur
// l'aplat (même loi que la famille quantité, f = couverture du glyphe).
export function superposition(forme, echelle, collection) {
  const lettre = Object.keys(GLYPHES).find((k) => GLYPHES[k] === forme);
  const s = Math.round(echelle * 100) / 100;
  const id = `${lettre}${String(Math.round(s * 100)).padStart(2, '0')}`;
  const u = collection.glyphes[forme];
  const c = couvertureA(u, s);
  return { id, forme, echelle: s, calcul: { couverture: c, couvertureUnite: u, contraste: contrasteDe(c) } };
}
export function metaDeSuperposition(sup, lang = 'fr') {
  const T = textes(lang);
  const c = sup.calcul.contraste;
  return { texte: `${T.glyphes[sup.forme]} · ${T.echelle} ${echelleTexte(sup.echelle, lang)} · ${T.contraste}${T.dp}${pct(c)}`, avertissement: c < SEUIL_CONTRASTE ? T.avert : null };
}

// La valeur d'une case pour l'équilibre de la fenêtre : son bit, ou la
// part de bit 1 d'une case coupée (lecture binaire d'un motif tricolore).
const valeurDe = (k) => (k !== null && typeof k === 'object'
  ? (k.type === 'pleine' ? k.bit : k.triangles.reduce((a, t) => a + t.bit, 0) / k.triangles.length)
  : (k === 1 || k === '1' ? 1 : 0));

// La fenêtre de 4 × 4 cases (sur le tore : le motif se pave) dont la part
// de bit 1 est la plus proche de la moitié ; à égalité, la première dans
// l'ordre de lecture. La même pour toutes les lignes.
export function fenetreEquilibree(mask) {
  const val = (r, c) => valeurDe(mask[((r + GRID) % GRID) * GRID + ((c + GRID) % GRID)]);
  let mieux = null;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    let un = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) un += val(r + i, c + j);
    const ecart = Math.abs(un - 8);
    if (!mieux || ecart < mieux.ecart - 1e-9) mieux = { r, c, ecart, un };
  }
  return mieux;
}

// L'état du sélecteur dans l'URL, le même sur toutes les pages :
// ?fond=B3D&sup=E95 (l'aplat et l'absence de glyphe ne s'écrivent pas).
export function etatDeLUrl(fondsConnus = null) {
  const p = new URLSearchParams(location.search);
  const etat = { fond: 'P', glyphe: null, echelle: 0.95 };
  try { if (p.get('fond')) etat.fond = decomposer(p.get('fond')).fond; } catch { /* code illisible : l'aplat */ }
  if (fondsConnus && !fondsConnus.has(etat.fond)) etat.fond = 'P';
  const m = /^([A-Z])(\d{2})$/.exec(p.get('sup') || '');
  if (m && GLYPHES[m[1]]) { etat.glyphe = GLYPHES[m[1]]; etat.echelle = Number(m[2]) / 100; }
  return etat;
}
export function etatDansLUrl(etat) {
  const p = new URLSearchParams(location.search);
  if (etat.fond && etat.fond !== 'P') p.set('fond', etat.fond); else p.delete('fond');
  if (etat.superposition) p.set('sup', etat.superposition); else p.delete('sup');
  const q = p.toString();
  history.replaceState(null, '', (q ? '?' + q : location.pathname) + location.hash);
}

const STYLE = `
.sf{position:relative;display:block;width:100%;max-width:470px;font-family:inherit}
.sf-bouton{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:52px minmax(0,1fr);gap:4px 16px;align-items:center;width:100%;min-height:66px;padding:7px 16px;background:#fff;color:#222;border:1px solid #d9d2c3;text-align:left}
.sf-bouton:focus-visible{outline:2px solid #b8860b;outline-offset:2px}
.sf-bouton[disabled]{cursor:not-allowed;opacity:.55}
.sf-bouton .sf-ech{grid-row:span 2}
.sf-liste{position:absolute;z-index:50;left:0;top:calc(100% + 4px);width:470px;max-width:calc(100vw - 32px);max-height:min(70vh,560px);overflow-y:auto;background:#fff;color:#222;border:1px solid #d9d2c3;box-shadow:0 6px 24px rgba(0,0,0,.25);text-align:left}
.sf-liste:focus{outline:none}
.sf-groupe{padding:10px 16px 4px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b}
.sf-ligne{display:grid;grid-template-columns:52px 62px minmax(0,1fr);grid-template-rows:auto auto;column-gap:16px;align-items:center;height:66px;box-sizing:border-box;padding:7px 16px;border-top:1px solid #f0ece3;cursor:pointer}
.sf-ligne .sf-ech{grid-row:span 2}
.sf-ligne[aria-selected="true"]{background:#f3efe6}
.sf-ligne.sf-actif{box-shadow:inset 3px 0 0 #b8860b}
.sf svg.sf-ech{display:block!important;width:52px!important;height:52px!important;max-width:none!important;margin:0!important;border:0!important;padding:0!important}
.sf-code{font:700 13px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#1f1b16}
.sf-nom{font-size:13px;line-height:1.2;color:#1f1b16;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sf-meta{grid-column:2 / -1;font-size:10.5px;line-height:1.2;color:#6b6b6b;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sf-bouton .sf-meta{grid-column:2}
.sf-titre{display:flex;gap:10px;align-items:baseline;min-width:0}
.sf-av{color:var(--red)}
.sf-echelle{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:12px}
.sf-echelle input{flex:1;min-width:120px}
.sf-note{font-size:11px;margin-top:6px;opacity:.8}
.sf svg.sf-defs{position:absolute!important;width:0!important;height:0!important;overflow:hidden;border:0!important;margin:0!important}
@media (max-width:520px){.sf-liste{position:fixed;left:16px;right:16px;top:auto;bottom:16px;width:auto;max-width:none;max-height:70vh}}
`;

let compteur = 0;

// racine : l'élément qui reçoit le composant. collection : la collection
// chargée (chargerCollection(json, { calculs })) et `glyphes` (les
// couvertures à l'échelle 1 des calculs). palette : [bit 0, bit 1].
// etat : { fond, glyphe, echelle }. onChange(etat) à chaque choix.
export function creerSelecteurFonds(racine, { collection, glyphes, palette, lang = 'fr', etat = {}, onChange = () => {} }) {
  const T = textes(lang);
  const uid = `sf${++compteur}`;
  const col = { ...collection, glyphes };
  if (!document.getElementById('sf-style')) {
    const st = document.createElement('style');
    st.id = 'sf-style'; st.textContent = STYLE;
    document.head.appendChild(st);
  }
  let fondId = collection.fonds.has(etat.fond) ? etat.fond : 'P';
  let forme = etat.glyphe && Object.values(GLYPHES).includes(etat.glyphe) ? etat.glyphe : null;
  let echelle = Math.min(0.99, Math.max(0.1, Number(etat.echelle) || 0.95));
  let mask = new Uint8Array(GRID * GRID);
  let fen = fenetreEquilibree(mask);
  let pal = palette.slice();
  let ouvert = false;
  let actif = true;

  // L'ordre de la liste, par construction.
  const fonds = [...collection.fonds.values()];
  const groupeDe = (f) => {
    if (f.type === 'aplat') return 0;
    if (f.calcul.famille === 'quantite') return 4;
    const def = f.mode === 'nature' ? f.v0 : f;
    if (def.type === 'bandes') return def.angle === 45 ? 2 : 1;
    return 3;
  };
  const groupes = T.groupes.map(() => []);
  for (const f of fonds) groupes[groupeDe(f)].push({ type: 'fond', f });
  groupes[5].push({ type: 'glyphe', forme: null });
  for (const g of Object.values(GLYPHES)) groupes[5].push({ type: 'glyphe', forme: g });
  const options = groupes.flat();
  const idOption = (o) => `${uid}-${o.type === 'fond' ? `f-${o.f.id}` : `g-${o.forme || 'aucun'}`}`;

  racine.classList.add('sf');
  racine.innerHTML = `
    <button type="button" class="sf-bouton" aria-haspopup="listbox" aria-expanded="false" aria-controls="${uid}-liste" aria-label="${esc(T.choisir)}"></button>
    <div class="sf-liste" id="${uid}-liste" role="listbox" aria-label="${esc(T.liste)}" aria-multiselectable="true" tabindex="0" hidden>
      ${groupes.map((g, i) => (g.length ? `<div role="group" aria-labelledby="${uid}-g${i}"><div class="sf-groupe" id="${uid}-g${i}" role="presentation">${esc(T.groupes[i])}</div>${g.map((o) => `<div class="sf-ligne" role="option" id="${idOption(o)}" aria-selected="false"></div>`).join('')}</div>` : '')).join('')}
    </div>
    <label class="sf-echelle"><span>${esc(T.echelle)}</span><input type="range" min="0.10" max="0.99" step="0.01"><output></output></label>
    <p class="sf-note" hidden></p>
    <svg class="sf-defs" aria-hidden="true" focusable="false"><defs class="sf-defs-fonds"></defs><defs class="sf-defs-glyphes"></defs><defs class="sf-defs-coupes"></defs></svg>`;
  const bouton = racine.querySelector('.sf-bouton');
  const liste = racine.querySelector('.sf-liste');
  const curseur = racine.querySelector('.sf-echelle input');
  const sortie = racine.querySelector('.sf-echelle output');
  const note = racine.querySelector('.sf-note');
  const defsFonds = racine.querySelector('.sf-defs-fonds');
  const defsGlyphes = racine.querySelector('.sf-defs-glyphes');
  const defsCoupes = racine.querySelector('.sf-defs-coupes');
  const symbolesCoupes = () => { defsCoupes.innerHTML = symbolesCoupesDe(mask, pal, `${uid}-`); };
  const lignes = new Map(options.map((o) => [idOption(o), { o, el: racine.querySelector(`#${CSS.escape(idOption(o))}`) }]));
  let actifId = null;

  const supCourante = () => (forme ? superposition(forme, echelle, col) : null);
  const fondCourant = () => collection.fonds.get(fondId);

  // Les seize <use> d'une fenêtre, pour un fond déjà en symboles.
  // (une case coupée de la lecture binaire garde ses triangles, sans fond)
  const usesFenetre = (ref) => {
    let u = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const r = (fen.r + i) % GRID, c = (fen.c + j) % GRID;
      u += `<use href="#${hrefDeCase(mask[r * GRID + c], ref, `${uid}-`)}" x="${j}" y="${i}" width="1" height="1"/>`;
    }
    return u;
  };
  const echantillon = (ref) => `<svg class="sf-ech" data-ref="${ref}" viewBox="0 0 4 4" width="52" height="52" aria-hidden="true" focusable="false">${usesFenetre(ref)}</svg>`;
  const mesure = (t0, nom, miseEnPage = true) => {
    if (miseEnPage) void racine.offsetHeight; // la mise en page de la liste comprise dans la mesure
    const ms = performance.now() - t0;
    racine.dataset[nom] = ms.toFixed(1);
    return ms;
  };

  // Le motif a changé : seuls les échantillons changent (les symboles, les
  // noms et les métadonnées ne dépendent pas du motif).
  function redessinerEchantillons() {
    const t0 = performance.now();
    for (const svg of racine.querySelectorAll('svg.sf-ech')) svg.innerHTML = usesFenetre(svg.dataset.ref);
    return mesure(t0, 'echantillonsMs', false); // appelé au milieu du rendu de la page : sans forcer sa mise en page
  }
  const ligneHtml = (code, nom, meta, ech) => `${ech}<span class="sf-code">${esc(code)}</span><span class="sf-nom">${esc(nom)}</span><span class="sf-meta">${esc(meta.texte)}${meta.avertissement ? ` · <span class="sf-av">${esc(meta.avertissement)}</span>` : ''}</span>`;

  // Les symboles : deux par fond (sans glyphe) — ils ne dépendent que de la
  // palette ; deux par glyphe (sur le fond courant, à l'échelle courante) et
  // ceux de l'état choisi — reconstruits quand le fond ou l'échelle
  // changent. Deux <defs> séparés : changer les glyphes ne réinstancie pas
  // les <use> des fonds. Rien ne se reconstruit quand le motif change.
  const refs = new Map();
  function symbolesFonds() {
    let d = '';
    for (const f of fonds) { const { ref, defs: x } = symbolesDe(f, pal, { prefixe: `${uid}-` }); refs.set(`f-${f.id}`, ref); d += x; }
    defsFonds.innerHTML = d;
  }
  function symbolesGlyphes() {
    let d = '';
    for (const g of Object.values(GLYPHES)) {
      const { ref, defs: x } = symbolesDe(fondCourant(), pal, { prefixe: `${uid}-`, superposition: superposition(g, echelle, col) });
      refs.set(`g-${g}`, ref); d += x;
    }
    const cour = symbolesDe(fondCourant(), pal, { prefixe: `${uid}-cour-`, superposition: supCourante() });
    refs.set('courant', cour.ref); d += cour.defs;
    defsGlyphes.innerHTML = d;
  }
  const symboles = () => { symbolesFonds(); symbolesGlyphes(); };

  // Les lignes : `toutes` (palette, motif d'origine) ou seulement ce qui
  // dépend du fond et de l'échelle (la sélection, les lignes de glyphes).
  function redessiner(toutes = true) {
    const t0 = performance.now();
    for (const { o, el } of lignes.values()) {
      if (o.type === 'fond') {
        if (toutes) el.innerHTML = ligneHtml(o.f.id, nomDuFond(o.f, lang), metaDuFond(o.f, lang), echantillon(refs.get(`f-${o.f.id}`)));
        el.setAttribute('aria-selected', o.f.id === fondId ? 'true' : 'false');
      } else if (o.forme) {
        const sup = superposition(o.forme, echelle, col);
        el.innerHTML = ligneHtml(`+${sup.id}`, T.glyphes[o.forme], metaDeSuperposition(sup, lang), echantillon(refs.get(`g-${o.forme}`)));
        el.setAttribute('aria-selected', o.forme === forme ? 'true' : 'false');
      } else {
        el.innerHTML = ligneHtml(T.sans, T.sansNom, { texte: '', avertissement: null }, echantillon(refs.get(`f-${fondId}`)));
        el.setAttribute('aria-selected', forme ? 'false' : 'true');
      }
    }
    // Le bouton : l'état choisi, code complet.
    const f = fondCourant(), sup = supCourante();
    const meta = sup ? metaDeSuperposition(sup, lang) : metaDuFond(f, lang);
    bouton.innerHTML = `${echantillon(refs.get('courant'))}<span class="sf-titre"><span class="sf-code">${esc(sup ? `${f.id}+${sup.id}` : f.id)}</span><span class="sf-nom">${esc(nomDuFond(f, lang))}${sup ? ` + ${esc(T.glyphes[sup.forme])}` : ''}</span></span><span class="sf-meta">${esc(sup ? metaDuFond(f, lang).texte + ' · ' + meta.texte : meta.texte)}${meta.avertissement ? ` · <span class="sf-av">${esc(meta.avertissement)}</span>` : ''}</span>`;
    curseur.value = echelle.toFixed(2);
    sortie.textContent = echelleTexte(echelle, lang);
    curseur.disabled = !forme || !actif;
    return mesure(t0, 'redessinMs');
  }

  function changer() {
    symbolesGlyphes();
    redessiner(false);
    onChange(api.etat());
  }

  // ---------- ouverture, clavier ----------
  function activer(id) {
    if (actifId) lignes.get(actifId)?.el.classList.remove('sf-actif');
    actifId = id;
    const l = lignes.get(id);
    l.el.classList.add('sf-actif');
    liste.setAttribute('aria-activedescendant', id);
    l.el.scrollIntoView({ block: 'nearest' });
  }
  function ouvrir() {
    if (!actif || ouvert) return;
    ouvert = true;
    liste.hidden = false;
    bouton.setAttribute('aria-expanded', 'true');
    liste.focus();
    activer(idOption({ type: 'fond', f: fondCourant() }));
  }
  function fermer(rendreFocus = true) {
    if (!ouvert) return;
    ouvert = false;
    liste.hidden = true;
    bouton.setAttribute('aria-expanded', 'false');
    if (rendreFocus) bouton.focus();
  }
  function choisir(id) {
    const { o } = lignes.get(id);
    if (o.type === 'fond') fondId = o.f.id; else forme = o.forme;
    changer();
    fermer();
  }
  bouton.addEventListener('click', () => (ouvert ? fermer() : ouvrir()));
  bouton.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); ouvrir(); } });
  liste.addEventListener('keydown', (e) => {
    const ids = [...lignes.keys()];
    const i = ids.indexOf(actifId);
    if (e.key === 'ArrowDown') { e.preventDefault(); activer(ids[Math.min(ids.length - 1, i + 1)]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activer(ids[Math.max(0, i - 1)]); }
    else if (e.key === 'Home') { e.preventDefault(); activer(ids[0]); }
    else if (e.key === 'End') { e.preventDefault(); activer(ids[ids.length - 1]); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (actifId) choisir(actifId); }
    else if (e.key === 'Escape') { e.preventDefault(); fermer(); }
    else if (e.key === 'Tab') fermer(false);
  });
  liste.addEventListener('click', (e) => { const el = e.target.closest('.sf-ligne'); if (el) choisir(el.id); });
  document.addEventListener('pointerdown', (e) => { if (ouvert && !racine.contains(e.target)) fermer(false); });
  curseur.addEventListener('input', () => { echelle = Number(curseur.value); changer(); });

  const api = {
    // Le motif en cours : 144 bits (lecture C1), ou les 144 cases de la
    // lecture binaire d'un motif tricolore (pleines, coupées). Les
    // échantillons le montrent.
    setMasque(m) { mask = m; fen = fenetreEquilibree(mask); symbolesCoupes(); return redessinerEchantillons(); },
    setPalette(p) { pal = p.slice(); symboles(); symbolesCoupes(); return redessiner(true); },
    setActif(oui) {
      actif = oui; bouton.disabled = !oui; note.hidden = oui; note.textContent = oui ? '' : T.inactif;
      if (!oui) fermer(false);
      redessiner();
    },
    // { fond, glyphe, echelle, superposition (code), code (complet) }
    etat() {
      const sup = supCourante();
      return { fond: fondId, glyphe: forme, echelle, superposition: sup ? sup.id : null, code: sup ? `${fondId}+${sup.id}` : fondId, objetFond: fondCourant(), objetSuperposition: sup };
    },
    fenetre() { return { ligne: fen.r, colonne: fen.c, uns: fen.un }; },
    masque() { return mask; },
    // Le redessin complet (symboles compris), mesuré : racine.dataset.redessinMs.
    redessinComplet() { const t0 = performance.now(); symboles(); redessiner(); return mesure(t0, 'redessinMs'); },
  };
  symboles();
  redessiner();
  return api;
}

// La description de l'état sous la cellule : code complet, famille, mode,
// fraction, et selon la famille le contraste ou « se lit par la
// direction » ; le raccord pour les bandes. Pour un assemblage, le
// contraste du glyphe (loi de la famille quantité).
export function descriptionEtat(etat, lang = 'fr') {
  const T = textes(lang);
  const f = etat.objetFond, sup = etat.objetSuperposition;
  const morceaux = [`<b class="sf-code-plein">${esc(etat.code)}</b>`];
  const fam = f.calcul.famille === 'orientation' ? T.orientation : T.quantite;
  morceaux.push(`${fam} · ${T.modes[f.mode] || f.mode}`);
  morceaux.push(`${T.fraction} ${pct1(f.calcul.fraction, lang)}`);
  if (f.calcul.famille === 'orientation') morceaux.push(T.direction);
  else { const l = lecture(f); morceaux.push(`${T.contraste}${T.dp}${pct(l.contraste)}${l.avertissement ? ` · <span class="sf-av">${esc(T.avert)}</span>` : ''}`); }
  if (f.calcul.raccord) morceaux.push(`${T.raccord} ${RACCORDS[lang] ? RACCORDS[lang][f.calcul.raccord] : f.calcul.raccord}`);
  if (sup) { const m = metaDeSuperposition(sup, lang); morceaux.push(`+ ${esc(m.texte)}${m.avertissement ? ` · <span class="sf-av">${esc(m.avertissement)}</span>` : ''}`); }
  return morceaux.join(' — ');
}

export { APLAT };
