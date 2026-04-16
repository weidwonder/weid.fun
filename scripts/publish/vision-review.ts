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
import { chromium } from 'playwright'
import { PREVIEW_BASE_URL, startPreviewServer } from '../lib/preview-server.ts'
import { resolveProjectPath, sanitizeSlug } from '../lib/project.ts'
import { mergeHardRules } from './hard-rules-merge.ts'

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
  sessionDir: string
  reviewDir: string
  hardRulesPath: string
  reviewPromptPath: string
  agentVerdictPath: string
  iterationPath: string
  screenshots: ReviewScreenshot[]
  references: ReviewReference[]
}

function usage(): never {
  console.error(
    'Usage: vision-review.ts <slug> [--kind article|series] | --path <page-path> [--label <name>]',
  )
  process.exit(1)
}

type PageKind = 'article' | 'series'

function pagePathForKind(kind: PageKind, slug: string): string {
  return kind === 'series' ? `/src/series/${slug}/` : `/src/articles/${slug}/`
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

  const slug = sanitizeSlug(argv[0])
  const kindIndex = argv.indexOf('--kind')
  const kindRaw = kindIndex >= 0 ? argv[kindIndex + 1] : 'article'
  if (kindRaw !== 'article' && kindRaw !== 'series') {
    console.error(`Invalid --kind: ${JSON.stringify(kindRaw)}. Must be "article" or "series".`)
    process.exit(1)
  }
  const kind: PageKind = kindRaw
  return {
    slug,
    pagePath: pagePathForKind(kind, slug),
    label: slugifyLabel(kind === 'series' ? `series-${slug}` : slug),
  }
}

function ensureReviewWorkspace(label: string): {
  sessionDir: string
  reviewDir: string
  agentVerdictPath: string
  iterationPath: string
} {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionDir = resolveProjectPath('.tmp', 'vision-review', label)
  const reviewDir = path.join(sessionDir, timestamp)
  fs.mkdirSync(reviewDir, { recursive: true })
  const agentVerdictPath = path.join(sessionDir, 'agent-verdict.json')
  const iterationPath = path.join(sessionDir, 'iteration.txt')

  if (!fs.existsSync(iterationPath)) {
    fs.writeFileSync(iterationPath, '0\n')
  }

  return { sessionDir, reviewDir, agentVerdictPath, iterationPath }
}

async function captureScreenshots(pagePath: string, reviewDir: string): Promise<ReviewScreenshot[]> {
  const browser = await chromium.launch({ headless: true })
  const screenshots: ReviewScreenshot[] = []

  try {
    for (const bp of BREAKPOINTS) {
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } })
      const page = await ctx.newPage()
      const outputPath = path.join(reviewDir, `${bp.name}.png`)

      await page.goto(`${PREVIEW_BASE_URL}${pagePath}`, {
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
  const vault = resolveProjectPath('src', 'reference-vault')
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

  const hardRules = mergeHardRules()
  const reviewPrompt = fs.readFileSync(resolveProjectPath('src', 'standards', 'review-prompt.md'), 'utf-8')

  fs.writeFileSync(hardRulesPath, hardRules)
  fs.writeFileSync(reviewPromptPath, reviewPrompt)

  return { hardRulesPath, reviewPromptPath }
}

async function main() {
  const { slug, pagePath, label } = parseArgs(process.argv.slice(2))
  const { sessionDir, reviewDir, agentVerdictPath, iterationPath } = ensureReviewWorkspace(label)
  const { hardRulesPath, reviewPromptPath } = writeReviewInputs(reviewDir)
  const preview = await startPreviewServer()

  try {
    const screenshots = await captureScreenshots(pagePath, reviewDir)
    const bundle: ReviewBundle = {
      slug,
      pagePath,
      sessionDir,
      reviewDir,
      hardRulesPath,
      reviewPromptPath,
      agentVerdictPath,
      iterationPath,
      screenshots,
      references: loadReferenceVault(),
    }

    console.log(JSON.stringify(bundle, null, 2))
  } finally {
    await preview.stop()
  }
}

main().catch((err) => {
  console.error('[vision-review] fatal:', err)
  process.exit(2)
})
