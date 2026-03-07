'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  buildBlogSourcePath,
  encodeAdminApiPath,
  getPublicBlogPathFromSourcePath,
} from '~/lib/admin-post-utils'
import type { AdminPostDetail, AdminPostInput } from '~/types/admin'

type PostEditorProps = {
  mode: 'create' | 'edit'
  sourcePath?: string
}

const EMPTY_FORM: AdminPostInput = {
  slug: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  summary: '',
  tags: [],
  draft: true,
  coverImage: '',
  canonicalUrl: '',
  body: '',
}

export function PostEditor({ mode, sourcePath }: PostEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<AdminPostInput>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (mode !== 'edit') {
      return
    }

    if (!sourcePath) {
      setError('缺少文章路径，无法加载编辑内容。')
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    setError('')

    fetch(`/api/admin/posts/${encodeAdminApiPath(sourcePath)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || '获取文章详情失败')
        }
        return data.post as AdminPostDetail
      })
      .then((post) => {
        if (!active) {
          return
        }
        setForm({
          slug: post.slug,
          title: post.title,
          date: post.date,
          summary: post.summary,
          tags: post.tags,
          draft: post.draft,
          coverImage: post.coverImage,
          canonicalUrl: post.canonicalUrl,
          body: post.body,
        })
        setTagInput(post.tags.join(', '))
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [mode, sourcePath])

  const previewPath = useMemo(() => {
    try {
      return buildBlogSourcePath(form.date, form.slug)
    } catch {
      return ''
    }
  }, [form.date, form.slug])

  const previewPublicPath = useMemo(() => {
    if (!previewPath) {
      return ''
    }
    return getPublicBlogPathFromSourcePath(previewPath)
  }, [previewPath])

  function updateField<K extends keyof AdminPostInput>(key: K, value: AdminPostInput[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    const payload: AdminPostInput = {
      ...form,
      tags: tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    try {
      const url =
        mode === 'edit' && sourcePath
          ? `/api/admin/posts/${encodeAdminApiPath(sourcePath)}`
          : '/api/admin/posts'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '保存文章失败')
      }

      const nextPath = data.post.path as string
      setSuccess('保存成功，已提交到 GitHub main 分支，等待 Vercel 重新部署。')
      router.replace(`/admin/posts/edit?path=${encodeURIComponent(nextPath)}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存文章失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">正在加载文章内容...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        保存后会直接提交到 GitHub `main`，并由 Vercel 自动重新部署。图片请填写已上传到 COS 的 URL。
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {success}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">标题</span>
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="文章标题"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="my-post"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">日期</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateField('date', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              required
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <input
              type="checkbox"
              checked={form.draft}
              onChange={(event) => updateField('draft', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-gray-700 dark:text-gray-200">保存为草稿</span>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">摘要</span>
            <textarea
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
              className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="文章摘要"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Tags（逗号分隔）
            </span>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="sec, java"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">封面图 URL</span>
            <input
              value={form.coverImage}
              onChange={(event) => updateField('coverImage', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="https://cos.example.com/blog/cover.webp"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              canonicalUrl
            </span>
            <input
              value={form.canonicalUrl}
              onChange={(event) => updateField('canonicalUrl', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="https://example.com/original-post"
            />
          </label>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="font-medium text-gray-700 dark:text-gray-200">发布预览</div>
          <div className="mt-2 space-y-1 text-gray-600 dark:text-gray-300">
            <div>仓库路径：{previewPath || '请先填写合法日期和 slug'}</div>
            <div>公开链接：{previewPublicPath || '请先填写合法日期和 slug'}</div>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">正文</span>
          <textarea
            value={form.body}
            onChange={(event) => updateField('body', event.target.value)}
            className="min-h-[520px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
            placeholder="# 标题"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? '保存中...' : mode === 'edit' ? '保存修改' : '创建文章'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            返回文章列表
          </button>
        </div>
      </form>
    </div>
  )
}
