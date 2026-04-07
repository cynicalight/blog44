import * as OpenCC from 'opencc-js'

export const BLOG_HANT_SUFFIX = '.zh-Hant'
export const BLOG_HANT_ROUTE_SEGMENT = 'zh-hant'
export const BLOG_ROOT = 'data/blog'
export const BLOG_SCRIPT_PREFERENCE_KEY = 'preferred-blog-script'

export type BlogScriptVariant = 'zh-Hans' | 'zh-Hant'

export const DEFAULT_BLOG_SCRIPT_VARIANT: BlogScriptVariant = 'zh-Hant'

const SIMPLIFIED_TO_TRADITIONAL = OpenCC.Converter({ from: 'cn', to: 'tw' })
const TRADITIONAL_TO_SIMPLIFIED = OpenCC.Converter({ from: 'tw', to: 'cn' })
const PROTECTED_TOKEN_PREFIX = '__BLOG_SCRIPT_PROTECTED_'

type BlogLike = {
  filePath?: string
  path?: string
}

export function stripBlogScriptVariantSuffix(value: string) {
  return value.replace(/\.zh-Hant$/i, '')
}

export function getBlogScriptVariantFromSourcePath(sourcePath: string): BlogScriptVariant {
  return sourcePath.endsWith(`${BLOG_HANT_SUFFIX}.mdx`) ? 'zh-Hant' : 'zh-Hans'
}

export function getBlogScriptVariantFromFlattenedPath(flattenedPath: string): BlogScriptVariant {
  return flattenedPath.endsWith(BLOG_HANT_SUFFIX) ? 'zh-Hant' : 'zh-Hans'
}

export function getBlogScriptVariantFromRoutePath(path: string): BlogScriptVariant {
  return path === `blog/${BLOG_HANT_ROUTE_SEGMENT}` ||
    path.startsWith(`blog/${BLOG_HANT_ROUTE_SEGMENT}/`)
    ? 'zh-Hant'
    : 'zh-Hans'
}

export function getBlogScriptVariant(value: BlogLike): BlogScriptVariant {
  if (value.filePath?.startsWith('blog/')) {
    return getBlogScriptVariantFromFlattenedPath(value.filePath.replace(/\.mdx$/i, ''))
  }

  if (value.path) {
    return getBlogScriptVariantFromRoutePath(value.path)
  }

  return DEFAULT_BLOG_SCRIPT_VARIANT
}

export function isDefaultBlogScriptVariant(value: BlogLike) {
  return getBlogScriptVariant(value) === DEFAULT_BLOG_SCRIPT_VARIANT
}

export function getBlogBaseSlugFromSourcePath(sourcePath: string) {
  return stripBlogScriptVariantSuffix(
    sourcePath.replace(new RegExp(`^${BLOG_ROOT}/`), '').replace(/\.mdx$/i, '')
  )
}

