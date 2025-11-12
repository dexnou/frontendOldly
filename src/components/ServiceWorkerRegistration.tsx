'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Función para registrar el SW
      const registerSW = async () => {
        try {
          console.log('[PWA] Registrando Service Worker...');
          
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('[PWA] Service Worker registrado:', registration.scope);

          // Escuchar actualizaciones del SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] Nueva versión de SW encontrada');
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Hay un nuevo SW disponible
                    console.log('[PWA] Nueva versión disponible, recargando...');
                    
                    // Opcional: mostrar notificación al usuario
                    if (window.confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
                      window.location.reload();
                    }
                  } else {
                    // Primera instalación
                    console.log('[PWA] App lista para uso offline');
                  }
                }
              });
            }
          });

          // Verificar si hay un SW esperando
          if (registration.waiting) {
            console.log('[PWA] SW esperando activación');
          }

        } catch (error) {
          console.error('[PWA] Error registrando Service Worker:', error);
        }
      };

      // Registrar SW cuando la página cargue
      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }

      // Escuchar cuando la app se conecte/desconecte
      const handleOnline = () => {
        console.log('[PWA] App conectada');
        // Opcional: sincronizar datos pendientes
      };

      const handleOffline = () => {
        console.log('[PWA] App desconectada');
        // Opcional: mostrar indicador offline
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup
      return () => {
        window.removeEventListener('load', registerSW);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return null; // Este componente no renderiza nada
}