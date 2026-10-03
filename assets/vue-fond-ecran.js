// vue-fond-ecran.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le fond d'écran fixe, en vecteur : un motif du corpus, sa lecture binaire
// (lecture-binaire.js), un fond de case choisi dans le sélecteur commun
// (selecteur-fonds.js) — et UNE sortie du moteur (fondEcranSvg,
// bicolore-fonds.js) : un SVG sans résolution, qui couvre 1920 × 1080,
// 2560 × 1440, la 4K et tout autre écran. Les PNG sont la même sortie
// rastérisée, chaque case sur un nombre entier de pixels.
//
// UN module, deux montages :
//   monterFondEcran(racine)      l'outil complet — galerie-bicolore.html, sa
//                                page depuis le déplacement (2026-10-03) ;
//   monterPiloteBicolore(racine) le seul sélecteur de collection et de
//                                couleurs — fonds-ecran.html, où il pilote
//                                l'animation bicolore.
// Les deux passent par monterSelecteurBicolore, le SEUL écrivain de l'état
// partagé (etat-fond-ecran.js) : l'animation et la galerie d'animations
// l'importent, elles ne lisent aucune variable globale.
//
// Le motif : choisi par famille et hexagramme (les 256 du corpus, la grille
// même des pages de motifs — grilleDuMotif), ou « figé » depuis l'animation ;
// l'état part dans l'URL : ?motif=<slug>&fond=…&sup=…&c0=…&c1=…

import { chargerCollection, fondEcranSvg } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { creerSelecteurFonds, descriptionEtat, etatDeLUrl, etatDansLUrl } from './selecteur-fonds.js';
import { svgEnPng, telecharger } from './vue-fond-motif.js';
import { PALETTES, paletteDeLUrl, paletteDansLUrl } from './couleurs.js';
import { devenirEcrivain } from './etat-fond-ecran.js';

// Les huit familles du corpus (pages de motifs), dans leur ordre, et leur
// adresse — la même que scripts/generate-motif-pages.js (motifSlug).
export const FAMILLES = ['bases:yang_mut', 'bases:yang', 'par2:yang+yin_mut', 'par2:yin_mut+yang_mut', 'par2:yin+yang', 'par2:yin+yang_mut', 'par3:sans_yang', 'par3:sans_yang_mut'];
export const slugDe = (fam, n) => `${fam.replace(/[:+_]/g, '-')}-h${n}`;
const LIBELLES = { yang: 'Yang', yang_mut: 'Yang mut.', yin: 'Yin', yin_mut: 'Yin mut.' };
const libelleFamille = (fam) => {
  const [cat, reste] = fam.split(':');
  const c = { bases: 'Bases', par2: 'Par 2', par3: 'Par 3' }[cat] || cat;
  return `${c} — ${reste.replace('sans_', 'sans ').split('+').map((x) => x.replace(/^sans (.*)$/, (_, y) => `sans ${LIBELLES[y] || y}`).replace(/^(yang_mut|yin_mut|yang|yin)$/, (y) => LIBELLES[y])).join(' + ')}`;
};

// La grille d'un motif du corpus : pour chaque case, la grille YANG de la
// famille si le trait de son niveau est plein, YANG mutante sinon — même
// géométrie que hexagramGrid() de scripts/generate-motif-pages.js (le test
// verify_lecture_binaire.mjs compare les 256 aux pages).
export function grilleDuMotif(data, fam, n) {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const f = data.families[fam];
  return data.layerOf.map((ligne, r) => ligne.map((niveau, c) => (traits[niveau - 1] === 1 ? f.yang[r][c] : f.yang_mut[r][c])));
}

export const RESOLUTIONS = [[1920, 1080], [2560, 1440], [3840, 2160]];

