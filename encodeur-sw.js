// encodeur-sw.js — Service worker minimal pour l'encodeur (D6). Met en cache la page,
// js/*.js (le code de chiffrement, importé en module depuis carter-core.js), les trois
// référents et l'habillage (styles, polices, logo), pour que l'encodeur s'ouvre hors
// ligne, mis en forme, une fois visité. Rien d'autre : pas de notification, pas de
// synchronisation en arrière-plan, pas d'appel réseau propre au service worker.
//
// Deux régimes :
// - CACHED_URLS (le code et les données) : cache d'abord. Le visiteur garde exactement
//   la version installée tant que CACHE_VERSION ne change pas.
// - HABILLAGE (styles, polices, logo, partagés avec tout le site) : réseau d'abord, le
//   cache seulement hors connexion, rafraîchi à chaque chargement réussi. Ces fichiers
//   changent avec le site : les mettre dans l'empreinte obligerait à recalculer la
//   version de l'encodeur à chaque retouche de style.css.
//
// Portée : enregistré par encodeur.html avec { scope: './encodeur' } — il ne contrôle que
// la page de l'encodeur (le préfixe /encodeur), plus le reste du site. Une ancienne
// installation enregistrée à la racine (scope « / », versions antérieures) se désinscrit
// d'elle-même à sa prochaine mise à jour : voir `activate`.
//
// Version : CACHE_VERSION est l'empreinte SHA-256 (12 premiers caractères hexadécimaux)
// du contenu des fichiers de CACHED_URLS. Elle change dès qu'un de ces fichiers change,
// donc ce script change aussi, le navigateur réinstalle, et l'ancien cache est supprimé à
// l'activation. Ne pas l'éditer à la main : `node tools/check_encodeur_sw.mjs --ecrit`
// la recalcule, et le même script sans option fait échouer la CI si elle est périmée.

const CACHE_VERSION = '93dbceb137b5';
const CACHE_PREFIX = 'encodeur-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
// Avec les trois référents que loadReferents() charge : sans eux,
// l'encodeur ne démarre pas hors connexion.
const CACHED_URLS = [
  'encodeur.html',
  'js/carter-core.js',
  'js/chacha20.js',
  'js/chacha20poly1305.js',
  'js/hchacha20.js',
  'js/poly1305.js',
  'js/xchacha20poly1305.js',
  'data/referent_256.json',
  'data/referent_360.json',
  'data/referent_256_v3.json',
];

const HABILLAGE = [
  'style.css',
  'assets/fonts.css',
  'assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css',
  'assets/fonts/barlow-semi-condensed/barlow-semi-condensed-latin-300-normal.woff2',
  'assets/fonts/barlow-semi-condensed/barlow-semi-condensed-latin-400-normal.woff2',
  'assets/breadcrumb.css',
  'assets/atalanta-bg.css',
  'assets/title-logo-footer.png',
  'assets/soutien-gate.js',
];
const URLS_HABILLAGE = new Set(HABILLAGE.map((u) => new URL(u, self.location).href));

// Une registration dont la portée est la racine du site vient d'une version antérieure :
// elle ne doit plus rien contrôler.
const PORTEE_RACINE = new URL('./', self.location).href;

self.addEventListener('install', (event) => {
  if (self.registration.scope === PORTEE_RACINE) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...CACHED_URLS, ...HABILLAGE]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms
      .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
      .map((n) => caches.delete(n)));
    if (self.registration.scope === PORTEE_RACINE) {
      await self.registration.unregister();
      return;
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (self.registration.scope === PORTEE_RACINE) return;
  if (URLS_HABILLAGE.has(event.request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const reponse = await fetch(event.request);
        if (reponse.ok) await cache.put(event.request, reponse.clone());
        return reponse;
      } catch (e) {
        const enCache = await cache.match(event.request);
        if (enCache) return enCache;
        throw e;
      }
    })());
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(event.request))
      .then((cached) => cached || fetch(event.request))
  );
});
