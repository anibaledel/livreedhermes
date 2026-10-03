// outil-fond-ecran.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'OUTIL D'ANIMATION de fonds-ecran.html — choix d'une catégorie, plein
// écran, micro ou fichier audio, méditatif (rythme et fondu), Full Réactif,
// densité, pause, figer, réinitialiser, enregistrement (formats et durées).
//
// UN SEUL MOTEUR, MONTÉ DEUX FOIS sur la page, l'un sous l'autre :
//   monterOutilFondEcran(section, { rendu: 'tricolore', … })
//   monterOutilFondEcran(section, { rendu: 'bicolore', bicolore, … })
// Chaque montage a son propre état (canevas, barre, audio, densité, rythme,
// enregistrement) : en lancer un ne touche pas l'autre. Deux implémentations
// avaient produit, autrefois, deux jeux de données divergents : ce module est
// la seule.
//
// Ce qui diffère entre les deux montages, et rien d'autre :
//   - la couleur : trois couleurs et une teinte (tricolore) ; deux couleurs,
//     fond et figure, rouge et blanc par défaut, avec « Crème / encre »
//     (bicolore, assets/animation-bicolore.js : la tuile du moteur des pages) ;
//   - les motifs retenus : le tricolore écarte les motifs à « diagonale
//     sombre » (la plus sombre des trois couleurs), qui n'existe plus après
//     la lecture binaire — le bicolore retient les motifs de lecture définie ;
//   - la proximité du parcours : sur la grille à trois couleurs, ou sur la
//     lecture binaire (ce que le visiteur voit) ;
//   - Full Réactif : en tricolore, les basses font tourner la teinte et les
//     médiums changent de motif ; en bicolore, les médiums seulement — une
//     rotation de teinte ne se verrait pas sur du rouge et blanc.
// L'état de chaque montage dans l'URL a ses propres clés (densité, rythme,
// teinte) : ?densite, ?rythme, ?teinte pour le tricolore ; ?bdensite,
// ?brythme pour le bicolore (la collection et les couleurs : ?fond, ?sup,
// ?c0, ?c1, tenues par le sélecteur de la page).

const catLabel = { bases: 'Bases', par2: 'Par 2', par3: 'Par 3', par4: 'Par 4' };
const CATS = ['bases', 'par2', 'par3', 'par4'];
const DEFAULT_PALETTE = { V: '#662d91', M: '#ee2a7b', O: '#fbb040' };
// Teinte médiane par défaut du mode Monochrome du tricolore, calibrée sur mesure
// réelle des images sources de la charte Unified Patterns — distincte de
// DEFAULT_PALETTE.O, la teinte « O » du mode Multicolore d'origine.
const DEFAULT_MONO_HUE = '#db694c';
const DENSITE_DEFAUT = 4, RYTHME_DEFAUT = 8;

// --- couleurs (tricolore) ---
function hexToRgb(hex) { hex = hex.replace('#', ''); return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)]; }
function rgbToHex(r, g, b) { const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); return '#' + c(r) + c(g) + c(b); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h, s; const l = (mx + mn) / 2;
  if (mx === mn) { h = s = 0; } else {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; }
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}
function adjustLightness(hex, delta) { const [r, g, b] = hexToRgb(hex); const [h, s, l] = rgbToHsl(r, g, b); return rgbToHex(...hslToRgb(h, s, Math.max(0, Math.min(1, l + delta)))); }
function hueOf(hex) { return rgbToHsl(...hexToRgb(hex))[0]; }
function rotateHue(hex, d) { const [h, s, l] = rgbToHsl(...hexToRgb(hex)); return rgbToHex(...hslToRgb((h + d + 1) % 1, s, l)); }

// --- motifs ---
function hexagramGrid(layerOf, n, gridA, gridB) {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  return layerOf.map((ligne, r) => ligne.map((pos, c) => (traits[pos - 1] === 1 ? gridA[r][c] : gridB[r][c])));
}
// Exclu de l'animation tricolore : les motifs dont les deux diagonales sont
// entièrement dans la teinte la plus sombre des trois (M) — la diagonale pleine
// écrase l'effet miroir entre les formes. Sans objet en bicolore.
function hasDarkDiagonal(grid) { for (let i = 0; i < 12; i++) if (grid[i][i] !== 'M' || grid[i][11 - i] !== 'M') return false; return true; }
function gridDistance(a, b) { let d = 0; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (a[r][c] !== b[r][c]) d++; return d; }
const paireNumberFor = (n) => (n < 32 ? n + 1 : 64 - n);

