import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import COS from 'cos-nodejs-sdk-v5'
import sizeOf from 'image-size'
import type { AssetManifest, UploadAssetGroup } from './core'
import {
  buildObjectKey,
  buildPublicUrl,
  classifyAssetPath,
  groupUploadAssets,
  type AssetRecord,
} from './core'
import type { CosConfig } from './config'

type RemoteObjectState = {
  exists: boolean
  sha256?: string
  crc64?: string
}

function readHeader(headers: Record<string, unknown> | undefined, name: string) {
  if (!headers) return undefined
  const target = name.toLowerCase()
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === target)
  return entry?.[1] === undefined ? undefined : String(entry[1])
}

function createClient(config: CosConfig) {
  if (!config.credentials) {
    throw new Error('COS credentials are required for this command')
  }

  return new COS({
    SecretId: config.credentials.secretId,
    SecretKey: config.credentials.secretKey,
    SecurityToken: config.credentials.sessionToken,
    Protocol: 'https:',
    UploadCheckContentMd5: true,
    UploadAddMetaMd5: true,
  })
}

async function inspectRemoteObject(
  client: COS,
  config: CosConfig,
  objectKey: string
): Promise<RemoteObjectState> {
  try {
    const result = await client.headObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: objectKey,
    })
    return {
      exists: true,
      sha256: readHeader(result.headers, 'x-cos-meta-sha256'),
      crc64: readHeader(result.headers, 'x-cos-hash-crc64ecma'),
    }
  } catch (error) {
    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number(error.statusCode)
        : undefined
    if (statusCode === 404) return { exists: false }
    throw error
  }
}

function assertRemoteObject(group: UploadAssetGroup, remote: RemoteObjectState, objectKey: string) {
  const asset = group.representative
  if (!remote.exists) {
    throw new Error(`COS object is missing: ${objectKey}`)
  }
  if (remote.sha256 !== asset.sha256) {
    throw new Error(`COS SHA-256 metadata mismatch: ${objectKey}`)
  }
  if (!remote.crc64) {
    throw new Error(`COS CRC64 metadata is missing: ${objectKey}`)
  }
}

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/vnd.microsoft.icon',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function inspectImage(contents: Buffer, asset: AssetRecord, location: string) {
  if (asset.kind !== 'image') return null

  let dimensions: ReturnType<typeof sizeOf>
  try {
    dimensions = sizeOf(contents)
  } catch {
    throw new Error(`Compressed image cannot be decoded: ${location}`)
  }

  if (
    asset.width &&
    asset.height &&
    (dimensions.width !== asset.width || dimensions.height !== asset.height)
  ) {
    throw new Error(`Compressed image dimensions changed: ${location}`)
  }

  const contentType = dimensions.type ? IMAGE_CONTENT_TYPES[dimensions.type] : undefined
  if (!contentType) {
    throw new Error(`Compressed image format is unsupported: ${location}`)
  }

  return contentType
}

