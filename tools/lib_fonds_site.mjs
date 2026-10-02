// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// lib_fonds_site.mjs — Outils partagés par l'export Pinterest des fonds et
// par sa vérification : un petit serveur statique du dépôt (les modules ES
// du site s'importent par HTTP, comme sur le site), les 256 lignes
// canoniques de data/motifs-index.csv, et la grille qu'une page de motif
// affiche (son bloc motifDataJSON — la même source que la page).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.gif': 'image/gif', '.ico': 'image/x-icon' };

export function servirDepot(racine) {
  return new Promise((ok) => {
    const serveur = createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = path.join(racine, p);
      if (!f.startsWith(racine)) { res.writeHead(403); res.end(); return; }
      if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(readFileSync(f));
    });
    serveur.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${serveur.address().port}`, fermer: () => serveur.close() }));
  });
}

// Les 256 entrées du corpus : les lignes de data/motifs-index.csv qui ont
// une page. { fichier, page }.
export function lignesCanoniques(racine) {
  const [tete, ...lignes] = readFileSync(path.join(racine, 'data/motifs-index.csv'), 'utf8').trim().split('\n');
  const cols = tete.split(',');
  const iF = cols.indexOf('fichier'), iP = cols.indexOf('page');
  const out = lignes.map((l) => l.split(',')).filter((c) => c[iP]).map((c) => ({ fichier: c[iF], page: c[iP] }));
  if (out.length !== 256) throw new Error(`${out.length} entrées canoniques dans motifs-index.csv, 256 attendues`);
  return out;
}

export function grilleDeLaPage(racine, page) {
  const html = readFileSync(path.join(racine, page), 'utf8');
  return JSON.parse(html.match(/<script id="motifDataJSON" type="application\/json">(.*?)<\/script>/s)[1]).grille_polarite_yang;
}
