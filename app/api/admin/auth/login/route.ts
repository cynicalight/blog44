import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  validateAdminCredentials,
} from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = loginSchema.parse(json)
    const user = validateAdminCredentials(parsed.email, parsed.password)

    if (!user) {
      return NextResponse.json({ message: '邮箱或密码错误' }, { status: 401 })
    }

    const response = NextResponse.json({ user })
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(user.email),
      getAdminSessionCookieOptions(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    )
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: '无效的登录请求' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : '登录失败'
    return NextResponse.json({ message }, { status: 500 })
  }
}
