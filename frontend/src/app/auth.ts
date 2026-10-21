import { createContext, useContext } from 'react'

export type Role = 'CLIENT' | 'UNDERWRITER'

export type User = {
  id: string
  email: string
  name: string
  company: string
  role: Role
}

type TestAccount = {
  email: string
  password: string
  user: User
}

export const TEST_PASSWORD = 'demo'

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: 'client.approve@demo.local',
    password: TEST_PASSWORD,
    user: {
      id: 'u-client-approve',
      email: 'client.approve@demo.local',
      name: 'Анна Смирнова',
      company: 'ООО «Восход»',
      role: 'CLIENT',
    },
  },
  {
    email: 'client.counter@demo.local',
    password: TEST_PASSWORD,
    user: {
      id: 'u-client-counter',
      email: 'client.counter@demo.local',
      name: 'Павел Орлов',
      company: 'ИП Орлов П. С.',
      role: 'CLIENT',
    },
  },
  {
    email: 'client.reject@demo.local',
    password: TEST_PASSWORD,
    user: {
      id: 'u-client-reject',
      email: 'client.reject@demo.local',
      name: 'Мария Волкова',
      company: 'ООО «Северторг»',
      role: 'CLIENT',
    },
  },
  {
    email: 'underwriter@demo.local',
    password: TEST_PASSWORD,
    user: {
      id: 'u-underwriter',
      email: 'underwriter@demo.local',
      name: 'Игорь Петров',
      company: 'Альфа-Банк',
      role: 'UNDERWRITER',
    },
  },
]

export type AuthContextValue = {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  switchRole: (role: Role) => void
}

export const STORAGE_KEY = 'credit-cabinet-user'

export const AuthContext = createContext<AuthContextValue | null>(null)

export function readStoredUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен вызываться внутри AuthProvider')
  }
  return context
}
