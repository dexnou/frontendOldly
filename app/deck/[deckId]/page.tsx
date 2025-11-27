"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { useAuth } from "@/contexts/AuthContext"
import PurchaseModal from "@/components/PurchaseModal"
import { Play, Share2, Check } from "lucide-react" // Iconos agregados

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
  const [copied, setCopied] = useState(false) // Estado para feedback de copiado

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

  const handleShareDeck = async () => {
    const url = window.location.href
    const text = `¡Juguemos a adivinar canciones con el mazo "${deck?.title}" en Oldly Fun! 🎵`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Oldly Fun Music Box',
          text: text,
          url: url,
        })
      } catch (err) {
        console.log('Error al compartir:', err)
      }
    } else {
      // Fallback para escritorio: copiar al portapapeles
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Verificando autenticación...</div>
  if (!isLoggedIn) return null
  if (deckLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Cargando mazo...</div>
  if (deckError) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Error cargando mazo</div>

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold mb-4">{deck?.title}</h1>
          <p className="text-zinc-400 mb-6">{deck?.description || "Desbloquea este mazo para jugar"}</p>
          <div className="flex flex-col gap-2 text-sm text-zinc-500 mb-8">
            <span>{deck?.cardCount || 0} cartas disponibles</span>
            <span className="capitalize">Tema: {deck?.theme}</span>
          </div>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full px-8 py-4 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-bold text-lg"
          >
            Desbloquear Mazo
          </button>
          
          <button 
            onClick={() => router.push("/")}
            className="mt-4 text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Volver al inicio
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
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-4">
            <button 
              onClick={() => router.push("/")} 
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
            >
              ← Volver a inicio
            </button>
            
            {/* BOTÓN DE COMPARTIR */}
            <button 
              onClick={handleShareDeck}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? "¡Enlace copiado!" : "Compartir Mazo"}
            </button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {deck?.title}
          </h1>
          {deck?.description && <p className="text-zinc-400 text-lg max-w-2xl">{deck.description}</p>}
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium text-zinc-300">
              {deck?.cardCount || cards.length} cartas
            </span>
            <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium text-zinc-300 capitalize">
              {deck?.theme}
            </span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {cardsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-zinc-400">Cargando tu colección...</p>
          </div>
        ) : cardsError ? (
          <div className="text-center py-20 bg-red-900/10 rounded-xl border border-red-900/50">
            <p className="text-red-400 text-lg">Error cargando cartas</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Intentar de nuevo</button>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-zinc-400 text-xl font-medium">No hay cartas en este mazo aún</p>
            <p className="text-zinc-600 mt-2">Vuelve pronto para ver nuevo contenido</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card: any) => (
              <div
                key={card.id}
                className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/play/${card.qrToken}`)}
              >
                {/* Album Cover */}
                <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                  {card.album?.coverUrl ? (
                    <img
                      src={card.album.coverUrl || "/placeholder.svg"}
                      alt={card.album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Play className="w-16 h-16 text-zinc-700" />
                    </div>
                  )}
                  
                  {/* Overlay Play Icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                      <Play className="w-8 h-8 text-black fill-black ml-1" />
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md border ${
                        card.difficulty === "easy"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : card.difficulty === "medium"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {card.difficulty === "easy" ? "Fácil" : card.difficulty === "medium" ? "Media" : "Difícil"}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 text-lg line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {card.songName}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <span className="line-clamp-1 font-medium">{card.artist?.name}</span>
                  </div>
                  {card.album && (
                    <p className="text-xs text-zinc-500 line-clamp-1 flex items-center gap-1">
                      💿 {card.album.title}
                      {card.album.releaseYear && <span className="opacity-60"> • {card.album.releaseYear}</span>}
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