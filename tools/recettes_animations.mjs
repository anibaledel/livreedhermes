#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// recettes_animations.mjs — la RECETTE de l'animation de chaque collection,
// écrite une fois dans le registre (data/fonds/collections-pinterest.json).
//
// Une animation de collection n'est pas la captation de ce qui passe à
// l'écran : c'est une recette — une graine, la liste ORDONNÉE des motifs,
// la durée de chaque motif et du fondu, la densité, la cadence. La même
// recette donne toujours la même animation (galerie-animations.html,
// assets/animation-collection.js). Le visiteur n'en règle que la VUE : la
// vitesse et les couleurs, dans l'URL.
//
// Le calcul de la liste (algorithme « proche-binaire-v1 ») :
//   - les candidats : les 256 motifs du corpus (8 familles × h0…h31, les
//     pages de motifs), dont la lecture binaire est définie ;
//   - le premier : tiré par la graine (mulberry32) ;
//   - chaque suivant : le motif non encore pris le plus proche du précédent
//     sur la lecture binaire (assets/proximite-binaire.js, en quarts de case),
//     une image identique (distance 0) exclue ; à égalité, la graine tranche.
// C'est le parcours de l'animation du fond d'écran, rendu reproductible.
//
// « proche-binaire-32-v2 » (recette arrêtée par Anibal, 2026-10-04) : 32
// motifs de 0,75 s, soit 24,000 s, sans carton de fin ; les 32 sont les 32
// HEXAGRAMMES h0…h31, chacun une fois. Les candidats restent les 256 motifs
// du corpus (8 familles × h0…h31) : chaque suivant est le plus proche du
// précédent parmi ceux dont l'hexagramme n'est pas encore passé — la
// famille, elle, est choisie par la proximité. La v1 (12 motifs de 2,5 s,
// tirés dans les 256 sans contrainte d'hexagramme) laissait revenir un même
// hexagramme sous deux familles et n'en montrait que 12 : c'était un
// paramètre (« nombre: 12 »), pas une liste tronquée.
//
// « proche-binaire-32-famille-v3 » (décision d'Anibal, 2026-10-05, après
// avoir vu P) : le fondu de 0,25 s est gardé ; le plus proche voisin se
// cherche DANS UNE FAMILLE de 32 motifs (h0…h31 d'une même famille, chacun
// une fois) — la famille du premier motif, tiré par la graine parmi les 256 ;
// et le carton de fin revient, avec le nom de l'auteur : 32 × 0,75 + 2 =
// 26,000 s, 1560 images à 60 im/s.
//
// La liste est ENREGISTRÉE, pas recalculée à l'affichage : si l'algorithme
// change un jour, les recettes existantes ne bougent pas. --verifie recalcule
// chacune depuis sa graine et signale un écart (algorithme modifié, ou liste
// retouchée à la main) — une recette retouchée exprès se marque
// "algorithme": "manuel".
//
// Usage : node tools/recettes_animations.mjs            écrit les recettes absentes
//         node tools/recettes_animations.mjs --verifie  vérifie celles qui existent

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { distanceBinaire, signatureBinaire } from '../assets/proximite-binaire.js';
import { grilleDuMotif, slugDe, FAMILLES } from '../assets/vue-fond-ecran.js';
import { ecrireRegistre } from './registre.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRE = path.join(ROOT, 'data/fonds/collections-pinterest.json');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));

