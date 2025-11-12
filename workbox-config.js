module.exports = {
  globDirectory: '.next/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2,ttf,eot,ico,json}'
  ],
  swDest: 'public/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      // Cache para Google Fonts stylesheets
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      // Cache para Google Fonts webfonts
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    {
      // Cache para API calls del juego
      urlPattern: /^https?.*\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5, // 5 minutos
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?timestamp=${Math.floor(Date.now() / 1000 / 60 / 5)}`; // Cache por 5 minutos
        },
      },
    },
    {
      // Cache para proxy calls
      urlPattern: /.*\/api\/proxy\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'proxy-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutos
        },
      },
    },
    {
      // Cache para imágenes
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },
    {
      // Cache para navegación (páginas)
      urlPattern: /^https?.*\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 día
        },
      },
    },
    {
      // Cache para archivos estáticos de Next.js
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    {
      // Cache para chunks de JavaScript
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 semana
        },
      },
    },
  ],
  // Ignorar archivos específicos
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
};