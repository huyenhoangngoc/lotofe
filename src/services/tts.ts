// TTS Service - Đọc số lô tô bằng tiếng Việt
// Sử dụng Edge TTS Universal (Microsoft Edge TTS via WebSocket)
// Hoạt động trên cả PC và mobile browser

import { EdgeTTS } from 'edge-tts-universal/browser'

const vietnameseDigits: Record<number, string> = {
  0: 'không',
  1: 'một',
  2: 'hai',
  3: 'ba',
  4: 'bốn',
  5: 'năm',
  6: 'sáu',
  7: 'bảy',
  8: 'tám',
  9: 'chín',
}

// Chuyển số 1-90 thành text tiếng Việt kiểu lô tô
export function numberToVietnamese(n: number): string {
  if (n < 1 || n > 90) return String(n)

  if (n <= 9) return vietnameseDigits[n]
  if (n === 10) return 'mười'
  if (n < 20) {
    if (n === 15) return 'mười lăm'
    return `mười ${vietnameseDigits[n % 10]}`
  }
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (ones === 0) return `${vietnameseDigits[tens]} mươi`
  if (ones === 1) return `${vietnameseDigits[tens]} mươi mốt`
  if (ones === 5) return `${vietnameseDigits[tens]} mươi lăm`
  return `${vietnameseDigits[tens]} mươi ${vietnameseDigits[ones]}`
}

// Voice tiếng Việt của Microsoft Edge
const VI_VOICE = 'vi-VN-HoaiMyNeural'

// Cache audio URL đang dùng để revoke sau
let currentAudioUrl: string | null = null
let currentAudio: HTMLAudioElement | null = null

// Không cần initTts nữa - Edge TTS không cần load voices
export function initTts(): void {
  // No-op, giữ lại cho backward compat
}

// Đọc số bằng Edge TTS
export async function speakNumber(n: number): Promise<void> {
  // Dừng audio trước nếu đang phát
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
    currentAudioUrl = null
  }

  const text = `số ${numberToVietnamese(n)}`

  try {
    const tts = new EdgeTTS(text, VI_VOICE, {
      rate: '-10%',
      volume: '+0%',
      pitch: '+0Hz',
    })

    const result = await tts.synthesize()

    currentAudioUrl = URL.createObjectURL(result.audio)
    currentAudio = new Audio(currentAudioUrl)
    currentAudio.onended = () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl)
        currentAudioUrl = null
      }
      currentAudio = null
    }
    await currentAudio.play()
  } catch (err) {
    console.warn('Edge TTS failed, trying Web Speech API fallback:', err)
    speakNumberFallback(n)
  }
}

// Fallback: Web Speech API (cho trường hợp Edge TTS bị lỗi)
function speakNumberFallback(n: number): void {
  if (!('speechSynthesis' in window)) return

  speechSynthesis.cancel()

  const text = `số ${numberToVietnamese(n)}`
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'vi-VN'
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 1.0

  const voices = speechSynthesis.getVoices()
  const viVoice =
    voices.find((v) => v.lang === 'vi-VN') ??
    voices.find((v) => v.lang.startsWith('vi'))
  if (viVoice) utterance.voice = viVoice

  speechSynthesis.speak(utterance)
}

// Kiểm tra TTS có sẵn không - luôn true vì Edge TTS dùng WebSocket
export function isTtsAvailable(): boolean {
  return true
}
