#!/usr/bin/env bun
/**
 * self-review.ts · 页面机械自审脚本
 *
 * 用法：
 *   bun run scripts/self-review.ts <page-path>
 *
 * <page-path> 示例：
 *   /
 *   /src/articles/hello-world/
 */

import { chromium, type Browser } from 'playwright'
import { PREVIEW_BASE_URL, startPreviewServer } from './lib/preview-server.ts'

const BREAKPOINTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

interface BreakpointResult {
  passed: boolean
  issues: string[]
}

interface ReviewResult {
  pass: boolean
  score: number
  issues: string[]
  breakpoints: Record<string, BreakpointResult>
}

function normalizePagePath(pagePath: string): string {
  const withLeadingSlash = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

async function reviewBreakpoint(
  browser: Browser,
  pagePath: string,
  bp: (typeof BREAKPOINTS)[number],
): Promise<BreakpointResult> {
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
  })
  const page = await context.newPage()

  const issues: string[] = []
  const consoleErrors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  try {
    await page.goto(`${PREVIEW_BASE_URL}${pagePath}`, {
      waitUntil: 'networkidle',
      timeout: 15_000,
    })

    const hasHscroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    if (hasHscroll) issues.push(`[${bp.name}] horizontal scroll detected`)

    const bodyText = await page.evaluate(() => document.body.innerText.trim())
    if (bodyText.length === 0) issues.push(`[${bp.name}] page body is empty`)

    if (consoleErrors.length > 0) {
      issues.push(`[${bp.name}] console errors: ${consoleErrors.slice(0, 3).join(' | ')}`)
    }

    const firstScreenContentHeight = await page.evaluate(() => {
      return document.body.getBoundingClientRect().height
    })
    if (firstScreenContentHeight < bp.height * 0.5) {
      issues.push(
        `[${bp.name}] first screen content suspiciously small (${firstScreenContentHeight}px)`,
      )
    }
  } catch (err) {
    issues.push(`[${bp.name}] navigation failed: ${(err as Error).message}`)
  } finally {
    await context.close()
  }

  return { passed: issues.length === 0, issues }
}

async function main() {
  const pagePath = normalizePagePath(process.argv[2] || '/')
  console.error(`[self-review] reviewing ${pagePath}`)

  console.error('[self-review] starting preview server...')
  const previewServer = await startPreviewServer()
  const browser = await chromium.launch({ headless: true })

  const result: ReviewResult = {
    pass: true,
    score: 100,
    issues: [],
    breakpoints: {
      desktop: { passed: false, issues: [] },
      tablet: { passed: false, issues: [] },
      mobile: { passed: false, issues: [] },
    },
  }

  try {
    for (const bp of BREAKPOINTS) {
      const bpResult = await reviewBreakpoint(browser, pagePath, bp)
      result.breakpoints[bp.name] = bpResult
      if (!bpResult.passed) {
        result.pass = false
        result.issues.push(...bpResult.issues)
      }
    }
    result.score = result.pass ? 100 : Math.max(0, 100 - result.issues.length * 15)
  } finally {
    await browser.close()
    await previewServer.stop()
  }

  console.log(JSON.stringify(result, null, 2))
  process.exit(result.pass ? 0 : 1)
}

main().catch((err) => {
  console.error('[self-review] fatal:', err)
  process.exit(2)
})
