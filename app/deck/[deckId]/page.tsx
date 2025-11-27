"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { useAuth } from "@/contexts/AuthContext"
import PurchaseModal from "@/components/PurchaseModal"
import { Play } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001" || "http://localhost:3001"

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  }).then((res) => res.json())

export default function DeckPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string
  const { user, isLoggedIn, loading } = useAuth()

  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const {
    data: deckData,
    error: deckError,
    isLoading: deckLoading,
  } = useSWR(isLoggedIn ? `/api/proxy/decks/${deckId}` : null, fetcher)

  const deck = deckData?.data?.deck
  const hasAccess = deck?.hasAccess

  const {
    data: cardsData,
    error: cardsError,
    isLoading: cardsLoading,
  } = useSWR(isLoggedIn && hasAccess ? `/api/proxy/decks/${deckId}/cards` : null, fetcher)

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/deck/${deckId}`)}`)
    }
  }, [isLoggedIn, loading, router, deckId])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Verificando autenticación...</div>
  if (!isLoggedIn) return null
  if (deckLoading) return <div className="min-h-screen flex items-center justify-center">Cargando deck...</div>
  if (deckError) return <div className="min-h-screen flex items-center justify-center">Error cargando deck</div>

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">{deck?.title}</h1>
          <p className="text-zinc-400 mb-2">{deck?.description || "Desbloquea este mazo para jugar"}</p>
          <p className="text-zinc-500 text-sm mb-6">{deck?.cardCount || 0} cartas disponibles</p>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="px-8 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
          >
            Comprar Acceso
          </button>
        </div>
        {showPurchaseModal && <PurchaseModal deck={deck} onClose={() => setShowPurchaseModal(false)} />}
      </div>
    )
  }

  const cards = cardsData?.data?.cards || []

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white mb-4 transition-colors">
            ← Volver a inicio
          </button>
          <h1 className="text-4xl font-bold mb-2">{deck?.title}</h1>
          {deck?.description && <p className="text-zinc-400 text-lg">{deck.description}</p>}
          <div className="flex items-center gap-6 mt-4 text-sm text-zinc-500">
            <span>{deck?.cardCount || cards.length} cartas</span>
            <span className="capitalize">{deck?.theme}</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {cardsLoading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Cargando cartas...</p>
          </div>
        ) : cardsError ? (
          <div className="text-center py-12">
            <p className="text-red-400">Error cargando cartas</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">No hay cartas en este mazo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card: any) => (
              <div
                key={card.id}
                className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                onClick={() => router.push(`/play/${card.qrToken}`)}
              >
                {/* Album Cover */}
                <div className="relative aspect-square bg-zinc-800">
                  {card.album?.coverUrl ? (
                    <img
                      src={card.album.coverUrl || "/placeholder.svg"}
                      alt={card.album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-16 h-16 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  {/* Difficulty Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        card.difficulty === "easy"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : card.difficulty === "medium"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {card.difficulty === "easy" ? "Fácil" : card.difficulty === "medium" ? "Media" : "Difícil"}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">{card.songName}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{card.artist?.name}</p>
                  {card.album && (
                    <p className="text-xs text-zinc-500">
                      {card.album.title} ({card.album.releaseYear})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
