"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onScanSuccess: (decodedText: string) => void
}

export default function ScannerModal({ isOpen, onClose, onScanSuccess }: ScannerModalProps) {
    const [error, setError] = useState<string>("")
    const [permissionGranted, setPermissionGranted] = useState(false)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerRegionId = "html5qr-code-full-region"

    useEffect(() => {
        let scanner: Html5Qrcode | null = null

        const startScanner = async () => {
            if (!isOpen) return

            try {
                // Initialize scanner
                scanner = new Html5Qrcode(scannerRegionId)
                scannerRef.current = scanner

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: window.innerWidth / window.innerHeight
                }

                await scanner.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScanSuccess(decodedText)
                        // Don't close here immediately to avoid jarring transitions, or handle it in parent
                    },
                    (errorMessage) => {
                        // ignore parse errors
                    }
                )
                setPermissionGranted(true)
            } catch (err) {
                console.error("Error starting scanner:", err)
                setError("No se pudo acceder a la cámara. Por favor verifica los permisos.")
            }
        }

        if (isOpen) {
            // Small timeout to ensure DOM element exists
            setTimeout(startScanner, 100)
        }

        return () => {
            if (scanner) {
                scanner.stop().then(() => {
                    scanner?.clear()
                }).catch(err => {
                    console.error("Failed to stop scanner", err)
                })
            }
        }
    }, [isOpen, onScanSuccess])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black text-white">
            {/* Header / Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
                <h3 className="font-semibold text-lg tracking-wide">Escanear Carta</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Camera Area */}
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                <div id={scannerRegionId} className="w-full h-full object-cover"></div>

                {!permissionGranted && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20">
                        <div className="text-center p-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm text-zinc-400">Iniciando cámara...</p>
                        </div>
                    </div>
                )}

                {/* Visual Overlay (Guide) */}
                {permissionGranted && !error && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20">
                        <div className="relative w-64 h-64">
                            {/* Cornes */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-xl"></div>

                            {/* Scanning Animation Line */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse"></div>
                        </div>
                        <p className="mt-8 text-sm text-white/80 font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                            Apunta el código QR dentro del marco
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-40 p-6">
                        <div className="text-center max-w-xs">
                            <div className="bg-destructive/10 p-4 rounded-full inline-block mb-4">
                                <Camera className="w-8 h-8 text-destructive" />
                            </div>
                            <h4 className="text-lg font-bold mb-2">Acceso denegado</h4>
                            <p className="text-sm text-zinc-400 mb-6">{error}</p>
                            <Button variant="secondary" className="w-full" onClick={onClose}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
