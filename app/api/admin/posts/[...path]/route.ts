import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'
import {
  getAdminPost,
  isGitHubContentError,
  parseAdminPostInput,
  updateAdminPost,
} from '~/lib/admin-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = {
  path: string[]
}

function unauthorizedResponse() {
  return NextResponse.json({ message: '未登录' }, { status: 401 })
}

function assertAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

function getSourcePath(params: Params) {
  const path = params.path.join('/')
  if (!path.startsWith('data/blog/') || !path.endsWith('.mdx')) {
    throw new Error('无效的文章路径')
  }
  return path
}

export async function GET(request: NextRequest, props: { params: Promise<Params> }) {
  if (!assertAdmin(request)) {
    return unauthorizedResponse()
  }

  try {
    const params = await props.params
    const post = await getAdminPost(getSourcePath(params))
    return NextResponse.json({ post })
  } catch (error) {
    if (isGitHubContentError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : '获取文章详情失败'
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<Params> }) {
  if (!assertAdmin(request)) {
    return unauthorizedResponse()
  }

  try {
    const params = await props.params
    const payload = parseAdminPostInput(await request.json())
    const post = await updateAdminPost(getSourcePath(params), payload)
    return NextResponse.json({ post })
  } catch (error) {
    if (isGitHubContentError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : '更新文章失败'
    return NextResponse.json({ message }, { status: 400 })
  }
}
