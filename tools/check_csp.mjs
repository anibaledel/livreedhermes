/* ============================================================
   Politique de sécurité du contenu (CSP) des pages sensibles : l'encodeur
   (chiffrement dans le navigateur) et les deux pages de paiement.

   Chaque page porte, juste après <meta charset>, une balise
   <meta http-equiv="Content-Security-Policy"> qui n'autorise que :
     - les scripts du site lui-même, et ses scripts en ligne désignés par
       leur empreinte SHA-256 (pas de 'unsafe-inline' pour les scripts : un
       script injecté ne s'exécuterait pas) ;
     - les connexions vers le site et vers le Worker de paiement ;
     - aucun objet embarqué, aucune balise <base> étrangère.
   Les styles en ligne (attributs style="…") restent permis : ils ne
   peuvent pas exécuter de code.

   Les empreintes dépendent du texte exact de chaque script en ligne : ce
   contrôle les recalcule et échoue si la balise est périmée.

   Usage : node tools/check_csp.mjs           échoue si une page est périmée
           node tools/check_csp.mjs --ecrit   réécrit les balises
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['encodeur.html', 'soutenir.html', 'soutien-succes.html'];
const WORKER = 'https://livreedhermes-soutien.anibalamiot.workers.dev';

// Scripts exécutés par le navigateur : sans type, ou de type JavaScript /
// module. Les blocs JSON-LD (application/ld+json) ne s'exécutent pas.
const EXECUTABLE = /^(|text\/javascript|application\/javascript|module)$/i;

function empreintes(html) {
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\ssrc\s*=/.test(attrs)) continue;
    const type = (/\stype\s*=\s*"([^"]*)"/i.exec(attrs) || [, ''])[1];
    if (!EXECUTABLE.test(type)) continue;
    // Le navigateur calcule l'empreinte sur le texte tel que l'analyseur HTML
    // le voit : fins de ligne normalisées en LF.
    const texte = m[2].replace(/\r\n?/g, '\n');
    out.push(`'sha256-${createHash('sha256').update(texte, 'utf8').digest('base64')}'`);
  }
  return [...new Set(out)];
}

function politique(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${WORKER}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const BALISE = /<meta http-equiv="Content-Security-Policy" content="[^"]*">\r?\n?/;
let perimees = 0;
for (const page of PAGES) {
  const fichier = path.join(ROOT, page);
  const html = readFileSync(fichier, 'utf8');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const attendue = `<meta http-equiv="Content-Security-Policy" content="${politique(empreintes(html))}">`;
  const actuelle = (BALISE.exec(html) || [''])[0].trim();
  if (actuelle === attendue) {
    console.log(`OK    ${page}`);
    continue;
  }
  if (process.argv.includes('--ecrit')) {
    const sansBalise = html.replace(BALISE, '');
    const ecrit = sansBalise.replace(/(<meta charset="[^"]*">\r?\n)/i, `$1${attendue}${nl}`);
    if (ecrit === sansBalise) throw new Error(`${page} : <meta charset> introuvable`);
    writeFileSync(fichier, ecrit);
    console.log(`ÉCRIT ${page}`);
  } else {
    perimees++;
    console.error(`PÉRIMÉE ${page}`);
  }
}
if (perimees) {
  console.error('Relancer : node tools/check_csp.mjs --ecrit');
  process.exit(1);
}
