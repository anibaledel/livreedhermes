#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// check_familles_unifiees.mjs — la règle de parité de assets/familles-unifiees.js (« une seule base yang ») donne EXACTEMENT les huit familles unifiées des données : les familles de
// data/fonds_ecran_v1.json (15) dont les entrées sont les couples (fixe, mut) de la galerie et des fonds d'écran (1 024 entrées, 8 familles) ; la règle dit « unifiée » pour ces huit et pour
// elles seules ; et le marquage « une seule base yang » est présent, dans les quatre langues, dans la galerie tricolore et les fonds d'écran.
// (Les trois faits de la note, relus sur le référent 360, sont dans tools/check_note_v6.py.) Usage : node tools/check_familles_unifiees.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FU = require(path.join(ROOT, 'assets/familles-unifiees.js'));
const d = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
let echecs = 0, controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs++; console.error(`ÉCHEC ${m}`); } };
const toutes = Object.keys(d.families), dansEntrees = [...new Set(d.entries.map((e) => e[0]))];
ok(toutes.length === 15, `15 familles (${toutes.length})`);
ok(toutes.every((f) => FU.basesDe(f).length >= 1) && FU.basesDe('par4').length === 4 && FU.basesDe('par3:sans_yang').join() === 'yang_mut,yin,yin_mut' && FU.basesDe('par2:yin+yang_mut').join() === 'yin,yang_mut', 'basesDe lit la clé de chaque famille');
const unifiees = toutes.filter(FU.uneSeuleBaseYang);
ok(unifiees.length === 8, `la règle de parité retient 8 familles sur 15 (${unifiees.length})`);
ok(unifiees.slice().sort().join() === dansEntrees.slice().sort().join(), `les 8 familles de la règle sont celles des 1 024 entrées de la galerie et des fonds d'écran : ${unifiees.join(' ; ')}`);
ok(d.entries.length === 1024 && d.entries.every((e) => (e[1] === 'yang' && e[2] === 'yang_mut') || (e[1] === 'yin' && e[2] === 'yin_mut')), 'toutes les entrées sont des couples (fixe, mut) : (yang, yang_mut) ou (yin, yin_mut), jamais (yang, yin)');
for (const f of toutes.filter((x) => !unifiees.includes(x))) ok(!dansEntrees.includes(f), `${f} n'est pas unifiée et n'est dans aucune entrée`);
const MARQUE = { fr: 'une seule base yang', en: 'a single yang base', es: 'una sola base yang' };
const gal = { fr: 'galerie-patterns-unifies.html', en: 'en/three-colour-gallery/index.html', es: 'es/galeria-tricolor/index.html' };
for (const [l, f] of Object.entries(gal)) ok(readFileSync(path.join(ROOT, f), 'utf8').includes(MARQUE[l]), `${f} : « ${MARQUE[l]} »`);
const vue = readFileSync(path.join(ROOT, 'assets/vue-fond-ecran.js'), 'utf8'), fe = readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
ok(/FamillesUnifiees|uneSeuleBaseYang/.test(vue) && fe.includes('familles-unifiees.js'), 'les fonds d\'écran lisent la règle de parité (assets/familles-unifiees.js)');
// Prompt 242 : on n'appelle pas « unifié » un mélange (yang, yin). Le tirage, la création de motifs et les 360 calques mélangent (yang, yin) (et (yang-mut, yin-mut)) : leur texte visible ne dit pas
// « unifié » (hors navigation, qui désigne la galerie, et hors commentaires de code). Seuls la galerie tricolore, les fonds d'écran et le lexique parlent de motifs unifiés — ceux des couples (fixe, mut).
for (const f of ['tirage-livree-hermes.html', 'creation-motifs-yi-king.html', '360-calques.html']) {
  // 360-calques.html porte depuis le prompt 257 la section « Jeu unifié (96) » (couples fixe / mut seulement : 96 plaques, 512 grilles unifiées) : cette section, son bouton, ses textes (clés ju…) et son code sont les seuls endroits permis ;
  // le catalogue des 360 calques (qui mélange (yang, yin)) ne dit toujours pas « unifié ».
  let brut = readFileSync(path.join(ROOT, f), 'utf8');
  if (f === '360-calques.html') {
    brut = brut.replace(/<section id="jeuUnifie"[\s\S]*?<\/section>/, '').replace(/\/\* ===== Jeu unifié \(prompts 243 et 257\) : 96 plaques[\s\S]*?\n\}\)\(\);/, '');
    brut = brut.split('\n').filter((l) => !/^\s*ju[A-Za-z]+:|#jeuUnifie|mode-unifie|id="jeuUni"|data-i18n="juUnifie"|jeuUnifie|jeu-barre|JeuUnifie|jeu-unifie/.test(l)).join('\n');
  }
  const lignes = brut.split('\n').filter((l) => /unifi/i.test(l) && !/nav-|navGalerie|navUnif|galerie-patterns-unifies|unified-patterns\.html|^\s*(\/\/|\*|\/\*)|<!--/.test(l)).map((l) => l.replace(/\s\/\/.*$/, '')).filter((l) => /unifi/i.test(l) && !/\bUnified Patterns\b/.test(l));
  ok(lignes.length === 0, `${f} : aucun « unifié » dans le texte visible (hors navigation et commentaires) : ${lignes.slice(0, 2).join(' | ')}`);
}
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    familles unifiées : ${controles} contrôles — la règle « une seule base yang » retient exactement les 8 familles des 1 024 entrées (couples fixe/mut seulement) ; marquage présent dans la galerie et les fonds d'écran.`);
