import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'
import {
  createAdminPost,
  isGitHubContentError,
  listAdminPosts,
  parseAdminPostInput,
} from '~/lib/admin-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function unauthorizedResponse() {
  return NextResponse.json({ message: '未登录' }, { status: 401 })
}

function assertAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

export async function GET(request: NextRequest) {
  if (!assertAdmin(request)) {
    return unauthorizedResponse()
  }

  try {
    const posts = await listAdminPosts()
    return NextResponse.json({ posts })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取文章列表失败'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!assertAdmin(request)) {
    return unauthorizedResponse()
  }

  try {
    const payload = parseAdminPostInput(await request.json())
    const post = await createAdminPost(payload)
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    if (isGitHubContentError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : '创建文章失败'
    return NextResponse.json({ message }, { status: 400 })
  }
}
