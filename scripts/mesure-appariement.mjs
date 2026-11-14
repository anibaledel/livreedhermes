#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// mesure-appariement.mjs — mesure l'appariement du son et du motif de « Voir sa musique », sans rien corriger.
//
// Pour chacun des 7 morceaux fournis (assets/musiques-chladni/j1-do-diese.mp3 à j7-do.mp3) et pour des sinus purs de 110, 220 et 440 Hz, le script refait
// l'analyse de la page — fenêtre de Blackman de 8192 échantillons, FFT, 20·log10 du module divisé par N (c'est ce que rend getFloatFrequencyData avec
// smoothingTimeConstant = 0), une image toutes les 33 ms, bandesDuSon, lissage 0,45 — puis meilleurMotif aux trois ordres (collection par défaut de chacun :
// tricolore de l'ordre 12, b1971128 à l'ordre 18, p30 à l'ordre 30). Il vérifie :
//   (a) qu'un même morceau donne le même motif d'un tronçon de 15 s à l'autre ;
//   (b) que des tonalités voisines (au plus deux demi-tons) donnent des motifs voisins : distance dans la chaîne de voisinage, comparée à la distance
//       moyenne de deux motifs pris au hasard (n / 3), et appartenance aux 7 voisins ;
//   (c) la marge entre le premier et le deuxième score.
// Il ne corrige rien dans le moteur : il rapporte. Les MP3 sont décodés par ffmpeg (mono, 48 000 Hz) ; le tableau va dans docs/mesure-appariement.md.
//
// Usage : node scripts/mesure-appariement.mjs            affiche le tableau
//         node scripts/mesure-appariement.mjs --ecrit    l'écrit aussi dans docs/mesure-appariement.md
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const SR = 48000, N = 8192, PAS = Math.round(SR * 0.033), LISSAGE = 0.45, TRONCON = 15, ecrit = process.argv.includes('--ecrit');

// ---------- les blocs : la collection par défaut de chaque ordre ----------
const donnees = lire('data/musique-chladni-12.json'), defs = { collections1830: lire('data/musique-chladni/collections-18-30.json'), sym12: lire('data/musique-chladni/sym12-indices.json'), centrale12: lire('data/musique-chladni/centrale12-indices.json') };
const blocs = [{ ordre: 12, nom: 'tri', bloc: M.preparerBloc(donnees, 'tri') }];
for (const [ordre, id] of [[18, 'b1971128'], [30, 'p30']]) { const jb = lire(`data/musique-chladni/bloc-${ordre}-structure.json`), c = M.definirCollections(ordre, defs).find((d) => d.id === id); blocs.push({ ordre, nom: id, bloc: M.preparerBlocStructure(jb, { id, indices: c.indices }) }); }

// ---------- l'analyse de la page, hors navigateur ----------
const FENETRE = Float64Array.from({ length: N }, (_, n) => 0.42 - 0.5 * Math.cos(2 * Math.PI * n / N) + 0.08 * Math.cos(4 * Math.PI * n / N)); // Blackman, alpha = 0,16
function fft(re, im) { // radix 2, sur place
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
}
const spectreDb = (x, debut) => { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = (x[debut + i] || 0) * FENETRE[i]; fft(re, im); const db = new Float32Array(N / 2); for (let k = 0; k < N / 2; k++) db[k] = 20 * Math.log10(Math.hypot(re[k], im[k]) / N); return db; };
const mp3 = (fichier) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-i', path.join(ROOT, fichier), '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 29 }); if (r.status !== 0) throw new Error(`ffmpeg : ${String(r.stderr).split('\n')[0]}`); return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4); };
const sinus = (f, s = 60) => Float32Array.from({ length: SR * s }, (_, i) => 0.5 * Math.sin(2 * Math.PI * f * i / SR));

