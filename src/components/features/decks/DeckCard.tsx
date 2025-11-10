"use client"

import { Card } from "@/components/ui/card"
import { Lock, Music } from "lucide-react"

interface DeckCardProps {
  deck: {
    id: string
    title: string
    description: string
    theme: string
    cardCount: number
    hasAccess: boolean
    coverImage?: string
  }
  onClick: () => void
}

export default function DeckCard({ deck, onClick }: DeckCardProps) {
  // Generate a gradient based on deck ID for placeholder
  const generateGradient = (id: string) => {
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue1 = hash % 360
    const hue2 = (hash * 137) % 360
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 40%))`
  }

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Cover Image or Gradient Placeholder */}
      <div
        className="h-48 w-full relative overflow-hidden"
        style={{
          background: deck.coverImage ? `url(${deck.coverImage})` : generateGradient(deck.id),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!deck.hasAccess && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <Lock className="w-6 h-6" />
              <span className="font-semibold">Bloqueado</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{deck.title}</h3>

        {deck.description && <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{deck.description}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Music className="w-4 h-4" />
            <span>{deck.cardCount} cartas</span>
          </div>

          {deck.theme && (
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">{deck.theme}</span>
          )}
        </div>

        {!deck.hasAccess && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <p className="text-xs text-red-400 font-medium">🔒 Compra requerida para acceder</p>
          </div>
        )}
      </div>
    </Card>
  )
}
