// Accepts `owner/repo` or any github.com URL pointing into a repository and
// returns the canonical `owner/repo`, or null when the input isn't a repo.
const OWNER_REPO = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]+)$/

export function parseGithubRepo(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  let candidate = value
  if (/^(https?:\/\/)?(www\.)?github\.com\//i.test(value)) {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    candidate = url.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
  }
  const match = OWNER_REPO.exec(candidate.replace(/\.git$/i, ''))
  return match ? `${match[1]}/${match[2]}` : null
}

export function githubRepoUrl(repo: string) {
  return `https://github.com/${repo}`
}
