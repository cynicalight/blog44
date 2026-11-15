import { allBlogs } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { LunarHome } from '~/components/lunar/lunar-home'
import { DEFAULT_BLOG_SCRIPT_VARIANT, filterBlogsByScriptVariant } from '~/lib/blog-script'

const MAX_POSTS_DISPLAY = 5

export default async function HomePage() {
  const defaultBlogs = filterBlogsByScriptVariant(allBlogs, DEFAULT_BLOG_SCRIPT_VARIANT)
  return <LunarHome posts={allCoreContent(sortPosts(defaultBlogs)).slice(0, MAX_POSTS_DISPLAY)} />
}
