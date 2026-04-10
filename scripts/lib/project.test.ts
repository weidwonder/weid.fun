import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import { PROJECT_ROOT, resolveArticleDir, sanitizeSlug } from './project.ts'

describe('project helpers', () => {
  test('sanitizeSlug strips traversal and normalizes to safe slug', () => {
    expect(sanitizeSlug('../../etc/passwd')).toBe('etc-passwd')
    expect(sanitizeSlug('Hello, weid.fun')).toBe('hello-weid-fun')
  })

  test('resolveArticleDir always stays inside src/articles', () => {
    const articleDir = resolveArticleDir('../../etc/passwd')

    expect(articleDir).toBe(path.join(PROJECT_ROOT, 'src', 'articles', 'etc-passwd'))
    expect(articleDir.startsWith(path.join(PROJECT_ROOT, 'src', 'articles') + path.sep)).toBe(true)
  })
})
