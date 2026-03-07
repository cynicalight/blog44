'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  buildSourcePath,
  encodeAdminApiPath,
  getPublicPathFromSourcePath,
} from '~/lib/admin-post-utils'
import type { AdminContentType, AdminPostDetail, AdminPostInput } from '~/types/admin'

type PostEditorProps = {
  mode: 'create' | 'edit'
  sourcePath?: string
}

const EMPTY_FORM: AdminPostInput = {
  contentType: 'blog',
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

const TOGGLE_BASE =
  'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98]'

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `${TOGGLE_BASE} border-indigo-300 bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.24)] hover:bg-indigo-500`
          : `${TOGGLE_BASE} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800`
      }
    >
      {children}
    </button>
  )
}

export function PostEditor({ mode, sourcePath }: PostEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<AdminPostInput>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
          contentType: post.contentType,
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
      return buildSourcePath(form.contentType, form.date, form.slug)
    } catch {
      return ''
    }
  }, [form.contentType, form.date, form.slug])

  const previewPublicPath = useMemo(() => {
    if (!previewPath) {
      return ''
    }
    return getPublicPathFromSourcePath(previewPath)
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

  async function handleDelete() {
    if (!sourcePath) {
      return
    }

    const confirmed = window.confirm('确定要删除这篇内容吗？')
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/posts/${encodeAdminApiPath(sourcePath)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '删除文章失败')
      }
      router.push('/admin/posts')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文章失败')
    } finally {
      setIsDeleting(false)
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

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">状态</span>
            <div className="flex flex-wrap gap-2">
              <ToggleButton active={!form.draft} onClick={() => updateField('draft', false)}>
                已发布
              </ToggleButton>
              <ToggleButton active={form.draft} onClick={() => updateField('draft', true)}>
                草稿
              </ToggleButton>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">类型</span>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                active={form.contentType === 'blog'}
                onClick={() => updateField('contentType', 'blog' as AdminContentType)}
              >
                Blog
              </ToggleButton>
              <ToggleButton
                active={form.contentType === 'gallery'}
                onClick={() => updateField('contentType', 'gallery' as AdminContentType)}
              >
                Gallery
              </ToggleButton>
            </div>
          </div>

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
            <div>内容类型：{form.contentType === 'gallery' ? 'Gallery' : 'Blog'}</div>
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
          {mode === 'edit' && sourcePath ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {isDeleting ? '删除中...' : '删除文章'}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
