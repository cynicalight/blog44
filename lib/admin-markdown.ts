import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

const parser = remark().use(remarkGfm)

type MarkdownNode = {
  type: string
  value?: string
  children?: MarkdownNode[]
  position?: { start: { line: number } }
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
