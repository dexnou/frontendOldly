"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import PurchaseModal from "@/components/PurchaseModal"
import DeckCard from "@/components/features/decks/DeckCard"
import { ShoppingCart, TestTube } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001" || "http://localhost:3001"

interface Deck {
  id: string
  title: string
  description: string
  theme: string
  cardCount: number
  hasAccess: boolean
  coverImage?: string
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoggedIn, token, logout, loading } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loadingDecks, setLoadingDecks] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const handlePurchaseClick = () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=" + encodeURIComponent("/"))
      return
    }
    setShowPurchaseModal(true)
  }

  const handleDeckClick = (deck: Deck) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/deck/${deck.id}`)}`)
      return
    }

    if (!deck.hasAccess) {
      alert("No tienes acceso a este deck. ¡Usa el botón de Comprar para desbloquearlo!")
      return
    }

    router.push(`/deck/${deck.id}`)
  }

  const handlePurchaseSuccess = () => {
    fetchDecks()
  }

  const fetchDecks = async () => {
    setLoadingDecks(true)
    try {
      const headers: any = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch(`${BACKEND_URL}/api/decks`, {
        headers,
        credentials: "include",
      })

      if (!res.ok) throw new Error("No se pudieron cargar los decks")
      const data = await res.json()
      setDecks(data.data?.decks || [])
    } catch {
      setDecks([])
    } finally {
      setLoadingDecks(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchDecks()
    }
  }, [token, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            Oldy Funs Music Box
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-zinc-400 text-sm">Hola, {user?.firstname || user?.email || "Usuario"}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            Descubre la música de una forma única
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Explora colecciones musicales, desbloquea canciónes y juega con códigos QR
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePurchaseClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <ShoppingCart className="w-5 h-5" />
              {isLoggedIn ? "Comprar Decks" : "Comprar ahora"}
            </button>
            <Link
              href="/test/cards"
              className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <TestTube className="w-5 h-5" />
              Test QR Cards
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-3xl font-bold mb-8 text-white">Decks disponibles</h2>

          {loadingDecks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-lg">No hay decks disponibles en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} onClick={() => handleDeckClick(deck)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  )
}
