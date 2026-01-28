"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { login } = useAuth()

  // Estados
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const redirectTo = searchParams.get("redirect") || "/"

  // Login Handler
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Credenciales incorrectas")
      }

      if (!data?.data?.token) throw new Error("Error del servidor")

      login(data.data.token, data.data.user)
      router.push(redirectTo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Google Login Handler
  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`
  }

  // Register Handler
  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
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

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (data?.errorCode === 'EMAIL_EXISTS') {
          setError("Este email ya está registrado.")
          setLoading(false)
          return
        }
        throw new Error(data?.message || "Error al registrarse")
      }

      if (!data?.data?.token) throw new Error("Error del servidor")

      login(data.data.token, data.data.user)
      router.push(redirectTo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {/* Botón volver */}
      <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors">
        ← Volver al inicio
      </Link>

      <div className="w-full max-w-md">
        {/* Header con Logo */}
        <div className="text-center mb-8">
          <div className="relative w-48 h-24 mx-auto mb-4 transition-transform hover:scale-105 duration-300">
            <Image src="/oldyfunlogo.svg" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRegistering ? "Únete a la comunidad de Oldy Fans" : "Ingresa para acceder a tus decks"}
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl shadow-black/20">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {!isRegistering ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-input"
                  required
                />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">O continúa con</span></div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black hover:bg-gray-100 border-border"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Google
              </Button>
            </form>
          ) : (
            /* --- REGISTER FORM --- */
            <form onSubmit={handleManualRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="bg-secondary border-input"
                  required
                />
                <Input
                  placeholder="Apellido"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="bg-secondary border-input"
                  required
                />
              </div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-input"
                required
              />
              <Input
                type="password"
                placeholder="Contraseña (mín 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-input"
                required
              />
              <Input
                type="tel"
                placeholder="WhatsApp (Opcional)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-secondary border-input"
              />

              <Button type="submit" className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                {loading ? "Creando cuenta..." : "Registrarse Gratis"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isRegistering ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            </span>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-primary hover:underline font-medium"
            >
              {isRegistering ? "Inicia sesión" : "Regístrate aquí"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <LoginContent />
    </Suspense>
  )
}