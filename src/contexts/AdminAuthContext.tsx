"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Admin {
  id: string
  name: string
  email: string
  role: "super" | "editor"
}

interface AdminAuthContextType {
  admin: Admin | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    const storedAdmin = localStorage.getItem("admin")

    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/proxy/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Error al iniciar sesión")
    }

    const data = await response.json()

    if (data.success && data.data) {
      localStorage.setItem("adminToken", data.data.token)
      localStorage.setItem("admin", JSON.stringify(data.data.admin))
      setAdmin(data.data.admin)
    }
  }

  const logout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")
    setAdmin(null)
  }

  return <AdminAuthContext.Provider value={{ admin, login, logout, isLoading }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}
