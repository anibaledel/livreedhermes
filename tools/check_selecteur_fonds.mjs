#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_selecteur_fonds.mjs — Vérifie le sélecteur de fond SUR LE SITE
// (déployé par défaut ; une autre base en argument, par exemple
// http://localhost:8123 pour un essai local) :
//
//   1. chaque page qui porte le sélecteur charge le même fichier,
//      assets/selecteur-fonds.js — un seul composant, pas de copie ;
//   2. l'échantillon de chaque ligne montre le motif en cours, dans la même
//      fenêtre de 4 × 4 cases pour toutes les lignes (bits relus dans les
//      <use> de chaque échantillon, comparés au masque C1 de la page) ;
//   3. la ligne de métadonnées n'affiche de contraste que pour les familles
//      quantité et superposition ;
//   4. à 390 px de large, la liste s'ouvre, se parcourt au clavier et se
//      referme, sans défilement horizontal ;
//   5. le redessin complet de la liste (symboles compris, liste ouverte)
//      reste sous 100 ms — médiane de vingt mesures, le pire cas affiché ;
//   6. le masque ne bouge pas : les bits relus dans le rendu principal, avec
//      un fond, sont ceux de l'aplat. (C8 = [1152, 13, 288] : verify_fonds.mjs.)
//
// Usage : CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/check_selecteur_fonds.mjs [base]
import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'https://anibal-amiot.com').replace(/\/$/, '');
const PAGES = ['creation-bicolore-v2.html'];
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

for (const page of PAGES) {
  for (const [largeur, hauteur] of [[1280, 900], [390, 844]]) {
    const p = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
    const scripts = new Set();
    p.on('request', (r) => { if (r.url().includes('/assets/selecteur-fonds')) scripts.add(new URL(r.url()).pathname); });
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(String(e)));
    await p.goto(`${BASE}/${page}?fond=CCE&sup=E95`, { waitUntil: 'networkidle' });
    await p.waitForSelector('.sf-bouton');
    const ici = `${page} à ${largeur} px`;
    // 1
    if ([...scripts].join() !== '/assets/selecteur-fonds.js') echec(`${ici} : composant chargé depuis ${[...scripts].join(', ') || 'nulle part'}`);
    // 2 et 6
    const lu = await p.evaluate(async () => {
      const { motifSvg, bitsDuSvg, APLAT } = await import('/assets/bicolore-fonds.js');
      const svg = document.querySelector('#renderTarget svg');
      const principal = bitsDuSvg(svg.outerHTML);
      const sel = window.selecteurFonds;
      const etat = sel.etat();
      const fen = sel.fenetre();
      const ech = [...document.querySelectorAll('.sf-liste svg.sf-ech')].map((s) => [...s.querySelectorAll('use')].map((u) => Number(u.getAttribute('href').slice(-1))));
      return { principal, fen, ech, aplat: bitsDuSvg(motifSvg(principal, ['#000', '#fff'], APLAT)), etat: { fond: etat.fond, sup: etat.superposition } };
    });
    if (lu.principal.length !== 144) echec(`${ici} : ${lu.principal.length} cases relues dans le rendu principal`);
    else if (lu.principal.some((b, i) => b !== lu.aplat[i])) echec(`${ici} : le fond change le masque`);
    const attendu = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) attendu.push(lu.principal[((lu.fen.ligne + i) % 12) * 12 + ((lu.fen.colonne + j) % 12)]);
    lu.ech.forEach((e, k) => { if (e.join('') !== attendu.join('')) echec(`${ici} : l'échantillon ${k} ne montre pas la fenêtre du motif en cours`); });
    if (Math.abs(lu.fen.uns - 8) > 2) echec(`${ici} : fenêtre déséquilibrée (${lu.fen.uns} / 16)`);
    // 3
    const metas = await p.$$eval('.sf-liste [role=group]', (gs) => gs.map((g) => ({ groupe: g.querySelector('.sf-groupe').textContent, metas: [...g.querySelectorAll('.sf-meta')].map((m) => m.textContent) })));
    for (const g of metas) {
      for (const m of g.metas) {
        const contraste = /contraste|contrast/.test(m);
        const permis = /quantit|superposition|overlay/i.test(g.groupe) || /^(quantité|quantity)/.test(m);
        if (contraste && !permis) echec(`${ici} : contraste affiché dans « ${g.groupe} » : ${m}`);
        if (/orientation/.test(m) && contraste) echec(`${ici} : contraste sur une ligne d'orientation : ${m}`);
      }
    }
    // 4
    await p.click('.sf-bouton');
    const ouvert = await p.$eval('.sf-liste', (l) => !l.hidden);
    const avant = await p.$eval('.sf-liste', (l) => l.getAttribute('aria-activedescendant'));
    await p.keyboard.press('ArrowDown');
    const apres = await p.$eval('.sf-liste', (l) => l.getAttribute('aria-activedescendant'));
    // 5 (liste ouverte : la mise en page des lignes est comptée)
    const mesures = await p.evaluate(() => { const r = []; for (let i = 0; i < 20; i++) r.push(window.selecteurFonds.redessinComplet()); return r.sort((x, y) => x - y); });
    const ms = mesures[Math.floor(mesures.length / 2)], pire = mesures[mesures.length - 1];
    await p.keyboard.press('Escape');
    const ferme = await p.$eval('.sf-liste', (l) => l.hidden);
    const debord = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (!ouvert || avant === apres || !ferme) echec(`${ici} : ouverture ${ouvert}, parcours ${avant} → ${apres}, fermeture ${ferme}`);
    if (debord) echec(`${ici} : défilement horizontal`);
    if (ms >= 100) echec(`${ici} : redessin complet ${ms.toFixed(1)} ms (médiane de 20)`);
    if (erreurs.length) echec(`${ici} : erreurs ${erreurs.join(' | ')}`);
    console.log(`${ici} : composant ${[...scripts].join()} · état ${lu.etat.fond}+${lu.etat.sup} · fenêtre (${lu.fen.ligne}, ${lu.fen.colonne}) ${lu.fen.uns}/16 · ${lu.ech.length} échantillons identiques à la fenêtre · masque inchangé · clavier ${avant} → ${apres} · redessin complet ${ms.toFixed(1)} ms (médiane de 20, pire ${pire.toFixed(1)} ms)`);
    await p.close();
  }
}
await navigateur.close();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nSélecteur de fond conforme sur ${BASE}.`);
