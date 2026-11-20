#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_animations_corpus.mjs — les animations du corpus binaire tiennent ce que le prompt 209 dit (sans navigateur ; la page, elle, est dans check_galerie_corpus.mjs).
//
// Ce qu'il relit :
//   1. le lien corpus -> moteur : data/corpus-256.json (relu par les contrôles de tools/corpus_256.mjs) donne, aux niveaux 64, 128 et 256, des listes de 64, 256 et 256
//      tuiles ; chaque tuile est une entrée du corpus, lue par assets/lecture-binaire.js (aucun cas indéfini) ; au niveau 128 la tuile 2k + 1 est le NÉGATIF de la tuile 2k
//      (décalée de (6, 6), lecture inversée sur les quatre triangles de chacune des 144 cases) ; au niveau 256 aucun id ne revient ; au niveau 64 un id par classe ;
//   2. le moteur (assets/animation-collection.js, moment()) : sur la liste du niveau 128, le fondu d'une tuile vers la suivante est la bascule du motif vers son négatif ;
//   3. la liste fermée : niveauValide / niveauDeLaVue n'acceptent que 64, 128, 256 (adresse, puis stockage local, puis 128) et ignorent tout le reste, y compris un stockage qui refuse ;
//   4. le registre : registre.animations_corpus est à part ; ses codes ne sont PAS des codes de « collections » ; le fond existe ; la recette n'a pas de liste de motifs ;
//   5. RIEN DE PUBLIÉ N'A BOUGÉ : les 34 recettes (liste, durées, palette) et l'empreinte de leur vidéo au registre, telles qu'elles étaient le 2026-11-20, ont toujours
//      l'empreinte ci-dessous (un nouvel ajout au registre n'y change rien : seuls ces 34 codes sont comptés).
//
// Usage : node tools/check_animations_corpus.mjs [--essai]
//   --essai : un niveau inconnu, une paire dont le second n'est pas le négatif, un code de corpus qui reprend un code publié, une recette publiée retouchée : refusés.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { NIVEAUX_CORPUS, NIVEAU_DEFAUT, niveauValide, niveauDeLaVue, retenirNiveau, listeDuCorpus, nombreDeTuiles, grilleDeLEntree } from '../assets/corpus-animation.js';
import { moment, dureeTotale } from '../assets/animation-collection.js';
import { binaire, controler } from './corpus_256.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
// les 34 collections animées publiées au 2026-11-20 et l'empreinte de leurs recettes, palettes et vidéos (prompt 209 : « les recettes déjà publiées ne changent pas »)
const PUBLIEES = ['P', 'B2D', 'B2', 'B121', 'B6D', 'B3', 'B4', 'B12m', 'B3n', 'BA50', 'B3D', 'B4D', 'B121D', 'B11211D', 'BA33', 'CCE', 'QT', 'TRC', 'QRT', 'ESC', 'PCA12', 'SEC13', 'LOS25', 'CAD36', 'P+E95', 'P+R45', 'P+C70', 'P+R80', 'P+X87', 'P+L95', 'B3D+E95', 'CCE+E95', 'QT+R45', 'BA50+E95'];
const EMPREINTE_PUBLIEES = 'c0b3092b6f18704767c5a637de2faf3976afc5b493db7656865beb4ce63a493e';
export function empreintePubliees(collections) {
  const h = createHash('sha256');
  for (const code of PUBLIEES) {
    const c = collections[code];
    if (!c || !c.recette) return `(recette de ${code} absente)`;
    h.update(`${code}\u0000${JSON.stringify(c.recette)}\u0000${JSON.stringify(c.video?.sha256 ?? null)}\u0000${JSON.stringify(c.palette)}\n`);
  }
  return h.digest('hex');
}

const echangeBits = (b) => b.map((s) => [...s].map((x) => 1 - Number(x)).join(''));

