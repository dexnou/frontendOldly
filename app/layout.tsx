import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"
import PWAInstallPrompt from "@/components/PWAInstallPrompt"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Oldy Funs Music Box",
  description: "Juego de música con cartas QR",
  manifest: "/manifest.json",
  icons: {
    icon: "/sourcingup-logo.jpg",
    apple: "/sourcingup-logo.jpg",
  },
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Music Box",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Oldy Fans Fun Music Box",
    title: "Oldy Fans Fun Music Box",
    description: "Juego de música con cartas QR",
  },
  twitter: {
    card: "summary",
    title: "Oldy Funs Music Box",
    description: "Juego de música con cartas QR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
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
