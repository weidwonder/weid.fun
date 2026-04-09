#!/usr/bin/env bun
/**
 * series-write.ts · 从系列首篇文章提取风格决策写入 spec.json
 */

import fs from 'node:fs'
import path from 'node:path'

function extractPrimitives(pageTsxPath: string): string[] {
  const content = fs.readFileSync(pageTsxPath, 'utf-8')
  const primitives: string[] = []
  const importRe = /from\s+['"]@\/primitives\/([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = importRe.exec(content)) !== null) {
    primitives.push(match[1])
  }
  return primitives
}

function main() {
  const [seriesName, slug] = process.argv.slice(2)
  if (!seriesName || !slug) {
    console.error('Usage: series-write.ts <series-name> <slug>')
    process.exit(1)
  }

  const metaPath = path.join('src', 'articles', slug, 'meta.json')
  const pageTsxPath = path.join('src', 'articles', slug, 'page.tsx')
  if (!fs.existsSync(metaPath) || !fs.existsSync(pageTsxPath)) {
    console.error(`Error: article ${slug} not found or incomplete`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const primitives = extractPrimitives(pageTsxPath)

  const spec = {
    seriesName,
    originSlug: slug,
    createdAt: new Date().toISOString(),
    colors: meta.colors,
    primitives,
    note: 'Generated from the first article. Subsequent articles in this series should honor these constraints.',
  }

  const seriesDir = path.join('series', seriesName)
  fs.mkdirSync(seriesDir, { recursive: true })
  fs.writeFileSync(path.join(seriesDir, 'spec.json'), `${JSON.stringify(spec, null, 2)}\n`)

  console.error(`✓ series spec written: ${seriesDir}/spec.json`)
}

main()
