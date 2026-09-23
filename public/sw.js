// PTL V2 Service Worker — Cache Recovery & Safe Update Manager
// Build: 2026.09.23.5
const CACHE_NAME = 'ptl-app-v202609235';

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ptl_crest_icon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// Install Event: Cache essential app shell, immediately skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[PTL SW] Precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Claim clients and purge all obsolete ptl-* / workbox-* caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => {
              // Delete old PTL caches and obsolete workbox caches, never touch unrelated caches
              return (
                (key.startsWith('ptl-') && key !== CACHE_NAME) ||
                key.startsWith('workbox-') ||
                key.startsWith('vite-')
              );
            })
            .map((key) => {
              console.log('[PTL SW] Evicting obsolete cache:', key);
              return caches.delete(key);
            })
        );
      }),
    ])
  );
});

// Message Event: Allow client app to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAN_OLD_CACHES') {
    caches.keys().then((keys) => {
      keys
        .filter((k) => k !== CACHE_NAME && (k.startsWith('ptl-') || k.startsWith('workbox-')))
        .forEach((k) => caches.delete(k));
    });
  }
});

// Fetch Event: Implement Safe Network-First for Navigation, Bypass for APIs
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL: Never cache dynamic business APIs, Google GenAI, or WebSockets
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.protocol.startsWith('ws') ||
    request.url.startsWith('chrome-extension')
  ) {
    return;
  }

  // 3. App Shell Navigation: STRICT NETWORK-FIRST
  // Guarantees mobile users always fetch the freshest index.html when online!
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 4. Content-Hashed Assets (/assets/): CacheFirst with Network Revalidation
  // Vite content-hashes ensure filename changes whenever code changes
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Fetch update in background to verify freshness
          fetch(request)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkRes));
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 5. General Static Files (images, fonts, manifest): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
