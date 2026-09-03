import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AdminAssetUploadError, uploadAdminImage } from '~/lib/admin-assets'
import { verifyAdminSessionToken } from '~/lib/admin-auth'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function unauthorizedResponse() {
  return NextResponse.json({ message: '未登录' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const session = verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return unauthorizedResponse()
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: '拒绝跨站上传请求' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new AdminAssetUploadError('请求中没有图片文件。')
    }

    const asset = await uploadAdminImage(file)
    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    if (error instanceof AdminAssetUploadError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : '图片上传失败'
    return NextResponse.json({ message }, { status: 500 })
  }
}
