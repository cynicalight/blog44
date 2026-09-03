'use client'

import { ThemeProvider } from 'next-themes'
import { SITE_METADATA } from '~/data/site-metadata'

const MIGRATE_SYSTEM_THEME = `
try {
  if (localStorage.getItem('theme') === 'system') {
    localStorage.setItem('theme', 'dark')
  }
} catch {}
`

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MIGRATE_SYSTEM_THEME }} />
      <ThemeProvider
        attribute="class"
        defaultTheme={SITE_METADATA.theme}
        enableSystem={false}
      >
        {children}
      </ThemeProvider>
    </>
  )
}
