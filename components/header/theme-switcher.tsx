'use client'

import { MoonStar, Sun, SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`切换到${nextTheme === 'dark' ? '深色' : '浅色'}模式`}
      onClick={() => setTheme(nextTheme)}
      className="flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-700 sm:h-[34px] sm:w-[34px]"
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