// Les données du fond d'écran (corpus, collection, calculs), chargées une fois.
let donnees = null;
export function chargerDonneesFond() {
  donnees ||= Promise.all(['../data/fonds_ecran_v1.json', '../data/fonds/collection-v1.json', '../data/fonds/collection-v1.calculs.json']
    .map((u) => fetch(new URL(u, import.meta.url)).then((r) => r.json())))
    .then(([data, json, calculs]) => ({ data, calculs, collection: chargerCollection(json, { calculs }) }));
  return donnees;
}

// Le sélecteur de fond et les deux couleurs, dans `racine` (#ffSelecteur,
// #ffCouleur1 = figure / bit 1, #ffCouleur2 = fond / bit 0, .ff-preset) :
// le seul écrivain de l'état partagé. `onChange` prévient la page qui
// l'héberge (l'outil complet redessine son aperçu).
export function monterSelecteurBicolore(racine, { collection, calculs, masque = null, onChange = () => {} }) {
  const $ = (s) => racine.querySelector(s);
  // couleurs : crème et encre d'assets/couleurs.js par défaut, ou l'URL
  [$('#ffCouleur2').value, $('#ffCouleur1').value] = paletteDeLUrl();
  const palette = () => [$('#ffCouleur2').value, $('#ffCouleur1').value];
  let publier = null;
  const publierEtat = () => {
    const e = sel.etat();
    publier({ collection, code: e.code, objetFond: e.objetFond, objetSuperposition: e.objetSuperposition, palette: palette(), description: descriptionEtat(e, 'fr') });
  };
  const sel = creerSelecteurFonds($('#ffSelecteur'), {
    collection, glyphes: calculs.glyphes, palette: palette(), lang: 'fr', etat: etatDeLUrl(collection.fonds),
    onChange: (e) => { etatDansLUrl(e); publierEtat(); onChange(); },
  });
  if (masque) sel.setMasque(masque);
  // poignée de VÉRIFICATION (tools/check_selecteur_fonds.mjs : redessinComplet,
  // fenêtre), comme sur les autres pages du sélecteur — pas une source d'état :
  // l'état se lit par etat-fond-ecran.js.
  window.selecteurFonds = sel;
  const changerCouleurs = () => { paletteDansLUrl(palette()); sel.setPalette(palette()); publierEtat(); onChange(); };
  for (const c of ['#ffCouleur1', '#ffCouleur2']) $(c).addEventListener('input', changerCouleurs);
  for (const b of racine.querySelectorAll('.ff-preset')) b.addEventListener('click', () => { [$('#ffCouleur2').value, $('#ffCouleur1').value] = PALETTES[b.dataset.palette]; changerCouleurs(); });
  publier = devenirEcrivain({
    // une demande de l'animation (ses propres champs de couleur) : mêmes
    // champs, même URL, même publication que si le visiteur les avait réglés ici
    definirPalette: ([c0, c1]) => { $('#ffCouleur2').value = c0; $('#ffCouleur1').value = c1; changerCouleurs(); },
  });
  publierEtat();
  return { selecteur: sel, palette, setMasque: (m) => sel.setMasque(m) };
}

// Le pilote de fonds-ecran.html : le sélecteur seul. Ses échantillons de fond
// se dessinent sur un motif du corpus (Bases — Yang, h0), comme dans l'outil.
export async function monterPiloteBicolore(racine) {
  const { data, collection, calculs } = await chargerDonneesFond();
  const masque = lectureBinaire(grilleDuMotif(data, 'bases:yang', 0), slugDe('bases:yang', 0)).cases;
  return monterSelecteurBicolore(racine, { collection, calculs, masque });
}

