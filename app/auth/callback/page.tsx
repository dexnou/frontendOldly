"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// 1. Separamos la lógica que usa useSearchParams en un componente hijo
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectTo = searchParams.get("redirect") || "/";

    if (!token) {
      setStatus("error");
      setTimeout(() => {
        router.push("/login?error=no_token");
      }, 2000);
      return;
    }

    try {
      // Guardar token en localStorage
      localStorage.setItem("authToken", token);
      
      // También puedes guardarlo en cookies si prefieres
      document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 días

      setStatus("success");
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
      
    } catch (error) {
      console.error("Error procesando callback:", error);
      setStatus("error");
      setTimeout(() => {
        router.push("/login?error=callback_error");
      }, 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
      {status === "loading" && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Procesando login...</h2>
          <p className="text-gray-600">Configurando tu sesión</p>
        </>
      )}
      
      {status === "success" && (
        <>
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2 text-green-600">¡Login exitoso!</h2>
          <p className="text-gray-600">Redirigiendo...</p>
        </>
      )}
      
      {status === "error" && (
        <>
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error en el login</h2>
          <p className="text-gray-600">Redirigiendo al login...</p>
        </>
      )}
    </div>
  );
}

// 2. El componente de página principal envuelve el contenido en Suspense
export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
           <h2 className="text-xl font-semibold mb-2">Cargando...</h2>
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}