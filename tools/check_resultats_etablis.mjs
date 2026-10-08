#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_resultats_etablis.mjs — data/resultats-etablis.json dit-il vrai sur ses preuves ?
//
// Le fichier des résultats est écrit à la main : ce contrôle ne le réécrit pas,
// il relit chaque preuve qu'il invoque et ÉCHOUE sur le premier écart.
//   - un statut « verifie_journal_depose » : chaque journal invoqué a une copie
//     dans ce dépôt, dont le MD5 est celui que l'instantané Zenodo
//     (data/zenodo/depots.json) enregistre pour ce fichier ; chaque ligne citée
//     est, à la lettre, une ligne entière de cette copie ;
//   - un statut « verifie_journal_local » : pas de journal déposé, mais un
//     journal d'exécution versé dans docs/journaux/, dont l'empreinte est celle
//     déclarée ; le script qui l'a produit a encore l'empreinte déclarée (sinon
//     le journal est périmé : relancer, reverser) ; chaque ligne citée y est ;
//   - un statut « verifie_ci » : pas de journal déposé, mais le script nommé
//     existe et un workflow de .github/workflows/ le lance (« run: node|python
//     <chemin> ») ; c'est lui qui échoue si le résultat ne tient plus ;
//   - un statut « releve_journal_depose » : la ligne a été relevée hors d'ici
//     (champ releve obligatoire) ; le journal n'est pas encore versé. Imprimé
//     EN ATTENTE, n'échoue pas ;
//   - un statut « affirme » : aucune preuve, et le fichier ne doit pas en
//     invoquer ;
//   - le script nommé existe, et s'il est déposé, son octet est l'octet
//     déposé (même MD5), nommément ;
//   - les référents existent dans data/referents.json, les données dans le dépôt ;
//   - un énoncé est recopié (et alors présent, à l'espacement près, dans sa
//     copie quand il en nomme une) ou marqué SANS SOURCE, jamais vide sans le dire ;
//   - les comptes de « statuts » sont ceux des résultats ;
//   - chiffres-et-sources.html : chaque ligne de son tableau a un résultat
//     (champ page, énoncé = la cellule « Ce qu'il énonce », à la lettre), et
//     sa version anglaise a autant de lignes ; chaque bloc « sortie » de la page
//     (FR et EN) est un extrait AU CARACTÈRE du journal de son script
//     (JOURNAUX_PAGE) : chaque ligne y est une ligne entière, dans l'ordre ; seule
//     exception, une ligne coupée franchement par « … » (le début d'une ligne du
//     journal) et le nombre d'une durée (« temps 180s »), qui dépend de la machine.
//
// Usage : node tools/check_resultats_etablis.mjs           contrôle
//         node tools/check_resultats_etablis.mjs --essai   fausse une ligne, puis une empreinte, et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lire = (rel) => fs.readFileSync(path.join(RACINE, rel));
const json = (rel) => JSON.parse(lire(rel).toString('utf8'));
const existe = (rel) => fs.existsSync(path.join(RACINE, rel));
const md5 = (rel) => crypto.createHash('md5').update(lire(rel)).digest('hex');
const sha256 = (rel) => crypto.createHash('sha256').update(lire(rel)).digest('hex');
// les lignes du tableau d'une page de chiffres : [chiffre, énoncé]
const lignesTableau = (rel) => [...lire(rel).toString('utf8').matchAll(/<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>/g)].map((m) => [m[1], m[2]]);
const PAGES = { 'chiffres-et-sources.html': 'en/figures-and-sources/index.html' };
// le journal dont chaque bloc « sortie » de la page est un extrait, par script
const JOURNAUX_PAGE = {
  'tools/croix_ansee.py': 'docs/journaux/2026-10-07/croix_ansee.log',
  'tools/enum_criteres.py': 'docs/journaux/2026-10-07/enum_criteres.log',
  'tools/verif_protocole.py': 'docs/journaux/2026-10-08/verif_protocole.log',
  'tools/cube_edges.py': 'docs/sources/2026-10-07/demi-decalage-v2/cube_edges.log',
};
const texteHtml = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const sansDuree = (l) => l.replace(/temps \d+(\.\d+)?\s?s\b/g, 'temps …s');
// les blocs « sortie » d'une page, chacun avec le script de la commande qui le précède
function blocsSortie(html) {
  return [...html.matchAll(/<p class="commande">\s*(?:python3?|node)\s+([^\s<]+)[\s\S]*?<\/p>\s*<pre class="sortie">([\s\S]*?)<\/pre>/g)].map((m) => ({ script: m[1], lignes: texteHtml(m[2]).split('\n') }));
}
// les lignes du bloc qui ne sont pas, dans l'ordre, des lignes du journal
function horsJournal(bloc, journal) {
  const j = journal.split('\n').map(sansDuree);
  let k = 0;
  const fautes = [];
  for (const brute of bloc) {
    if (!brute.trim()) continue;
    const l = sansDuree(brute);
    const coupe = l.endsWith('…') && !l.endsWith('(…)');
    const i = j.findIndex((x, n) => n >= k && (coupe ? x.startsWith(l.slice(0, -1)) : x === l));
    if (i < 0) fautes.push(brute); else k = i + 1;
  }
  return fautes;
}
const STATUTS = ['verifie_journal_depose', 'verifie_journal_local', 'verifie_ci', 'releve_journal_depose', 'affirme'];
// les commandes lancées par la CI, une par ligne « run: »
const WORKFLOWS = fs.readdirSync(path.join(RACINE, '.github/workflows')).filter((f) => /\.ya?ml$/.test(f))
  .map((f) => [`.github/workflows/${f}`, lire(`.github/workflows/${f}`).toString('utf8')]);
