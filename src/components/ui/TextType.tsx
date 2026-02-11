import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface TextTypeProps {
  text: string | string[]
  typingSpeed?: number
  pauseDuration?: number
  deletingSpeed?: number
  loop?: boolean
  className?: string
  showCursor?: boolean
  cursorCharacter?: string
  cursorBlinkDuration?: number
}

export function TextType({
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  deletingSpeed = 50,
  loop = true,
  className = '',
  showCursor = true,
  cursorCharacter = '_',
  cursorBlinkDuration = 0.5,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'done'>('typing')
  const [charIndex, setCharIndex] = useState(0)
  const [textIndex, setTextIndex] = useState(0)

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text])

  useEffect(() => {
    const currentText = textArray[textIndex]

    if (phase === 'typing') {
      if (charIndex < currentText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentText.slice(0, charIndex + 1))
          setCharIndex((i) => i + 1)
        }, typingSpeed)
        return () => clearTimeout(timeout)
      }
      if (textArray.length === 1 && !loop) {
        setPhase('done')
        return
      }
      setPhase('pausing')
    }

    if (phase === 'pausing') {
      const timeout = setTimeout(() => {
        setPhase('deleting')
      }, pauseDuration)
      return () => clearTimeout(timeout)
    }

    if (phase === 'deleting') {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev.slice(0, -1))
        }, deletingSpeed)
        return () => clearTimeout(timeout)
      }
      const nextIndex = (textIndex + 1) % textArray.length
      if (!loop && nextIndex === 0) {
        setPhase('done')
        return
      }
      setTextIndex(nextIndex)
      setCharIndex(0)
      setPhase('typing')
    }
  }, [phase, charIndex, displayedText, textIndex, textArray, typingSpeed, deletingSpeed, pauseDuration, loop])

  return (
    <span className={`inline-block whitespace-pre-wrap ${className}`}>
      <span>{displayedText}</span>
      {showCursor && phase !== 'done' && (
        <motion.span
          className="inline-block ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: cursorBlinkDuration,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          {cursorCharacter}
        </motion.span>
      )}
    </span>
  )
}
