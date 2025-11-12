/**
 * Configuración centralizada de URLs del backend
 */

// URL del backend - prioriza la variable de entorno, luego ngrok, y finalmente localhost
export const BACKEND_URL = 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  "https://ellena-hyperaemic-numbers.ngrok-free.dev" || 
  "http://localhost:3001"

// URL base para las APIs que pasan por el proxy
export const API_BASE_URL = "/api/proxy"

// Helper para construir URLs de API
export const buildApiUrl = (path: string) => {
  return `${API_BASE_URL}/${path.startsWith('/') ? path.slice(1) : path}`
}

// Helper para construir URLs directas al backend (para casos especiales)
export const buildDirectUrl = (path: string) => {
  return `${BACKEND_URL}/${path.startsWith('/') ? path.slice(1) : path}`
}

// Configuración de headers comunes
export const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

export default {
  BACKEND_URL,
  API_BASE_URL,
  buildApiUrl,
  buildDirectUrl,
  getAuthHeaders,
}