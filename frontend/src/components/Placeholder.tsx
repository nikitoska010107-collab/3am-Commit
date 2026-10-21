import type { LucideIcon } from 'lucide-react'

type PlaceholderProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function Placeholder({ icon: Icon, title, description }: PlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
        Раздел в разработке
      </p>
    </div>
  )
}
