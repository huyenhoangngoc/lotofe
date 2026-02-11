import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/themeStore'

// SVG cánh hoa mai - có glow filter
function MaiPetal({ size, glow }: { size: number; glow: string }) {
  const id = useMemo(() => `glow-${Math.random().toString(36).slice(2, 7)}`, [])
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={glow === 'strong' ? 2 : 1} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M12 2C12 2 6 8 6 14c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-6-12-6-12z"
        fill="#FFD700"
        filter={`url(#${id})`}
      />
    </svg>
  )
}

// Chấm sáng bokeh - glow mạnh hơn
function Sparkle({ size }: { size: number }) {
  const id = useMemo(() => `sp-${Math.random().toString(36).slice(2, 7)}`, [])
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#FFE4B5" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="8" fill={`url(#${id})`} />
      <circle cx="8" cy="8" r="2" fill="#FFF8DC" opacity="0.8" />
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
  pulseSpeed: number
}

function generateParticles(): Particle[] {
  const particles: Particle[] = []
  // 22 cánh hoa mai - nhiều hơn, rải đều
  for (let i = 0; i < 22; i++) {
    particles.push({
      id: i,
      type: 'petal',
      x: (i / 22) * 100 + (Math.random() - 0.5) * 15,
      size: 10 + Math.random() * 16,
      delay: (i / 22) * 14 + Math.random() * 3,
      duration: 12 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 140,
      rotation: Math.random() * 360,
      opacity: 0.35 + Math.random() * 0.4,
      pulseSpeed: 1.5 + Math.random() * 2,
    })
  }
  // 14 chấm sáng bokeh
  for (let i = 0; i < 14; i++) {
    particles.push({
      id: 100 + i,
      type: 'sparkle',
      x: Math.random() * 100,
      size: 6 + Math.random() * 14,
      delay: Math.random() * 16,
      duration: 10 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 80,
      rotation: 0,
      opacity: 0.2 + Math.random() * 0.4,
      pulseSpeed: 1 + Math.random() * 1.5,
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
            x: [0, p.drift * 0.3, p.drift * 0.8, p.drift, p.drift * 0.5],
            rotate: [p.rotation, p.rotation + (p.type === 'petal' ? 200 + Math.random() * 200 : 0)],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Lớp nhấp nháy glow - pulse opacity tạo hiệu ứng heat */}
          <motion.div
            animate={{
              opacity: [0, p.opacity, p.opacity * 0.4, p.opacity, p.opacity * 0.5, p.opacity, 0],
              scale: p.type === 'petal'
                ? [0.8, 1, 1.15, 0.95, 1.1, 1, 0.8]
                : [0.6, 1.2, 0.7, 1.3, 0.8, 1.1, 0.5],
            }}
            transition={{
              duration: p.duration,
              times: [0, 0.08, 0.25, 0.45, 0.65, 0.85, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              delay: p.delay,
            }}
          >
            {p.type === 'petal' ? (
              <MaiPetal size={p.size} glow={p.size > 18 ? 'strong' : 'soft'} />
            ) : (
              <Sparkle size={p.size} />
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
