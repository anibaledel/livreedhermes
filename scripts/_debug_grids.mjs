import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const fondsEcranHtml = fs.readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
const dataMatch = fondsEcranHtml.match(/const DATA = (\{.*\});/);
const FONDS_ECRAN_DATA = JSON.parse(dataMatch[1]);
const LAYER_OF = FONDS_ECRAN_DATA.layerOf;

function hexagramGrid(n, gridA, gridB) {
  const col = n % 8, row = Math.floor(n / 8);
  const bitsCol = [col & 1, (col >> 1) & 1, (col >> 2) & 1];
  const bitsRow = [row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const traits = bitsCol.concat(bitsRow);
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const rowArr = [];
    for (let c = 0; c < 12; c++) {
      const pos = LAYER_OF[r][c];
      const bit = traits[pos - 1];
      rowArr.push(bit === 1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}
function fondsEcranEntry(n) {
  const [fam, subA, subB] = FONDS_ECRAN_DATA.entries.find((e) => e[3] === n);
  return hexagramGrid(n, FONDS_ECRAN_DATA.families[fam][subA], FONDS_ECRAN_DATA.families[fam][subB]);
}

const XS = [110.58, 141.74, 172.89, 204.05, 235.21, 266.36, 297.52, 328.68, 359.83, 390.99, 422.15, 453.31];
const YS = [234.1, 265.25, 296.41, 327.57, 358.72, 389.88, 421.04, 452.19, 483.35, 514.51, 545.66, 576.82];
const CELL_W = 31.16;
const HEX_TO_LABEL = { '#662d91': 'V', '#ee2a7b': 'M', '#fbb040': 'O' };
function findFillClasses(svgText) {
  const styleMatch = svgText.match(/<style>([\s\S]*?)<\/style>/);
  const map = {};
  if (!styleMatch) return map;
  for (const b of styleMatch[1].matchAll(/\.(cls-\d+)\s*\{([^}]*)\}/g)) {
    const m = b[2].match(/fill:\s*(#[0-9a-fA-F]{6})/);
    if (m) map[b[1]] = m[1].toLowerCase();
  }
  return map;
}
function parseCarteCells(svgText) {
  const fillMap = findFillClasses(svgText);
  const cells = [];
  for (const mm of svgText.matchAll(/<rect class="(cls-\d+)"\s+x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"\/>/g)) {
    const hex = fillMap[mm[1]];
    const label = hex && HEX_TO_LABEL[hex];
    if (!label) continue;
    if (Math.abs(+mm[4] - CELL_W) > 0.1) continue;
    const col = XS.findIndex((v) => Math.abs(v - +mm[2]) < 0.5);
    const row = YS.findIndex((v) => Math.abs(v - +mm[3]) < 0.5);
    if (row >= 0 && col >= 0) cells.push({ row, col, label });
  }
  return cells;
}
function singleNatureGrid(baseDir, natureSlug) {
  const grid = Array.from({ length: 12 }, () => Array(12).fill('O'));
  for (let pos = 1; pos <= 6; pos++) {
    const file = path.join(ROOT, 'assets', baseDir, natureSlug, `${pos}.svg`);
    const svgText = fs.readFileSync(file, 'utf8');
    for (const { row, col, label } of parseCarteCells(svgText)) {
      if (LAYER_OF[row][col] !== pos) continue;
      grid[row][col] = label;
    }
  }
  return grid;
}

const gA = fondsEcranEntry(0);
const gB = singleNatureGrid('trait-cartes', 'yang');
console.log('gA flat:', gA.flat().join(''));
console.log('gB flat:', gB.flat().join(''));
console.log('identical?', JSON.stringify(gA) === JSON.stringify(gB));
