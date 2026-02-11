import { Routes, Route, Navigate } from 'react-router'
import { HomePage } from '../pages/HomePage'
import { DashboardPage } from '../pages/DashboardPage'
import { JoinRoomPage } from '../pages/JoinRoomPage'
import { RoomHostPage } from '../pages/RoomHostPage'
import { PlayPage } from '../pages/PlayPage'
import { AdminPage } from '../pages/AdminPage'
import { PremiumPage } from '../pages/PremiumPage'
import { PaymentResultPage } from '../pages/PaymentResultPage'
import { useAuthStore } from '../stores/authStore'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        }
      />
      <Route
        path="/room/host"
        element={
          <AuthGuard>
            <RoomHostPage />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        }
      />
      <Route
        path="/premium"
        element={
          <AuthGuard>
            <PremiumPage />
          </AuthGuard>
        }
      />
      <Route
        path="/premium/result"
        element={
          <AuthGuard>
            <PaymentResultPage />
          </AuthGuard>
        }
      />
      <Route path="/join/:roomCode" element={<JoinRoomPage />} />
      <Route path="/play/:roomCode" element={<PlayPage />} />
    </Routes>
  )
}
