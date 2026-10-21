import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { paths } from '@/app/paths'

const stats = [
  { label: 'Заявок в очереди', value: '0', hint: 'ожидают рассмотрения' },
  { label: 'В работе', value: '0', hint: 'на проверке данных' },
  { label: 'Решено сегодня', value: '0', hint: 'одобрено, отказ, оффер' },
]

export function BankHome() {
  return (
    <AppShell title="Обзор" subtitle="Рабочее место андеррайтера">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border bg-card p-6">
          <p className="text-sm font-medium text-primary">Сторона банка</p>
          <h2 className="mt-2 text-2xl font-semibold">Обработка заявок предпринимателей</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Очередь заявок, карточка клиента, результаты скоринга и принятие решения. Все переходы
            статусов фиксируются в аудите.
          </p>
          <Link
            to={paths.bank.applications}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Открыть очередь
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
