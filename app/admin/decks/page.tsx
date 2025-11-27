"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { AdminNav } from "@/components/features/admin/AdminNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Save, X, Eye, Music, Disc } from "lucide-react"

interface Deck {
  id: number
  title: string
  description: string
  theme: string
  buyLink: string
  coverImage: string
  active: boolean
  labelSong: string
  labelArtist: string
  labelAlbum: string
  _count?: { cards: number }
}

interface DeckCard {
  id: string
  songName: string
  difficulty: string
  artist: { name: string }
  album?: { title: string }
}

export default function AdminDecksPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "",
    buyLink: "",
    coverImage: "",
    active: true,
    labelSong: "Canción",
    labelArtist: "Artista",
    labelAlbum: "Álbum"
  })

  const [viewingDeck, setViewingDeck] = useState<Deck | null>(null)
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)

  useEffect(() => {
    if (!isLoading && !admin) router.push("/admin/login")
  }, [admin, isLoading, router])

  useEffect(() => {
    fetchDecks()
  }, [])

  const fetchDecks = async () => {
    try {
      const res = await fetch("/api/proxy/admin/decks", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDecks(data.data.decks)
      }
    } catch (error) {
      console.error("Error fetching decks:", error)
    }
  }

  const fetchDeckCards = async (deckId: number) => {
    setLoadingCards(true)
    setDeckCards([])
    try {
      const res = await fetch(`/api/proxy/cards?deckId=${deckId}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setDeckCards(data.data.cards)
      }
    } catch (error) {
      console.error("Error fetching deck cards:", error)
    } finally {
      setLoadingCards(false)
    }
  }

  const handleViewCards = (deck: Deck) => {
    setViewingDeck(deck)
    fetchDeckCards(deck.id)
  }

  const handleSubmit = async () => {
    const url = editingId 
      ? `/api/proxy/admin/decks/${editingId}` 
      : "/api/proxy/admin/decks"
    
    const method = editingId ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchDecks()
        setIsFormOpen(false)
        resetForm()
      } else {
        alert("Error al guardar el mazo")
      }
    } catch (error) {
      console.error("Error submitting deck:", error)
      alert("Error de conexión")
    }
  }

  const handleEdit = (deck: Deck) => {
    setEditingId(deck.id)
    setFormData({
      title: deck.title,
      description: deck.description || "",
      theme: deck.theme,
      buyLink: deck.buyLink || "",
      coverImage: deck.coverImage || "",
      active: deck.active,
      labelSong: deck.labelSong || "Canción",
      labelArtist: deck.labelArtist || "Artista",
      labelAlbum: deck.labelAlbum || "Álbum"
    })
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: "",
      description: "",
      theme: "",
      buyLink: "",
      coverImage: "",
      active: true,
      labelSong: "Canción",
      labelArtist: "Artista",
      labelAlbum: "Álbum"
    })
  }

  if (isLoading || !admin) return null

  return (
    <div className="flex min-h-screen bg-black">
      <AdminNav />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Gestión de Mazos</h1>
            <Button onClick={() => { setIsFormOpen(!isFormOpen); resetForm(); }} className="bg-white text-black hover:bg-zinc-200">
              {isFormOpen ? <><X className="mr-2 h-4 w-4"/> Cancelar</> : <><Plus className="mr-2 h-4 w-4"/> Nuevo Mazo</>}
            </Button>
          </div>

          {isFormOpen && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">{editingId ? "Editar Mazo" : "Crear Nuevo Mazo"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Título</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tema (ID interno)</Label>
                    <Input value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" placeholder="ej: 80s, movies" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Descripción</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>

                <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
                  <h3 className="text-zinc-400 font-semibold mb-3 text-sm uppercase tracking-wider">Personalizar Textos de Juego</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Label 1 (Default: Canción)</Label>
                      <Input value={formData.labelSong} onChange={e => setFormData({...formData, labelSong: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" placeholder="Ej: Canción" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Label 2 (Default: Artista)</Label>
                      <Input value={formData.labelArtist} onChange={e => setFormData({...formData, labelArtist: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" placeholder="Ej: Artista" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Label 3 (Default: Álbum)</Label>
                      <Input value={formData.labelAlbum} onChange={e => setFormData({...formData, labelAlbum: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" placeholder="Ej: Álbum" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={formData.active} onCheckedChange={checked => setFormData({...formData, active: checked})} />
                  <Label className="text-zinc-300">Mazo Activo</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="mr-2 h-4 w-4" /> Guardar
                  </Button>
                  <Button onClick={() => setIsFormOpen(false)} className="bg-white text-black hover:bg-zinc-200">
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {decks.map((deck) => (
              <Card key={deck.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="cursor-pointer flex-1" onClick={() => handleViewCards(deck)}>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">{deck.title}</h3>
                        {!deck.active && <span className="text-xs bg-red-900/50 text-red-200 px-2 py-0.5 rounded border border-red-800">Inactivo</span>}
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-1">{deck.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                      <span>Tema: {deck.theme}</span>
                      <span className="text-zinc-300 font-medium">Cartas: {deck._count?.cards || 0}</span>
                      <span className="text-zinc-600">Labels: {deck.labelSong}, {deck.labelArtist}, {deck.labelAlbum}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* BOTÓN ACTUALIZADO: Fondo blanco, texto negro */}
                    <Button 
                      onClick={() => handleViewCards(deck)} 
                      size="sm" 
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                        <Eye className="h-4 w-4 mr-2" /> Ver Cartas
                    </Button>
                    
                    <Button onClick={() => handleEdit(deck)} variant="ghost" className="text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20">
                        <Pencil className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!viewingDeck} onOpenChange={(open) => !open && setViewingDeck(null)}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-400" />
                  Cartas de {viewingDeck?.title}
                </DialogTitle>
                <div className="text-sm text-zinc-400">
                    Total: {deckCards.length} cartas
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto pr-2 mt-4">
                {loadingCards ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : deckCards.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        No hay cartas en este mazo todavía.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {deckCards.map((card) => (
                            <div key={card.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-900 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-white text-sm line-clamp-1">{card.songName}</h4>
                                        <p className="text-xs text-zinc-400 mt-0.5">{card.artist.name}</p>
                                        {card.album && <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1"><Disc className="w-3 h-3"/> {card.album.title}</p>}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                                        card.difficulty === 'easy' ? 'bg-green-900/30 text-green-400 border-green-900' :
                                        card.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900' :
                                        'bg-red-900/30 text-red-400 border-red-900'
                                    }`}>
                                        {card.difficulty}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end pt-2 border-t border-zinc-800">
                <Button onClick={() => setViewingDeck(null)} className="bg-white text-black hover:bg-zinc-200">
                    Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}