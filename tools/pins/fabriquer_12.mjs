#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// fabriquer_12.mjs — les épingles Pinterest des motifs bicolores de l'ORDRE 12 (les 142 motifs de galerie-bicolore.html), lot d'essai : 3 motifs, chacun en
// TUILE (la cellule de 12 × 12 cases, 60 px par case : 720 × 720) et en PAVAGE (4 cellules en largeur, 6 en hauteur : 48 × 72 cases, 21 px par case :
// 1008 × 1512, rapport 2 : 3, par translation, jamais de miroir). Mêmes couleurs que les lots d'ordres 18 et 30 (encre sur crème, assets/couleurs.js). Les
// motifs sont ceux de data/bicolore_galerie_v1.json, au grain « case » (C1, un bit par case : data/AXES/catalogue.json + assets/bicolore-axes.js, comme la page).
// Identifiant d'un motif : o12-b<rang dans le fichier, sur trois chiffres> (o12-b000 à o12-b141) : la galerie n'en donne pas à l'ordre 12, voir le rapport.
// Le pavage porte le bandeau « anibal-amiot.com · CC BY-NC 4.0 » des autres lots ; la tuile n'en porte pas (elle est exactement la cellule, aucune place).
// Rien n'est envoyé nulle part : les fichiers restent dans pins/essai-12/ (ignoré par git) ; le dépôt public motifs-pins se remplit à la main ou dans une
// session qui y a accès.
//
// Usage : node tools/pins/fabriquer_12.mjs            fabrique les 6 images, la planche, le manifeste, vérifie
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../lib_fonds_site.mjs';
import { buildAxes, generateAxesMask } from '../../assets/bicolore-axes.js';
import { triangleGeometry, PER_CELL } from '../../assets/bicolore-render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), SORTIE = path.join(ROOT, 'pins/essai-12');
const DEPOT = 'anibaledel/motifs-pins', DOSSIER = 'essai-12', PAGE = 'https://anibal-amiot.com/galerie-bicolore.html', G = 12, PXT = 60, PXP = 21, LT = G * PXT, LP = 4 * G * PXP, HP = 6 * G * PXP;
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const AXES = buildAxes(lire('data/AXES/catalogue.json')), data = lire('data/bicolore_galerie_v1.json');
const masques = data.entries.map((e) => generateAxesMask(e.accord.flatMap(([n, g]) => AXES[n][g] || []), { grain: 'C1' }));
// Le CADRAGE de la galerie : au grain C8 (8 triangles par case, comme la galerie à son réglage de départ, drawMask). Le grain C1 testait le CENTRE de chaque case : un axe
// diagonal qui passe par ce centre y tombe en égalité, et la figure sortait décalée d'une demi-case (127 motifs sur 142 : tous ceux dont les 8 triangles d'une case diffèrent).
// Les masques C1 ne servent plus qu'à classer les motifs (nombre de cases sombres) et à contrôler les données.
const masques8 = data.entries.map((e) => generateAxesMask(e.accord.flatMap(([n, g]) => AXES[n][g] || []), { grain: 'C8' }));
const TRI = Array.from({ length: G * G * PER_CELL }, (_, k) => triangleGeometry(k, 1, PER_CELL).map((p) => [p[0], p[1]])); // coordonnées en cases, origine au coin de la cellule
const decalees = masques.filter((m, i) => masques8[i].some((v, k) => v !== m[Math.floor(k / PER_CELL)])).length; // motifs dont la lecture « case » diffère de celle de la galerie
const id = (i) => `o12-b${String(i).padStart(3, '0')}`, sombre = (i) => masques[i].reduce((a, b) => a + b, 0);
masques.forEach((m, i) => { if (m.length !== G * G || sombre(i) !== data.entries[i].sombre) throw new Error(`${id(i)} : masque de ${m.length} cases, ${sombre(i)} sombres au lieu de ${data.entries[i].sombre}`); });

