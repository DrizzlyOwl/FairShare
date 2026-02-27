/**
 * service-worker.js
 * PWA Service Worker for FairShare.
 * Handles static asset caching and offline functionality.
 */

const CACHE_NAME = 'fairshare-v3';

/**
 * Static assets to be cached for offline use.
 * @type {string[]}
 */
const STATIC_ASSETS = [
    './',
    './index.html?v=1772220300',
    './style.css?v=1772220300',
    './src/main.js?v=1772220300',
    './src/core/State.js',
    './src/core/FinanceEngine.js',
    './src/core/FinanceOrchestrator.js',
    './src/core/Calculations.js',
    './src/core/Constants.js',
    './src/core/Validator.js',
    './src/ui/Components.js',
    './src/ui/UIManager.js',
    './src/ui/NavigationController.js',
    './src/ui/FormController.js',
    './src/ui/Export.js',
    './src/services/ApiService.js',
    './src/utils/Helpers.js',
    './logo-icon.svg?v=1772220300',
    './logo-icon-dark.svg?v=1772220300',
    './favicon.svg?v=1772220300',
    './manifest.json',
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
 * Cleans up old cache versions and claims clients.
 */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        )).then(() => self.clients.claim())
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
