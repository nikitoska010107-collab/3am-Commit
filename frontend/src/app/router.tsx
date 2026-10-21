import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/app/auth'
import { RequireRole } from '@/app/guards'
import { homePathForRole, paths } from '@/app/paths'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ClientHome } from '@/pages/client/ClientHome'
import { ProductsPage } from '@/pages/client/ProductsPage'
import { ApplicationsPage } from '@/pages/client/ApplicationsPage'
import { BankHome } from '@/pages/bank/BankHome'
import { BankApplicationsPage } from '@/pages/bank/BankApplicationsPage'

function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homePathForRole(user.role) : paths.login} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path={paths.login} element={<LoginPage />} />

      <Route
        path={paths.client.root}
        element={
          <RequireRole role="CLIENT">
            <ClientHome />
          </RequireRole>
        }
      />
      <Route
        path={paths.client.products}
        element={
          <RequireRole role="CLIENT">
            <ProductsPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.client.applications}
        element={
          <RequireRole role="CLIENT">
            <ApplicationsPage />
          </RequireRole>
        }
      />

      <Route
        path={paths.bank.root}
        element={
          <RequireRole role="UNDERWRITER">
            <BankHome />
          </RequireRole>
        }
      />
      <Route
        path={paths.bank.applications}
        element={
          <RequireRole role="UNDERWRITER">
            <BankApplicationsPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
