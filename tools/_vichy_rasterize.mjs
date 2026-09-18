// Rasterise un SVG en PNG haute résolution — appelé en sous-processus par
// generate_referent_vichy.py (pas de rasterizer SVG natif disponible côté
// Python sur cette machine : cairosvg installé mais libcairo absente).
// Usage : node _vichy_rasterize.mjs <svg_path> <png_path> <size>
import sharp from 'file:///C:/Users/HP/AppData/Local/npm-cache/_npx/76dc10efc80ca823/node_modules/sharp/dist/index.mjs';

const [svgPath, pngPath, sizeArg] = process.argv.slice(2);
const size = Number(sizeArg || 1200);

await sharp(svgPath, { density: 600 }).resize(size, size).png().toFile(pngPath);
