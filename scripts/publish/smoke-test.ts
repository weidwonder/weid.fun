#!/usr/bin/env bun
/**
 * smoke-test.ts · 部署后的 HEAD smoke 检查
 *
 * 用法：
 *   WEID_SITE_URL=https://weid.fun bun run scripts/publish/smoke-test.ts <slug>
 *
 * 输出：JSON { pass, siteUrl, checks: [...] }
 * exit: 0=pass · 1=检查失败 · 2=env 缺失 · 3=其他内部错误
 */

export interface SmokeTarget {
  label: 'article' | 'home'
  url: string
}

export interface SmokeCheck {
  url: string
  status: number | null
  contentType: string | null
  ok: boolean
  reason?: string
}

export interface SmokeResult {
  pass: boolean
  siteUrl: string
  checks: SmokeCheck[]
}

export function buildSmokeTargets(rawSiteUrl: string, slug: string): SmokeTarget[] {
  const siteUrl = rawSiteUrl.endsWith('/') ? rawSiteUrl.slice(0, -1) : rawSiteUrl
  return [
    { label: 'article', url: `${siteUrl}/src/articles/${slug}/` },
    { label: 'home', url: `${siteUrl}/` },
  ]
}

export function evaluateCheck(
  url: string,
  status: number | null,
  contentType: string | null,
  errorReason?: string,
): SmokeCheck {
  if (status === null) {
    return { url, status: null, contentType, ok: false, reason: errorReason ?? 'network error' }
  }

  if (status !== 200) {
    return { url, status, contentType, ok: false, reason: `unexpected status ${status}` }
  }

  if (!contentType || !contentType.toLowerCase().includes('text/html')) {
    return { url, status, contentType, ok: false, reason: `unexpected content-type ${contentType ?? 'null'}` }
  }

  return { url, status, contentType, ok: true }
}

export function formatSmokeResult(siteUrl: string, checks: SmokeCheck[]): SmokeResult {
  return {
    pass: checks.every((c) => c.ok),
    siteUrl,
    checks,
  }
}
