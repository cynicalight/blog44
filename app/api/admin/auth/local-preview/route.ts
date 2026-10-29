import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminSessionToken, getAdminSessionCookieOptions } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
  if (process.env.NODE_ENV !== 'development' || !localHost || process.env.VERCEL) {
    return new NextResponse(null, { status: 404 })
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return new NextResponse(null, { status: 403 })
  }

  const response = NextResponse.redirect(new URL('/admin/posts/new', request.url))
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionToken('local-preview@localhost', true),
    getAdminSessionCookieOptions(new Date(Date.now() + 3600_000))
  )
  return response
}
