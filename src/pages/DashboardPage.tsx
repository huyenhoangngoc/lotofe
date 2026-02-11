import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { api } from '../services/api'

interface ActiveRoom {
  id: string
  roomCode: string
  status: string
  maxPlayers: number
  createdAt: string
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    const checkActiveRoom = async () => {
      try {
        const room = await api.get<ActiveRoom>('/rooms/my-active')
        if (mounted) setActiveRoom(room)
      } catch {
        // 204 hoặc lỗi → không có phòng active
      } finally {
        if (mounted) setChecking(false)
      }
    }
    checkActiveRoom()
    return () => { mounted = false }
  }, [])

  const closeRoom = async () => {
    if (!activeRoom) return
    try {
      await api.post(`/rooms/${activeRoom.roomCode}/close`)
      setActiveRoom(null)
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
          Lo To Online
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-10 h-10 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              {user.displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {user.isPremium
                ? `Premium${user.premiumExpiresAt ? ` - HH: ${new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')}` : ''}`
                : 'Free'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-light)',
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Create Room Card */}
      <div
        className="max-w-md mx-auto rounded-xl p-8 text-center shadow-lg"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Chào mừng, {user.displayName}!
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {user.isPremium
            ? <>
                Bạn có thể tạo phòng với tối đa 60 người chơi
                {user.premiumExpiresAt && (
                  <span className="block text-xs mt-1">
                    Hết hạn: {new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' '}({Math.max(0, Math.ceil((new Date(user.premiumExpiresAt).getTime() - Date.now()) / 86400000))} ngày còn lại)
                  </span>
                )}
              </>
            : 'Bạn có thể tạo phòng với tối đa 5 người chơi'}
        </p>

        {checking ? (
          <p className="py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Đang kiểm tra...
          </p>
        ) : activeRoom ? (
          <>
            <div
              className="rounded-lg p-4 mb-4"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-primary-500)' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Phòng đang hoạt động
              </p>
              <p
                className="text-3xl font-bold tracking-[0.2em]"
                style={{ color: 'var(--color-primary-500)' }}
              >
                {activeRoom.roomCode}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Trạng thái: {activeRoom.status === 'waiting' ? 'Đang chờ' : activeRoom.status === 'playing' ? 'Đang chơi' : activeRoom.status}
              </p>
            </div>
            <button
              onClick={() => navigate('/room/host')}
              className="w-full py-4 rounded-lg text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              Vào phòng {activeRoom.roomCode}
            </button>
            <button
              onClick={closeRoom}
              className="w-full py-3 mt-2 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
              }}
            >
              Đóng phòng
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/room/host')}
            className="w-full py-4 rounded-lg text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary-500)' }}
          >
            Tạo phòng mới
          </button>
        )}

        {!user.isPremium && (
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-3 mt-3 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95 text-white"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            Nâng cấp Premium (60 người chơi)
          </button>
        )}

        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-3 mt-3 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            Quản lý hệ thống
          </button>
        )}
      </div>
    </div>
  )
}
