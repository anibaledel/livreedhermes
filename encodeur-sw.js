// encodeur-sw.js — Service worker minimal pour l'encodeur (D6). Met en cache la page,
// js/*.js (le code de chiffrement, importé en module depuis carter-core.js) et les deux
// référents v3, pour que l'encodeur s'ouvre hors ligne une fois visité. Rien d'autre :
// pas de notification, pas de synchronisation en arrière-plan, pas d'appel réseau propre
// au service worker lui-même — seulement le cache-first sur les fichiers listés ici.
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

const CACHE_VERSION = 'eb9c2529873d';
const CACHE_PREFIX = 'encodeur-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const CACHED_URLS = [
  'encodeur.html',
  'js/carter-core.js',
  'js/chacha20.js',
  'js/chacha20poly1305.js',
  'js/hchacha20.js',
  'js/poly1305.js',
  'js/xchacha20poly1305.js',
  'data/referent_256_v3.json',
  'data/referent_360_v3.json',
];

// Une registration dont la portée est la racine du site vient d'une version antérieure :
// elle ne doit plus rien contrôler.
const PORTEE_RACINE = new URL('./', self.location).href;

self.addEventListener('install', (event) => {
  if (self.registration.scope === PORTEE_RACINE) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS)).then(() => self.skipWaiting())
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
  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(event.request))
      .then((cached) => cached || fetch(event.request))
  );
});
