import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '@/app/auth'
import { homePathForRole, paths } from '@/app/paths'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={paths.login} replace />
  }

  if (user.role !== role) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <>{children}</>
}