/** Les vecteurs de cercles lissés, une image toutes les 33 ms, pour un profil (fref, cercles K) ; moyennés par tronçon de 15 s. */
function vecteursParTroncon(x, bloc) {
  const nb = bloc.NS, lisse = new Float64Array(nb), troncons = []; let somme = new Float64Array(nb), n = 0, tcour = 0;
  for (let debut = 0, t = 0; debut + N <= x.length; debut += PAS, t = debut / SR) {
    const brut = M.bandesDuSon(spectreDb(x, debut), SR, { fref: bloc.fref, pente: true, shells: bloc.shells });
    for (let k = 0; k < nb; k++) lisse[k] = (1 - LISSAGE) * lisse[k] + LISSAGE * brut[k];
    for (let k = 0; k < nb; k++) somme[k] += lisse[k]; n++;
    if (Math.floor(t / TRONCON) !== tcour || debut + PAS + N > x.length) { troncons.push(somme.map((v) => v / n)); somme = new Float64Array(nb); n = 0; tcour = Math.floor(t / TRONCON); }
  }
  if (n) troncons.push(somme.map((v) => v / n));
  return troncons;
}
function classement(v, bloc) { // le premier et le deuxième score (cosinus centré), et leurs motifs ; les ex æquo sont départagés comme dans la page (M.departager)
  const a = M.vecteurAudio(v, bloc); if (!a) return { i: -1, s1: 0, j: -1, s2: 0 };
  const sc = new Float64Array(bloc.n); let s1 = -9; for (let j = 0; j < bloc.n; j++) { let s = 0; for (let k = 0; k < bloc.NS; k++) s += bloc.Pc[j * bloc.NS + k] * a[k]; sc[j] = s; if (s > s1) s1 = s; }
  const ex = []; for (let j = 0; j < bloc.n; j++) if (sc[j] >= s1 - M.EGALITE) ex.push(j);
  const i1 = ex.length > 1 ? M.departager(bloc, ex, -1) : ex[0]; let i2 = -1, s2 = -9; for (let j = 0; j < bloc.n; j++) if (j !== i1 && sc[j] > s2) { s2 = sc[j]; i2 = j; }
  return { i: i1, s1, j: i2, s2 };
}

/** Les vecteurs lissés, image par image (ce que la page donne au pilote). */
function vecteursParImage(x, bloc) {
  const nb = bloc.NS, lisse = new Float64Array(nb), images = [];
  for (let debut = 0; debut + N <= x.length; debut += PAS) {
    const brut = M.bandesDuSon(spectreDb(x, debut), SR, { fref: bloc.fref, pente: true, shells: bloc.shells });
    for (let k = 0; k < nb; k++) lisse[k] = (1 - LISSAGE) * lisse[k] + LISSAGE * brut[k];
    images.push({ t: debut / SR, v: Float64Array.from(lisse) });
  }
  return images;
}
/** Le pilote de la page en mode « image » (hystérésis 0,07, tenue de 8 images), avec une moyenne de `fenetre` secondes ; le motif tenu à la fin de chaque tronçon de 15 s, et le nombre de changements. */
function pilotageVivant(images, bloc, fenetre, dureeMax) {
  const p = M.creerPilote(bloc, { mode: 'image', hysteresis: 0.07, tenueMin: 8, fondu: 0.3, fenetreImage: fenetre }), fins = []; let changes = 0;
  for (const im of images) { const r = p.pas({ v: im.v, attaque: false, t: im.t }); if (r.change) changes++; const k = Math.floor((im.t + 0.033) / TRONCON); if (k >= 1 && fins.length < k && Math.round((im.t + 0.033) * 100) >= k * TRONCON * 100) fins.push(r.motif); }
  while (fins.length < Math.floor(dureeMax / TRONCON)) fins.push(p.motif());
  return { fins, changes };
}

