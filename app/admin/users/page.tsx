"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { AdminNav } from "@/components/features/admin/AdminNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Users, Calendar, Activity } from "lucide-react"

interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  whatsapp?: string
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
  hasGoogleAuth: boolean
  stats: {
    totalPoints: number
    totalGames: number
    decksOwned: number
    gamesStarted: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, isLoading, router])

  useEffect(() => {
    if (admin) {
      loadUsers()
    }
  }, [admin])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch('/api/proxy/admin/users/export?format=json', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data.users || [])
        }
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/proxy/admin/users/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = `usuarios_export.${format}`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Show success message with details
        if (format === 'csv') {
          alert("✅ Archivo CSV exportado exitosamente")
        } else {
          alert("✅ Archivo JSON exportado exitosamente (formato legible)")
        }
      } else {
        const errorData = await response.text()
        console.error('Export error:', errorData)
        alert("❌ Error al exportar usuarios")
      }
    } catch (error) {
      console.error("Error exporting users:", error)
      alert("❌ Error de conexión al exportar usuarios")
    } finally {
      setExporting(false)
    }
  }

  if (isLoading || !admin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-black">
      <AdminNav />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
            <div className="flex items-center gap-2 text-zinc-400">
              <Users className="w-5 h-5" />
              <span>{users.length} usuarios registrados</span>
            </div>
          </div>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Exportar Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400">
                Exporta la lista completa de usuarios registrados en el sistema en formato JSON o CSV.
              </p>
              
              <div className="space-y-3">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">📄 Formato JSON</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Incluye datos estructurados con estadísticas detalladas de cada usuario.
                    El archivo será formateado y legible con indentación.
                  </p>
                  <Button
                    onClick={() => handleExport("json")}
                    disabled={exporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? "Exportando..." : "Exportar JSON"}
                  </Button>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">📊 Formato CSV</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Compatible con Excel y otras hojas de cálculo. 
                    Incluye todos los usuarios con sus estadísticas en columnas separadas.
                  </p>
                  <Button
                    onClick={() => handleExport("csv")}
                    disabled={exporting}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </div>
              </div>

              {exporting && (
                <div className="bg-blue-900/30 border border-blue-800 p-3 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    ⏳ Procesando exportación... Esto puede tomar unos segundos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vista previa de usuarios */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Vista Previa de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-zinc-400">Cargando usuarios...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No hay usuarios registrados
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Usuarios</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{users.length}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">Activos</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{users.filter(u => u.isActive).length}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-400 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Con Google</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{users.filter(u => u.hasGoogleAuth).length}</span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid gap-3">
                      {users.slice(0, 10).map((user) => (
                        <div key={user.id} className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-medium">
                                {user.firstname} {user.lastname}
                              </h4>
                              <p className="text-zinc-400 text-sm">{user.email}</p>
                              {user.whatsapp && (
                                <p className="text-zinc-500 text-xs">WhatsApp: {user.whatsapp}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                <span className="text-xs text-zinc-400">
                                  {user.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-500">
                                Registrado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-blue-400 font-medium">{user.stats.totalPoints}</div>
                              <div className="text-zinc-500">Puntos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-400 font-medium">{user.stats.totalGames}</div>
                              <div className="text-zinc-500">Juegos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-400 font-medium">{user.stats.decksOwned}</div>
                              <div className="text-zinc-500">Mazos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-orange-400 font-medium">{user.stats.gamesStarted}</div>
                              <div className="text-zinc-500">Iniciados</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {users.length > 10 && (
                      <div className="text-center py-4">
                        <p className="text-zinc-500 text-sm">
                          Mostrando los primeros 10 de {users.length} usuarios.
                          Exporta el archivo completo para ver todos.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
