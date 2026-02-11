// TTS Service - Đọc số lô tô bằng tiếng Việt
// Sử dụng Web Speech API (SpeechSynthesis)

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

let viVoice: SpeechSynthesisVoice | null = null
let voiceLoaded = false

function findVietnameseVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = speechSynthesis.getVoices()
  // Ưu tiên vi-VN voice
  return (
    voices.find((v) => v.lang === 'vi-VN') ??
    voices.find((v) => v.lang.startsWith('vi')) ??
    null
  )
}

// Load voices (async trên một số browser)
export function initTts(): void {
  if (!('speechSynthesis' in window)) return
  const tryLoad = () => {
    viVoice = findVietnameseVoice()
    voiceLoaded = true
  }
  tryLoad()
  if (!voiceLoaded || !viVoice) {
    speechSynthesis.addEventListener('voiceschanged', tryLoad, { once: true })
  }
}

// Đọc số
export function speakNumber(n: number): void {
  if (!('speechSynthesis' in window)) return

  // Cancel câu trước nếu đang nói
  speechSynthesis.cancel()

  const text = `số ${numberToVietnamese(n)}`
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'vi-VN'
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 1.0

  if (viVoice) {
    utterance.voice = viVoice
  }

  speechSynthesis.speak(utterance)
}

// Kiểm tra browser có hỗ trợ TTS không
export function isTtsAvailable(): boolean {
  return 'speechSynthesis' in window
}
