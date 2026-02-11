export interface Room {
  id: string
  roomCode: string
  status: 'waiting' | 'playing' | 'finished'
  hostName: string
  playerCount: number
  maxPlayers: number
  createdAt: string
}

export interface Player {
  id: string
  nickname: string
  isConnected: boolean
}