export function getBlogBaseSlugFromFlattenedPath(flattenedPath: string) {
  return stripBlogScriptVariantSuffix(flattenedPath.replace(/^blog\//, ''))
}

export function getBlogBaseSlugFromRoutePath(path: string) {
  return path.replace(new RegExp(`^blog/${BLOG_HANT_ROUTE_SEGMENT}/`), '').replace(/^blog\//, '')
}

export function getLocalizedBlogPath(baseSlug: string, scriptVariant: BlogScriptVariant) {
  return scriptVariant === 'zh-Hant'
    ? `blog/${BLOG_HANT_ROUTE_SEGMENT}/${baseSlug}`
    : `blog/${baseSlug}`
}

export function getLocalizedBlogHref(baseSlug: string, scriptVariant: BlogScriptVariant) {
  return `/${getLocalizedBlogPath(baseSlug, scriptVariant)}`
}

export function getPairedBlogScriptVariant(scriptVariant: BlogScriptVariant): BlogScriptVariant {
  return scriptVariant === 'zh-Hant' ? 'zh-Hans' : 'zh-Hant'
}

export function getPairedBlogSourcePath(sourcePath: string) {
  if (getBlogScriptVariantFromSourcePath(sourcePath) === 'zh-Hant') {
    return sourcePath.replace(/\.zh-Hant\.mdx$/i, '.mdx')
  }

  return sourcePath.replace(/\.mdx$/i, `${BLOG_HANT_SUFFIX}.mdx`)
}

export function appendBlogScriptVariant(basePath: string, scriptVariant: BlogScriptVariant) {
  return scriptVariant === 'zh-Hant' ? `${basePath}${BLOG_HANT_SUFFIX}` : basePath
}

export function getLocalizedContentPath(flattenedPath: string) {
  if (!flattenedPath.startsWith('blog/')) {
    return flattenedPath
  }

  return getLocalizedBlogPath(
    getBlogBaseSlugFromFlattenedPath(flattenedPath),
    getBlogScriptVariantFromFlattenedPath(flattenedPath)
  )
}

export function convertBlogTextScript(value: string, targetVariant: BlogScriptVariant) {
  if (!value) {
    return value
  }

  return targetVariant === 'zh-Hant'
    ? SIMPLIFIED_TO_TRADITIONAL(value)
    : TRADITIONAL_TO_SIMPLIFIED(value)
}

function protectSegments(source: string, pattern: RegExp, protectedSegments: string[]) {
  return source.replace(pattern, (match) => {
    const token = `${PROTECTED_TOKEN_PREFIX}${protectedSegments.length}__`
    protectedSegments.push(match)
    return token
  })
}

function restoreSegments(source: string, protectedSegments: string[]) {
  return source.replace(/__BLOG_SCRIPT_PROTECTED_(\d+)__/g, (_match, index) => {
    const value = protectedSegments[Number(index)]
    return typeof value === 'string' ? value : _match
  })
}

export function convertBlogBodyScript(source: string, targetVariant: BlogScriptVariant) {
  if (!source.trim()) {
    return source
  }

  const protectedSegments: string[] = []
  let next = source

  // Keep MDX syntax, code blocks, math, and URLs intact while converting visible prose.
  next = protectSegments(next, /```[\s\S]*?```/g, protectedSegments)
  next = protectSegments(next, /~~~[\s\S]*?~~~/g, protectedSegments)
  next = protectSegments(next, /\$\$[\s\S]*?\$\$/g, protectedSegments)
  next = protectSegments(next, /\\\[[\s\S]*?\\\]/g, protectedSegments)
  next = protectSegments(next, /`[^`\n]+`/g, protectedSegments)
  next = protectSegments(next, /<!--([\s\S]*?)-->/g, protectedSegments)
  next = protectSegments(next, /^(?:import|export)\s.+$/gm, protectedSegments)
  next = protectSegments(next, /<\/?[A-Za-z][^>\n]*?>/g, protectedSegments)
  next = protectSegments(next, /\]\([^\s)]+(?:\s+"[^"]*")?\)/g, protectedSegments)
  next = protectSegments(next, /https?:\/\/[^\s)]+/g, protectedSegments)
  next = protectSegments(next, /\$[^$\n]+\$/g, protectedSegments)

  return restoreSegments(convertBlogTextScript(next, targetVariant), protectedSegments)
}

export function toTraditionalBlogPathname(pathname: string) {
  if (pathname === '/blog') {
    return `/blog/${BLOG_HANT_ROUTE_SEGMENT}`
  }

  if (pathname.startsWith('/blog/') && !pathname.startsWith(`/blog/${BLOG_HANT_ROUTE_SEGMENT}/`)) {
    return `/blog/${BLOG_HANT_ROUTE_SEGMENT}/${pathname.slice('/blog/'.length)}`
  }

  return pathname
}

export function toSimplifiedBlogPathname(pathname: string) {
  if (pathname === `/blog/${BLOG_HANT_ROUTE_SEGMENT}`) {
    return '/blog'
  }

  if (pathname.startsWith(`/blog/${BLOG_HANT_ROUTE_SEGMENT}/`)) {
    return `/blog/${pathname.slice(`/blog/${BLOG_HANT_ROUTE_SEGMENT}/`.length)}`
  }

  return pathname
}

export function isBlogPathname(pathname: string) {
  return pathname === '/blog' || pathname.startsWith('/blog/')
}

export function filterBlogsByScriptVariant<T extends BlogLike>(
  posts: T[],
  scriptVariant: BlogScriptVariant
) {
  return posts.filter((post) => getBlogScriptVariant(post) === scriptVariant)
}
