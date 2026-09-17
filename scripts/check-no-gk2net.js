#!/usr/bin/env node
/* Vérifie qu'aucun fichier suivi par git ne mentionne "gk2.net" en dehors des
   fichiers d'infrastructure où c'est le nom réel de l'hébergeur (ALLOWLIST
   ci-dessous). Cette mention a été retirée du site le 2026-09-16 (PR #37,
   footer de toutes les pages) et a déjà manqué revenir deux fois par le même
   chemin, scripts/generate-hexagram-pages.js (corrigé le 2026-09-17) — d'où
   ce garde-fou, appelé en fin de génération et par
   .github/workflows/check-no-gk2net.yml sur chaque push/PR. */
const { execSync } = require('child_process');

const ALLOWLIST = new Set([
  '.htaccess',                    // décrit l'hébergeur réel (mod_rewrite/mod_headers)
  'worker/README.md',             // décrit l'hébergeur réel du site statique
  'scripts/check-no-gk2net.js',           // ce fichier — la chaîne y figure par nécessité
  'scripts/generate-hexagram-pages.js',   // appelle ce garde-fou, en parle dans ses messages
]);

let output = '';
try {
  output = execSync('git grep -n --fixed-strings "gk2.net"', { encoding: 'utf8' });
} catch (e) {
  if (e.status === 1) {
    console.log('OK : aucune mention de gk2.net dans le dépôt.');
    process.exit(0);
  }
  console.error(e.stderr || e.message);
  process.exit(2);
}

const offending = output.split('\n').filter(Boolean).filter(line => {
  const file = line.split(':')[0];
  return !ALLOWLIST.has(file);
});

if (offending.length === 0) {
  console.log(`OK : gk2.net n'apparaît que dans les fichiers autorisés (${[...ALLOWLIST].join(', ')}).`);
  process.exit(0);
}

console.error('gk2.net trouvé hors de la liste autorisée — cette mention a été retirée du site (PR #37), elle ne doit pas revenir :\n');
offending.forEach(l => console.error('  ' + l));
console.error("\nSi cette occurrence est légitime (nouveau fichier décrivant l'hébergeur réel), ajoute-le à ALLOWLIST dans scripts/check-no-gk2net.js.");
process.exit(1);
