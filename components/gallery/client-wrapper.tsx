'use client'

import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { HIDDEN_GALLERY_MDX_COMPONENTS } from './gallery-mdx'

function hasReadableText(raw: string) {
  const contentWithoutImages = raw
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\s+/g, '')

  return contentWithoutImages.length > 0
}

export function GalleryContentRenderer({
  code,
  toc,
  raw,
}: {
  code: string
  toc: any
  raw: string
}) {
  if (!hasReadableText(raw)) return null
  return <MDXLayoutRenderer code={code} components={HIDDEN_GALLERY_MDX_COMPONENTS} toc={toc} />
}
