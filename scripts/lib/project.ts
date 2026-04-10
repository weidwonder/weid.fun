import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const PROJECT_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/

function ensureInside(parentDir: string, candidatePath: string, label: string): string {
  const normalizedParent = parentDir.endsWith(path.sep) ? parentDir : `${parentDir}${path.sep}`
  if (candidatePath !== parentDir && !candidatePath.startsWith(normalizedParent)) {
    throw new Error(`${label} resolved outside allowed directory: ${candidatePath}`)
  }

  return candidatePath
}

export function resolveProjectPath(...segments: string[]): string {
  return ensureInside(PROJECT_ROOT, path.resolve(PROJECT_ROOT, ...segments), 'project path')
}

export function resolveCliPath(inputPath: string): string {
  return path.isAbsolute(inputPath) ? path.resolve(inputPath) : path.resolve(PROJECT_ROOT, inputPath)
}

export function slugifySegment(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  )
}

export function sanitizeSlug(input: string, label = 'slug'): string {
  const sanitized = slugifySegment(input)
  if (!SAFE_SLUG_RE.test(sanitized)) {
    throw new Error(`Invalid ${label}: ${input}`)
  }

  return sanitized
}

export function resolveArticleDir(inputSlug: string): string {
  const articlesRoot = resolveProjectPath('src', 'articles')
  const articleDir = path.resolve(articlesRoot, sanitizeSlug(inputSlug))
  return ensureInside(articlesRoot, articleDir, 'article directory')
}

export function resolveArticlePath(inputSlug: string, ...segments: string[]): string {
  return path.join(resolveArticleDir(inputSlug), ...segments)
}

export function resolveSeriesDir(seriesName: string): string {
  const seriesRoot = resolveProjectPath('series')
  const seriesDir = path.resolve(seriesRoot, sanitizeSlug(seriesName, 'series name'))
  return ensureInside(seriesRoot, seriesDir, 'series directory')
}

export function resolveSeriesPath(seriesName: string, ...segments: string[]): string {
  return path.join(resolveSeriesDir(seriesName), ...segments)
}
