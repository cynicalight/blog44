import { allBlogs, allSnippets } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { DEFAULT_BLOG_SCRIPT_VARIANT, filterBlogsByScriptVariant } from '~/lib/blog-script'
import { Home } from '~/components/home-page'

const MAX_POSTS_DISPLAY = 5
const MAX_SNIPPETS_DISPLAY = 6

export default async function HomePage() {
  const defaultBlogs = filterBlogsByScriptVariant(allBlogs, DEFAULT_BLOG_SCRIPT_VARIANT)
  return (
    <Home
      posts={allCoreContent(sortPosts(defaultBlogs)).slice(0, MAX_POSTS_DISPLAY)}
      snippets={allCoreContent(sortPosts(allSnippets)).slice(0, MAX_SNIPPETS_DISPLAY)}
    />
  )
}