export function defauts(corpus, registre, essai = {}) {
  const d = [];
  const index = new Map(corpus.entrees.map((e) => [e.id, e]));
  const attendu = { 64: 64, 128: 256, 256: 256 };
  for (const niveau of NIVEAUX_CORPUS) {
    const liste = listeDuCorpus(corpus, niveau);
    if (liste.length !== attendu[niveau] || liste.length !== nombreDeTuiles(niveau)) d.push(`niveau ${niveau} : ${liste.length} tuiles, ${attendu[niveau]} attendues`);
    for (const id of liste) if (!index.has(id)) d.push(`niveau ${niveau} : « ${id} » n'est pas une entrée du corpus`);
    if (niveau === 256 && new Set(liste).size !== 256) d.push('niveau 256 : un id revient');
    if (niveau === 64 && new Set(liste).size !== 64) d.push('niveau 64 : un id revient');
    if (niveau === 128) {
      const l = essai.liste128 || liste;
      for (let k = 0; k < l.length; k += 2) {
        const a = index.get(l[k]), b = index.get(l[k + 1]);
        if (!a || !b) continue;
        if (a.partenaire_demi_decalage !== b.id || b.partenaire_demi_decalage !== a.id) d.push(`niveau 128 : la tuile ${k + 1} (${b.id}) n'est pas le négatif de la tuile ${k} (${a.id})`);
        else if (binaire(grilleDeLEntree(corpus, b.id), b.id).bits.join() !== echangeBits(binaire(grilleDeLEntree(corpus, a.id), a.id).bits).join()) d.push(`niveau 128 : ${b.id} n'inverse pas la lecture de ${a.id}`);
      }
    }
    for (const id of liste) {
      try { lectureBinaire(grilleDeLEntree(corpus, id), id); } catch { d.push(`niveau ${niveau} : ${id} : lecture indéfinie`); }
    }
  }
  // le moteur : au niveau 128, le fondu de la tuile 2k vers la tuile 2k + 1 est la bascule vers le négatif
  const rec = { dureeMotif: 0.75, fondu: 0.25, fin: 2, motifs: listeDuCorpus(corpus, 128) };
  const m0 = moment(rec, 0.74), m1 = moment(rec, 0.80), m2 = moment(rec, 1.55);
  if (!(m0.i === 0 && m0.suivant === 1 && m0.a > 0.9)) d.push(`moteur : à 0,74 s la tuile 0 devrait se fondre presque entièrement dans la tuile 1 (le négatif) : ${JSON.stringify(m0)}`);
  if (!(m1.i === 1 && m1.a === 0)) d.push(`moteur : à 0,80 s la tuile 1 (le négatif) devrait être pleine : ${JSON.stringify(m1)}`);
  if (!(m2.i === 2)) d.push(`moteur : à 1,55 s la paire suivante devrait commencer : ${JSON.stringify(m2)}`);
  if (dureeTotale(rec) !== 256 * 0.75 + 2) d.push(`durée totale ${dureeTotale(rec)}, 194 attendue au niveau 128`);
  // la liste fermée
  for (const [v, attendu128] of [['128', 128], ['64', 64], ['256', 256], [64, 64], ['0128', null], [' 128', null], ['128.0', null], ['1e2', null], ['100', null], ['', null], [null, null], ['abc', null], ['512', null], ['-64', null]]) {
    if (niveauValide(v) !== attendu128) d.push(`niveauValide(${JSON.stringify(v)}) = ${niveauValide(v)}, ${attendu128} attendu`);
  }
  const stock = (valeur, refuse = false) => ({ getItem: () => { if (refuse) throw new Error('refusé'); return valeur; }, setItem: () => { if (refuse) throw new Error('refusé'); } });
  if (niveauDeLaVue(null, stock(null)) !== NIVEAU_DEFAUT || NIVEAU_DEFAUT !== 128) d.push('le défaut doit être 128');
  if (niveauDeLaVue('64', stock('256')) !== 64) d.push("l'adresse doit l'emporter sur le stockage local");
  if (niveauDeLaVue('999', stock('256')) !== 256) d.push("une adresse invalide doit être ignorée, le stockage local décide alors");
  if (niveauDeLaVue('999', stock('777')) !== 128) d.push('un stockage invalide doit être ignoré : 128');
  if (niveauDeLaVue(null, stock(null, true)) !== 128) d.push('un stockage qui refuse ne doit pas empêcher la page (try / catch) : 128');
  try { retenirNiveau(64, stock(null, true)); } catch { d.push('retenirNiveau doit absorber un stockage qui refuse'); }
  // le registre
  const reg = registre.animations_corpus || {};
  const collection = JSON.parse(lire('data/fonds/collection-v1.json'));
  const fonds = new Set([...collection.fonds.map((f) => f.id), ...collection.assemblages]);
  if (!Object.keys(reg).length) d.push('registre.animations_corpus est vide');
  for (const [code, c] of Object.entries(reg)) {
    if (registre.collections[code]) d.push(`${code} : déjà un code de « collections » (un code existant ne se réutilise pas)`);
    if (!fonds.has(c.fond)) d.push(`${code} : fond « ${c.fond} » absent de data/fonds/collection-v1.json`);
    if (!Array.isArray(c.palette) || c.palette.length !== 2 || c.palette.some((x) => !/^#[0-9a-f]{6}$/i.test(x))) d.push(`${code} : palette mal formée`);
    const r = c.recette || {};
    if ('motifs' in r) d.push(`${code} : la recette d'un corpus n'a pas de liste de motifs (elle se tire du corpus)`);
    if (r.corpus !== 128) d.push(`${code} : niveau par défaut ${r.corpus}, 128 attendu`);
    if (JSON.stringify(r.niveaux) !== JSON.stringify(NIVEAUX_CORPUS)) d.push(`${code} : niveaux ${JSON.stringify(r.niveaux)}, [64, 128, 256] attendus`);
    if (!(r.dureeMotif > r.fondu && r.fondu >= 0 && r.fin >= 0 && r.imagesParSeconde > 0 && r.densite >= 1)) d.push(`${code} : durées ou densité incohérentes`);
  }
  // rien de publié n'a bougé
  const e = empreintePubliees(registre.collections);
  if (e !== EMPREINTE_PUBLIEES) d.push(`les 34 recettes publiées ont changé : empreinte ${e}, ${EMPREINTE_PUBLIEES} attendue`);
  return d;
}

const corpus = JSON.parse(lire('data/corpus-256.json'));
const registre = JSON.parse(lire('data/fonds/collections-pinterest.json'));
if (process.argv.includes('--essai')) {
  const copie = (o) => JSON.parse(JSON.stringify(o));
  const l = listeDuCorpus(corpus, 128).slice(); [l[1], l[3]] = [l[3], l[1]];
  const regCollision = copie(registre); regCollision.animations_corpus.P = regCollision.animations_corpus['CORPUS-P'];
  const regRetouche = copie(registre); regRetouche.collections.B2.recette.dureeMotif = 0.8;
  const regVideo = copie(registre); regVideo.collections.P.video.sha256 = '0'.repeat(64);
  const regListe = copie(registre); regListe.animations_corpus['CORPUS-P'].recette.motifs = ['bases-yang-h0'];
  const cas = {
    'le registre et le corpus justes': [corpus, registre, {}, 0],
    'deux tuiles de la liste 128 échangées (le second n\'est plus le négatif)': [corpus, registre, { liste128: l }, 1],
    'un code de corpus qui reprend un code publié (P)': [corpus, regCollision, {}, 1],
    'une recette publiée retouchée (B2, 0,8 s par motif)': [corpus, regRetouche, {}, 1],
    'l\'empreinte d\'une vidéo publiée changée (P)': [corpus, regVideo, {}, 1],
    'une liste de motifs dans la recette d\'un corpus': [corpus, regListe, {}, 1],
  };
  let manques = 0;
  for (const [nom, [c, r, e, attendu]] of Object.entries(cas)) {
    const v = defauts(c, r, e);
    const ok = attendu === 0 ? v.length === 0 : v.length > 0;
    console.log(`${ok ? 'vu   ' : 'MANQUÉ'} ${nom} : ${v.length} défaut(s)${v[0] ? ` — ${v[0].slice(0, 90)}` : ''}`);
    if (!ok) manques++;
  }
  if (controler(JSON.stringify(corpus)).length === 0) console.log('      (corpus_256.mjs : le fichier du corpus, relu, est conforme)');
  if (manques) { console.error(`\n${manques} cas mal jugé(s).`); process.exit(1); }
  console.log('--essai : le juste passe, les cinq faussés sont refusés.');
  process.exit(0);
}
const v = defauts(corpus, registre);
if (v.length) { for (const x of v.slice(0, 20)) console.error(`ÉCHEC ${x}`); process.exit(1); }
console.log(`OK    Animations du corpus : niveaux 64 / 128 / 256 = ${NIVEAUX_CORPUS.map((n) => nombreDeTuiles(n)).join(' / ')} tuiles, 128 par défaut ; au niveau 128 chaque tuile paire est suivie de son négatif ; liste fermée ; registre à part ; les ${PUBLIEES.length} recettes publiées n'ont pas bougé (empreinte ${EMPREINTE_PUBLIEES.slice(0, 12)}).`);
