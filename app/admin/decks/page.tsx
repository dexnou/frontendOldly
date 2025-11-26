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
import { Plus, Pencil, Save, X } from "lucide-react"

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

      const data = await res.json() // Leemos la respuesta

      if (res.ok) {
        fetchDecks()
        setIsFormOpen(false)
        resetForm()
        alert(editingId ? "Mazo actualizado correctamente" : "Mazo creado correctamente")
      } else {
        // Mostrar el mensaje específico del backend o los errores de validación
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((e: any) => e.msg).join('\n')
          alert(`Error de validación:\n${errorMessages}`)
        } else {
          alert(data.message || "Error al guardar el mazo")
        }
      }
    } catch (error) {
      console.error("Error submitting deck:", error)
      alert("Error de conexión con el servidor")
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
                  {/* Botón Cancelar con el mismo estilo solicitado */}
                  <Button onClick={() => setIsFormOpen(false)} className="bg-white text-black hover:bg-zinc-200">
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {decks.map((deck) => (
              <Card key={deck.id} className="bg-zinc-950 border-zinc-800">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{deck.title}</h3>
                    <p className="text-zinc-400 text-sm">{deck.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                      <span>Tema: {deck.theme}</span>
                      <span>Cartas: {deck._count?.cards || 0}</span>
                      <span className="text-zinc-400">Labels: {deck.labelSong}, {deck.labelArtist}, {deck.labelAlbum}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleEdit(deck)} variant="ghost" className="text-zinc-400 hover:text-white">
                    <Pencil className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}