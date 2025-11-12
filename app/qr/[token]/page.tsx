"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ellena-hyperaemic-numbers.ngrok-free.dev" || "http://localhost:3001";

interface Card {
  id: string;
  qrToken: string;
  deck: {
    id: string;
    title: string;
  };
}

export default function QRPage() {
  const { token: qrToken } = useParams();
  const router = useRouter();
  const { isLoggedIn, token, loading } = useAuth();
  const [cardData, setCardData] = useState<Card | null>(null);
  const [error, setError] = useState("");
  const [loadingCard, setLoadingCard] = useState(true);

  useEffect(() => {
    if (loading) return; // Esperar a que se verifique la autenticación

    fetchCardInfo();
  }, [qrToken, token, loading]);

  const fetchCardInfo = async () => {
    if (!qrToken) return;

    console.log('🔍 Frontend DEBUG - fetchCardInfo called');
    console.log('🔍 Frontend DEBUG - qrToken:', qrToken);
    console.log('🔍 Frontend DEBUG - token:', token);
    console.log('🔍 Frontend DEBUG - isLoggedIn:', isLoggedIn);

    setLoadingCard(true);
    try {
      const headers: any = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔍 Frontend DEBUG - Adding Authorization header');
      } else {
        console.log('🔍 Frontend DEBUG - No token available');
      }

      console.log('🔍 Frontend DEBUG - Making request to:', `${BACKEND_URL}/api/cards/${qrToken}`);

      const res = await fetch(`${BACKEND_URL}/api/cards/${qrToken}`, {
        headers,
        credentials: "include",
      });
      
      const data = await res.json();
      
      console.log('🔍 Frontend DEBUG - Response status:', res.status);
      console.log('🔍 Frontend DEBUG - Response data:', data);

      if (!res.ok) {
        if (res.status === 401 && data.redirectTo === 'login') {
          // Necesita autenticarse
          console.log('🔍 Frontend DEBUG - Redirecting to login');
          router.push(`/login?redirect=${encodeURIComponent(`/qr/${qrToken}`)}`);
          return;
        }

        if (res.status === 403 && data.redirectTo === 'activate-deck') {
          // Necesita activar el deck
          console.log('🔍 Frontend DEBUG - Need to activate deck');
          setError(`No tienes acceso al mazo "${data.data?.deck?.title}". ¡Actívalo primero!`);
          setCardData(data.data);
          return;
        }

        throw new Error(data.message || "Error cargando carta");
      }

      // Si llegamos aquí, el usuario tiene acceso
      // Redirigir directamente al juego
      console.log('🔍 Frontend DEBUG - Access granted, redirecting to play');
      router.push(`/play/${qrToken}`);
      
    } catch (err: any) {
      console.error('🔍 Frontend DEBUG - Error:', err);
      setError(err.message || "Error cargando carta");
    } finally {
      setLoadingCard(false);
    }
  };

  const handleActivateDeck = () => {
    if (cardData) {
      router.push(`/?deck=${cardData.deck.id}`);
    }
  };

  const handleLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/qr/${qrToken}`)}`);
  };

  if (loading || loadingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando carta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Carta encontrada</h1>
          <p className="text-red-600 mb-6">{error}</p>
          
          {cardData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold">Mazo: {cardData.deck.title}</p>
              </div>
              
              {!isLoggedIn ? (
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Iniciar sesión para jugar
                </button>
              ) : (
                <button
                  onClick={handleActivateDeck}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 font-semibold"
                >
                  Activar mazo para jugar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al juego...</p>
      </div>
    </div>
  );
}
