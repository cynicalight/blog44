import { PostEditor } from '~/components/admin/post-editor'

export default function NewAdminPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">新建文章</h2>
        <p className="text-sm text-muted-foreground">
          Blog 会写入 `data/blog/YYYY/slug.mdx`，并自动生成对应的 `slug.zh-Hant.mdx`。
        </p>
      </div>
      <PostEditor mode="create" />
    </div>
  )
}
