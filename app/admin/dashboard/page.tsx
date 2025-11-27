"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { AdminNav } from "@/components/features/admin/AdminNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Music, CreditCard, Gamepad2 } from "lucide-react"

interface Stats {
  users: { total: number; active: number }
  decks: { total: number; active: number }
  cards: { total: number }
  games: { total: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { admin, isLoading } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, isLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("adminToken")
        const response = await fetch("/api/proxy/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.data.stats)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (admin) {
      fetchStats()
    }
  }, [admin])

  if (isLoading || !admin) {
    return null
  }

  const statCards = [
    {
      title: "Usuarios",
      value: stats?.users.total || 0,
      subtitle: `${stats?.users.active || 0} activos`,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Mazos",
      value: stats?.decks.total || 0,
      subtitle: `${stats?.decks.active || 0} activos`,
      icon: Music,
      color: "text-purple-400",
    },
    {
      title: "Cartas",
      value: stats?.cards.total || 0,
      subtitle: "Total de cartas",
      icon: CreditCard,
      color: "text-green-400",
    },
    {
      title: "Partidas",
      value: stats?.games.total || 0,
      subtitle: "Total jugadas",
      icon: Gamepad2,
      color: "text-orange-400",
    },
  ]

  return (
    <div className="flex min-h-screen bg-black">
      <AdminNav />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

          {loading ? (
            <div className="text-zinc-400">Cargando estadísticas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title} className="bg-zinc-950 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <p className="text-xs text-zinc-500 mt-1">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}