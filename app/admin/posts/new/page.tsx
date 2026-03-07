import { PostEditor } from '~/components/admin/post-editor'

export default function NewAdminPostPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新建文章</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          文章会以 MDX 文件形式写入仓库的 `data/blog/YYYY/slug.mdx`。
        </p>
      </div>
      <PostEditor mode="create" />
    </div>
  )
}
