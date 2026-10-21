import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AuthContext,
  readStoredUser,
  STORAGE_KEY,
  TEST_ACCOUNTS,
  type Role,
  type User,
} from '@/app/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const normalized = email.trim().toLowerCase()
    const account = TEST_ACCOUNTS.find(
      (item) => item.email === normalized && item.password === password,
    )
    if (!account) {
      throw new Error('Неверный e-mail или пароль')
    }
    setUser(account.user)
    return account.user
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const switchRole = useCallback((role: Role) => {
    setUser((current) => (current ? { ...current, role } : current))
  }, [])

  const value = useMemo(
    () => ({ user, login, logout, switchRole }),
    [user, login, logout, switchRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
