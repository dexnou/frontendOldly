"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"

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

  // Memoizamos esta función para poder usarla en useEffect si fuera necesario
  const verifyToken = useCallback(async (authToken: string) => {
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
  }, [])

  // Login: Usamos useCallback para que la referencia a la función no cambie
  const login = useCallback((authToken: string, userData: User) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem("authToken", authToken)
    document.cookie = `authToken=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}`
  }, [])

  // Logout: Usamos useCallback
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("authToken")
    document.cookie = "authToken=; path=/; max-age=0"
  }, [])

  // Verificar autenticación al cargar
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken()

      if (storedToken) {
        const userData = await verifyToken(storedToken)
        if (userData) {
          // Actualizamos el estado directamente sin llamar a 'login' aquí 
          // para evitar dependencias circulares complejas en la inicialización
          setToken(storedToken)
          setUser(userData)
        } else {
          // Token inválido, limpiar
          localStorage.removeItem("authToken")
          document.cookie = "authToken=; path=/; max-age=0"
          setToken(null)
          setUser(null)
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [verifyToken]) // verifyToken es estable ahora

  // Memoizamos el valor del contexto para evitar renderizados innecesarios en los consumidores
  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    token,
    login,
    logout,
    loading,
  }), [user, token, login, logout, loading])

  return (
    <AuthContext.Provider value={value}>
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