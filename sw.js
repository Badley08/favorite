const CACHE_NAME = 'mes-favoris-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Montserrat:wght@700&family=Share+Tech+Mono&display=swap'
];

// Étape 1: Installation du Service Worker et mise en cache des fichiers de l'application
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Étape 2: Interception des requêtes réseau
// Stratégie "Cache d'abord, puis réseau" (Cache-First, falling back to network)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la ressource est dans le cache, on la retourne
        if (response) {
          return response;
        }
        // Sinon, on la cherche sur le réseau
        return fetch(event.request);
      })
  );
});

// Étape 3: Nettoyage des anciens caches
// Ce code s'active quand le Service Worker est mis à jour pour supprimer les anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});