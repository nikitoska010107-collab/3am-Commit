import type { Role } from '@/app/auth'

export const paths = {
  login: '/login',
  client: {
    root: '/client',
    products: '/client/products',
    applications: '/client/applications',
  },
  bank: {
    root: '/bank',
    applications: '/bank/applications',
  },
} as const

export function homePathForRole(role: Role) {
  return role === 'UNDERWRITER' ? paths.bank.root : paths.client.root
}
