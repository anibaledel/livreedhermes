#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// check_confidentialite.mjs — la politique de confidentialité de « Voir sa musique » (prompt 224) : confidentialite-voir-sa-musique.html et en/privacy-see-your-music/index.html.
//
// La page est l'adresse publique que Google Play exige : les deux pages existent, portent leur canonique, leurs hreflang fr/en et leur date ; elles sont au sitemap ; la phrase centrale et les huit
// sections y sont ; aucune note interne (« à ne pas publier ») ; le contact est celui de data/confidentialite.json.
// Puis ce que la politique PROMET est contrôlé sur le dépôt, pour qu'elle ne mente pas : aucune mesure d'audience (includes/analytics.json sans jeton, aucune balise dans les pages « Voir sa musique »),
// aucune adresse de tiers dans le code de l'interface hors les deux vidéos de « La semaine » (YouTube sans cookie et TikTok, chargés au clic seulement, dits dans la politique),
// pas d'API de stockage autre que localStorage dans l'interface. Si un outil de mesure ou une facturation est ajouté, ce contrôle échoue : il faut alors mettre la politique à jour.
// Usage : node tools/check_confidentialite.mjs
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const G = JSON.parse(readFileSync(path.join(ROOT, 'data/confidentialite.json'), 'utf8'));
let echecs = 0, controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs++; console.error(`ÉCHEC ${m}`); } };
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const fichierDe = (u) => (u.endsWith('/') ? `${u}index.html` : u);
const SITE = 'https://anibal-amiot.com';

const PHRASE = { fr: 'Rien de ce que vous écoutez ne quitte votre appareil.', en: 'Nothing you listen to leaves your device.' };
for (const [l, A] of Object.entries(G.adresses)) {
  const f = fichierDe(A.page), h = lire(f), canon = `${SITE}/${A.page}`;
  ok(h.includes(`<link rel="canonical" href="${canon}">`), `${f} : canonique`);
  ok(h.includes(`hreflang="fr" href="${SITE}/${G.adresses.fr.page}"`) && h.includes(`hreflang="en" href="${SITE}/${G.adresses.en.page}"`), `${f} : hreflang fr et en`);
  ok(new RegExp(`<html lang="${l}"`).test(h) && h.includes(PHRASE[l]), `${f} : langue et phrase centrale`);
  ok((h.match(/<h2>/g) || []).length === 8, `${f} : huit sections (${(h.match(/<h2>/g) || []).length})`);
  ok(/22 (novembre|November) 2026/.test(h), `${f} : date de mise à jour`);
  ok(h.includes(`mailto:${G.contact}`), `${f} : le contact est celui de la source`);
  ok(!/à ne pas publier|not to publish|Data safety|Play Billing/i.test(h), `${f} : aucune note interne`);
  ok(!/"@type"\s*:\s*"Dataset"/.test(h) && !/pavane/i.test(h), `${f} : ni Dataset ni « Pavane »`);
  ok(/<title>[^<]{40,}<\/title>/.test(h), `${f} : titre assez long`);
}
const sitemap = lire('sitemap.xml');
for (const A of Object.values(G.adresses)) ok(sitemap.includes(`<loc>${SITE}/${A.page}</loc>`), `sitemap : ${A.page}`);

// --- ce que la politique promet ---
const analytics = JSON.parse(lire('includes/analytics.json'));
ok(!analytics.cloudflareToken, 'aucune mesure d\'audience : includes/analytics.json n\'a pas de jeton (sinon la politique est fausse : « aucun outil de suivi »)');
const MUSIQUE = ['musique-chladni.html', 'en/see-your-music/index.html', 'es/ver-tu-musica/index.html', 'th/see-your-music/index.html', 'zh/see-your-music/index.html', 'ru/see-your-music/index.html', 'pt/see-your-music/index.html', 'hi/see-your-music/index.html', 'de/see-your-music/index.html', 'it/see-your-music/index.html', 'ja/see-your-music/index.html'];
const TRACEURS = /cloudflareinsights|google-analytics|googletagmanager|gtag\(|plausible|matomo|hotjar|doubleclick|facebook\.net|segment\.com|mixpanel|sentry/i;
for (const f of MUSIQUE) ok(!TRACEURS.test(lire(f)), `${f} : aucune balise de mesure ni de suivi`);
const CODE = readdirSync(path.join(ROOT, 'assets')).filter((f) => /^(pavane-.*|voir-sa-musique-montage|musique-chladni-(ui|moteur|config|semaine|textes))\.js$/.test(f));
ok(CODE.length >= 10, `le code de l'interface est lu (${CODE.length} fichiers)`);
for (const f of CODE) {
  const code = lire(`assets/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  ok(!TRACEURS.test(code), `assets/${f} : aucun outil de suivi`);
  for (const m of code.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const hote = m[1].toLowerCase();
    const permis = f === 'musique-chladni-semaine.js' ? /^(www\.youtube-nocookie\.com|www\.youtube\.com|www\.tiktok\.com)$/ : /^(www\.w3\.org|anibal-amiot\.com)$/;
    ok(permis.test(hote), `assets/${f} : adresse de tiers « ${hote} » : la politique ne la dit pas`);
  }
  ok(!/sessionStorage|indexedDB|document\.cookie/.test(code), `assets/${f} : aucun cookie, sessionStorage ni IndexedDB (la politique ne parle que du stockage local)`);
  ok(!/navigator\.sendBeacon|XMLHttpRequest/.test(code), `assets/${f} : aucun envoi par balise ni XHR`);
}
ok(!/billing|play-billing|googleplay/i.test(CODE.map((f) => lire(`assets/${f}`)).join('\n').replace(/\/\/[^\n]*/g, '')), 'aucune facturation dans le code (la section « Achats » est conditionnelle : à mettre à jour si elle arrive)');

if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    Confidentialité : ${controles} contrôles — deux pages (fr, en) au sitemap, huit sections, contact de la source ; aucune mesure d'audience, aucun outil de suivi, aucune adresse de tiers dans l'interface hors les vidéos de « La semaine » (dites dans la politique), stockage local seulement.`);
