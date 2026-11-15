'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { Footer } from '~/components/footer'
import { LunarChrome } from '~/components/lunar/lunar-chrome'
import { ParticleCursor } from '~/components/ui/particle-cursor'

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) {
    return <main className="site-main mb-auto grow">{children}</main>
  }

  return (
    <>
      <ParticleCursor />
      <LunarChrome />
      {/* Inner pages clear the fixed moon navigation in the top-left corner. */}
      <main className={clsx('site-main mb-auto grow', pathname !== '/' && 'pt-24 md:pt-28')}>
        {children}
      </main>
      <div className="site-footer">
        <Footer />
      </div>
    </>
  )
}
