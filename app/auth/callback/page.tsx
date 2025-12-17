"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Importamos el contexto

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Usamos la función login del estado global
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Procesando login...");

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectTo = searchParams.get("redirect") || "/";

    if (!token) {
      setStatus("error");
      setMessage("No se recibió token de autenticación");
      setTimeout(() => {
        router.push("/login?error=no_token");
      }, 2000);
      return;
    }

    const validateAndLogin = async () => {
      try {
        setMessage("Obteniendo datos de usuario...");
        
        // 1. Pedimos los datos del usuario al backend usando el token recibido
        const res = await fetch("/api/proxy/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("No se pudo verificar la sesión");
        }

        const data = await res.json();
        const user = data.data?.user;

        if (!user) {
          throw new Error("Datos de usuario inválidos");
        }

        // 2. IMPORTANTE: Actualizamos el contexto global Y guardamos en storage
        // La función 'login' del AuthContext ya se encarga del localStorage y cookies
        login(token, user);

        setStatus("success");
        setMessage("¡Login exitoso! Redirigiendo...");
        
        // 3. Redirigimos con el estado ya actualizado
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);

      } catch (error) {
        console.error("Error en callback:", error);
        setStatus("error");
        setMessage("Error al iniciar sesión. Intenta nuevamente.");
        setTimeout(() => {
          router.push("/login?error=callback_failed");
        }, 2000);
      }
    };

    validateAndLogin();
  }, [searchParams, router, login]);

  return (
    <div className="max-w-md w-full bg-card border border-border p-8 rounded-xl shadow-2xl text-center">
      {status === "loading" && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Cargando</h2>
          <p className="text-muted-foreground">{message}</p>
        </>
      )}
      
      {status === "success" && (
        <>
          <div className="text-green-500 text-6xl mb-4 animate-in zoom-in">✅</div>
          <h2 className="text-xl font-semibold mb-2 text-green-500">¡Listo!</h2>
          <p className="text-muted-foreground">{message}</p>
        </>
      )}
      
      {status === "error" && (
        <>
          <div className="text-destructive text-6xl mb-4 animate-in zoom-in">❌</div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground">{message}</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-xl shadow-md text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
           <h2 className="text-xl font-semibold mb-2 text-foreground">Iniciando...</h2>
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}