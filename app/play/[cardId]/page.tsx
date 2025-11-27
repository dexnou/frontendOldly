"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Share2, Copy, Twitter, Home } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ellena-hyperaemic-numbers.ngrok-free.dev" || "http://localhost:3001"

interface GameCard {
  id: string
  qrToken: string
  difficulty: string
  previewUrl: string | null
  spotifyUrl: string | null
  deck: {
    id: string
    title: string
    theme: string
    labelSong?: string
    labelArtist?: string
    labelAlbum?: string
  }
  hint: string
}

interface RevealedCard {
  id: string
  songName: string
  artist: {
    id: string
    name: string
    country: string | null
    genre: string | null
  }
  album: {
    id: string
    title: string
    releaseYear: number | null
    coverUrl: string | null
  } | null
  spotifyUrl: string | null
  previewUrl: string | null
}

export default function PlayPage() {
  const { cardId } = useParams()
  const router = useRouter()
  const { isLoggedIn, token, user, loading: authLoading } = useAuth()
  
  const [gameCard, setGameCard] = useState<GameCard | null>(null)
  const [revealedCard, setRevealedCard] = useState<RevealedCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState("")
  
  const [gameStarted, setGameStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false) // NUEVO: Estado de Fin de Juego
  const [answered, setAnswered] = useState(false)
  
  const [gameMode, setGameMode] = useState<'casual' | 'competitive' | 'competitive_turns' | null>(null)
  const [players, setPlayers] = useState<string[]>([''])
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameParticipants, setGameParticipants] = useState<any[]>([])
  const [currentTurnParticipantId, setCurrentTurnParticipantId] = useState<string | null>(null)
  const [isActiveCompetitiveSession, setIsActiveCompetitiveSession] = useState(false)
  const [isActiveCasualSession, setIsActiveCasualSession] = useState(false)  
  
  const [cardAlreadyPlayedByCurrent, setCardAlreadyPlayedByCurrent] = useState(false)

  const [showScoring, setShowScoring] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<any>(null)
  const [participantAnswers, setParticipantAnswers] = useState<{[key: string]: {songKnew: boolean, artistKnew: boolean, albumKnew: boolean}}>({})
  
  const [activeGameError, setActiveGameError] = useState<{gameId: string, message: string} | null>(null)
  const [formError, setFormError] = useState("")

  const [userKnew, setUserKnew] = useState({
    songKnew: false,
    artistKnew: false,
    albumKnew: false
  })

  useEffect(() => {
    if (authLoading) return
    
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    if (!cardId) {
      setError('ID de carta no encontrado en la URL')
      setLoading(false)
      return
    }

    const isNumericId = !isNaN(parseInt(cardId as string))
    const isQrToken = typeof cardId === 'string' && cardId.length === 16
    
    if (!isNumericId && !isQrToken) {
      setError('Formato de carta inválido. Debe ser un ID numérico o token QR válido.')
      setLoading(false)
      return
    }
    
    checkActiveCasualSession()
    fetchGameCard()
  }, [cardId, isLoggedIn, token, authLoading])

  useEffect(() => {
    if (gameCard && gameCard.deck?.id && token) {
      checkActiveCompetitiveGame(gameCard.deck.id)
    }
  }, [gameCard, token])

  useEffect(() => {
    if (gameMode === 'competitive_turns' && currentTurnParticipantId && gameParticipants.length > 0 && gameCard) {
      const currentParticipant = gameParticipants.find(p => p.id.toString() === currentTurnParticipantId.toString())
      if (currentParticipant && currentParticipant.playedCardIds) {
        const cardIdInt = parseInt(gameCard.id)
        const hasPlayed = currentParticipant.playedCardIds.includes(cardIdInt)
        setCardAlreadyPlayedByCurrent(hasPlayed)
      }
    } else {
      setCardAlreadyPlayedByCurrent(false)
    }
  }, [currentTurnParticipantId, gameParticipants, gameCard, gameMode])

  const safeJsonParse = async (res: Response, context: string) => {
    try {
      return await res.json()
    } catch (jsonError) {
      if (res.status === 429) {
        throw new Error('Demasiadas solicitudes. Por favor espera un momento antes de intentar nuevamente.')
      }
      throw new Error(`Error de servidor (${res.status}): Respuesta inválida del servidor`)
    }
  }

  const startCasualSession = () => {
    localStorage.setItem('activeCasualSession', 'true')
    localStorage.setItem('casualSessionStartTime', new Date().toISOString())
    setGameMode('casual')
    setIsActiveCasualSession(true)
    setGameStarted(true)
  }

  const endCasualSession = () => {
    localStorage.removeItem('activeCasualSession')
    localStorage.removeItem('casualSessionStartTime')
    setIsActiveCasualSession(false)
    setGameMode(null)
    setGameStarted(false)
    setAnswered(false)
    setRevealedCard(null)
  }

  const checkActiveCasualSession = () => {
    const isActive = localStorage.getItem('activeCasualSession') === 'true'
    const startTime = localStorage.getItem('casualSessionStartTime')
    
    if (isActive && startTime) {
      const sessionStart = new Date(startTime)
      const now = new Date()
      const hoursElapsed = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60)
      
      if (hoursElapsed < 2) {
        setGameMode('casual')
        setIsActiveCasualSession(true)
        setGameStarted(true)
        return true
      } else {
        endCasualSession()
        return false
      }
    }
    return false
  }

  const fetchGameCard = async () => {
    setLoading(true)
    try {
      const url = `/api/proxy/cards/${cardId}/play`
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await safeJsonParse(res, 'fetchGameCard')

      if (!res.ok) {
        if (res.status === 429) {
          setError("Demasiadas solicitudes. Por favor espera un momento antes de intentar nuevamente.")
          return
        }
        if (res.status === 403 && data.needsAccess) {
          setError(`No tienes acceso al mazo "${data.deck?.title}". ¡Actívalo primero!`)
          return
        }
        throw new Error(data.message || "Error cargando carta para jugar")
      }

      setGameCard(data.data.card)
    } catch (err: any) {
      console.error('❌ Error in fetchGameCard:', err)
      setError(err.message || "Error cargando juego")
    } finally {
      setLoading(false)
    }
  }

  const checkActiveCompetitiveGame = async (deckId: string) => {
    try {
      if (!token) return null
      
      const res = await fetch(`/api/proxy/game/active-competitive/${deckId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await safeJsonParse(res, 'checkActiveCompetitiveGame')
        if (data.data?.game) {
          setGameMode(data.data.game.mode)
          setGameId(data.data.game.id)
          setGameParticipants(data.data.game.participants)
          setCurrentTurnParticipantId(data.data.game.currentTurnParticipantId)
          setGameStarted(true)
          setIsActiveCompetitiveSession(true)
          
          const initialAnswers: {[key: string]: {songKnew: boolean, artistKnew: boolean, albumKnew: boolean}} = {}
          data.data.game.participants.forEach((participant: any) => {
            initialAnswers[participant.id] = {
              songKnew: false,
              artistKnew: false,
              albumKnew: false
            }
          })
          setParticipantAnswers(initialAnswers)
        }
      }
    } catch (err: any) {
      console.log('⚠️ Error checking for active games:', err.message)
    }
  }

  const handleStartGame = () => {
    if (gameMode === 'casual') {
      setGameStarted(true)
    } else if (gameMode === 'competitive' || gameMode === 'competitive_turns') {
      startCompetitiveGame()
    }
  }

  const handleModeSelection = (mode: 'casual' | 'competitive' | 'competitive_turns') => {
    setGameMode(mode)
    setFormError("")
    if (mode === 'casual') {
      startCasualSession()
    }
  }

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, ''])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
      setFormError("")
    }
  }

  const updatePlayer = (index: number, name: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = name
    setPlayers(updatedPlayers)
    setFormError("")
  }

  const startCompetitiveGame = async () => {
    setFormError("")
    const validPlayers = players.filter(p => p.trim().length > 0)
    
    if (validPlayers.length === 0) {
      setFormError("Debes agregar al menos un jugador")
      return
    }

    const names = validPlayers.map(p => p.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      setFormError("No puede haber dos participantes con el mismo nombre.");
      return;
    }

    if (!token) {
      setError("Error de autenticación. Por favor, recarga la página.")
      return
    }

    try {
      const res = await fetch(`/api/proxy/game/start-competitive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deckId: gameCard?.deck.id,
          participants: validPlayers.map(name => ({ name: name.trim() })),
          mode: gameMode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errorCode === 'ACTIVE_GAME_EXISTS') {
          setActiveGameError({
            gameId: data.data?.activeGameId,
            message: data.message
          })
          return
        }
        if (data.errorCode === 'DUPLICATE_PARTICIPANT_NAMES' || data.errorCode === 'INVALID_PARTICIPANT_NAME') {
             setFormError(data.message || "Error con los nombres de los participantes");
             return;
        }

        throw new Error(data.message || "Error iniciando juego competitivo")
      }

      setGameId(data.data.game.id)
      setGameParticipants(data.data.game.participants)
      setCurrentTurnParticipantId(data.data.game.currentTurnParticipantId)
      setIsActiveCompetitiveSession(true)
      
      const initialAnswers: {[key: string]: {songKnew: boolean, artistKnew: boolean, albumKnew: boolean}} = {}
      data.data.game.participants.forEach((participant: any) => {
        initialAnswers[participant.id] = {
          songKnew: false,
          artistKnew: false,
          albumKnew: false
        }
      })
      setParticipantAnswers(initialAnswers)
      
      setGameStarted(true)
    } catch (err: any) {
      console.error('Error starting competitive game:', err)
      setError(err.message || "Error iniciando juego competitivo")
    }
  }

  const handleRevealAnswer = async () => {
    if (!gameCard || revealing) return

    setRevealing(true)
    try {
      let res;
      
      if (gameMode === 'casual') {
        res = await fetch(`/api/proxy/cards/${cardId}/casual-play`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        })
      } else {
        res = await fetch(`/api/proxy/cards/${cardId}/reveal`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        })
      }

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error revelando respuesta")

      setRevealedCard(data.data.card)
      setAnswered(true)
      
      if (gameMode === 'competitive' || gameMode === 'competitive_turns') {
        setShowScoring(true)
      }
    } catch (err: any) {
      setError(err.message || "Error revelando respuesta")
    } finally {
      setRevealing(false)
    }
  }

  const handleSubmitScore = async () => {
    if (!gameCard || scoring) return

    const numericCardId = parseInt(gameCard.id)
    if (isNaN(numericCardId)) {
      setError('ID numérico de carta no disponible')
      return
    }

    setScoring(true)
    try {
      let res;
      
      if (gameMode === 'competitive_turns' && gameId) {
        if (!currentTurnParticipantId) throw new Error('Error de turno: No hay jugador activo')

        res = await fetch(`/api/proxy/game/${gameId}/submit-turn-round`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cardId: numericCardId,
            participantId: currentTurnParticipantId,
            userKnew: participantAnswers[currentTurnParticipantId]
          })
        })

      } else if (gameMode === 'competitive' && gameId) {
        const participantAnswersArray = Object.entries(participantAnswers).map(([participantId, answers]) => ({
          participantId: parseInt(participantId),
          userKnew: {
            songKnew: Boolean(answers?.songKnew),
            artistKnew: Boolean(answers?.artistKnew),
            albumKnew: Boolean(answers?.albumKnew)
          }
        }))

        res = await fetch(`/api/proxy/game/${gameId}/submit-competitive-round`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cardId: numericCardId,
            participantAnswers: participantAnswersArray
          })
        })
      } else {
        res = await fetch(`/api/proxy/game/score-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cardId: numericCardId, userKnew })
        })
      }

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error calculando puntuación")

      setScoreResult(data.data)
      setShowScoring(false)
      
      if (data.data.game?.participants) {
        setGameParticipants(data.data.game.participants)
      }
      if (data.data.game?.nextTurn?.participantId) {
        setCurrentTurnParticipantId(data.data.game.nextTurn.participantId)
      } else if (data.data.game?.currentTurnParticipantId) {
        setCurrentTurnParticipantId(data.data.game.currentTurnParticipantId)
      }

    } catch (err: any) {
      setError(err.message || "Error calculando puntuación")
    } finally {
      setScoring(false)
    }
  }

  const handleParticipantCheckboxChange = (participantId: string, type: 'songKnew' | 'artistKnew' | 'albumKnew') => {
    setParticipantAnswers(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [type]: !prev[participantId][type]
      }
    }))
  }

  const getSpotifyEmbedUrl = (spotifyUrl: string | null, previewUrl: string | null) => {
    if (spotifyUrl) {
      const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)
      if (match) {
        return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`
      }
    }
    return null
  }

  const handlePlayAgain = () => {
    // Si el juego ya terminó, vamos al inicio
    if (isGameOver) {
      resetGame()
    } else {
      router.push("/")
    }
  }

  const finishActiveGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/proxy/game/${gameId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error finalizando juego")
      
      setActiveGameError(null)
      if (gameMode === 'competitive' || gameMode === 'competitive_turns') {
        startCompetitiveGame()
      }
    } catch (err: any) {
      setError(err.message || "Error finalizando juego activo")
    }
  }

  const endCompetitiveSession = async () => {
    if (!gameId) return
    try {
      const res = await fetch(`/api/proxy/game/${gameId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error finalizando partida")

      // NO reseteamos todo, activamos la pantalla de Game Over
      setIsGameOver(true)
      
    } catch (err: any) {
      setError(err.message || "Error finalizando partida")
    }
  }

  // Función para resetear completamente y salir
  const resetGame = () => {
    setGameMode(null)
    setGameId(null)
    setGameParticipants([])
    setCurrentTurnParticipantId(null)
    setGameStarted(false)
    setIsActiveCompetitiveSession(false)
    setParticipantAnswers({})
    setScoreResult(null)
    setShowScoring(false)
    setAnswered(false)
    setIsGameOver(false)
    router.push("/")
  }

  // Función para compartir resultados
  const handleShare = (platform: 'whatsapp' | 'twitter' | 'copy') => {
    const sorted = [...gameParticipants].sort((a, b) => b.totalPoints - a.totalPoints);
    
    let text = `🎵 *Oldly Fun Music Box* - Resultados 🏆\n\n`;
    text += `Mazo: ${gameCard?.deck?.title || 'Desconocido'}\n`;
    
    sorted.forEach((p, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      text += `${medal} ${p.name}: ${p.totalPoints} pts\n`;
    });
    
    text += `\n¡Juega ahora en Oldly Fun! 🚀`;

    const encodedText = encodeURIComponent(text);

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(text).then(() => {
        alert("¡Resultados copiados! Puedes pegarlos en Instagram.");
      });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{authLoading ? 'Verificando autenticación...' : 'Cargando juego...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={() => router.push("/")} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">Volver al inicio</button>
        </div>
      </div>
    )
  }

  if (!gameCard) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-600">Carta no encontrada</p></div>

  const embedUrl = getSpotifyEmbedUrl(gameCard.spotifyUrl, gameCard.previewUrl)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto flex gap-6">
        
        {/* Main Content */}
        <div className={`${(gameMode === 'competitive' || gameMode === 'competitive_turns') && gameStarted ? 'flex-1' : 'max-w-2xl mx-auto w-full'}`}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🎵 Oldly Fun Music Box</h1>
            <p className="text-blue-200">¡Adivina la canción!</p>
            {user && <p className="text-green-300 text-sm mt-2">Jugando como: {user.firstname}</p>}
          </div>

        {/* Game Card */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          
          {/* Deck Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{gameCard.deck.title}</h2>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
              <span className="bg-blue-100 px-3 py-1 rounded-full">Tema: {gameCard.deck.theme}</span>
              <span className="bg-yellow-100 px-3 py-1 rounded-full">Dificultad: {gameCard.difficulty}</span>
            </div>
          </div>

          {/* --- PANTALLA DE GAME OVER --- */}
          {isGameOver ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
               <div className="text-6xl mb-4">🏆</div>
               <h3 className="text-3xl font-bold text-gray-800 mb-2">¡Partida Finalizada!</h3>
               <p className="text-gray-600 mb-6">Aquí están los resultados finales</p>

               <div className="space-y-3 mb-8">
                 {gameParticipants
                   .sort((a, b) => b.totalPoints - a.totalPoints)
                   .map((participant, index) => (
                     <div key={participant.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border-2 
                          ${index === 0 ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'}`}>
                       <div className="flex items-center gap-3">
                         <span className="text-2xl">
                           {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                         </span>
                         <span className="font-bold text-lg text-gray-800">{participant.name}</span>
                       </div>
                       <span className="font-bold text-xl text-gray-700">{participant.totalPoints} pts</span>
                     </div>
                 ))}
               </div>

               <div className="mb-8">
                 <p className="text-sm text-gray-500 mb-3 uppercase font-bold tracking-wide">Compartir Resultados</p>
                 <div className="flex justify-center gap-3">
                    <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                      <Share2 className="w-4 h-4" /> WhatsApp
                    </button>
                    <button onClick={() => handleShare('twitter')} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition-opacity">
                      <Twitter className="w-4 h-4" /> X / Twitter
                    </button>
                    <button onClick={() => handleShare('copy')} className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition-opacity">
                      <Copy className="w-4 h-4" /> Copiar (Instagram)
                    </button>
                 </div>
               </div>

               <button onClick={resetGame} className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" /> Volver al Inicio
               </button>
            </div>
          ) : (
            /* --- RESTO DE LA LÓGICA DEL JUEGO (Mismo código de antes) --- */
            <>
            {/* PANTALLA DE SESIÓN ACTIVA */}
            {isActiveCompetitiveSession && !gameStarted ? (
                /* ... (mismo código sesión activa) ... */
                <div className="text-center mb-6">
                    {/* ... */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-xl font-semibold mb-3 text-green-800">
                        Sesión {gameMode === 'competitive_turns' ? 'Por Turnos' : 'Competitiva'} Activa
                        </h3>
                        <p className="text-green-700 mb-2 text-sm"><strong>Deck:</strong> {gameCard?.deck?.title}</p>
                        <p className="text-green-700 mb-4 text-sm">Partida en curso con {gameParticipants.length} jugadores</p>
                        
                        {gameMode === 'competitive_turns' && currentTurnParticipantId && (
                        <div className="bg-yellow-100 p-2 rounded mb-3 border border-yellow-200">
                            <p className="text-yellow-800 font-bold text-sm">
                            Turno actual: {gameParticipants.find(p => p.id == currentTurnParticipantId)?.name}
                            </p>
                        </div>
                        )}

                        <div className="grid gap-3">
                        <button onClick={() => setGameStarted(true)} className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">▶️ Continuar jugando</button>
                        <button onClick={endCompetitiveSession} className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors">🏁 Finalizar partida completa</button>
                        </div>
                    </div>
                </div>
            ) : isActiveCasualSession && !gameStarted ? (
                /* ... (mismo código casual activa) ... */
                <div className="text-center mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                        <div className="text-4xl mb-4">🎧</div>
                        <h3 className="text-xl font-semibold mb-3 text-blue-800">Sesión Casual Activa</h3>
                        <p className="text-blue-700 mb-4 text-sm">Explorando música sin competir por puntos</p>
                        <div className="grid gap-3">
                        <button onClick={() => setGameStarted(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">▶️ Continuar en modo casual</button>
                        <button onClick={endCasualSession} className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">🏁 Terminar sesión casual</button>
                        </div>
                    </div>
                </div>
            ) : !gameMode ? (
                /* ... (mismo código selección modo) ... */
                <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-semibold mb-6">¿Cómo quieres jugar?</h3>
                
                <div className="grid gap-4 max-w-md mx-auto">
                    <button onClick={() => handleModeSelection('casual')} className="bg-blue-500 text-white p-6 rounded-xl text-left hover:bg-blue-600 transition-colors shadow-lg">
                    <div className="flex items-center mb-2"><span className="text-3xl mr-3">🎧</span><h4 className="text-xl font-bold">Modo Casual</h4></div>
                    <p className="text-blue-100 text-sm">Solo escucha y ve las respuestas. Sin puntaje.</p>
                    </button>
                    
                    <button onClick={() => handleModeSelection('competitive')} className="bg-green-600 text-white p-6 rounded-xl text-left hover:bg-green-700 transition-colors shadow-lg">
                    <div className="flex items-center mb-2"><span className="text-3xl mr-3">🏆</span><h4 className="text-xl font-bold">Todos vs Todos</h4></div>
                    <p className="text-green-100 text-sm">Todos adivinan la misma canción y suman puntos.</p>
                    </button>

                    <button onClick={() => handleModeSelection('competitive_turns')} className="bg-purple-600 text-white p-6 rounded-xl text-left hover:bg-purple-700 transition-colors shadow-lg">
                    <div className="flex items-center mb-2"><span className="text-3xl mr-3">📱</span><h4 className="text-xl font-bold">Pasar el Celular</h4></div>
                    <p className="text-purple-100 text-sm">Juegan uno por uno. Ideal para un solo dispositivo.</p>
                    </button>
                </div>
                </div>
            ) : (gameMode === 'competitive' || gameMode === 'competitive_turns') && !gameStarted ? (
                /* ... (mismo código form jugadores) ... */
                <div className="text-center">
                {activeGameError ? (
                    <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-2xl font-semibold mb-4 text-red-600">Juego Activo Detectado</h3>
                    <p className="text-red-800 mb-4">{activeGameError.message}</p>
                    <div className="grid gap-3 mb-4">
                        <button onClick={() => finishActiveGame(activeGameError.gameId)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">🏁 Finalizar juego actual y empezar nuevo</button>
                        <button onClick={() => { setActiveGameError(null); setGameMode(null) }} className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">⬅️ Cancelar y volver</button>
                    </div>
                    </div>
                ) : (
                    <>
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-2xl font-semibold mb-6">
                        {gameMode === 'competitive_turns' ? 'Jugadores (en orden de turno)' : 'Agregar Jugadores'}
                    </h3>
                
                    <div className="max-w-md mx-auto space-y-3 mb-6">
                        {players.map((player, index) => (
                        <div key={index} className="flex gap-2">
                            <input type="text" value={player} onChange={(e) => updatePlayer(index, e.target.value)} placeholder={`Jugador ${index + 1}`} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" maxLength={80} />
                            {players.length > 1 && (
                            <button onClick={() => removePlayer(index)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">❌</button>
                            )}
                        </div>
                        ))}
                    </div>
                    
                    {formError && (
                        <div className="max-w-md mx-auto mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg animate-in slide-in-from-top-2">
                        {formError}
                        </div>
                    )}

                    <div className="flex gap-2 justify-center mb-6">
                        {players.length < 8 && (
                        <button onClick={addPlayer} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">➕ Agregar Jugador</button>
                        )}
                        <button onClick={() => setGameMode(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">⬅️ Volver</button>
                    </div>
                    
                    <button onClick={handleStartGame} disabled={players.filter(p => p.trim().length > 0).length === 0} className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">🚀 Empezar Juego</button>
                    </>
                )}
                </div>
            ) : !gameStarted ? (
                /* ... (mismo código pre-game casual) ... */
                <div className="text-center">
                <div className="text-6xl mb-4">🎧</div>
                <h3 className="text-xl font-semibold mb-4">¿Listo para el desafío?</h3>
                <p className="text-gray-600 mb-6">{gameCard.hint}</p>
                <button onClick={handleStartGame} className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors">▶️ Empezar Juego</button>
                </div>
            ) : !answered ? (
                /* ... (mismo código playing) ... */
                <div className="text-center">
                {cardAlreadyPlayedByCurrent ? (
                    <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-8 shadow-lg animate-in fade-in zoom-in duration-300">
                    <div className="text-5xl mb-4">🚫</div>
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">¡Ya jugaste esta carta!</h3>
                    <p className="text-yellow-700 mb-6">
                        <strong>{gameParticipants.find(p => p.id == currentTurnParticipantId)?.name}</strong>, ya adivinaste esta canción anteriormente.
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        Escanea una carta nueva o pásale el turno al siguiente jugador.
                    </p>
                    </div>
                ) : (
                    <>
                    {gameMode === 'competitive_turns' && currentTurnParticipantId && (
                        <div className="mb-6 bg-purple-100 border-2 border-purple-300 rounded-xl p-4 animate-pulse">
                        <p className="text-sm text-purple-800 font-bold uppercase tracking-wider mb-1">Turno de</p>
                        <h3 className="text-3xl font-extrabold text-purple-900">
                            {gameParticipants.find(p => p.id == currentTurnParticipantId)?.name}
                        </h3>
                        </div>
                    )}

                    <h3 className="text-xl font-semibold mb-6">🎵 ¡Escucha y adivina!</h3>

                    <div className="relative w-full max-w-md mx-auto mb-4">
                        {embedUrl ? (
                        <div className="relative w-full">
                            <iframe src={embedUrl} width="100%" height="152" style={{ borderRadius: "12px" }} frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-lg shadow-md"></iframe>
                            <button onClick={handleRevealAnswer} disabled={revealing} className="absolute top-0 left-0 w-full h-full bg-teal-600 text-white rounded-lg text-lg font-bold hover:bg-teal-700 transition-colors shadow-xl flex items-center justify-center" style={{ zIndex: 10, clipPath: "polygon(0 0, 85% 0, 85% 30%, 100% 30%, 100% 70%, 85% 70%, 85% 100%, 0 100%)" }}>
                            {revealing ? "Revelando..." : "🔍 Revelar Respuesta"}
                            </button>
                        </div>
                        ) : gameCard.previewUrl ? (
                        <div className="w-full flex justify-center">
                            <audio controls className="w-full"><source src={gameCard.previewUrl} type="audio/mpeg" />Tu navegador no soporta el elemento de audio.</audio>
                        </div>
                        ) : (
                        <div className="w-full p-4 bg-yellow-100 rounded-lg"><p className="text-yellow-800">⚠️ Audio no disponible para esta carta</p></div>
                        )}
                    </div>
                    </>
                )}
                </div>
            ) : (
                /* ... (mismo código revealed & scoring) ... */
                <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600 mb-6">¡Respuesta revelada!</h3>

                {revealedCard && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {revealedCard.album?.coverUrl && (
                        <div className="flex justify-center"><img src={revealedCard.album.coverUrl || "/placeholder.svg"} alt={revealedCard.album.title} className="w-48 h-48 object-cover rounded-lg shadow-lg" /></div>
                        )}
                        <div className="text-left space-y-3">
                        <div><h4 className="font-semibold text-gray-700">Canción:</h4><p className="text-xl font-bold text-gray-900">{revealedCard.songName}</p></div>
                        <div><h4 className="font-semibold text-gray-700">Artista:</h4><p className="text-lg text-gray-900">{revealedCard.artist.name}</p></div>
                        
                        {revealedCard.spotifyUrl && (
                            <div className="mt-4">
                            <a href={revealedCard.spotifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#1DB954] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#1ed760] transition-transform hover:scale-105 shadow-md text-sm">
                                <span className="text-lg">🎵</span> Escuchar completa en Spotify
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            </div>
                        )}

                        </div>
                    </div>
                    </div>
                )}

                {/* SCORING UI */}
                {(gameMode === 'competitive' || gameMode === 'competitive_turns') && showScoring && (
                    <div className="mt-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center justify-center">
                        <span className="mr-2">🎯</span>
                        {gameMode === 'competitive_turns' 
                        ? `¿Qué adivinó ${gameParticipants.find(p => p.id == currentTurnParticipantId)?.name}?`
                        : '¿Qué adivinó cada jugador?'}
                    </h4>
                    
                    <div className="space-y-6 text-left">
                        {gameParticipants
                        .filter(p => gameMode !== 'competitive_turns' || p.id == currentTurnParticipantId)
                        .map((participant) => (
                        <div key={participant.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                            <h5 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <span className="mr-2">👤</span>
                            {participant.name}
                            </h5>
                            
                            <div className="space-y-3">
                            <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <input type="checkbox" className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500" checked={participantAnswers[participant.id]?.songKnew || false} onChange={() => handleParticipantCheckboxChange(participant.id, 'songKnew')} />
                                <div className="flex items-center"><span className="text-2xl mr-2">🎵</span><div><div className="font-semibold text-gray-800">{gameCard?.deck?.labelSong || "Canción"}</div><div className="text-sm text-gray-600">"{revealedCard?.songName}"</div></div></div>
                            </label>
                            <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <input type="checkbox" className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500" checked={participantAnswers[participant.id]?.artistKnew || false} onChange={() => handleParticipantCheckboxChange(participant.id, 'artistKnew')} />
                                <div className="flex items-center"><span className="text-2xl mr-2">🎤</span><div><div className="font-semibold text-gray-800">{gameCard?.deck?.labelArtist || "Artista"}</div><div className="text-sm text-gray-600">"{revealedCard?.artist.name}"</div></div></div>
                            </label>
                            {revealedCard?.album && (
                                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <input type="checkbox" className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500" checked={participantAnswers[participant.id]?.albumKnew || false} onChange={() => handleParticipantCheckboxChange(participant.id, 'albumKnew')} />
                                <div className="flex items-center"><span className="text-2xl mr-2">💿</span><div><div className="font-semibold text-gray-800">{gameCard?.deck?.labelAlbum || "Álbum"}</div><div className="text-sm text-gray-600">"{revealedCard?.album.title}"</div></div></div>
                                </label>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                    
                    <button onClick={handleSubmitScore} disabled={scoring} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                        {scoring ? "Calculando..." : "✅ Confirmar Puntos"}
                    </button>
                    </div>
                )}

                {/* RESULTADO DE PUNTUACIÓN */}
                {(gameMode === 'competitive' || gameMode === 'competitive_turns') && scoreResult && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                    {gameMode === 'competitive_turns' && scoreResult.game?.nextTurn && (
                        <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 text-left">
                        <p className="text-sm font-bold text-yellow-700 uppercase">Siguiente jugador</p>
                        <p className="text-2xl font-extrabold text-yellow-900">👉 {scoreResult.game.nextTurn.participantName}</p>
                        </div>
                    )}
                    <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center"><span className="mr-2">🏆</span>Resultados</h4>
                    {(scoreResult.round?.participantResults || [scoreResult.round]).map((result: any) => {
                        const pName = result.participantName || gameParticipants.find(p => p.id == result.participantId)?.name;
                        return (
                        <div key={result.participantId} className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                            <h5 className="text-lg font-bold text-gray-800 mb-2 flex justify-between">
                            <span>👤 {pName}</span>
                            <span className="text-green-600">+{result.pointsEarned ?? result.points ?? 0} pts</span>
                            </h5>
                            <div className="text-sm text-gray-600 flex justify-between px-4">
                            <span>🎵 {result.answers?.songKnew || result.userKnew?.songKnew ? '✅' : '❌'}</span>
                            <span>🎤 {result.answers?.artistKnew || result.userKnew?.artistKnew ? '✅' : '❌'}</span>
                            <span>💿 {result.answers?.albumKnew || result.userKnew?.albumKnew ? '✅' : '❌'}</span>
                            </div>
                        </div>
                        )
                    })}
                    </div>
                )}

                {/* MENSAJE MODO CASUAL */}
                {gameMode === 'casual' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 text-center">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">🎧 Modo Casual</h4>
                    <p className="text-blue-700 mb-4">¡Solo disfruta la música! No se calculan puntos en este modo.</p>
                    <button onClick={endCasualSession} className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors w-full">🏁 Terminar sesión casual</button>
                    </div>
                )}

                <button onClick={handlePlayAgain} className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors mt-6">🏠 Volver al inicio</button>
                </div>
            )
            }
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-blue-200 text-sm">
          {isActiveCompetitiveSession && gameStarted && (
            <div className="mt-4">
              <button onClick={endCompetitiveSession} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">🏁 Finalizar partida competitiva</button>
            </div>
          )}
          {isActiveCasualSession && gameStarted && gameMode === 'casual' && (
            <div className="mt-4 md:hidden">
               <button onClick={endCasualSession} className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors">🏁 Terminar sesión casual</button>
            </div>
          )}
        </div>
        </div>

        {/* SIDEBAR COMPETITIVO ANIMADO */}
        {(gameMode === 'competitive' || gameMode === 'competitive_turns') && gameStarted && gameParticipants.length > 0 && (
          <div className="w-80 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 h-fit sticky top-4 hidden lg:block">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">🏆 Marcador</h3>
              <p className="text-blue-200 text-sm">{gameCard?.deck?.title}</p>
            </div>
            <div className="space-y-3 relative">
              <AnimatePresence mode="popLayout">
                {gameParticipants
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .map((participant, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: gameMode === 'competitive_turns' && participant.id == currentTurnParticipantId ? 1.03 : 1,
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      key={participant.id} 
                      className={`
                        rounded-lg p-4 border
                        ${gameMode === 'competitive_turns' && participant.id == currentTurnParticipantId 
                          ? 'bg-white/30 border-yellow-400 ring-2 ring-yellow-400 z-10' 
                          : 'bg-white/20 border-white/30'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {gameMode === 'competitive_turns' && participant.id == currentTurnParticipantId 
                              ? '👉' 
                              : (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅')}
                          </span>
                          <div>
                            <p className={`font-semibold ${participant.id == currentTurnParticipantId ? 'text-yellow-300' : 'text-white'}`}>
                              {participant.name}
                            </p>
                            <p className="text-xs text-blue-200">{participant.totalRounds} rondas</p>
                          </div>
                        </div>
                        <div className="text-right"><p className="text-2xl font-bold text-white">{participant.totalPoints}</p></div>
                      </div>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* SIDEBAR CASUAL */}
        {gameMode === 'casual' && gameStarted && isActiveCasualSession && (
          <div className="w-80 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 h-fit sticky top-4 hidden lg:block">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">🎧 Modo Casual</h3>
              <p className="text-blue-200 text-sm">{gameCard?.deck?.title}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 border border-white/30 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎵</div>
                <h4 className="font-semibold text-white mb-2">Sesión Activa</h4>
                <p className="text-blue-200 text-sm">Explorando música sin competir por puntos</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
               <button onClick={endCasualSession} className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors">🏁 Terminar sesión casual</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}