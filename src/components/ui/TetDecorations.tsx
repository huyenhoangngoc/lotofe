import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/themeStore'

// SVG cánh hoa mai - hình giọt nước mềm mại
function MaiPetal({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path
        d="M12 2C12 2 6 8 6 14c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-6-12-6-12z"
        fill={color}
      />
    </svg>
  )
}

// Chấm sáng bokeh nhỏ
function Sparkle({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ opacity }}>
      <circle cx="6" cy="6" r="3" fill={color} />
      <circle cx="6" cy="6" r="6" fill={color} opacity="0.2" />
    </svg>
  )
}

interface Particle {
  id: number
  type: 'petal' | 'sparkle'
  x: number
  size: number
  delay: number
  duration: number
  drift: number
  rotation: number
  opacity: number
}

function generateParticles(): Particle[] {
  const particles: Particle[] = []
  // 10 cánh hoa mai
  for (let i = 0; i < 10; i++) {
    particles.push({
      id: i,
      type: 'petal',
      x: Math.random() * 100,
      size: 12 + Math.random() * 14,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 120,
      rotation: Math.random() * 360,
      opacity: 0.3 + Math.random() * 0.35,
    })
  }
  // 8 chấm sáng bokeh
  for (let i = 0; i < 8; i++) {
    particles.push({
      id: 100 + i,
      type: 'sparkle',
      x: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 14,
      duration: 8 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 60,
      rotation: 0,
      opacity: 0.15 + Math.random() * 0.3,
    })
  }
  return particles
}

export function TetDecorations() {
  const theme = useThemeStore((s) => s.theme)
  const particles = useMemo(() => generateParticles(), [])

  if (theme !== 'tet') return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: -30 }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, p.drift * 0.4, p.drift, p.drift * 0.6],
            rotate: [p.rotation, p.rotation + (p.type === 'petal' ? 180 + Math.random() * 180 : 0)],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: {
              duration: p.duration,
              times: [0, 0.1, 0.85, 1],
              ease: 'easeInOut',
            },
          }}
        >
          {p.type === 'petal' ? (
            <MaiPetal size={p.size} color="#FFD700" opacity={1} />
          ) : (
            <Sparkle size={p.size} color="#FFE4B5" opacity={1} />
          )}
        </motion.div>
      ))}
    </div>
  )
}
