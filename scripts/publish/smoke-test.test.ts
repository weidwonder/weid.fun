import { describe, expect, test } from 'bun:test'
import {
  buildSmokeTargets,
  evaluateCheck,
  formatSmokeResult,
  type SmokeCheck,
} from './smoke-test.ts'

describe('smoke-test · buildSmokeTargets', () => {
  test('strips trailing slash on site url and builds two targets', () => {
    const targets = buildSmokeTargets('https://weid.fun/', 'hello-world')
    expect(targets).toEqual([
      { label: 'article', url: 'https://weid.fun/src/articles/hello-world/' },
      { label: 'home', url: 'https://weid.fun/' },
    ])
  })

  test('preserves url that already has no trailing slash', () => {
    const targets = buildSmokeTargets('https://weid.fun', 'demo')
    expect(targets[0].url).toBe('https://weid.fun/src/articles/demo/')
    expect(targets[1].url).toBe('https://weid.fun/')
  })
})

describe('smoke-test · evaluateCheck', () => {
  test('200 + text/html is ok', () => {
    const check = evaluateCheck('https://weid.fun/', 200, 'text/html; charset=utf-8')
    expect(check.ok).toBe(true)
    expect(check.status).toBe(200)
    expect(check.reason).toBeUndefined()
  })

  test('404 is not ok', () => {
    const check = evaluateCheck('https://weid.fun/missing/', 404, 'text/html')
    expect(check.ok).toBe(false)
    expect(check.reason).toContain('status')
  })

  test('200 but non-html content-type is not ok', () => {
    const check = evaluateCheck('https://weid.fun/', 200, 'application/json')
    expect(check.ok).toBe(false)
    expect(check.reason).toContain('content-type')
  })

  test('null status represents network error and is not ok', () => {
    const check = evaluateCheck('https://weid.fun/', null, null, 'ECONNREFUSED')
    expect(check.ok).toBe(false)
    expect(check.reason).toContain('ECONNREFUSED')
  })
})

describe('smoke-test · formatSmokeResult', () => {
  test('all checks ok → pass true', () => {
    const checks: SmokeCheck[] = [
      { url: 'https://weid.fun/src/articles/x/', status: 200, contentType: 'text/html', ok: true },
      { url: 'https://weid.fun/', status: 200, contentType: 'text/html', ok: true },
    ]
    const result = formatSmokeResult('https://weid.fun', checks)
    expect(result.pass).toBe(true)
    expect(result.siteUrl).toBe('https://weid.fun')
    expect(result.checks).toHaveLength(2)
  })

  test('any check not ok → pass false', () => {
    const checks: SmokeCheck[] = [
      { url: 'https://weid.fun/src/articles/x/', status: 200, contentType: 'text/html', ok: true },
      { url: 'https://weid.fun/', status: 502, contentType: null, ok: false, reason: 'status 502' },
    ]
    const result = formatSmokeResult('https://weid.fun', checks)
    expect(result.pass).toBe(false)
  })
})
