import { describe, expect, test } from 'bun:test'
import { buildExcerpt } from './organize-source.ts'

describe('organize-source helpers', () => {
  test('buildExcerpt strips front matter and fenced code blocks', () => {
    const excerpt = buildExcerpt(`---
title: Demo
---

# Heading

Intro paragraph.

\`\`\`ts
console.log('hidden')
\`\`\`

Tail paragraph.`)

    expect(excerpt).toContain('Intro paragraph.')
    expect(excerpt).toContain('Tail paragraph.')
    expect(excerpt).not.toContain('title:')
    expect(excerpt).not.toContain("console.log('hidden')")
  })
})
