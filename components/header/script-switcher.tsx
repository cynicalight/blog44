'use client'

import clsx from 'clsx'
import { usePathname, useRouter } from 'next/navigation'
import path from 'path'
import { startTransition, useEffect, useState } from 'react'
import {
  BLOG_SCRIPT_PREFERENCE_KEY,
  DEFAULT_BLOG_SCRIPT_VARIANT,
  getBlogScriptVariantFromRoutePath,
  isBlogPathname,
  toSimplifiedBlogPathname,
  toTraditionalBlogPathname,
  type BlogScriptVariant,
} from '~/lib/blog-script'

export function ScriptSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [scriptVariant, setScriptVariant] = useState<BlogScriptVariant>(DEFAULT_BLOG_SCRIPT_VARIANT)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem(BLOG_SCRIPT_PREFERENCE_KEY)
    const preferred = stored === 'zh-Hans' ? 'zh-Hans' : DEFAULT_BLOG_SCRIPT_VARIANT

    if (isBlogPathname(pathname)) {
      const urlVariant = getBlogScriptVariantFromRoutePath(pathname.slice(1))

      if (urlVariant !== preferred) {
        const nextPathname =
          preferred === 'zh-Hant'
            ? toTraditionalBlogPathname(pathname)
            : toSimplifiedBlogPathname(pathname)
        setScriptVariant(preferred)
        startTransition(() => {
          router.replace(nextPathname)
        })
        return
      }

      setScriptVariant(urlVariant)
      return
    }

    setScriptVariant(preferred)
  }, [pathname])

  function handleVariantChange(nextVariant: BlogScriptVariant) {
    setScriptVariant(nextVariant)
    window.localStorage.setItem(BLOG_SCRIPT_PREFERENCE_KEY, nextVariant)

    if (!isBlogPathname(pathname)) {
      return
    }

    const nextPathname =
      nextVariant === 'zh-Hant'
        ? toTraditionalBlogPathname(pathname)
        : toSimplifiedBlogPathname(pathname)

    if (nextPathname === pathname) {
      return
    }

    startTransition(() => {
      router.push(nextPathname)
    })
  }

  const nextVariant = scriptVariant === 'zh-Hant' ? 'zh-Hans' : 'zh-Hant'

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextVariant === 'zh-Hant' ? 'Traditional Chinese' : 'Simplified Chinese'}`}
      title={`切换到${nextVariant === 'zh-Hant' ? '繁體' : '简体'}`}
      onClick={() => handleVariantChange(nextVariant)}
      className={clsx(
        'flex h-9 w-9 items-center justify-center rounded text-[17px] font-semibold leading-none transition-colors sm:h-[34px] sm:w-[34px] sm:text-lg',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500'
      )}
      data-umami-event="nav-script-switcher"
    >
      <span
        className={clsx('inline-block min-w-[1em] translate-y-[2.5px]', !mounted && 'opacity-80')}
      >
        {scriptVariant === 'zh-Hant' ? '繁' : '简'}
      </span>
    </button>
  )
}
