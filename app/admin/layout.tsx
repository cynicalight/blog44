'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '~/lib/auth-context'
import AdminSidebar from '~/components/admin/AdminSidebar'
import AdminHeader from '~/components/admin/AdminHeader'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import './admin-styles.css'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return children
  }

  return (
    <SidebarProvider>
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout-root contents">
      <AuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AuthProvider>
    </div>
  )
}
