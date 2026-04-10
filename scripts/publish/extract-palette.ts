#!/usr/bin/env bun
/**
 * extract-palette.ts · 从 src/articles/<slug>/source/attachments 的第一张图提取主色
 */

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { resolveArticlePath, sanitizeSlug } from '../lib/project.ts'

function rgbToHex(r: number, g: number, b: number): string {
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function findFirstImage(dir: string): string | null {
  if (!fs.existsSync(dir)) return null

  const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(item.name)) return fullPath
    if (item.isDirectory()) {
      const nested = findFirstImage(fullPath)
      if (nested) return nested
    }
  }

  return null
}

async function extractDominantColor(imgPath: string): Promise<string> {
  const { data, info } = await sharp(imgPath)
    .resize(50, 50, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  let r = 0
  let g = 0
  let b = 0
  let n = 0

  for (let i = 0; i < data.length; i += info.channels) {
    const pr = data[i]
    const pg = data[i + 1]
    const pb = data[i + 2]
    const brightness = (pr + pg + pb) / 3
    if (brightness < 20 || brightness > 235) continue
    r += pr
    g += pg
    b += pb
    n++
  }

  if (n === 0) return '#8338ec'
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n))
}

async function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    console.error('Usage: extract-palette.ts <slug>')
    process.exit(1)
  }

  const slug = sanitizeSlug(rawSlug)
  const articleDir = resolveArticlePath(slug)
  const metaPath = resolveArticlePath(slug, 'meta.json')
  if (!fs.existsSync(metaPath)) {
    console.error(`Error: ${metaPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const imgPath = findFirstImage(path.join(articleDir, 'source', 'attachments'))

  if (!imgPath) {
    console.error('[extract-palette] no image found, using default color')
    meta.colors.primary = '#8338ec'
  } else {
    console.error(`[extract-palette] extracting from ${imgPath}`)
    meta.colors.primary = await extractDominantColor(imgPath)
  }

  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`)
  console.error(`✓ palette: ${meta.colors.primary}`)
}

main().catch((err) => {
  console.error('[extract-palette] fatal:', err)
  process.exit(1)
})
