#!/usr/bin/env bun
/**
 * organize-source.ts · 把 inbox/<name>/ 复制到 src/articles/<slug>/source/
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  resolveArticleDir,
  resolveCliPath,
  sanitizeSlug,
  slugifySegment,
  validateSlug,
} from '../lib/project.ts'

interface Args {
  inboxPath: string
  slug?: string
  seriesSlug?: string
  seriesName?: string
  pin: boolean
}

function parseArgs(argv: string[]): Args {
  if (argv.length === 0) {
    console.error(
      'Usage: organize-source.ts <inbox-path> [--slug <s>] [--series-slug <s> --series-name <name>] [--pin]',
    )
    process.exit(1)
  }

  const args: Args = { inboxPath: argv[0], pin: false }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--slug') args.slug = argv[++i]
    else if (arg === '--series-slug') args.seriesSlug = argv[++i]
    else if (arg === '--series-name') args.seriesName = argv[++i]
    else if (arg === '--pin') args.pin = true
  }

  if ((args.seriesSlug && !args.seriesName) || (!args.seriesSlug && args.seriesName)) {
    console.error('Error: --series-slug and --series-name must be provided together.')
    process.exit(1)
  }

  return args
}

function slugify(text: string): string {
  return slugifySegment(text)
}

export function buildExcerpt(rawMd: string): string {
  return rawMd
    .replace(/^---[\s\S]*?---\n*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

function extractTitle(rawMd: string): string {
  const h1 = rawMd.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()

  const firstLine = rawMd
    .split('\n')
    .find((line) => line.trim())
    ?.trim()

  return (firstLine || 'Untitled').slice(0, 100)
}

function copyRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, item.name)
    const destPath = path.join(dest, item.name)
    if (item.isDirectory()) {
      copyRecursive(sourcePath, destPath)
    } else {
      fs.copyFileSync(sourcePath, destPath)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const inboxPath = resolveCliPath(args.inboxPath)

  if (!fs.existsSync(inboxPath)) {
    console.error(`Error: ${inboxPath} does not exist`)
    process.exit(1)
  }

  const rawMdPath = path.join(inboxPath, 'raw.md')
  if (!fs.existsSync(rawMdPath)) {
    console.error(`Error: ${rawMdPath} does not exist. inbox/<name>/ must contain raw.md`)
    process.exit(1)
  }

  const rawMd = fs.readFileSync(rawMdPath, 'utf-8')
  const title = extractTitle(rawMd)
  const slug = sanitizeSlug(args.slug ? args.slug : slugify(title))

  const articleDir = resolveArticleDir(slug)
  if (fs.existsSync(articleDir)) {
    console.error(`Error: ${articleDir} already exists. Delete it first to regenerate.`)
    process.exit(1)
  }

  const sourceDir = path.join(articleDir, 'source')
  copyRecursive(inboxPath, sourceDir)

  const seriesSlug = args.seriesSlug ? validateSlug(args.seriesSlug, 'series slug') : undefined

  const meta = {
    slug,
    title,
    series: seriesSlug,
    seriesName: args.seriesName || undefined,
    publishedAt: new Date().toISOString().slice(0, 10),
    pin: args.pin,
    colors: {
      primary: '#8338ec',
      bg: '#000000',
    },
    excerpt: buildExcerpt(rawMd),
  }

  fs.writeFileSync(path.join(articleDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)

  console.error(`✓ organized: ${articleDir}`)
  console.log(`SLUG=${slug}`)
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[organize-source] fatal:', err)
    process.exit(1)
  })
}
