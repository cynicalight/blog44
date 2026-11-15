import { clsx } from 'clsx'
import { slug } from 'github-slugger'
import { Link } from '~/components/ui/link'

export function TagsList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {tags.map((tag) => (
        <Tag key={tag} text={tag} />
      ))}
    </div>
  )
}

export function Tag({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const tagName = text.split(' ').join('-')
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className={clsx([
        'border border-dashed px-2 py-0.5 font-mono tracking-wide transition-colors',
        'border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-950',
        'dark:border-white/15 dark:text-gray-300 dark:hover:border-white/40 dark:hover:text-white',
        size === 'sm' ? 'text-xs' : 'text-sm',
      ])}
    >
      <span data-umami-event={`tag-${tagName}`}>#{tagName}</span>
    </Link>
  )
}
