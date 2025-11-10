import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ellena-hyperaemic-numbers.ngrok-free.dev"

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

  try {
    const headers = new Headers()

    headers.set("ngrok-skip-browser-warning", "true")
    headers.set("User-Agent", "v0-proxy")

    const contentType = request.headers.get("content-type")
    if (contentType) {
      headers.set("Content-Type", contentType)
    }

    const authorization = request.headers.get("authorization")
    if (authorization) {
      headers.set("Authorization", authorization)
    }

    let body = undefined
    if (method === "POST" || method === "PUT") {
      body = await request.text()
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    const data = await response.text()

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response preview:", data.substring(0, 200))

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
