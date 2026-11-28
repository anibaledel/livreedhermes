// pavane-rendu.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Prompt 273 : ce que la nouvelle interface (Pavane) avait perdu de l'ancienne « Voir sa musique » — les rendus « Signes » et « Lignes nodales » (la figure de Chladni du motif lui-même,
// celle de assets/musique-chladni-moteur.js : figure()) à côté des fonds de cases (Aplat, Triangles, Bandes), et le bouton « Plus d'options » avec les réglages de l'analyse du son.
// Tout ce qui est NOUVEAU est ici, dans un module nouveau : les modules de Pavane ne sont pas versionnés (un cache périmé d'un module qui gagnerait un export ferait échouer la page).
// Pur, hors le dessin du PNG (canvas) et la construction du panneau (DOM). Rien n'est lu hors du site.
import { figure } from './musique-chladni-moteur.js';

export const RENDUS = Object.freeze(['signes', 'lignes', 'cases']); // « cases » : les fonds de cases (Aplat, Triangles, Bandes) de l'interface
export const RENDU_DEFAUT = 'signes'; // le rendu de départ de l'ancienne version : « Signes »
export const TUILE = 240; // points par côté de la figure d'un motif (une période de 12 cases)

// ---------- les réglages de l'analyse du son (ceux de l'ancien « Plus d'options ») ----------
// Le lissage de départ est celui de l'ancienne version (prompt 277) : 0,45 de nouveau spectre par image de 33 ms, soit une constante de temps de 0,0557 s (arrondie à 0,06 s) ; l'interface d'avant (prompt 273) partait sur 1,5 s.
export const OPT_DEFAUTS = Object.freeze({ seuil: 0.45, intervalle: 0.45, lissage: 0.06, pente: true, calme: false, loi: 'racine', c: 31.85 });
export const OPT_BORNES = Object.freeze({ seuil: [0.15, 1, 0.05], intervalle: [0.2, 1, 0.05], lissage: [0.05, 3, 0.01], c: [10, 100, 0.05] });
export const LOIS = Object.freeze(['racine', 'plaque']);
const CLES = Object.freeze({ seuil: 'sensibilite', intervalle: 'intervalle', lissage: 'lissage', pente: 'pente', calme: 'calme', loi: 'loi', c: 'c' });

const nombre = (s, [min, max, pas]) => {
  if (typeof s !== 'string' || !/^\d+(\.\d+)?$/.test(s)) return null;
  const x = Number(s);
  return x >= min - 1e-9 && x <= max + 1e-9 && Math.abs(Math.round((x - min) / pas) * pas + min - x) < 1e-6 ? x : null;
};
/** Le rendu d'une adresse (?rendu=signes|lignes|cases) ; une autre valeur est ignorée (le défaut). */
export function lireRendu(search) { const v = new URLSearchParams(search).get('rendu'); return RENDUS.includes(v) ? v : RENDU_DEFAUT; }
/** Les réglages de l'adresse ; toute valeur hors liste ou hors bornes est ignorée (le défaut), jamais corrigée. */
export function lireOptions(search) {
  const q = new URLSearchParams(search), o = { ...OPT_DEFAUTS };
  for (const k of ['seuil', 'intervalle', 'lissage', 'c']) { if (q.has(CLES[k])) { const x = nombre(q.get(CLES[k]), OPT_BORNES[k]); if (x !== null) o[k] = x; } }
  for (const k of ['pente', 'calme']) { const v = q.get(CLES[k]); if (v === '1') o[k] = true; else if (v === '0') o[k] = false; }
  if (LOIS.includes(q.get('loi'))) o.loi = q.get('loi');
  return o;
}
/** L'adresse `search` avec le rendu et les réglages qui diffèrent du défaut ; les autres clés sont gardées telles quelles. */
export function ecrireRenduEtOptions(search, rendu, o) {
  const q = new URLSearchParams(search);
  const poser = (cle, diff, val) => { if (diff) q.set(cle, val); else q.delete(cle); };
  poser('rendu', rendu !== RENDU_DEFAUT, rendu);
  for (const k of ['seuil', 'intervalle', 'lissage', 'c']) poser(CLES[k], o[k] !== OPT_DEFAUTS[k], String(o[k]));
  for (const k of ['pente', 'calme']) poser(CLES[k], o[k] !== OPT_DEFAUTS[k], o[k] ? '1' : '0');
  poser('loi', o.loi !== OPT_DEFAUTS.loi, o.loi);
  const s = q.toString();
  return s ? `?${s}` : '';
}
/** Les réglages que le chef d'orchestre prend (assets/pavane-moteur.js : creerChef({ reglages })). */
export const reglagesDuChef = (o) => ({ seuil: o.seuil, intervalle: o.intervalle * (o.calme ? 3 : 1), lissageS: o.lissage, pente: o.pente, loi: o.loi, c: o.c });

