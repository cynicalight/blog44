import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 只对 /admin 路径进行保护（排除 /admin/login）
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next()
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Asset uploads validate the signed session in their Route Handler. Keeping
  // them out of Routing Middleware avoids its smaller request-body limit.
  matcher: ['/admin/:path*', '/api/admin/((?!assets(?:/|$)).*)'],
}
