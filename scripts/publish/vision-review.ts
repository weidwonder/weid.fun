#!/usr/bin/env bun
/**
 * vision-review.ts · 用 Claude Vision 评审页面截图
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn, type ChildProcess } from 'node:child_process'
import Anthropic from '@anthropic-ai/sdk'
import { chromium } from 'playwright'

const BREAKPOINTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

function detectMediaType(file: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (/\.png$/i.test(file)) return 'image/png'
  if (/\.webp$/i.test(file)) return 'image/webp'
  return 'image/jpeg'
}

async function startPreview(): Promise<ChildProcess> {
  const proc = spawn('bun', ['run', 'preview'], { stdio: ['ignore', 'pipe', 'pipe'] })
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
  })
  return proc
}

async function captureScreenshots(slug: string): Promise<Record<string, Buffer>> {
  const browser = await chromium.launch()
  const shots: Record<string, Buffer> = {}

  try {
    for (const bp of BREAKPOINTS) {
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } })
      const page = await ctx.newPage()
      await page.goto(`http://localhost:4173/src/articles/${slug}/`, { waitUntil: 'networkidle' })
      shots[bp.name] = await page.screenshot({ fullPage: false, type: 'png' })
      await ctx.close()
    }
  } finally {
    await browser.close()
  }

  return shots
}

async function loadReferenceVault(): Promise<Array<{ name: string; data: Buffer; desc: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>> {
  const vault = path.join('src', 'reference-vault')
  if (!fs.existsSync(vault)) return []

  const refs: Array<{ name: string; data: Buffer; desc: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }> = []
  for (const file of fs.readdirSync(vault)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
    const base = file.replace(/\.[^.]+$/, '')
    const descPath = path.join(vault, `${base}.md`)
    const desc = fs.existsSync(descPath) ? fs.readFileSync(descPath, 'utf-8') : ''
    refs.push({
      name: base,
      data: fs.readFileSync(path.join(vault, file)),
      desc,
      mediaType: detectMediaType(file),
    })
  }

  return refs
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: vision-review.ts <slug>')
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set')
    process.exit(2)
  }

  const hardRules = execSync('bun run scripts/publish/hard-rules-merge.ts').toString()
  const reviewPrompt = fs.readFileSync('src/standards/review-prompt.md', 'utf-8')

  const preview = await startPreview()
  let shots: Record<string, Buffer>
  try {
    shots = await captureScreenshots(slug)
  } finally {
    preview.kill('SIGINT')
  }

  const refs = await loadReferenceVault()
  const anthropic = new Anthropic({ apiKey })

  const content: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: `# Hard Rules\n\n${hardRules}\n\n---\n\n# Review Prompt\n\n${reviewPrompt}` },
    { type: 'text', text: '\n## Screenshots of the article\n' },
  ]

  for (const bp of BREAKPOINTS) {
    content.push({ type: 'text', text: `\n**${bp.name} (${bp.width}×${bp.height})**:` })
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: shots[bp.name].toString('base64'),
      },
    })
  }

  if (refs.length > 0) {
    content.push({ type: 'text', text: '\n## Reference Vault\n' })
    for (const ref of refs) {
      content.push({ type: 'text', text: `\n**${ref.name}**: ${ref.desc.slice(0, 300)}` })
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: ref.mediaType,
          data: ref.data.toString('base64'),
        },
      })
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content }],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Error: Could not parse JSON from Claude response')
    console.error('Raw response:', text)
    process.exit(3)
  }

  const review = JSON.parse(jsonMatch[0])
  console.log(JSON.stringify(review, null, 2))
  process.exit(review.pass ? 0 : 1)
}

main().catch((err) => {
  console.error('[vision-review] fatal:', err)
  process.exit(4)
})
