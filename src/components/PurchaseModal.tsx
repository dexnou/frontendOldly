"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createPortal } from "react-dom";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Deck {
  id: string;
  title: string;
  description: string;
  theme: string;
  cardCount: number;
  hasAccess: boolean;
  buyLink?: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export default function PurchaseModal({ isOpen, onClose, onPurchaseSuccess }: PurchaseModalProps) {
  const { token, isLoggedIn } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingDeck, setPurchasingDeck] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Fetch decks disponibles para compra
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchDecks();
    }
  }, [isOpen, isLoggedIn]);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const headers: any = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/api/decks`, {
        headers,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("No se pudieron cargar los decks");
      const data = await res.json();
      
      // Filtrar solo decks sin acceso
      const availableDecks = (data.data?.decks || []).filter((deck: Deck) => !deck.hasAccess);
      setDecks(availableDecks);
    } catch (err) {
      setError("Error cargando decks disponibles");
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseDeck = async (deckId: string) => {
    if (!token) {
      setError("Debes estar logueado para comprar");
      return;
    }

    setPurchasingDeck(deckId);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/decks/${deckId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ source: "purchase" }), // Fuente válida según esquema Prisma
        credentials: "include",
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Error activando deck");
      }

      // Éxito - remover deck de la lista y notificar
      setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
      alert(`¡Deck activado exitosamente! ${data.message}`);
      
      // Notificar al componente padre para refrescar la lista
      onPurchaseSuccess();
      
    } catch (err: any) {
      setError(err.message || "Error en la compra");
    } finally {
      setPurchasingDeck(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50"
      style={{ 
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg w-full shadow-2xl relative"
        style={{
          maxWidth: '56rem',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Comprar Decks</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              Selecciona los decks que quieres comprar para acceder a sus cartas
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">¡Ya tienes acceso a todos los decks!</h3>
                <p>No hay decks disponibles para comprar en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {decks.map((deck) => (
                  <div key={deck.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-blue-600">{deck.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{deck.description}</p>
                      <div className="text-xs text-gray-500">
                        Tema: {deck.theme} • {deck.cardCount} cartas
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-green-600">
                        🎵 Gratis (Beta)
                      </div>
                      <button
                        onClick={() => handlePurchaseDeck(deck.id)}
                        disabled={purchasingDeck === deck.id}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchasingDeck === deck.id ? "Activando..." : "Activar Deck"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Nota:</strong> Esta es una versión de prueba. En el futuro aquí habrá:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Integración con pasarelas de pago (Stripe, PayPal, etc.)</li>
                <li>Precios reales por deck</li>
                <li>Sistemas de descuentos y promociones</li>
                <li>Historial de compras</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Usar portal para renderizar en el body
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
