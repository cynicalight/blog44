'use client'

import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'

function getPageTitle(pathname: string) {
  if (pathname === '/admin/posts/new') return '新建文章'
  if (pathname.startsWith('/admin/posts/edit')) return '编辑文章'
  return '文章管理'
}

export default function AdminHeader() {
  const pathname = usePathname()

  return (
    <header className="flex h-12 shrink-0 items-center border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <h1 className="text-sm font-medium">{getPageTitle(pathname)}</h1>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink />
            <span className="hidden sm:inline">查看站点</span>
          </a>
        </Button>
      </div>
    </header>
  )
}
