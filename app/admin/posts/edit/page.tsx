import { PostEditor } from '~/components/admin/post-editor'

export default async function EditAdminPostPage(props: {
  searchParams: Promise<{ path?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">编辑文章</h2>
        <p className="text-sm text-muted-foreground">
          修改会直接提交到 GitHub main，并触发 Vercel 重建。
        </p>
      </div>
      <PostEditor mode="edit" sourcePath={searchParams.path} />
    </div>
  )
}
