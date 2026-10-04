#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_recette_32.mjs — chaque animation à la recette 32 enchaîne
// réellement les 32 hexagrammes, une fois chacun, au plus proche voisin.
//
// Le défaut qu'il attrape a vécu parce que rien ne comptait les motifs : les
// animations duraient 32 s, et on y lisait 32 motifs ; la recette en
// enchaînait 12 (« nombre: 12 », 2,5 s chacun, 2 s de carton), tirés dans les
// 256 motifs du corpus, un même hexagramme pouvant revenir sous deux familles.
//
// Il lit la LISTE que le rendu enchaîne (data/fonds/collections-pinterest.json,
// « recette »), pas la vidéo : une vidéo mesure le fondu, la liste mesure la
// recette. Pour chaque collection dont la recette est « proche-binaire-32-v2 » :
//   1. durée : 32 × 0,75 s, sans carton = 24,000 s, et un nombre ENTIER
//      d'images par motif à la cadence de la recette ; si la vidéo déposée
//      vient de cette recette, ffprobe y lit 24,000 s et ce nombre d'images ;
//   2. 32 ÉTATS DISTINCTS : 32 motifs, aucun deux fois, et aucune paire dont
//      les 576 quarts sont identiques (deux motifs qui se ressemblent au point
//      d'être la même image compteraient pour un) ;
//   3. LES 32 HEXAGRAMMES h0…h31, chacun une fois — mesurés dans le corpus
//      (les pages motifs/ : 8 familles × 32 hexagrammes = 256 motifs ; le
//      moteur, lui, en dessinerait 64), pas supposés ;
//   4. chaque transition va au PLUS PROCHE VOISIN restant : la distance de
//      Hamming sur les 576 quarts (144 cases × N/E/S/O) entre un motif et le
//      suivant est le minimum sur tous les candidats encore permis (motif non
//      passé, hexagramme non passé, image différente), recalculée ici.
//
// Le contrôle MORD : --essai casse une recette en mémoire de trois façons
// (deux motifs permutés ; un hexagramme répété sous une autre famille ; un
// motif retiré) et exige un échec pour chacune.
//
// Usage : node tools/check_recette_32.mjs [--essai] [CODE…]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { signatureBinaire } from '../assets/proximite-binaire.js';
import { grilleDuMotif, slugDe, FAMILLES } from '../assets/vue-fond-ecran.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALGO = 'proche-binaire-32-v2';
const reg = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8'));
const data = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const essai = process.argv.includes('--essai');
const demandes = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// le corpus : les motifs qui ont une PAGE (motifs/<slug>.html), pas tout ce
// que le moteur sait dessiner — grilleDuMotif() dessine les 64 hexagrammes
// (6 traits), mais seuls h0…h31 ont une page. Chaque motif : son hexagramme
// et ses 576 quarts.
const corpus = new Map();
const pages = new Set(readdirSync(path.join(ROOT, 'motifs')).filter((f) => /-h\d+\.html$/.test(f)).map((f) => f.replace(/\.html$/, '')));
for (const fam of FAMILLES) {
  for (const slug of pages) {
    const m = slug.match(/^(.*)-h(\d+)$/);
    if (m[1] !== slugDe(fam, 0).replace(/-h0$/, '')) continue;
    const n = Number(m[2]);
    try { corpus.set(slug, { h: n, sig: signatureBinaire(lectureBinaire(grilleDuMotif(data, fam, n), slug).cases) }); } catch { /* lecture indéfinie */ }
  }
}
const hexagrammes = [...new Set([...corpus.values()].map((m) => m.h))].sort((a, b) => a - b);
const hamming = (a, b) => {
  if (a.length !== 576 || b.length !== 576) throw new Error(`signature de ${a.length} / ${b.length} quarts, 576 attendus`);
  let d = 0;
  for (let i = 0; i < 576; i++) if (a[i] !== b[i]) d++;
  return d;
};

