import { useState } from 'react'
import { useNavigate } from 'react-router'
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { GoogleLoginButton } from '../components/ui/GoogleLoginButton'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { TextType } from '../components/ui/TextType'
import { FaultyTerminal } from '../components/ui/FaultyTerminal'

const terminalConfig = {
  light: { bgColor: '#FFF8F0', tint: '#E8D5C4', brightness: 0.6, noiseAmp: 0.6 },
  dark: { bgColor: '#0F0F1A', tint: '#2E2E48', brightness: 0.8, noiseAmp: 1 },
  tet: { bgColor: '#8B0000', tint: '#CC3333', brightness: 0.5, noiseAmp: 0.8 },
} as const

export function HomePage() {
  const [roomCode, setRoomCode] = useState('')
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useThemeStore((s) => s.theme)
  const navigate = useNavigate()

  const config = terminalConfig[theme]

  const handleJoin = () => {
    if (roomCode.length === 6) {
      navigate(`/join/${roomCode}`)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Terminal background */}
      <div className="absolute inset-0">
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={config.noiseAmp}
          curvature={0.1}
          bgColor={config.bgColor}
          tint={config.tint}
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={config.brightness}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="text-center mb-12">
          <h1
            className="text-5xl md:text-7xl font-bold mb-4 min-h-[1.2em] drop-shadow-lg"
            style={{ color: 'var(--color-title)' }}
          >
            <TextType
              text={['Lô Tô Online', 'Chơi ngay thôi!', 'Bốc số đê!']}
              typingSpeed={75}
              pauseDuration={1500}
              deletingSpeed={50}
              showCursor
              cursorCharacter="_"
            />
          </h1>
          <p
            className="text-lg md:text-xl drop-shadow-md"
            style={{ color: 'var(--color-text-light)' }}
          >
            Trò chơi lô tô truyền thống Việt Nam
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Join Room */}
          <div
            className="rounded-xl p-6 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 85%, transparent)',
              border: '1px solid var(--color-border)',
            }}
          >
            <label
              className="block text-sm font-medium mb-3 text-center"
              style={{ color: 'var(--color-text-light)' }}
            >
              Nhập mã phòng
            </label>
            <OTPInput
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={roomCode}
              onChange={setRoomCode}
              onComplete={handleJoin}
              containerClassName="flex items-center justify-center gap-2"
              render={({ slots }) => (
                <>
                  <div className="flex gap-1.5">
                    {slots.slice(0, 3).map((slot, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg)',
                          border: slot.isActive
                            ? '2px solid var(--color-primary-500)'
                            : '2px solid var(--color-border)',
                          color: 'var(--color-text)',
                          boxShadow: slot.isActive
                            ? '0 0 8px color-mix(in srgb, var(--color-primary-500) 40%, transparent)'
                            : 'none',
                        }}
                      >
                        {slot.char}
                        {slot.hasFakeCaret && (
                          <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-pulse">
                            <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary-500)' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="w-4 flex justify-center">
                    <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />
                  </div>
                  <div className="flex gap-1.5">
                    {slots.slice(3).map((slot, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg)',
                          border: slot.isActive
                            ? '2px solid var(--color-primary-500)'
                            : '2px solid var(--color-border)',
                          color: 'var(--color-text)',
                          boxShadow: slot.isActive
                            ? '0 0 8px color-mix(in srgb, var(--color-primary-500) 40%, transparent)'
                            : 'none',
                        }}
                      >
                        {slot.char}
                        {slot.hasFakeCaret && (
                          <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-pulse">
                            <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary-500)' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
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
            className="rounded-xl p-6 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 85%, transparent)',
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
    </div>
  )
}
