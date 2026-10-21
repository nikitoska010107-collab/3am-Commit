import { FileText } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Placeholder } from '@/components/Placeholder'

export function ApplicationsPage() {
  return (
    <AppShell title="Мои заявки" subtitle="Статусы и действия по заявкам">
      <Placeholder
        icon={FileText}
        title="Заявки клиента"
        description="Здесь будет список ваших заявок со статусами, историей и действиями, которые требуются от вас."
      />
    </AppShell>
  )
}
