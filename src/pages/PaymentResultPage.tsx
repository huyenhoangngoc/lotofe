import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/auth'

interface PaymentStatus {
  orderId: string
  status: string
  amount: number
  planType: string
}

export function PaymentResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying')
  const [message, setMessage] = useState('Đang xác nhận thanh toán...')

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const resultCode = searchParams.get('resultCode')

    if (!orderId) {
      setStatus('failed')
      setMessage('Không tìm thấy thông tin thanh toán')
      return
    }

    // MoMo redirect kèm resultCode - nếu != 0 thì fail ngay
    if (resultCode && resultCode !== '0') {
      setStatus('failed')
      setMessage('Thanh toán không thành công')
      return
    }

    // Gọi verify endpoint
    const verify = async () => {
      try {
        const result = await api.post<PaymentStatus>(`/payment/verify/${orderId}`)

        if (result.status === 'completed') {
          setStatus('success')
          setMessage('Nâng cấp Premium thành công!')

          // Refresh user data
          try {
            const me = await authApi.getMe()
            if (token && refreshToken) {
              setAuth(me, token, refreshToken)
            }
          } catch {
            // ignore - user data sẽ refresh lần sau
          }
        } else if (result.status === 'pending') {
          setStatus('pending')
          setMessage('Thanh toán đang được xử lý, vui lòng chờ...')
          // Retry sau 3 giây
          setTimeout(verify, 3000)
        } else {
          setStatus('failed')
          setMessage('Thanh toán không thành công')
        }
      } catch {
        setStatus('failed')
        setMessage('Không thể xác nhận thanh toán')
      }
    }

    verify()
  }, [searchParams, setAuth, token, refreshToken])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="max-w-md w-full rounded-xl p-8 shadow-lg text-center"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {status === 'verifying' && (
          <>
            <div className="text-4xl mb-4">&#8987;</div>
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>{message}</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-4xl mb-4">&#8987;</div>
            <p className="text-lg font-medium" style={{ color: 'var(--color-primary-500)' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">&#11088;</div>
            <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>{message}</p>
            <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Bạn đã được nâng cấp lên Premium. Tối đa 60 người chơi mỗi phòng.
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-4xl mb-4">&#10060;</div>
            <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-error)' }}>{message}</p>
            <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
          </>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: status === 'success' ? 'var(--color-primary-500)' : 'transparent',
            color: status === 'success' ? 'white' : 'var(--color-text)',
            border: status === 'success' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          Về Dashboard
        </button>
      </div>
    </div>
  )
}
