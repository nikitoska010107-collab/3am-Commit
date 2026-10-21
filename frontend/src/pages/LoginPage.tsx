import { useState, type FormEvent } from 'react'
import { Building2, Loader2, LogIn } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TEST_ACCOUNTS, TEST_PASSWORD, useAuth } from '@/app/auth'
import { homePathForRole } from '@/app/paths'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(TEST_ACCOUNTS[0].email)
  const [password, setPassword] = useState(TEST_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const loggedIn = await login(email, password)
      navigate(homePathForRole(loggedIn.role), { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось войти')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-base font-semibold">Умный кредитный кабинет</p>
            <p className="text-xs text-muted-foreground">Малый и микробизнес</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error ? (
            <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            Войти
          </button>
        </form>

        <div className="mt-4 rounded-xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Тестовые аккаунты
          </p>
          <div className="mt-3 space-y-1">
            {TEST_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(account.password)
                  setError(null)
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{account.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.user.name} · {account.user.company}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {account.user.role === 'UNDERWRITER' ? 'Банк' : 'Клиент'}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Пароль для всех: {TEST_PASSWORD}</p>
        </div>
      </div>
    </div>
  )
}
