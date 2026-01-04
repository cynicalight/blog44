'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { GrowingUnderline } from '~/components/ui/growing-underline'
import { Link } from '~/components/ui/link'
import { Twemoji } from '~/components/ui/twemoji'
import { MORE_NAV_LINKS } from '~/data/navigation'

export function MoreLinks() {
  return (
    <div className="flex items-center">
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton
          aria-label="More links"
          className="px-3 py-1 font-semibold opacity-80 transition-opacity duration-200 hover:opacity-100"
        >
          <GrowingUnderline data-umami-event="nav-more-links" className="flex items-center gap-1">
            <span>MORE</span>
            <ChevronDown strokeWidth={2.5} size={20} />
          </GrowingUnderline>
        </MenuButton>
        <MenuItems className="absolute right-0 z-50 mt-2 w-36 origin-top-right translate-x-[calc(50%-42px)] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-black">
          <div className="space-y-1 p-1">
            {MORE_NAV_LINKS.map(({ href, title, emoji }) => (
              <MenuItem key={href} as="div">
                {({ close }) => (
                  <Link
                    href={href}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-800"
                    onClick={close}
                  >
                    <Twemoji emoji={emoji} />
                    <span data-umami-event={`nav-${href.replace('/', '')}`}>{title}</span>
                  </Link>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Menu>
    </div>
  )
}
