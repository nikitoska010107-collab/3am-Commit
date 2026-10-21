import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, type Role } from '@/app/auth'
import { homePathForRole, paths } from '@/app/paths'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const navigationByRole: Record<Role, NavItem[]> = {
  CLIENT: [
    { label: 'Обзор', to: paths.client.root, icon: LayoutDashboard, end: true },
    { label: 'Кредитные продукты', to: paths.client.products, icon: Package },
    { label: 'Мои заявки', to: paths.client.applications, icon: FileText },
  ],
  UNDERWRITER: [
    { label: 'Обзор', to: paths.bank.root, icon: LayoutDashboard, end: true },
    { label: 'Очередь заявок', to: paths.bank.applications, icon: FileText },
  ],
}

const roleLabels: Record<Role, string> = {
  CLIENT: 'Клиент',
  UNDERWRITER: 'Андеррайтер',
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

type AppShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { user, logout, switchRole } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const navigation = navigationByRole[user.role]
  const otherRole: Role = user.role === 'CLIENT' ? 'UNDERWRITER' : 'CLIENT'

  function handleSwitchRole() {
    switchRole(otherRole)
    navigate(homePathForRole(otherRole))
  }

  function handleLogout() {
    logout()
    navigate(paths.login)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Кредитный кабинет</p>
            <p className="text-xs text-muted-foreground">{user.company}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t p-4">
          <button
            type="button"
            onClick={handleSwitchRole}
            className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeftRight className="size-4" />
            {otherRole === 'UNDERWRITER' ? 'Режим банка' : 'Режим клиента'}
          </button>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Демо-режим. Синтетические данные.
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline">
              {roleLabels[user.role]}
            </span>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{user.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(user.name)}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Выйти"
              className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
