#!/usr/bin/env bun
/**
 * update-home-data.ts · 把新文章追加到 src/home/home-data.json
 */

import fs from 'node:fs'
import { resolveArticlePath, resolveProjectPath, sanitizeSlug } from '../lib/project.ts'

interface HomeDataShape {
  articles: Array<{ slug: string; [key: string]: unknown }>
  portal: {
    title: string
    subtitle: string
    lastUpdated: string
  }
}

export function defaultHomeData(): HomeDataShape {
  return {
    articles: [],
    portal: {
      title: 'A place for curious writing.',
      subtitle: 'Coming soon.',
      lastUpdated: new Date().toISOString().slice(0, 10),
    },
  }
}

export function normalizeHomeData(input: unknown): HomeDataShape {
  const defaults = defaultHomeData()
  const maybeObject = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const portal =
    typeof maybeObject.portal === 'object' && maybeObject.portal !== null
      ? (maybeObject.portal as Record<string, unknown>)
      : {}

  return {
    articles: Array.isArray(maybeObject.articles)
      ? (maybeObject.articles as Array<{ slug: string; [key: string]: unknown }>)
      : [],
    portal: {
      title: typeof portal.title === 'string' ? portal.title : defaults.portal.title,
      subtitle: typeof portal.subtitle === 'string' ? portal.subtitle : defaults.portal.subtitle,
      lastUpdated: typeof portal.lastUpdated === 'string' ? portal.lastUpdated : defaults.portal.lastUpdated,
    },
  }
}

function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    console.error('Usage: update-home-data.ts <slug>')
    process.exit(1)
  }

  const slug = sanitizeSlug(rawSlug)
  const articleMetaPath = resolveArticlePath(slug, 'meta.json')
  const homeDataPath = resolveProjectPath('src', 'home', 'home-data.json')

  if (!fs.existsSync(articleMetaPath)) {
    console.error(`Error: ${articleMetaPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(articleMetaPath, 'utf-8'))
  const homeData = fs.existsSync(homeDataPath)
    ? normalizeHomeData(JSON.parse(fs.readFileSync(homeDataPath, 'utf-8')))
    : defaultHomeData()

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

if (import.meta.main) {
  main()
}
