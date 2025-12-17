"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
    if (loading) return; 
    fetchCardInfo();
  }, [qrToken, token, loading]);

  const fetchCardInfo = async () => {
    if (!qrToken) return;
    setLoadingCard(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/cards/${qrToken}`, { headers, credentials: "include" });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 && data.redirectTo === 'login') {
          router.push(`/login?redirect=${encodeURIComponent(`/qr/${qrToken}`)}`);
          return;
        }
        if (res.status === 403 && data.redirectTo === 'activate-deck') {
          setError(`Necesitas desbloquear el mazo "${data.data?.deck?.title}".`);
          setCardData(data.data);
          return;
        }
        throw new Error(data.message || "Error cargando carta");
      }
      router.push(`/play/${qrToken}`);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoadingCard(false);
    }
  };

  const handleActivateDeck = () => cardData && router.push(`/?deck=${cardData.deck.id}`);
  const handleLogin = () => router.push(`/login?redirect=${encodeURIComponent(`/qr/${qrToken}`)}`);

  if (loading || loadingCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Escaneando carta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2 text-foreground">Acceso Requerido</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          
          {cardData && (
             <div className="space-y-3">
               {!isLoggedIn ? (
                 <Button onClick={handleLogin} className="w-full">Iniciar Sesión</Button>
               ) : (
                 <Button onClick={handleActivateDeck} className="w-full">Ver Mazo</Button>
               )}
               <Button variant="ghost" onClick={() => router.push("/")} className="w-full">Ir al Inicio</Button>
             </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}