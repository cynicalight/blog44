'use client'

import { clearAllBodyScrollLocks, disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import { Transition, TransitionChild } from '@headlessui/react'
import { clsx } from 'clsx'
import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '~/components/ui/link'
import { Twemoji } from '~/components/ui/twemoji'
import { HEADER_NAV_LINKS, MORE_NAV_LINKS } from '~/data/navigation'
import { SITE_METADATA } from '~/data/site-metadata'
import { Logo } from './logo'

export function MobileNav() {
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => setMounted(true), [])

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
      {mounted &&
        createPortal(
          <Transition show={navShow}>
            <div className="fixed inset-0 z-60 sm:hidden" role="dialog" aria-modal="true">
              <TransitionChild
                enter="transition-opacity duration-200 ease-out motion-reduce:duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150 ease-out motion-reduce:duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <button
                  type="button"
                  aria-label="Close Menu Backdrop"
                  className="fixed inset-0 bg-black/15 backdrop-blur-md"
                  onClick={onToggleNav}
                />
              </TransitionChild>
              <TransitionChild
                enter="transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-opacity motion-reduce:duration-150"
                enterFrom="translate-x-full opacity-0 motion-reduce:translate-x-0"
                enterTo="translate-x-0 opacity-100"
                leave="transition-[transform,opacity] duration-180 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-opacity motion-reduce:duration-100"
                leaveFrom="translate-x-0 opacity-100"
                leaveTo="translate-x-full opacity-0 motion-reduce:translate-x-0"
              >
                <div className="fixed inset-y-0 right-0 z-70 w-[55vw] rounded-l-xl bg-white dark:bg-gray-950">
                  <nav ref={navRef} className="h-full overflow-y-auto px-8 pb-8 pt-6">
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
                </div>
              </TransitionChild>
            </div>
          </Transition>,
          document.body
        )}
    </>
  )
}
