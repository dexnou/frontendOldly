"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

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
  const { isLoggedIn, token, user } = useAuth()
  
  console.log('🔍 DEBUG - cardId from URL params:', cardId, 'type:', typeof cardId)
  
  const [gameCard, setGameCard] = useState<GameCard | null>(null)
  const [revealedCard, setRevealedCard] = useState<RevealedCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [answered, setAnswered] = useState(false)
  
  // Estados para selección de modo
  const [gameMode, setGameMode] = useState<'casual' | 'competitive' | null>(null)
  const [players, setPlayers] = useState<string[]>([''])
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameParticipants, setGameParticipants] = useState<any[]>([])
  const [isActiveCompetitiveSession, setIsActiveCompetitiveSession] = useState(false)  
  // Nuevos estados para el sistema de puntuación
  const [showScoring, setShowScoring] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<any>(null)
  const [participantAnswers, setParticipantAnswers] = useState<{[key: string]: {songKnew: boolean, artistKnew: boolean, albumKnew: boolean}}>({})
  
  // Estado para manejar juegos activos
  const [activeGameError, setActiveGameError] = useState<{gameId: string, message: string} | null>(null)
  
  // Estados anteriores (mantener para compatibilidad con modo individual)
  const [userKnew, setUserKnew] = useState({
    songKnew: false,
    artistKnew: false,
    albumKnew: false
  })

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { cardId, isLoggedIn, token: !!token })
    
    if (!isLoggedIn) {
      console.log('🚪 Not logged in, redirecting...')
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    if (!cardId) {
      console.log('❌ No cardId found in URL params')
      setError('ID de carta no encontrado en la URL')
      setLoading(false)
      return
    }

    // Validate cardId: should be either a number or a 16-character QR token
    const isNumericId = !isNaN(parseInt(cardId as string))
    const isQrToken = typeof cardId === 'string' && cardId.length === 16
    
    if (!isNumericId && !isQrToken) {
      console.log('❌ Invalid cardId format:', cardId, 'length:', cardId.length)
      setError('Formato de carta inválido. Debe ser un ID numérico o token QR válido.')
      setLoading(false)
      return
    }

    console.log('✅ Valid cardId, loading game and checking for active competitive game')
    
    // First load the card data, then check for active competitive games
    fetchGameCard()
  }, [cardId, isLoggedIn, token])

  // Separate useEffect to check for active games after gameCard is loaded
  useEffect(() => {
    if (gameCard && gameCard.deck?.id) {
      console.log('🔍 Card loaded, checking for active competitive game in deck:', gameCard.deck.id)
      checkActiveCompetitiveGame(gameCard.deck.id)
    }
  }, [gameCard])

  const fetchGameCard = async () => {
    console.log('🎮 fetchGameCard called for cardId:', cardId)
    setLoading(true)
    try {
      const url = `${BACKEND_URL}/api/cards/${cardId}/play`
      console.log('🌐 Fetching from URL:', url)
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      console.log('📡 Response status:', res.status, res.statusText)
      const data = await res.json()
      console.log('📊 Response data:', data)

      if (!res.ok) {
        if (res.status === 403 && data.needsAccess) {
          setError(`No tienes acceso al mazo "${data.deck?.title}". ¡Actívalo primero!`)
          return
        }
        throw new Error(data.message || "Error cargando carta para jugar")
      }

      console.log('✅ Game card loaded successfully:', data.data.card.songName)
      setGameCard(data.data.card)
    } catch (err: any) {
      console.error('❌ Error in fetchGameCard:', err)
      setError(err.message || "Error cargando juego")
    } finally {
      console.log('🔄 Setting loading to false')
      setLoading(false)
    }
  }

  const checkActiveCompetitiveGame = async (deckId: string) => {
    try {
      console.log('🔍 Checking for active competitive games in deck:', deckId)
      
      // Check for active competitive games in this specific deck
      const res = await fetch(`${BACKEND_URL}/api/game/active-competitive/${deckId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data?.game) {
          console.log('🎯 Found active competitive game in this deck:', data.data.game.id)
          
          // Set the competitive mode and load the participants
          setGameMode('competitive')
          setGameId(data.data.game.id)
          setGameParticipants(data.data.game.participants)
          setGameStarted(true)
          setIsActiveCompetitiveSession(true)
          
          // Initialize answers for participants
          const initialAnswers: {[key: string]: {songKnew: boolean, artistKnew: boolean, albumKnew: boolean}} = {}
          data.data.game.participants.forEach((participant: any) => {
            initialAnswers[participant.id] = {
              songKnew: false,
              artistKnew: false,
              albumKnew: false
            }
          })
          setParticipantAnswers(initialAnswers)
          
          console.log('✅ Competitive game state restored for deck', data.data.game.deck.title, 'with', data.data.game.participants.length, 'participants')
        }
      } else {
        console.log('ℹ️ No active competitive game found in this deck, user can choose mode')
      }
    } catch (err: any) {
      console.log('⚠️ Error checking for active games in this deck (this is OK if none exist):', err.message)
      // This is not a critical error, user can still play normally
    }
  }

  const handleStartGame = () => {
    if (gameMode === 'casual') {
      setGameStarted(true)
    } else if (gameMode === 'competitive') {
      startCompetitiveGame()
    }
  }

  const handleModeSelection = (mode: 'casual' | 'competitive') => {
    setGameMode(mode)
    if (mode === 'casual') {
      setGameStarted(true)
    }
    // Para competitive, se mostrará el formulario de jugadores
  }

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, ''])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, name: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = name
    setPlayers(updatedPlayers)
  }

  const startCompetitiveGame = async () => {
    const validPlayers = players.filter(p => p.trim().length > 0)
    
    if (validPlayers.length === 0) {
      setError("Debes agregar al menos un jugador")
      return
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/game/start-competitive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          deckId: gameCard?.deck.id,
          participants: validPlayers.map(name => ({ name: name.trim() }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        // Check if this is an active game error
        if (data.errorCode === 'ACTIVE_GAME_EXISTS') {
          setActiveGameError({
            gameId: data.data?.activeGameId,
            message: data.message
          })
          return
        }
        throw new Error(data.message || "Error iniciando juego competitivo")
      }

      setGameId(data.data.game.id)
      setGameParticipants(data.data.game.participants)
      setIsActiveCompetitiveSession(true)
      
      // Inicializar respuestas para cada participante
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
      setError(err.message || "Error iniciando juego competitivo")
    }
  }

  const handleRevealAnswer = async () => {
    if (!gameCard || revealing) return

    setRevealing(true)
    try {
      let res;
      
      if (gameMode === 'casual') {
        // Modo casual: usar endpoint que devuelve toda la info inmediatamente
        res = await fetch(`${BACKEND_URL}/api/cards/${cardId}/casual-play`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })
      } else {
        // Modo competitivo o modo anterior: usar reveal normal
        res = await fetch(`${BACKEND_URL}/api/cards/${cardId}/reveal`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error revelando respuesta")
      }

      setRevealedCard(data.data.card)
      setAnswered(true)
      
      // Solo mostrar scoring en modo competitivo
      if (gameMode === 'competitive') {
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

    // Use the numeric ID from gameCard, not the URL parameter
    const numericCardId = parseInt(gameCard.id)
    if (isNaN(numericCardId)) {
      setError('ID numérico de carta no disponible')
      return
    }

    setScoring(true)
    try {
      let res;
      let requestBody;

      if (gameMode === 'competitive' && gameId) {
        // Verificar que tenemos respuestas de participantes
        if (Object.keys(participantAnswers).length === 0) {
          throw new Error('No hay respuestas de participantes para enviar')
        }

        // Modo competitivo: enviar respuestas de todos los participantes
        const participantAnswersArray = Object.entries(participantAnswers).map(([participantId, answers]) => ({
          participantId: parseInt(participantId), // Ensure it's a number for validation
          userKnew: {
            songKnew: Boolean(answers?.songKnew),
            artistKnew: Boolean(answers?.artistKnew),
            albumKnew: Boolean(answers?.albumKnew)
          }
        }))

        console.log('🔍 DEBUG - Sending to backend:', {
          cardId: numericCardId,
          participantAnswers: participantAnswersArray,
          gameId,
          participantAnswersState: participantAnswers
        })

        res = await fetch(`${BACKEND_URL}/api/game/${gameId}/submit-competitive-round`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            cardId: numericCardId,
            participantAnswers: participantAnswersArray
          })
        })
      } else {
        // Modo individual (scoreCard anterior)
        res = await fetch(`${BACKEND_URL}/api/game/score-card`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            cardId: numericCardId,
            userKnew
          })
        })
      }

      const data = await res.json()

      if (!res.ok) {
        console.error('❌ Backend error response:', {
          status: res.status,
          statusText: res.statusText,
          data: data
        })
        throw new Error(data.message || "Error calculando puntuación")
      }

      setScoreResult(data.data)
      setShowScoring(false) // Ocultar checkboxes y mostrar resultado
      
      // Update participants data in real-time for the scoreboard
      if (gameMode === 'competitive' && data.data.game?.participants) {
        setGameParticipants(data.data.game.participants)
        console.log('✅ Updated live scoreboard with new participant scores')
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

  const handleCheckboxChange = (type: 'songKnew' | 'artistKnew' | 'albumKnew') => {
    setUserKnew(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const getSpotifyEmbedUrl = (spotifyUrl: string | null, previewUrl: string | null) => {
    if (spotifyUrl) {
      // Extraer el ID de la canción de la URL de Spotify
      const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)
      if (match) {
        return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`
      }
    }
    return null
  }

  const handlePlayAgain = () => {
    router.push("/")
  }

  const finishActiveGame = async (gameId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/game/${gameId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error finalizando juego")
      }

      // Clear the active game error and try to start the new game
      setActiveGameError(null)
      
      // Restart the competitive game flow
      if (gameMode === 'competitive') {
        startCompetitiveGame()
      }
      
    } catch (err: any) {
      setError(err.message || "Error finalizando juego activo")
    }
  }

  const endCompetitiveSession = async () => {
    if (!gameId) return

    try {
      const res = await fetch(`${BACKEND_URL}/api/game/${gameId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error finalizando partida")
      }

      // Reset all competitive game state
      setGameMode(null)
      setGameId(null)
      setGameParticipants([])
      setGameStarted(false)
      setIsActiveCompetitiveSession(false)
      setParticipantAnswers({})
      setScoreResult(null)
      setShowScoring(false)
      setAnswered(false)
      
      alert(`🏆 ¡Partida finalizada! Puntos finales mostrados.`)
      
    } catch (err: any) {
      setError(err.message || "Error finalizando partida")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando juego...</p>
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
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!gameCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carta no encontrada</p>
      </div>
    )
  }

  const embedUrl = getSpotifyEmbedUrl(gameCard.spotifyUrl, gameCard.previewUrl)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto flex gap-6">
        {/* Main Content */}
        <div className={`${gameMode === 'competitive' && gameStarted ? 'flex-1' : 'max-w-2xl mx-auto w-full'}`}>
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

          {isActiveCompetitiveSession && !gameStarted ? (
            /* Sesión competitiva activa */
            <div className="text-center mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-3 text-green-800">Sesión Competitiva Activa</h3>
                <p className="text-green-700 mb-2 text-sm">
                  <strong>Deck:</strong> {gameCard?.deck?.title}
                </p>
                <p className="text-green-700 mb-4 text-sm">
                  Partida en curso con {gameParticipants.length} jugadores
                </p>
                
                <div className="bg-white rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Participantes actuales:</h4>
                  <div className="space-y-1 text-sm">
                    {gameParticipants.map((participant, index) => (
                      <div key={participant.id} className="flex justify-between">
                        <span>{participant.name}</span>
                        <span className="font-bold text-green-600">{participant.totalPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <button
                    onClick={() => setGameStarted(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    ▶️ Continuar jugando
                  </button>
                  
                  <button
                    onClick={endCompetitiveSession}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    🏁 Finalizar partida completa
                  </button>
                </div>
              </div>
            </div>
          ) : !gameMode ? (
            /* Selección de modo */
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold mb-6">¿Cómo quieres jugar?</h3>
              
              <div className="grid gap-4 max-w-md mx-auto">
                <button
                  onClick={() => handleModeSelection('casual')}
                  className="bg-blue-500 text-white p-6 rounded-xl text-left hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">🎧</span>
                    <h4 className="text-xl font-bold">Modo Casual</h4>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Solo escucha y ve las respuestas. Sin puntaje.
                  </p>
                </button>
                
                <button
                  onClick={() => handleModeSelection('competitive')}
                  className="bg-green-500 text-white p-6 rounded-xl text-left hover:bg-green-600 transition-colors shadow-lg"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">🏆</span>
                    <h4 className="text-xl font-bold">Modo Competitivo</h4>
                  </div>
                  <p className="text-green-100 text-sm">
                    Agrega jugadores y compitan por puntos.
                  </p>
                </button>
              </div>
            </div>
          ) : gameMode === 'competitive' && !gameStarted ? (
            /* Formulario de jugadores */
            <div className="text-center">
              {activeGameError ? (
                /* Error de juego activo */
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-semibold mb-4 text-red-600">Juego Activo Detectado</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-red-800 mb-4">{activeGameError.message}</p>
                    <p className="text-red-600 text-sm">
                      Para poder empezar un nuevo juego competitivo, necesitas finalizar el juego actual.
                    </p>
                  </div>
                  
                  <div className="grid gap-3 mb-4">
                    <button
                      onClick={() => finishActiveGame(activeGameError.gameId)}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      🏁 Finalizar juego actual y empezar nuevo
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveGameError(null)
                        setGameMode(null)
                      }}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      ⬅️ Cancelar y volver
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario normal de jugadores */
                <>
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-semibold mb-6">Agregar Jugadores</h3>
              
              <div className="max-w-md mx-auto space-y-3 mb-6">
                {players.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => updatePlayer(index, e.target.value)}
                      placeholder={`Jugador ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={80}
                    />
                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 justify-center mb-6">
                {players.length < 8 && (
                  <button
                    onClick={addPlayer}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    ➕ Agregar Jugador
                  </button>
                )}
                <button
                  onClick={() => setGameMode(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  ⬅️ Volver
                </button>
              </div>
              
              <button
                onClick={handleStartGame}
                disabled={players.filter(p => p.trim().length > 0).length === 0}
                className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Empezar Juego
              </button>
              </>
              )}
            </div>
          ) : !gameStarted ? (
            /* Pre-game casual */
            <div className="text-center">
              <div className="text-6xl mb-4">🎧</div>
              <h3 className="text-xl font-semibold mb-4">¿Listo para el desafío?</h3>
              <p className="text-gray-600 mb-6">{gameCard.hint}</p>
              <button
                onClick={handleStartGame}
                className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
              >
                ▶️ Empezar Juego
              </button>
            </div>
          ) : !answered ? (
            /* Playing */
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-6">🎵 ¡Escucha y adivina!</h3>

              <div className="relative w-full max-w-md mx-auto mb-4">
                <p className="text-gray-600 mb-4">¿Sabes qué canción es?</p>

                {/* Spotify embed o audio */}
                {embedUrl ? (
                  <div className="relative w-full">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="152"
                      style={{ borderRadius: "12px" }}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-lg shadow-md"
                    ></iframe>

                    <button
                      onClick={handleRevealAnswer}
                      disabled={revealing}
                      className="absolute top-0 left-0 w-full h-full bg-teal-600 text-white rounded-lg text-lg font-bold hover:bg-teal-700 transition-colors shadow-xl flex items-center justify-center"
                      style={{
                        zIndex: 10,
                        clipPath: "polygon(0 0, 85% 0, 85% 30%, 100% 30%, 100% 70%, 85% 70%, 85% 100%, 0 100%)",
                      }}
                    >
                      {revealing ? "Revelando..." : "🔍 Revelar Respuesta"}
                    </button>
                  </div>
                ) : gameCard.previewUrl ? (
                  <div className="w-full flex justify-center">
                    <audio controls className="w-full">
                      <source src={gameCard.previewUrl} type="audio/mpeg" />
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  </div>
                ) : (
                  <div className="w-full p-4 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800">⚠️ Audio no disponible para esta carta</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Answer Revealed */
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-600 mb-6">¡Respuesta revelada!</h3>

              {revealedCard && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Album Cover */}
                    {revealedCard.album?.coverUrl && (
                      <div className="flex justify-center">
                        <img
                          src={revealedCard.album.coverUrl || "/placeholder.svg"}
                          alt={revealedCard.album.title}
                          className="w-48 h-48 object-cover rounded-lg shadow-lg"
                        />
                      </div>
                    )}

                    {/* Song Info */}
                    <div className="text-left space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-700">Canción:</h4>
                        <p className="text-xl font-bold text-gray-900">{revealedCard.songName}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700">Artista:</h4>
                        <p className="text-lg text-gray-900">{revealedCard.artist.name}</p>
                        {revealedCard.artist.country && (
                          <p className="text-sm text-gray-600">🌍 {revealedCard.artist.country}</p>
                        )}
                        {revealedCard.artist.genre && (
                          <p className="text-sm text-gray-600">🎵 {revealedCard.artist.genre}</p>
                        )}
                      </div>

                      {revealedCard.album && (
                        <div>
                          <h4 className="font-semibold text-gray-700">Álbum:</h4>
                          <p className="text-lg text-gray-900">{revealedCard.album.title}</p>
                          {revealedCard.album.releaseYear && (
                            <p className="text-sm text-gray-600">📅 {revealedCard.album.releaseYear}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de puntuación con checkboxes - SOLO MODO COMPETITIVO */}
              {gameMode === 'competitive' && showScoring && (
                <div className="mt-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    ¿Qué adivinó cada jugador?
                  </h4>
                  <p className="text-blue-700 mb-6 text-sm">
                    Marca lo que cada participante sabía antes de escuchar la canción
                  </p>
                  
                  <div className="space-y-6">
                    {gameParticipants.map((participant) => (
                      <div key={participant.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <h5 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <span className="mr-2">👤</span>
                          {participant.name}
                        </h5>
                        
                        <div className="space-y-3">
                          <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              checked={participantAnswers[participant.id]?.songKnew || false}
                              onChange={() => handleParticipantCheckboxChange(participant.id, 'songKnew')}
                            />
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">🎵</span>
                              <div>
                                <div className="font-semibold text-gray-800">Nombre de la canción</div>
                                <div className="text-sm text-gray-600">"{revealedCard?.songName}"</div>
                              </div>
                            </div>
                          </label>
                          
                          <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              checked={participantAnswers[participant.id]?.artistKnew || false}
                              onChange={() => handleParticipantCheckboxChange(participant.id, 'artistKnew')}
                            />
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">🎤</span>
                              <div>
                                <div className="font-semibold text-gray-800">Nombre del artista</div>
                                <div className="text-sm text-gray-600">"{revealedCard?.artist.name}"</div>
                              </div>
                            </div>
                          </label>
                          
                          {revealedCard?.album && (
                            <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                checked={participantAnswers[participant.id]?.albumKnew || false}
                                onChange={() => handleParticipantCheckboxChange(participant.id, 'albumKnew')}
                              />
                              <div className="flex items-center">
                                <span className="text-2xl mr-2">💿</span>
                                <div>
                                  <div className="font-semibold text-gray-800">Nombre del álbum</div>
                                  <div className="text-sm text-gray-600">"{revealedCard?.album.title}"</div>
                                </div>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSubmitScore}
                    disabled={scoring}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {scoring ? "Calculando..." : "🏆 Calcular puntos de todos los jugadores"}
                  </button>
                </div>
              )}

              {/* Mensaje para modo casual */}
              {gameMode === 'casual' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 text-center">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">🎧 Modo Casual</h4>
                  <p className="text-blue-700">
                    ¡Solo disfruta la música! No se calculan puntos en este modo.
                  </p>
                </div>
              )}

              {/* Resultado de puntuación - SOLO COMPETITIVO */}
              {gameMode === 'competitive' && scoreResult && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                  <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                    <span className="mr-2">🏆</span>
                    Resultados de la ronda
                  </h4>
                  
                  {scoreResult.round?.participantResults?.map((result: any) => (
                    <div key={result.participantId} className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                      <h5 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="mr-2">👤</span>
                          {result.participantName}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {result.points} pts
                        </span>
                      </h5>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h6 className="font-semibold text-gray-700 mb-2">Desglose:</h6>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>🎵 Canción:</span>
                              <span className={`font-bold ${result.userKnew.songKnew ? 'text-green-600' : 'text-red-500'}`}>
                                {result.pointsBreakdown.song} pts
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>🎤 Artista:</span>
                              <span className={`font-bold ${result.userKnew.artistKnew ? 'text-green-600' : 'text-red-500'}`}>
                                {result.pointsBreakdown.artist} pts
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>💿 Álbum:</span>
                              <span className={`font-bold ${result.userKnew.albumKnew ? 'text-green-600' : 'text-red-500'}`}>
                                {result.pointsBreakdown.album} pts
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-1">
                              <span>🔥 Bonus:</span>
                              <span className="font-bold text-orange-600">
                                {result.pointsBreakdown.difficultyBonus} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h6 className="font-semibold text-gray-700 mb-2">¿Qué sabía?</h6>
                          <div className="space-y-1 text-sm">
                            <div className={`flex items-center ${result.userKnew.songKnew ? 'text-green-600' : 'text-red-500'}`}>
                              {result.userKnew.songKnew ? '✅' : '❌'} Canción
                            </div>
                            <div className={`flex items-center ${result.userKnew.artistKnew ? 'text-green-600' : 'text-red-500'}`}>
                              {result.userKnew.artistKnew ? '✅' : '❌'} Artista
                            </div>
                            <div className={`flex items-center ${result.userKnew.albumKnew ? 'text-green-600' : 'text-red-500'}`}>
                              {result.userKnew.albumKnew ? '✅' : '❌'} Álbum
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center bg-white p-4 rounded-lg mt-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Ranking actual del juego:</h5>
                    <div className="space-y-2">
                      {scoreResult.game?.participants?.sort((a: any, b: any) => b.totalPoints - a.totalPoints).map((participant: any, index: number) => (
                        <div key={participant.id} className="flex justify-between items-center">
                          <span className="flex items-center">
                            <span className="mr-2">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}</span>
                            {participant.name}
                          </span>
                          <span className="font-bold">{participant.totalPoints} pts totales</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Multiplicador por dificultad <span className="font-bold">{scoreResult.round?.card?.difficulty}</span>: x{scoreResult.round?.participantResults?.[0]?.difficultyMultiplier}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handlePlayAgain}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors mt-6"
              >
                🏠 Volver al inicio
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-blue-200 text-sm">
          <p>Escanea más códigos QR para seguir jugando 🎮</p>
          
          {isActiveCompetitiveSession && gameStarted && (
            <div className="mt-4">
              <button
                onClick={endCompetitiveSession}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                🏁 Finalizar partida completa
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Live Scoreboard Sidebar - Only show during competitive gameplay */}
        {gameMode === 'competitive' && gameStarted && gameParticipants.length > 0 && (
          <div className="w-80 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 h-fit sticky top-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">🏆 Marcador</h3>
              <p className="text-blue-200 text-sm">{gameCard?.deck?.title}</p>
            </div>

            <div className="space-y-3">
              {gameParticipants
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((participant, index) => (
                  <div 
                    key={participant.id} 
                    className={`
                      bg-white/20 rounded-lg p-4 border border-white/30
                      ${index === 0 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-400/20' : ''}
                      ${index === 1 ? 'ring-1 ring-gray-300' : ''}
                      ${index === 2 ? 'ring-1 ring-orange-400' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{participant.name}</p>
                          <p className="text-xs text-blue-200">
                            {participant.totalRounds} rondas jugadas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{participant.totalPoints}</p>
                        <p className="text-xs text-blue-200">puntos</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="text-center text-blue-200 text-sm">
                <p className="mb-2">🎵 Jugando en vivo</p>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs">
                    Total de participantes: <span className="font-bold text-white">{gameParticipants.length}</span>
                  </p>
                  <p className="text-xs mt-1">
                    Partida iniciada: <span className="font-bold text-white">En curso</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
