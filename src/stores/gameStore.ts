import { create } from 'zustand'

interface GameState {
  roomCode: string | null
  status: 'idle' | 'waiting' | 'playing' | 'finished'
  drawnNumbers: number[]
  currentNumber: number | null
  markedNumbers: number[]
  ticket: {
    id: string
    grid: { rows: (number | null)[][] }
  } | null
  players: { id: string; nickname: string }[]
  winner: { nickname: string; rowIndex: number } | null
  setRoomCode: (code: string) => void
  setStatus: (status: GameState['status']) => void
  addDrawnNumber: (num: number) => void
  toggleMark: (num: number) => void
  setTicket: (ticket: GameState['ticket']) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: null,
  status: 'idle',
  drawnNumbers: [],
  currentNumber: null,
  markedNumbers: [],
  ticket: null,
  players: [],
  winner: null,
  setRoomCode: (code) => set({ roomCode: code }),
  setStatus: (status) => set({ status }),
  addDrawnNumber: (num) =>
    set((state) => ({
      drawnNumbers: [...state.drawnNumbers, num],
      currentNumber: num,
    })),
  toggleMark: (num) =>
    set((state) => ({
      markedNumbers: state.markedNumbers.includes(num)
        ? state.markedNumbers.filter((n) => n !== num)
        : [...state.markedNumbers, num],
    })),
  setTicket: (ticket) => set({ ticket }),
  reset: () =>
    set({
      roomCode: null,
      status: 'idle',
      drawnNumbers: [],
      currentNumber: null,
      markedNumbers: [],
      ticket: null,
      players: [],
      winner: null,
    }),
}))
