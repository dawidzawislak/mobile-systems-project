const CACHE_NAME = 'geo-route-pwa-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install Event: Cache files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Serve from cache, fallback to network
self.addEventListener('fetch', (e) => {
    // Skip non-GET requests
    if (e.request.method !== 'GET') return;
    
    // Skip API calls (always fetch from network)
    if (e.request.url.includes('api.geoapify.com') || 
        e.request.url.includes('maps.geoapify.com')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).then((fetchResponse) => {
                // Cache successful responses
                if (fetchResponse.ok) {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            // Return offline fallback if available
            return caches.match('/');
        })
    );
});
