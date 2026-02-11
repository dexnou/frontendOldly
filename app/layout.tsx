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

// URL base para metadatos (asegúrate de cambiar esto por tu dominio real en producción)
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://oldyfans.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Oldy Fans Music Box | Juego de Música Interactivo",
    template: "%s | Oldy Fans Music Box"
  },
  description: "Escanea, adivina y gana. El juego de cartas musicales con códigos QR que pone a prueba tu conocimiento musical. ¡Juega solo o con amigos!",
  applicationName: "Oldy Fans",
  authors: [{ name: "Oldy Fans Team", url: SITE_URL }],
  generator: "Next.js",
  keywords: [
    "juego de música",
    "trivia musical",
    "cartas QR",
    "music quiz",
    "adivina la canción",
    "fiesta",
    "amigos",
    "oldy fans",
    "juego de cartas musical",
    "cartas con QR",
    "adivinar canciones",
    "juego para fiestas",
    "juego para amigos"
  ],
  referrer: "origin-when-cross-origin",
  creator: "Oldy Fans",
  publisher: "Oldy Fans",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // --- OPEN GRAPH (Facebook, LinkedIn, Discord, WhatsApp) ---
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Oldy Fans Music Box",
    title: "Oldy Fans Music Box | El Juego de Música Definitivo",
    description: "¡Desafía a tus amigos! Escanea las cartas QR y adivina la canción antes que nadie. ¿Cuánto sabes de música?",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Oldy Fans Music Box Preview",
      },
    ],
  },
  // --- TWITTER ---
  twitter: {
    card: "summary_large_image",
    title: "Oldy Fans Music Box",
    description: "El juego de cartas con QR para los amantes de la música.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@oldyfans",
  },
  // --- GEO TAGS (Geolocalización para SEO local) ---
  other: {
    "geo.region": "AR-B",
    "geo.placename": "Buenos Aires",
    "geo.position": "-34.6037;-58.3816",
    "ICBM": "-34.6037, -58.3816",
  },
  // --- ICONS & MANIFEST ---
  manifest: "/manifest.json",
  icons: {
    icon: "/oldyfans.svg",
    shortcut: "/oldyfans.svg",
    apple: "/oldyfans.svg",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/oldyfans.svg",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oldy Fans Music Box",
  },
  alternates: {
    canonical: SITE_URL,
  },
}

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
  // Definición de datos estructurados (JSON-LD)
  // Define que esto es una "Aplicación de Software" tipo Juego y una "Organización"
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Oldy Fans Music Box",
        "url": SITE_URL
        // Si no tenés buscador real, NO pongas SearchAction
      },
      {
        "@type": "SoftwareApplication",
        "name": "Oldy Fans Music Box",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web",
        "description": "Escanea, adivina y gana. El juego de cartas musicales con códigos QR.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "ARS"
        },
        "image": `${SITE_URL}/og-image.png`,
        "url": SITE_URL,
        "author": {
          "@type": "Organization",
          "name": "Oldy Fans",
          "url": SITE_URL
        }
      },
      {
        "@type": "Organization",
        "name": "Oldy Fans",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/oldyfans.svg`
        },
        "sameAs": [
          "https://www.instagram.com/oldyfans/",
          "https://x.com/oldyfans"
        ]
      }
    ]
  }


  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        {/* Script JSON-LD inyectado para Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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