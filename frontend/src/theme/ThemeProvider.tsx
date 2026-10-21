import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  applyPalette,
  getInitialPaletteId,
  getPalette,
  PALETTES,
  THEME_STORAGE_KEY,
} from '@/theme/palettes'
import { ThemeContext } from '@/theme/theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteIdState] = useState<string>(getInitialPaletteId)
  const palette = getPalette(paletteId)

  useEffect(() => {
    applyPalette(palette)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, palette.id)
    } catch {
      return
    }
  }, [palette])

  const setPaletteId = useCallback((id: string) => {
    setPaletteIdState(id)
  }, [])

  const value = useMemo(
    () => ({ palette, paletteId, palettes: PALETTES, setPaletteId }),
    [palette, paletteId, setPaletteId],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
