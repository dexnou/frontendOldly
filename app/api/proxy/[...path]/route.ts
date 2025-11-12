import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

console.log("[v0] Proxy initialized with BACKEND_URL:", BACKEND_URL)

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path, "GET")
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path, "POST")
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path, "PUT")
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path, "DELETE")
}

async function proxyRequest(request: NextRequest, pathParts: string[], method: string) {
  const path = pathParts.join("/")

  // Siempre agregar el prefijo api/ porque todos los endpoints del backend están bajo /api
  const fullPath = `api/${path}`
  const url = `${BACKEND_URL}/${fullPath}`

  console.log("[v0] Proxying request to:", url)
  console.log("[v0] Request method:", method)
  console.log("[v0] Request headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0] BACKEND_URL:", BACKEND_URL)

  try {
    const headers = new Headers()

    // Agregar headers necesarios
    headers.set("ngrok-skip-browser-warning", "true")
    headers.set("User-Agent", "v0-proxy")
    headers.set("Accept", "application/json")

    const contentType = request.headers.get("content-type")
    if (contentType) {
      headers.set("Content-Type", contentType)
    }

    const authorization = request.headers.get("authorization")
    if (authorization) {
      headers.set("Authorization", authorization)
      console.log("[v0] Authorization header found:", authorization.substring(0, 20) + "...")
    } else {
      console.log("[v0] No authorization header found")
    }

    let body = undefined
    if (method === "POST" || method === "PUT") {
      body = await request.text()
      console.log("[v0] Request body:", body)
    }

    console.log("[v0] Making fetch request with headers:", Object.fromEntries(headers.entries()))

    // Test connection first
    if (url.includes('localhost')) {
      try {
        const testResponse = await fetch(`${BACKEND_URL}/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        console.log("[v0] Backend health check status:", testResponse.status)
      } catch (healthError) {
        console.error("[v0] Backend health check failed:", healthError)
        return NextResponse.json(
          { 
            error: "Backend server not available", 
            details: `Cannot connect to ${BACKEND_URL}. Make sure the backend server is running on port 3001.`,
            healthCheckError: healthError instanceof Error ? healthError.message : "Unknown error"
          },
          { status: 503 }
        )
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))
    
    // Log response body for debugging
    const responseText = await response.text()
    console.log("[v0] Response body:", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""))

    // Check if this is a file download based on Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition")
    const responseContentType = response.headers.get("Content-Type")
    
    if (contentDisposition && contentDisposition.includes("attachment")) {
      // This is a file download, preserve binary content - re-fetch as we already consumed the body
      const fileResponse = await fetch(url, { method, headers, body })
      const buffer = await fileResponse.arrayBuffer()
      
      console.log("[v0] File download detected, size:", buffer.byteLength)
      
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          "Content-Type": responseContentType || "application/octet-stream",
          "Content-Disposition": contentDisposition,
        },
      })
    } else {
      // Regular response, treat as text/json
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          "Content-Type": responseContentType || "application/json",
        },
      })
    }
  } catch (error) {
    console.error("[v0] Proxy error details:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack available")
    console.error("[v0] Failed URL:", url)
    console.error("[v0] Method:", method)
    
    // Check if it's a connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          { 
            error: "Backend connection failed", 
            details: `Cannot connect to backend at ${BACKEND_URL}. Please ensure the backend server is running on port 3001.`,
            backendUrl: BACKEND_URL,
            suggestion: "Try starting the backend server with 'npm run dev' in the Backend directory"
          },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Proxy request failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        url: url,
        method: method,
        backendUrl: BACKEND_URL,
        timestamp: new Date().toISOString()
      },
      { status: 500 },
    )
  }
}
