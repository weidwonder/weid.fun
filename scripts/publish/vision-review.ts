#!/usr/bin/env bun
/**
 * vision-review.ts · 准备视觉评审材料
 *
 * 用法：
 *   bun run scripts/publish/vision-review.ts <slug>
 *   bun run scripts/publish/vision-review.ts --path /src/articles/demo/ --label demo
 *
 * 说明：
 * - 本脚本不调用任何厂商 API
 * - 它只负责启动 preview、截图、整理 hard rules / review prompt / reference vault
 * - 评审结论由 Agent 在 skill 流程里结合这些材料自行作出
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn, type ChildProcess } from 'node:child_process'
import { chromium } from 'playwright'

const BREAKPOINTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

interface ReviewScreenshot {
  name: (typeof BREAKPOINTS)[number]['name']
  width: number
  height: number
  path: string
}

interface ReviewReference {
  name: string
  imagePath: string
  notesPath: string | null
}

interface ReviewBundle {
  slug: string | null
  pagePath: string
  reviewDir: string
  hardRulesPath: string
  reviewPromptPath: string
  screenshots: ReviewScreenshot[]
  references: ReviewReference[]
}

function usage(): never {
  console.error('Usage: vision-review.ts <slug> | --path <page-path> [--label <name>]')
  process.exit(1)
}

function normalizePagePath(pagePath: string): string {
  const withLeadingSlash = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function slugifyLabel(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'review'
}

function parseArgs(argv: string[]): { slug: string | null; pagePath: string; label: string } {
  if (argv.length === 0) usage()

  if (argv[0] === '--path') {
    const pagePath = argv[1]
    if (!pagePath) usage()

    const labelIndex = argv.indexOf('--label')
    const labelValue = labelIndex >= 0 ? argv[labelIndex + 1] : undefined

    return {
      slug: null,
      pagePath: normalizePagePath(pagePath),
      label: slugifyLabel(labelValue ?? pagePath),
    }
  }

  if (argv[0].startsWith('--')) usage()

  const slug = argv[0]
  return {
    slug,
    pagePath: `/src/articles/${slug}/`,
    label: slugifyLabel(slug),
  }
}

async function startPreview(): Promise<ChildProcess> {
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

function ensureReviewDir(label: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reviewDir = path.resolve('.tmp', 'vision-review', `${label}-${timestamp}`)
  fs.mkdirSync(reviewDir, { recursive: true })
  return reviewDir
}

async function captureScreenshots(pagePath: string, reviewDir: string): Promise<ReviewScreenshot[]> {
  const browser = await chromium.launch({ headless: true })
  const screenshots: ReviewScreenshot[] = []

  try {
    for (const bp of BREAKPOINTS) {
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } })
      const page = await ctx.newPage()
      const outputPath = path.join(reviewDir, `${bp.name}.png`)

      await page.goto(`http://localhost:4173${pagePath}`, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      })
      await page.screenshot({ path: outputPath, fullPage: false, type: 'png' })

      screenshots.push({
        name: bp.name,
        width: bp.width,
        height: bp.height,
        path: outputPath,
      })

      await ctx.close()
    }
  } finally {
    await browser.close()
  }

  return screenshots
}

function loadReferenceVault(): ReviewReference[] {
  const vault = path.resolve('src', 'reference-vault')
  if (!fs.existsSync(vault)) return []

  const references: ReviewReference[] = []
  for (const file of fs.readdirSync(vault)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
    const base = file.replace(/\.[^.]+$/, '')
    const notesPath = path.join(vault, `${base}.md`)
    references.push({
      name: base,
      imagePath: path.join(vault, file),
      notesPath: fs.existsSync(notesPath) ? notesPath : null,
    })
  }

  return references
}

function writeReviewInputs(reviewDir: string): { hardRulesPath: string; reviewPromptPath: string } {
  const hardRulesPath = path.join(reviewDir, 'hard-rules.merged.md')
  const reviewPromptPath = path.join(reviewDir, 'review-prompt.md')

  const hardRules = execSync('bun run scripts/publish/hard-rules-merge.ts').toString()
  const reviewPrompt = fs.readFileSync('src/standards/review-prompt.md', 'utf-8')

  fs.writeFileSync(hardRulesPath, hardRules)
  fs.writeFileSync(reviewPromptPath, reviewPrompt)

  return { hardRulesPath, reviewPromptPath }
}

async function main() {
  const { slug, pagePath, label } = parseArgs(process.argv.slice(2))
  const reviewDir = ensureReviewDir(label)
  const { hardRulesPath, reviewPromptPath } = writeReviewInputs(reviewDir)
  const preview = await startPreview()

  try {
    const screenshots = await captureScreenshots(pagePath, reviewDir)
    const bundle: ReviewBundle = {
      slug,
      pagePath,
      reviewDir,
      hardRulesPath,
      reviewPromptPath,
      screenshots,
      references: loadReferenceVault(),
    }

    console.log(JSON.stringify(bundle, null, 2))
  } finally {
    preview.kill('SIGINT')
  }
}

main().catch((err) => {
  console.error('[vision-review] fatal:', err)
  process.exit(2)
})
