import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

const parser = remark().use(remarkGfm)

type MarkdownNode = {
  type: string
  value?: string
  children?: MarkdownNode[]
  position?: { start: { line: number; offset?: number }; end: { offset?: number } }
}

// MDX treats angle-bracket autolinks as JSX. Only rewrite parsed link nodes,
// leaving code, escaped text, images and existing links untouched.
export function normalizeMdxAutolinks(body: string, cursor = body.length) {
  const replacements: { start: number; end: number; text: string }[] = []
  function visit(node: MarkdownNode) {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    if (node.type === 'link' && start !== undefined && end !== undefined) {
      const match = /^<(https?:\/\/[^\s<>]+)>$/i.exec(body.slice(start, end))
      if (match) {
        const label = match[1].replace(/[\\\[\]]/g, '\\$&')
        const destination = match[1].replace(/[\\()]/g, '\\$&')
        replacements.push({ start, end, text: `[${label}](${destination})` })
      }
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(parser.parse(body))
  let result = body
  let nextCursor = cursor
  for (const { start, end, text } of replacements.reverse()) {
    result = result.slice(0, start) + text + result.slice(end)
    if (cursor >= end) nextCursor += text.length - (end - start)
    else if (cursor > start) nextCursor = start + text.length
  }
  return { body: result, cursor: nextCursor }
}

// Inspect parsed Markdown so autolinks, escaped tags and code remain editable.
export function getSourceModeReason(body: string): string | null {
  const tree = parser.parse(body)

  function inspect(node: MarkdownNode, parentType?: string): string | null {
    const line = node.position?.start.line ?? 1
    if (node.type === 'html') {
      // Crepe preserves empty paragraphs with bare <br /> placeholders.
      const unsupported = (node.value ?? '').replace(/<br\s*\/?\s*>/gi, '').trim()
      if (unsupported) return `第 ${line} 行包含 HTML/MDX：${unsupported.slice(0, 80)}`
    }
    if (node.type === 'paragraph' && parentType === 'root') {
      const first = node.children?.[0]
      if (first?.type === 'text' && /^(?:import|export)\s/.test(first.value ?? '')) {
        return `第 ${line} 行包含 import/export 声明`
      }
    }
    for (const child of node.children ?? []) {
      const reason = inspect(child, node.type)
      if (reason) return reason
    }
    return null
  }

  return inspect(tree)
}
