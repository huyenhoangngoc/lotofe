import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../services/auth'
import { TermsAcceptanceModal } from './TermsAcceptanceModal'
import { TERMS_VERSION } from '../../content/legalContent'

export function GoogleLoginButton() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsLoading, setTermsLoading] = useState(false)
  const [pendingAuth, setPendingAuth] = useState<{
    user: Parameters<typeof setAuth>[0]
    token: string
    refreshToken: string
  } | null>(null)

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return

    try {
      const result = await authApi.googleLogin(credentialResponse.credential)
      setAuth(result.user, result.token, result.refreshToken)

      // Kiểm tra đã đồng ý điều khoản chưa
      if (!result.user.termsAcceptedAt || result.user.termsVersion !== TERMS_VERSION) {
        setPendingAuth({ user: result.user, token: result.token, refreshToken: result.refreshToken })
        setShowTermsModal(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleAcceptTerms = async () => {
    if (!pendingAuth) return
    setTermsLoading(true)
    try {
      const result = await authApi.acceptTerms(TERMS_VERSION)
      const updatedUser = {
        ...pendingAuth.user,
        termsAcceptedAt: result.acceptedAt,
        termsVersion: result.termsVersion,
      }
      setAuth(updatedUser, pendingAuth.token, pendingAuth.refreshToken)
      setShowTermsModal(false)
      setPendingAuth(null)
      navigate('/dashboard')
    } catch (err) {
      console.error('Accept terms failed:', err)
    } finally {
      setTermsLoading(false)
    }
  }

  const handleDeclineTerms = () => {
    setShowTermsModal(false)
    setPendingAuth(null)
    useAuthStore.getState().logout()
  }

  return (
    <>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google Login failed')}
        text="signin_with"
        shape="rectangular"
        size="large"
        width="300"
      />
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        loading={termsLoading}
      />
    </>
  )
}
