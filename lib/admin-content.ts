import matter from 'gray-matter'
import { z } from 'zod'
import { buildBlogSourcePath, getSlugFromSourcePath, normalizeTags } from '~/lib/admin-post-utils'
import type { AdminPostDetail, AdminPostInput, AdminPostSummary } from '~/types/admin'

const BLOG_ROOT = 'data/blog'

const postInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(10),
  summary: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  coverImage: z.string().optional().default(''),
  canonicalUrl: z.string().optional().default(''),
  body: z.string().default(''),
})

type GitHubDirectoryEntry = {
  path: string
  type: 'dir' | 'file'
}

type GitHubFile = {
  path: string
  sha: string
  content: string
}

type ParsedPost = {
  detail: AdminPostDetail
  frontmatter: Record<string, unknown>
}

class GitHubContentError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

function getGitHubConfig() {
  const token = process.env.GITHUB_CONTENT_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const branch = process.env.GITHUB_CONTENT_BRANCH || 'main'

  if (!token || !owner || !repo) {
    throw new GitHubContentError(
      'Missing GitHub content configuration. Set GITHUB_CONTENT_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME.',
      500
    )
  }

  return { token, owner, repo, branch }
}

function encodeRepoPath(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getGitHubConfig()
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = `GitHub request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data?.message === 'string') {
        message = data.message
      }
    } catch {
      // ignore json parsing failures
    }
    throw new GitHubContentError(message, response.status)
  }

  return response.json() as Promise<T>
}

async function listDirectory(path: string): Promise<GitHubDirectoryEntry[]> {
  const { owner, repo, branch } = getGitHubConfig()
  const data = await githubRequest<Array<{ path: string; type: 'dir' | 'file' }>>(
    `/repos/${owner}/${repo}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(branch)}`
  )
  return data.map((entry) => ({ path: entry.path, type: entry.type }))
}

async function walkDirectory(path: string): Promise<string[]> {
  const entries = await listDirectory(path)
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (entry.type === 'dir') {
        return walkDirectory(entry.path)
      }
      if (entry.type === 'file' && entry.path.endsWith('.mdx')) {
        return [entry.path]
      }
      return []
    })
  )
  return nested.flat()
}

async function getFile(path: string): Promise<GitHubFile | null> {
  const { owner, repo, branch } = getGitHubConfig()
  try {
    const data = await githubRequest<{
      path: string
      sha: string
      content: string
      encoding: string
    }>(`/repos/${owner}/${repo}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(branch)}`)

    if (data.encoding !== 'base64') {
      throw new GitHubContentError(`Unsupported GitHub content encoding for ${path}`, 500)
    }

    return {
      path: data.path,
      sha: data.sha,
      content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'),
    }
  } catch (error) {
    if (error instanceof GitHubContentError && error.status === 404) {
      return null
    }
    throw error
  }
}

async function getBranchHead() {
  const { owner, repo, branch } = getGitHubConfig()
  const data = await githubRequest<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`
  )
  return data.object.sha
}

async function getCommit(commitSha: string) {
  const { owner, repo } = getGitHubConfig()
  return githubRequest<{ sha: string; tree: { sha: string } }>(
    `/repos/${owner}/${repo}/git/commits/${commitSha}`
  )
}

async function createBlob(content: string) {
  const { owner, repo } = getGitHubConfig()
  const data = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      encoding: 'utf-8',
    }),
  })
  return data.sha
}

async function createTree(
  baseTreeSha: string,
  entries: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string | null }>
) {
  const { owner, repo } = getGitHubConfig()
  const data = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: entries,
    }),
  })
  return data.sha
}

async function createCommit(message: string, treeSha: string, parentSha: string) {
  const { owner, repo } = getGitHubConfig()
  const data = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha],
    }),
  })
  return data.sha
}

async function updateBranch(branchCommitSha: string) {
  const { owner, repo, branch } = getGitHubConfig()
  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: branchCommitSha,
      force: false,
    }),
  })
}

function normalizeDate(value: unknown) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return ''
}

function parsePost(path: string, source: string): ParsedPost {
  const parsed = matter(source)
  const data = parsed.data as Record<string, unknown>
  const coverImage = Array.isArray(data.images)
    ? data.images.find((value) => typeof value === 'string') || ''
    : ''

  return {
    detail: {
      path,
      slug: getSlugFromSourcePath(path),
      title: typeof data.title === 'string' ? data.title : '',
      date: normalizeDate(data.date),
      summary: typeof data.summary === 'string' ? data.summary : '',
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      draft: Boolean(data.draft),
      coverImage,
      canonicalUrl: typeof data.canonicalUrl === 'string' ? data.canonicalUrl : '',
      body: parsed.content,
    },
    frontmatter: data,
  }
}

