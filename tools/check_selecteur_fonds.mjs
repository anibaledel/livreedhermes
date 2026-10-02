#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_selecteur_fonds.mjs — Vérifie le sélecteur de fond SUR LE SITE
// (déployé par défaut ; « local » sert le dépôt, ou une autre base) :
//
//   1. un seul fichier de composant, /assets/selecteur-fonds.js, sert les
//      trois pages : la création bicolore v2, les pages de motifs (une page
//      tirée au hasard, en anglais et en français) et le fond d'écran ;
//   2. l'échantillon de chaque ligne montre le motif en cours, dans la même
//      fenêtre de 4 × 4 cases pour toutes les lignes — et sur une page de
//      motif, ce motif-là : la lecture binaire de SA grille (motifDataJSON) ;
//   3. la ligne de métadonnées n'affiche de contraste que pour les familles
//      quantité et superposition ;
//   4. à 390 px de large, sur les trois pages, la liste s'ouvre, se parcourt
//      au clavier et se referme, sans défilement horizontal ;
//   5. le redessin complet de la liste (symboles compris, liste ouverte)
//      reste sous 100 ms — médiane de vingt mesures, le pire cas affiché ;
//   6. le masque ne bouge pas (création bicolore : bits relus dans le rendu,
//      avec un fond, égaux à ceux de l'aplat) ;
//   7. les 512 pages de motifs répondent 200 et leurs hreflang sont
//      réciproques (EN ↔ FR, x-default = EN) — la régression de #137.
// L'image exportée identique au rendu de la page : check_export_pinterest.mjs.
// C8 [1152, 13, 288] et C1 [144, 12, 36] : verify_fonds.mjs.
//
// Usage : CHROMIUM_PATH=… node tools/check_selecteur_fonds.mjs [base] [--sans-512]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, lignesCanoniques } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let BASE = args[0] && !args[0].startsWith('--') ? args[0] : 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

// une page de motif tirée au hasard (graine : l'heure — un tirage différent à chaque passage, nommé)
const lignes = lignesCanoniques(ROOT);
const tiree = lignes[Math.floor(Math.random() * lignes.length)].page;
const PAGES = [
  { nom: 'creation-bicolore-v2.html', url: 'creation-bicolore-v2.html?fond=CCE&sup=E95', racine: '#selecteurFonds', motif: 'bits' },
  { nom: tiree, url: `${tiree}?fond=B3D&sup=E95`, racine: '#vueFond', motif: 'page' },
  { nom: `fr/${tiree}`, url: `fr/${tiree}?fond=QT`, racine: '#vueFond', motif: 'page' },
  { nom: 'fonds-ecran.html', url: 'fonds-ecran.html?motif=bases-yang-h1&fond=B4D', racine: '#fondFixe', motif: 'ecran' },
];
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

