/**
 * service-worker.js
 * PWA Service Worker for FairShare.
 * Handles static asset caching and offline functionality.
 */

const CACHE_NAME = 'fairshare-v5';

/**
 * Static assets to be cached for offline use.
 * @type {string[]}
 */
const STATIC_ASSETS = [
    './',
    './index.html?v=1772645197',
    './logo-icon.svg?v=1772645197',
    './logo-icon-dark.svg?v=1772645197',
    './favicon.svg?v=1772645197',
    './manifest.json',
    './dist/style.css?v=1772645197',
    './dist/main.js?v=1772645197',
    './dist/icons/icon-lightning.svg',
    './dist/icons/icon-heart.svg',
    './dist/icons/icon-info.svg',
    './dist/icons/icon-money.svg',
    './dist/icons/icon-building.svg',
    './dist/icons/icon-external-link.svg',
    './dist/icons/icon-receipt.svg',
    './dist/icons/icon-pie-chart.svg',
    './dist/icons/icon-user.svg',
    './dist/icons/icon-users.svg',
    './dist/icons/icon-download.svg',
    './dist/icons/icon-offline.svg',
    './dist/images/bg-landing.svg',
    './dist/images/bg-income.svg',
    './dist/images/bg-property.svg',
    './dist/images/bg-mortgage.svg',
    './dist/images/bg-utilities.svg',
    './dist/images/bg-committed.svg',
    './dist/images/bg-results.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=optional'
];

/**
 * 'install' event listener.
 * Pre-caches all static assets defined in STATIC_ASSETS.
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * 'activate' event listener.
 * Cleans up old cache versions, prunes stale assets in the current cache, and claims clients.
 */
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // 1. Clean up old cache storage versions
            caches.keys().then(keys => Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            )),
            // 2. Prune stale assets within the current cache
            caches.open(CACHE_NAME).then(cache => {
                return cache.keys().then(requests => {
                    return Promise.all(
                        requests.map(request => {
                            const url = new URL(request.url);
                            const relativePath = url.pathname.replace(new URL(self.registration.scope).pathname, './');

                            // Check if the cached request matches any of our current static assets
                            const isCurrentAsset = STATIC_ASSETS.some(asset => {
                                // Direct match (e.g., './src/core/State.js')
                                if (asset === relativePath) return true;
                                // Match with query string (e.g., './style.css?v=1772645197')
                                if (asset.startsWith(relativePath) && (asset === relativePath + url.search || asset === './' + url.search)) return true;
                                return false;
                            });

                            if (!isCurrentAsset) {
                                console.log('[ServiceWorker] Pruning stale asset:', request.url);
                                return cache.delete(request);
                            }
                        })
                    );
                });
            })
        ]).then(() => self.clients.claim())
    );
});

/**
 * 'fetch' event listener.
 * Implements Stale-While-Revalidate for static assets and Network-First for navigation.
 */
self.addEventListener('fetch', event => {
    const { request } = event;

    // Navigation requests (HTML)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Static assets & Fonts
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
                if (networkResponse.ok) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return networkResponse;
            }).catch(() => {
                // Return cached response if network fails
            });

            return cachedResponse || fetchPromise;
        })
    );
});