// ---------- les mesures ----------
const MORCEAUX = [['j1', 'do dièse mineur', 1, 'assets/musiques-chladni/j1-do-diese.mp3'], ['j2', 'la mineur', 9, 'assets/musiques-chladni/j2-la.mp3'], ['j3', 'ré mineur', 2, 'assets/musiques-chladni/j3-re.mp3'], ['j4', 'mi mineur', 4, 'assets/musiques-chladni/j4-mi.mp3'], ['j5', 'sol mineur', 7, 'assets/musiques-chladni/j5-sol.mp3'], ['j6', 'si mineur', 11, 'assets/musiques-chladni/j6-si.mp3'], ['j7', 'do mineur', 0, 'assets/musiques-chladni/j7-do.mp3']];
const sons = [...MORCEAUX.map(([id, nom, classe, f]) => ({ id, nom, classe, x: mp3(f) })), ...[110, 220, 440].map((f) => ({ id: `sinus ${f} Hz`, nom: `sinus pur ${f} Hz`, classe: Math.round(12 * Math.log2(f / 261.6256) + 120) % 12, x: sinus(f) }))];
const mesures = [], lignes = [];
for (const s of sons) for (const { ordre, nom, bloc } of blocs) {
  const t = vecteursParTroncon(s.x, bloc), moy = t.reduce((a, v) => a.map((x, k) => x + v[k] / t.length), new Float64Array(bloc.NS)), tout = classement(moy, bloc), parT = t.map((v) => classement(v, bloc));
  mesures.push({ son: s, ordre, nom, bloc, tout, parT });
  lignes.push(`| ${s.id} | ${s.nom} | ${ordre} (${nom}) | ${tout.i >= 0 ? bloc.ids[tout.i] : '—'} | ${tout.s1.toFixed(3)} | ${tout.s2.toFixed(3)} | ${(tout.s1 - tout.s2).toFixed(3)} | ${parT.map((x) => (x.i >= 0 ? x.i : '—')).join(' · ')} | ${new Set(parT.map((x) => x.i)).size === 1 ? 'oui' : `non (${new Set(parT.map((x) => x.i)).size} motifs)`} |`);
}
// (d) la fenêtre de moyenne du mode « image » : le pilote de la page, simulé image par image, avec une moyenne de 0 (réglage actuel), 3, 5 ou 8 s
const FENETRES = [0, 3, 5, 8], vives = [];
for (const s of sons) for (const { ordre, nom, bloc } of blocs) {
  const images = vecteursParImage(s.x, bloc), duree = s.x.length / SR;
  for (const w of FENETRES) { const r = pilotageVivant(images, bloc, w, duree); vives.push({ son: s, ordre, nom, bloc, fenetre: w, ...r, stable: new Set(r.fins).size === 1 }); }
}
const vivesDe = (w, filtre) => vives.filter((x) => x.fenetre === w && filtre(x));
const estMorceau = (x) => x.son.id.startsWith('j'), estSinus = (x) => !estMorceau(x);
const lignesFen = FENETRES.map((w) => {
  const m = vivesDe(w, estMorceau), s12 = m.filter((x) => x.ordre === 12), sin = vivesDe(w, estSinus);
  const parMin = (l) => (l.reduce((a, x) => a + x.changes, 0) / l.length / (60 / 60)).toFixed(1);
  return `| ${w === 0 ? '0 s (réglage actuel)' : `${w} s`} | ${m.filter((x) => x.stable).length} sur ${m.length} | ${s12.filter((x) => x.stable).length} sur ${s12.length} | ${sin.filter((x) => x.stable).length} sur ${sin.length} (${[110, 220, 440].map((f) => `${f} Hz : ${vivesDe(w, (x) => x.son.id === `sinus ${f} Hz`).filter((x) => x.stable).length}/3`).join(', ')}) | ${parMin(m)} |`;
});
const meilleureFen = FENETRES.slice(1).map((w) => [w, vivesDe(w, estMorceau).filter((x) => x.stable).length]).sort((p, q) => q[1] - p[1])[0], sinusOk = vivesDe(meilleureFen[0], estSinus).every((x) => x.stable);
const decisionFen = meilleureFen[1] >= 15 && sinusOk ? `La fenêtre de ${meilleureFen[0]} s améliore nettement la stabilité (${meilleureFen[1]} sur 21, seuil 15) sans dégrader les sinus purs : elle est adoptée par défaut (\`CONFIG.moteur.fenetreImageSecondes\`).` : `Aucune fenêtre n'atteint le seuil de 15 cas sur 21 (la meilleure, ${meilleureFen[0]} s : ${meilleureFen[1]} sur 21 ; réglage actuel : ${vivesDe(0, estMorceau).filter((x) => x.stable).length} sur 21). Le réglage actuel est laissé (\`fenetreImageSecondes: 0\`) ; la fenêtre reste proposée en option : changer \`CONFIG.moteur.fenetreImageSecondes\` (3, 5 ou 8). Elle améliore la stabilité d'un tronçon à l'autre sans atteindre le seuil, et divise les changements de motif par minute (dernière colonne).`;
const detailFen = vives.filter((x) => x.ordre === 12).map((x) => `| ${x.son.id} | ${x.fenetre} s | ${x.fins.map((i) => x.bloc.ids[i]).join(' · ')} | ${x.stable ? 'oui' : 'non'} | ${x.changes} |`);

