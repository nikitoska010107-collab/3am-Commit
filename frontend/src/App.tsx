import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthProvider'
import { queryClient } from '@/app/query-client'
import { AppRoutes } from '@/app/router'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { ThemeSwitcher } from '@/theme/ThemeSwitcher'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  )
}
