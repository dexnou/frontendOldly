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
import { Plus, Save, X, Trash2, Pencil } from "lucide-react"

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
  previewUrl?: string // Se mantiene en la interfaz de datos por si viene del backend
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
  // previewUrl eliminado del formulario
  difficulty: "easy" | "medium" | "hard"
}

export default function AdminCardsPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [cards, setCards] = useState<CardData[]>([])
  const [loadingCards, setLoadingCards] = useState(true)
  
  // Estados para UI
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  
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

  // Función para preparar el formulario en modo edición
  const handleEdit = (card: CardData) => {
    setEditingCardId(card.id)
    setCardForm({
      deckId: card.deck.id,
      artistName: card.artist.name,
      artistCountry: card.artist.country || "",
      artistGenre: card.artist.genre || "",
      albumTitle: card.album?.title || "",
      albumReleaseYear: card.album?.releaseYear || null,
      albumCoverUrl: card.album?.coverUrl || "",
      songName: card.songName,
      spotifyUrl: card.spotifyUrl || "",
      // previewUrl no se carga en el formulario
      difficulty: (card.difficulty as "easy" | "medium" | "hard") || "medium",
    })
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!cardForm.deckId || !cardForm.artistName || !cardForm.songName) {
      alert("Por favor completa los campos requeridos (Mazo, Artista, Canción)")
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      const isEditing = editingCardId !== null
      
      const url = isEditing 
        ? `/api/proxy/admin/cards/${editingCardId}`
        : "/api/proxy/admin/cards"
      
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardForm),
      })

      if (response.ok) {
        alert(isEditing ? "Carta actualizada exitosamente" : "Carta creada exitosamente")
        setIsFormOpen(false)
        resetForm()
        await fetchCards()
      } else {
        const error = await response.json()
        alert(error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la carta`)
      }
    } catch (error) {
      console.error("Error saving card:", error)
      alert("Error de conexión")
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
    setEditingCardId(null)
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
            <Button 
              onClick={() => {
                if (isFormOpen) {
                  setIsFormOpen(false)
                  resetForm()
                } else {
                  setIsFormOpen(true)
                  resetForm()
                }
              }} 
              className="bg-white text-black hover:bg-zinc-200"
            >
              {isFormOpen ? (
                <>
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Crear Carta
                </>
              )}
            </Button>
          </div>

          {/* Modal de confirmación de borrado */}
          {deletingCard && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8 border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-500">Confirmar Eliminación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300">
                  ¿Estás seguro que deseas eliminar la carta <strong>{deletingCard.songName}</strong> de{" "}
                  <strong>{deletingCard.artist.name}</strong>?
                </p>
                {deleteWarning && (
                  <div className="bg-yellow-950/50 border border-yellow-800 rounded p-4">
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
                        className="bg-white text-black hover:bg-zinc-200"
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
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario de Creación / Edición */}
          {isFormOpen && (
            <Card className={`bg-zinc-950 border-zinc-800 mb-8 ${editingCardId ? 'border-blue-900/50' : ''}`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {editingCardId ? <Pencil className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />}
                  {editingCardId ? "Editar Carta Existente" : "Crear Nueva Carta"}
                </CardTitle>
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

                {/* URL de Spotify ahora ocupa todo el ancho */}
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

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="w-4 h-4 mr-2" />
                    {editingCardId ? "Actualizar Carta" : "Crear Carta"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsFormOpen(false)
                      resetForm()
                    }}
                    className="bg-white text-black hover:bg-zinc-200"
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
                  <Card key={card.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center justify-between">
                        <span className="truncate max-w-[70%]" title={card.songName}>{card.songName}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(card)}
                            className="text-zinc-400 hover:text-blue-400 hover:bg-blue-950/30"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCard(card)}
                            className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                      <div className="flex justify-between items-center mt-2">
                         <p className="text-sm text-zinc-400">
                          <strong>Dificultad:</strong> <span className="capitalize">{card.difficulty}</span>
                        </p>
                        <span className="text-xs bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-800 font-mono">
                          {card.qrToken}
                        </span>
                      </div>
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