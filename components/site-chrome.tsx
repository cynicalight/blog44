'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '~/components/footer'
import { Header } from '~/components/header'

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) {
    return <main className="site-main mb-auto grow">{children}</main>
  }

  return (
    <>
      <Header className="site-header" />
      <main className="site-main mb-auto grow">{children}</main>
      <div className="site-footer">
        <Footer />
      </div>
    </>
  )
}
