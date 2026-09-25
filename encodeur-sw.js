// encodeur-sw.js — Service worker minimal pour l'encodeur (D6). Met en cache la page,
// js/*.js (le code de chiffrement, importé en module depuis carter-core.js) et les deux
// référents v3, pour que l'encodeur s'ouvre hors ligne une fois visité. Rien d'autre :
// pas de notification, pas de synchronisation en arrière-plan, pas d'appel réseau propre
// au service worker lui-même — seulement le cache-first sur les fichiers listés ici.

const CACHE_NAME = 'encodeur-v1';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
