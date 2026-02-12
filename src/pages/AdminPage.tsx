import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ui/ThemeToggle'

interface UserItem {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: string
  isPremium: boolean
  premiumExpiresAt: string | null
  isBanned: boolean
}

interface PagedUsers {
  items: UserItem[]
  totalCount: number
  page: number
  pageSize: number
}

interface TransactionItem {
  id: string
  userId: string
  sessionId: string
  amount: number
  planType: string
  status: string
  createdAt: string
  completedAt: string | null
}

interface RevenueData {
  totalRevenue: number
  totalTransactions: number
  items: TransactionItem[]
  page: number
  pageSize: number
}

interface GlobalPremiumData {
  enabled: boolean
}

type Tab = 'users' | 'revenue' | 'settings'

export function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [tab, setTab] = useState<Tab>('users')

  // Users state
  const [users, setUsers] = useState<UserItem[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [search, setSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Revenue state
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [revLoading, setRevLoading] = useState(false)

  // Settings state
  const [globalPremium, setGlobalPremium] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const pageSize = 20

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({ page: String(userPage), pageSize: String(pageSize) })
      if (search) params.set('search', search)
      const result = await api.get<PagedUsers>(`/admin/users?${params}`)
      setUsers(result.items)
      setUserTotal(result.totalCount)
    } catch { /* ignore */ } finally {
      setUsersLoading(false)
    }
  }, [userPage, search])

  const fetchRevenue = useCallback(async () => {
    setRevLoading(true)
    try {
      const result = await api.get<RevenueData>('/admin/revenue')
      setRevenue(result)
    } catch { /* ignore */ } finally {
      setRevLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const result = await api.get<GlobalPremiumData>('/admin/settings/global-premium')
      setGlobalPremium(result.enabled)
      setSettingsLoaded(true)
    } catch { /* ignore */ } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [user, navigate, fetchUsers])

  useEffect(() => {
    if (tab === 'revenue' && !revenue) fetchRevenue()
    if (tab === 'settings' && !settingsLoaded) fetchSettings()
  }, [tab, revenue, fetchRevenue, settingsLoaded, fetchSettings])

  const toggleBan = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId)
    try {
      const action = isBanned ? 'unban' : 'ban'
      await api.post(`/admin/users/${userId}/${action}`)
      await fetchUsers()
    } catch { /* ignore */ } finally {
      setActionLoading(null)
    }
  }

  const toggleGlobalPremium = async () => {
    setSettingsLoading(true)
    try {
      await api.post('/admin/settings/global-premium', { enabled: !globalPremium })
      setGlobalPremium(!globalPremium)
    } catch { /* ignore */ } finally {
      setSettingsLoading(false)
    }
  }

  const userTotalPages = Math.ceil(userTotal / pageSize)

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary-500)' }}>
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}
          >
            Dashboard
          </button>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          {(['users', 'revenue', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t ? 'var(--color-primary-500)' : 'transparent',
                color: tab === t ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {t === 'users' ? 'Người dùng' : t === 'revenue' ? 'Doanh thu' : 'Cài đặt'}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <>
            <div className="rounded-xl p-4 shadow-lg mb-4"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tổng người dùng</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary-500)' }}>{userTotal}</p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setUserPage(1) }}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="rounded-xl shadow-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              {usersLoading ? (
                <p className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Đang tải...</p>
              ) : users.length === 0 ? (
                <p className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Không có người dùng</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Người dùng</th>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Premium</th>
                        <th className="text-right p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {u.avatarUrl && <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full" />}
                              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{u.displayName}</span>
                            </div>
                          </td>
                          <td className="p-3" style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: u.role === 'admin' ? 'var(--color-primary-500)' : 'var(--color-bg)',
                                color: u.role === 'admin' ? 'white' : 'var(--color-text-muted)',
                              }}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span style={{ color: u.isPremium ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                              {u.isPremium ? 'Premium' : 'Free'}
                            </span>
                            {u.isPremium && u.premiumExpiresAt && (
                              <span className="block text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                HH: {new Date(u.premiumExpiresAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => toggleBan(u.id, u.isBanned)}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: u.isBanned ? 'var(--color-success)' : 'var(--color-error)',
                                  color: 'var(--color-primary-text)',
                                  opacity: actionLoading === u.id ? 0.5 : 1,
                                }}>
                                {actionLoading === u.id ? '...' : u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {userTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage <= 1}
                  className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-30"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Trước</button>
                <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{userPage}/{userTotalPages}</span>
                <button onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))} disabled={userPage >= userTotalPages}
                  className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-30"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Sau</button>
              </div>
            )}
          </>
        )}

        {/* Revenue Tab */}
        {tab === 'revenue' && (
          <>
            {revLoading ? (
              <p className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Đang tải...</p>
            ) : revenue ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl p-4 shadow-lg"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tổng doanh thu</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{formatVnd(revenue.totalRevenue)}</p>
                  </div>
                  <div className="rounded-xl p-4 shadow-lg"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tổng giao dịch</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-500)' }}>{revenue.totalTransactions}</p>
                  </div>
                </div>

                {revenue.items.length === 0 ? (
                  <p className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Chưa có giao dịch</p>
                ) : (
                  <div className="rounded-xl shadow-lg overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Session ID</th>
                            <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Gói</th>
                            <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Số tiền</th>
                            <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Trạng thái</th>
                            <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Ngày tạo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenue.items.map((t) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td className="p-3 font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                                {t.sessionId.slice(0, 20)}...
                              </td>
                              <td className="p-3" style={{ color: 'var(--color-text)' }}>
                                {t.planType === 'yearly' ? 'Năm' : t.planType}
                              </td>
                              <td className="p-3 font-medium" style={{ color: 'var(--color-success)' }}>
                                {formatVnd(t.amount)}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: t.status === 'completed' ? 'var(--color-success)' :
                                      t.status === 'pending' ? 'var(--color-primary-500)' : 'var(--color-error)',
                                    color: 'var(--color-primary-text)',
                                  }}>
                                  {t.status === 'completed' ? 'Hoàn thành' : t.status === 'pending' ? 'Chờ' : 'Lỗi'}
                                </span>
                              </td>
                              <td className="p-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {formatDate(t.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="rounded-xl p-6 shadow-lg"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Cài đặt hệ thống</h3>

            <div className="flex items-center justify-between py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>Bật Premium cho tất cả</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Khi bật, tất cả người dùng sẽ có quyền Premium (tối đa 60 người chơi/phòng) mà không cần thanh toán.
                  Dùng cho khuyến mãi hoặc giai đoạn beta.
                </p>
              </div>
              <button
                onClick={toggleGlobalPremium}
                disabled={settingsLoading}
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
                style={{
                  backgroundColor: globalPremium ? 'var(--color-success)' : 'var(--color-bg)',
                  color: globalPremium ? 'white' : 'var(--color-text-muted)',
                  border: globalPremium ? 'none' : '1px solid var(--color-border)',
                  opacity: settingsLoading ? 0.5 : 1,
                }}
              >
                {settingsLoading ? '...' : globalPremium ? 'Đang bật' : 'Đang tắt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
