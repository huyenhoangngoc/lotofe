import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../services/auth'

export function GoogleLoginButton() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return

    try {
      const result = await authApi.googleLogin(credentialResponse.credential)
      setAuth(result.user, result.token, result.refreshToken)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.error('Google Login failed')}
      text="signin_with"
      shape="rectangular"
      size="large"
      width="300"
    />
  )
}
