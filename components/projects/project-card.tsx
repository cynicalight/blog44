import type { Project } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import { TagsList } from '~/components/blog/tags'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'
import type { GithubRepository } from '~/types/data'
import { RepoBadge } from './repo-badge'

export function ProjectCard({
  project,
  repo,
  repository,
}: {
  project: CoreContent<Project>
  repo: string
  repository: GithubRepository | null
}) {
  const { path, title, summary, images, tags } = project
  return (
    <article className="grid gap-6 border border-dashed border-gray-300/80 bg-[#f5f4ef]/70 p-4 dark:border-white/10 dark:bg-[#08080b]/70 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:p-6">
      <Link href={`/${path}`} className="block overflow-hidden">
        <Image
          src={images?.[0] || SITE_METADATA.socialBanner}
          alt={title}
          width={720}
          height={450}
          className="aspect-video h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-col justify-between gap-5">
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-exo-2)] text-2xl font-semibold tracking-tight">
            <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
              {title}
            </Link>
          </h2>
          {summary ? <p className="text-gray-600 dark:text-gray-400">{summary}</p> : null}
          <TagsList tags={tags} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RepoBadge repo={repo} repository={repository} />
          <Link
            href={`/${path}`}
            className="font-pixel text-[11px] tracking-[0.25em] text-gray-500 transition-colors hover:text-gray-950 dark:hover:text-white"
          >
            READ →
          </Link>
        </div>
      </div>
    </article>
  )
}
