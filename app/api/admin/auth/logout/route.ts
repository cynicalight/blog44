import { NextResponse } from 'next/server'
import { getAdminSessionCookieOptions } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', getAdminSessionCookieOptions(new Date(0)))
  return response
}
