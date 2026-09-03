'use client'

import { clearAllBodyScrollLocks, disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '~/components/ui/link'
import { Twemoji } from '~/components/ui/twemoji'
import { HEADER_NAV_LINKS, MORE_NAV_LINKS } from '~/data/navigation'
import { SITE_METADATA } from '~/data/site-metadata'
import { Logo } from './logo'

export function MobileNav() {
  const [navShow, setNavShow] = useState(false)
  const navRef = useRef(null)

  const onToggleNav = () => {
    setNavShow((status) => {
      if (status) {
        enableBodyScroll(navRef.current)
      } else {
        // Prevent scrolling
        disableBodyScroll(navRef.current)
      }
      return !status
    })
  }

  useEffect(() => {
    return clearAllBodyScrollLocks
  })

  useEffect(() => {
    if (!navShow) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onToggleNav()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navShow])

  return (
    <>
      <div
        className={clsx([
          'rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700',
          'flex items-center justify-center sm:hidden',
        ])}
        data-umami-event="mobile-nav-toggle"
      >
        <button aria-label="Toggle Menu" onClick={onToggleNav}>
          <Menu size={22} />
        </button>
      </div>
      {navShow &&
        createPortal(
          <div className="fixed inset-0 z-60 sm:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-y-0 left-0 z-70 w-[90vw] bg-white dark:bg-gray-950">
              <nav ref={navRef} className="h-full overflow-y-auto pb-8 pl-10 pr-20 pt-6">
                <div className="flex flex-col items-start gap-4">
                  {[...HEADER_NAV_LINKS, ...MORE_NAV_LINKS].map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="py-1 text-xl font-bold tracking-widest text-gray-900 outline outline-0 hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400"
                      onClick={onToggleNav}
                    >
                      <Twemoji emoji={link.emoji} />
                      <span className="ml-2">{link.title}</span>
                    </Link>
                  ))}
                </div>
              </nav>
              <button
                className="absolute right-4 top-5 z-80 h-16 w-16 p-4 text-gray-900 hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400"
                aria-label="Toggle Menu"
                onClick={onToggleNav}
              >
                <X className="h-7 w-7" strokeWidth={1.5} />
              </button>
            </div>
            <button
              type="button"
              aria-label="Close Menu Backdrop"
              className="fixed inset-y-0 right-0 w-[10vw] bg-black/15 backdrop-blur-md"
              onClick={onToggleNav}
            />
          </div>,
          document.body
        )}
    </>
  )
}