const lancePar = (chemin) => WORKFLOWS.filter(([, t]) => new RegExp(`run:\\s*(node|python3?)\\s+${chemin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'm').test(t)).map(([f]) => f);

const referents = new Set(json('data/referents.json').referents.map((r) => r.id));
// enregistrement Zenodo → { fichier → md5 } pour les dernières versions de l'instantané
const instantane = new Map();
for (const d of json('data/zenodo/depots.json').depots) {
  const id = String(d.versionDoi_reel || '').replace(/^10\.5281\/zenodo\./, '');
  if (id) instantane.set(id, new Map((d.fichiers || []).map((f) => [f.nom, String(f.checksum).replace(/^md5:/, '')])));
}

function controler(doc) {
  const ecarts = [], attente = [], vus = new Set();
  const preuvesDe = (r) => [...(r.preuves || []), ...(r.branches || []).flatMap((b) => b.preuves || [])];
  for (const r of doc.resultats) {
    const ici = `${r.id}`;
    if (vus.has(r.id)) ecarts.push(`${ici} : id en double`);
    vus.add(r.id);
    if (!STATUTS.includes(r.statut)) ecarts.push(`${ici} : statut inconnu « ${r.statut} »`);
    // énoncé
    const e = r.enonce || {};
    if (!e.texte && !e.sans_source) ecarts.push(`${ici} : énoncé vide sans la mention SANS SOURCE`);
    if (e.texte && e.copie) {
      const plat = (s) => s.replace(/\s+/g, ' ');
      if (!existe(e.copie)) ecarts.push(`${ici} : copie de l'énoncé introuvable (${e.copie})`);
      else if (!plat(lire(e.copie).toString('utf8')).includes(plat(e.texte))) ecarts.push(`${ici} : l'énoncé n'est pas, à la lettre, dans ${e.copie}`);
    }
    // conditionnel
    if (r.conditionnel && !(r.branches || []).length) ecarts.push(`${ici} : conditionnel sans branches`);
    for (const b of r.branches || []) if (!b.condition) ecarts.push(`${ici} : branche sans condition`);
    // référents et données
    for (const id of r.referents || []) if (!referents.has(id)) ecarts.push(`${ici} : référent « ${id} » absent de data/referents.json`);
    for (const d of r.donnees || []) if (!existe(d)) ecarts.push(`${ici} : donnée introuvable (${d})`);
    // script
    const scripts = r.script ? [r.script, ...(r.script.aussi ? [r.script.aussi] : [])] : [];
    for (const s of scripts) {
      if (s.chemin && !existe(s.chemin)) ecarts.push(`${ici} : script introuvable (${s.chemin})`);
      if (s.chemin && existe(s.chemin) && s.depose?.md5) {
        const m = md5(s.chemin);
        if (m !== s.depose.md5) ecarts.push(`${ici} : ${s.chemin} n'est pas l'octet déposé (${m}, déposé ${s.depose.md5})`);
        const z = instantane.get(s.depose.enregistrement);
        if (z && z.get(s.depose.fichier) !== s.depose.md5) ecarts.push(`${ici} : l'instantané Zenodo ne donne pas ${s.depose.md5} pour ${s.depose.fichier} (${s.depose.enregistrement})`);
      }
    }
    // preuves
    const preuves = preuvesDe(r);
    if (r.statut === 'affirme' && preuves.length) ecarts.push(`${ici} : « affirme » mais invoque ${preuves.length} preuve(s)`);
    if (r.statut !== 'affirme' && !preuves.length) ecarts.push(`${ici} : « ${r.statut} » sans preuve`);
    if (r.statut === 'releve_journal_depose') {
      if (!r.releve?.par || !r.releve?.le) ecarts.push(`${ici} : relevé sans « par » ni « le »`);
      else attente.push(`${ici} : ${preuves.map((p) => `${p.journal.fichier} (${p.journal.enregistrement})`).join(', ')} — relevé par Anibal le ${r.releve.le}, journal pas encore versé`);
    }
    if (r.statut === 'verifie_ci') {
      const chemin = r.script?.chemin;
      if (!chemin) ecarts.push(`${ici} : « verifie_ci » sans script`);
      else {
        const wf = lancePar(chemin);
        if (!wf.length) ecarts.push(`${ici} : « verifie_ci » mais aucun workflow ne lance ${chemin}`);
        for (const p of preuves) if (p.ci && !wf.includes(p.ci)) ecarts.push(`${ici} : ${p.ci} ne lance pas ${chemin} (lancé par : ${wf.join(', ') || 'aucun'})`);
      }
    }
    for (const p of preuves) {
      const j = p.journal || {};
      if (!(p.lignes || []).length) ecarts.push(`${ici} : preuve sans ligne imprimée (${j.fichier ?? p.journal_local?.fichier ?? p.ci})`);
      if (r.statut === 'verifie_journal_local') {
        const l = p.journal_local;
        if (!l) { ecarts.push(`${ici} : « verifie_journal_local » sans journal_local`); continue; }
        if (!existe(l.fichier)) { ecarts.push(`${ici} : journal local introuvable (${l.fichier})`); continue; }
        if (sha256(l.fichier) !== l.sha256) ecarts.push(`${ici} : ${l.fichier} a changé (sha256 ${sha256(l.fichier).slice(0, 12)}…, déclaré ${String(l.sha256).slice(0, 12)}…)`);
        if (!l.machine || !l.le) ecarts.push(`${ici} : journal local sans machine ni date (${l.fichier})`);
        if (!existe(l.script)) ecarts.push(`${ici} : script du journal introuvable (${l.script})`);
        else if (sha256(l.script) !== l.script_sha256) ecarts.push(`${ici} : ${l.script} a changé depuis ${l.fichier} — journal périmé : relancer le script, reverser le journal, relire les lignes`);
        const lignes = new Set(lire(l.fichier).toString('utf8').split('\n'));
        for (const x of p.lignes || []) if (!lignes.has(x)) ecarts.push(`${ici} : ligne absente de ${l.fichier} : « ${x.trim().slice(0, 90)} »`);
        continue;
      }
      if (r.statut !== 'verifie_journal_depose') continue;
      if (!j.copie || !j.md5) { ecarts.push(`${ici} : « verifie_journal_depose » mais ${j.fichier} n'a pas de copie ou d'empreinte`); continue; }
      const z = instantane.get(j.enregistrement);
      if (!z) ecarts.push(`${ici} : l'enregistrement ${j.enregistrement} n'est pas dans l'instantané Zenodo`);
      else if (z.get(j.fichier) !== j.md5) ecarts.push(`${ici} : l'instantané Zenodo donne ${z.get(j.fichier) ?? 'aucun fichier'} pour ${j.fichier} (${j.enregistrement}), le résultat dit ${j.md5}`);
      if (!existe(j.copie)) { ecarts.push(`${ici} : copie du journal introuvable (${j.copie})`); continue; }
      const m = md5(j.copie);
      if (m !== j.md5) ecarts.push(`${ici} : la copie ${j.copie} a pour MD5 ${m}, le journal déposé ${j.md5}`);
      const lignes = new Set(lire(j.copie).toString('utf8').split('\n'));
      for (const l of p.lignes || []) if (!lignes.has(l)) ecarts.push(`${ici} : ligne absente de ${j.copie} : « ${l.trim().slice(0, 90)} »`);
    }
  }
  for (const [page, traduite] of Object.entries(PAGES)) {
    const lignes = lignesTableau(page);
    const enonces = new Set(doc.resultats.filter((r) => r.page === page).map((r) => r.enonce?.texte));
    for (const [chiffre, texte] of lignes) if (!enonces.has(texte)) ecarts.push(`${page} : la ligne « ${chiffre} » n'a pas de résultat dans data/resultats-etablis.json`);
    const n = lignesTableau(traduite).length;
    if (n !== lignes.length) ecarts.push(`${traduite} : ${n} lignes de tableau, ${page} en a ${lignes.length}`);
    for (const f of [page, traduite]) {
      for (const b of blocsSortie(doc._pages?.[f] ?? lire(f).toString('utf8'))) {
        const journal = JOURNAUX_PAGE[b.script];
        if (!journal) { if (b.script.startsWith('tools/')) ecarts.push(`${f} : la sortie de ${b.script} n'a pas de journal de référence (JOURNAUX_PAGE)`); continue; }
        for (const l of horsJournal(b.lignes, lire(journal).toString('utf8'))) ecarts.push(`${f} : sortie de ${b.script} — ligne qui n'est pas, au caractère et dans l'ordre, une ligne de ${journal} : « ${l.slice(0, 90)} »`);
      }
    }
  }
  for (const s of STATUTS) {
    const n = doc.resultats.filter((r) => r.statut === s).length;
    if ((doc.statuts || {})[s] !== n) ecarts.push(`statuts.${s} : le fichier dit ${(doc.statuts || {})[s]}, les résultats en comptent ${n}`);
  }
  return { ecarts, attente };
}

