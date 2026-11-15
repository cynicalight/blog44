import type { Author, Project } from 'contentlayer/generated'
import { allAuthors, allProjects } from 'contentlayer/generated'
import 'css/prism.css'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { allCoreContent, coreContent, sortPosts } from 'pliny/utils/contentlayer'
import { MDX_COMPONENTS } from '~/components/mdx'
import { RepoBadge } from '~/components/projects/repo-badge'
import { SITE_METADATA } from '~/data/site-metadata'
import { PostLayout } from '~/layouts/post-layout'
import { fetchProjectRepo } from '~/server/github.server'

// Star counts come from the GitHub API; regenerate at most hourly.
export const revalidate = 3600

function findProject(slugParts: string[]) {
  const slug = decodeURI(slugParts.join('/'))
  return allProjects.find((project) => project.slug === slug)
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const project = findProject((await props.params).slug)
  if (!project) return
  const images = project.images?.length ? project.images : [SITE_METADATA.socialBanner]
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      siteName: SITE_METADATA.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: new Date(project.date).toISOString(),
      modifiedTime: new Date(project.lastmod || project.date).toISOString(),
      url: './',
      images: images.map((img: string) => ({
        url: img.includes('http') ? img : SITE_METADATA.siteUrl + img,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.summary,
      images,
    },
  }
}

export const generateStaticParams = async () => {
  return allProjects.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const sorted = allCoreContent(sortPosts(allProjects))
  const slug = decodeURI(params.slug.join('/'))
  const index = sorted.findIndex((p) => p.slug === slug)
  const project = findProject(params.slug) as Project | undefined
  if (index === -1 || !project) {
    return notFound()
  }

  const authorDetails = (project.authors || ['default']).map((author) =>
    coreContent(allAuthors.find((p) => p.slug === author) as Author)
  )
  const jsonLd = project.structuredData
  jsonLd['author'] = authorDetails.map((author) => ({ '@type': 'Person', name: author.name }))
  const { repo, repository } = await fetchProjectRepo(project.github)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostLayout
        content={coreContent(project)}
        authorDetails={authorDetails}
        next={sorted[index - 1]}
        prev={sorted[index + 1]}
        meta={<RepoBadge repo={repo} repository={repository} />}
      >
        <MDXLayoutRenderer code={project.body.code} components={MDX_COMPONENTS} toc={project.toc} />
      </PostLayout>
    </>
  )
}
