'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { encodeAdminApiPath, getPublicPathFromSourcePath } from '~/lib/admin-post-utils'
import { useAuth } from '~/lib/auth-context'
import type { AdminPostSummary } from '~/types/admin'

const ACTION_BUTTON_BASE =
  'inline-flex min-w-[72px] items-center justify-center whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.08em] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]'

const EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE} border-indigo-200/80 bg-white/75 text-indigo-600 shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:border-indigo-300 hover:bg-white/90 hover:text-indigo-700 dark:border-indigo-400/20 dark:bg-white/10 dark:text-indigo-300 dark:hover:border-indigo-300/40 dark:hover:bg-white/14 dark:hover:text-indigo-200`

const PREVIEW_BUTTON_CLASS = `${ACTION_BUTTON_BASE} border-slate-200/80 bg-white/72 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:border-slate-300 hover:bg-white/88 hover:text-slate-900 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/14 dark:hover:text-white`

const DELETE_BUTTON_CLASS = `${ACTION_BUTTON_BASE} border-red-200/80 bg-white/72 text-red-600 shadow-[0_8px_24px_rgba(239,68,68,0.1)] hover:border-red-300 hover:bg-red-50/85 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/20 dark:bg-white/8 dark:text-red-300 dark:hover:border-red-300/40 dark:hover:bg-red-500/10 dark:hover:text-red-200`

export default function AdminPostsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [posts, setPosts] = useState<AdminPostSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

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

  async function handleDelete(path: string) {
    const confirmed = window.confirm('确定要删除这篇内容吗？')
    if (!confirmed) {
      return
    }

    setError('')
    setDeletingPath(path)

    try {
      const response = await fetch(`/api/admin/posts/${encodeAdminApiPath(path)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '删除文章失败')
      }

      setPosts((current) => current.filter((post) => post.path !== path))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文章失败')
    } finally {
      setDeletingPath(null)
    }
  }

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
            Blog 支持简体主文件加繁體配对文件，当前内容源包含 `data/blog/**/*.mdx` 和
            `data/gallery/**/*.mdx`。
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
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        post.draft
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      {post.draft ? 'Draft' : 'Published'}
                    </span>
                    <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                      {post.contentType === 'gallery' ? 'Gallery' : 'Blog'}
                    </span>
                    {post.contentType === 'blog' ? (
                      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">
                        {post.scriptVariant === 'zh-Hant' ? '繁體' : '简体'}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-gray-700 dark:text-gray-300">
                  {post.tags.length ? post.tags.join(', ') : '-'}
                </td>
                <td className="px-4 py-4 align-top font-mono text-xs text-gray-500 dark:text-gray-400">
                  {post.path}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                    <Link
                      href={`/admin/posts/edit?path=${encodeURIComponent(post.path)}`}
                      className={EDIT_BUTTON_CLASS}
                    >
                      编辑
                    </Link>
                    <a
                      href={getPublicPathFromSourcePath(post.path)}
                      target="_blank"
                      rel="noreferrer"
                      className={PREVIEW_BUTTON_CLASS}
                    >
                      预览
                    </a>
                    <a
                      href={`/api/admin/posts/${encodeAdminApiPath(post.path)}`}
                      className="sr-only"
                    >
                      API
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.path)}
                      disabled={deletingPath === post.path}
                      className={DELETE_BUTTON_CLASS}
                    >
                      {deletingPath === post.path ? '删除中...' : '删除'}
                    </button>
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
