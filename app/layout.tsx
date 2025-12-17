import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"
import PWAInstallPrompt from "@/components/PWAInstallPrompt"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Oldy Fans Music Box",
  description: "Juego de música con cartas QR",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  // Eliminamos themeColor y viewport de aquí
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Music Box",
  },
}

// Nueva exportación específica para viewport y tema
export const viewport: Viewport = {
  themeColor: "#212323",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ServiceWorkerRegistration />
        <AuthProvider>
          {children}
          <PWAInstallPrompt />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}