// Les paramètres d'une recette neuve : 12 motifs de 2,5 s (30 s), fondu de
// 0,8 s, 2 s de carton de fin (le nom de la collection et l'adresse du site),
// 30 images par seconde, 4 tuiles sur le petit côté (la densité par défaut
// de l'animation du fond d'écran).
const DEFAUTS = { algorithme: 'proche-binaire-v1', nombre: 12, dureeMotif: 2.5, fondu: 0.8, fin: 2, imagesParSeconde: 30, densite: 4 };
// La recette 32 : 0,75 s par motif à 60 im/s, 45 images par motif exactement ;
// fondu de 0,25 s (15 images), le tiers du motif comme le 0,8 s de 2,5 s.
export const DEFAUTS_32 = { algorithme: 'proche-binaire-32-v2', nombre: 32, dureeMotif: 0.75, fondu: 0.25, fin: 0, imagesParSeconde: 60, densite: 4 };
export const DEFAUTS_26 = { algorithme: 'proche-binaire-32-famille-v3', nombre: 32, dureeMotif: 0.75, fondu: 0.25, fin: 2, imagesParSeconde: 60, densite: 4 };
export const familleDe = (slug) => slug.replace(/-h\d+$/, '');
export const hexagrammeDe = (slug) => Number(slug.match(/-h(\d+)$/)[1]);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// La graine d'une collection : FNV-1a de son code — un nombre fixé une fois,
// sans autre sens que d'être écrit.
const graineDe = (code) => { let h = 0x811c9dc5; for (const c of code) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

export const candidats = [];
for (const fam of FAMILLES) {
  for (let n = 0; n < 32; n++) {
    try {
      const cases = lectureBinaire(grilleDuMotif(data, fam, n), slugDe(fam, n)).cases;
      candidats.push({ slug: slugDe(fam, n), sig: signatureBinaire(cases) });
    } catch { /* lecture indéfinie : hors de l'animation bicolore */ }
  }
}

export function calculerListe(graine, nombre, unParHexagramme = false, uneFamille = false) {
  const alea = mulberry32(graine);
  const pris = new Set();
  const hexPris = new Set();
  let famille = null;
  const libre = (c) => !pris.has(c.slug) && !(unParHexagramme && hexPris.has(hexagrammeDe(c.slug)))
    && !(uneFamille && familleDe(c.slug) !== famille);
  let courant = candidats[Math.floor(alea() * candidats.length)];
  famille = familleDe(courant.slug);
  const liste = [courant.slug];
  pris.add(courant.slug);
  hexPris.add(hexagrammeDe(courant.slug));
  while (liste.length < nombre) {
    let meilleurs = [], min = Infinity;
    for (const c of candidats) {
      if (!libre(c)) continue;
      const d = distanceBinaire(courant.sig, c.sig);
      if (d === 0) continue; // la même image : le visiteur ne verrait rien changer
      if (d < min) { min = d; meilleurs = [c]; } else if (d === min) meilleurs.push(c);
    }
    if (!meilleurs.length) throw new Error('plus de candidat');
    courant = meilleurs[Math.floor(alea() * meilleurs.length)];
    liste.push(courant.slug);
    pris.add(courant.slug);
    hexPris.add(hexagrammeDe(courant.slug));
  }
  return liste;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const verifie = process.argv.includes('--verifie');
  // --refaire CODE… : passe ces collections à la recette 26 (32 motifs d'une
  // famille, carton avec le nom de l'auteur) ; l'ancienne
  // recette est gardée (recettesAnciennes), rien ne se supprime.
  const iRefaire = process.argv.indexOf('--refaire');
  const aRefaire = iRefaire > -1 ? process.argv.slice(iRefaire + 1).filter((a) => !a.startsWith('--')) : [];
  const reg = JSON.parse(readFileSync(REGISTRE, 'utf8'));
  const slugs = new Set(candidats.map((c) => c.slug));
  let ecrites = 0;
  const ecarts = [];
  for (const code of aRefaire) {
    const col = reg.collections[code];
    if (!col) { ecarts.push(`${code} : collection inconnue du registre`); continue; }
    if (col.recette?.algorithme === DEFAUTS_26.algorithme) continue;
    if (col.recette) (col.recettesAnciennes ??= []).push(col.recette);
    const graine = graineDe(code);
    col.recette = { ...DEFAUTS_26, graine, motifs: calculerListe(graine, DEFAUTS_26.nombre, true, true) };
    delete col.recette.nombre;
    ecrites++;
  }
  for (const [code, col] of Object.entries(reg.collections)) {
    const r = col.recette;
    if (!r) {
      if (verifie) { ecarts.push(`${code} : pas de recette`); continue; }
      const graine = graineDe(code);
      col.recette = { ...DEFAUTS, graine, motifs: calculerListe(graine, DEFAUTS.nombre) };
      delete col.recette.nombre;
      ecrites++;
      continue;
    }
    for (const s of r.motifs) if (!slugs.has(s)) ecarts.push(`${code} : motif « ${s} » inconnu ou de lecture indéfinie`);
    if (new Set(r.motifs).size !== r.motifs.length) ecarts.push(`${code} : un motif revient deux fois`);
    if (!(r.dureeMotif > r.fondu && r.fondu >= 0 && r.fin >= 0 && r.imagesParSeconde > 0 && r.densite >= 1)) ecarts.push(`${code} : durées ou densité incohérentes`);
    if (['proche-binaire-v1', DEFAUTS_32.algorithme, DEFAUTS_26.algorithme].includes(r.algorithme)) {
      const attendu = calculerListe(r.graine, r.motifs.length, r.algorithme !== 'proche-binaire-v1', r.algorithme === DEFAUTS_26.algorithme);
      if (attendu.join() !== r.motifs.join()) ecarts.push(`${code} : la liste ne sort plus de sa graine ${r.graine} (algorithme modifié, ou liste retouchée sans « algorithme »: « manuel »)`);
    }
    const duree = r.motifs.length * r.dureeMotif + r.fin;
    console.log(`${code.padEnd(5)} graine ${String(r.graine).padEnd(10)} ${r.motifs.length} motifs × ${r.dureeMotif} s (fondu ${r.fondu} s) + ${r.fin} s de fin = ${duree} s à ${r.imagesParSeconde} i/s ; ${r.motifs[0]} → ${r.motifs[r.motifs.length - 1]}`);
  }
  if (ecrites) {
    reg._doc_recette ??= "« recette » : l'animation de la collection, fixée une fois par tools/recettes_animations.mjs — graine, liste ORDONNÉE des motifs (adresses des pages de motifs), durée de chaque motif et du fondu, carton de fin, cadence, densité (tuiles sur le petit côté). La vue (vitesse, couleurs) est au visiteur, dans l'URL de galerie-animations.html. « video » : l'animation de référence, produite hors navigateur par ffmpeg / libx264 (tools/video_reference.mjs) et déposée (assets/animations/), et son affiche extraite du fichier (tools/affiches_animations.mjs).";
    ecrireRegistre(REGISTRE, reg);
    console.log(`${ecrites} recette(s) écrite(s) dans ${path.relative(ROOT, REGISTRE)}.`);
  }
  console.log(`${candidats.length} motifs candidats (lecture binaire définie) sur 256.`);
  if (ecarts.length) { for (const e of ecarts) console.error(`ÉCART ${e}`); process.exit(1); }
  if (verifie) console.log('Recettes conformes : chaque liste sort de sa graine.');
}
