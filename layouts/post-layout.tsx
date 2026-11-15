import type { Author, Blog, Project } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { ReactNode } from 'react'
import { Banner } from '~/components/blog/banner'
import { BlogMeta } from '~/components/blog/blog-meta'
import { Comments } from '~/components/blog/comments'
import { PostNav } from '~/components/blog/post-nav'
import { PostTitle } from '~/components/blog/post-title'
import { ScrollButtons } from '~/components/blog/scroll-buttons'
import { SocialShare } from '~/components/blog/social-share'
import { TagsList } from '~/components/blog/tags'
import { TableOfContents } from '~/components/blog/toc'
import { Container } from '~/components/ui/container'
import { PixelRule, ReadingSurface } from '~/components/lunar/pixel-ui'
import { PostBody } from '~/components/blog/post-body'
import { SITE_METADATA } from '~/data/site-metadata'

interface LayoutProps {
  content: CoreContent<Blog | Project>
  authorDetails: CoreContent<Author>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  /** Extra line under the title (e.g. a project's repository badge). */
  meta?: ReactNode
}

export function PostLayout({ content, next, prev, children, meta }: LayoutProps) {
  let { slug, path, images, lastmod, readingTime, date, title, tags, toc } = content
  let postUrl = `${SITE_METADATA.siteUrl}/${path}`

  return (
    <Container
      // ≥1280px the TOC hugs the window's right edge; keep the article clear of it
      // (14rem TOC + 1.5rem edge + gap on both sides, minus the container padding).
      className="pt-4 lg:pt-12 xl:max-w-[min(72rem,calc(100vw_-_27rem))]"
    >
      <ScrollButtons />
      <ReadingSurface>
        <article className="pt-6">
          <div className="space-y-4">
            <TagsList tags={tags} />
            <PostTitle>{title}</PostTitle>
            {meta}
            <div className="space-y-4 pt-4 md:pt-10">
              <Banner banner={images?.[0] || SITE_METADATA.socialBanner} />
            </div>
            <div className="flex items-center justify-between gap-2 pb-4 lg:pt-2">
              <BlogMeta date={date} lastmod={lastmod} slug={slug} readingTime={readingTime} />
              <SocialShare postUrl={postUrl} title={title} className="hidden md:flex" />
            </div>
          </div>
          <PixelRule className="mb-2 mt-1" />
          <div className="grid grid-cols-1 gap-12 pb-10 pt-8 lg:grid-cols-12 lg:pt-10">
            <div className="divide-y divide-gray-200 dark:divide-gray-700 lg:col-span-8 xl:col-span-12">
              <PostBody>
                <div className="prose max-w-none dark:prose-invert lg:prose-lg lg:pb-8">
                  {children}
                </div>
              </PostBody>
            </div>
            {/* ≥1280px: pinned to the window's right edge, sticky alongside the article. */}
            <aside className="hidden lg:col-span-4 lg:block xl:absolute xl:right-[calc((100%_-_100vw)_/_2_+_1.5rem)] xl:top-0 xl:h-full xl:w-56">
              <div className="lg:sticky lg:top-24">
                <TableOfContents toc={toc} />
              </div>
            </aside>
          </div>
          <PixelRule />
          <div className="space-y-4">
            <PostNav next={next} nextLabel="Next post" prev={prev} prevLabel="Previous post" />
            <Comments slug={slug} />
          </div>
        </article>
      </ReadingSurface>
    </Container>
  )
}
