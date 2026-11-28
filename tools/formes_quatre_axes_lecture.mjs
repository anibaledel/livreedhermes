#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// formes_quatre_axes_lecture.mjs — la lecture binaire du corpus (assets/lecture-binaire.js) appliquée aux couples de couches à quatre axes de data/couches-quatre-axes.json (tools/formes_quatre_axes.py).
// Un couple {A, B = π∘A} est PARFAIT si ses 64 grilles Φ(n, A, B) (carte des six niveaux du référent) sont toutes lisibles, à 72 sombres / 72 clairs, de lecture inversée par le décalage (6, 6)
// (mêmes critères que tools/corpus_256.mjs). Les formes sont les classes à translation torique près de ces grilles. Écrit data/formes-quatre-axes-288.json.
//   node tools/formes_quatre_axes_lecture.mjs            écrit le fichier
//   node tools/formes_quatre_axes_lecture.mjs --verifie  échoue s'il diffère de ce que le calcul donne
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { binaire } from './corpus_256.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (r) => JSON.parse(fs.readFileSync(path.join(ROOT, r), 'utf8'));
const N = 12, LET = ['V', 'M', 'O'];
const L = lire('data/referent_360_v3.json').layer_of;
const couples = lire('data/couches-quatre-axes.json').couples;
const corpus = lire('data/corpus-256.json').entrees;
const decalee = (g) => g.map((_, r) => g[0].map((__, c) => g[(r + 6) % N][(c + 6) % N]));
const niveau = (bits) => bits.map((s) => [...s].map((x) => 1 - Number(x)).join(''));
const parfaite = (g) => {
  let lu; try { lu = binaire(g, 'x'); } catch { return false; }
  if (Math.abs(lu.stats.aireV - 72) > 1e-9 || Math.abs(lu.stats.aireM - 72) > 1e-9) return false;
  let ld; try { ld = binaire(decalee(g), 'xd'); } catch { return false; }
  return ld.bits.join() === niveau(lu.bits).join();
};
// la classe à translation torique près d'une grille (lignes de lettres) : la plus petite des 144 translatées
const classe = (rows) => { let m = null; for (let dr = 0; dr < N; dr++) for (let dc = 0; dc < N; dc++) { const k = Array.from({ length: N }, (__, r) => { const s = rows[(r + dr) % N]; return s.slice(dc) + s.slice(0, dc); }).join('/'); if (m === null || k < m) m = k; } return m; };
const classesCorpus = new Set(corpus.map((e) => classe(e.tricolore)));
const formes = new Map(), socles = new Set(), couplesParfaits = []; let parfaits = 0, grilles = 0;
for (const c of couples) {
  const A = c.A.map((s) => [...s]); // π : la lettre à la place de V, M, O
  const perm = { V: c.pi[0], M: c.pi[1], O: c.pi[2] };
  const B = A.map((l) => l.map((x) => perm[x]));
  if (!parfaite(A) || !parfaite(B)) continue;
  const gs = [];
  let tout = true;
  for (let n = 0; n < 64 && tout; n++) {
    const g = L.map((ligne, r) => ligne.map((niv, col) => (((n >> (niv - 1)) & 1) ? A : B)[r][col]));
    if (n > 0 && n < 63 && !parfaite(g)) tout = false;
    gs.push(g.map((l) => l.join('')));
  }
  if (!tout) continue;
  parfaits++; socles.add(c.socle_par_niveau.join(',')); couplesParfaits.push({ A: c.A, pi: c.pi, socle_par_niveau: c.socle_par_niveau });
  const distincts = new Set(gs.map((a) => a.join('/'))).size;
  for (const g of gs) {
    const k = classe(g);
    if (!formes.has(k)) { grilles++; formes.set(k, { corpus: classesCorpus.has(k), socle_par_niveau: c.socle_par_niveau, grilles_distinctes_sur_64: distincts, tricolore: g }); }
    else if (formes.get(k).socle_par_niveau.join() !== c.socle_par_niveau.join()) throw new Error('une forme apparaît avec deux socles');
  }
}
const liste = [...formes.entries()].sort((a, b) => (b[1].corpus - a[1].corpus) || a[0].localeCompare(b[0])).map(([, v], i) => ({ id: `q4-${String(i + 1).padStart(3, '0')}`, ...v }));
const doc = {
  _doc: "Les formes à quatre axes de miroir dont le couple de couches a ses 64 grilles parfaites à la lecture binaire (node tools/formes_quatre_axes_lecture.mjs, depuis data/couches-quatre-axes.json). « corpus » : la forme est déjà dans data/corpus-256.json. « socle_par_niveau » : les cases de la teinte fixe à chacun des six niveaux ; « grilles_distinctes_sur_64 » : le nombre de grilles différentes parmi les 64 hexagrammes du couple (32 si un trait ne change rien). Une grille par forme (classe à translation torique près). « couples » : les 288 couples {A, B = π∘A} (A en lignes de lettres V/M/O, π la permutation des teintes) dont les 64 grilles sont parfaites ; B se déduit de A par π.",
  nombres: { couples_parfaits: parfaits, formes: liste.length, formes_du_corpus: liste.filter((f) => f.corpus).length, formes_nouvelles: liste.filter((f) => !f.corpus).length, socles: socles.size },
  formes: liste,
  couples: couplesParfaits,
};
const texte = JSON.stringify(doc, null, 0).replace(/\{"id"/g, '\n{"id"') + '\n';
const SORTIE = path.join(ROOT, 'data', 'formes-quatre-axes-288.json');
if (process.argv.includes('--verifie')) {
  if (!fs.existsSync(SORTIE) || fs.readFileSync(SORTIE, 'utf8') !== texte) { console.error('ÉCART data/formes-quatre-axes-288.json diffère de ce que le calcul donne : node tools/formes_quatre_axes_lecture.mjs'); process.exit(1); }
  const n = doc.nombres;
  console.log(`OK    formes à quatre axes à la lecture binaire : ${n.couples_parfaits} couples parfaits, ${n.formes} formes (${n.formes_du_corpus} du corpus, ${n.formes_nouvelles} nouvelles), ${n.socles} socles.`);
} else { fs.writeFileSync(SORTIE, texte); console.log(`data/formes-quatre-axes-288.json écrit : ${JSON.stringify(doc.nombres)}`); }
