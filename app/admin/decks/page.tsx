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
import { Plus, Edit, Save, X, Trash2 } from "lucide-react"

interface Deck {
  id: number
  title: string
  description: string
  theme: string
  buyLink?: string
  coverImage?: string
  active: boolean
  cardCount?: number
}

export default function AdminDecksPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDeck, setEditingDeck] = useState<Partial<Deck> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, isLoading, router])

  useEffect(() => {
    fetchDecks()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingDeck) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/proxy/admin/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingDeck),
      })

      if (response.ok) {
        await fetchDecks()
        setEditingDeck(null)
        setIsCreating(false)
      } else {
        const error = await response.json()
        alert(error.message || "Error al guardar el mazo")
      }
    } catch (error) {
      console.error("Error saving deck:", error)
      alert("Error al guardar el mazo")
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingDeck({
      title: "",
      description: "",
      theme: "",
      buyLink: "",
      coverImage: "",
      active: true,
    })
  }

  const handleEdit = (deck: Deck) => {
    setIsCreating(false)
    setEditingDeck(deck)
  }

  const handleCancel = () => {
    setEditingDeck(null)
    setIsCreating(false)
  }

  const handleDelete = async (deck: Deck, force = false) => {
    try {
      const token = localStorage.getItem("adminToken")
      const url = force ? `/api/proxy/admin/decks/${deck.id}?force=true` : `/api/proxy/admin/decks/${deck.id}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "Mazo eliminado exitosamente")
        setDeletingDeck(null)
        setDeleteWarning(null)
        await fetchDecks()
      } else {
        // Show warning with suggestion to use force
        if (data.data?.suggestion) {
          setDeleteWarning(
            `${data.message}\n\nCartas: ${data.data.cardCount || 0}\nUsuarios afectados: ${data.data.userCount || 0}\nPartidas: ${data.data.gameCount || 0}`,
          )
        } else {
          alert(data.message || "Error al eliminar el mazo")
          setDeletingDeck(null)
        }
      }
    } catch (error) {
      console.error("Error deleting deck:", error)
      alert("Error al eliminar el mazo")
    }
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
            <h1 className="text-3xl font-bold text-white">Gestión de Mazos</h1>
            <Button onClick={handleCreate} className="bg-white text-black hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" />
              Crear Mazo
            </Button>
          </div>

          {deletingDeck && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Confirmar Eliminación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300">
                  ¿Estás seguro que deseas eliminar el mazo <strong>{deletingDeck.title}</strong>?
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
                        onClick={() => handleDelete(deletingDeck, true)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar Forzadamente
                      </Button>
                      <Button
                        onClick={() => {
                          setDeletingDeck(null)
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
                        onClick={() => handleDelete(deletingDeck)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Sí, Eliminar
                      </Button>
                      <Button
                        onClick={() => setDeletingDeck(null)}
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

          {editingDeck && (
            <Card className="bg-zinc-950 border-zinc-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">{isCreating ? "Crear Nuevo Mazo" : "Editar Mazo"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-zinc-300">
                      Título *
                    </Label>
                    <Input
                      id="title"
                      value={editingDeck.title || ""}
                      onChange={(e) => setEditingDeck({ ...editingDeck, title: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: Rock Clásico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-zinc-300">
                      Tema *
                    </Label>
                    <Input
                      id="theme"
                      value={editingDeck.theme || ""}
                      onChange={(e) => setEditingDeck({ ...editingDeck, theme: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="Ej: rock"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={editingDeck.description || ""}
                    onChange={(e) => setEditingDeck({ ...editingDeck, description: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="Descripción del mazo"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyLink" className="text-zinc-300">
                      Link de Compra
                    </Label>
                    <Input
                      id="buyLink"
                      value={editingDeck.buyLink || ""}
                      onChange={(e) => setEditingDeck({ ...editingDeck, buyLink: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverImage" className="text-zinc-300">
                      Imagen de Portada (URL)
                    </Label>
                    <Input
                      id="coverImage"
                      value={editingDeck.coverImage || ""}
                      onChange={(e) => setEditingDeck({ ...editingDeck, coverImage: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-zinc-400">Cargando mazos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <Card key={deck.id} className="bg-zinc-950 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{deck.title}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(deck)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingDeck(deck)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400 mb-2">{deck.description}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="capitalize">Tema: {deck.theme}</span>
                      <span>{deck.cardCount || 0} cartas</span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          deck.active ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"
                        }`}
                      >
                        {deck.active ? "Activo" : "Inactivo"}
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
  )
}
