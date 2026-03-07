import { PostEditor } from '~/components/admin/post-editor'

export default async function EditAdminPostPage(props: {
  searchParams: Promise<{ path?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">编辑文章</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          修改会直接提交到 GitHub main，并触发 Vercel 重建。
        </p>
      </div>
      <PostEditor mode="edit" sourcePath={searchParams.path} />
    </div>
  )
}