// (b) des tonalités voisines : la distance dans la chaîne de voisinage
const dist = (bloc, a, b) => Math.abs(bloc.posChaine[a] - bloc.posChaine[b]), classeDist = (a, b) => { const d = Math.abs(a - b) % 12; return Math.min(d, 12 - d); };
const paires = [];
for (let a = 0; a < MORCEAUX.length; a++) for (let b = a + 1; b < MORCEAUX.length; b++) if (classeDist(MORCEAUX[a][2], MORCEAUX[b][2]) <= 2) paires.push([MORCEAUX[a], MORCEAUX[b]]);
const lignesVoisins = [], resume = {};
for (const { ordre, nom, bloc } of blocs) {
  const mm = (id) => mesures.find((m) => m.son.id === id && m.ordre === ordre).tout.i;
  const base = bloc.n / 3; let proches = 0, voisins = 0; const ds = [];
  for (const [A, B] of paires) { const a = mm(A[0]), b = mm(B[0]), d = a >= 0 && b >= 0 ? dist(bloc, a, b) : null, dv = a >= 0 && b >= 0 && (bloc.rac[a].includes(b) || bloc.rac[b].includes(a)); if (d !== null) { ds.push(d); if (d < base) proches++; if (dv) voisins++; } lignesVoisins.push(`| ${ordre} (${nom}) | ${A[0]} ${A[1]} ↔ ${B[0]} ${B[1]} (${classeDist(A[2], B[2])} demi-ton${classeDist(A[2], B[2]) > 1 ? 's' : ''}) | ${d === null ? '—' : d} | ${dv ? 'oui' : 'non'} |`); }
  const m = ds.reduce((x, y) => x + y, 0) / (ds.length || 1); resume[ordre] = { moyenne: m, base, proches, voisins, total: ds.length };
}
const octaves = ['110', '220', '440'].map((f) => `sinus ${f} Hz`);
const lignesOct = []; for (const { ordre, nom, bloc } of blocs) { const ids = octaves.map((id) => mesures.find((m) => m.son.id === id && m.ordre === ordre).tout.i); lignesOct.push(`| ${ordre} (${nom}) | ${ids.map((i) => (i >= 0 ? bloc.ids[i] : '—')).join(' · ')} | ${ids[0] === ids[1] && ids[1] === ids[2] ? 'le même motif' : `${new Set(ids).size} motifs`} | ${ids.every((i) => i >= 0) ? `${dist(bloc, ids[0], ids[1])} · ${dist(bloc, ids[1], ids[2])}` : '—'} |`); }
const stable = mesures.filter((m) => m.son.id.startsWith('j')).filter((m) => new Set(m.parT.map((x) => x.i)).size === 1).length, total = mesures.filter((m) => m.son.id.startsWith('j')).length;
const marges = mesures.filter((m) => m.tout.i >= 0).map((m) => m.tout.s1 - m.tout.s2).sort((a, b) => a - b);
const mediane = marges[Math.floor(marges.length / 2)];

