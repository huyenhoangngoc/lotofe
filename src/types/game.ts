export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string
  role: 'admin' | 'host'
  isPremium: boolean
  premiumExpiresAt?: string
}

export interface Room {
  id: string
  roomCode: string
  status: 'waiting' | 'playing' | 'finished'
  hostName: string
  playerCount: number
  maxPlayers: number
}

export interface Player {
  id: string
  nickname: string
  isConnected: boolean
}

export interface Ticket {
  id: string
  grid: {
    rows: (number | null)[][]
  }
  markedNumbers: number[]
}

export interface GameSession {
  id: string
  roomId: string
  startedAt: string
  endedAt?: string
  winnerNickname?: string
  totalNumbersDrawn: number
}

export interface DrawResult {
  number: number
  drawOrder: number
  audioUrl: string
  remainingNumbers: number
  drawnNumbers: number[]
}

export interface KinhResult {
  valid: boolean
  nickname?: string
  rowIndex?: number
  message: string
}
