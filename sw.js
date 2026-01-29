const cacheName = 'hive-map-cache-v1';
const filesToCache = [
  './hive-map/',
  './hive-map/index.html',
  './hive-map/manifest.json',
  './hive-map/icons/192-hive-map.png',
  './hive-map/icons/512-hive-map.png',
  'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});


