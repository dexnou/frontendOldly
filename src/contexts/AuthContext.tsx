"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  firstname?: string
  lastname?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ellena-hyperaemic-numbers.ngrok-free.dev" || "http://localhost:3001"

  // Función para obtener token desde localStorage o cookies
  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null

    // Primero intentar localStorage
    const storedToken = localStorage.getItem("authToken")
    if (storedToken) return storedToken

    // Si no hay en localStorage, intentar cookies
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "authToken") return value
    }

    return null
  }

  const verifyToken = async (authToken: string) => {
    try {
      const res = await fetch(`/api/proxy/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!res.ok) {
        console.warn("Token verification failed:", res.status, res.statusText)
        return null
      }

      const data = await res.json()
      return data.data?.user || null
    } catch (error) {
      console.error("Error verificando token (backend posiblemente no disponible):", error)
      return null
    }
  }

  // Login
  const login = (authToken: string, userData: User) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem("authToken", authToken)
    document.cookie = `authToken=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}`
  }

  // Logout
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("authToken")
    document.cookie = "authToken=; path=/; max-age=0"
  }

  // Verificar autenticación al cargar
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken()

      if (storedToken) {
        const userData = await verifyToken(storedToken)
        if (userData) {
          setToken(storedToken)
          setUser(userData)
        } else {
          // Token inválido, limpiar
          logout()
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
