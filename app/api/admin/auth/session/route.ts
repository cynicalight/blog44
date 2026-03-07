import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }
  return NextResponse.json({ user: session })
}
