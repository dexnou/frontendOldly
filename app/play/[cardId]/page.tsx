"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Share2, Copy, Twitter, Home, Music2, Users, Smartphone, Trophy, CheckCircle2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [isGameOver, setIsGameOver] = useState(false)
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
      setError('ID de carta no encontrado')
      setLoading(false)
      return
    }

    const isNumericId = !isNaN(parseInt(cardId as string))
    const isQrToken = typeof cardId === 'string' && cardId.length === 16
    
    if (!isNumericId && !isQrToken) {
      setError('Formato de carta inválido.')
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
        throw new Error('Demasiadas solicitudes.')
      }
      throw new Error(`Error de servidor (${res.status})`)
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      })
      const data = await safeJsonParse(res, 'fetchGameCard')
      if (!res.ok) {
        if (data.needsAccess) {
          setError(`Necesitas activar el mazo "${data.deck?.title}"`)
          return
        }
        throw new Error(data.message || "Error cargando carta")
      }
      setGameCard(data.data.card)
    } catch (err: any) {
      setError(err.message || "Error cargando juego")
    } finally {
      setLoading(false)
    }
  }

  const checkActiveCompetitiveGame = async (deckId: string) => {
    try {
      if (!token) return null
      const res = await fetch(`/api/proxy/game/active-competitive/${deckId}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
          const initialAnswers: any = {}
          data.data.game.participants.forEach((participant: any) => {
            initialAnswers[participant.id] = { songKnew: false, artistKnew: false, albumKnew: false }
          })
          setParticipantAnswers(initialAnswers)
        }
      }
    } catch (err: any) { console.log('Checking active game error:', err) }
  }

  const handleStartGame = () => {
    if (gameMode === 'casual') setGameStarted(true)
    else if (gameMode === 'competitive' || gameMode === 'competitive_turns') startCompetitiveGame()
  }

  const handleModeSelection = (mode: 'casual' | 'competitive' | 'competitive_turns') => {
    setGameMode(mode)
    setFormError("")
    if (mode === 'casual') startCasualSession()
  }

  const addPlayer = () => players.length < 8 && setPlayers([...players, ''])
  const removePlayer = (index: number) => players.length > 1 && setPlayers(players.filter((_, i) => i !== index))
  const updatePlayer = (index: number, name: string) => {
    const updated = [...players]; updated[index] = name; setPlayers(updated); setFormError("")
  }

  const startCompetitiveGame = async () => {
    setFormError("")
    const validPlayers = players.filter(p => p.trim().length > 0)
    if (validPlayers.length === 0) return setFormError("Agrega al menos un jugador")
    
    // Validate unique names
    const names = validPlayers.map(p => p.trim().toLowerCase())
    if (names.length !== new Set(names).size) return setFormError("Nombres duplicados no permitidos")

    if (!token) return setError("Error de autenticación")

    try {
      const res = await fetch(`/api/proxy/game/start-competitive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          deckId: gameCard?.deck.id,
          participants: validPlayers.map(name => ({ name: name.trim() })),
          mode: gameMode
        })
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.errorCode === 'ACTIVE_GAME_EXISTS') {
          setActiveGameError({ gameId: data.data?.activeGameId, message: data.message })
          return
        }
        if (data.errorCode === 'DUPLICATE_PARTICIPANT_NAMES') return setFormError("Nombres duplicados")
        throw new Error(data.message)
      }

      setGameId(data.data.game.id)
      setGameParticipants(data.data.game.participants)
      setCurrentTurnParticipantId(data.data.game.currentTurnParticipantId)
      setIsActiveCompetitiveSession(true)
      const initialAnswers: any = {}
      data.data.game.participants.forEach((p: any) => initialAnswers[p.id] = { songKnew: false, artistKnew: false, albumKnew: false })
      setParticipantAnswers(initialAnswers)
      setGameStarted(true)
    } catch (err: any) { setError(err.message) }
  }

  const handleRevealAnswer = async () => {
    if (!gameCard || revealing) return
    setRevealing(true)
    try {
      const url = gameMode === 'casual' ? `/api/proxy/cards/${cardId}/casual-play` : `/api/proxy/cards/${cardId}/reveal`
      const res = await fetch(url, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRevealedCard(data.data.card)
      setAnswered(true)
      if (gameMode !== 'casual') setShowScoring(true)
    } catch (err: any) { setError(err.message) } finally { setRevealing(false) }
  }

  const handleSubmitScore = async () => {
    if (!gameCard || scoring) return
    const numericCardId = parseInt(gameCard.id)
    if (isNaN(numericCardId)) return setError('ID inválido')
    
    setScoring(true)
    try {
      let res;
      if (gameMode === 'competitive_turns' && gameId && currentTurnParticipantId) {
        res = await fetch(`/api/proxy/game/${gameId}/submit-turn-round`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cardId: numericCardId, participantId: currentTurnParticipantId, userKnew: participantAnswers[currentTurnParticipantId] })
        })
      } else if (gameMode === 'competitive' && gameId) {
        const participantAnswersArray = Object.entries(participantAnswers).map(([pid, ans]) => ({
          participantId: parseInt(pid), userKnew: { songKnew: Boolean(ans?.songKnew), artistKnew: Boolean(ans?.artistKnew), albumKnew: Boolean(ans?.albumKnew) }
        }))
        res = await fetch(`/api/proxy/game/${gameId}/submit-competitive-round`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cardId: numericCardId, participantAnswers: participantAnswersArray })
        })
      } else {
        res = await fetch(`/api/proxy/game/score-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cardId: numericCardId, userKnew })
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      setScoreResult(data.data)
      setShowScoring(false)
      if (data.data.game?.participants) setGameParticipants(data.data.game.participants)
      if (data.data.game?.nextTurn?.participantId) setCurrentTurnParticipantId(data.data.game.nextTurn.participantId)
      else if (data.data.game?.currentTurnParticipantId) setCurrentTurnParticipantId(data.data.game.currentTurnParticipantId)

    } catch (err: any) { setError(err.message) } finally { setScoring(false) }
  }

  const handleParticipantCheckboxChange = (participantId: string, type: 'songKnew' | 'artistKnew' | 'albumKnew') => {
    setParticipantAnswers(prev => ({
      ...prev, [participantId]: { ...prev[participantId], [type]: !prev[participantId][type] }
    }))
  }

  const getSpotifyEmbedUrl = (spotifyUrl: string | null) => {
    if (spotifyUrl) {
      const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)
      if (match) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`
    }
    return null
  }

  const handlePlayAgain = () => isGameOver ? resetGame() : router.push("/")
  
  const finishActiveGame = async (gId: string) => {
    try {
      await fetch(`/api/proxy/game/${gId}/finish`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      setActiveGameError(null)
      if (gameMode !== 'casual') startCompetitiveGame()
    } catch (err: any) { setError(err.message) }
  }

  const endCompetitiveSession = async () => {
    if (!gameId) return
    try {
      await fetch(`/api/proxy/game/${gameId}/finish`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      setIsGameOver(true)
    } catch (err: any) { setError(err.message) }
  }

  const resetGame = () => {
    setGameMode(null); setGameId(null); setGameParticipants([]); setCurrentTurnParticipantId(null); setGameStarted(false); setIsActiveCompetitiveSession(false); setParticipantAnswers({}); setScoreResult(null); setShowScoring(false); setAnswered(false); setIsGameOver(false); router.push("/")
  }

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'copy') => {
    const sorted = [...gameParticipants].sort((a, b) => b.totalPoints - a.totalPoints);
    let text = `🎵 *Oldly Fun Music Box*\n🏆 Resultados del Mazo: ${gameCard?.deck?.title}\n\n`;
    sorted.forEach((p, i) => text += `${i===0?'🥇':i===1?'🥈':i===2?'🥉':'🏅'} ${p.name}: ${p.totalPoints} pts\n`);
    const encoded = encodeURIComponent(text)
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank')
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank')
    if (platform === 'copy') { navigator.clipboard.writeText(text); alert("¡Copiado!") }
  }

  // --- RENDER ---
  
  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2 text-foreground">Ups, algo salió mal</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">Volver al inicio</Button>
        </div>
      </div>
    )
  }

  if (!gameCard) return null

  const embedUrl = getSpotifyEmbedUrl(gameCard.spotifyUrl)

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* COLUMNA PRINCIPAL */}
        <div className={`transition-all duration-300 ${((gameMode === 'competitive' || gameMode === 'competitive_turns') && gameStarted) ? 'lg:w-3/4' : 'max-w-2xl mx-auto w-full'}`}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Oldly Fun Music Box</h1>
            {user && <p className="text-muted-foreground text-sm">Jugador: <span className="text-foreground font-medium">{user.firstname}</span></p>}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6 lg:p-8">
            
            {/* Deck Badge */}
            <div className="flex flex-col items-center mb-8">
              <span className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-semibold border border-border">
                {gameCard.deck.title}
              </span>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                 <span>{gameCard.deck.theme}</span>
                 <span>•</span>
                 <span className="capitalize">{gameCard.difficulty}</span>
              </div>
            </div>

            {/* --- PANTALLA GAME OVER --- */}
            {isGameOver ? (
               <div className="text-center animate-in fade-in zoom-in">
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-6">Resultados Finales</h2>
                  <div className="space-y-3 mb-8">
                    {gameParticipants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                       <div key={p.id} className={`flex items-center justify-between p-4 rounded-lg border ${i===0 ? 'bg-secondary/50 border-primary' : 'bg-background border-border'}`}>
                          <div className="flex items-center gap-3">
                             <span className="text-xl">{i===0?'🥇':i===1?'🥈':i===2?'🥉':'🏅'}</span>
                             <span className="font-medium">{p.name}</span>
                          </div>
                          <span className="font-bold">{p.totalPoints} pts</span>
                       </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                     <Button variant="outline" onClick={() => handleShare('whatsapp')} className="w-full">WhatsApp</Button>
                     <Button variant="outline" onClick={() => handleShare('twitter')} className="w-full">X / Twitter</Button>
                     <Button variant="outline" onClick={() => handleShare('copy')} className="w-full">Copiar</Button>
                  </div>
                  <Button onClick={resetGame} size="lg" className="w-full">Volver al Inicio</Button>
               </div>
            ) : (
            <>
            {/* --- SELECCION DE MODO --- */}
            {!gameMode && !isActiveCasualSession && !isActiveCompetitiveSession && (
               <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-center mb-6">Selecciona el modo de juego</h3>
                  <div onClick={() => handleModeSelection('casual')} className="p-4 rounded-lg border border-border bg-background hover:border-primary cursor-pointer transition-all flex gap-4 items-center group">
                     <div className="bg-secondary p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Music2 className="w-6 h-6" /></div>
                     <div><h4 className="font-bold">Modo Casual</h4><p className="text-sm text-muted-foreground">Sin puntos, solo adivina y disfruta.</p></div>
                  </div>
                  <div onClick={() => handleModeSelection('competitive')} className="p-4 rounded-lg border border-border bg-background hover:border-primary cursor-pointer transition-all flex gap-4 items-center group">
                     <div className="bg-secondary p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Users className="w-6 h-6" /></div>
                     <div><h4 className="font-bold">Todos vs Todos</h4><p className="text-sm text-muted-foreground">Compite por puntos en grupo.</p></div>
                  </div>
                  <div onClick={() => handleModeSelection('competitive_turns')} className="p-4 rounded-lg border border-border bg-background hover:border-primary cursor-pointer transition-all flex gap-4 items-center group">
                     <div className="bg-secondary p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Smartphone className="w-6 h-6" /></div>
                     <div><h4 className="font-bold">Pasar el Celular</h4><p className="text-sm text-muted-foreground">Turnos individuales en un dispositivo.</p></div>
                  </div>
               </div>
            )}

            {/* --- CONFIGURACION JUGADORES --- */}
            {(gameMode === 'competitive' || gameMode === 'competitive_turns') && !gameStarted && !isActiveCompetitiveSession && (
               <div className="space-y-6">
                 <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Jugadores</h3>
                    <p className="text-sm text-muted-foreground">Agrega a los participantes</p>
                 </div>
                 
                 {activeGameError ? (
                    <div className="bg-destructive/10 p-4 rounded-lg text-center">
                       <p className="text-destructive mb-4">{activeGameError.message}</p>
                       <div className="flex gap-2 justify-center">
                          <Button variant="destructive" onClick={() => finishActiveGame(activeGameError.gameId)}>Reiniciar</Button>
                          <Button variant="outline" onClick={() => {setActiveGameError(null); setGameMode(null)}}>Cancelar</Button>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {players.map((p, i) => (
                          <div key={i} className="flex gap-2">
                             <Input placeholder={`Nombre Jugador ${i+1}`} value={p} onChange={(e) => updatePlayer(i, e.target.value)} className="bg-secondary" />
                             {players.length > 1 && <Button variant="destructive" size="icon" onClick={() => removePlayer(i)}>✕</Button>}
                          </div>
                       ))}
                       {players.length < 8 && <Button variant="outline" onClick={addPlayer} className="w-full border-dashed">+ Agregar Jugador</Button>}
                       
                       {formError && <p className="text-destructive text-sm text-center">{formError}</p>}
                       
                       <div className="pt-4 flex gap-3">
                          <Button variant="ghost" onClick={() => setGameMode(null)}>Atrás</Button>
                          <Button className="flex-1" onClick={handleStartGame}>Comenzar Partida</Button>
                       </div>
                    </div>
                 )}
               </div>
            )}

            {/* --- SESIONES ACTIVAS (Resumir) --- */}
            {(isActiveCasualSession || isActiveCompetitiveSession) && !gameStarted && (
               <div className="text-center py-8">
                  <h3 className="text-xl font-bold mb-4">¡Partida en curso detectada!</h3>
                  <div className="flex gap-3 justify-center">
                     <Button onClick={() => setGameStarted(true)}>Continuar Jugando</Button>
                     <Button variant="secondary" onClick={isActiveCasualSession ? endCasualSession : endCompetitiveSession}>Finalizar</Button>
                  </div>
               </div>
            )}

            {/* --- AREA DE JUEGO --- */}
            {gameStarted && !answered && (
               <div className="text-center space-y-6">
                  {cardAlreadyPlayedByCurrent ? (
                     <div className="bg-secondary/50 p-6 rounded-lg border border-yellow-500/50">
                        <p className="text-yellow-600 font-bold mb-2">¡Ya jugaste esta carta!</p>
                        <p className="text-sm text-muted-foreground">Pasa el turno o escanea otra.</p>
                     </div>
                  ) : (
                     <>
                        {currentTurnParticipantId && (
                           <div className="bg-secondary/50 py-2 px-4 rounded-full inline-block mb-4">
                              <span className="text-sm text-muted-foreground mr-2">Turno de:</span>
                              <span className="font-bold text-primary">{gameParticipants.find(p => p.id == currentTurnParticipantId)?.name}</span>
                           </div>
                        )}

                        <div className="relative w-full max-w-md mx-auto mb-4">
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
                                 className="rounded-lg shadow-md bg-black" 
                               />
                               
                               <button 
                                 onClick={handleRevealAnswer} 
                                 disabled={revealing} 
                                 className="absolute top-0 left-0 w-full h-full bg-[#2a2a2a] text-white rounded-lg text-lg font-bold hover:bg-[#3a3a3a] transition-colors shadow-xl flex items-center justify-center z-10"
                                 style={{ 
                                   clipPath: "polygon(0 0, 85% 0, 85% 30%, 100% 30%, 100% 70%, 85% 70%, 85% 100%, 0 100%)" 
                                 }}
                               >
                                 {revealing ? "Revelando..." : "🔍 Revelar Respuesta"}
                               </button>
                             </div>
                           ) : gameCard.previewUrl ? (
                               <div className="flex flex-col items-center justify-center bg-secondary p-6 rounded-lg">
                                  <audio controls className="mb-6 w-full"><source src={gameCard.previewUrl} /></audio>
                                  <Button onClick={handleRevealAnswer}>Revelar Respuesta</Button>
                               </div>
                           ) : (
                              <div className="h-40 flex items-center justify-center bg-secondary text-muted-foreground rounded-lg">
                                 Sin Audio
                              </div>
                           )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-4 italic">{gameCard.hint}</p>
                     </>
                  )}
               </div>
            )}

            {/* --- RESULTADO Y PUNTUACION --- */}
            {answered && revealedCard && (
               <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <div className="flex flex-col md:flex-row gap-6 items-center bg-secondary/30 p-6 rounded-xl border border-border mb-8">
                     {revealedCard.album?.coverUrl && (
                        <img src={revealedCard.album.coverUrl} alt="Album" className="w-32 h-32 rounded-lg shadow-md object-cover" />
                     )}
                     <div className="text-center md:text-left space-y-1">
                        <h2 className="text-2xl font-bold text-primary">{revealedCard.songName}</h2>
                        <p className="text-lg font-medium text-foreground">{revealedCard.artist.name}</p>
                        <p className="text-sm text-muted-foreground">{revealedCard.album?.title}</p>
                     </div>
                  </div>

                  {/* FORMULARIO DE PUNTOS */}
                  {(gameMode === 'competitive' || gameMode === 'competitive_turns') && showScoring && (
                     <div className="space-y-4">
                        <h4 className="font-semibold text-center border-b border-border pb-2 mb-4">Asignar Puntos</h4>
                        {gameParticipants.filter(p => gameMode !== 'competitive_turns' || p.id == currentTurnParticipantId).map(p => (
                           <div key={p.id} className="p-4 rounded-lg border border-border bg-background">
                              <p className="font-bold mb-3">{p.name}</p>
                              <div className="space-y-2">
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`song-${p.id}`} checked={participantAnswers[p.id]?.songKnew} onCheckedChange={() => handleParticipantCheckboxChange(p.id, 'songKnew')} />
                                    <label htmlFor={`song-${p.id}`} className="text-sm cursor-pointer">Canción ({gameCard.deck.labelSong || "Nombre"})</label>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`artist-${p.id}`} checked={participantAnswers[p.id]?.artistKnew} onCheckedChange={() => handleParticipantCheckboxChange(p.id, 'artistKnew')} />
                                    <label htmlFor={`artist-${p.id}`} className="text-sm cursor-pointer">Artista ({gameCard.deck.labelArtist || "Nombre"})</label>
                                 </div>
                                 {revealedCard.album && (
                                     <div className="flex items-center space-x-2">
                                        <Checkbox id={`album-${p.id}`} checked={participantAnswers[p.id]?.albumKnew} onCheckedChange={() => handleParticipantCheckboxChange(p.id, 'albumKnew')} />
                                        <label htmlFor={`album-${p.id}`} className="text-sm cursor-pointer">Álbum ({gameCard.deck.labelAlbum || "Nombre"})</label>
                                     </div>
                                 )}
                              </div>
                           </div>
                        ))}
                        <Button className="w-full mt-4" onClick={handleSubmitScore} disabled={scoring}>
                           {scoring ? "Guardando..." : "Confirmar Puntos"}
                        </Button>
                     </div>
                  )}

                  {/* RESUMEN RONDA */}
                  {scoreResult && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center mb-6">
                        <div className="flex justify-center mb-2"><CheckCircle2 className="w-8 h-8 text-emerald-500" /></div>
                        <h4 className="font-bold text-emerald-600 mb-2">Puntos Asignados</h4>
                        {scoreResult.game?.nextTurn && (
                           <p className="text-sm font-medium mt-2 pt-2 border-t border-emerald-500/20">
                              Siguiente turno: <span className="font-bold">{scoreResult.game.nextTurn.participantName}</span>
                           </p>
                        )}
                     </div>
                  )}

                  {(!showScoring || scoreResult) && (
                     <Button variant="secondary" className="w-full mt-4" onClick={handlePlayAgain}>
                        {gameMode === 'casual' ? "Siguiente Carta" : "Volver al Inicio"}
                     </Button>
                  )}
               </div>
            )}
            
            {/* --- BOTÓN DE SALIDA (NUEVO) --- */}
            {gameStarted && !isGameOver && (
               <div className="mt-8 pt-6 border-t border-border flex justify-center">
                  <Button 
                     variant="ghost" 
                     className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                     onClick={gameMode === 'casual' ? endCasualSession : endCompetitiveSession}
                  >
                     <LogOut className="w-4 h-4 mr-2" />
                     {gameMode === 'casual' ? "Terminar Modo Casual" : "Abandonar Partida"}
                  </Button>
               </div>
            )}
            </>
            )}
          </div>
        </div>

        {/* --- SIDEBAR LATERAL (Desktop) --- */}
        {(gameMode === 'competitive' || gameMode === 'competitive_turns') && gameStarted && gameParticipants.length > 0 && !isGameOver && (
           <div className="hidden lg:block w-80 sticky top-4 h-fit">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                 <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4" /> Tabla de Posiciones</h3>
                 <div className="space-y-3">
                    <AnimatePresence>
                       {gameParticipants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                          <motion.div 
                             key={p.id}
                             layout
                             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                             className={`flex justify-between items-center p-3 rounded-lg border text-sm ${
                                p.id == currentTurnParticipantId ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-background border-border'
                             }`}
                          >
                             <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-4">{i+1}.</span>
                                <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                             </div>
                             <span className="font-bold">{p.totalPoints}</span>
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
                 <div className="mt-6 pt-4 border-t border-border">
                    <Button variant="destructive" size="sm" className="w-full" onClick={endCompetitiveSession}>Terminar Partida</Button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  )
}