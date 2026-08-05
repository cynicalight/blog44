'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import {
  buildSourcePath,
  encodeAdminApiPath,
  getPublicPathFromSourcePath,
} from '~/lib/admin-post-utils'
import { type BlogScriptVariant } from '~/lib/blog-script'
import type { AdminContentType, AdminPostDetail, AdminPostInput } from '~/types/admin'

type PostEditorProps = {
  mode: 'create' | 'edit'
  sourcePath?: string
}

const EMPTY_FORM: AdminPostInput = {
  contentType: 'blog',
  slug: '',
  scriptVariant: 'zh-Hans',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  summary: '',
  tags: [],
  draft: false,
  coverImage: '',
  canonicalUrl: '',
  body: '',
}

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
    <Button type="button" onClick={onClick} variant={active ? 'default' : 'outline'} size="sm">
      {children}
    </Button>
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
          scriptVariant: post.scriptVariant,
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
      return buildSourcePath(form.contentType, form.date, form.slug, form.scriptVariant)
    } catch {
      return ''
    }
  }, [form.contentType, form.date, form.slug, form.scriptVariant])

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
      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          保存后会直接提交到 GitHub `main`，并由 Vercel 自动重新部署。图片请填写已上传到 COS 的
          URL。
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>类型</Label>
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

            <div className="space-y-2">
              <Label>状态</Label>
              <div className="flex flex-wrap gap-2">
                <ToggleButton active={!form.draft} onClick={() => updateField('draft', false)}>
                  发布
                </ToggleButton>
                <ToggleButton active={form.draft} onClick={() => updateField('draft', true)}>
                  草稿
                </ToggleButton>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-title">标题</Label>
              <Input
                id="post-title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="文章标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-slug">Slug</Label>
              <Input
                id="post-slug"
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                placeholder="my-post"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon />
                    {form.date ? (
                      format(new Date(`${form.date}T00:00:00`), 'PPP', { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? new Date(`${form.date}T00:00:00`) : undefined}
                    onSelect={(date) => {
                      if (date) updateField('date', format(date, 'yyyy-MM-dd'))
                    }}
                    locale={zhCN}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {form.contentType === 'blog' ? (
              <div className="space-y-2">
                <Label>当前稿件字形</Label>
                <div className="flex flex-wrap gap-2">
                  <ToggleButton
                    active={form.scriptVariant === 'zh-Hans'}
                    onClick={() => updateField('scriptVariant', 'zh-Hans' as BlogScriptVariant)}
                  >
                    简体
                  </ToggleButton>
                  <ToggleButton
                    active={form.scriptVariant === 'zh-Hant'}
                    onClick={() => updateField('scriptVariant', 'zh-Hant' as BlogScriptVariant)}
                  >
                    繁體
                  </ToggleButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  保存时会自动生成另一套字形版本，并一起提交到仓库。
                </p>
              </div>
            ) : null}

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="post-summary">摘要</Label>
              <Textarea
                id="post-summary"
                value={form.summary}
                onChange={(event) => updateField('summary', event.target.value)}
                className="min-h-24"
                placeholder="文章摘要"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="post-tags">Tags（逗号分隔）</Label>
              <Input
                id="post-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="sec, java"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="post-cover">封面图 URL</Label>
              <Input
                id="post-cover"
                value={form.coverImage}
                onChange={(event) => updateField('coverImage', event.target.value)}
                placeholder="https://cos.example.com/blog/cover.webp"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="post-canonical">canonicalUrl</Label>
              <Input
                id="post-canonical"
                value={form.canonicalUrl}
                onChange={(event) => updateField('canonicalUrl', event.target.value)}
                placeholder="https://example.com/original-post"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>发布预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>内容类型：</span>
              <Badge variant="secondary">
                {form.contentType === 'gallery' ? 'Gallery' : 'Blog'}
              </Badge>
            </div>
            {form.contentType === 'blog' ? (
              <div>当前稿件：{form.scriptVariant === 'zh-Hant' ? '繁體' : '简体'}</div>
            ) : null}
            <div className="break-all">仓库路径：{previewPath || '请先填写合法日期和 slug'}</div>
            <div className="break-all">
              公开链接：{previewPublicPath || '请先填写合法日期和 slug'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>正文</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="post-body" className="sr-only">
              正文
            </Label>
            <Textarea
              id="post-body"
              value={form.body}
              onChange={(event) => updateField('body', event.target.value)}
              className="min-h-[520px] font-mono"
              placeholder="# 标题"
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? '保存中...' : mode === 'edit' ? '保存修改' : '创建文章'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/posts')}>
            返回文章列表
          </Button>
          {mode === 'edit' && sourcePath ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '删除文章'}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
