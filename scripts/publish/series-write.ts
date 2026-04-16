#!/usr/bin/env bun
/**
 * series-write.ts · 从系列首篇文章提取风格决策写入 spec.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { resolveArticlePath, resolveSeriesDir, sanitizeSlug, validateSlug } from '../lib/project.ts'

export function extractPrimitivesFromContent(content: string): string[] {
  const primitives = new Set<string>()

  const directImportRe = /from\s+['"]@\/primitives\/([^'"]+)['"]/g
  let directMatch: RegExpExecArray | null
  while ((directMatch = directImportRe.exec(content)) !== null) {
    primitives.add(directMatch[1])
  }

  const barrelImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]@\/primitives['"]/g
  let barrelMatch: RegExpExecArray | null
  while ((barrelMatch = barrelImportRe.exec(content)) !== null) {
    for (const name of barrelMatch[1].split(',')) {
      const cleaned = name.trim().replace(/\s+as\s+\w+$/, '')
      if (cleaned) primitives.add(cleaned)
    }
  }

  return [...primitives].sort()
}

function extractPrimitives(pageTsxPath: string): string[] {
  const content = fs.readFileSync(pageTsxPath, 'utf-8')
  return extractPrimitivesFromContent(content)
}

function main() {
  const [rawSeriesSlug, rawArticleSlug] = process.argv.slice(2)
  if (!rawSeriesSlug || !rawArticleSlug) {
    console.error('Usage: series-write.ts <series-slug> <article-slug>')
    process.exit(1)
  }

  const seriesSlug = validateSlug(rawSeriesSlug, 'series slug')
  const slug = sanitizeSlug(rawArticleSlug)
  const metaPath = resolveArticlePath(slug, 'meta.json')
  const pageTsxPath = resolveArticlePath(slug, 'page.tsx')
  if (!fs.existsSync(metaPath) || !fs.existsSync(pageTsxPath)) {
    console.error(`Error: article ${slug} not found or incomplete`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  if (!meta.seriesName) {
    console.error(
      `Error: article ${slug}/meta.json is missing 'seriesName'. Pass --series-name to organize-source for series articles.`,
    )
    process.exit(1)
  }
  if (meta.series !== seriesSlug) {
    console.error(
      `Error: article ${slug}/meta.json has series="${meta.series}" but expected "${seriesSlug}".`,
    )
    process.exit(1)
  }

  const primitives = extractPrimitives(pageTsxPath)

  const spec = {
    seriesSlug,
    seriesName: meta.seriesName,
    tagline: meta.seriesTagline || undefined,
    originSlug: slug,
    createdAt: new Date().toISOString(),
    colors: meta.colors,
    primitives,
    note: 'Generated from the first article. Subsequent articles in this series should honor these constraints.',
  }

  const seriesDir = resolveSeriesDir(seriesSlug)
  fs.mkdirSync(seriesDir, { recursive: true })
  fs.writeFileSync(path.join(seriesDir, 'spec.json'), `${JSON.stringify(spec, null, 2)}\n`)

  console.error(`✓ series spec written: ${seriesDir}/spec.json`)
}

if (import.meta.main) {
  main()
}
