"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { AdminNav } from "@/components/features/admin/AdminNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"

export default function AdminUsersPage() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, isLoading, router])

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
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `users-export.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Error al exportar usuarios")
      }
    } catch (error) {
      console.error("Error exporting users:", error)
      alert("Error al exportar usuarios")
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Gestión de Usuarios</h1>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Exportar Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400">
                Exporta la lista completa de usuarios registrados en el sistema en formato JSON o CSV.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleExport("json")}
                  disabled={exporting}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? "Exportando..." : "Exportar JSON"}
                </Button>
                <Button
                  onClick={() => handleExport("csv")}
                  disabled={exporting}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? "Exportando..." : "Exportar CSV"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
