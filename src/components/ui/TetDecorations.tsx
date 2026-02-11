import { useThemeStore } from '../../stores/themeStore'

export function TetDecorations() {
  const theme = useThemeStore((s) => s.theme)

  if (theme !== 'tet') return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="absolute animate-falling-petal"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            fontSize: `${14 + Math.random() * 10}px`,
            opacity: 0.7 + Math.random() * 0.3,
          }}
        >
          {i % 3 === 0 ? '🌸' : i % 3 === 1 ? '🏮' : '✨'}
        </div>
      ))}
    </div>
  )
}
