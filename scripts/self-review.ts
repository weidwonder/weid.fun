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

import { spawn, type ChildProcess } from 'node:child_process'
import { chromium, type Browser } from 'playwright'

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

async function startPreview(): Promise<ChildProcess> {
  console.error('[self-review] starting preview server...')
  const proc = spawn('bun', ['run', 'preview'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('preview timeout')), 30_000)

    proc.stdout?.on('data', (data) => {
      if (data.toString().includes('Local:')) {
        clearTimeout(timeout)
        setTimeout(resolve, 500)
      }
    })

    proc.stderr?.on('data', (data) => {
      if (data.toString().includes('error')) {
        clearTimeout(timeout)
        reject(new Error(data.toString()))
      }
    })

    proc.on('error', reject)
    proc.on('exit', (code) => {
      if (code && code !== 0) {
        clearTimeout(timeout)
        reject(new Error(`preview exited with code ${code}`))
      }
    })
  })

  return proc
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
    await page.goto(`http://localhost:4173${pagePath}`, {
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
  const pagePath = process.argv[2] || '/'
  console.error(`[self-review] reviewing ${pagePath}`)

  const previewProc = await startPreview()
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
    previewProc.kill('SIGINT')
  }

  console.log(JSON.stringify(result, null, 2))
  process.exit(result.pass ? 0 : 1)
}

main().catch((err) => {
  console.error('[self-review] fatal:', err)
  process.exit(2)
})
