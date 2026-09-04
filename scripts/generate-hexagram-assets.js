/* ============================================================
   Génère un PNG statique du carré/pavage magique pour chacun des 64
   hexagrammes (classement chronologique, 0-63), en portant en Node.js la
   même logique que index.html (LAYER_OF + CalqueEngine.colorAt + PALETTE
   + drawPavageSquare), pour un rendu identique à la version canvas du site.
   Usage : node generate-hexagram-assets.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'assets', 'hexagrammes');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- port de assets/calque-engine.js (fetch -> fs.readFileSync) ----------
const XS = [110.58,141.74,172.89,204.05,235.21,266.36,297.52,328.68,359.83,390.99,422.15,453.31];
const YS = [234.1,265.25,296.41,327.57,358.72,389.88,421.04,452.19,483.35,514.51,545.66,576.82];
const CELL_W = 31.16;
const HEX_TO_LABEL = { '#662d91':'V', '#ee2a7b':'M', '#fbb040':'O' };
const NATURE_KEY = { yang:'YANG', yin:'YIN' }; // pas de mutant : pages statiques, aucune ligne en mouvement

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

const grids = { YANG: Array.from({length:12},()=>Array(12).fill(null)), YIN: Array.from({length:12},()=>Array(12).fill(null)) };
Object.keys(NATURE_KEY).forEach(slug => {
  for(let pos = 1; pos <= 6; pos++){
    const file = path.join(REPO_ROOT, 'assets', 'trait-cartes', slug, pos + '.svg');
    const txt = fs.readFileSync(file, 'utf8');
    const cells = parseCarteCells(txt);
    const grid = grids[NATURE_KEY[slug]];
    cells.forEach(c => { grid[c.row][c.col] = c.label; });
  }
});
function colorAt(nature, row, col){ return grids[nature][row][col]; }

// ---------- port de LAYER_OF + PALETTE + drawPavageSquare (index.html) ----------
const LAYER_OF = [[1,1,3,4,6,6,6,6,4,3,1,1],[1,2,2,5,5,6,6,5,5,2,2,1],[3,2,3,4,5,4,4,5,4,3,2,3],[4,5,4,3,2,3,3,2,3,4,5,4],[6,5,5,2,2,1,1,2,2,5,5,6],[6,6,4,3,1,1,1,1,3,4,6,6],[6,6,4,3,1,1,1,1,3,4,6,6],[6,5,5,2,2,1,1,2,2,5,5,6],[4,5,4,3,2,3,3,2,3,4,5,4],[3,2,3,4,5,4,4,5,4,3,2,3],[1,2,2,5,5,6,6,5,5,2,2,1],[1,1,3,4,6,6,6,6,4,3,1,1]];
const PALETTE = { V:'#662d91', M:'#ee2a7b', O:'#fbb040' };

function drawPavageSquare(traits, sizePx){
  const canvas = createCanvas(sizePx, sizePx);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, sizePx, sizePx);
  const cw = sizePx / 12, ch = sizePx / 12;
  for(let r=0;r<12;r++){
    for(let c=0;c<12;c++){
      const pos = LAYER_OF[r][c];
      const i = pos - 1;
      const nature = traits[i] === 1 ? 'YANG' : 'YIN';
      const label = colorAt(nature, r, c);
      const x = c*cw, y = r*ch;
      if(label){
        ctx.fillStyle = PALETTE[label];
        ctx.fillRect(x, y, cw-1, ch-1);
      } else {
        ctx.strokeStyle = 'rgba(107,107,107,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x+2, y+2, cw-5, ch-5);
      }
    }
  }
  return canvas;
}

function traitsFromChrono(chrono){
  const r = Math.floor(chrono/8), c = chrono%8;
  return [c&1,(c>>1)&1,(c>>2)&1, r&1,(r>>1)&1,(r>>2)&1];
}

let count = 0;
for(let chrono = 0; chrono < 64; chrono++){
  const traits = traitsFromChrono(chrono);
  const canvas = drawPavageSquare(traits, 480);
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUT_DIR, chrono + '.png'), buf);
  count++;
}
console.log('Généré', count, 'PNG dans', OUT_DIR);
