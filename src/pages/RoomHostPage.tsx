import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../services/api'
import { createConnection, startConnection, stopConnection, getConnection } from '../services/signalr'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { initTts, speakNumber } from '../services/tts'

interface RoomData {
  id: string
  roomCode: string
  status: string
  maxPlayers: number
  createdAt: string
}

interface PlayerInfo {
  id: string
  nickname: string
  isConnected: boolean
}

interface PlayersListResponse {
  players: PlayerInfo[]
  playerCount: number
  maxPlayers: number
}

interface DrawResult {
  number: number
  drawOrder: number
  remainingNumbers: number
  drawnNumbers: number[]
}

interface GameState {
  status: string
  gameSessionId: string | null
  drawOrder: number
  currentNumber: number | null
  drawnNumbers: number[]
  hideDrawnNumbers: boolean
}

interface RoomSettingsResponse {
  hideDrawnNumbers: boolean
}

export function RoomHostPage() {
  const navigate = useNavigate()
  const [room, setRoom] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [playerCount, setPlayerCount] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [drawOrder, setDrawOrder] = useState(0)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [drawing, setDrawing] = useState(false)
  const [kinhMessage, setKinhMessage] = useState<string | null>(null)
  const [gameFinished, setGameFinished] = useState(false)
  const [autoDrawEnabled, setAutoDrawEnabled] = useState(false)
  const [autoDrawInterval, setAutoDrawInterval] = useState(5)
  const [autoDrawPaused, setAutoDrawPaused] = useState(false)
  const [hideDrawnNumbers, setHideDrawnNumbers] = useState(false)
  const autoDrawRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const drawingRef = useRef(false)
  const ttsInitialized = useRef(false)

  // Khởi tạo TTS
  useEffect(() => {
    if (!ttsInitialized.current) {
      initTts()
      ttsInitialized.current = true
    }
  }, [])

  const fetchPlayers = useCallback(async (roomCode: string) => {
    try {
      const result = await api.get<PlayersListResponse>(`/rooms/${roomCode}/players`)
      setPlayers(result.players)
      setPlayerCount(result.playerCount)
    } catch {
      // Ignore - will refresh on next SignalR event
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await api.post<RoomData>('/rooms')
        if (!mounted) return
        setRoom(result)

        // Fetch initial player list
        await fetchPlayers(result.roomCode)

        // Khôi phục game state nếu game đang chơi
        if (result.status === 'playing') {
          try {
            const state = await api.get<GameState>(`/rooms/${result.roomCode}/state`)
            if (!mounted) return
            if (state.status === 'playing') {
              setGameStarted(true)
              setDrawOrder(state.drawOrder)
              setCurrentNumber(state.currentNumber)
              setDrawnNumbers(state.drawnNumbers)
              setHideDrawnNumbers(state.hideDrawnNumbers)
            }
          } catch {
            // Không lấy được state → vẫn vào phòng bình thường
          }
        }

        // Connect SignalR
        const conn = await createConnection()

        conn.on('PlayerJoined', (_nickname: string, count: number) => {
          setPlayerCount(count)
          fetchPlayers(result.roomCode)
        })

        conn.on('PlayerLeft', (_nickname: string, count: number) => {
          setPlayerCount(count)
          fetchPlayers(result.roomCode)
        })

        conn.on('KinhResult', (_nickname: string, valid: boolean, _rowIndex: number, message: string) => {
          setKinhMessage(`${valid ? 'KINH!' : ''} ${message}`)
          if (valid) setGameFinished(true)
          if (!valid) {
            // Pause auto-draw 5s khi KINH invalid
            setAutoDrawPaused(true)
            setTimeout(() => setAutoDrawPaused(false), 5000)
            setTimeout(() => setKinhMessage(null), 3000)
          }
        })

        conn.on('GameStatusChanged', (status: string) => {
          if (status === 'finished') setGameFinished(true)
        })

        await startConnection()
        await conn.invoke('JoinRoomAsHost', result.roomCode)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Không thể tạo phòng')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      stopConnection()
    }
  }, [fetchPlayers])

  const copyCode = async () => {
    if (!room) return
    await navigator.clipboard.writeText(room.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const kickPlayer = async (playerId: string, nickname: string) => {
    if (!room) return
    const conn = getConnection()
    if (!conn) return

    try {
      await conn.invoke('KickPlayer', room.roomCode, playerId)
    } catch {
      console.error(`Failed to kick ${nickname}`)
    }
  }

  const startGame = async () => {
    if (!room || playerCount === 0) return
    setStarting(true)
    try {
      await api.post(`/rooms/${room.roomCode}/start`)
      setGameStarted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể bắt đầu game')
    } finally {
      setStarting(false)
    }
  }

  const drawNumber = useCallback(async () => {
    if (!room || drawingRef.current || gameFinished) return
    drawingRef.current = true
    setDrawing(true)
    try {
      const result = await api.post<DrawResult>(`/rooms/${room.roomCode}/draw`)
      setCurrentNumber(result.number)
      setDrawOrder(result.drawOrder)
      setDrawnNumbers(result.drawnNumbers)
      speakNumber(result.number)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể bốc số')
    } finally {
      drawingRef.current = false
      setDrawing(false)
    }
  }, [room, gameFinished])

  const endGame = async () => {
    if (!room || gameFinished) return
    try {
      await api.post(`/rooms/${room.roomCode}/end`)
      setGameFinished(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kết thúc game')
    }
  }

  // Auto-draw timer
  useEffect(() => {
    if (autoDrawRef.current) {
      clearInterval(autoDrawRef.current)
      autoDrawRef.current = null
    }

    if (autoDrawEnabled && !autoDrawPaused && gameStarted && !gameFinished && drawOrder < 90) {
      autoDrawRef.current = setInterval(() => {
        drawNumber()
      }, autoDrawInterval * 1000)
    }

    return () => {
      if (autoDrawRef.current) {
        clearInterval(autoDrawRef.current)
        autoDrawRef.current = null
      }
    }
  }, [autoDrawEnabled, autoDrawPaused, autoDrawInterval, gameStarted, gameFinished, drawOrder, drawNumber])

  // Dừng auto-draw khi game kết thúc
  useEffect(() => {
    if (gameFinished) {
      setAutoDrawEnabled(false)
    }
  }, [gameFinished])

  const toggleHideDrawnNumbers = async () => {
    if (!room) return
    const newValue = !hideDrawnNumbers
    setHideDrawnNumbers(newValue)
    try {
      await api.put<RoomSettingsResponse>(`/rooms/${room.roomCode}/settings`, {
        hideDrawnNumbers: newValue,
      })
    } catch {
      setHideDrawnNumbers(!newValue)
    }
  }

  const closeRoom = async () => {
    if (!room) return
    try {
      await api.post(`/rooms/${room.roomCode}/close`)
      stopConnection()
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đóng phòng')
    }
  }

  const joinUrl = room ? `${window.location.origin}/join/${room.roomCode}` : ''

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p style={{ color: 'var(--color-text-muted)' }}>Đang tạo phòng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
          Lô Tô Online
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={closeRoom}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-primary-text)' }}
          >
            Rời phòng
          </button>
        </div>
      </div>

      {room && (
        <div className="max-w-lg mx-auto">
          {/* KINH Message */}
          {kinhMessage && (
            <div
              className="rounded-xl p-4 mb-6 text-center font-bold text-lg"
              style={{
                backgroundColor: gameFinished ? 'var(--color-success)' : 'var(--color-error)',
                color: 'var(--color-primary-text)',
              }}
            >
              {kinhMessage}
            </div>
          )}

          {/* Room Code Card */}
          <div
            className="rounded-xl p-8 shadow-lg text-center mb-6"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Mã phòng
            </p>
            <p
              className="text-5xl md:text-7xl font-bold tracking-[0.3em] mb-4"
              style={{ color: 'var(--color-primary-500)', letterSpacing: '0.3em' }}
            >
              {room.roomCode}
            </p>
            <button
              onClick={copyCode}
              className="px-6 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: copied ? 'var(--color-success)' : 'var(--color-primary-500)',
                color: 'var(--color-primary-text)',
              }}
            >
              {copied ? 'Đã copy!' : 'Copy mã phòng'}
            </button>
          </div>

          {/* QR Code Card */}
          <div
            className="rounded-xl p-6 shadow-lg text-center mb-6"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Quét QR để vào phòng
            </p>
            <div className="inline-block p-4 bg-white rounded-xl">
              <QRCodeSVG value={joinUrl} size={180} />
            </div>
          </div>

          {/* Players List */}
          <div
            className="rounded-xl p-6 shadow-lg mb-6"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                Người chơi
              </h3>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {playerCount}/{room.maxPlayers}
              </span>
            </div>

            {players.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                Đang chờ người chơi vào phòng...
              </p>
            ) : (
              <ul className="space-y-2">
                {players.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: player.isConnected
                            ? 'var(--color-success)'
                            : 'var(--color-text-muted)',
                        }}
                      />
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        {player.nickname}
                      </span>
                    </div>
                    <button
                      onClick={() => kickPlayer(player.id, player.nickname)}
                      className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-primary-text)' }}
                    >
                      Kick
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Start Game Button */}
          {!gameStarted && (
            <button
              onClick={startGame}
              disabled={playerCount === 0 || starting}
              className="w-full py-4 rounded-xl font-bold text-lg mb-6 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-primary-text)' }}
            >
              {starting ? 'Đang bắt đầu...' : 'Bắt đầu game'}
            </button>
          )}

          {gameStarted && (
            <div className="space-y-6 mb-6">
              {/* Current Number Display */}
              <div
                className="rounded-xl p-8 shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '2px solid var(--color-primary-500)',
                }}
              >
                {currentNumber !== null ? (
                  <>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Số thứ {drawOrder}/90
                    </p>
                    <p
                      className="text-7xl md:text-9xl font-bold"
                      style={{ color: 'var(--color-primary-500)' }}
                    >
                      {currentNumber}
                    </p>
                  </>
                ) : (
                  <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
                    Bấm "Bốc số" để bắt đầu
                  </p>
                )}
              </div>

              {/* Draw Button */}
              <button
                onClick={drawNumber}
                disabled={drawing || drawOrder >= 90 || gameFinished || autoDrawEnabled}
                className="w-full py-4 rounded-xl font-bold text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-primary-text)' }}
              >
                {autoDrawEnabled
                  ? `Đang tự động bốc (${autoDrawInterval}s)...`
                  : drawing
                    ? 'Đang bốc...'
                    : gameFinished
                      ? 'Game kết thúc!'
                      : drawOrder >= 90
                        ? 'Đã bốc hết!'
                        : 'Bốc số'}
              </button>

              {/* Game Settings */}
              {!gameFinished && (
                <div
                  className="rounded-xl p-4 shadow-lg space-y-4"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Auto-draw toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                          Bốc số tự động
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoDrawEnabled(!autoDrawEnabled)}
                        className="relative w-11 h-6 rounded-full transition-colors"
                        style={{
                          backgroundColor: autoDrawEnabled ? 'var(--color-primary-500)' : 'var(--color-border)',
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                          style={{ left: autoDrawEnabled ? '22px' : '2px' }}
                        />
                      </button>
                    </div>
                    {autoDrawEnabled && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          {[3, 5, 7, 10].map((sec) => (
                            <button
                              key={sec}
                              onClick={() => setAutoDrawInterval(sec)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={{
                                backgroundColor: autoDrawInterval === sec ? 'var(--color-primary-500)' : 'var(--color-bg)',
                                color: autoDrawInterval === sec ? 'white' : 'var(--color-text-muted)',
                                border: `1px solid ${autoDrawInterval === sec ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                              }}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                        {autoDrawPaused && (
                          <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
                            Tạm dừng... (KINH đang kiểm tra)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--color-border)' }} />

                  {/* Hide drawn numbers toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                          Ẩn số trên vé
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Người chơi phải tự tìm số
                        </p>
                      </div>
                      <button
                        onClick={toggleHideDrawnNumbers}
                        className="relative w-11 h-6 rounded-full transition-colors"
                        style={{
                          backgroundColor: hideDrawnNumbers ? 'var(--color-primary-500)' : 'var(--color-border)',
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                          style={{ left: hideDrawnNumbers ? '22px' : '2px' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* End Game Button */}
              {!gameFinished && (
                <button
                  onClick={endGame}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)',
                  }}
                >
                  Kết thúc game
                </button>
              )}

              {gameFinished && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 rounded-xl font-medium"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Quay lại dashboard
                </button>
              )}

              {/* Drawn Numbers Grid */}
              {drawnNumbers.length > 0 && (
                <div
                  className="rounded-xl p-4 shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    Đã bốc ({drawnNumbers.length}/90)
                  </p>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
                      const isDrawn = drawnNumbers.includes(num)
                      const isCurrent = num === currentNumber
                      return (
                        <div
                          key={num}
                          className="aspect-square flex items-center justify-center rounded text-xs font-bold"
                          style={{
                            backgroundColor: isCurrent
                              ? 'var(--color-primary-500)'
                              : isDrawn
                                ? 'var(--color-success)'
                                : 'var(--color-bg)',
                            color: isCurrent || isDrawn ? 'white' : 'var(--color-text-muted)',
                            border: `1px solid ${isDrawn ? 'transparent' : 'var(--color-border)'}`,
                          }}
                        >
                          {num}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Player count */}
              <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {playerCount} người chơi đang chơi
              </p>
            </div>
          )}

          {/* Status */}
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Trạng thái: {room.status === 'waiting' ? 'Đang chờ' : room.status}
              {' | '}
              Tối đa: {room.maxPlayers} người chơi
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
