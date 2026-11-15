import { genPageMetadata } from 'app/seo'
import { allProjects } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { ProjectCard } from '~/components/projects/project-card'
import { Container } from '~/components/ui/container'
import { PageHeader } from '~/components/ui/page-header'
import { fetchProjectRepo } from '~/server/github.server'

export const metadata = genPageMetadata({ title: 'Projects' })

// Star counts come from the GitHub API; regenerate the page at most hourly.
export const revalidate = 3600

export default async function Projects() {
  const projects = allCoreContent(sortPosts(allProjects))
  const repos = await Promise.all(projects.map((project) => fetchProjectRepo(project.github)))

  return (
    <Container className="pt-4 lg:pt-12">
      <PageHeader
        title="Projects"
        description="Things I build in the open — each with a write-up, the GitHub repository and its live star count."
      />
      <div className="space-y-10 py-10">
        {projects.length === 0 && 'No projects yet.'}
        {projects.map((project, index) => (
          <ProjectCard key={project.path} project={project} {...repos[index]} />
        ))}
      </div>
    </Container>
  )
}
