import { api } from './api'

interface AuthResponse {
  token: string
  refreshToken: string
  user: {
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
}

interface AcceptTermsResponse {
  acceptedAt: string
  termsVersion: string
}

export const authApi = {
  googleLogin: (idToken: string) =>
    api.post<AuthResponse>('/auth/google', { idToken }),

  refreshToken: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  getMe: () => api.get<AuthResponse['user']>('/users/me'),

  acceptTerms: (termsVersion: string) =>
    api.post<AcceptTermsResponse>('/users/me/accept-terms', { termsVersion }),
}
