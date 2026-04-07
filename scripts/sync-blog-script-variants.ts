import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import {
  BLOG_ROOT,
  convertBlogBodyScript,
  convertBlogTextScript,
  getBlogBaseSlugFromSourcePath,
  getBlogScriptVariantFromSourcePath,
  getPairedBlogSourcePath,
  type BlogScriptVariant,
} from '../lib/blog-script'

type SyncTarget = {
  sourcePath: string
}

async function walkDirectory(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name)
      if (entry.isDirectory()) {
        return walkDirectory(entryPath)
      }

      return entry.isFile() && entry.name.endsWith('.mdx') ? [entryPath] : []
    })
  )

  return nested.flat()
}

function normalizeToRepoPath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function buildVariantSource(source: string, targetVariant: BlogScriptVariant) {
  const parsed = matter(source)
  const nextData = { ...parsed.data } as Record<string, unknown>

  if (typeof nextData.title === 'string') {
    nextData.title = convertBlogTextScript(nextData.title, targetVariant)
  }

  if (typeof nextData.summary === 'string') {
    nextData.summary = convertBlogTextScript(nextData.summary, targetVariant)
  }

  const nextBody = convertBlogBodyScript(
    parsed.content.replace(/\r\n/g, '\n'),
    targetVariant
  ).trimEnd()
  return matter.stringify(nextBody ? `${nextBody}\n` : '', nextData)
}

async function syncTarget({ sourcePath }: SyncTarget) {
  const absoluteSourcePath = path.join(process.cwd(), sourcePath)
  const source = await fs.readFile(absoluteSourcePath, 'utf8')
  const sourceVariant = getBlogScriptVariantFromSourcePath(sourcePath)
  const targetVariant = sourceVariant === 'zh-Hant' ? 'zh-Hans' : 'zh-Hant'
  const targetPath = getPairedBlogSourcePath(sourcePath)
  const absoluteTargetPath = path.join(process.cwd(), targetPath)
  const targetSource = buildVariantSource(source, targetVariant)

  await fs.mkdir(path.dirname(absoluteTargetPath), { recursive: true })
  await fs.writeFile(absoluteTargetPath, targetSource, 'utf8')

  return { sourcePath, targetPath }
}

async function collectSyncTargets() {
  const absoluteBlogRoot = path.join(process.cwd(), BLOG_ROOT)
  const files = await walkDirectory(absoluteBlogRoot)
  const grouped = new Map<string, string[]>()

  for (const absolutePath of files) {
    const repoPath = normalizeToRepoPath(path.relative(process.cwd(), absolutePath))
    const baseSlug = getBlogBaseSlugFromSourcePath(repoPath)
    const entries = grouped.get(baseSlug) || []
    entries.push(repoPath)
    grouped.set(baseSlug, entries)
  }

  return Array.from(grouped.values()).map((paths) => {
    const simplified = paths.find(
      (filePath) => getBlogScriptVariantFromSourcePath(filePath) === 'zh-Hans'
    )
    return { sourcePath: simplified || paths[0] }
  })
}

function getCliPaths() {
  const args = process.argv.slice(2)
  const cliPaths: string[] = []

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--path') {
      const nextPath = args[index + 1]
      if (!nextPath) {
        throw new Error('Missing value for --path')
      }
      cliPaths.push(normalizeToRepoPath(nextPath))
      index += 1
    }
  }

  return cliPaths
}

async function main() {
  const cliPaths = getCliPaths()
  const targets =
    cliPaths.length > 0
      ? cliPaths.map((sourcePath) => ({ sourcePath }))
      : await collectSyncTargets()

  if (targets.length === 0) {
    console.log('No blog files found to sync.')
    return
  }

  for (const target of targets) {
    const result = await syncTarget(target)
    console.log(`Synced ${result.sourcePath} -> ${result.targetPath}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
