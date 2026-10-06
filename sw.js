// Offline support: cache the whole app. CACHE is stamped with a content hash by build.py,
// so every published change installs a fresh cache automatically.
const CACHE = 'morning-moves-15d7d0050c';
const FILES = ['./', 'index.html', 'app.css', 'app.js', 'figure.js', 'exercises.js', 'videos.js', 'manifest.webmanifest',
               'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
