import type { Gallery } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { ReactNode } from 'react'
import { BlogMeta } from '~/components/blog/blog-meta'
import { TagsList } from '~/components/blog/tags'
import { Comments } from '~/components/blog/comments'
import { PostTitle } from '~/components/blog/post-title'
import { ScrollButtons } from '~/components/blog/scroll-buttons'
import { SocialShare } from '~/components/blog/social-share'
import { Container } from '~/components/ui/container'
import { SITE_METADATA } from '~/data/site-metadata'
import { EditOnGithub } from '~/components/blog/edit-on-github'
import { ParallaxGallery } from '~/components/gallery/parallax-gallery'

interface GalleryLayoutProps {
  content: CoreContent<Gallery>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export function GalleryLayout({ content, children }: GalleryLayoutProps) {
  const { slug, date, title, type, tags, readingTime, filePath } = content
  // 从 content 中安全地提取 imagesList，如果不存在则使用空数组
  const imagesList = (content as any).imagesList || []
  const postUrl = `${SITE_METADATA.siteUrl}/${type.toLowerCase()}/${slug}`

  // 确保 imagesList 是正确的格式，兼容旧的字符串数组和新的对象数组
  const galleryImages = Array.isArray(imagesList)
    ? imagesList.map((item: any) => {
        if (typeof item === 'string') {
          return { src: item, aspectRatio: 1.5 }
        }
        return item as { src: string; aspectRatio: number }
      })
    : []

  return (
    <Container className="pt-4 lg:pt-12">
      <ScrollButtons />
      <article className="space-y-4 pt-4 lg:space-y-8">
        <div className="space-y-4">
          <TagsList tags={tags} />
          <PostTitle>{title}</PostTitle>
          <dl>
            <div>
              <dt className="sr-only">Published on</dt>
              <BlogMeta date={date} slug={slug} readingTime={readingTime} />
            </div>
          </dl>
        </div>

        {/* 正文只显示文字描述 */}
        <div className="gallery-grid prose max-w-none dark:prose-invert [&>p:empty]:hidden [&>p]:m-0">
          {children}
        </div>

        {/* 视差滚动画廊 */}
        {galleryImages.length > 0 && (
          <div className="mt-4">
            <ParallaxGallery images={galleryImages} />
          </div>
        )}

        <div className="space-y-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <div className="flex justify-between gap-4">
            <div className="flex items-center gap-2">
              <EditOnGithub filePath={filePath} />
            </div>
            <SocialShare postUrl={postUrl} title={title} />
          </div>
          <Comments slug={slug} />
        </div>
      </article>
    </Container>
  )
}