for (const page of PAGES) {
  for (const [largeur, hauteur] of [[1280, 900], [390, 844]]) {
    const p = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
    const scripts = new Set();
    p.on('request', (r) => { if (/selecteur-fonds/.test(r.url())) scripts.add(new URL(r.url()).pathname); });
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(String(e)));
    await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await p.goto(`${BASE}/${page.url}`, { waitUntil: 'networkidle' });
    await p.waitForSelector(`${page.racine} .sf-bouton`);
    await p.waitForFunction(() => window.selecteurFonds);
    const ici = `${page.nom} à ${largeur} px`;
    // 1
    if ([...scripts].join() !== '/assets/selecteur-fonds.js') echec(`${ici} : composant chargé depuis ${[...scripts].join(', ') || 'nulle part'}`);
    // 2 et 6
    const lu = await p.evaluate(async ({ racine, motif }) => {
      const { hrefDeCase, motifSvg, bitsDuSvg, APLAT } = await import('/assets/bicolore-fonds.js');
      const { lectureBinaire } = await import('/assets/lecture-binaire.js');
      const sel = window.selecteurFonds;
      const masque = [...sel.masque()];
      const fen = sel.fenetre();
      const sig = (h) => (h.includes('coupe-') ? h.slice(h.indexOf('coupe-')) : h.slice(-2));
      const attendu = [];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) attendu.push(sig(hrefDeCase(masque[((fen.ligne + i) % 12) * 12 + ((fen.colonne + j) % 12)], 'x', '')));
      const ech = [...document.querySelectorAll(`${racine} .sf-liste svg.sf-ech`)].map((s) => [...s.querySelectorAll('use')].map((u) => sig(u.getAttribute('href'))));
      const r = { fen, ech: ech.map((e) => e.join() === attendu.join()), n: ech.length };
      if (motif === 'page') {
        const grille = JSON.parse(document.getElementById('motifDataJSON').textContent).grille_polarite_yang;
        r.cePropreMotif = JSON.stringify(lectureBinaire(grille, 'page').cases) === JSON.stringify(masque);
      }
      if (motif === 'bits') {
        const principal = bitsDuSvg(document.querySelector('#renderTarget svg').outerHTML);
        r.masqueInchange = principal.length === 144 && principal.join() === bitsDuSvg(motifSvg(masque, ['#000', '#fff'], APLAT)).join() && principal.join() === masque.join();
      }
      return r;
    }, page);
    if (lu.ech.some((x) => !x)) echec(`${ici} : ${lu.ech.filter((x) => !x).length} échantillon(s) ne montrent pas la fenêtre du motif en cours`);
    if (Math.abs(lu.fen.uns - 8) > 2) echec(`${ici} : fenêtre déséquilibrée (${lu.fen.uns} / 16)`);
    if (page.motif === 'page' && !lu.cePropreMotif) echec(`${ici} : le sélecteur ne montre pas le motif de la page`);
    if (page.motif === 'bits' && !lu.masqueInchange) echec(`${ici} : le fond change le masque`);
    // 3
    const metas = await p.$$eval(`${page.racine} .sf-liste [role=group]`, (gs) => gs.map((g) => ({ groupe: g.querySelector('.sf-groupe').textContent, metas: [...g.querySelectorAll('.sf-meta')].map((m) => m.textContent) })));
    for (const g of metas) for (const m of g.metas) {
      const contraste = /contraste|contrast/.test(m);
      if (contraste && !(/superposition|overlay/i.test(g.groupe) || /^(quantité|quantity)/.test(m))) echec(`${ici} : contraste affiché dans « ${g.groupe} » : ${m}`);
    }
    // 4 (et 5, liste ouverte)
    await p.locator(`${page.racine} .sf-bouton`).scrollIntoViewIfNeeded();
    await p.click(`${page.racine} .sf-bouton`);
    const ouvert = await p.$eval(`${page.racine} .sf-liste`, (l) => !l.hidden);
    const avant = await p.$eval(`${page.racine} .sf-liste`, (l) => l.getAttribute('aria-activedescendant'));
    await p.keyboard.press('ArrowDown');
    const apres = await p.$eval(`${page.racine} .sf-liste`, (l) => l.getAttribute('aria-activedescendant'));
    const mesures = await p.evaluate(() => { const r = []; for (let i = 0; i < 20; i++) r.push(window.selecteurFonds.redessinComplet()); return r.sort((x, y) => x - y); });
    const ms = mesures[10], pire = mesures[19];
    await p.keyboard.press('Escape');
    const ferme = await p.$eval(`${page.racine} .sf-liste`, (l) => l.hidden);
    const debord = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (!ouvert || avant === apres || !ferme) echec(`${ici} : ouverture ${ouvert}, parcours ${avant} → ${apres}, fermeture ${ferme}`);
    if (debord) echec(`${ici} : défilement horizontal`);
    if (ms >= 100) echec(`${ici} : redessin complet ${ms.toFixed(1)} ms (médiane de 20)`);
    if (erreurs.length) echec(`${ici} : erreurs ${erreurs.join(' | ')}`);
    console.log(`${ici} : ${[...scripts].join()} · fenêtre (${lu.fen.ligne}, ${lu.fen.colonne}) ${lu.fen.uns}/16 · ${lu.n} échantillons = la fenêtre${page.motif === 'page' ? ` · motif de la page : ${lu.cePropreMotif ? 'oui' : 'NON'}` : ''}${page.motif === 'bits' ? ` · masque inchangé : ${lu.masqueInchange ? 'oui' : 'NON'}` : ''} · clavier ${avant} → ${apres} · redessin ${ms.toFixed(1)} ms (médiane, pire ${pire.toFixed(1)})`);
    await p.close();
  }
}
await navigateur.close();

// 7. les 512 pages : 200, et hreflang réciproques.
if (!args.includes('--sans-512')) {
  const abs = (u) => new URL(u, 'https://anibal-amiot.com/').href;
  const alternates = (html) => Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], abs(m[2])]));
  let ok = 0;
  const lots = [];
  for (const l of lignes) lots.push(l.page, `fr/${l.page}`);
  for (let i = 0; i < lots.length; i += 16) {
    await Promise.all(lots.slice(i, i + 16).map(async (page) => {
      const rep = await fetch(`${BASE}/${page}`);
      if (rep.status !== 200) { echec(`${page} : ${rep.status}`); return; }
      const a = alternates(await rep.text());
      const en = `https://anibal-amiot.com/${page.replace(/^fr\//, '')}`, fr = `https://anibal-amiot.com/fr/${page.replace(/^fr\//, '')}`;
      if (a.en !== en || a.fr !== fr || a['x-default'] !== en) echec(`${page} : hreflang ${JSON.stringify(a)}`);
      else ok++;
    }));
  }
  console.log(`${ok} / ${lots.length} pages de motifs : 200, hreflang réciproques (EN ↔ FR, x-default = EN).`);
}
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nSélecteur de fond conforme sur ${BASE} (création bicolore, ${tiree} EN et FR, fond d'écran).`);
