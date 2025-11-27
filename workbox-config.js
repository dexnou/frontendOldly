module.exports = {
  // Cambiamos a public para evitar errores de lectura en .next
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2,ttf,eot,ico,json}'
  ],
  swDest: 'public/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  // Mantenemos tus reglas avanzadas
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      // Cache para API calls (Simplificado para evitar el error)
      urlPattern: /^https?.*\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 300, // 5 minutos
        },
      },
    },
    {
      urlPattern: /.*\/api\/proxy\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'proxy-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /^https?.*\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      // Importante: Esto cachea los archivos de Next.js que ya no estamos leyendo con globDirectory
      urlPattern: /\/_next\/static\/.*/,
      handler: 'StaleWhileRevalidate', 
      options: {
        cacheName: 'next-static-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ],
  // Fallback para modo offline
  navigateFallback: '/offline.html',
  // Evitar que el fallback intercepte rutas de API o archivos next
  navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /\.[a-z]+$/],
};