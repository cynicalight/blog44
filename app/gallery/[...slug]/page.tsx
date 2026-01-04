import type { Author, Gallery } from 'contentlayer/generated'
import { allAuthors, allGalleries } from 'contentlayer/generated'
import 'css/prism.css'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allCoreContent, coreContent, sortPosts } from 'pliny/utils/contentlayer'
import { SITE_METADATA } from '~/data/site-metadata'
import { GalleryLayout } from '~/layouts/gallery-layout'
import { GalleryContentRenderer } from '~/components/gallery/client-wrapper'

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const gallery = allGalleries.find((s) => s.slug === slug)
  const authorList = gallery?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Author)
  })
  if (!gallery) {
    return
  }

  const publishedAt = new Date(gallery.date).toISOString()
  const modifiedAt = new Date(gallery.lastmod || gallery.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [SITE_METADATA.socialBanner]
  if (gallery.images) {
    imageList = typeof gallery.images === 'string' ? [gallery.images] : gallery.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : SITE_METADATA.siteUrl + img,
    }
  })

  return {
    title: gallery.title,
    description: gallery.summary,
    openGraph: {
      title: gallery.title,
      description: gallery.summary,
      siteName: SITE_METADATA.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [SITE_METADATA.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: gallery.title,
      description: gallery.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  return allGalleries.map((s) => ({ slug: s.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allGalleries))
  const galleryIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (galleryIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[galleryIndex + 1]
  const next = sortedCoreContents[galleryIndex - 1]
  const gallery = allGalleries.find((p) => p.slug === slug) as Gallery
  const authorList = gallery?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Author)
  })
  const mainContent = coreContent(gallery)
  const jsonLd = gallery.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryLayout content={mainContent} next={next} prev={prev}>
        <GalleryContentRenderer code={gallery.body.code} toc={gallery.toc} />
      </GalleryLayout>
    </>
  )
}
