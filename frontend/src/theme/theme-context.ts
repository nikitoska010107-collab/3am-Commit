import { createContext, useContext } from 'react'
import type { Palette } from '@/theme/palettes'

export type ThemeContextValue = {
  palette: Palette
  paletteId: string
  palettes: Palette[]
  setPaletteId: (id: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme должен вызываться внутри ThemeProvider')
  }
  return context
}
