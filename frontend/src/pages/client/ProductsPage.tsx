import { Package } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Placeholder } from '@/components/Placeholder'

export function ProductsPage() {
  return (
    <AppShell title="Кредитные продукты" subtitle="Каталог и подбор под задачу">
      <Placeholder
        icon={Package}
        title="Каталог продуктов"
        description="Здесь появятся кредитные продукты с условиями и подсказкой, какой из них подходит вашей задаче."
      />
    </AppShell>
  )
}
