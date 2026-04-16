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

import { sanitizeSlug } from '../lib/project.ts'

const PER_REQUEST_TIMEOUT_MS = 10_000

async function headOnce(
  url: string,
  timeoutMs: number,
): Promise<{ status: number | null; contentType: string | null; error?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    })
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
    }
  } catch (err) {
    return { status: null, contentType: null, error: (err as Error).message }
  } finally {
    clearTimeout(timer)
  }
}

export async function probe(url: string, timeoutMs = PER_REQUEST_TIMEOUT_MS): Promise<SmokeCheck> {
  const first = await headOnce(url, timeoutMs)
  if (first.status !== null) {
    return evaluateCheck(url, first.status, first.contentType)
  }

  const second = await headOnce(url, timeoutMs)
  if (second.status !== null) {
    return evaluateCheck(url, second.status, second.contentType)
  }

  return evaluateCheck(url, null, null, second.error ?? first.error)
}

async function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    process.stderr.write('Usage: smoke-test.ts <slug>\n')
    process.exit(3)
  }

  const siteUrl = process.env.WEID_SITE_URL
  if (!siteUrl) {
    process.stderr.write(
      '[smoke-test] WEID_SITE_URL not set (did caller forget `eval $(deploy-config.ts load)`?)\n',
    )
    process.exit(2)
  }

  const slug = sanitizeSlug(rawSlug)
  const targets = buildSmokeTargets(siteUrl, slug)

  const checks: SmokeCheck[] = []
  for (const target of targets) {
    checks.push(await probe(target.url))
  }

  const result = formatSmokeResult(siteUrl, checks)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.pass ? 0 : 1)
}

if (import.meta.main) {
  main().catch((err) => {
    process.stderr.write(`[smoke-test] fatal: ${(err as Error).message}\n`)
    process.exit(3)
  })
}
