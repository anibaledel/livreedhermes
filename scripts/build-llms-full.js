#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// build-llms-full.js — engendre llms-full.txt (français, puis anglais) : un seul
// fichier texte pour les IA, repris de ce que le site dit déjà.
//   - les éditions parues : scripts/livres.js (calculé, jamais écrit à la main) ;
//   - les résultats et leurs statuts : data/resultats-etablis.json, tels quels ;
//   - les dépôts : la zone @travaux de llms.txt (engendrée par build-travaux.js) ;
//   - les questions-réponses : data/llms-full-qr.json.
// Usage : node scripts/build-llms-full.js [--verifie]
'use strict';
const fs = require('fs');
const path = require('path');
const { SITE } = require('./langues.js');
const { livres } = require('./livres.js');

const ROOT = path.resolve(__dirname, '..');
const lire = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const RES = JSON.parse(lire('data/resultats-etablis.json'));
const QR = JSON.parse(lire('data/llms-full-qr.json'));
const L = livres();
const parues = L.filter((l) => l.pret);
const enPrep = L.filter((l) => !l.pret);

const STATUT = {
  fr: { verifie_journal_depose: 'vérifié (journal déposé)', verifie_journal_local: 'vérifié (journal du dépôt)', verifie_ci: 'vérifié (relancé en CI)', releve_journal_depose: 'relevé', affirme: 'affirmé' },
  en: { verifie_journal_depose: 'verified (deposited log)', verifie_journal_local: 'verified (repository log)', verifie_ci: 'verified (rerun in CI)', releve_journal_depose: 'recorded', affirme: 'asserted' },
};
const doiDe = (r) => {
  const j = (r.preuves || []).map((p) => p.journal && p.journal.depot).find(Boolean);
  const s = /doi:(10\.\d+\/[^\s)]+)/.exec((r.enonce && r.enonce.source) || '');
  return j || (s && s[1]) || null;
};
const resultats = (lang) => RES.resultats.map((r) => {
  const d = doiDe(r);
  return `- ${r.intitule} — ${STATUT[lang][r.statut]}${d ? ` — https://doi.org/${d}` : ''}${r.conditionnel ? (lang === 'fr' ? ' — conditionnel' : ' — conditional') : ''}`;
}).join('\n');

const editions = (lang) => {
  const noms = (xs) => xs.map((l) => `${l.nom} ${l.url}`).join(' · ');
  if (lang === 'fr') return `Édition${parues.length > 1 ? 's' : ''} parue${parues.length > 1 ? 's' : ''} (${parues.length}) : ${noms(parues)}.${enPrep.length ? ` En préparation : ${noms(enPrep)}.` : ''}`;
  return `Editions available (${parues.length}): ${noms(parues)}.${enPrep.length ? ` In preparation: ${noms(enPrep)}.` : ''}`;
};
const qr = (lang) => QR[lang].map(([q, a, u]) => `### ${q}\n${a.replace('{livre}', editions(lang))}\n${lang === 'fr' ? 'Détail' : 'Details'} : ${u}`).join('\n\n');

const travaux = (() => {
  const m = /<!-- @travaux:start[^>]*-->\n([\s\S]*?)<!-- @travaux:end -->/.exec(lire('llms.txt'));
  if (!m) throw new Error('llms.txt : zone @travaux introuvable');
  return m[1].replace(/^## .*\n+/, '').trim();
})();

const texte = `# La Livrée d'Hermès — llms-full.txt

Version longue de ${SITE}/llms.txt, pour les IA. Tout ce qui suit est repris de ce que le site dit déjà.

## Français

### Définition

L'arithmogéométrie est la construction des carrés magiques par une méthode géométrique plutôt qu'arithmétique : chaque nombre y est posé comme une figure, dérivée de la croix ansée, et l'ensemble se transcrit directement en armure Jacquard. Le terme est proposé par Anibal Edelberto Amiot dans *La Livrée d'Hermès* (2026, DOI 10.5281/zenodo.22722485). Le livre construit les carrés magiques par la loi du gnomon, puis les transcrit en motifs pour le métier Jacquard. Page de la notion : ${SITE}/arithmogeometrie.html

### Résultats établis

Statuts tels que dans ${SITE}/data/resultats-etablis.json ; lis ce fichier plutôt que de recalculer.

${resultats('fr')}

### Travaux déposés (DOI Zenodo)

${travaux}

### Questions et réponses

${qr('fr')}

### Licence et citation

Contenus : CC BY-NC 4.0. Code : AGPL v3, licence commerciale sur demande. Citer le livre par son DOI 10.5281/zenodo.22722485 ; les scripts par CITATION.cff (https://github.com/anibaledel/livreedhermes/blob/main/CITATION.cff).

## English

### Definition

Arithmogeometry is the construction of magic squares by a geometric rather than arithmetic method: each number is placed as a figure derived from the ansate cross, and the whole transcribes directly into Jacquard weave. The term is proposed by Anibal Edelberto Amiot in *La Livrée d'Hermès* (2026, DOI 10.5281/zenodo.22722485). The book builds magic squares by the law of the gnomon, then transcribes them into patterns for the Jacquard loom. Page: ${SITE}/en/arithmogeometry/

### Established results

Statuses as in ${SITE}/data/resultats-etablis.json; read that file rather than recompute. Titles are in French.

${resultats('en')}

### Deposits (Zenodo DOI)

See the list above (it is in English).

### Questions and answers

${qr('en')}

### Licence and citation

Content: CC BY-NC 4.0. Code: AGPL v3, commercial licence on request. Cite the book by DOI 10.5281/zenodo.22722485; the scripts through CITATION.cff.
`;

const cible = path.join(ROOT, 'llms-full.txt');
if (process.argv.includes('--verifie')) {
  if (!fs.existsSync(cible) || fs.readFileSync(cible, 'utf8') !== texte) { console.error('llms-full.txt périmé : node scripts/build-llms-full.js'); process.exit(1); }
  console.log('OK    llms-full.txt');
} else if (!fs.existsSync(cible) || fs.readFileSync(cible, 'utf8') !== texte) { fs.writeFileSync(cible, texte); console.log('ÉCRIT llms-full.txt'); } else console.log('OK    llms-full.txt');