// ---------- la figure d'un motif ----------
/** Le champ 12 × 12 d'un motif tricolore (lignes de lettres) : V = +1, O = 0, M = −1 (comme assets/musique-chladni-moteur.js : champ). */
export function champDuMotif(tricolore) {
  const f = new Float64Array(144);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) { const x = tricolore[r][c]; f[r * 12 + c] = x === 'V' ? 1 : x === 'M' ? -1 : 0; }
  return f;
}
/** Le masque (255 = encre) des signes ou des lignes nodales du motif, sur une tuile de T × T points. */
export function masqueDuMotif(tricolore, vue, T = TUILE) { const A = new Uint8Array(T * T); return figure(champDuMotif(tricolore), 12, T, vue, A); }
const hexVersRvb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Une image SVG (la tuile d'un motif, en PNG incorporé) : bg = la couleur de fond, ink = celle de la figure. Même forme que varianteSvg : un SVG carré, la tuile se répète. */
export function svgFigure(tricolore, vue, [bg, ink], { size = 480, T = TUILE } = {}) {
  const A = masqueDuMotif(tricolore, vue, T), cv = document.createElement('canvas'); cv.width = cv.height = T;
  const x = cv.getContext('2d'), im = x.createImageData(T, T), d = im.data, b = hexVersRvb(bg), k = hexVersRvb(ink);
  for (let i = 0; i < T * T; i++) { const c = A[i] === 255 ? k : b; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  const png = cv.toDataURL('image/png');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${T} ${T}"><image width="${T}" height="${T}" href="${png}" xlink:href="${png}"/></svg>`;
}

// ---------- les textes (FR et EN ; les autres langues retombent sur le français : TODO-RELECTURE.md) ----------
const TEXTES = {
  fr: {
    renduTitre: 'Rendu', rendu_signes: 'Signes', rendu_lignes: 'Lignes nodales', rendu_cases: 'Cases',
    renduAide: 'Signes : les zones positives de la figure du motif. Lignes nodales : les lignes où elle s\'annule.',
    plusOptions: 'Plus d\'options', moinsOptions: 'Moins d\'options', optionsTitre: 'Réglages de l\'analyse du son',
    sensibilite: 'Sensibilité aux attaques', sensibiliteAide: 'Plus bas : plus sensible aux attaques de notes.',
    intervalle: 'Intervalle minimal entre deux attaques (s)', lissage: 'Lissage du spectre (s)', lissageAide: 'Plus long : l\'image suit le son plus lentement.',
    pente: 'Compenser la pente des graves', calme: 'Mode calme (intervalle ×3)',
    loiTitre: 'Loi de fréquence', loi_racine: 'Racine (échelle compressée pour l\'oreille)', loi_plaque: 'Plaque (f = c·K, loi de la plaque réelle)', loiC: 'c de la loi de la plaque (Hz)',
    remiseAZero: 'Remettre les réglages à zéro',
    srcEssai: 'Musique d\'essai', essaiProposer: 'Essayer avec la musique d\'essai',
    microRefuse: 'Le micro est refusé : autorisez-le dans le navigateur, ou essayez avec la musique d\'essai.',
    microAbsent: 'Aucun micro n\'est disponible sur cet appareil : essayez avec la musique d\'essai.',
    microIndispo: 'Le micro n\'est pas utilisable pour le moment : essayez avec la musique d\'essai.',
  },
  en: {
    renduTitre: 'Rendering', rendu_signes: 'Signs', rendu_lignes: 'Nodal lines', rendu_cases: 'Cells',
    renduAide: 'Signs: the positive regions of the pattern\'s figure. Nodal lines: where it vanishes.',
    plusOptions: 'More options', moinsOptions: 'Fewer options', optionsTitre: 'Sound analysis settings',
    sensibilite: 'Attack sensitivity', sensibiliteAide: 'Lower: more sensitive to note attacks.',
    intervalle: 'Minimum interval between two attacks (s)', lissage: 'Spectrum smoothing (s)', lissageAide: 'Longer: the image follows the sound more slowly.',
    pente: 'Compensate the bass slope', calme: 'Calm mode (interval ×3)',
    loiTitre: 'Frequency law', loi_racine: 'Root (compressed scale for the ear)', loi_plaque: 'Plate (f = c·K, real plate law)', loiC: 'c of the plate law (Hz)',
    remiseAZero: 'Reset the settings',
    srcEssai: 'Test music', essaiProposer: 'Try the test music',
    microRefuse: 'The microphone was refused: allow it in the browser, or try the test music.',
    microAbsent: 'No microphone is available on this device: try the test music.',
    microIndispo: 'The microphone cannot be used right now: try the test music.',
  },
};
export const texteRendu = (langue, cle) => { const t = (TEXTES[langue] && TEXTES[langue][cle]) ?? TEXTES.fr[cle]; if (t === undefined) throw new Error(`pavane-rendu.js : clé « ${cle} » inconnue`); return t; };

// ---------- le panneau « Plus d'options » : fermé au départ, rien n'y est visible tant qu'on ne l'a pas ouvert ----------
const el = (tag, attrs = {}, ...enfants) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v === false || v === null || v === undefined) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); } for (const c of enfants.flat()) if (c) e.append(c); return e; };
/** Rend { bouton, panneau, maj(o) } ; `surChangement(o)` reçoit les réglages complets à chaque changement, `surRemiseAZero()` à la remise à zéro. */
export function creerPanneauOptions({ langue, id, o, surChangement, surRemiseAZero }) {
  const T = (c) => texteRendu(langue, c);
  let courant = { ...o };
  const panneau = el('div', { class: 'pv-options', id: `${id}-options`, role: 'group', 'aria-label': T('optionsTitre'), hidden: true });
  const bouton = el('button', { type: 'button', class: 'pv-lien', 'aria-expanded': 'false', 'aria-controls': panneau.id, text: T('plusOptions') });
  const champs = {};
  const curseur = (cle, libelle, aide) => {
    const [min, max, pas] = OPT_BORNES[cle], sortie = el('output', { for: `${id}-o-${cle}` }), r = el('input', { type: 'range', id: `${id}-o-${cle}`, min: String(min), max: String(max), step: String(pas) });
    r.addEventListener('input', () => { courant = { ...courant, [cle]: Number(r.value) }; sortie.textContent = r.value; surChangement(courant); });
    champs[cle] = { r, sortie };
    return el('div', { class: 'pv-ligne' }, el('label', { for: r.id, text: libelle }), r, sortie, aide ? el('small', { class: 'pv-doux', text: aide }) : null);
  };
  const case_ = (cle, libelle) => { const c = el('input', { type: 'checkbox', id: `${id}-o-${cle}` }); c.addEventListener('change', () => { courant = { ...courant, [cle]: c.checked }; surChangement(courant); }); champs[cle] = { c }; return el('label', {}, c, el('span', { text: libelle })); };
  const selLoi = el('select', { id: `${id}-o-loi` }, ...LOIS.map((l) => el('option', { value: l, text: T(`loi_${l}`) })));
  selLoi.addEventListener('change', () => { courant = { ...courant, loi: selLoi.value }; maj(courant); surChangement(courant); });
  const bRaz = el('button', { type: 'button', text: T('remiseAZero') });
  bRaz.addEventListener('click', () => { courant = { ...OPT_DEFAUTS }; maj(courant); surRemiseAZero(); });
  panneau.append(curseur('seuil', T('sensibilite'), T('sensibiliteAide')), curseur('intervalle', T('intervalle')), curseur('lissage', T('lissage'), T('lissageAide')), case_('pente', T('pente')), case_('calme', T('calme')),
    el('div', { class: 'pv-ligne' }, el('label', { for: selLoi.id, text: T('loiTitre') }), selLoi), curseur('c', T('loiC')), bRaz);
  function maj(x) {
    courant = { ...x };
    for (const k of ['seuil', 'intervalle', 'lissage', 'c']) { champs[k].r.value = String(courant[k]); champs[k].sortie.textContent = String(courant[k]); }
    champs.pente.c.checked = courant.pente; champs.calme.c.checked = courant.calme; selLoi.value = courant.loi; champs.c.r.disabled = courant.loi !== 'plaque';
  }
  bouton.addEventListener('click', () => { const ouvre = panneau.hidden; panneau.hidden = !ouvre; bouton.setAttribute('aria-expanded', String(ouvre)); bouton.textContent = T(ouvre ? 'moinsOptions' : 'plusOptions'); });
  maj(courant);
  return { bouton, panneau, maj };
}
