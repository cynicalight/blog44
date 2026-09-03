'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useNewPostDraft, type NewPostDraftStatus } from '~/hooks/use-new-post-draft'
import { MAX_ADMIN_IMAGE_BYTES } from '~/lib/admin-asset-constants'
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

function createEmptyForm(): AdminPostInput {
  return {
    contentType: 'blog',
    slug: '',
    scriptVariant: 'zh-Hans',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    summary: '',
    tags: [],
    draft: false,
    coverImage: '',
    body: '',
  }
}

function getDraftStatusText(status: NewPostDraftStatus) {
  switch (status.state) {
    case 'saving':
      return '正在自动保存本地草稿…'
    case 'saved':
      return `本地草稿已自动保存于 ${format(new Date(status.updatedAt), 'HH:mm:ss')}。`
    case 'restored':
      return `已恢复 ${format(new Date(status.updatedAt), 'HH:mm:ss')} 保存的本地草稿。`
    case 'error':
      return `本地草稿保存失败：${status.message}`
    default:
      return '开始填写后会自动保存在当前浏览器。'
  }
}

function getPastedImages(event: React.ClipboardEvent) {
  return Array.from(event.clipboardData.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))
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
  const bodyInputRef = useRef<HTMLTextAreaElement>(null)
  const [form, setForm] = useState<AdminPostInput>(createEmptyForm)
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadingTarget, setUploadingTarget] = useState<'cover' | 'body' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const restoreNewPostDraft = useCallback((draft: { form: AdminPostInput; tagInput: string }) => {
    setForm(draft.form)
    setTagInput(draft.tagInput)
  }, [])
  const newPostDraftValue = useMemo(() => ({ form, tagInput }), [form, tagInput])
  const newPostDraft = useNewPostDraft({
    enabled: mode === 'create',
    value: newPostDraftValue,
    onRestore: restoreNewPostDraft,
  })

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

  async function uploadPastedImage(file: File) {
    if (file.size > MAX_ADMIN_IMAGE_BYTES) {
      throw new Error('图片不能超过 4 MB。')
    }

    const formData = new FormData()
    formData.set('file', file)
    const response = await fetch('/api/admin/assets', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '图片上传失败')
    }
    if (typeof data.asset?.url !== 'string') {
      throw new Error('图片上传响应缺少 URL')
    }

    return data.asset.url as string
  }

  async function handleCoverPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const [image] = getPastedImages(event)
    if (!image) {
      return
    }

    event.preventDefault()
    if (uploadingTarget) {
      setError('另一张图片仍在上传，请稍后再试。')
      return
    }

    setError('')
    setSuccess('')
    setUploadingTarget('cover')
    try {
      const url = await uploadPastedImage(image)
      updateField('coverImage', url)
      setSuccess('封面图已上传到 COS，并已回填 URL。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '封面图上传失败')
    } finally {
      setUploadingTarget(null)
    }
  }

  async function handleBodyPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const images = getPastedImages(event)
    if (images.length === 0) {
      return
    }

    event.preventDefault()
    if (uploadingTarget) {
      setError('另一张图片仍在上传，请稍后再试。')
      return
    }

    const selectionStart = event.currentTarget.selectionStart
    const selectionEnd = event.currentTarget.selectionEnd
    setError('')
    setSuccess('')
    setUploadingTarget('body')

    try {
      const urls = await Promise.all(images.map(uploadPastedImage))
      const markdown = urls.map((url) => `![图片](${url})`).join('\n\n')
      const before = form.body.slice(0, selectionStart)
      const after = form.body.slice(selectionEnd)
      const leadingBreak = before && !before.endsWith('\n') ? '\n\n' : ''
      const trailingBreak = after && !after.startsWith('\n') ? '\n\n' : ''
      const insertedText = `${leadingBreak}${markdown}${trailingBreak}`

      updateField('body', `${before}${insertedText}${after}`)
      setSuccess(`${urls.length} 张正文图片已上传到 COS，并已插入 Markdown 链接。`)

      requestAnimationFrame(() => {
        const cursorPosition = selectionStart + insertedText.length
        bodyInputRef.current?.focus()
        bodyInputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '正文图片上传失败')
    } finally {
      setUploadingTarget(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (uploadingTarget) {
      setError('请等待图片上传完成后再保存。')
      return
    }
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
      if (mode === 'create') {
        newPostDraft.clearDraft()
      }
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

  function handleDiscardDraft() {
    const confirmed = window.confirm('确定要放弃当前本地草稿吗？未提交的内容将无法恢复。')
    if (!confirmed || !newPostDraft.clearDraft()) {
      return
    }

    setForm(createEmptyForm())
    setTagInput('')
    setError('')
    setSuccess('本地草稿已清除。')
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
          保存后会直接提交到 GitHub `main`，并由 Vercel
          自动重新部署。图片可粘贴后自动上传，也可填写已有的 COS URL。
        </AlertDescription>
      </Alert>

      {mode === 'create' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
          <span
            aria-live="polite"
            className={
              newPostDraft.status.state === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }
          >
            {getDraftStatusText(newPostDraft.status)}
          </span>
          {newPostDraft.hasDraft ? (
            <Button type="button" variant="outline" size="sm" onClick={handleDiscardDraft}>
              放弃本地草稿
            </Button>
          ) : null}
        </div>
      ) : null}

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
                onPaste={handleCoverPaste}
                placeholder="https://cos.example.com/blog/cover.webp"
                disabled={uploadingTarget === 'cover'}
              />
              <p className="text-xs text-muted-foreground">
                可直接粘贴图片，上传完成后会自动填写 COS URL。单张图片最大 4 MB。
              </p>
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
              ref={bodyInputRef}
              id="post-body"
              value={form.body}
              onChange={(event) => updateField('body', event.target.value)}
              onPaste={handleBodyPaste}
              className="min-h-[520px] font-mono"
              placeholder={'# 标题\n\n可在这里直接粘贴图片'}
              disabled={uploadingTarget === 'body'}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {uploadingTarget === 'body'
                ? '正在上传图片到 COS…'
                : '粘贴图片后会自动上传，并在光标位置插入 Markdown 图片链接。'}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving || Boolean(uploadingTarget)}>
            {uploadingTarget
              ? '图片上传中...'
              : isSaving
                ? '保存中...'
                : mode === 'edit'
                  ? '保存修改'
                  : '创建文章'}
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
