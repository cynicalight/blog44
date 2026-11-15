'use client'

import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { SearchButton } from '~/components/header/search'
import { ScriptSwitcher } from '~/components/header/script-switcher'
import { ThemeSwitcher } from '~/components/header/theme-switcher'
import { Link } from '~/components/ui/link'
import { HEADER_NAV_LINKS, MORE_NAV_LINKS } from '~/data/navigation'
import { createLunarScene, type LunarScene } from './engine'
import { MoonPhaseIcon } from './pixel-ui'

const LAYER_CLASS =
  'pointer-events-none fixed inset-0 z-[-1] h-full w-full [image-rendering:pixelated]'
const CLOSE_DELAY_MS = 380
const HOVER_BUFFER = 40
const SCROLL_QUIET_MS = 250
const COMPACT_RADIUS = 78

const SECTION_LINKS = [...HEADER_NAV_LINKS, ...MORE_NAV_LINKS].map(({ href, title }) => ({
  href,
  title: title.toUpperCase(),
}))

/**
 * Site-wide backdrop and navigation: one canvas scene (hero on `/`, quiet
 * backdrop elsewhere) and the moon itself as the menu.
 */
export function LunarChrome() {
  const pathname = usePathname()
  const baseRef = useRef<HTMLCanvasElement>(null)
  const moonLayerRef = useRef<HTMLDivElement>(null)
  const moonFromRef = useRef<HTMLCanvasElement>(null)
  const moonToRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<HTMLCanvasElement>(null)
  const moonRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<LunarScene | null>(null)
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'light' ? 'light' : 'dark'
  const mode = pathname === '/' ? 'home' : 'page'
  const onMenu = useCallback((open: boolean) => sceneRef.current?.setExcited(open), [])

  useEffect(() => {
    const base = baseRef.current
    const moon = moonLayerRef.current
    const moonFrom = moonFromRef.current
    const moonTo = moonToRef.current
    const particles = particlesRef.current
    const moonHost = moonRef.current
    if (!base || !moon || !moonFrom || !moonTo || !particles || !moonHost) return
    const scene = createLunarScene({
      layers: { base, moon, moonFrom, moonTo, particles },
      host: document.documentElement,
      moonHost,
      theme,
      mode,
    })
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [theme, mode])

  return (
    <>
      {/* Stacking by DOM order: static sky/sea, the moon, then per-frame particles. */}
      <canvas ref={baseRef} aria-hidden className={LAYER_CLASS} />
      <div
        ref={moonLayerRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[-1] origin-top-left will-change-transform"
      >
        <canvas
          ref={moonFromRef}
          className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
        />
        <canvas
          ref={moonToRef}
          className="absolute inset-0 h-full w-full opacity-0 [image-rendering:pixelated]"
        />
      </div>
      <canvas ref={particlesRef} aria-hidden className={LAYER_CLASS} />
      <MoonNav anchorRef={moonRef} pathname={pathname} onOpenChange={onMenu} />
      <div
        className={clsx(
          'fixed right-4 top-4 z-40 flex items-center gap-0.5 text-gray-500 dark:text-gray-400',
          '[&_button:hover]:bg-transparent [&_button:hover]:text-gray-900 dark:[&_button:hover]:text-white [&_button]:rounded-none'
        )}
      >
        <ScriptSwitcher />
        <ThemeSwitcher />
        <SearchButton />
      </div>
    </>
  )
}

function MoonNav({
  anchorRef,
  pathname,
  onOpenChange,
}: {
  anchorRef: RefObject<HTMLDivElement | null>
  pathname: string
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)
  // Inner pages have a small moon: labels hug it in a tight crescent-then-column.
  const compact = pathname !== '/'
  const items = compact ? [{ href: '/', title: 'HOME' }, ...SECTION_LINKS] : SECTION_LINKS

  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  // Grace period so overshooting the menu edge doesn't snap it shut.
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setOpen(false)
    }, CLOSE_DELAY_MS)
  }
  useEffect(() => cancelClose, [])

  useEffect(() => onOpenChange(open), [open, onOpenChange])

  // Scrolling collapses the menu at once. Hover can't reopen it mid-scroll (the moon
  // slides under a resting cursor on the home page) until scrolling has paused.
  const scrollQuietAt = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      scrollQuietAt.current = performance.now() + SCROLL_QUIET_MS
      cancelClose()
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Hover buffer: while open, stay open only if the mouse is within HOVER_BUFFER px
  // of the moon's rim or of any label; otherwise close after the grace period.
  useEffect(() => {
    if (!open) return
    const onPointerMove = (event: PointerEvent) => {
      const group = groupRef.current
      if (event.pointerType !== 'mouse' || !group) return
      const moon = group.getBoundingClientRect()
      const radius = moon.width / 2
      const fromCenter = Math.hypot(
        event.clientX - (moon.left + radius),
        event.clientY - (moon.top + radius)
      )
      let near = fromCenter <= radius + HOVER_BUFFER
      for (const label of group.querySelectorAll('#moon-nav a')) {
        if (near) break
        const rect = label.getBoundingClientRect()
        const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right)
        const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom)
        near = Math.hypot(dx, dy) <= HOVER_BUFFER
      }
      if (near) cancelClose()
      else if (closeTimer.current === null) scheduleClose()
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [open])

  return (
    <div
      ref={anchorRef}
      className="pointer-events-none fixed left-0 top-0 z-40"
      style={{ transform: 'translate3d(var(--moon-x, -999px), var(--moon-y, -999px), 0)' }}
    >
      <div
        ref={groupRef}
        data-open={open}
        className="group absolute h-[calc(var(--moon-r,0px)*2)] w-[calc(var(--moon-r,0px)*2)] -translate-x-1/2 -translate-y-1/2 [--reach:22px] [--spread:0.6] data-[open=true]:[--reach:58px] data-[open=true]:[--spread:1]"
        // Move, not enter: a cursor resting on the moon after a scroll reopens on its next move.
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse' || performance.now() < scrollQuietAt.current) return
          cancelClose()
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!groupRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
        }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="moon-nav"
          aria-label="站点导航"
          onClick={() => setOpen((value) => !value)}
          className="pointer-events-auto absolute inset-0 cursor-pointer rounded-full outline-none focus-visible:ring-1 focus-visible:ring-gray-400/60"
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 whitespace-nowrap font-pixel text-[10px] tracking-[0.3em] text-gray-400 transition-opacity duration-500 group-data-[open=true]:opacity-0"
          style={{
            transform:
              'translate(calc(0.707 * (var(--moon-r) + 26px) * var(--moon-side, 1)), calc(0.707 * (var(--moon-r) + 26px))) translate(calc((var(--moon-side, 1) - 1) * 50%), -50%)',
          }}
        >
          MENU
        </span>
        <nav id="moon-nav" aria-label="Site">
          {items.map((item, index) => {
            // Home: equal vertical steps along the big moon's orbit. Inner pages: fixed
            // 25px rows on a 78px circle, dropping into a column once below the moon.
            const ay = (0.95 * index) / (items.length - 1)
            const ax = Math.sqrt(1 - ay * ay)
            const dy = -10 + index * 25
            const dx = Math.sqrt(Math.max(0, COMPACT_RADIUS ** 2 - dy * dy))
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                data-umami-event={`moon-nav-${item.href.replace('/', '') || 'home'}`}
                className={clsx(
                  'absolute left-1/2 top-1/2 flex items-center gap-2 whitespace-nowrap px-1 py-1.5',
                  'font-pixel text-[11px] tracking-[0.22em]',
                  active ? 'text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-400',
                  'pointer-events-none opacity-0 outline-none transition-[opacity,transform,color] duration-500 ease-out',
                  'hover:text-gray-950 focus-visible:text-gray-950 dark:hover:text-white dark:focus-visible:text-white',
                  'group-data-[open=true]:pointer-events-auto group-data-[open=true]:opacity-100'
                )}
                style={
                  {
                    '--ax': ax,
                    '--ay': ay,
                    transform: compact
                      ? `translate(calc(${dx}px * var(--spread)), calc(${dy}px * var(--spread))) translate(0, -50%)`
                      : 'translate(calc(var(--ax) * (var(--moon-r) + var(--reach)) * var(--moon-side, 1)), calc(var(--ay) * (var(--moon-r) + var(--reach)))) translate(calc((var(--moon-side, 1) - 1) * 50%), -50%)',
                    transitionDelay: open ? `${index * 40}ms` : '0ms',
                  } as CSSProperties
                }
              >
                <MoonPhaseIcon phase={active ? 0.5 : (index + 1) / (items.length + 1)} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
