import { clsx } from 'clsx'
import type { Blog } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { ReactNode } from 'react'
import { Banner } from '~/components/blog/banner'
import { BlogMeta } from '~/components/blog/blog-meta'
import { Comments } from '~/components/blog/comments'
import { PostTitle } from '~/components/blog/post-title'
import { ScrollButtons } from '~/components/blog/scroll-buttons'
import { SocialShare } from '~/components/blog/social-share'
import { TagsList } from '~/components/blog/tags'
import { Container } from '~/components/ui/container'
import { ReadingSurface } from '~/components/lunar/pixel-ui'
import { SITE_METADATA } from '~/data/site-metadata'

interface LayoutProps {
  content: CoreContent<Blog>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export function PostBanner({ content, children }: LayoutProps) {
  const { slug, path, title, images, date, lastmod, readingTime, tags, toc } = content
  const postUrl = `${SITE_METADATA.siteUrl}/${path}`

  return (
    <Container className="pt-4 lg:pt-12">
      <ScrollButtons />
      <ReadingSurface>
        <article className="space-y-6 pt-6 lg:space-y-16">
          <div className="space-y-4">
            <TagsList tags={tags} />
            <PostTitle>{title}</PostTitle>
            <dl>
              <div>
                <dt className="sr-only">Published on</dt>
                <BlogMeta date={date} lastmod={lastmod} slug={slug} readingTime={readingTime} />
              </div>
            </dl>
            <div className="space-y-4 pt-4 md:pt-10">
              <Banner
                banner={images?.[0] || SITE_METADATA.socialBanner}
                className="-mx-4 sm:-mx-8 md:-mx-10"
              />
            </div>
          </div>
          <div className="prose prose-lg max-w-none dark:prose-invert">{children}</div>
          <div className="space-y-8 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-end">
              <SocialShare postUrl={postUrl} title={title} />
            </div>
            <Comments slug={slug} />
          </div>
        </article>
      </ReadingSurface>
    </Container>
  )
}

function Credit({ image, className }: { image: string; className?: string }) {
  const [, author, id] = image.split('__')
  if (author && id) {
    return (
      <div className={clsx('text-right text-sm italic', className)}>
        Photo by{' '}
        <a
          className="text-primary-500 underline-offset-4 hover:underline dark:text-primary-400"
          href={`https://unsplash.com/@${author}`}
          target="_blank"
          rel="noreferrer"
        >
          <span data-umami-event="banner-author">@{author}</span>
        </a>{' '}
        on{' '}
        <a
          className="text-primary-500 underline-offset-4 hover:underline dark:text-primary-400"
          href={`https://unsplash.com/photos/${id}`}
          target="_blank"
          rel="noreferrer"
          data-umami-event="unsplash-link"
        >
          <span data-umami-event="banner-unsplash">Unsplash</span>
        </a>
      </div>
    )
  }
  return null
}
