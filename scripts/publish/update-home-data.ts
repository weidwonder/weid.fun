#!/usr/bin/env bun
/**
 * update-home-data.ts · 把新文章追加到 src/home/home-data.json
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: update-home-data.ts <slug>')
    process.exit(1)
  }

  const articleMetaPath = path.join('src', 'articles', slug, 'meta.json')
  const homeDataPath = path.join('src', 'home', 'home-data.json')

  if (!fs.existsSync(articleMetaPath)) {
    console.error(`Error: ${articleMetaPath} not found`)
    process.exit(1)
  }

  if (!fs.existsSync(homeDataPath)) {
    console.error(`Error: ${homeDataPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(articleMetaPath, 'utf-8'))
  const homeData = JSON.parse(fs.readFileSync(homeDataPath, 'utf-8'))

  const existingIdx = homeData.articles.findIndex((article: { slug: string }) => article.slug === slug)
  if (existingIdx >= 0) {
    homeData.articles[existingIdx] = meta
    console.error(`✓ replaced: ${slug}`)
  } else {
    homeData.articles.push(meta)
    console.error(`✓ appended: ${slug}`)
  }

  homeData.portal.lastUpdated = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(homeDataPath, `${JSON.stringify(homeData, null, 2)}\n`)
}

main()
