import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { api } from '../services/api'
import { ThemeToggle } from '../components/ui/ThemeToggle'

interface RoomInfo {
  roomCode: string
  status: string
  hostName: string
  playerCount: number
  maxPlayers: number
}

interface JoinResult {
  playerId: string
  sessionToken: string
  roomCode: string
  nickname: string
}

export function JoinRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  const checkRoom = async () => {
    if (!roomCode) return
    setLoading(true)
    setError(null)
    try {
      const info = await api.get<RoomInfo>(`/rooms/${roomCode}`)
      setRoomInfo(info)
      setChecked(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phòng không tồn tại')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!roomCode || !nickname.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.post<JoinResult>(`/rooms/${roomCode}/join`, {
        nickname: nickname.trim(),
      })
      // Store player session
      localStorage.setItem('playerSession', JSON.stringify(result))
      navigate(`/play/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể vào phòng')
    } finally {
      setLoading(false)
    }
  }

  // Auto-check room on mount
  useEffect(() => {
    if (roomCode) checkRoom()
  }, [roomCode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-8">
        <h1
          className="text-3xl md:text-5xl font-bold mb-2"
          style={{ color: 'var(--color-primary-500)' }}
        >
          Lô Tô Online
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          Mã phòng: <span className="font-bold tracking-widest">{roomCode}</span>
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm text-center"
            style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
          >
            {error}
          </div>
        )}

        {error && !roomInfo && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => checkRoom()}
              className="flex-1 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--color-primary-500)', color: 'white' }}
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              Nhập mã khác
            </button>
          </div>
        )}

        {roomInfo && (
          <div className="mb-4 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Quản trò: <span className="font-medium">{roomInfo.hostName}</span>
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {roomInfo.playerCount}/{roomInfo.maxPlayers} người chơi
            </p>
          </div>
        )}

        {roomInfo && roomInfo.status === 'waiting' && (
          <>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-light)' }}
            >
              Nhập nickname của bạn
            </label>
            <input
              type="text"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="VD: Nguyen Van A"
              className="w-full p-3 rounded-lg outline-none text-lg mb-4"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '2px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={!nickname.trim() || loading}
              className="w-full py-3 rounded-lg text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              {loading ? 'Đang vào...' : 'Vào phòng'}
            </button>
          </>
        )}

        {!roomInfo && !error && (
          <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
            Đang kiểm tra phòng...
          </p>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 py-2 text-sm font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  )
}
