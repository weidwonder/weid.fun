import { describe, expect, test } from 'bun:test'
import { defaultHomeData, normalizeHomeData } from './update-home-data.ts'

describe('update-home-data helpers', () => {
  test('normalizeHomeData recreates missing articles array and portal shape', () => {
    const normalized = normalizeHomeData({})

    expect(normalized.articles).toEqual([])
    expect(normalized.portal.title).toBe(defaultHomeData().portal.title)
    expect(normalized.portal.subtitle).toBe(defaultHomeData().portal.subtitle)
    expect(typeof normalized.portal.lastUpdated).toBe('string')
  })

  test('normalizeHomeData preserves valid existing values', () => {
    const normalized = normalizeHomeData({
      articles: [{ slug: 'hello-world', title: 'Hello' }],
      portal: {
        title: 'Custom Title',
        subtitle: 'Custom Subtitle',
        lastUpdated: '2026-04-10',
      },
    })

    expect(normalized.articles).toHaveLength(1)
    expect(normalized.portal.title).toBe('Custom Title')
    expect(normalized.portal.subtitle).toBe('Custom Subtitle')
    expect(normalized.portal.lastUpdated).toBe('2026-04-10')
  })
})
