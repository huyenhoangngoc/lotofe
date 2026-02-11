import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { GoogleLoginButton } from '../components/ui/GoogleLoginButton'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function HomePage() {
  const [roomCode, setRoomCode] = useState('')
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  const handleJoin = () => {
    if (roomCode.length === 6) {
      navigate(`/join/${roomCode}`)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-12">
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{ color: 'var(--color-primary-500)' }}
        >
          Lô Tô Online
        </h1>
        <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-light)' }}>
          Trò chơi lô tô truyền thống Việt Nam
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Join Room */}
        <div
          className="rounded-xl p-6 shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-light)' }}
          >
            Nhập mã phòng
          </label>
          <input
            type="text"
            maxLength={6}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] font-bold p-4 rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '2px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <button
            onClick={handleJoin}
            disabled={roomCode.length !== 6}
            className="w-full mt-4 py-3 rounded-lg text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary-500)' }}
          >
            Vào phòng
          </button>
        </div>

        {/* Host Login */}
        <div
          className="rounded-xl p-6 shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-sm mb-4 text-center" style={{ color: 'var(--color-text-light)' }}>
            Bạn là quản trò?
          </p>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--color-secondary-500)',
                color: 'white',
              }}
            >
              Vào Dashboard
            </button>
          ) : (
            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
