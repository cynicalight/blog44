'use client'

import { useEffect, useRef, useState } from 'react'
import { Crepe } from '@milkdown/crepe'
import { editorViewOptionsCtx, serializerCtx } from '@milkdown/kit/core'
import { uploadConfig } from '@milkdown/kit/plugin/upload'
import { Plugin } from '@milkdown/kit/prose/state'
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model'
import { $prose, replaceAll } from '@milkdown/kit/utils'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './markdown-editor.css'

type Props = {
  value: string
  onChange: (markdown: string) => void
  uploadImage: (file: File) => Promise<string>
  disabled: boolean
}

export default function MarkdownEditor(props: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Crepe | null>(null)
  const propsRef = useRef(props)
  const valueRef = useRef(props.value)
  const replacingRef = useRef(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  propsRef.current = props

  useEffect(() => {
    // A separate mount node keeps async StrictMode cleanup away from the next editor.
    const mount = document.createElement('div')
    rootRef.current!.appendChild(mount)
    let disposed = false
    const editor = new Crepe({
      root: mount,
      defaultValue: propsRef.current.value,
      // Keep standard Markdown image alt text; Crepe image blocks store resize ratios in alt.
      features: { [Crepe.Feature.ImageBlock]: false },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: { text: '输入 Markdown，或直接粘贴图片…' },
      },
    })
    valueRef.current = propsRef.current.value
    editor.editor.config((ctx) => {
      ctx.update(editorViewOptionsCtx, (options) => ({
        ...options,
        attributes: {
          role: 'textbox',
          'aria-labelledby': 'post-body-label',
          'aria-multiline': 'true',
        },
      }))
      ctx.update(uploadConfig.key, (config) => ({
        ...config,
        uploader: async (files, schema) => {
          const nodes: ProseMirrorNode[] = []
          for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue
            try {
              const src = await propsRef.current.uploadImage(file)
              const node = schema.nodes.image.createAndFill({ src, alt: file.name || '图片' })
              if (node) nodes.push(node)
            } catch {
              // The parent reports the error; keep the other successful uploads.
            }
          }
          return nodes
        },
      }))
    })
    // Publish synchronously so Save and source-mode switching include the last keystroke.
    editor.editor.use(
      $prose(
        (ctx) =>
          new Plugin({
            view: () => ({
              update(view, previous) {
                if (
                  disposed ||
                  editorRef.current !== editor ||
                  replacingRef.current ||
                  view.state.doc.eq(previous.doc)
                )
                  return
                const markdown = ctx.get(serializerCtx)(view.state.doc)
                valueRef.current = markdown
                propsRef.current.onChange(markdown)
              },
            }),
          })
      )
    )
    const created = editor
      .create()
      .then(() => {
        if (disposed) return
        editorRef.current = editor
        if (valueRef.current !== propsRef.current.value) {
          replacingRef.current = true
          try {
            editor.editor.action(replaceAll(propsRef.current.value))
            valueRef.current = propsRef.current.value
          } finally {
            replacingRef.current = false
          }
        }
        editor.setReadonly(propsRef.current.disabled)
        setReady(true)
      })
      .catch(() => {
        if (!disposed) setError('编辑器加载失败，请切换到 Markdown 源码继续编辑。')
      })
    return () => {
      disposed = true
      editorRef.current = null
      mount.remove()
      void created.then(() => editor.destroy()).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || valueRef.current === props.value) return
    replacingRef.current = true
    try {
      editor.editor.action(replaceAll(props.value))
      valueRef.current = props.value
    } finally {
      replacingRef.current = false
    }
  }, [props.value])

  useEffect(() => {
    editorRef.current?.setReadonly(props.disabled)
  }, [props.disabled])

  return (
    <div className="admin-markdown-editor rounded-md border" aria-busy={!ready && !error}>
      {error ? (
        <p role="alert" className="p-4 text-destructive">
          {error}
        </p>
      ) : null}
      {!ready && !error ? <p className="p-4 text-muted-foreground">正在加载编辑器…</p> : null}
      <div
        ref={rootRef}
        onClickCapture={(event) => {
          // Crepe toolbar buttons must never submit the surrounding article form.
          const button = (event.target as HTMLElement).closest('button')
          if (button && button.type === 'submit') event.preventDefault()
        }}
      />
    </div>
  )
}
