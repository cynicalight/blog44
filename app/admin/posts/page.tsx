'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { encodeAdminApiPath, getPublicPathFromSourcePath } from '~/lib/admin-post-utils'
import { useAuth } from '~/lib/auth-context'
import type { AdminPostSummary } from '~/types/admin'

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
    if (!user) return

    let active = true
    setLoading(true)
    setError('')

    fetch('/api/admin/posts', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || '获取文章列表失败')
        return data.posts as AdminPostSummary[]
      })
      .then((nextPosts) => {
        if (active) setPosts(nextPosts)
      })
      .catch((err: Error) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  async function handleDelete(path: string) {
    if (!window.confirm('确定要删除这篇内容吗？')) return

    setError('')
    setDeletingPath(path)

    try {
      const response = await fetch(`/api/admin/posts/${encodeAdminApiPath(path)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '删除文章失败')
      setPosts((current) => current.filter((post) => post.path !== path))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文章失败')
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">文章管理</h2>
          <p className="text-sm text-muted-foreground">
            管理 Blog 与 Gallery 内容，保存后会提交到 GitHub。
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus />
            新建文章
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>内容列表</CardTitle>
          <CardDescription>
            {loading ? '正在加载内容…' : `共 ${posts.length} 篇内容`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading || loading ? (
            <div className="space-y-3 px-6 pb-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.path}>
                    <TableCell className="min-w-64 align-top">
                      <div className="font-medium">{post.title}</div>
                      {post.summary ? (
                        <div className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                          {post.summary}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{post.date}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex min-w-32 flex-nowrap gap-1.5">
                        <Badge variant={post.draft ? 'outline' : 'default'}>
                          {post.draft ? 'Draft' : 'Published'}
                        </Badge>
                        <Badge variant="secondary">
                          {post.contentType === 'gallery' ? 'Gallery' : 'Blog'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 text-muted-foreground">
                      {post.tags.length ? post.tags.join(', ') : '—'}
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-mono text-xs text-muted-foreground">
                      {post.path}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="编辑">
                          <Link href={`/admin/posts/edit?path=${encodeURIComponent(post.path)}`}>
                            <Pencil />
                            <span className="sr-only">编辑</span>
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" title="预览">
                          <a
                            href={getPublicPathFromSourcePath(post.path)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink />
                            <span className="sr-only">预览</span>
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="删除"
                          onClick={() => handleDelete(post.path)}
                          disabled={deletingPath === post.path}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
                          <span className="sr-only">删除</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      还没有可编辑的文章。
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
