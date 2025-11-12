'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone ||
          document.referrer.includes('android-app://')) {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App instalada exitosamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] Usuario aceptó la instalación');
    } else {
      console.log('[PWA] Usuario rechazó la instalación');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              ¡Instala Music Box!
            </h3>
            <p className="text-xs text-white/80 mb-3">
              Accede rápidamente desde tu pantalla de inicio
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-black text-xs font-medium px-3 py-2 rounded-md hover:bg-white/90 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs text-white/60 hover:text-white/80 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}