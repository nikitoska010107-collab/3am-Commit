import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { paths } from '@/app/paths'
import { useAuth } from '@/app/auth'

const stats = [
  { label: 'Доступный лимит', value: 'до 7 000 000 ₽', hint: 'по трём продуктам' },
  { label: 'Заявки в работе', value: '0', hint: 'пока нет активных заявок' },
  { label: 'Средний срок', value: 'от 1 дня', hint: 'при полном пакете данных' },
]

export function ClientHome() {
  const { user } = useAuth()

  return (
    <AppShell title="Обзор" subtitle={user?.company}>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border bg-card p-6">
          <p className="text-sm font-medium text-primary">Умный кредитный кабинет</p>
          <h2 className="mt-2 text-2xl font-semibold">Получите финансирование без визита в банк</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Подберите продукт, отправьте заявку и следите за решением в одном окне. Мы объясним
            каждый шаг и покажем, каких данных не хватает.
          </p>
          <Link
            to={paths.client.products}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Подобрать продукт
            <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  )
}