const doc = json('data/resultats-etablis.json');

if (process.argv.includes('--essai')) {
  let ok = true;
  const essais = [
    ['une ligne imprimée retouchée', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_journal_depose' && x.preuves?.length); r.preuves[0].lignes[0] = r.preuves[0].lignes[0].replace(/\d+/, (n) => String(Number(n) + 1)); }, /ligne absente/],
    ['une empreinte de journal faussée', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_journal_depose' && x.preuves?.length); r.preuves[0].journal.md5 = '0'.repeat(32); }, /MD5|instantané Zenodo donne/],
    ['un résultat affirmé promu sans journal', (d) => { const r = d.resultats.find((x) => x.statut === 'affirme'); r.statut = 'verifie_journal_depose'; d.statuts.affirme--; d.statuts.verifie_journal_depose++; }, /sans preuve/],
    ['un résultat vérifié en CI par un script qu\'aucun workflow ne lance', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_ci'); r.script = { ...r.script, chemin: 'tools/hors-ci.mjs' }; }, /aucun workflow ne lance|ne lance pas/],
    ['un journal local dont la ligne citée est retouchée', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_journal_local'); r.preuves[0].lignes[0] += ' '; }, /ligne absente/],
    ['un chiffre de la page sans résultat', (d) => { d.resultats = d.resultats.filter((x) => x.id !== 'carter-256-bits'); d.statuts.affirme--; }, /n'a pas de résultat/],
    ['une sortie de la page réécrite', (d) => { d._pages = { 'chiffres-et-sources.html': lire('chiffres-et-sources.html').toString('utf8').replace('2×2 sous le même protocole (constante 870)', '2×2 (constante 870)') }; }, /pas, au caractère/],
    ['un énoncé vidé sans SANS SOURCE', (d) => { d.resultats[0].enonce = { texte: null }; }, /SANS SOURCE/],
  ];
  for (const [nom, fausser, attendu] of essais) {
    const d = JSON.parse(JSON.stringify(doc));
    fausser(d);
    const { ecarts } = controler(d);
    const refuse = ecarts.some((e) => attendu.test(e));
    console.log(`${refuse ? 'refusé' : 'ACCEPTÉ'} : ${nom}${ecarts[0] ? ` — ${ecarts[0]}` : ''}`);
    ok &&= refuse;
  }
  if (!ok) { console.error('ÉCHEC de l\'essai : un fichier faussé est accepté.'); process.exit(1); }
  console.log('Essai : les huit falsifications sont refusées.');
  process.exit(0);
}

const { ecarts, attente } = controler(doc);
console.log(`${doc.resultats.length} résultats : ${STATUTS.map((s) => `${s} ${doc.resultats.filter((r) => r.statut === s).length}`).join(', ')}.`);
for (const a of attente) console.log(`  EN ATTENTE (n'échoue pas) : ${a}`);
if (ecarts.length) {
  for (const e of ecarts) console.error(`ÉCART ${e}`);
  console.error(`\n${ecarts.length} écart(s) dans data/resultats-etablis.json. Le fichier ne se corrige pas d'ici : relire la preuve, puis décider.`);
  process.exit(1);
}
console.log('Chaque preuve invoquée est relue : lignes à la lettre, empreintes déposées.');
