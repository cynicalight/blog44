import { createHash } from 'node:crypto'
import COS from 'cos-nodejs-sdk-v5'
import sizeOf from 'image-size'
import { MAX_ADMIN_IMAGE_BYTES } from '~/lib/admin-asset-constants'
import {
  buildCosContentKey,
  buildCosObjectKey,
  buildCosPublicUrl,
  readCosConfig,
} from '~/lib/tencent-cos'

const MAX_IMAGE_DIMENSION = 12_000
const MAX_IMAGE_PIXELS = 50_000_000

const IMAGE_FORMATS: Record<string, { contentType: string; extension: string }> = {
  avif: { contentType: 'image/avif', extension: '.avif' },
  gif: { contentType: 'image/gif', extension: '.gif' },
  jpg: { contentType: 'image/jpeg', extension: '.jpg' },
  png: { contentType: 'image/png', extension: '.png' },
  webp: { contentType: 'image/webp', extension: '.webp' },
}

export class AdminAssetUploadError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function inspectImage(contents: Buffer) {
  let dimensions: { type?: string; width?: number; height?: number }

  try {
    dimensions = sizeOf(contents)
  } catch {
    throw new AdminAssetUploadError('无法识别图片内容，请粘贴 PNG、JPEG、WebP、GIF 或 AVIF 图片。')
  }

  const format = dimensions.type ? IMAGE_FORMATS[dimensions.type] : undefined
  if (!format || !dimensions.width || !dimensions.height) {
    throw new AdminAssetUploadError('不支持这种图片格式，请使用 PNG、JPEG、WebP、GIF 或 AVIF。')
  }

  if (
    dimensions.width > MAX_IMAGE_DIMENSION ||
    dimensions.height > MAX_IMAGE_DIMENSION ||
    dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
  ) {
    throw new AdminAssetUploadError('图片尺寸过大，请缩小后再上传。')
  }

  return {
    ...format,
    width: dimensions.width,
    height: dimensions.height,
  }
}

export async function uploadAdminImage(file: File) {
  if (file.size === 0) {
    throw new AdminAssetUploadError('图片内容为空。')
  }
  if (file.size > MAX_ADMIN_IMAGE_BYTES) {
    throw new AdminAssetUploadError('图片不能超过 4 MB。', 413)
  }

  const contents = Buffer.from(await file.arrayBuffer())
  const image = inspectImage(contents)
  const sha256 = createHash('sha256').update(contents).digest('hex')
  const config = readCosConfig(process.env, { requireCredentials: true })

  if (!config.credentials) {
    throw new Error('COS credentials are required')
  }

  const contentKey = buildCosContentKey(sha256, image.extension)
  const objectKey = buildCosObjectKey(config.prefix, contentKey)
  const client = new COS({
    SecretId: config.credentials.secretId,
    SecretKey: config.credentials.secretKey,
    SecurityToken: config.credentials.sessionToken,
    Protocol: 'https:',
    UploadCheckContentMd5: true,
    UploadAddMetaMd5: true,
  })

  try {
    await client.putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: objectKey,
      Body: contents,
      ContentLength: contents.byteLength,
      ContentType: image.contentType,
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=31536000, immutable',
      StorageClass: config.storageClass,
      'x-cos-meta-sha256': sha256,
      'x-cos-meta-source': 'admin-paste',
    })
  } catch {
    throw new AdminAssetUploadError('COS 上传失败，请检查 Vercel 环境变量和 Bucket 写入权限。', 502)
  }

  return {
    url: buildCosPublicUrl(config.publicBaseUrl, objectKey),
    width: image.width,
    height: image.height,
    contentType: image.contentType,
    size: contents.byteLength,
  }
}
