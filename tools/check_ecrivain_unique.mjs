#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_ecrivain_unique.mjs — l'état bicolore a UN écrivain.
//
// assets/etat-fond-ecran.js gouverne, sur les pages qui le montent, la
// collection, le fond et les deux couleurs — et leurs paramètres d'URL
// (?fond, ?sup, ?c0, ?c1). Deux écrivains d'un même paramètre, c'est la forme
// des divergences déjà payées ici : les deux jeux de données du fond d'écran,
// referent_bicolore_c8b2_v1.json contre regle_parite.py (576 régions sur
// 1152). La galerie bicolore écrivait c0 et c1 de son côté ; monter l'outil
// par-dessus en aurait fait deux.
//
// Une lecture statique ne sait pas qui écrit vraiment (les modules partagés
// DÉFINISSENT les fonctions d'écriture sans les appeler sur ces pages). Ce
// contrôle mesure donc à l'exécution :
//   - sur fonds-ecran.html et galerie-bicolore.html, chaque écriture de
//     l'URL (history.replaceState / pushState) qui change fond, sup, c0 ou c1
//     est relevée avec sa pile d'appels ; on la provoque par TOUTES les entrées
//     de ces pages (sélecteur, champs de couleur, préréglages, barre de
//     l'animation, réinitialiser, champs de la galerie) ;
//   - chaque écriture doit passer par assets/vue-fond-ecran.js, l'écrivain ;
//   - et un second devenirEcrivain sur une même page est refusé.
//
// Usage : node tools/check_ecrivain_unique.mjs [local | https://anibal-amiot.com]

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'local';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

// à l'exécution, sans navigateur : un second écrivain est refusé
const etat = await import(pathToFileURL(path.join(ROOT, 'assets/etat-fond-ecran.js')).href);
etat.devenirEcrivain({ definirPalette() {} });
let refuse = false;
try { etat.devenirEcrivain({ definirPalette() {} }); } catch { refuse = true; }
if (!refuse) echec('etat-fond-ecran.js accepte un second écrivain');

const ESPION = () => {
  window.__ecritures = [];
  const CLES = ['fond', 'sup', 'c0', 'c1'];
  for (const nom of ['replaceState', 'pushState']) {
    const vrai = history[nom].bind(history);
    history[nom] = (s, t, url) => {
      if (url != null) {
        const avant = new URLSearchParams(location.search), apres = new URL(url, location.href).searchParams;
        const change = CLES.filter((k) => avant.get(k) !== apres.get(k));
        if (change.length) window.__ecritures.push({ change, pile: new Error().stack });
      }
      return vrai(s, t, url);
    };
  }
};
const navigateur = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const regler = (p, sel, v) => p.evaluate(({ sel, v }) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, { sel, v });
const cliquer = (p, sel, n = 0) => p.evaluate(({ sel, n }) => { const e = document.querySelectorAll(sel)[n]; if (!e) throw new Error(`absent : ${sel} [${n}]`); e.click(); }, { sel, n });

const PAGES = [
  ['fonds-ecran.html', async (p) => {
    await p.waitForFunction(() => window.outilsFondEcran?.bicolore && document.querySelectorAll('#outilBicolore .cat-card:not(.disabled)').length);
    await regler(p, '#ffCouleur1', '#112233');
    await cliquer(p, '.ff-preset[data-palette=monochrome]');
    await cliquer(p, '#ffSelecteur .sf-bouton'); await cliquer(p, '#ffSelecteur [role=option]', 5);
    // l'outil bicolore : sa barre (champs c0, c1, préréglages, réinitialiser)
    await cliquer(p, '#outilBicolore .cat-card');
    await p.waitForTimeout(400);
    await regler(p, '[data-r=c0]', '#c8102e');
    await cliquer(p, '.anim-preset[data-palette=bicolore]');
    await regler(p, '[data-r=c1]', '#334455');
    await cliquer(p, '.fe-stage:has([data-r=c0]) [data-r=btnReset]');
    await p.evaluate(() => window.outilsFondEcran.bicolore.quitter());
    // l'outil tricolore n'écrit ni la collection ni les couleurs bicolores
    await cliquer(p, '#outilTricolore .cat-card');
    await p.waitForTimeout(200);
    await cliquer(p, '.fe-stage:has([data-r=btnMode]) [data-r=btnMode]');
    await cliquer(p, '.fe-stage:has([data-r=btnMode]) [data-r=btnReset]');
  }],
  ['galerie-bicolore.html', async (p) => {
    await p.waitForFunction(() => document.querySelector('#ffApercu svg') && document.querySelector('#gallery .tile'));
    await regler(p, '#tintClair', '#f0e0d0');
    await regler(p, '#tintSombre', '#102030');
    await regler(p, '#ffCouleur2', '#ffffff');
    await cliquer(p, '.ff-preset[data-palette=bicolore]');
    await cliquer(p, '#ffSelecteur .sf-bouton'); await cliquer(p, '#ffSelecteur [role=option]', 7);
  }],
];
for (const [url, agir] of PAGES) {
  const p = await navigateur.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e)));
  await p.addInitScript(ESPION);
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.goto(`${BASE}/${url}`, { waitUntil: 'networkidle' });
  await agir(p);
  await p.waitForTimeout(300);
  const ecritures = await p.evaluate(() => window.__ecritures);
  const hors = ecritures.filter((e) => !/vue-fond-ecran\.js/.test(e.pile));
  if (ecritures.length < 4) echec(`${url} : ${ecritures.length} écriture(s) seulement — les interactions n'ont pas porté`);
  for (const e of hors) echec(`${url} : écriture de ${e.change.join(', ')} hors de l'écrivain :\n${e.pile.split('\n').slice(1, 5).join('\n')}`);
  if (erreurs.length) echec(`${url} : ${erreurs.join(' | ')}`);
  const cles = [...new Set(ecritures.flatMap((e) => e.change))].sort();
  console.log(`${url} : ${ecritures.length} écritures de ${cles.join(', ')}, ${ecritures.length - hors.length} par assets/vue-fond-ecran.js, ${hors.length} ailleurs`);
  await p.close();
}
console.log(`à l'exécution : un second devenirEcrivain est ${refuse ? 'refusé' : 'ACCEPTÉ'}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('Un seul écrivain de l\'état bicolore et de ses paramètres d\'URL.');
