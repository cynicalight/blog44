export type AdminContentType = 'blog' | 'gallery'

export type AdminSessionUser = {
  email: string
}

export type AdminPostSummary = {
  path: string
  contentType: AdminContentType
  slug: string
  title: string
  date: string
  draft: boolean
  tags: string[]
  summary: string
  coverImage: string
  canonicalUrl: string
}

export type AdminPostDetail = AdminPostSummary & {
  body: string
}

export type AdminPostInput = {
  contentType: AdminContentType
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  draft: boolean
  coverImage: string
  canonicalUrl: string
  body: string
}