// --- le gabarit d'un montage : cartes, aide, et l'écran plein ---
function gabarit(rendu) {
  const bi = rendu === 'bicolore';
  const couleurs = bi
    ? `<span class="hud-couleurs" style="display:inline-flex; align-items:center; gap:6px;">
        <label class="hud-label">Fond <input type="color" data-r="c0" title="Couleur du fond (bit 0)"></label>
        <label class="hud-label">Figure <input type="color" data-r="c1" title="Couleur de la figure (bit 1)"></label>
        <button type="button" class="anim-preset" data-palette="bicolore">Rouge / blanc</button>
        <button type="button" class="anim-preset" data-palette="creme">Crème / encre</button>
        <button type="button" class="anim-preset" data-palette="monochrome">Monochrome</button>
      </span>`
    : `<span class="hud-couleurs" style="display:inline-flex; align-items:center; gap:6px;">
        <button data-r="btnMode">Multicolore</button>
        <input type="color" data-r="tintPicker" value="${DEFAULT_MONO_HUE}" title="Choisir une teinte">
      </span>`;
  // l'aide, sous les cartes : le texte du tricolore est celui de la page d'origine
  const aide = bi ? [
    '🎤 <b>Micro</b> — le pavage change au rythme du son ambiant réellement entendu.',
    '📁 <b>Fichier audio</b> — même principe, avec un morceau que vous proposez vous-même.',
    '🧘 <b>Méditatif</b> — aucun son requis ; un rythme régulier et réglable (de 0,5 à 30 secondes) fait défiler les motifs en fondu doux.',
    '🌈 <b>Full Réactif</b> — avec micro ou fichier audio actif : les médiums pilotent le changement de motif, en continu. Pas de teinte sur les basses : deux couleurs n\'ont pas de teinte à faire tourner.',
    '⏸ <b>Pause</b> — fige le motif en cours et affiche le numéro de l\'hexagramme, le texte de sa paire et la collection.',
    '🎨 <b>Couleurs</b> — le fond et la figure : rouge et blanc par défaut, « Crème / encre » ou « Monochrome » d\'un clic ; la collection se choisit ci-dessus.',
    '▦ <b>Densité</b> — ajuste la taille des motifs, du grand format par défaut jusqu\'au format resserré utilisé sur la page Tirage.',
    '🖼 <b>Figer</b> — reprend le motif à l\'écran dans le fond d\'écran fixe, en vecteur, sur la galerie bicolore.',
    '🎬 <b>Enregistrer</b> — une vidéo MP4 (H.264), lisible sur tous les téléphones, en 9:16 (1080 × 1920), 1:1 ou au format de l\'écran ; le nom du fichier porte le code de la collection. Si le navigateur n\'encode pas le H.264 (Firefox, Chromium), l\'enregistrement est refusé — utilisez Google Chrome (version 126 ou plus) ou Safari.',
  ] : [
    '🎤 <b>Micro</b> — le pavage change au rythme du son ambiant réellement entendu.',
    '📁 <b>Fichier audio</b> — même principe, avec un morceau que vous proposez vous-même.',
    '🧘 <b>Méditatif</b> — aucun son requis ; un rythme régulier et réglable (de 0,5 à 30 secondes) fait défiler les motifs en fondu doux.',
    '🌈 <b>Full Réactif</b> — avec micro ou fichier audio actif : les basses pilotent la teinte, les médiums le changement de motif — en continu, sans réglage manuel. La densité du pavage reste fixe, réglable via le paramètre Densité.',
    '⏸ <b>Pause</b> — fige le motif en cours et affiche le numéro de l\'hexagramme ainsi que le texte de la paire à laquelle il appartient.',
    '🎨 <b>Teinte</b> — bascule entre deux réglages : « Monochrome » (par défaut) dérive tout depuis une seule teinte médiane, les deux autres nuances étant calculées automatiquement à ±20% de luminosité ; « Multicolore » fait tourner la palette d\'origine (3 teintes distinctes) autour de la couleur choisie.',
    '▦ <b>Densité</b> — ajuste la taille des motifs, du grand format par défaut jusqu\'au format resserré utilisé sur la page Tirage.',
    '🖼 <b>Figer</b> — reprend le motif à l\'écran dans le fond d\'écran fixe, en vecteur, sur la galerie bicolore.',
    '🎬 <b>Enregistrer</b> — une vidéo MP4 (H.264), lisible sur tous les téléphones, en 9:16 (1080 × 1920), 1:1 ou au format de l\'écran. Si le navigateur n\'encode pas le H.264 (Firefox, Chromium), l\'enregistrement est refusé — utilisez Google Chrome (version 126 ou plus) ou Safari.',
  ];
  return `
  <div class="cat-grid" data-r="catGrid"></div>
  <div class="mod-options">
    <strong>Options de modulation, une fois la catégorie choisie :</strong>
    ${aide.map((l) => `<div>${l}</div>`).join('\n    ')}
  </div>
  <div class="fe-stage" data-r="stage">
    <canvas data-r="canvas" role="img" aria-label="Fond d'écran ${bi ? 'bicolore' : 'tricolore'} animé"></canvas>
    <div class="fe-pause" data-r="pauseInfo"><div class="hex"></div><div class="keyword"></div><div class="text"></div></div>
    <div class="fe-hud">
      <div class="left">
        <button data-r="btnMic">🎤 Micro</button>
        <button data-r="btnFile">📁 Fichier audio</button>
        <button data-r="btnMeditative">🧘 Méditatif</button>
        <span data-r="rhythmWrap" style="display:none; align-items:center; gap:6px;">
          <input type="range" data-r="rhythmSlider" min="0.5" max="30" step="0.5" value="8" style="width:90px;" aria-label="Rythme du mode méditatif (secondes)">
          <span data-r="rhythmLabel" class="hud-label">8 s</span>
        </span>
        ${couleurs}
        <span style="display:inline-flex; align-items:center; gap:6px;">
          <span class="hud-label">Densité</span>
          <input type="range" data-r="sizeSlider" aria-label="Densité" min="4" max="32" step="1" value="4" style="width:90px;">
        </span>
        <button data-r="btnReset">↺ Réinitialiser</button>
        <button data-r="btnFullReactive" title="${bi ? 'Médiums→motif' : 'Basses→teinte, médiums→motif'}">🌈 Full Réactif</button>
        <button data-r="btnPause">⏸ Pause</button>
        <button data-r="btnFiger" title="Reprendre ce motif dans le fond d'écran fixe, en vecteur — sur la galerie bicolore">🖼 Figer</button>
        <span style="display:inline-flex; align-items:center; gap:6px;">
          <select data-r="recordRatio" title="Ratio d'export vidéo">
            <option value="916">9:16 (vertical)</option>
            <option value="11">1:1 (carré)</option>
            <option value="native">Natif (écran)</option>
          </select>
          <select data-r="recordDuration" title="Durée d'enregistrement">
            <option value="manual">Manuel</option>
            <option value="15">15 s</option>
            <option value="30">30 s</option>
            <option value="60">60 s</option>
          </select>
          <button data-r="btnRecord" title="Enregistre le pavage animé et le son en cours en vidéo">🎬 Enregistrer</button>
          <span data-r="formatVideo" class="format-video" aria-live="polite"></span>
        </span>
        <div class="fe-level"><div class="fe-level-fill" data-r="levelFill"></div></div>
      </div>
      <button data-r="btnExit">✕ Quitter</button>
    </div>
    <input type="file" class="fe-file" data-r="fileInput" accept="audio/*">
    <audio data-r="audioEl" loop></audio>
    <div class="fe-notice" data-r="stageNotice"></div>
  </div>`;
}

