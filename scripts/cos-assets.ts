#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseEnvFile } from 'dotenv'
import { readCosConfig } from './cos-assets/config'
import {
  buildObjectKey,
  buildPublicUrl,
  createAssetManifest,
  groupUploadAssets,
  parseAssetManifest,
  type AssetManifest,
} from './cos-assets/core'
import { uploadManifestAssets, verifyManifestAssets } from './cos-assets/cos'

const repoRoot = process.cwd()
const manifestPath = path.join(repoRoot, 'data/cos-assets-manifest.json')

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KiB', 'MiB', 'GiB']
  let value = bytes
  let unit = -1
  do {
    value /= 1024
    unit += 1
  } while (value >= 1024 && unit < units.length - 1)
  return `${value.toFixed(1)} ${units[unit]}`
}

function getTrackedPaths() {
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return output.split('\0').filter(Boolean)
}

function hasFlag(name: string) {
  return process.argv.slice(3).includes(name)
}

function printManifestSummary(manifest: AssetManifest) {
  const { summary } = manifest
  console.log(`Tracked asset paths: ${summary.trackedPaths}`)
  console.log(`Upload paths: ${summary.uploadPaths}`)
  console.log(`Unique COS objects: ${summary.uploadObjects}`)
  console.log(`Upload bytes before deduplication: ${formatBytes(summary.uploadBytes)}`)
  console.log(`Unique upload bytes: ${formatBytes(summary.uniqueUploadBytes)}`)
  console.log(`Retained locally: ${summary.retainPaths}`)
  console.log(`Awaiting scope decision: ${summary.reviewPaths}`)
  console.log(`Marked for deletion: ${summary.discardPaths}`)
}

async function readManifest() {
  const source = await readFile(manifestPath, 'utf8')
  return parseAssetManifest(JSON.parse(source))
}

async function inventory() {
  const manifest = await createAssetManifest(repoRoot, getTrackedPaths(), {
    includeFonts: hasFlag('--include-fonts'),
  })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${path.relative(repoRoot, manifestPath)}`)
  printManifestSummary(manifest)
}

async function loadCosEnvironment(requireCredentials: boolean) {
  const source = await readFile(path.join(repoRoot, '.env.local'), 'utf8')
  return readCosConfig(parseEnvFile(source), { requireCredentials })
}

async function assertManifestIsCurrent(expected: AssetManifest) {
  const current = await createAssetManifest(repoRoot, getTrackedPaths(), {
    includeFonts: expected.includeFonts,
  })

  if (JSON.stringify(expected) !== JSON.stringify(current)) {
    throw new Error(
      'COS asset manifest is stale. Run pnpm assets:inventory and review the changes.'
    )
  }
}

async function upload() {
  const manifest = await readManifest()
  await assertManifestIsCurrent(manifest)
  const apply = hasFlag('--apply')
  const config = await loadCosEnvironment(apply)
  const groups = groupUploadAssets(manifest.assets)

  if (!apply) {
    console.log('Dry run only. No COS requests were made.')
    console.log(`Bucket: ${config.bucket}`)
    console.log(`Region: ${config.region}`)
    console.log(`Storage class: ${config.storageClass}`)
    console.log(`Prefix: ${config.prefix}`)
    console.log(`Objects: ${groups.length}`)
    console.log(`Bytes: ${formatBytes(manifest.summary.uniqueUploadBytes)}`)
    for (const group of groups.slice(0, 10)) {
      const objectKey = buildObjectKey(config.prefix, group.representative.contentKey)
      console.log(
        `${group.representative.sourcePath} -> ${buildPublicUrl(config.publicBaseUrl, objectKey)}`
      )
    }
    if (groups.length > 10) console.log(`...and ${groups.length - 10} more objects`)
    console.log('Run pnpm assets:upload --apply to perform the upload.')
    return
  }

  const result = await uploadManifestAssets(repoRoot, manifest, config)
  console.log(
    `COS upload complete: ${result.uploaded} uploaded, ${result.skipped} already verified, ${result.total} total.`
  )
}

async function verify() {
  const manifest = await readManifest()
  const config = await loadCosEnvironment(true)
  const result = await verifyManifestAssets(manifest, config)
  console.log(`COS verification complete: ${result.verified} objects verified.`)
}

async function check() {
  const expected = await readManifest()
  await assertManifestIsCurrent(expected)
  console.log('COS asset manifest matches every currently tracked asset.')
}

function printUsage() {
  console.log(`Usage:
  pnpm assets:inventory [--include-fonts]
  pnpm assets:upload [--apply]
  pnpm assets:verify
  pnpm assets:check`)
}

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'inventory':
      await inventory()
      break
    case 'upload':
      await upload()
      break
    case 'verify':
      await verify()
      break
    case 'check':
      await check()
      break
    default:
      printUsage()
      process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'COS asset command failed')
  process.exit(1)
})
