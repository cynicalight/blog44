import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 只对 /admin 路径进行保护（排除 /admin/login 和 /admin/register）
  if (pathname.startsWith('/admin')) {
    // 允许访问登录和注册页面
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      return NextResponse.next()
    }

    // 检查是否有token（简单验证）
    // 注意：这里只是基础保护，真正的验证应该在服务器端API中进行
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      // 没有token，重定向到登录页
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
