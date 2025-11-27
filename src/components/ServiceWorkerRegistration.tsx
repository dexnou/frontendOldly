'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // SOLO registrar en producción para evitar problemas de caché en desarrollo
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const registerSW = async () => {
        try {
          console.log('[PWA] Registrando Service Worker...');
          
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('[PWA] Service Worker registrado:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Nueva versión disponible');
                  } else {
                    console.log('[PWA] App lista para uso offline');
                  }
                }
              });
            }
          });

        } catch (error) {
          console.error('[PWA] Error registrando Service Worker:', error);
        }
      };

      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }
    }
  }, []);

  return null;
}