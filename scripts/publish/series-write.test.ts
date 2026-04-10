import { describe, expect, test } from 'bun:test'
import { extractPrimitivesFromContent } from './series-write.ts'

describe('series-write helpers', () => {
  test('extractPrimitivesFromContent supports both direct and barrel imports', () => {
    const primitives = extractPrimitivesFromContent(`
import { CornerMarker } from '@/primitives/CornerMarker'
import { WebGLHero, ScrollReveal } from '@/primitives'
    `)

    expect(primitives).toEqual(['CornerMarker', 'ScrollReveal', 'WebGLHero'])
  })
})
