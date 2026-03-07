import { slug as githubSlug } from 'github-slugger'

const BLOG_ROOT = 'data/blog'

export function sanitizePostSlug(input: string) {
  const lastSegment = input
    .trim()
    .replace(/\.mdx?$/i, '')
    .split('/')
    .filter(Boolean)
    .pop()

  return githubSlug(lastSegment || '')
}

export function getPostYear(date: string) {
  const normalized = date.trim()
  const year = normalized.slice(0, 4)
  if (!/^\d{4}$/.test(year)) {
    throw new Error('date must start with YYYY-MM-DD')
  }
  return year
}

export function buildBlogSourcePath(date: string, slug: string) {
  const year = getPostYear(date)
  const sanitizedSlug = sanitizePostSlug(slug)
  if (!sanitizedSlug) {
    throw new Error('slug is required')
  }
  return `${BLOG_ROOT}/${year}/${sanitizedSlug}.mdx`
}

export function getSlugFromSourcePath(path: string) {
  return (
    path
      .split('/')
      .pop()
      ?.replace(/\.mdx$/i, '') || ''
  )
}

export function getPublicBlogPathFromSourcePath(path: string) {
  return `/blog/${path.replace(/^data\/blog\//, '').replace(/\.mdx$/i, '')}`
}

export function encodeAdminApiPath(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function normalizeTags(input: string[]) {
  return input.map((tag) => tag.trim()).filter(Boolean)
}
