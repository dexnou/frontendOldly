"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { AdminNav } from "@/components/features/admin/AdminNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, X, Trash2 } from "lucide-react"

interface Deck {
  id: number
  title: string
}

interface CardData {
  id: number
  songName: string
  qrToken: string
  difficulty: string
  spotifyUrl: string
  artist: {
    id: number
    name: string
    country?: string
    genre?: string
  }
  album?: {
    id: number
    title: string
    releaseYear?: number
    coverUrl?: string
  }
  deck: {
    id: number
    title: string
    theme: string
  }
}

interface CardForm {
  deckId: number | null
  artistName: string
  artistCountry: string
  artistGenre: string
  albumTitle: string
  albumReleaseYear: number | null
  albumCoverUrl: string
  songName: string
  spotifyUrl: string
  previewUrl: string
  difficulty: "easy" | "medium" | "hard"
}

export default function AdminCardsPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [cards, setCards] = useState<CardData[]>([])
  const [loadingCards, setLoadingCards] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingCard, setDeletingCard] = useState<CardData | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [cardForm, setCardForm] = useState<CardForm>({
    deckId: null,
    artistName: "",
    artistCountry: "",
    artistGenre: "",
    albumTitle: "",
    albumReleaseYear: null,
    albumCoverUrl: "",
    songName: "",
    spotifyUrl: "",
    previewUrl: "",
    difficulty: "medium",
  })

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, isLoading, router])

  useEffect(() => {
    fetchDecks()
    fetchCards()
  }, [])

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/proxy/decks")
      if (response.ok) {
        const data = await response.json()
        setDecks(data.data.decks || [])
      }
    } catch (error) {
      console.error("Error fetching decks:", error)
    }
  }

  const fetchCards = async () => {
    try {
      const response = await fetch("/api/proxy/cards")
      if (response.ok) {
        const data = await response.json()
        setCards(data.data.cards || [])
      }
    } catch (error) {
      console.error("Error fetching cards:", error)
    } finally {
      setLoadingCards(false)
    }
  }

  const handleSave = async () => {
    if (!cardForm.deckId || !cardForm.artistName || !cardForm.songName) {
      alert("Por favor completa los campos requeridos")
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/proxy/admin/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardForm),
      })

      if (response.ok) {
        alert("Carta creada exitosamente")
        setIsCreating(false)
        resetForm()
        await fetchCards()
      } else {
        const error = await response.json()
        alert(error.message || "Error al crear la carta")
      }
    } catch (error) {
      console.error("Error saving card:", error)
      alert("Error al crear la carta")
    }
  }

  const handleDelete = async (card: CardData, force = false) => {
    try {
      const token = localStorage.getItem("adminToken")
      const url = force ? `/api/proxy/admin/cards/${card.id}?force=true` : `/api/proxy/admin/cards/${card.id}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "Carta eliminada exitosamente")
        setDeletingCard(null)
        setDeleteWarning(null)
        await fetchCards()
      } else {
        if (data.data?.suggestion) {
          setDeleteWarning(`${data.message}\n\nVeces jugada: ${data.data.timesPlayed || 0}`)
        } else {
          alert(data.message || "Error al eliminar la carta")
          setDeletingCard(null)
        }
      }
    } catch (error) {
      console.error("Error deleting card:", error)
      alert("Error al eliminar la carta")
    }
  }

  const resetForm = () => {
    setCardForm({
      deckId: null,
      artistName: "",
      artistCountry: "",
      artistGenre: "",
      albumTitle: "",
      albumReleaseYear: null,
      albumCoverUrl: "",
      songName: "",
      spotifyUrl: "",
      previewUrl: "",
      difficulty: "medium",
    })
  }

  if (isLoading || !admin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-black">
      <AdminNav />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Gestión de Cartas</h1>
            <Button onClick={() => setIsCreating(!isCreating)} className="bg-white text-black hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Cancelar" : "Crear Carta"}
            </Button>
          </div>

          {deletingCard && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Confirmar Eliminación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300">
                  ¿Estás seguro que deseas eliminar la carta <strong>{deletingCard.songName}</strong> de{" "}
                  <strong>{deletingCard.artist.name}</strong>?
                </p>
                {deleteWarning && (
                  <div className="bg-yellow-950 border border-yellow-800 rounded p-4">
                    <p className="text-yellow-200 whitespace-pre-line text-sm">{deleteWarning}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  {deleteWarning ? (
                    <>
                      <Button
                        onClick={() => handleDelete(deletingCard, true)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar Forzadamente
                      </Button>
                      <Button
                        onClick={() => {
                          setDeletingCard(null)
                          setDeleteWarning(null)
                        }}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleDelete(deletingCard)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Sí, Eliminar
                      </Button>
                      <Button
                        onClick={() => setDeletingCard(null)}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isCreating && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Crear Nueva Carta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deckId" className="text-zinc-300">
                    Mazo *
                  </Label>
                  <Select
                    value={cardForm.deckId?.toString()}
                    onValueChange={(value) => setCardForm({ ...cardForm, deckId: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Selecciona un mazo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {decks.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistName" className="text-zinc-300">
                      Artista *
                    </Label>
                    <Input
                      id="artistName"
                      value={cardForm.artistName}
                      onChange={(e) => setCardForm({ ...cardForm, artistName: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: Queen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songName" className="text-zinc-300">
                      Canción *
                    </Label>
                    <Input
                      id="songName"
                      value={cardForm.songName}
                      onChange={(e) => setCardForm({ ...cardForm, songName: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: Bohemian Rhapsody"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistCountry" className="text-zinc-300">
                      País
                    </Label>
                    <Input
                      id="artistCountry"
                      value={cardForm.artistCountry}
                      onChange={(e) => setCardForm({ ...cardForm, artistCountry: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: UK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artistGenre" className="text-zinc-300">
                      Género
                    </Label>
                    <Input
                      id="artistGenre"
                      value={cardForm.artistGenre}
                      onChange={(e) => setCardForm({ ...cardForm, artistGenre: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: Rock"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="albumTitle" className="text-zinc-300">
                      Álbum
                    </Label>
                    <Input
                      id="albumTitle"
                      value={cardForm.albumTitle}
                      onChange={(e) => setCardForm({ ...cardForm, albumTitle: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: A Night at the Opera"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="albumReleaseYear" className="text-zinc-300">
                      Año
                    </Label>
                    <Input
                      id="albumReleaseYear"
                      type="number"
                      min="1900"
                      max="2025"
                      value={cardForm.albumReleaseYear || ""}
                      onChange={(e) =>
                        setCardForm({
                          ...cardForm,
                          albumReleaseYear: Number.parseInt(e.target.value) || null,
                        })
                      }
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="1975"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-zinc-300">
                      Dificultad
                    </Label>
                    <Select
                      value={cardForm.difficulty}
                      onValueChange={(value: "easy" | "medium" | "hard") =>
                        setCardForm({ ...cardForm, difficulty: value })
                      }
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Medio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="albumCoverUrl" className="text-zinc-300">
                    URL de Portada del Álbum
                  </Label>
                  <Input
                    id="albumCoverUrl"
                    value={cardForm.albumCoverUrl}
                    onChange={(e) => setCardForm({ ...cardForm, albumCoverUrl: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spotifyUrl" className="text-zinc-300">
                      URL de Spotify
                    </Label>
                    <Input
                      id="spotifyUrl"
                      value={cardForm.spotifyUrl}
                      onChange={(e) => setCardForm({ ...cardForm, spotifyUrl: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="https://open.spotify.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previewUrl" className="text-zinc-300">
                      URL de Preview
                    </Label>
                    <Input
                      id="previewUrl"
                      value={cardForm.previewUrl}
                      onChange={(e) => setCardForm({ ...cardForm, previewUrl: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="w-4 h-4 mr-2" />
                    Crear Carta
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreating(false)
                      resetForm()
                    }}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Cartas Existentes</h2>
            {loadingCards ? (
              <div className="text-zinc-400">Cargando cartas...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <Card key={card.id} className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center justify-between">
                        <span className="truncate">{card.songName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingCard(card)}
                          className="text-zinc-400 hover:text-red-400 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-400 mb-1">
                        <strong>Artista:</strong> {card.artist.name}
                      </p>
                      {card.album && (
                        <p className="text-sm text-zinc-400 mb-1">
                          <strong>Álbum:</strong> {card.album.title}
                          {card.album.releaseYear && ` (${card.album.releaseYear})`}
                        </p>
                      )}
                      <p className="text-sm text-zinc-400 mb-1">
                        <strong>Mazo:</strong> {card.deck.title}
                      </p>
                      <p className="text-sm text-zinc-400">
                        <strong>Dificultad:</strong> <span className="capitalize">{card.difficulty}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
