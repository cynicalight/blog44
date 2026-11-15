'use client'

import type { CoreContent } from 'pliny/utils/contentlayer'
import { useEffect, useState } from 'react'
import type { Blog } from '~/.contentlayer/generated'
import { PostCardListView } from '~/components/blog/post-card-list-view'
import { TypedBios } from '~/components/home-page/typed-bios'
import { Link } from '~/components/ui/link'
import { PixelEyebrow, PixelRule } from './pixel-ui'

// The hero itself (moon, sea, title) is drawn by LunarChrome's canvas; this is
// the DOM that floats on top of it.
export function LunarHome({ posts }: { posts: CoreContent<Blog>[] }) {
  // The typewriter re-rasterises text on every keystroke; drop it entirely the
  // moment the page leaves the top so it can't compete with scrolling.
  const [atTop, setAtTop] = useState(true)
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <section className="relative h-svh min-h-[560px]">
        <h1 className="sr-only">BU44ER&apos;S BLOG</h1>
        {/* Subtitle floats in the water, tilted with the sea; too long for phone widths. */}
        {atTop ? (
          <div
            className="absolute left-[var(--sub-x)] top-[var(--sub-y)] hidden w-[min(32rem,78vw)] opacity-0 transition-opacity delay-700 duration-1000 sm:block [[data-lunar-ready]_&]:opacity-100"
            style={{ transform: 'translate(-50%, -50%) rotate(var(--sea-angle, 0rad))' }}
          >
            <TypedBios />
          </div>
        ) : null}
        <p
          aria-hidden
          className="absolute bottom-6 left-6 flex items-center gap-2 font-pixel text-[10px] tracking-[0.3em] text-gray-500"
        >
          <span className="animate-pulse">↓</span> SCROLL
        </p>
      </section>
      <section className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-16 sm:px-8">
        <div className="flex items-center justify-between gap-4 pb-4">
          <PixelEyebrow phase={0.5}>Latest posts</PixelEyebrow>
          <Link
            href="/blog"
            className="font-pixel text-[11px] tracking-[0.25em] text-gray-500 transition-colors hover:text-gray-950 dark:hover:text-white"
          >
            VIEW ALL →
          </Link>
        </div>
        <PixelRule />
        <ul className="space-y-14 pt-10 md:space-y-20">
          {posts.map((post, index) => (
            <li key={post.slug}>
              <PostCardListView post={post} loading={index === 0 ? 'eager' : 'lazy'} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
