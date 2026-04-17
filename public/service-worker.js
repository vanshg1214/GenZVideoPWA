const CACHE_NAME = 'pollito-v2'; // Bumped version to v2 to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.jpg',
  '/icons/download_video_optimized.mp4',
  '/icons/pollito_compressed.mp4'
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Network First Strategy for HTML/App integrity
self.addEventListener('fetch', (event) => {
  // Always try network first for the main document and JS/CSS to avoid 404s
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache First for bulky assets like video/images
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
