#!/usr/bin/env bun
/**
 * update-home-data.ts · 把新文章追加到 src/home/home-data.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { resolveArticlePath, resolveProjectPath, sanitizeSlug } from '../lib/project.ts'

interface HomeSeriesShape {
  seriesSlug: string
  seriesName: string
  tagline?: string
  colors: { primary: string; bg: string; accent?: string }
  articleCount: number
}

interface HomeArticleShape {
  slug: string
  series?: string
  [key: string]: unknown
}

interface HomeDataShape {
  articles: HomeArticleShape[]
  series: HomeSeriesShape[]
  portal: {
    title: string
    subtitle: string
    lastUpdated: string
  }
}

export function defaultHomeData(): HomeDataShape {
  return {
    articles: [],
    series: [],
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
      ? (maybeObject.articles as HomeArticleShape[])
      : [],
    series: Array.isArray(maybeObject.series) ? (maybeObject.series as HomeSeriesShape[]) : [],
    portal: {
      title: typeof portal.title === 'string' ? portal.title : defaults.portal.title,
      subtitle: typeof portal.subtitle === 'string' ? portal.subtitle : defaults.portal.subtitle,
      lastUpdated: typeof portal.lastUpdated === 'string' ? portal.lastUpdated : defaults.portal.lastUpdated,
    },
  }
}

/**
 * 扫 src/series/<slug>/spec.json，结合 articles 计算每个系列的文章数。
 * 系列没有 spec.json 时忽略。
 */
export function collectSeries(articles: HomeArticleShape[]): HomeSeriesShape[] {
  const seriesRoot = resolveProjectPath('src', 'series')
  if (!fs.existsSync(seriesRoot)) return []

  const results: HomeSeriesShape[] = []
  for (const entry of fs.readdirSync(seriesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const specPath = path.join(seriesRoot, entry.name, 'spec.json')
    if (!fs.existsSync(specPath)) continue

    let spec: {
      seriesSlug?: string
      seriesName?: string
      tagline?: string
      colors?: { primary?: string; bg?: string; accent?: string }
    }
    try {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
    } catch {
      continue
    }

    const seriesSlug = spec.seriesSlug ?? entry.name
    const articleCount = articles.filter((a) => a.series === seriesSlug).length

    results.push({
      seriesSlug,
      seriesName: spec.seriesName ?? seriesSlug,
      tagline: spec.tagline,
      colors: {
        primary: spec.colors?.primary ?? '#8338ec',
        bg: spec.colors?.bg ?? '#000000',
        accent: spec.colors?.accent,
      },
      articleCount,
    })
  }

  results.sort((a, b) => a.seriesSlug.localeCompare(b.seriesSlug))
  return results
}

function loadHomeData(): { data: HomeDataShape; path: string } {
  const homeDataPath = resolveProjectPath('src', 'home', 'home-data.json')
  const data = fs.existsSync(homeDataPath)
    ? normalizeHomeData(JSON.parse(fs.readFileSync(homeDataPath, 'utf-8')))
    : defaultHomeData()
  return { data, path: homeDataPath }
}

function persistHomeData(data: HomeDataShape, filePath: string): void {
  data.series = collectSeries(data.articles)
  data.portal.lastUpdated = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    console.error('Usage: update-home-data.ts <slug|--series-only>')
    process.exit(1)
  }

  const { data: homeData, path: homeDataPath } = loadHomeData()

  if (rawSlug === '--series-only') {
    persistHomeData(homeData, homeDataPath)
    console.error(`✓ refreshed series: ${homeData.series.length} entries`)
    return
  }

  const slug = sanitizeSlug(rawSlug)
  const articleMetaPath = resolveArticlePath(slug, 'meta.json')

  if (!fs.existsSync(articleMetaPath)) {
    console.error(`Error: ${articleMetaPath} not found`)
    process.exit(1)
  }

  const meta = JSON.parse(fs.readFileSync(articleMetaPath, 'utf-8'))
  const existingIdx = homeData.articles.findIndex((article) => article.slug === slug)
  if (existingIdx >= 0) {
    homeData.articles[existingIdx] = meta
    console.error(`✓ replaced: ${slug}`)
  } else {
    homeData.articles.push(meta)
    console.error(`✓ appended: ${slug}`)
  }

  persistHomeData(homeData, homeDataPath)
}

if (import.meta.main) {
  main()
}
