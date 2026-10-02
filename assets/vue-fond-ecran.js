// vue-fond-ecran.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le fond d'écran fixe, en vecteur (fonds-ecran.html) : un motif du corpus,
// sa lecture binaire (lecture-binaire.js), un fond de case choisi dans le
// sélecteur commun (selecteur-fonds.js) — et UNE sortie du moteur
// (fondEcranSvg, bicolore-fonds.js) : un SVG sans résolution, qui couvre
// 1920 × 1080, 2560 × 1440, la 4K et tout autre écran. Les PNG sont la même
// sortie rastérisée, chaque case sur un nombre entier de pixels.
//
// Le motif : choisi par famille et hexagramme (les 256 du corpus, la grille
// même des pages de motifs — grilleDuMotif), ou « figé » depuis l'animation
// (événement figer-motif) ; l'état part dans l'URL : ?motif=<slug>&fond=…

import { chargerCollection, fondEcranSvg } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { creerSelecteurFonds, descriptionEtat, etatDeLUrl, etatDansLUrl } from './selecteur-fonds.js';
import { svgEnPng, telecharger } from './vue-fond-motif.js';

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

export async function monterFondEcran(racine) {
  const [data, json, calculs] = await Promise.all(['../data/fonds_ecran_v1.json', '../data/fonds/collection-v1.json', '../data/fonds/collection-v1.calculs.json']
    .map((u) => fetch(new URL(u, import.meta.url)).then((r) => r.json())));
  const collection = chargerCollection(json, { calculs });
  const $ = (s) => racine.querySelector(s);
  const p = new URLSearchParams(location.search);
  const m = /^(.*)-h(\d+)$/.exec(p.get('motif') || '');
  let fam = (m && FAMILLES.find((f) => slugDe(f, 0).replace(/-h0$/, '') === m[1])) || 'bases:yang';
  let n = m ? Math.min(31, Math.max(0, Number(m[2]))) : 0;
  let grille = null, libre = null; // `libre` : une grille figée depuis l'animation, hors corpus

  $('#ffFamille').innerHTML = FAMILLES.map((f) => `<option value="${f}">${libelleFamille(f)}</option>`).join('');
  $('#ffHex').innerHTML = Array.from({ length: 32 }, (_, i) => `<option value="${i}">h${i}</option>`).join('');
  $('#ffFamille').value = fam; $('#ffHex').value = String(n);
  const palette = () => [$('#ffCouleur2').value, $('#ffCouleur1').value];
  const densite = () => Number($('#ffDensite').value);

  let cases = null;
  const sel = creerSelecteurFonds($('#ffSelecteur'), {
    collection, glyphes: calculs.glyphes, palette: palette(), lang: 'fr', etat: etatDeLUrl(collection.fonds),
    onChange: (e) => { etatDansLUrl(e); dessiner(); },
  });
  window.selecteurFonds = sel;

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
  for (const c of ['#ffCouleur1', '#ffCouleur2']) $(c).addEventListener('input', () => { sel.setPalette(palette()); dessiner(); });
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
  // « Figer ce motif » depuis l'animation : la grille affichée à l'écran.
  window.addEventListener('figer-motif', (ev) => {
    const { grid, fam: f, subA, subB, n: h } = ev.detail;
    if (subA === 'yang' && subB === 'yang_mut' && h < 32 && FAMILLES.includes(f)) {
      fam = f; n = h; libre = null; $('#ffFamille').value = fam; $('#ffHex').value = String(n);
    } else libre = grid;
    lire(); dessiner();
    racine.scrollIntoView({ behavior: 'smooth' });
  });
  lire();
  dessiner();
  return { selecteur: sel, etat: () => ({ fam, n, libre: !!libre, cases }) };
}
