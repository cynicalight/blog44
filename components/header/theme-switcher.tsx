'use client'

import { MoonStar, Sun, SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  // Before mount, assume the site default (dark) so SSR and hydration agree.
  const nextTheme = mounted && resolvedTheme === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`切换到${nextTheme === 'dark' ? '深色' : '浅色'}模式`}
      onClick={() => setTheme(nextTheme)}
      className="flex h-9 w-9 items-center justify-center rounded outline-none transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-900/60 dark:hover:bg-gray-700 dark:focus-visible:ring-white/60 sm:h-[34px] sm:w-[34px]"
      data-umami-event="nav-theme-switcher"
    >
      {mounted ? (
        resolvedTheme === 'dark' ? (
          <MoonStar strokeWidth={1.5} size={22} />
        ) : (
          <Sun strokeWidth={1.5} size={22} />
        )
      ) : (
        <SunMoon strokeWidth={1.5} size={22} />
      )}
    </button>
  )
}
