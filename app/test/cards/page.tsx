"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001" || "http://localhost:3001";

interface TestCard {
  id: string;
  songName: string;
  qrToken: string;
  difficulty: string;
  hasAccess: boolean;
  qrUrl: string;
  deck: {
    id: string;
    title: string;
    theme: string;
  };
  artist: {
    id: string;
    name: string;
  };
}

export default function TestCardsPage() {
  const { isLoggedIn, token } = useAuth();
  const [cards, setCards] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [token]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const headers: any = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/api/cards?limit=10`, {
        headers,
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCards(data.data?.cards || []);
      }
    } catch (error) {
      console.error('Error cargando cartas:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada al portapapeles!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🧪 Test de Cartas QR</h1>
          <p className="text-gray-600 mb-4">
            Esta es una página de testing para probar las cartas con códigos QR.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Volver al inicio
          </Link>
        </div>

        {!isLoggedIn && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <strong>Nota:</strong> Para jugar las cartas necesitas estar logueado y tener acceso al mazo.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">{card.songName}</h3>
                <p className="text-gray-600">por {card.artist.name}</p>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                    {card.deck.title}
                  </span>
                  <span className="text-sm bg-yellow-100 px-2 py-1 rounded">
                    {card.difficulty}
                  </span>
                </div>
                
                {isLoggedIn && (
                  <div className="text-sm">
                    {card.hasAccess ? (
                      <span className="text-green-600">✅ Tienes acceso</span>
                    ) : (
                      <span className="text-red-600">❌ Sin acceso</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Token:
                  </label>
                  <code className="block text-xs bg-gray-100 p-2 rounded">
                    {card.qrToken}
                  </code>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del QR:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={card.qrUrl}
                      readOnly
                      className="flex-1 text-xs bg-gray-100 p-2 rounded-l border"
                    />
                    <button
                      onClick={() => copyToClipboard(card.qrUrl)}
                      className="bg-gray-500 text-white px-3 rounded-r hover:bg-gray-600 text-xs"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/qr/${card.qrToken}`}
                    className="flex-1 bg-purple-500 text-white py-2 px-3 rounded text-center hover:bg-purple-600 text-sm"
                  >
                    🔗 Simular QR
                  </Link>
                  <Link
                    href={`/play/${card.qrToken}`}
                    className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-center hover:bg-green-600 text-sm"
                  >
                    ▶️ Jugar directo
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No hay cartas disponibles</h2>
            <p className="text-gray-500">Asegúrate de tener cartas creadas en la base de datos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
