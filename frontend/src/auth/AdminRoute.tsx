import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { ReactNode } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <div className="page-status">권한을 확인하는 중입니다.</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace state={{ notice: '관리자 권한이 필요합니다.' }} />
  }

  return children
}
