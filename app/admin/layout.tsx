"use client"

import type React from "react"

import { AdminAuthProvider } from "@/contexts/AdminAuthContext"
import "../globals.css"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  )
}
