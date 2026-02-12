import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ui/ThemeToggle'

interface CreatePaymentResponse {
  sessionId: string
  checkoutUrl: string
  amount: number
  expireAt: string
}

interface PremiumStatus {
  globalPremiumEnabled: boolean
}

export function PremiumPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [globalPremium, setGlobalPremium] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api.get<PremiumStatus>('/payment/premium-status')
      .then((r) => setGlobalPremium(r.globalPremiumEnabled))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleUpgrade = async (planType: 'yearly') => {
    setLoading(planType)
    setError(null)
    try {
      const result = await api.post<CreatePaymentResponse>('/payment/create', { planType })
      window.location.href = result.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo thanh toán')
    } finally {
      setLoading(null)
    }
  }

  const header = (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>Premium</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate('/dashboard')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}
        >
          Quay lại
        </button>
      </div>
    </div>
  )

  if (checking) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
        {header}
        <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>Đang tải...</p>
      </div>
    )
  }

  // Global Premium đang bật → hiện thông báo beta
  if (globalPremium) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
        {header}
        <div className="max-w-md mx-auto rounded-xl p-8 text-center shadow-lg"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-success)' }}>
          <p className="text-4xl mb-4">&#127881;</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>
            Premium miễn phí!
          </h2>
          <p className="mb-2" style={{ color: 'var(--color-text)' }}>
            Hệ thống đang trong giai đoạn Beta
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Tất cả người dùng đều được sử dụng tính năng Premium (tối đa 60 người chơi/phòng) miễn phí.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-primary-text)' }}
          >
            Về Dashboard
          </button>
        </div>
      </div>
    )
  }

  // User đã có Premium cá nhân
  if (user?.isPremium) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
        {header}
        <div className="max-w-md mx-auto rounded-xl p-8 text-center shadow-lg"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-success)' }}>
          <p className="text-4xl mb-4">&#11088;</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>
            Bạn đã là Premium!
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Tối đa 60 người chơi mỗi phòng
          </p>
          {user.premiumExpiresAt && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Hết hạn: {new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--color-primary-500)' }}>
                Còn {Math.max(0, Math.ceil((new Date(user.premiumExpiresAt).getTime() - Date.now()) / 86400000))} ngày
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chưa Premium → hiện form mua
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
          Nâng cấp Premium
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {error && (
          <div className="rounded-xl p-4 text-center font-medium"
            style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-primary-text)' }}>
            {error}
          </div>
        )}

        <div
          className="rounded-xl p-6 shadow-lg"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-primary-500)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Gói Premium</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>365 ngày Premium</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-500)' }}>50,000đ</p>
          </div>
          <ul className="text-sm space-y-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
            <li>- Tối đa 60 người chơi/phòng</li>
            <li>- Sử dụng 1 năm</li>
            <li>- Thanh toán qua Stripe</li>
          </ul>
          <button
            onClick={() => handleUpgrade('yearly')}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-primary-text)' }}
          >
            {loading === 'yearly' ? 'Đang xử lý...' : 'Mua Premium - 50,000đ/năm'}
          </button>
        </div>
      </div>
    </div>
  )
}
