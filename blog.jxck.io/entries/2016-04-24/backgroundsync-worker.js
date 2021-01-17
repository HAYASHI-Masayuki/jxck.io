// worker.js
self.addEventListener('install', (e) => {
  console.info('install', e);
  e.waitUntil(skipWaiting());
});

self.addEventListener('activate', (e) => {
  console.info('activate', e);
  e.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (e) => {
  console.log('sync', e);
});
