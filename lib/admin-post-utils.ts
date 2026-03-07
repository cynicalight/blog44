import { slug as githubSlug } from 'github-slugger'
import type { AdminContentType } from '~/types/admin'

const BLOG_ROOT = 'data/blog'
const GALLERY_ROOT = 'data/gallery'

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
  return buildContentSourcePath(BLOG_ROOT, date, slug)
}

export function buildGallerySourcePath(date: string, slug: string) {
  return buildContentSourcePath(GALLERY_ROOT, date, slug)
}

export function buildSourcePath(contentType: AdminContentType, date: string, slug: string) {
  return contentType === 'gallery'
    ? buildGallerySourcePath(date, slug)
    : buildBlogSourcePath(date, slug)
}

function buildContentSourcePath(root: string, date: string, slug: string) {
  const year = getPostYear(date)
  const sanitizedSlug = sanitizePostSlug(slug)
  if (!sanitizedSlug) {
    throw new Error('slug is required')
  }
  return `${root}/${year}/${sanitizedSlug}.mdx`
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

export function getPublicGalleryPathFromSourcePath(path: string) {
  return `/gallery/${path.replace(/^data\/gallery\//, '').replace(/\.mdx$/i, '')}`
}

export function getContentTypeFromSourcePath(path: string): AdminContentType {
  if (path.startsWith(`${GALLERY_ROOT}/`)) {
    return 'gallery'
  }
  return 'blog'
}

export function getPublicPathFromSourcePath(path: string) {
  return getContentTypeFromSourcePath(path) === 'gallery'
    ? getPublicGalleryPathFromSourcePath(path)
    : getPublicBlogPathFromSourcePath(path)
}

export function isManagedContentPath(path: string) {
  return (
    (path.startsWith(`${BLOG_ROOT}/`) || path.startsWith(`${GALLERY_ROOT}/`)) &&
    path.endsWith('.mdx')
  )
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
