import { useState } from 'react'
import { Check, Palette as PaletteIcon, X } from 'lucide-react'
import { useTheme } from '@/theme/theme-context'
import { cn } from '@/lib/utils'

export function ThemeSwitcher() {
  const { paletteId, palettes, setPaletteId } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="w-72 rounded-xl border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Тема · временно
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-1">
            {palettes.map((item) => {
              const isActive = item.id === paletteId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPaletteId(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary',
                  )}
                >
                  <span
                    className="size-4 shrink-0 rounded-full border"
                    style={{ backgroundColor: item.tokens['--primary'] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.note}
                    </span>
                  </span>
                  {isActive ? <Check className="size-4 shrink-0" /> : null}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Панель временная, уберём после выбора палитры.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-medium shadow-lg transition-colors hover:bg-secondary"
      >
        <PaletteIcon className="size-4" />
        Тема
      </button>
    </div>
  )
}
