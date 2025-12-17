"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { useAuth } from "@/contexts/AuthContext"
import PurchaseModal from "@/components/PurchaseModal"
import { Play, Share2, Check, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

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
  const [copied, setCopied] = useState(false)

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
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!isLoggedIn) return null
  if (deckLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (deckError) return <div className="min-h-screen flex items-center justify-center bg-background text-destructive">Error cargando mazo</div>

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md w-full bg-card p-8 rounded-xl border border-border shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-secondary p-4 rounded-full">
               <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-foreground">{deck?.title}</h1>
          <p className="text-muted-foreground mb-6">{deck?.description || "Desbloquea este mazo para jugar"}</p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="bg-secondary px-3 py-1 rounded-full">{deck?.cardCount || 0} cartas</span>
            <span className="bg-secondary px-3 py-1 rounded-full capitalize">{deck?.theme}</span>
          </div>
          
          <Button
            onClick={() => setShowPurchaseModal(true)}
            size="lg"
            className="w-full font-bold text-lg mb-4"
          >
            Desbloquear Mazo
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            Volver al inicio
          </Button>
        </div>
        {showPurchaseModal && <PurchaseModal deck={deck} onClose={() => setShowPurchaseModal(false)} />}
      </div>
    )
  }

  const cards = cardsData?.data?.cards || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/")} 
              className="pl-0 hover:bg-transparent hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            
            <Button 
              onClick={handleShareDeck}
              variant="outline"
              className="rounded-full bg-secondary border-border hover:bg-border"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? "Copiado" : "Compartir"}
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {deck?.title}
            </h1>
            {deck?.description && <p className="text-muted-foreground text-lg max-w-2xl">{deck.description}</p>}
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-secondary px-3 py-1 rounded-md text-sm font-medium border border-border">
                {deck?.cardCount || cards.length} cartas
              </span>
              <span className="bg-secondary px-3 py-1 rounded-md text-sm font-medium border border-border capitalize">
                {deck?.theme}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {cardsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Cargando colección...</p>
          </div>
        ) : cardsError ? (
          <div className="text-center py-20 bg-destructive/10 rounded-xl border border-destructive/20">
            <p className="text-destructive font-medium">No se pudieron cargar las cartas</p>
            <Button variant="link" onClick={() => window.location.reload()} className="mt-2 text-destructive">
              Reintentar
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed border-border">
            <div className="text-4xl mb-4 text-muted-foreground">📭</div>
            <p className="text-muted-foreground text-lg">Este mazo está vacío por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card: any) => (
              <div
                key={card.id}
                className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => router.push(`/play/${card.qrToken}`)}
              >
                {/* Album Cover */}
                <div className="relative aspect-square bg-secondary overflow-hidden">
                  {card.album?.coverUrl ? (
                    <img
                      src={card.album.coverUrl || "/placeholder.svg"}
                      alt={card.album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <Play className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-background rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                      <Play className="w-6 h-6 text-foreground fill-foreground ml-1" />
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                        card.difficulty === "easy"
                          ? "bg-emerald-500/90 text-white border-emerald-600"
                          : card.difficulty === "medium"
                            ? "bg-amber-500/90 text-white border-amber-600"
                            : "bg-rose-500/90 text-white border-rose-600"
                      }`}
                    >
                      {card.difficulty === "easy" ? "Fácil" : card.difficulty === "medium" ? "Media" : "Difícil"}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {card.songName}
                  </h3>
                  <div className="text-muted-foreground text-sm font-medium line-clamp-1 mb-2">
                    {card.artist?.name}
                  </div>
                  {card.album && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-1 flex items-center gap-1.5 pt-2 border-t border-border/50">
                       💿 {card.album.title}
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