// Le format des vidéos : MP4 en H.264, lisible partout — et rien d'autre ; s'il
// manque au navigateur, l'enregistrement est refusé, annoncé dans la barre.
const FORMATS_VIDEO = {
  avecSon: ['video/mp4;codecs="avc1.640028,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E,opus"'],
  sansSon: ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1'],
};
function pickRecorderMimeType(hasAudio) {
  for (const type of hasAudio ? FORMATS_VIDEO.avecSon.concat(FORMATS_VIDEO.sansSon) : FORMATS_VIDEO.sansSon) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}
const formatVideoDisponible = () => !!(window.MediaRecorder && pickRecorderMimeType(false));
function coverDraw(destCtx, destW, destH, source) {
  const sw = source.width, sh = source.height;
  if (!sw || !sh) return;
  const srcRatio = sw / sh, destRatio = destW / destH;
  let cropW, cropH, cropX, cropY;
  if (srcRatio > destRatio) { cropH = sh; cropW = sh * destRatio; cropX = (sw - cropW) / 2; cropY = 0; } else { cropW = sw; cropH = sw / destRatio; cropX = 0; cropY = (sh - cropH) / 2; }
  destCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, destW, destH);
}

/**
 * Monte un outil d'animation dans `section`.
 * @param {HTMLElement} section
 * @param {{ rendu: 'tricolore'|'bicolore', source: Promise<object>, paires: object,
 *           bicolore?: object, palettes?: object, page?: HTMLElement, figer?: Function }} options
 *   source : data/fonds_ecran_v1.json (promesse) ; paires : les 32 paires (texte de la pause) ;
 *   bicolore : l'API de assets/animation-bicolore.js (rendu bicolore) ;
 *   palettes : PALETTES de assets/couleurs.js (boutons de la barre bicolore) ;
 *   page : l'élément masqué pendant le plein écran ;
 *   figer : fonction appelée par « Figer » avec le motif à l'écran (sans elle, pas de bouton).
 */
