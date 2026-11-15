import { graphql, type GraphQlQueryResponseData } from '@octokit/graphql'
import { parseGithubRepo } from '~/lib/github-repo'
import type { GithubRepository } from '~/types/data'

export async function fetchRepoData(repo: string): Promise<GithubRepository | null> {
  if (!process.env.GITHUB_API_TOKEN) {
    console.error('Missing `GITHUB_API_TOKEN`')
    return null
  }
  try {
    const { repository }: GraphQlQueryResponseData = await graphql(
      `
        query repository($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            stargazerCount
            description
            homepageUrl
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                node {
                  color
                  name
                }
              }
            }
            name
            nameWithOwner
            url
            forkCount
            repositoryTopics(first: 20) {
              edges {
                node {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      `,
      {
        owner: repo.split('/')[0],
        repo: repo.split('/')[1],
        headers: {
          authorization: `token ${process.env.GITHUB_API_TOKEN}`,
        },
      }
    )
    repository.languages = repository.languages.edges.map((edge) => {
      return {
        color: edge.node.color,
        name: edge.node.name,
      }
    })
    repository.repositoryTopics = repository.repositoryTopics.edges.map(
      (edge) => edge.node.topic.name
    )
    return repository
  } catch (err) {
    console.error(err)
    return null
  }
}

// Unauthenticated REST fallback for public repos when no GraphQL token is configured
// (60 requests/hour per IP; project pages revalidate hourly, so this stays well under).
async function fetchPublicRepoData(repo: string): Promise<GithubRepository | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    const data = await response.json()
    return {
      stargazerCount: data.stargazers_count,
      description: data.description ?? '',
      homepageUrl: data.homepage ?? '',
      languages: data.language ? [{ name: data.language, color: '' }] : [],
      name: data.name,
      nameWithOwner: data.full_name,
      url: data.html_url,
      forkCount: data.forks_count,
      repositoryTopics: data.topics ?? [],
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

/** Canonical `owner/repo` plus live repository data for a project's `github` field. */
export async function fetchProjectRepo(github: string) {
  const repo = parseGithubRepo(github) ?? github
  const repository = process.env.GITHUB_API_TOKEN
    ? await fetchRepoData(repo)
    : await fetchPublicRepoData(repo)
  return { repo, repository }
}
