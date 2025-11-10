"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Music, CreditCard, Users, LogOut } from "lucide-react"

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAdminAuth()

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/decks", label: "Mazos", icon: Music },
    { href: "/admin/cards", label: "Cartas", icon: CreditCard },
    { href: "/admin/users", label: "Usuarios", icon: Users },
  ]

  return (
    <div className="h-screen w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-zinc-400 mt-1">{admin?.name}</p>
        <p className="text-xs text-zinc-500 capitalize">{admin?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