function controler(code, r, video) {
  const e = [];
  const m = r.motifs, n = m.length;
  // 1. durée et images
  const duree = n * r.dureeMotif + r.fin;
  const parMotif = r.dureeMotif * r.imagesParSeconde;
  if (Math.abs(duree - 24) > 1e-9) e.push(`${code} : durée ${duree} s (${n} × ${r.dureeMotif} s + ${r.fin} s), 24,000 s attendues`);
  if (Math.abs(parMotif - Math.round(parMotif)) > 1e-9) e.push(`${code} : ${parMotif} images par motif à ${r.imagesParSeconde} im/s, pas un entier`);
  if (video) {
    const p = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
      'stream=nb_read_frames,r_frame_rate,width,height:format=duration', '-of', 'json', video]));
    const s = p.streams[0], d = Number(p.format.duration), images = Number(s.nb_read_frames);
    const attendues = Math.round(24 * r.imagesParSeconde);
    if (Math.abs(d - 24) > 0.001 || images !== attendues || s.width !== 1080 || s.height !== 1920) {
      e.push(`${code} : la vidéo ${path.relative(ROOT, video)} dure ${d} s, ${images} images, ${s.width} × ${s.height} ; attendu 24,000 s, ${attendues} images, 1080 × 1920`);
    }
  }
  // 2. 32 états distincts
  if (n !== 32) e.push(`${code} : ${n} motifs, 32 attendus`);
  if (new Set(m).size !== n) e.push(`${code} : un motif revient deux fois`);
  for (const s of m) if (!corpus.has(s)) e.push(`${code} : motif « ${s} » inconnu du corpus`);
  if (e.length) return e;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (hamming(corpus.get(m[i]).sig, corpus.get(m[j]).sig) === 0) e.push(`${code} : ${m[i]} et ${m[j]} sont la même image (576 quarts identiques)`);
  }
  // 3. les 32 hexagrammes, chacun une fois
  const hs = m.map((s) => corpus.get(s).h);
  const manquants = hexagrammes.filter((h) => !hs.includes(h));
  const doubles = [...new Set(hs.filter((h, i) => hs.indexOf(h) !== i))];
  if (manquants.length || doubles.length) e.push(`${code} : hexagrammes manquants [${manquants.map((h) => 'h' + h)}], répétés [${doubles.map((h) => 'h' + h)}]`);
  // 4. le plus proche voisin, à chaque transition
  for (let i = 0; i + 1 < n; i++) {
    const cour = corpus.get(m[i]).sig;
    const passes = new Set(m.slice(0, i + 1)), hPasses = new Set(hs.slice(0, i + 1));
    let min = Infinity;
    for (const [s, c] of corpus) {
      if (passes.has(s) || hPasses.has(c.h)) continue;
      const d = hamming(cour, c.sig);
      if (d > 0 && d < min) min = d;
    }
    const d = hamming(cour, corpus.get(m[i + 1]).sig);
    if (d !== min) e.push(`${code} : transition ${i + 1} → ${i + 2} (${m[i]} → ${m[i + 1]}) à ${d} quarts, alors que le plus proche restant est à ${min}`);
  }
  return e;
}

const codes = demandes.length ? demandes : Object.keys(reg.collections).filter((c) => reg.collections[c].recette?.algorithme === ALGO);
console.log(`Corpus : ${corpus.size} motifs, ${hexagrammes.length} hexagrammes (h${hexagrammes[0]}…h${hexagrammes.at(-1)}), ${corpus.size / hexagrammes.length} familles.`);
if (hexagrammes.length !== 32) { console.error(`ÉCHEC le corpus a ${hexagrammes.length} hexagrammes, 32 attendus`); process.exit(1); }

if (essai) {
  const code = codes[0];
  const r = reg.collections[code].recette;
  const casse = (motifs) => controler(code, { ...r, motifs }, null);
  const m = [...r.motifs];
  const permute = [...m]; [permute[5], permute[9]] = [permute[9], permute[5]];
  const h0 = corpus.get(m[0]).h;
  const autreFamille = [...corpus.keys()].find((s) => corpus.get(s).h === h0 && s !== m[0]);
  const repete = [...m]; repete[20] = autreFamille;
  const court = m.slice(0, 31);
  const res = [['deux motifs permutés', casse(permute), 'plus proche'], [`h${h0} répété sous une autre famille`, casse(repete), 'répétés'], ['un motif retiré', casse(court), 'motifs, 32 attendus']];
  let ok = true;
  for (const [quoi, e, signe] of res) {
    const vu = e.some((x) => x.includes(signe));
    ok &&= vu;
    console.log(`Essai (${code}) : ${quoi} → ${vu ? 'détecté' : 'NON DÉTECTÉ'}${vu ? ` — ${e.find((x) => x.includes(signe))}` : ''}`);
  }
  process.exit(ok ? 0 : 1);
}

if (!codes.length) { console.error('ÉCHEC aucune collection à la recette 32'); process.exit(1); }
const echecs = [];
for (const code of codes) {
  const col = reg.collections[code];
  const r = col?.recette;
  if (!r || r.algorithme !== ALGO) { echecs.push(`${code} : pas à la recette 32 (${r?.algorithme ?? 'aucune'})`); continue; }
  // la vidéo déposée n'est mesurée que si elle vient de CETTE recette
  const v = col.video && col.video.recette === ALGO ? path.join(ROOT, col.video.fichier) : null;
  const e = controler(code, r, v && existsSync(v) ? v : null);
  echecs.push(...e);
  if (!e.length) console.log(`OK    ${code} : 32 hexagrammes (h0…h31, une fois chacun), 32 images distinctes, chaque transition au plus proche voisin restant (576 quarts) ; ${r.dureeMotif * r.imagesParSeconde} images par motif, 24,000 s${v ? ' ; vidéo : 24,000 s, ' + 24 * r.imagesParSeconde + ' images, 1080 × 1920' : ' (vidéo pas encore déposée à cette recette)'}`);
}
for (const e of echecs) console.error(`ÉCHEC ${e}`);
process.exit(echecs.length ? 1 : 0);
