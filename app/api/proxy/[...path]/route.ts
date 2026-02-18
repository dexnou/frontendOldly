import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }, method: string) {
  try {
    const { path } = await params;
    const pathString = path.join("/");

    // Construct target URL (ensure no double slashes if BACKEND_URL ends with /)
    const baseUrl = BACKEND_URL.replace(/\/$/, "");
    const targetUrl = new URL(`${baseUrl}/api/${pathString}`);

    // Copy search params
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    console.log(`[Proxy] ${method} ${targetUrl.toString()}`);

    // Prepare headers
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    // Important: Content-Length should be handled by fetch based on body
    headers.delete("content-length");

    // Forward ngrok warning skip
    headers.set("ngrok-skip-browser-warning", "true");

    // Read body
    let body: BodyInit | null = null;
    if (method !== "GET" && method !== "HEAD") {
      // arrayBuffer is safest for proxying
      const blob = await request.blob();
      if (blob.size > 0) {
        body = blob;
      }
    }

    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
    });

    console.log(`[Proxy] Response status: ${response.status}`);

    const responseBody = await response.arrayBuffer();

    // Prepare response headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      { error: "Proxy connection failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, ctx: any) { return proxy(req, ctx, "GET"); }
export async function POST(req: NextRequest, ctx: any) { return proxy(req, ctx, "POST"); }
export async function PUT(req: NextRequest, ctx: any) { return proxy(req, ctx, "PUT"); }
export async function DELETE(req: NextRequest, ctx: any) { return proxy(req, ctx, "DELETE"); }
export async function PATCH(req: NextRequest, ctx: any) { return proxy(req, ctx, "PATCH"); }

