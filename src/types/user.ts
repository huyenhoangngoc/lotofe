export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: 'admin' | 'host'
  isPremium: boolean
  premiumExpiresAt: string | null
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}
