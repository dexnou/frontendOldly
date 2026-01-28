"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import PurchaseModal from "@/components/PurchaseModal"
import DeckCard from "@/components/features/decks/DeckCard"
import { ShoppingCart, TestTube, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

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
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar Minimalista */}
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {/* Logo pequeño en navbar */}
            {/* Logo Mobile */}
            <div className="relative w-28 h-28 md:hidden">
              <Image
                src="/oldyfunlogo2.svg"
                alt="Oldy Fans"
                fill
                className="object-contain"
              />
            </div>

            {/* Logo Desktop */}
            <div className="relative w-32 h-14 hidden md:block">
              <Image
                src="/oldyfunlogo.svg"
                alt="Oldy Fans"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {user?.firstname || "Usuario"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="font-medium shadow-lg shadow-primary/10">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Hero Section con Logo Grande */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="relative w-64 h-32 md:w-80 md:h-40 mb-8 transition-transform hover:scale-105 duration-300">
            <Image
              src="/oldyfunlogo.svg"
              alt="Oldy Funs Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Music Box
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Colecciones musicales interactivas. <br />
            Desbloquea, escanea y juega.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={handlePurchaseClick}
              size="lg"
              className="px-8 h-12 rounded-full font-bold bg-white text-[#009bdd] border-2 border-[#009bdd] shadow-[0_0_15px_#009bdd] hover:shadow-[0_0_25px_#009bdd] hover:bg-white hover:scale-105 transition-all duration-300 animate-pulse"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isLoggedIn ? "Tienda de Decks" : "Comprar Ahora"}
            </Button>

            <Link href="/test/cards">
              <Button
                variant="outline"
                size="lg"
                className="px-6 h-12 rounded-full border-border bg-transparent hover:bg-secondary transition-colors"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Probar QR
              </Button>
            </Link>
          </div>
        </div>

        {/* Sección de Decks */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block"></span>
              Mis Decks
            </h2>
          </div>

          {loadingDecks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-secondary/50 rounded-xl animate-pulse border border-border/50" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground text-lg">No hay decks disponibles en este momento</p>
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

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border mt-auto bg-background">
        <p>© 2024 Oldy Fans Music Box</p>
      </footer>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  )
}