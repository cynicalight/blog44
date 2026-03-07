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
        // 现代化背景和毛玻璃效果
        'border border-gray-200/50 bg-white/80 backdrop-blur-md',
        'dark:border-gray-800/50 dark:bg-zinc-900',
        // 优化阴影效果
        'shadow-lg shadow-gray-200/20 dark:shadow-gray-900/40',
        // 圆角和内边距
        'px-2 py-3 md:rounded-2xl',
        // 悬停效果
        'transition-all duration-300 ease-in-out',
        'hover:shadow-xl hover:shadow-gray-200/30 dark:hover:shadow-gray-900/60',
        'hover:bg-white/90 dark:hover:bg-zinc-900',
        // 粘性定位
        SITE_METADATA.stickyNav && 'sticky top-3 z-50 lg:top-4'
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {/* HOME 按钮 */}
        <Link
          href="/"
          className={clsx(
            'rounded-lg px-4 py-2 text-lg font-bold transition-all duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            pathname === '/'
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          )}
        >
          HOME
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
                    'rounded-lg px-4 py-2 font-semibold transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  )}
                >
                  <span data-umami-event={`nav-${href.replace('/', '')}`}>{title}</span>
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
            <ThemeSwitcher />
            <SearchButton />
            <MobileNav />
          </div>
        </div>
      </div>
    </Container>
  )
}
