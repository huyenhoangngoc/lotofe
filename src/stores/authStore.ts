import { create } from 'zustand'

interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string
  role: string
  isPremium: boolean
  premiumExpiresAt: string | null
  termsAcceptedAt: string | null
  termsVersion: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  logout: () => void
  loadFromStorage: () => void
}

// Load đồng bộ từ localStorage khi khởi tạo store
function loadInitialState() {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  const userJson = localStorage.getItem('user')
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson) as User
      return { user, token, refreshToken, isAuthenticated: true }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }
  return { user: null, token: null, refreshToken: null, isAuthenticated: false }
}

const initial = loadInitialState()

export const useAuthStore = create<AuthState>((set) => ({
  ...initial,
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, refreshToken, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },
  loadFromStorage: () => {
    const state = loadInitialState()
    set(state)
  },
}))
