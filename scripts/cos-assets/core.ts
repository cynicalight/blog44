import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sizeOf from 'image-size'
import mime from 'mime'
import { z } from 'zod'
import {
  buildCosContentKey as buildContentKey,
  buildCosObjectKey as buildObjectKey,
  buildCosPublicUrl as buildPublicUrl,
  normalizeCosPrefix as normalizePrefix,
} from '~/lib/tencent-cos'

export { buildContentKey, buildObjectKey, buildPublicUrl, normalizePrefix }

const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
])

const FONT_EXTENSIONS = new Set(['.otf', '.ttf', '.woff', '.woff2'])

export type AssetKind = 'image' | 'font'
export type AssetMigration = 'upload' | 'retain' | 'review' | 'discard'

export const AssetRecordSchema = z
  .object({
    sourcePath: z.string().min(1),
    kind: z.enum(['image', 'font']),
    migration: z.enum(['upload', 'retain', 'review', 'discard']),
    size: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    extension: z.string().regex(/^\.[a-z0-9]+$/),
    contentType: z.string().min(1),
    contentKey: z.string().min(1),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  })
  .strict()

export const AssetSummarySchema = z
  .object({
    trackedPaths: z.number().int().nonnegative(),
    uploadPaths: z.number().int().nonnegative(),
    uploadObjects: z.number().int().nonnegative(),
    uploadBytes: z.number().int().nonnegative(),
    uniqueUploadBytes: z.number().int().nonnegative(),
    retainPaths: z.number().int().nonnegative(),
    reviewPaths: z.number().int().nonnegative(),
    discardPaths: z.number().int().nonnegative(),
  })
  .strict()

export const AssetManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    includeFonts: z.boolean(),
    assets: z.array(AssetRecordSchema),
    summary: AssetSummarySchema,
  })
  .strict()

export type AssetRecord = z.infer<typeof AssetRecordSchema>
export type AssetManifest = z.infer<typeof AssetManifestSchema>
export type AssetSummary = z.infer<typeof AssetSummarySchema>

export type UploadAssetGroup = {
  representative: AssetRecord
  sourcePaths: string[]
}

export function normalizeRepoPath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

export function classifyAssetPath(filePath: string): {
  kind: AssetKind
  migration: AssetMigration
} | null {
  const repoPath = normalizeRepoPath(filePath)
  const extension = path.posix.extname(repoPath).toLowerCase()

  if (IMAGE_EXTENSIONS.has(extension)) {
    return {
      kind: 'image',
      migration:
        extension === '.svg'
          ? 'retain'
          : repoPath.startsWith('output/playwright/')
            ? 'discard'
            : 'upload',
    }
  }

  if (FONT_EXTENSIONS.has(extension)) {
    return { kind: 'font', migration: 'review' }
  }

  return null
}

export function groupUploadAssets(assets: AssetRecord[]): UploadAssetGroup[] {
  const groups = new Map<string, UploadAssetGroup>()

  for (const asset of assets) {
    if (asset.migration !== 'upload') continue

    const existing = groups.get(asset.contentKey)
    if (existing) {
      existing.sourcePaths.push(asset.sourcePath)
      continue
    }

    groups.set(asset.contentKey, {
      representative: asset,
      sourcePaths: [asset.sourcePath],
    })
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      sourcePaths: group.sourcePaths.sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) =>
      left.representative.contentKey.localeCompare(right.representative.contentKey)
    )
}

export function parseAssetManifest(value: unknown) {
  return AssetManifestSchema.parse(value)
}

export function summarizeAssets(assets: AssetRecord[]): AssetSummary {
  const uploadAssets = assets.filter((asset) => asset.migration === 'upload')
  const uploadGroups = groupUploadAssets(uploadAssets)

  return {
    trackedPaths: assets.length,
    uploadPaths: uploadAssets.length,
    uploadObjects: uploadGroups.length,
    uploadBytes: uploadAssets.reduce((total, asset) => total + asset.size, 0),
    uniqueUploadBytes: uploadGroups.reduce((total, group) => total + group.representative.size, 0),
    retainPaths: assets.filter((asset) => asset.migration === 'retain').length,
    reviewPaths: assets.filter((asset) => asset.migration === 'review').length,
    discardPaths: assets.filter((asset) => asset.migration === 'discard').length,
  }
}

async function inspectAsset(
  repoRoot: string,
  sourcePath: string,
  includeFonts: boolean
): Promise<AssetRecord | null> {
  const classification = classifyAssetPath(sourcePath)
  if (!classification) return null

  const absolutePath = path.join(repoRoot, sourcePath)
  const contents = await readFile(absolutePath)
  const sha256 = createHash('sha256').update(contents).digest('hex')
  const extension = path.posix.extname(sourcePath).toLowerCase()
  const migration =
    classification.kind === 'font' && includeFonts ? 'upload' : classification.migration
  const record: AssetRecord = {
    sourcePath,
    kind: classification.kind,
    migration,
    size: contents.byteLength,
    sha256,
    extension,
    contentType: mime.getType(extension) || 'application/octet-stream',
    contentKey: buildContentKey(sha256, extension),
  }

  if (classification.kind === 'image' && extension !== '.ico') {
    try {
      const dimensions = sizeOf(contents)
      if (dimensions.width && dimensions.height) {
        record.width = dimensions.width
        record.height = dimensions.height
      }
    } catch {
      // Some retained SVGs use percentages or omit a viewBox, so dimensions are optional.
    }
  }

  return record
}

export async function createAssetManifest(
  repoRoot: string,
  trackedPaths: string[],
  options: { includeFonts: boolean }
): Promise<AssetManifest> {
  const records = await Promise.all(
    trackedPaths
      .map(normalizeRepoPath)
      .sort((left, right) => left.localeCompare(right))
      .map((sourcePath) => inspectAsset(repoRoot, sourcePath, options.includeFonts))
  )
  const assets = records.filter((record): record is AssetRecord => record !== null)

  return {
    schemaVersion: 1,
    includeFonts: options.includeFonts,
    assets,
    summary: summarizeAssets(assets),
  }
}
