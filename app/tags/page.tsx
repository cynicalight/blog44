import { genPageMetadata } from 'app/seo'
import { Tag } from '~/components/blog/tags'
import { Container } from '~/components/ui/container'
import { PageHeader } from '~/components/ui/page-header'
import tagData from '~/json/tag-data.json'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])
  return (
    <Container className="pt-4 lg:pt-12">
      <PageHeader
        title="Tags"
        description="Things I blog about, sorted by how often I write about them."
      />
      <ul className="flex flex-wrap gap-x-6 gap-y-3 py-10">
        {sortedTags.length === 0 && 'No tags found.'}
        {sortedTags.map((tag) => (
          <li key={tag} className="flex items-center gap-1">
            <Tag text={tag} size="md" />
            <span className="font-pixel text-[10px] text-gray-500">{tagCounts[tag]}</span>
          </li>
        ))}
      </ul>
    </Container>
  )
}
