import { githubRepoUrl } from '~/lib/github-repo'
import type { GithubRepository } from '~/types/data'

/**
 * GitHub link with live star count. `repository` comes from the server (ISR, see
 * the project pages' `revalidate`); when the API is unavailable only the link shows.
 */
export function RepoBadge({
  repo,
  repository,
}: {
  repo: string
  repository: GithubRepository | null
}) {
  const language = repository?.languages[0]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-pixel text-[11px] tracking-[0.18em] text-gray-500">
      <a
        href={repository?.url || githubRepoUrl(repo)}
        target="_blank"
        rel="noreferrer"
        data-umami-event="project-repo"
        className="flex items-center gap-2 border border-dashed border-gray-300 px-2.5 py-1 text-gray-700 transition-colors hover:border-gray-500 hover:text-gray-950 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/40 dark:hover:text-white"
      >
        <span aria-hidden>★</span>
        <span>{repository ? repository.stargazerCount.toLocaleString('en-US') : '—'}</span>
        <span className="opacity-40">/</span>
        <span className="normal-case tracking-normal">{repository?.nameWithOwner || repo}</span>
        <span aria-hidden>↗</span>
      </a>
      {language ? (
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2"
            style={{ backgroundColor: language.color || 'currentColor' }}
          />
          {language.name}
        </span>
      ) : null}
      {repository?.homepageUrl ? (
        <a
          href={repository.homepageUrl}
          target="_blank"
          rel="noreferrer"
          data-umami-event="project-homepage"
          className="transition-colors hover:text-gray-950 dark:hover:text-white"
        >
          {new URL(repository.homepageUrl).host} ↗
        </a>
      ) : null}
    </div>
  )
}
