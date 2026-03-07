'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { encodeAdminApiPath, getPublicBlogPathFromSourcePath } from '~/lib/admin-post-utils'
import { useAuth } from '~/lib/auth-context'
import type { AdminPostSummary } from '~/types/admin'

export default function AdminPostsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [posts, setPosts] = useState<AdminPostSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/admin/login')
    }
  }, [isLoading, router, user])

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true
    setLoading(true)
    setError('')

    fetch('/api/admin/posts', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || '获取文章列表失败')
        }
        return data.posts as AdminPostSummary[]
      })
      .then((nextPosts) => {
        if (active) {
          setPosts(nextPosts)
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user])

  if (isLoading || loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">正在加载文章列表...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            当前内容源仍然是仓库里的 `data/blog/**/*.mdx` 文件。
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          新建文章
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">
                标题
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">
                日期
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">
                状态
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">
                Tags
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">
                路径
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {posts.map((post) => (
              <tr key={post.path}>
                <td className="px-4 py-4 align-top">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{post.title}</div>
                  {post.summary ? (
                    <div className="mt-1 line-clamp-2 max-w-xl text-xs text-gray-500 dark:text-gray-400">
                      {post.summary}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-gray-700 dark:text-gray-300">
                  {post.date}
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      post.draft
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                    }`}
                  >
                    {post.draft ? 'Draft' : 'Published'}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-gray-700 dark:text-gray-300">
                  {post.tags.length ? post.tags.join(', ') : '-'}
                </td>
                <td className="px-4 py-4 align-top font-mono text-xs text-gray-500 dark:text-gray-400">
                  {post.path}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/posts/edit?path=${encodeURIComponent(post.path)}`}
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      编辑
                    </Link>
                    <a
                      href={getPublicBlogPathFromSourcePath(post.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      预览
                    </a>
                    <a
                      href={`/api/admin/posts/${encodeAdminApiPath(post.path)}`}
                      className="sr-only"
                    >
                      API
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  还没有可编辑的文章。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