export function monterOutilFondEcran(section, { rendu, source, paires, bicolore = null, palettes = {}, page = null, figer = null }) {
  const BI = rendu === 'bicolore';
  const bico = bicolore;
  section.insertAdjacentHTML('beforeend', gabarit(rendu));
  const $ = (r) => section.querySelector(`[data-r="${r}"]`);
  const stage = $('stage');
  document.body.appendChild(stage); // l'écran plein, hors de tout cadre transformé
  const $s = (r) => stage.querySelector(`[data-r="${r}"]`);
  const canvas = $s('canvas'), ctx = canvas.getContext('2d');
  const audioEl = $s('audioEl'), pauseInfo = $s('pauseInfo'), levelFill = $s('levelFill');
  const CLES = BI ? { densite: 'bdensite', rythme: 'brythme' } : { densite: 'densite', rythme: 'rythme', teinte: 'teinte' };

  let SOURCE = null;
  let PALETTE = { ...DEFAULT_PALETTE };
  let colorMode = 'mono';
  let currentGrids = [], currentGrid = null, currentIndex = -1, visited = new Set();
  let audioCtx, analyser, dataArray, sourceNode;
  let runningAvgBass = 0, runningAvgTreble = 0, runningAvgMid = 0, smoothedTrebleBalance = 0, lastBeat = 0;
  let fullReactive = false, baseTintForReactive = DEFAULT_PALETTE.O;
  let meditativeTimer = null, meditativeActive = false, paused = false, enCours = false;
  let tileDivisor = DENSITE_DEFAUT;
  let apercus = [];
  const catGridsCache = {};

  // --- la vue dans l'URL (clés propres à ce montage) ---
  function vueDeLUrl() {
    const q = new URLSearchParams(location.search);
    const d = parseInt(q.get(CLES.densite), 10), r = parseFloat(q.get(CLES.rythme));
    return { densite: d >= 4 && d <= 32 ? d : DENSITE_DEFAUT, rythme: r >= 0.5 && r <= 30 && Math.round(r * 2) === r * 2 ? r : RYTHME_DEFAUT };
  }
  function vueDansLUrl() {
    const q = new URLSearchParams(location.search);
    if (tileDivisor !== DENSITE_DEFAUT) q.set(CLES.densite, String(tileDivisor)); else q.delete(CLES.densite);
    const r = parseFloat($s('rhythmSlider').value);
    if (r !== RYTHME_DEFAUT) q.set(CLES.rythme, String(r)); else q.delete(CLES.rythme);
    if (CLES.teinte) { if (colorMode === 'multi') q.set(CLES.teinte, 'multi'); else q.delete(CLES.teinte); }
    history.replaceState(null, '', (q.toString() ? '?' + q : location.pathname) + location.hash);
  }
  {
    const v = vueDeLUrl();
    tileDivisor = v.densite;
    $s('sizeSlider').value = String(v.densite);
    $s('rhythmSlider').value = String(v.rythme);
    $s('rhythmLabel').textContent = v.rythme + ' s';
    if (CLES.teinte && new URLSearchParams(location.search).get(CLES.teinte) === 'multi') colorMode = 'multi';
  }

  // --- couleurs ---
  function applyTintRotation(picked) {
    const d = hueOf(picked) - hueOf(DEFAULT_PALETTE.O);
    PALETTE = { V: rotateHue(DEFAULT_PALETTE.V, d), M: rotateHue(DEFAULT_PALETTE.M, d), O: rotateHue(DEFAULT_PALETTE.O, d) };
  }
  function applySingleHue(picked) { PALETTE = { V: adjustLightness(picked, +0.20), M: adjustLightness(picked, -0.20), O: picked }; }
  function refreshPalette() {
    if (!BI) { const picked = $s('tintPicker').value; if (colorMode === 'multi') applyTintRotation(picked); else applySingleHue(picked); }
    if (currentGrid) drawTessellation(currentGrid);
  }
  function appliquerTeinte() {
    if (BI) return;
    $s('btnMode').textContent = colorMode === 'mono' ? 'Multicolore' : 'Monochrome';
    $s('btnMode').classList.toggle('active', colorMode === 'multi');
  }
  appliquerTeinte();

  // --- les motifs d'une catégorie ---
  function buildGridsFor(cat) {
    const D = SOURCE;
    if (!D) return [];
    const entries = cat === 'par4' ? D.entries : D.entries.filter((e) => e[0].split(':')[0] === cat);
    // une même grille revient sous deux identifiants : en Par 4, elle ne compte qu'une fois
    const vues = new Set();
    return entries
      .map(([fam, subA, subB, n]) => ({ grid: hexagramGrid(D.layerOf, n, D.families[fam][subA], D.families[fam][subB]), fam, subA, subB, n }))
      .filter(({ grid }) => { const k = JSON.stringify(grid); if (vues.has(k)) return false; vues.add(k); return true; })
      .filter(({ grid }) => (BI ? bico.lisible(grid) : !hasDarkDiagonal(grid)));
  }
  function drawStaticTile(cv, grid, size) {
    cv.width = size; cv.height = size;
    const c = cv.getContext('2d'), cell = size / 12;
    for (let r = 0; r < 12; r++) for (let k = 0; k < 12; k++) { c.fillStyle = PALETTE[grid[r][k]]; c.fillRect(k * cell, r * cell, cell + 0.6, cell + 0.6); }
  }
  function drawApercu(cv, grid) {
    if (!BI) { drawStaticTile(cv, grid, 150); return; }
    cv.width = 150; cv.height = 150;
    const c = cv.getContext('2d'), t = bico.tuile(grid, 150);
    if (t) c.drawImage(t, 0, 0, 150, 150); else { c.fillStyle = bico.couleurFond(); c.fillRect(0, 0, 150, 150); }
  }
  function construireCartes() {
    const grille = $('catGrid');
    grille.innerHTML = '';
    apercus = [];
    for (const cat of CATS) {
      const grids = buildGridsFor(cat);
      catGridsCache[cat] = grids;
      const card = document.createElement('div');
      card.className = 'cat-card' + (grids.length === 0 ? ' disabled' : '');
      card.dataset.cat = cat;
      const preview = document.createElement('canvas');
      preview.setAttribute('aria-hidden', 'true');
      card.appendChild(preview);
      const label = document.createElement('div'); label.className = 'label'; label.textContent = catLabel[cat];
      const count = document.createElement('div'); count.className = 'count'; count.textContent = grids.length + ' motifs';
      card.append(label, count);
      if (grids.length > 0) { apercus.push([preview, grids[0].grid]); drawApercu(preview, grids[0].grid); card.onclick = () => launch(cat, grids); }
      grille.appendChild(card);
    }
  }

  // --- le dessin ---
  const tileBuffer = document.createElement('canvas'), tileBufferCtx = tileBuffer.getContext('2d');
  function drawTessellationOn(target, grid) {
    const w = canvas.width, h = canvas.height;
    // le plus PETIT côté : un minimum de répétitions même sur les ratios extrêmes
    const tileSize = Math.min(w, h) / tileDivisor, cell = tileSize / 12;
    const cols = Math.ceil(w / tileSize) + 1, rows = Math.ceil(h / tileSize) + 1;
    const tilePx = Math.max(1, Math.ceil(tileSize));
    if (BI) {
      // la tuile du moteur (lecture binaire, fond, couleurs), pavée bord à bord
      const t = bico.tuile(grid, tilePx);
      target.fillStyle = bico.couleurFond();
      target.fillRect(0, 0, w, h);
      if (!t) return;
      for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
        const x = Math.floor(tx * tileSize), y = Math.floor(ty * tileSize);
        target.drawImage(t, x, y, Math.floor((tx + 1) * tileSize) - x + 1, Math.floor((ty + 1) * tileSize) - y + 1);
      }
      return;
    }
    // tuile en cache, dessinée une fois puis reproduite (pas 40 000 fillRect par cycle)
    tileBuffer.width = tilePx; tileBuffer.height = tilePx;
    const scale = tilePx / tileSize;
    for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
      tileBufferCtx.fillStyle = PALETTE[grid[r][c]];
      tileBufferCtx.fillRect(c * cell * scale, r * cell * scale, (cell + 0.7) * scale, (cell + 0.7) * scale);
    }
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) target.drawImage(tileBuffer, tx * tileSize, ty * tileSize, tileSize, tileSize);
  }
  const drawTessellation = (grid) => drawTessellationOn(ctx, grid);
  function resizeCanvas() {
    if (!enCours) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    if (currentGrid) drawTessellation(currentGrid);
  }
  window.addEventListener('resize', resizeCanvas);

  // le motif suivant : le plus proche, parmi ceux pas encore vus dans ce cycle
  function pickNextByProximity() {
    if (currentIndex === -1) {
      currentIndex = Math.floor(Math.random() * currentGrids.length);
      visited = new Set([currentIndex]);
      currentGrid = currentGrids[currentIndex].grid;
      return;
    }
    let candidates = currentGrids.map((g, i) => i).filter((i) => !visited.has(i));
    if (candidates.length === 0) { visited = new Set([currentIndex]); candidates = currentGrids.map((g, i) => i).filter((i) => !visited.has(i)); }
    const distance = BI ? bico.distance : gridDistance;
    let best = candidates[0], bestDist = Infinity;
    for (const i of candidates) { const d = distance(currentGrid, currentGrids[i].grid); if (d < bestDist) { bestDist = d; best = i; } }
    currentIndex = best; visited.add(best); currentGrid = currentGrids[best].grid;
  }
  const offscreen = document.createElement('canvas'), offCtx = offscreen.getContext('2d');
  let fadeRAF = null;
  function crossfadeTo(grid, durationMs) {
    if (!durationMs) { drawTessellation(grid); return; }
    offscreen.width = canvas.width; offscreen.height = canvas.height;
    const prev = document.createElement('canvas');
    prev.width = canvas.width; prev.height = canvas.height;
    prev.getContext('2d').drawImage(canvas, 0, 0);
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    drawTessellationOn(offCtx, grid);
    if (fadeRAF) cancelAnimationFrame(fadeRAF);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      ctx.drawImage(prev, 0, 0); ctx.globalAlpha = t; ctx.drawImage(offscreen, 0, 0); ctx.globalAlpha = 1;
      if (t < 1) fadeRAF = requestAnimationFrame(step);
    };
    fadeRAF = requestAnimationFrame(step);
  }
  function showNextGrid(fadeMs) { pickNextByProximity(); crossfadeTo(currentGrid, fadeMs); }

  // --- messages de l'écran plein ---
  const stageNotice = $s('stageNotice');
  let stageNoticeTimer = null;
  function showStageNotice(msg, ms) {
    stageNotice.textContent = msg;
    stageNotice.classList.add('visible');
    if (stageNoticeTimer) clearTimeout(stageNoticeTimer);
    stageNoticeTimer = setTimeout(() => stageNotice.classList.remove('visible'), ms || 4000);
  }
  function requestStageFullscreen() {
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!req) { showStageNotice('Plein écran non disponible sur ce navigateur — le pavage reste affiché dans la fenêtre.'); return; }
    req.call(stage).catch(() => showStageNotice('Plein écran refusé ou indisponible — le pavage reste affiché dans la fenêtre.'));
  }

  // --- méditatif ---
  function stopMeditative() {
    if (meditativeTimer) { clearInterval(meditativeTimer); meditativeTimer = null; }
    meditativeActive = false;
    $s('btnMeditative').classList.remove('active');
    $s('rhythmWrap').style.display = 'none';
  }
  function restartMeditativeTimer() {
    if (meditativeTimer) clearInterval(meditativeTimer);
    const seconds = parseFloat($s('rhythmSlider').value);
    // un fondu plafonné : il ne chevauche jamais le battement suivant
    const fadeMs = Math.min(1400, seconds * 1000 * 0.6);
    meditativeTimer = setInterval(() => { if (!paused) showNextGrid(fadeMs); }, seconds * 1000);
  }
  function startMeditative() {
    stopAudio();
    meditativeActive = true;
    $s('btnMeditative').classList.add('active');
    $s('rhythmWrap').style.display = 'inline-flex';
    restartMeditativeTimer();
  }

  // --- lancer, quitter ---
  function launch(cat, grids) {
    currentGrids = grids; currentIndex = -1; visited = new Set(); paused = false;
    $s('btnPause').textContent = '⏸ Pause'; $s('btnPause').classList.remove('active');
    pauseInfo.classList.remove('visible');
    fullReactive = false; $s('btnFullReactive').classList.remove('active');
    if (page) page.style.display = 'none';
    stage.style.display = 'block';
    enCours = true;
    resizeCanvas();
    if (BI) bico.preparer(grids.map((g) => g.grid), Math.max(1, Math.ceil(Math.min(canvas.width, canvas.height) / tileDivisor)));
    refreshPalette();
    showNextGrid();
    requestStageFullscreen();
    requestAnimationFrame(loop);
  }
  function quitter() {
    if (document.fullscreenElement) document.exitFullscreen();
    stopAudio(); stopMeditative();
    paused = false; enCours = false;
    pauseInfo.classList.remove('visible');
    stage.style.display = 'none';
    if (page) page.style.display = 'block';
  }
  $s('btnExit').onclick = quitter;

  // « Figer » : le motif à l'écran part ailleurs — où, c'est la page qui le dit
  // (option `figer`, qui reçoit le motif : { grid, fam, subA, subB, n }).
  // Sans `figer`, le bouton n'est pas proposé.
  if (!figer) $s('btnFiger').hidden = true;
  $s('btnFiger').onclick = () => {
    if (!figer || currentIndex < 0 || !currentGrids[currentIndex]) return;
    const m = currentGrids[currentIndex];
    quitter();
    figer(m);
  };

  // --- audio ---
  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
  }
  function stopAudio() { if (sourceNode) { try { sourceNode.disconnect(); } catch { /* déjà déconnecté */ } sourceNode = null; } audioEl.pause(); }
  $s('btnMic').onclick = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showStageNotice("Le microphone n'est pas accessible sur ce navigateur (souvent le cas hors HTTPS). Utilisez plutôt un fichier audio ou le mode méditatif.", 6000);
      return;
    }
    stopMeditative(); ensureAudioContext(); stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    } catch (e) { showStageNotice('Micro indisponible : ' + e.message, 5000); }
  };
  $s('btnFile').onclick = () => { stopMeditative(); $s('fileInput').click(); };
  $s('btnMeditative').onclick = () => (meditativeActive ? stopMeditative() : startMeditative());
  $s('rhythmSlider').oninput = (e) => { $s('rhythmLabel').textContent = e.target.value + ' s'; vueDansLUrl(); if (meditativeActive) restartMeditativeTimer(); };
  $s('fileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    ensureAudioContext(); stopAudio();
    audioEl.src = URL.createObjectURL(file);
    audioEl.play();
    sourceNode = audioCtx.createMediaElementSource(audioEl);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  };

  // --- enregistrement (MediaRecorder sur le canevas, le son en cours en parallèle) ---
  let mediaStreamDest = null, analyserRoutedToRecorder = false, mediaRecorder = null, recordedChunks = [];
  let recordCompositeRAF = null, recordAutoStopTimer = null;
  function connectCurrentAudioToRecorder() {
    if (!analyser || !sourceNode) return false;
    ensureAudioContext();
    if (!mediaStreamDest) mediaStreamDest = audioCtx.createMediaStreamDestination();
    if (!analyserRoutedToRecorder) { try { analyser.connect(mediaStreamDest); analyserRoutedToRecorder = true; } catch { /* sans son */ } }
    return analyserRoutedToRecorder;
  }
  {
    const el = $s('formatVideo');
    if (formatVideoDisponible()) { el.textContent = 'MP4 · H.264'; el.classList.remove('indisponible'); }
    else { el.textContent = 'MP4 H.264 indisponible sur ce navigateur'; el.classList.add('indisponible'); el.title = "Ce navigateur n'encode pas le H.264 : utilisez Google Chrome (version 126 ou plus) ou Safari."; }
  }
  const stopCompositeLoop = () => { if (recordCompositeRAF) { cancelAnimationFrame(recordCompositeRAF); recordCompositeRAF = null; } };
  function setRecordingUI(on) {
    const btn = $s('btnRecord');
    btn.textContent = on ? '⏹ Arrêter' : '🎬 Enregistrer';
    btn.classList.toggle('active', on);
    $s('recordRatio').disabled = on; $s('recordDuration').disabled = on;
  }
  function startRecording() {
    if (!currentGrid) { showStageNotice("Choisissez d'abord une catégorie de motifs.", 4000); return; }
    if (!window.MediaRecorder || !canvas.captureStream) { showStageNotice("L'enregistrement vidéo n'est pas supporté par ce navigateur.", 5000); return; }
    if (!formatVideoDisponible()) {
      showStageNotice("Enregistrement refusé : ce navigateur n'encode pas la vidéo en MP4 H.264, le seul format que les réseaux lisent partout. Utilisez Google Chrome (version 126 ou plus) ou Safari.", 7000);
      return;
    }
    const ratio = $s('recordRatio').value;
    let captureSource;
    if (ratio === 'native') captureSource = canvas;
    else {
      const W = 1080, H = ratio === '916' ? 1920 : 1080;
      const exp = document.createElement('canvas'); exp.width = W; exp.height = H;
      const ex = exp.getContext('2d');
      captureSource = exp;
      const frame = () => { coverDraw(ex, W, H, canvas); recordCompositeRAF = requestAnimationFrame(frame); };
      frame();
    }
    const videoStream = captureSource.captureStream(30);
    const combined = new MediaStream();
    videoStream.getVideoTracks().forEach((t) => combined.addTrack(t));
    const hasAudio = connectCurrentAudioToRecorder();
    if (hasAudio) mediaStreamDest.stream.getAudioTracks().forEach((t) => combined.addTrack(t));
    const mimeType = pickRecorderMimeType(hasAudio);
    recordedChunks = [];
    try { mediaRecorder = mimeType ? new MediaRecorder(combined, { mimeType }) : new MediaRecorder(combined); } catch (e) {
      showStageNotice("Impossible de démarrer l'enregistrement : " + e.message, 5000); stopCompositeLoop(); return;
    }
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stopCompositeLoop();
      videoStream.getTracks().forEach((t) => t.stop());
      const usedType = mediaRecorder.mimeType || mimeType;
      window.derniereVideo = { mimeType: usedType, rendu };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(recordedChunks, { type: usedType }));
      // le code de la collection dans le nom : une vidéo ne se confond pas avec une autre
      const nom = BI ? bico.code().replace('+', '-') : 'tricolore';
      a.download = `fond-ecran-${nom}-${ratio === 'native' ? 'natif' : ratio === '916' ? '1080x1920' : '1080x1080'}-${Date.now()}.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showStageNotice('Vidéo enregistrée (MP4).', 5000);
      setRecordingUI(false);
    };
    mediaRecorder.start();
    setRecordingUI(true);
    showStageNotice('Enregistrement en cours…', 3000);
    const duree = $s('recordDuration').value;
    if (duree !== 'manual') recordAutoStopTimer = setTimeout(stopRecording, parseInt(duree, 10) * 1000);
  }
  function stopRecording() {
    if (recordAutoStopTimer) { clearTimeout(recordAutoStopTimer); recordAutoStopTimer = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }
  $s('btnRecord').onclick = () => (mediaRecorder && mediaRecorder.state === 'recording' ? stopRecording() : startRecording());

  // --- couleur, densité, Full Réactif, pause, réinitialiser ---
  if (BI) {
    const c0 = $s('c0'), c1 = $s('c1');
    const demander = () => bico.definirPalette([c0.value, c1.value]);
    c0.addEventListener('input', demander);
    c1.addEventListener('input', demander);
    for (const b of stage.querySelectorAll('.anim-preset')) b.addEventListener('click', () => bico.definirPalette([...palettes[b.dataset.palette]]));
  } else {
    $s('btnMode').onclick = () => { colorMode = colorMode === 'mono' ? 'multi' : 'mono'; appliquerTeinte(); vueDansLUrl(); refreshPalette(); };
    $s('tintPicker').oninput = refreshPalette;
  }
  $s('sizeSlider').oninput = (e) => { tileDivisor = parseInt(e.target.value, 10); vueDansLUrl(); if (currentGrid) drawTessellation(currentGrid); };
  $s('btnFullReactive').onclick = (e) => {
    fullReactive = !fullReactive;
    e.target.classList.toggle('active', fullReactive);
    if (fullReactive) { if (!BI) baseTintForReactive = $s('tintPicker').value; } else { refreshPalette(); }
  };
  $s('btnPause').onclick = (e) => {
    paused = !paused;
    e.target.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
    e.target.classList.toggle('active', paused);
    if (paused && currentIndex !== -1) {
      const entry = currentGrids[currentIndex], pn = paireNumberFor(entry.n), pair = paires[pn];
      pauseInfo.querySelector('.hex').textContent = 'Hexagramme N°' + entry.n + ' — Paire ' + pn + (BI ? ' · Collection ' + bico.code() : '');
      pauseInfo.querySelector('.keyword').textContent = pair.keyword;
      pauseInfo.querySelector('.text').textContent = pair.text;
      pauseInfo.classList.add('visible');
    } else pauseInfo.classList.remove('visible');
  };
  $s('btnReset').onclick = () => {
    if (!BI) { colorMode = 'mono'; appliquerTeinte(); $s('tintPicker').value = DEFAULT_MONO_HUE; }
    tileDivisor = DENSITE_DEFAUT;
    $s('sizeSlider').value = DENSITE_DEFAUT;
    $s('rhythmSlider').value = RYTHME_DEFAUT;
    $s('rhythmLabel').textContent = RYTHME_DEFAUT + ' s';
    if (meditativeActive) restartMeditativeTimer();
    vueDansLUrl();
    if (BI) bico.reinitialiserCouleurs(); // rouge et blanc (assets/couleurs.js), demandé au sélecteur
    refreshPalette();
  };

  // --- la boucle audio-réactive ---
  function loop() {
    if (!enCours) return;
    try {
      if (analyser && !paused) {
        analyser.getByteFrequencyData(dataArray);
        const n = dataArray.length, bassEnd = Math.floor(n * 0.25), midEnd = Math.floor(n * 0.65);
        let s = 0; for (let i = 0; i < bassEnd; i++) s += dataArray[i];
        const bassLevel = s / bassEnd / 255;
        s = 0; for (let i = bassEnd; i < midEnd; i++) s += dataArray[i];
        const midLevel = s / (midEnd - bassEnd) / 255;
        s = 0; for (let i = midEnd; i < n; i++) s += dataArray[i];
        const trebleLevel = s / (n - midEnd) / 255;
        levelFill.style.width = (Math.max(bassLevel, midLevel, trebleLevel) * 100).toFixed(0) + '%';
        const now = performance.now();
        if (fullReactive) {
          if (!BI) {
            // BASSES -> teinte : l'équilibre grave / moins grave dans la bande des basses
            const bassMid = Math.floor(bassEnd / 2);
            let low = 0, high = 0;
            for (let i = 0; i < bassMid; i++) low += dataArray[i];
            for (let i = bassMid; i < bassEnd; i++) high += dataArray[i];
            const balance = low + high > 0 ? (high - low) / (low + high) : 0;
            smoothedTrebleBalance = smoothedTrebleBalance * 0.8 + balance * 0.2;
            const shifted = rotateHue(baseTintForReactive, smoothedTrebleBalance * 0.15);
            if (colorMode === 'multi') applyTintRotation(shifted); else applySingleHue(shifted);
          }
          // MÉDIUMS -> changement de motif
          runningAvgMid = runningAvgMid * 0.88 + midLevel * 0.12;
          if (midLevel > runningAvgMid * 1.15 && midLevel > 0.05 && now - lastBeat > 140) { lastBeat = now; pickNextByProximity(); }
          if (currentGrid) drawTessellation(currentGrid);
        } else {
          runningAvgBass = runningAvgBass * 0.82 + bassLevel * 0.18;
          runningAvgTreble = runningAvgTreble * 0.65 + trebleLevel * 0.35;
          const bassHit = bassLevel > runningAvgBass * 1.10 && bassLevel > 0.045;
          const trebleHit = trebleLevel > runningAvgTreble * 1.08 && trebleLevel > 0.018;
          if ((bassHit || trebleHit) && now - lastBeat > 90) { lastBeat = now; showNextGrid(); }
        }
      }
    } catch (err) { console.error('Erreur dans la boucle audio-réactive :', err); }
    requestAnimationFrame(loop);
  }

  const api = {
    rendu,
    section,
    stage,
    // l'état de ce montage, lu par les contrôles
    etat: () => ({ rendu, enCours, densite: tileDivisor, rythme: parseFloat($s('rhythmSlider').value), teinte: BI ? null : colorMode,
      palette: BI ? bico.palette() : { ...PALETTE }, motif: currentIndex >= 0 ? currentGrids[currentIndex] : null,
      paused, meditatif: meditativeActive, fullReactive, audio: !!sourceNode, enregistrement: !!(mediaRecorder && mediaRecorder.state === 'recording') }),
    grilleCourante: () => currentGrid,
    construireCartes,
    // une tuile bicolore vient d'être prête : la redessiner là où elle sert
    tuilePrete(grid) {
      for (const [cv, g] of apercus) if (g === grid) drawApercu(cv, g);
      if (grid === currentGrid && enCours) drawTessellation(currentGrid);
    },
    distance: (a, b) => (BI ? bico.distance(a, b) : gridDistance(a, b)),
    quitter,
    // poignées de VÉRIFICATION (tools/check_fond_ecran_animation.mjs) — pas une source d'état
    source: () => SOURCE,
    grilles: (cat) => buildGridsFor(cat),
    candidats: () => currentGrids.map((g, i) => i).filter((i) => !visited.has(i)).map((i) => currentGrids[i].grid),
    suivant: () => { pickNextByProximity(); return currentGrid; },
    formatVideoDisponible,
  };
  api.pret = source.then((j) => { SOURCE = j; refreshPalette(); construireCartes(); return api; });
  return api;
}
