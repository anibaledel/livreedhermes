#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
//
// Preuve, sur une exécution réelle (pas seulement une lecture de code), que
// le worker déployé (POST /export-bicolore) et le "client" (fetch du même
// JSON + import du même module de rendu, sans bundler) produisent le MÊME
// SVG pour la MÊME composition — le critère explicitement demandé : source
// unique, pas de copie manuelle des bitmasks dans le bundle du worker.
//
// Marche à suivre :
//   1. `wrangler deploy --dry-run --outdir` bundle réellement le worker
//      (esbuild, comme un vrai déploiement) — Stripe, le JSON des calques et
//      assets/bicolore-render.js finissent tous dans le même fichier.
//   2. Ce bundle est chargé dans Miniflare (le moteur local de wrangler dev),
//      avec un jeton "pro" factice écrit directement dans son SOUTIEN_KV
//      local — jamais le KV de production.
//   3. Le "rendu client" appelle composeSvg() directement en Node, sur le
//      MÊME fichier data/referent_bicolore_v1.json lu tel quel (ce que fait
//      un fetch() côté navigateur) et le MÊME assets/bicolore-render.js
//      (celui-ci n'a aucun import "bare specifier", donc Node le charge sans
//      bundler — au contraire du worker, qui importe aussi 'stripe').
//
// `node test_export_bicolore.mjs` — code de sortie non nul si le rendu
// diffère ou si une assertion échoue.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Miniflare } from 'miniflare';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.dirname(HERE);

const COMPOSITION = {
  niveaux: [
    { famille: 'YIN', teinte: 'yang' },
    { famille: 'YIN+YANG', teinte: 'yin' },
    { famille: 'YANG-MUT', teinte: 'yang' },
    { famille: 'YIN+YIN-MUT+YANG+YANG-MUT', teinte: 'yin' },
    { famille: 'YANG', teinte: 'yang' },
    { famille: 'YIN-MUT+YANG-MUT', teinte: 'yin' },
  ],
  palette: ['#111111', '#eeeeee'],
};

const FAKE_TOKEN = 'test-token-export-bicolore';

function bundleWorker() {
  // Sous le répertoire du worker plutôt que le tmp système : workerd
  // refuse de résoudre un scriptPath qui remonte trop de niveaux ("..")
  // hors de son répertoire de départ.
  const tmpRoot = path.join(HERE, '.tmp-bundle');
  mkdirSync(tmpRoot, { recursive: true });
  const outdir = mkdtempSync(path.join(tmpRoot, 'bundle-'));
  // shell: true est nécessaire sous Windows (wrangler.cmd) ; les arguments
  // sont fixes ici (aucune entrée utilisateur), pas de risque d'injection.
  execFileSync(
    'npx',
    ['wrangler', 'deploy', '--dry-run', '--outdir', outdir],
    { cwd: HERE, stdio: 'pipe', shell: true }
  );
  return outdir;
}

async function renderClientSide() {
  const { composeSvg } = await import(
    pathToFileURL(path.join(REPO_ROOT, 'assets', 'bicolore-render.js'))
  );
  const calques = JSON.parse(
    readFileSync(path.join(REPO_ROOT, 'data', 'referent_bicolore_v1.json'), 'utf-8')
  );
  return composeSvg(calques, COMPOSITION);
}

async function renderWorkerSide(outdir) {
  const mf = new Miniflare({
    modules: true,
    scriptPath: path.join(outdir, 'index.js'),
    compatibilityDate: '2024-11-01',
    compatibilityFlags: ['nodejs_compat'],
    kvNamespaces: ['SOUTIEN_KV'],
    bindings: {
      STRIPE_MIN_AMOUNT_CENTS: '100',
      ALLOWED_ORIGIN: 'https://anibal-amiot.com',
      STRIPE_PRO_PRICE_CENTS: '9900',
      STRIPE_SECRET_KEY: 'sk_test_unused',
      STRIPE_WEBHOOK_SECRET: 'whsec_unused',
    },
  });
  try {
    const kv = await mf.getKVNamespace('SOUTIEN_KV');
    await kv.put(
      `token:${FAKE_TOKEN}`,
      JSON.stringify({ createdAt: Date.now(), sessionId: 'test', tier: 'pro', paymentIntent: null })
    );

    const res = await mf.dispatchFetch('http://worker.local/export-bicolore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: FAKE_TOKEN, scope: 'cell', composition: COMPOSITION }),
    });
    if (res.status !== 200) {
      throw new Error(`worker a répondu ${res.status} : ${await res.text()}`);
    }
    if (res.headers.get('Content-Type') !== 'image/svg+xml') {
      throw new Error(`Content-Type inattendu : ${res.headers.get('Content-Type')}`);
    }
    return await res.text();
  } finally {
    await mf.dispose();
  }
}

async function main() {
  const outdir = bundleWorker();
  try {
    const [clientSvg, workerSvg] = await Promise.all([
      renderClientSide(),
      renderWorkerSide(outdir),
    ]);

    if (clientSvg !== workerSvg) {
      console.error('ÉCHEC : le rendu worker diffère du rendu client, pour la même composition.');
      console.error('client  (%d octets) :', clientSvg.length, clientSvg.slice(0, 200));
      console.error('worker  (%d octets) :', workerSvg.length, workerSvg.slice(0, 200));
      process.exitCode = 1;
      return;
    }
    console.log(`OK : rendu client == rendu worker, octet pour octet (${clientSvg.length} octets).`);
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('ÉCHEC :', e);
  process.exitCode = 1;
});