export async function monterFondEcran(racine) {
  const { data, collection, calculs } = await chargerDonneesFond();
  const $ = (s) => racine.querySelector(s);
  const p = new URLSearchParams(location.search);
  const m = /^(.*)-h(\d+)$/.exec(p.get('motif') || '');
  let fam = (m && FAMILLES.find((f) => slugDe(f, 0).replace(/-h0$/, '') === m[1])) || 'bases:yang';
  let n = m ? Math.min(31, Math.max(0, Number(m[2]))) : 0;
  let grille = null, libre = null; // `libre` : une grille figée depuis l'animation, hors corpus

  $('#ffFamille').innerHTML = FAMILLES.map((f) => `<option value="${f}">${libelleFamille(f)}</option>`).join('');
  $('#ffHex').innerHTML = Array.from({ length: 32 }, (_, i) => `<option value="${i}">h${i}</option>`).join('');
  $('#ffFamille').value = fam; $('#ffHex').value = String(n);
  const densite = () => Number($('#ffDensite').value);

  let cases = null;
  const { selecteur: sel, palette } = monterSelecteurBicolore(racine, { collection, calculs, onChange: () => dessiner() });

  function lire() {
    grille = libre || grilleDuMotif(data, fam, n);
    try {
      cases = lectureBinaire(grille, libre ? 'motif figé' : slugDe(fam, n)).cases;
      $('#ffErreur').hidden = true;
    } catch (e) {
      cases = null;
      $('#ffErreur').hidden = false;
      $('#ffErreur').textContent = `La lecture binaire n'est pas définie pour ce motif : ${e.message}`;
    }
    if (cases) sel.setMasque(cases);
    // un motif figé hors corpus n'a pas d'adresse : il ne s'écrit pas dans l'URL
    const q = new URLSearchParams(location.search);
    if (libre) q.delete('motif'); else q.set('motif', slugDe(fam, n));
    history.replaceState(null, '', `${q.toString() ? `?${q}` : location.pathname}${location.hash}`);
  }
  function dessiner() {
    const apercu = $('#ffApercu');
    if (!cases) { apercu.innerHTML = ''; $('#ffDescription').textContent = ''; return; }
    const e = sel.etat();
    apercu.innerHTML = fondEcranSvg(cases, palette(), e.objetFond, { colonnes: densite(), prefixe: 'ff-', superposition: e.objetSuperposition });
    $('#ffDescription').innerHTML = `${libre ? 'motif figé' : `${libelleFamille(fam)}, h${n}`} — ${descriptionEtat(e, 'fr')}`;
  }
  const nomFichier = (ext, taille = '') => `fond-ecran-${libre ? 'motif' : slugDe(fam, n)}-${sel.etat().code.replace('+', '-')}${taille}.${ext}`;

  $('#ffFamille').addEventListener('change', () => { fam = $('#ffFamille').value; libre = null; lire(); dessiner(); });
  $('#ffHex').addEventListener('change', () => { n = Number($('#ffHex').value); libre = null; lire(); dessiner(); });
  $('#ffDensite').addEventListener('input', () => { $('#ffDensiteVal').textContent = String(densite()); dessiner(); });
  $('#ffSvg').addEventListener('click', () => {
    if (!cases) return;
    const e = sel.etat();
    telecharger(new Blob([fondEcranSvg(cases, palette(), e.objetFond, { colonnes: densite(), superposition: e.objetSuperposition })], { type: 'image/svg+xml' }), nomFichier('svg'));
  });
  for (const [l, h] of RESOLUTIONS) {
    $(`#ffPng${l}`).addEventListener('click', async () => {
      if (!cases) return;
      const e = sel.etat();
      telecharger(await svgEnPng(fondEcranSvg(cases, palette(), e.objetFond, { colonnes: densite(), largeur: l, hauteur: h, superposition: e.objetSuperposition }), l, h), nomFichier('png', `-${l}x${h}`));
    });
  }
  // Un motif « figé » depuis l'animation de fonds-ecran.html : un motif du
  // corpus arrive par son adresse (?motif=…) ; une grille hors corpus, qui n'a
  // pas d'adresse, par sessionStorage (clé motif-fige), lue une fois.
  try {
    const fige = sessionStorage.getItem('motif-fige');
    if (fige) { sessionStorage.removeItem('motif-fige'); libre = JSON.parse(fige); }
  } catch { /* stockage indisponible : le motif de l'URL */ }
  lire();
  dessiner();
  const api = { selecteur: sel, palette, etat: () => ({ fam, n, libre: !!libre, cases }), data, collection };
  return api;
}