function serializePost(input: AdminPostInput, existingFrontmatter?: Record<string, unknown>) {
  const next = {
    ...(existingFrontmatter || {}),
    title: input.title.trim(),
    date: input.date,
    tags: normalizeTags(input.tags),
    draft: input.draft,
  } as Record<string, unknown>

  if (input.summary.trim()) {
    next.summary = input.summary.trim()
  } else {
    delete next.summary
  }

  if (input.coverImage.trim()) {
    next.images = [input.coverImage.trim()]
  } else {
    delete next.images
  }

  if (input.canonicalUrl.trim()) {
    next.canonicalUrl = input.canonicalUrl.trim()
  } else {
    delete next.canonicalUrl
  }

  if (!Array.isArray(next.authors) || next.authors.length === 0) {
    next.authors = ['default']
  }

  const normalizedBody = input.body.replace(/\r\n/g, '\n').trimEnd()
  return matter.stringify(normalizedBody ? `${normalizedBody}\n` : '', next)
}

export function parseAdminPostInput(input: unknown) {
  return postInputSchema.parse(input)
}

export async function listAdminPosts(): Promise<AdminPostSummary[]> {
  const paths = await walkDirectory(BLOG_ROOT)
  const posts = await Promise.all(
    paths.map(async (path) => {
      const file = await getFile(path)
      if (!file) {
        return null
      }
      return parsePost(path, file.content).detail
    })
  )

  return posts
    .filter((post): post is AdminPostDetail => Boolean(post))
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ body: _body, ...summary }) => summary)
}

export async function getAdminPost(path: string): Promise<AdminPostDetail> {
  const file = await getFile(path)
  if (!file) {
    throw new GitHubContentError(`Post not found: ${path}`, 404)
  }

  return parsePost(path, file.content).detail
}

export async function createAdminPost(input: AdminPostInput): Promise<AdminPostDetail> {
  const normalized = parseAdminPostInput(input)
  const nextPath = buildBlogSourcePath(normalized.date, normalized.slug)
  const existing = await getFile(nextPath)
  if (existing) {
    throw new GitHubContentError(`Post already exists at ${nextPath}`, 409)
  }

  const source = serializePost(normalized)
  const blobSha = await createBlob(source)
  const parentCommitSha = await getBranchHead()
  const commit = await getCommit(parentCommitSha)
  const treeSha = await createTree(commit.tree.sha, [
    {
      path: nextPath,
      mode: '100644',
      type: 'blob',
      sha: blobSha,
    },
  ])
  const commitSha = await createCommit(
    `content: create post ${getSlugFromSourcePath(nextPath)}`,
    treeSha,
    parentCommitSha
  )
  await updateBranch(commitSha)

  return parsePost(nextPath, source).detail
}

export async function updateAdminPost(
  currentPath: string,
  input: AdminPostInput
): Promise<AdminPostDetail> {
  const normalized = parseAdminPostInput(input)
  const currentFile = await getFile(currentPath)
  if (!currentFile) {
    throw new GitHubContentError(`Post not found: ${currentPath}`, 404)
  }

  const currentParsed = parsePost(currentPath, currentFile.content)
  const nextPath = buildBlogSourcePath(normalized.date, normalized.slug)
  if (nextPath !== currentPath) {
    const conflicting = await getFile(nextPath)
    if (conflicting) {
      throw new GitHubContentError(`Another post already exists at ${nextPath}`, 409)
    }
  }

  const source = serializePost(normalized, currentParsed.frontmatter)
  const blobSha = await createBlob(source)
  const parentCommitSha = await getBranchHead()
  const commit = await getCommit(parentCommitSha)
  const treeEntries: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string | null }> = [
    {
      path: nextPath,
      mode: '100644',
      type: 'blob',
      sha: blobSha,
    },
  ]

  if (nextPath !== currentPath) {
    treeEntries.push({
      path: currentPath,
      mode: '100644',
      type: 'blob',
      sha: null,
    })
  }

  const treeSha = await createTree(commit.tree.sha, treeEntries)
  const commitLabel =
    nextPath === currentPath
      ? `content: update post ${getSlugFromSourcePath(nextPath)}`
      : `content: rename post ${getSlugFromSourcePath(currentPath)} -> ${getSlugFromSourcePath(nextPath)}`
  const commitSha = await createCommit(commitLabel, treeSha, parentCommitSha)
  await updateBranch(commitSha)

  return parsePost(nextPath, source).detail
}

export function isGitHubContentError(error: unknown): error is GitHubContentError {
  return error instanceof GitHubContentError
}
