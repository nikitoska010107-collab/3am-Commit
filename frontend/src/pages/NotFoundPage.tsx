import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/auth'
import { homePathForRole, paths } from '@/app/paths'

export function NotFoundPage() {
  const { user } = useAuth()
  const target = user ? homePathForRole(user.role) : paths.login

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <Compass className="size-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">Страница не найдена</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Возможно, адрес указан неверно или раздел ещё не готов.
        </p>
      </div>
      <Link
        to={target}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Вернуться
      </Link>
    </div>
  )
}
