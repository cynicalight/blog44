import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeMdxAutolinks } from './admin-markdown'

test('converts URL autolinks without changing code, images, or existing links', () => {
  const source = [
    '* <https://example.com/a(b)>',
    '`<https://example.com/code>`',
    '```md',
    '<https://example.com/fenced>',
    '```',
    '![图片](https://example.com/image.png)',
    '[已有链接](https://example.com)',
  ].join('\n')
  const expected = source.replace(
    '<https://example.com/a(b)>',
    '[https://example.com/a(b)](https://example.com/a\\(b\\))'
  )
  const result = normalizeMdxAutolinks(source)
  assert.equal(result.body, expected)
  assert.equal(result.cursor, expected.length)
  assert.equal(normalizeMdxAutolinks(result.body).body, expected)
})

test('maps the caret after converted pasted links', () => {
  const source = '前 <https://example.com> 后'
  const cursor = source.indexOf('>') + 1
  const result = normalizeMdxAutolinks(source, cursor)
  assert.equal(result.body.slice(result.cursor), ' 后')
})