async function readVerifiedAssetBytes(repoRoot: string, asset: AssetRecord) {
  const absolutePath = path.resolve(repoRoot, asset.sourcePath)
  const relativePath = path.relative(repoRoot, absolutePath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Asset path escapes the repository: ${asset.sourcePath}`)
  }

  const classification = classifyAssetPath(asset.sourcePath)
  if (!classification || classification.kind !== asset.kind || asset.migration !== 'upload') {
    throw new Error(`Manifest contains an invalid upload source: ${asset.sourcePath}`)
  }

  const contents = await readFile(absolutePath)
  const sha256 = createHash('sha256').update(contents).digest('hex')
  if (sha256 !== asset.sha256 || contents.byteLength !== asset.size) {
    throw new Error(`Asset changed after inventory: ${asset.sourcePath}`)
  }

  return contents
}

async function verifyDownloadedObject(
  client: COS,
  config: CosConfig,
  asset: AssetRecord,
  objectKey: string,
  expectedCrc64: string
) {
  const result = await client.getObject({
    Bucket: config.bucket,
    Region: config.region,
    Key: objectKey,
  })
  const contents = Buffer.from(result.Body)
  if (contents.byteLength === 0) {
    throw new Error(`Downloaded COS object is empty: ${objectKey}`)
  }

  const sha256 = createHash('sha256').update(contents).digest('hex')
  if (asset.kind === 'font' && (sha256 !== asset.sha256 || contents.byteLength !== asset.size)) {
    throw new Error(`Downloaded COS font does not match its manifest: ${objectKey}`)
  }

  const contentType = readHeader(result.headers, 'content-type')?.split(';')[0]
  const detectedContentType = inspectImage(contents, asset, objectKey)
  const expectedContentType = detectedContentType || asset.contentType
  if (contentType !== expectedContentType) {
    throw new Error(`Downloaded COS object content type mismatch: ${objectKey}`)
  }

  const downloadedCrc64 = readHeader(result.headers, 'x-cos-hash-crc64ecma')
  if (downloadedCrc64 && downloadedCrc64 !== expectedCrc64) {
    throw new Error(`COS CRC64 changed between HEAD and GET: ${objectKey}`)
  }

  return {
    contents,
    sha256,
    size: contents.byteLength,
    contentType: expectedContentType,
  }
}

async function assertPublicResponse(
  response: Response,
  expected: { sha256: string; size: number; contentType: string },
  publicUrl: string
) {
  if (!response.ok) {
    throw new Error(`Public asset returned HTTP ${response.status}: ${publicUrl}`)
  }
  if (new URL(response.url).protocol !== 'https:') {
    throw new Error(`Public asset redirected away from HTTPS: ${publicUrl}`)
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]
  if (contentType !== expected.contentType) {
    throw new Error(`Public asset content type mismatch: ${publicUrl}`)
  }

  const cacheControl = response.headers.get('cache-control') || ''
  if (!cacheControl.includes('max-age=31536000')) {
    throw new Error(`Public asset cache policy mismatch: ${publicUrl}`)
  }

  const contentLength = response.headers.get('content-length')
  const contentEncoding = response.headers.get('content-encoding')
  if (!contentEncoding && contentLength && Number(contentLength) !== expected.size) {
    throw new Error(`Public asset size mismatch: ${publicUrl}`)
  }

  const contents = Buffer.from(await response.arrayBuffer())
  const sha256 = createHash('sha256').update(contents).digest('hex')
  if (sha256 !== expected.sha256 || contents.byteLength !== expected.size) {
    throw new Error(`Public asset differs from the authenticated COS response: ${publicUrl}`)
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let nextIndex = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

export async function uploadManifestAssets(
  repoRoot: string,
  manifest: AssetManifest,
  config: CosConfig
) {
  const client = createClient(config)
  const groups = groupUploadAssets(manifest.assets)
  let uploaded = 0
  let skipped = 0

  await runWithConcurrency(groups, 4, async (group, index) => {
    const asset = group.representative
    const contents = await readVerifiedAssetBytes(repoRoot, asset)
    const objectKey = buildObjectKey(config.prefix, asset.contentKey)
    const remote = await inspectRemoteObject(client, config, objectKey)

    if (remote.exists) {
      assertRemoteObject(group, remote, objectKey)
      skipped += 1
      console.log(`[${index + 1}/${groups.length}] verified ${objectKey}`)
      return
    }

    await client.putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: objectKey,
      Body: contents,
      ContentLength: contents.byteLength,
      ContentType: asset.contentType,
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=31536000, immutable',
      StorageClass: config.storageClass,
      'x-cos-meta-sha256': asset.sha256,
      'x-cos-meta-source-count': String(group.sourcePaths.length),
    })

    const uploadedObject = await inspectRemoteObject(client, config, objectKey)
    assertRemoteObject(group, uploadedObject, objectKey)
    uploaded += 1
    console.log(`[${index + 1}/${groups.length}] uploaded ${objectKey}`)
  })

  return { uploaded, skipped, total: groups.length }
}

export async function verifyManifestAssets(manifest: AssetManifest, config: CosConfig) {
  const client = createClient(config)
  const groups = groupUploadAssets(manifest.assets)

  await runWithConcurrency(groups, 4, async (group, index) => {
    const asset = group.representative
    const objectKey = buildObjectKey(config.prefix, asset.contentKey)
    const remote = await inspectRemoteObject(client, config, objectKey)
    assertRemoteObject(group, remote, objectKey)
    const downloaded = await verifyDownloadedObject(client, config, asset, objectKey, remote.crc64!)

    const publicUrl = buildPublicUrl(config.publicBaseUrl, objectKey)
    const response = await fetch(publicUrl, { redirect: 'follow' })
    await assertPublicResponse(response, downloaded, publicUrl)

    const processing =
      downloaded.size === asset.size ? '' : ` (${asset.size} -> ${downloaded.size} B)`
    console.log(`[${index + 1}/${groups.length}] verified ${objectKey}${processing}`)
  })

  return { verified: groups.length }
}
