'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Container } from '~/components/ui/container'
import { GrowingUnderline } from '~/components/ui/growing-underline'
import { Link } from '~/components/ui/link'
import { HEADER_NAV_LINKS } from '~/data/navigation'
import { Twemoji } from '~/components/ui/twemoji'
import { SITE_METADATA } from '~/data/site-metadata'
import { MobileNav } from './mobile-nav'
import { MoreLinks } from './more-links'
import { SearchButton } from './search'
import { ScriptSwitcher } from './script-switcher'
import { ThemeSwitcher } from './theme-switcher'
import { AUTHOR_INFO } from '~/data/author-info'

let logged = false
function logASCIItext() {
  if (logged) return
  console.info(`
                                 __                                       
                                /\\ \\                                      
  ___ ___      __    ___      __\\ \\ \\/'\\      __        ___ ___      __   
/' __\` __\`\\  /'__\`\\/' _ \`\\  /'_ \`\\ \\ , <    /'__\`\\    /' __\` __\`\\  /'__\`\\ 
/\\ \\/\\ \\/\\ \\/\\  __//\\ \\/\\ \\/\\ \\L\\ \\ \\ \\\\\`\\ /\\  __/  __/\\ \\/\\ \\/\\ \\/\\  __/ 
\\ \\_\\ \\_\\ \\_\\ \\____\\ \\_\\ \\_\\ \\____ \\ \\_\\ \\_\\ \\____\\/\\_\\ \\_\\ \\_\\ \\_\\ \\____\\
 \\/_/\\/_/\\/_/\\/____/\\/_/\\/_/\\/___L\\ \\/_/\\/_/\\/____/\\/_/\\/_/\\/_/\\/_/\\/____/
                              /\\____/                                     
                              \\_/__/                                                          
  `)
  console.log('🧑‍💻 View source:', SITE_METADATA.siteRepo)
  console.log(`🙌 Let's connect:`, AUTHOR_INFO.email)
  logged = true
}

export function Header({ className }: { className?: string }) {
  const pathname = usePathname()
  useEffect(logASCIItext, [])

  return (
    <Container
      as="header"
      className={clsx(
        className,
        'rounded-full border border-white/35 bg-white/30 px-2 py-2 backdrop-blur-sm',
        'ring-1 ring-inset ring-white/20 shadow-[0_0_18px_rgba(15,23,42,0.12)]',
        'dark:border-white/15 dark:bg-zinc-950/30 dark:ring-white/10 dark:shadow-[0_0_18px_rgba(0,0,0,0.3)]',
        'transition-[background-color,border-color,box-shadow] duration-200 ease-out',
        'hover:bg-white/40 hover:shadow-[0_0_24px_rgba(15,23,42,0.16)]',
        'dark:hover:bg-zinc-950/40 dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.4)]',
        // 粘性定位
        SITE_METADATA.stickyNav && 'sticky top-4 z-50 lg:top-6'
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {/* HOME 按钮 */}
        <Link
          href="/"
          className={clsx(
            'inline-flex h-11 items-center rounded-lg px-4 text-lg font-bold leading-none transition-all duration-200',
            pathname === '/'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          )}
        >
          <span className="translate-y-px">HOME</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden gap-2 sm:flex">
            {HEADER_NAV_LINKS.map(({ title, href, emoji }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={title}
                  href={href}
                  className={clsx(
                    'inline-flex h-11 items-center rounded-lg px-4 font-semibold leading-none transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  )}
                >
                  <span
                    className="translate-y-px"
                    data-umami-event={`nav-${href.replace('/', '')}`}
                  >
                    {title}
                  </span>
                </Link>
              )
            })}
            <MoreLinks />
          </div>
          <div
            data-orientation="vertical"
            role="separator"
            className="hidden h-5 w-px shrink-0 bg-gray-300/60 dark:bg-gray-600/60 md:block"
          />
          <div className="flex items-center gap-1">
            <ScriptSwitcher />
            <ThemeSwitcher />
            <SearchButton />
            <MobileNav />
          </div>
        </div>
      </div>
    </Container>
  )
}
