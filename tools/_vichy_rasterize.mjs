// Rasterise un SVG en PNG haute résolution — appelé en sous-processus par
// generate_referent_vichy.py. Pas de rasterizer SVG natif côté Python sur
// cette machine (cairosvg installé mais libcairo absente sous Windows) ;
// sharp (déjà une dépendance scripts/, via @napi-rs/canvas pour le reste
// du pipeline JS) fait le travail à la place, sans lien avec le reste du
// pipeline navigateur des autres référents (bicolore, bandes) qui sont du
// SVG pur, pas du raster.
// Usage : node _vichy_rasterize.mjs <svg_path> <png_path> <size>
import sharp from '../scripts/node_modules/sharp/dist/index.mjs';

const [svgPath, pngPath, sizeArg] = process.argv.slice(2);
const size = Number(sizeArg || 1200);

await sharp(svgPath, { density: 600 }).resize(size, size).png().toFile(pngPath);