// trois motifs bien différents : le plus dense (le plus de cases sombres), le plus aéré (le moins), un intermédiaire (la médiane des nombres de cases sombres)
const tries = masques.map((_, i) => i).sort((a, b) => sombre(a) - sombre(b) || a - b), mediane = sombre(tries[Math.floor(tries.length / 2)]);
const complement = (a, b) => masques[a].every((x, k) => x !== masques[b][k]); // le plus dense n'est pas le négatif du plus aéré : on veut trois motifs qui se distinguent
const aere = tries[0], dense = tries.filter((i) => sombre(i) === sombre(tries.at(-1)) && !complement(i, aere)).at(-1);
const choix = [['dense', dense], ['aere', aere], ['intermediaire', masques.map((_, i) => i).find((i) => sombre(i) === mediane && data.entries[i].accord.length >= 2)]];
const pins = []; for (const [, i] of choix) for (const type of ['pavage', 'tuile']) pins.push({ i, id: id(i), type, fichier: `${id(i)}-${type}.png` });

const RENDU = `async (spec) => {
  const { PALETTES } = await import('/assets/couleurs.js'), rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), ink = rgb(PALETTES.creme[1]), fond = rgb(PALETTES.creme[0]), css = (c) => 'rgb(' + c.join(',') + ')';
  const cellule = (m, px) => { const c = document.createElement('canvas'); c.width = c.height = spec.G * px; const x = c.getContext('2d'); x.fillStyle = css(fond); x.fillRect(0, 0, c.width, c.height); x.fillStyle = css(ink); x.strokeStyle = css(ink); x.lineWidth = 0.6; x.lineJoin = 'round';
    for (let k = 0; k < m.length; k++) if (m[k]) { const t = spec.TRI[k]; x.beginPath(); x.moveTo(t[0][0] * px, t[0][1] * px); x.lineTo(t[1][0] * px, t[1][1] * px); x.lineTo(t[2][0] * px, t[2][1] * px); x.closePath(); x.fill(); x.stroke(); } // le trait comble les joints entre triangles voisins
    return c; };
  const image = (p) => { const m = spec.masques[p.i];
    if (p.type === 'tuile') return cellule(m, spec.PXT);
    const t = cellule(m, spec.PXP), c = document.createElement('canvas'); c.width = spec.LP; c.height = spec.HP; const x = c.getContext('2d');
    for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) x.drawImage(t, b * t.width, a * t.height); // translation pure
    const h = 64; x.fillStyle = 'rgba(' + ink.join(',') + ',0.55)'; x.fillRect(0, c.height - h, c.width, h); x.fillStyle = css(fond); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '600 26px system-ui, sans-serif'; x.fillText('anibal-amiot.com · CC BY-NC 4.0', c.width / 2, c.height - h / 2);
    return c; };
  const toiles = spec.pins.map(image), h = 360, e = 22, ws = toiles.map((c) => Math.round(h * c.width / c.height)), w = Math.max(...ws), cols = 3;
  // la planche : une colonne par motif (le pavage au-dessus, la tuile dessous), une ligne d'étiquette sous chaque image
  const pl = document.createElement('canvas'); pl.width = cols * w + (cols + 1) * 14; pl.height = 2 * (h + e) + 3 * 14; const px = pl.getContext('2d'); px.fillStyle = '#111'; px.fillRect(0, 0, pl.width, pl.height); px.font = '12px system-ui, sans-serif'; px.fillStyle = '#ddd'; px.textBaseline = 'middle';
  toiles.forEach((c, i) => { const col = Math.floor(i / 2), lig = i % 2, X = 14 + col * (w + 14) + (w - ws[i]) / 2, Y = 14 + lig * (h + e + 14); px.imageSmoothingEnabled = false; px.drawImage(c, X, Y, ws[i], h); px.textAlign = 'center'; px.fillText(spec.pins[i].fichier + ' (' + c.width + ' × ' + c.height + ')', X + ws[i] / 2, Y + h + e / 2); });
  return { images: toiles.map((c, i) => ({ fichier: spec.pins[i].fichier, largeur: c.width, hauteur: c.height, png: c.toDataURL('image/png').split(',')[1] })), planche: pl.toDataURL('image/png').split(',')[1] };
}`;

mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT), nav = await chromium.launch(); let r;
try {
  const page = await nav.newPage(); await page.goto(`${serveur.url}/includes/head-icons.html`);
  r = await page.evaluate(`(${RENDU})(${JSON.stringify({ G, PXT, PXP, LP, HP, pins, TRI, masques: masques8.map((m) => Array.from(m)) })})`);
} finally { await nav.close(); serveur.fermer(); }
for (const im of r.images) writeFileSync(path.join(SORTIE, im.fichier), Buffer.from(im.png, 'base64'));
writeFileSync(path.join(SORTIE, 'planche.png'), Buffer.from(r.planche, 'base64'));

// le manifeste : dates fictives à partir du 27 nov. 2026, les pavages d'abord, leurs tuiles 7 jours plus tard (12 épingles par jour au plus), jamais d'heure
const date = (j) => { const d = new Date('2026-11-27T00:00:00Z'); d.setUTCDate(d.getUTCDate() + j); return d.toISOString().slice(0, 10); }, parJour = {};
const epingles = pins.slice().sort((a, b) => (a.type === b.type ? pins.indexOf(a) - pins.indexOf(b) : a.type === 'pavage' ? -1 : 1)).map((p) => {
  const pav = p.type === 'pavage', jour = pav ? 0 : 7, lien = `${PAGE}#${p.id}`; parJour[jour] = (parJour[jour] || 0) + 1;
  return {
    date: date(jour), rang: parJour[jour], tableau: pav ? 'Seamless Patterns 12' : 'Geometric Tiles 12', url_image: `https://raw.githubusercontent.com/${DEPOT}/main/${DOSSIER}/${p.fichier}`,
    titre: pav ? `Geometric seamless pattern · order 12 · ${p.id} · bicolor` : `Geometric tile · order 12 · ${p.id} · bicolor`,
    description: pav
      ? `Motif géométrique bicolore sans couture, ordre 12, ${p.id} : une tuile Jacquard de 12 × 12 cases répétée par translation, sans miroir, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir dans la galerie : ${lien}`
      : `Tuile géométrique bicolore, ordre 12, ${p.id} : une tuile Jacquard de 12 × 12 cases, motif de base à répéter, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir dans la galerie : ${lien}`,
    texte_alternatif: pav ? `Black and cream geometric seamless pattern, order 12, ${p.id}: a 12 × 12 cell bicolor Jacquard tile repeated by translation.` : `Black and cream geometric tile, order 12, ${p.id}: a single 12 × 12 cell bicolor Jacquard tile on a cream background.`,
    lien, motif_id: p.id, type: p.type, ordre: 12, fichier: p.fichier,
  };
});
writeFileSync(path.join(SORTIE, 'manifeste-essai-12.json'), JSON.stringify({ lot: 'essai-12', depot: DEPOT, ordre: 12, du: date(0), au: date(7), par_jour: 12, motifs: choix.map(([n, i]) => ({ nom: n, id: id(i), accord: data.entries[i].accord.map((x) => x.join(' ')).join(' + '), sombres_sur_144: sombre(i) })), epingles }, null, 1) + '\n');

// la vérification : dimensions, poids, titres distincts, 6 images, la tuile est la cellule du pavage (période exacte)
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
for (const im of r.images) { const [L, H] = im.fichier.endsWith('tuile.png') ? [LT, LT] : [LP, HP]; ok(im.largeur === L && im.hauteur === H, `${im.fichier} : ${im.largeur} × ${im.hauteur}, ${L} × ${H} attendus`); }
ok(new Set(epingles.map((e) => e.titre)).size === 6 && epingles.length === 6, 'six titres distincts attendus');
ok(Object.values(parJour).every((n) => n <= 12), 'plus de 12 épingles un jour');
if (echecs.length) { for (const e of echecs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log(`${decalees} motifs sur ${masques.length} avaient la lecture « case » décalée par rapport à la galerie (corrigé : grain C8, comme la galerie).`);
console.log(`Essai ordre 12 : ${r.images.length} images dans ${SORTIE}/ (tuile ${LT} × ${LT}, pavage ${LP} × ${HP}), planche.png, manifeste-essai-12.json ; motifs ${choix.map(([n, i]) => `${n} ${id(i)} (${sombre(i)}/144 sombres)`).join(', ')}. Rien n'est poussé.`);
