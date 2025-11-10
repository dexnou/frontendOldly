// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

// User types
export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  whatsapp?: string
  avatarUrl?: string
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
}

// Admin types
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super' | 'editor'
  createdAt: string
}

// Deck types
export interface Deck {
  id: string
  title: string
  description?: string
  theme: string
  buyLink?: string
  coverImage?: string
  cardCount: number
  hasAccess: boolean
  active: boolean
  createdAt: string
}

// Card types
export interface Card {
  id: string
  songName: string
  qrToken: string
  qrUrl: string
  difficulty: 'easy' | 'medium' | 'hard'
  previewUrl?: string
  spotifyUrl?: string
  artist: Artist
  album?: Album
  deck: Deck
  hasAccess: boolean
  createdAt: string
}

// Artist types
export interface Artist {
  id: string
  name: string
  country?: string
  genre?: string
}

// Album types
export interface Album {
  id: string
  title: string
  releaseYear?: number
  coverUrl?: string
}

// Game types
export interface Game {
  id: string
  mode: 'simple' | 'score'
  status: 'started' | 'finished'
  totalPoints: number
  totalRounds: number
  startedAt: string
  endedAt?: string
  deck: Deck
  participants?: GameParticipant[]
}

export interface GameParticipant {
  id: string
  name: string
  totalPoints: number
  totalRounds: number
}

// Auth context types
export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

export interface AdminAuthContextType {
  admin: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}