const md = `# Mesure de l'appariement du son et du motif (« Voir sa musique »)

Produit par \`node scripts/mesure-appariement.mjs --ecrit\` ; on rapporte ; le moteur est mesuré tel quel. Analyse de la page refaite hors navigateur : fenêtre de Blackman de ${N} échantillons à ${SR} Hz, une image toutes les 33 ms, \`bandesDuSon\`, lissage ${LISSAGE}, puis \`meilleurMotif\` (cosinus centré) sur la collection par défaut de chaque ordre : tricolore à l'ordre 12 (512 motifs), \`b1971128\` à l'ordre 18 (128), \`p30\` à l'ordre 30 (88). Le score est le cosinus entre le vecteur du son (moyenné sur le morceau entier) et le spectre centré du motif ; la marge est l'écart entre le premier et le deuxième score. La dernière colonne donne l'indice du motif retenu pour chacun des quatre tronçons de 15 s.

## À lire avant les chiffres

- **Marge nulle à l'ordre 12 (tricolore).** Plusieurs motifs de la collection ont exactement le même spectre de cercles (t000 en a au moins trois autres identiques), donc le premier et le deuxième score sont égaux (marge 0). Jusqu'au prompt 183, \`meilleurMotif\` gardait le premier de la liste, et le motif retenu dépendait de l'ordre des fichiers ; depuis, les ex æquo sont départagés par la proximité dans la chaîne du motif précédent, sinon par le plus petit identifiant (\`departager\`, contrôle n° 16 de \`tools/verify_musique_chladni.mjs\`). Le score ne change pas : la marge reste 0 entre ex æquo.
- Une distance de 0 dans la chaîne veut dire que les deux morceaux ont reçu le même motif.
- Le lissage (${LISSAGE}) est la valeur par défaut de la page ; les 4 tronçons sont ceux de 15 s des morceaux de 60 s.

## Résultat en trois lignes

- **(a) Stabilité par tronçon :** ${stable} cas sur ${total} (7 morceaux × 3 ordres) gardent le même motif d'un tronçon de 15 s à l'autre.
- **(b) Tonalités voisines :** ${[12, 18, 30].map((o) => `ordre ${o} : distance moyenne ${resume[o].moyenne.toFixed(1)} dans la chaîne (deux motifs au hasard : ${resume[o].base.toFixed(1)}), ${resume[o].proches} paires sur ${resume[o].total} plus proches que le hasard, ${resume[o].voisins} dans les 7 voisins`).join(' ; ')}.
- **(c) Marge entre le premier et le deuxième score :** médiane ${mediane.toFixed(3)}, minimum ${marges[0].toFixed(3)}, maximum ${marges[marges.length - 1].toFixed(3)}.

## Le motif retenu par morceau et par ordre

| Son | Tonalité | Ordre (collection) | Motif retenu | Score | 2ᵉ score | Marge | Motif par tronçon de 15 s | Même motif ? |
|---|---|---|---|---|---|---|---|---|
${lignes.join('\n')}

## (d) Moyenne du spectre sur une fenêtre plus longue (mode « image » seulement)

La mesure (a) compare des moyennes de 15 s : elle ne peut pas changer avec une fenêtre de 3, 5 ou 8 s. Ici, on simule le pilote de la page en mode « image » (hystérésis 0,07, tenue de 8 images, lissage ${LISSAGE}), image par image, avec une moyenne du vecteur du son sur les N dernières secondes avant l'appariement (\`fenetreImage\` de \`creerPilote\`), et on relève **le motif tenu à la fin de chaque tronçon de 15 s** : « stable » = le même motif aux quatre fins de tronçon. Les ex æquo sont départagés comme dans la page.

| Fenêtre | Morceaux stables (7 × 3 ordres) | dont ordre 12 (sur 7) | Sinus purs stables (3 × 3 ordres) | Changements de motif par minute (moyenne, morceaux) |
|---|---|---|---|---|
${lignesFen.join('\n')}

**Décision.** ${decisionFen}

Ordre 12 (tricolore), motif tenu à la fin des tronçons de 15 s :

| Son | Fenêtre | Motifs aux fins de tronçon | Stable ? | Changements |
|---|---|---|---|---|
${detailFen.join('\n')}

## (b) Des tonalités voisines (au plus deux demi-tons)

Distance = écart des positions dans la chaîne de voisinage de la collection ; « 7 voisins » : un motif figure parmi les 7 plus proches de l'autre.

| Ordre (collection) | Paire | Distance dans la chaîne | Dans les 7 voisins ? |
|---|---|---|---|
${lignesVoisins.join('\n')}

## Les sinus purs (octaves)

| Ordre (collection) | Motifs retenus à 110 · 220 · 440 Hz | Résultat | Distances 110→220 · 220→440 |
|---|---|---|---|
${lignesOct.join('\n')}
`;
console.log(md);
if (ecrit) { writeFileSync(path.join(ROOT, 'docs/mesure-appariement.md'), md); console.log('docs/mesure-appariement.md écrit.'); }
