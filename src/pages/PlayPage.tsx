import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { api } from '../services/api'
import { createConnection, getConnection, startConnection, stopConnection } from '../services/signalr'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { initTts, speakNumber } from '../services/tts'

interface PlayerSession {
  playerId: string
  sessionToken: string
  roomCode: string
  nickname: string
}

interface TicketData {
  id: string
  rows: (number | null)[][]
  markedNumbers: number[]
}

interface KinhResult {
  valid: boolean
  nickname: string
  rowIndex: number
  message: string
}

const TICKET_COLORS = [
  { bg: '#b91c1c', light: 'rgba(251, 113, 133, 0.25)' }, // đỏ
  { bg: '#1d4ed8', light: 'rgba(147, 197, 253, 0.3)' },  // xanh dương
  { bg: '#15803d', light: 'rgba(134, 239, 172, 0.3)' },   // xanh lá
  { bg: '#7e22ce', light: 'rgba(216, 180, 254, 0.3)' },   // tím
  { bg: '#c2410c', light: 'rgba(253, 186, 116, 0.3)' },   // cam
]

export function PlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [connected, setConnected] = useState(false)
  const [kicked, setKicked] = useState(false)
  const [playerCount, setPlayerCount] = useState(0)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [drawOrder, setDrawOrder] = useState(0)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set())
  const [kinhMessage, setKinhMessage] = useState<string | null>(null)
  const [gameFinished, setGameFinished] = useState(false)
  const [claimingKinh, setClaimingKinh] = useState(false)
  const [hideDrawnNumbers, setHideDrawnNumbers] = useState(false)
  const ttsInitialized = useRef(false)

  // Random màu vé khi mount
  const ticketColor = useMemo(() => TICKET_COLORS[Math.floor(Math.random() * TICKET_COLORS.length)], [])

  // Khởi tạo TTS
  useEffect(() => {
    if (!ttsInitialized.current) {
      initTts()
      ttsInitialized.current = true
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('playerSession')
    if (!stored) {
      navigate(`/join/${roomCode}`)
      return
    }

    const parsed: PlayerSession = JSON.parse(stored)
    if (parsed.roomCode !== roomCode) {
      navigate(`/join/${roomCode}`)
      return
    }

    setSession(parsed)
  }, [roomCode, navigate])

  useEffect(() => {
    if (!session || !roomCode) return

    let mounted = true

    const connect = async () => {
      try {
        const conn = await createConnection()

        conn.on('PlayerJoined', (_nickname: string, count: number) => {
          if (mounted) setPlayerCount(count)
        })

        conn.on('PlayerLeft', (_nickname: string, count: number) => {
          if (mounted) setPlayerCount(count)
        })

        conn.on('Kicked', () => {
          if (mounted) {
            setKicked(true)
            localStorage.removeItem('playerSession')
          }
        })

        conn.on('GameStarted', (ticketData: TicketData) => {
          if (mounted) {
            setTicket(ticketData)
            setGameStarted(true)
          }
        })

        conn.on('GameStatusChanged', (status: string) => {
          if (mounted) {
            if (status === 'playing') setGameStarted(true)
            if (status === 'finished') setGameFinished(true)
          }
        })

        conn.on('NumberDrawn', (number: number, order: number) => {
          if (mounted) {
            setCurrentNumber(number)
            setDrawOrder(order)
            setDrawnNumbers((prev) => [...prev, number].sort((a, b) => a - b))
            speakNumber(number)
          }
        })

        conn.on('KinhResult', (_nickname: string, valid: boolean, _rowIndex: number, message: string) => {
          if (mounted) {
            setKinhMessage(`${valid ? 'KINH!' : ''} ${message}`)
            if (valid) setGameFinished(true)
            // Clear message after a delay for invalid claims
            if (!valid) {
              setTimeout(() => { if (mounted) setKinhMessage(null) }, 3000)
            }
          }
        })

        conn.on('RoomSettingsChanged', (hideDrawn: boolean) => {
          if (mounted) setHideDrawnNumbers(hideDrawn)
        })

        await startConnection()
        await conn.invoke('JoinRoom', roomCode, session.playerId)
        if (mounted) setConnected(true)

        // Fetch current room settings
        try {
          const settings = await api.get<{ hideDrawnNumbers: boolean }>(`/rooms/${roomCode}/settings`)
          if (mounted) setHideDrawnNumbers(settings.hideDrawnNumbers)
        } catch {
          // Settings fetch failed - use defaults
        }
      } catch {
        if (mounted) navigate(`/join/${roomCode}`)
      }
    }

    connect()

    return () => {
      mounted = false
      stopConnection()
    }
  }, [session, roomCode, navigate])

  const toggleMark = useCallback((num: number) => {
    if (!drawnNumbers.includes(num)) return // Chỉ mark số đã bốc
    setMarkedNumbers((prev) => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }, [drawnNumbers])

  // Tìm hàng đầu tiên đã hoàn thành (tất cả số đã mark)
  const findCompleteRow = useCallback((): number => {
    if (!ticket) return -1
    for (let i = 0; i < ticket.rows.length; i++) {
      const row = ticket.rows[i]
      const allMarked = row.every((num) => num === null || markedNumbers.has(num))
      if (allMarked) return i
    }
    return -1
  }, [ticket, markedNumbers])

  const hasCompleteRow = findCompleteRow() >= 0

  const claimKinh = async () => {
    if (!ticket || !roomCode || claimingKinh) return
    const rowIndex = findCompleteRow()
    if (rowIndex < 0) return
    setClaimingKinh(true)
    try {
      await api.post<KinhResult>(`/rooms/${roomCode}/kinh`, {
        ticketId: ticket.id,
        rowIndex,
      })
    } catch (err) {
      setKinhMessage(err instanceof Error ? err.message : 'Lỗi khi bấm KINH')
      setTimeout(() => setKinhMessage(null), 3000)
    } finally {
      setClaimingKinh(false)
    }
  }

  const handleLeave = async () => {
    try {
      const conn = getConnection()
      if (conn && roomCode) {
        await conn.invoke('LeaveRoom', roomCode)
      }
    } catch {
      // Ignore - connection might already be closed
    }
    localStorage.removeItem('playerSession')
    navigate('/')
  }

  if (kicked) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="text-lg font-bold" style={{ color: 'var(--color-error)' }}>
          Bạn đã bị kick khỏi phòng
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-medium"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          Quay lại trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
          Lô Tô Online
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLeave}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}
          >
            Rời phòng
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* KINH Message */}
        {kinhMessage && (
          <div
            className="rounded-xl p-4 mb-4 text-center font-bold"
            style={{
              backgroundColor: gameFinished ? 'var(--color-success)' : 'var(--color-error)',
              color: 'var(--color-primary-text)',
            }}
          >
            {kinhMessage}
          </div>
        )}

        {/* Room Info */}
        <div
          className="rounded-xl p-4 shadow-lg mb-4 text-center"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Phòng {roomCode}
            </span>
            <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              {session?.nickname}
            </span>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-text-muted)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {playerCount > 0 && `${playerCount}`}
              </span>
            </div>
          </div>
        </div>

        {/* Waiting State */}
        {!gameStarted && (
          <div
            className="rounded-xl p-8 shadow-lg text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
              Đang chờ quản trò bắt đầu game...
            </p>
          </div>
        )}

        {/* Game Active */}
        {gameStarted && ticket && (
          <div className="space-y-4">
            {/* Hide drawn numbers notice */}
            {hideDrawnNumbers && !gameFinished && (
              <div
                className="rounded-xl p-3 text-center text-sm font-medium"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, var(--color-bg-card))',
                  border: '1px solid var(--color-warning)',
                  color: 'var(--color-warning)',
                }}
              >
                Chế độ nghe số - Hãy lắng nghe và tự tìm số trên vé!
              </div>
            )}
            {/* Current Number */}
            {currentNumber !== null && (
              <div
                className="rounded-xl p-4 shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '2px solid var(--color-primary-500)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Số thứ {drawOrder}/90
                </p>
                <p className="text-5xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
                  {currentNumber}
                </p>
              </div>
            )}

            {/* Vé Lô Tô - Vietnamese Paper Style */}
            <div
              className="rounded-2xl shadow-2xl overflow-auto mx-auto"
              style={{
                backgroundColor: '#fffbf0',
                maxWidth: '420px',
                border: `3px solid ${ticketColor.bg}`,
              }}
            >
              {/* Ticket Header */}
              <div
                className="text-center py-2"
                style={{ backgroundColor: ticketColor.bg }}
              >
                <p className="text-white font-bold text-sm sm:text-base tracking-widest">
                  VÉ LÔ TÔ
                </p>
                <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Bấm số đã bốc để đóng dấu
                </p>
              </div>

              <div className="p-1.5 sm:p-2">
                {Array.from({ length: Math.ceil(ticket.rows.length / 3) }, (_, blockIdx) => {
                  const blockRows = ticket.rows.slice(blockIdx * 3, blockIdx * 3 + 3)
                  return (
                    <div key={blockIdx}>
                      {blockIdx > 0 && (
                        <div className="flex items-center gap-1.5 py-1">
                          <div className="flex-1 h-px" style={{ backgroundColor: ticketColor.bg }} />
                          <span
                            className="text-[9px] sm:text-[10px] font-semibold whitespace-nowrap"
                            style={{ color: ticketColor.bg }}
                          >
                            Lô Tô Online
                          </span>
                          <div className="flex-1 h-px" style={{ backgroundColor: ticketColor.bg }} />
                        </div>
                      )}
                      <div
                        className="grid grid-cols-9"
                        style={{ border: `1px solid ${ticketColor.bg}40` }}
                      >
                        {blockRows.flatMap((row, rowIdx) =>
                          row.map((num, colIdx) => {
                            const isActuallyDrawn = num !== null && drawnNumbers.includes(num)
                            const isDrawn = hideDrawnNumbers ? false : isActuallyDrawn
                            const isMarked = num !== null && markedNumbers.has(num)
                            const isCurrent = num !== null && num === currentNumber
                            const canClick = hideDrawnNumbers
                              ? (num !== null && !gameFinished)
                              : (num !== null && isActuallyDrawn && !gameFinished)
                            return (
                              <button
                                key={`${blockIdx}-${rowIdx}-${colIdx}`}
                                onClick={() => num !== null && canClick && toggleMark(num)}
                                disabled={!canClick}
                                className={[
                                  'flex items-center justify-center',
                                  'text-xs sm:text-sm md:text-base',
                                  'font-bold transition-all',
                                  canClick
                                    ? 'hover:scale-105 active:scale-95'
                                    : '',
                                  isCurrent && !isMarked ? 'animate-pulse' : '',
                                ].join(' ')}
                                style={{
                                  height: '56px',
                                  backgroundColor:
                                    num === null
                                      ? ticketColor.light
                                      : isMarked
                                        ? ticketColor.bg
                                        : isCurrent
                                          ? '#fde047'
                                          : isDrawn
                                            ? '#15803d'
                                            : '#ffffff',
                                  border: `1px solid ${ticketColor.bg}30`,
                                  color:
                                    num === null
                                      ? 'transparent'
                                      : isMarked || isDrawn
                                        ? 'white'
                                        : isCurrent
                                          ? '#92400e'
                                          : '#1e293b',
                                  cursor: canClick ? 'pointer' : 'default',
                                  boxShadow: isMarked
                                    ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                    : isCurrent
                                      ? '0 0 8px rgba(253, 224, 71, 0.8)'
                                      : num !== null
                                        ? '0 1px 2px rgba(0,0,0,0.08)'
                                        : 'none',
                                }}
                              >
                                {num}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nút KINH duy nhất */}
            {!gameFinished && (
              <button
                onClick={claimKinh}
                disabled={!hasCompleteRow || claimingKinh}
                className="w-full py-4 rounded-xl font-bold text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: hasCompleteRow ? 'var(--color-error)' : 'var(--color-bg-card)',
                  color: hasCompleteRow ? 'white' : 'var(--color-text-muted)',
                  border: hasCompleteRow ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {claimingKinh ? 'Đang kiểm tra...' : 'KINH!'}
              </button>
            )}

            {/* Game Finished */}
            {gameFinished && (
              <div
                className="rounded-xl p-6 shadow-lg text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-success)' }}
              >
                <p className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                  Game kết thúc!
                </p>
                <button
                  onClick={handleLeave}
                  className="mt-4 px-6 py-2 rounded-lg font-medium"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  Quay lại trang chủ
                </button>
              </div>
            )}

            {/* Drawn numbers count */}
            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Đã bốc {drawnNumbers.length}/90 số
            </p>
          </div>
        )}

        {gameStarted && !ticket && (
          <div
            className="rounded-xl p-8 shadow-lg text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ color: 'var(--color-text-muted)' }}>Đang tải vé...</p>
          </div>
        )}
      </div>
    </div>
  )
}
