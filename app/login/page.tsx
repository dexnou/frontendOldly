"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Redirección destino (ej: QR)
  const redirectTo = searchParams.get("redirect") || "/"

  // Login manual
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Attempting login via proxy")
      const res = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("[v0] Login response status:", res.status)
      const text = await res.text()
      console.log("[v0] Login response text:", text.substring(0, 200))

      const data = JSON.parse(text)

      if (!res.ok) throw new Error(data.message || "Credenciales incorrectas")

      // Usar el contexto de autenticación para guardar el token y usuario
      login(data.data.token, data.data.user)

      router.push(redirectTo)
    } catch (err: any) {
      console.error("[v0] Error en login:", err)
      setError(err.message || "Error de login")
    } finally {
      setLoading(false)
    }
  }

  // Login con Google
  const handleGoogleLogin = () => {
    // Redirige a endpoint OAuth del backend
    window.location.href = `${BACKEND_URL}/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`
  }

  // Registro manual
  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validaciones básicas
    if (!firstname.trim() || !lastname.trim()) {
      setError("Nombre y apellido son requeridos")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Attempting register via proxy")
      const res = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
          password,
          whatsapp: whatsapp.trim() || undefined,
        }),
      })

      console.log("[v0] Register response status:", res.status)
      const text = await res.text()
      console.log("[v0] Register response text:", text.substring(0, 200))

      const data = JSON.parse(text)

      if (!res.ok) throw new Error(data.message || "No se pudo registrar")

      // Si registro OK, usar el contexto para login automático
      login(data.data.token, data.data.user)

      router.push(redirectTo)
    } catch (err: any) {
      console.error("[v0] Error en registro:", err)
      setError(err.message || "Error de registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">{isRegistering ? "Crear cuenta" : "Iniciar sesión"}</h1>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

        {!isRegistering ? (
          // Formulario de Login
          <>
            <form onSubmit={handleManualLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="my-4 text-center text-gray-500">o</div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <g>
                  <path
                    fill="#4285F4"
                    d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C36.53 2.36 30.7 0 24 0 14.64 0 6.27 5.48 1.98 13.44l8.06 6.27C12.6 13.16 17.87 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.1 28.71c-1.13-3.36-1.13-6.96 0-10.32l-7.19-5.59C36.53 37.36 46.1 31.44 46.1 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.04 28.71c-1.13-3.36-1.13-6.96 0-10.32l-8.06-6.27C.36 16.7 0 20.28 0 24c0 3.72.36 7.3 1.98 10.88l8.06-6.27z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 48c6.7 0 12.36-2.21 16.48-6.02l-7.19-5.59c-2.01 1.35-4.59 2.16-7.29 2.16-6.13 0-11.4-3.66-13.96-8.97l-8.06 6.27C6.27 42.52 14.64 48 24 48z"
                  />
                </g>
              </svg>
              Ingresar con Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-600">¿No tienes cuenta?</p>
              <button onClick={() => setIsRegistering(true)} className="text-blue-600 hover:text-blue-700 font-medium">
                Crear cuenta aquí
              </button>
            </div>
          </>
        ) : (
          // Formulario de Registro
          <>
            <form onSubmit={handleManualRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <input
                type="tel"
                placeholder="WhatsApp (opcional)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">¿Ya tienes cuenta?</p>
              <button onClick={() => setIsRegistering(false)} className="text-blue-600 hover:text-blue-700 font-medium">
                Iniciar sesión aquí
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
