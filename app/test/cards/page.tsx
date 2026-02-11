"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface TestCard {
  id: string;
  songName: string;
  qrToken: string;
  difficulty: string;
  hasAccess: boolean;
  qrUrl: string;
  deck: { id: string; title: string; theme: string };
  artist: { id: string; name: string };
}

export default function TestCardsPage() {
  const { isLoggedIn, token } = useAuth();
  const [cards, setCards] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchCards(currentPage) }, [token, currentPage]);

  const fetchCards = async (page = 1) => {
    setLoading(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/cards?limit=20&page=${page}`, { headers, credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setCards(data.data?.cards || []);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
        }
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🧪 Test Cards</h1>
            <p className="text-muted-foreground mt-1">Entorno de pruebas para códigos QR.</p>
          </div>
          <Link href="/">
            <Button variant="outline">← Volver</Button>
          </Link>
        </div>

        {!isLoggedIn && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ Inicia sesión para ver el estado de acceso real.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-card border border-border rounded-xl shadow-sm p-5 hover:border-primary/50 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground truncate">{card.songName}</h3>
                <p className="text-muted-foreground text-sm">{card.artist.name}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-xs bg-secondary px-2 py-1 rounded border border-border">{card.deck.title}</span>
                <span className="text-xs bg-secondary px-2 py-1 rounded border border-border uppercase">{card.difficulty}</span>
                {isLoggedIn && (
                  <span className={`text-xs px-2 py-1 rounded border ${card.hasAccess ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                    {card.hasAccess ? 'Acceso OK' : 'Bloqueado'}
                  </span>
                )}
              </div>

              <div className="space-y-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg">
                  <img
                    src={`${BACKEND_URL}/api/cards/${card.id}/qr-image`}
                    alt={`QR for ${card.songName}`}
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=QR+Error';
                    }}
                  />
                  <p className="text-[10px] text-black mt-1 font-mono">{card.qrToken}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link href={`/qr/${card.qrToken}`} className="flex-1"><Button variant="outline" className="w-full">Simular Scan</Button></Link>
                <Link href={`/play/${card.qrToken}`} className="flex-1"><Button className="w-full">Jugar</Button></Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {!loading && cards.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8 pb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-card border-border text-foreground hover:bg-secondary"
            >
              Anterior
            </Button>
            <span className="text-muted-foreground bg-secondary px-3 py-1 rounded-md text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-card border-border text-foreground hover:bg-secondary"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}