importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// 1. Matar cualquier Service Worker viejo inmediatamente
self.skipWaiting();
self.clients.claim();

// Configuración de versión
workbox.core.setCacheNameDetails({
  prefix: 'oldy-funs',
  suffix: 'v5-production',
});

// 2. Cachear Fuentes de Google (mejora velocidad visual)
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com' ||
             url.origin === 'https://fonts.gstatic.com',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);

// 3. Cachear Imágenes (Logos, portadas) - CacheFirst
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
      }),
    ],
  })
);

// 4. Archivos Estáticos (JS/CSS) - StaleWhileRevalidate
workbox.routing.registerRoute(
  ({request}) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// 5. API Calls - NetworkFirst
// Siempre intenta red. Si falla la red, NO devuelve fallback, simplemente falla (como debe ser).
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
  })
);