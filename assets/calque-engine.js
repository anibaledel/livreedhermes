/* ============================================================
   CalqueEngine — moteur de composition partagé (tirage-livree-hermes.html,
   motifs (4).html). Reconstruit, pour chaque nature de trait (Yang, Yang
   mutant, Yin, Yin mutant), la grille de couleurs 12x12 réelle du pavage
   à partir des 24 calques individuels sources (une carte SVG par position
   de trait, assets/trait-cartes/<nature>/<position>.svg — extraits du
   dossier "-24-CARTES" de la catégorie IV, vérifiés cellule par cellule
   contre LAYER_OF). Remplace les grilles CALQUE_COLORS qui étaient codées
   en dur et avaient dérivé des fichiers réels (jusqu'à 83% d'écart).
   ============================================================ */
window.CalqueEngine = (function(){
  const DIR = 'assets/trait-cartes/';
  const NATURE_KEY = { yang:'YANG', 'yang-mut':'YANGMUT', yin:'YIN', 'yin-mut':'YINMUT' };

  // grille canonique de cellules du viewBox source (0 0 595.28 841.89), commune
  // aux 24 calques (même échelle, mêmes coordonnées de cellule dans chaque fichier).
  const XS = [110.58,141.74,172.89,204.05,235.21,266.36,297.52,328.68,359.83,390.99,422.15,453.31];
  const YS = [234.1,265.25,296.41,327.57,358.72,389.88,421.04,452.19,483.35,514.51,545.66,576.82];
  const CELL_W = 31.16;
  const HEX_TO_LABEL = { '#662d91':'V', '#ee2a7b':'M', '#fbb040':'O' };

  function findFillClasses(svgText){
    const styleMatch = svgText.match(/<style>([\s\S]*?)<\/style>/);
    const map = {};
    if(!styleMatch) return map;
    const blocks = [...styleMatch[1].matchAll(/\.(cls-\d+)\s*\{([^}]*)\}/g)];
    for(const b of blocks){
      const m = b[2].match(/fill:\s*(#[0-9a-fA-F]{6})/);
      if(m) map[b[1]] = m[1].toLowerCase();
    }
    return map;
  }

  function parseCarteCells(svgText){
    const fillMap = findFillClasses(svgText);
    const rectRe = /<rect class="(cls-\d+)"\s+x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"\/>/g;
    let mm; const cells = [];
    while((mm = rectRe.exec(svgText))){
      const hex = fillMap[mm[1]];
      const label = hex && HEX_TO_LABEL[hex];
      if(!label) continue;
      if(Math.abs(+mm[4] - CELL_W) > 0.1) continue;
      const x = +mm[2], y = +mm[3];
      const col = XS.findIndex(v => Math.abs(v - x) < 0.5);
      const row = YS.findIndex(v => Math.abs(v - y) < 0.5);
      if(row >= 0 && col >= 0) cells.push({ row, col, label });
    }
    return cells;
  }

  // grids[NATURE][row][col] = 'V'|'M'|'O'|null — rempli au fur et à mesure du
  // chargement des 24 fichiers (6 positions x 4 natures), chacun ne renseignant
  // que les 24 cellules qui lui appartiennent réellement.
  const grids = {};
  Object.values(NATURE_KEY).forEach(key => {
    grids[key] = Array.from({ length: 12 }, () => Array(12).fill(null));
  });

  let loadPromise = null;
  function loadAll(){
    if(loadPromise) return loadPromise;
    const tasks = [];
    Object.keys(NATURE_KEY).forEach(slug => {
      for(let pos = 1; pos <= 6; pos++){
        const url = DIR + slug + '/' + pos + '.svg';
        tasks.push(
          fetch(url).then(r => r.text()).then(txt => {
            const cells = parseCarteCells(txt);
            const grid = grids[NATURE_KEY[slug]];
            cells.forEach(c => { grid[c.row][c.col] = c.label; });
          }).catch(err => console.error('CalqueEngine: échec de chargement', url, err))
        );
      }
    });
    loadPromise = Promise.all(tasks).then(() => {
      if(typeof window.repaintAllPavage === 'function') window.repaintAllPavage();
    });
    return loadPromise;
  }

  function colorAt(nature, row, col){
    const grid = grids[nature];
    return grid ? grid[row][col] : null;
  }

  loadAll();
  return { loadAll, colorAt };
})();
