import { ListChecks } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Placeholder } from '@/components/Placeholder'

export function BankApplicationsPage() {
  return (
    <AppShell title="Очередь заявок" subtitle="Фильтры, карточка заявки, решения">
      <Placeholder
        icon={ListChecks}
        title="Очередь заявок"
        description="Здесь будет очередь заявок с фильтрами, карточкой клиента, скорингом и кнопками решений."
      />
    </AppShell>
  )
}
