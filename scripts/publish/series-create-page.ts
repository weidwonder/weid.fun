#!/usr/bin/env bun
/**
 * series-create-page.ts · 为系列入口生成 index.html / main.tsx / page.tsx
 *
 * 前置:`src/series/<slug>/spec.json` 已由 series-write.ts 写入。
 * 产物:与 spec.json 同级的 index.html / main.tsx / page.tsx。
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { resolveSeriesDir, validateSlug } from '../lib/project.ts'

function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    console.error('Usage: series-create-page.ts <series-slug>')
    process.exit(1)
  }

  const seriesSlug = validateSlug(rawSlug, 'series slug')
  const seriesDir = resolveSeriesDir(seriesSlug)
  const specPath = path.join(seriesDir, 'spec.json')
  if (!fs.existsSync(specPath)) {
    console.error(`Error: ${specPath} does not exist. Run series-write.ts first.`)
    process.exit(1)
  }

  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))

  const indexHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${spec.seriesName} · weid.fun</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
`

  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import { SeriesPage } from './page'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SeriesPage />
  </React.StrictMode>
)
`

  const pageTsx = `import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'
import type { ArticleMeta, SeriesSpec } from '@/lib/types'
import homeData from '@/home/home-data.json'
import spec from './spec.json'

const seriesSpec = spec as SeriesSpec
const allArticles = (homeData as { articles: ArticleMeta[] }).articles

export function SeriesPage() {
  const articles = allArticles
    .filter((a) => a.series === seriesSpec.seriesSlug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title={seriesSpec.seriesName}
        subtitle={seriesSpec.tagline || \`\${articles.length} articles\`}
        primaryColor={seriesSpec.colors.primary}
        bgColor={seriesSpec.colors.bg}
      />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 flex items-baseline justify-between">
          <p className="font-mono text-fluid-xs uppercase tracking-widest text-neutral-500">
            Series · {seriesSpec.seriesSlug}
          </p>
          <p className="font-mono text-fluid-xs text-neutral-600">{articles.length} total</p>
        </div>

        {articles.length === 0 ? (
          <p className="py-20 text-center font-mono text-fluid-xs uppercase tracking-wider text-neutral-600">
            no articles yet
          </p>
        ) : (
          <ol className="space-y-6">
            {articles.map((article, idx) => (
              <li key={article.slug}>
                <a
                  href={\`/src/articles/\${article.slug}/\`}
                  className="group block border-l-2 border-white/10 pl-6 transition-colors hover:border-white/60 focus-visible:border-white focus-visible:outline-none"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-fluid-xs text-neutral-600">
                      {String(articles.length - idx).padStart(2, '0')}
                    </span>
                    <h2 className="text-fluid-lg font-sans font-bold leading-tight text-white">
                      {article.title}
                    </h2>
                  </div>
                  <div className="mt-2 flex items-center gap-3 pl-10 font-mono text-fluid-xs text-neutral-500">
                    <time>{article.publishedAt}</time>
                    {article.pin ? (
                      <span className="rounded border border-white/30 px-1.5 py-0.5 uppercase tracking-wider">
                        pinned
                      </span>
                    ) : null}
                  </div>
                  {article.excerpt ? (
                    <p className="mt-3 max-w-2xl pl-10 text-fluid-sm leading-relaxed text-neutral-300">
                      {article.excerpt.slice(0, 140)}
                      {article.excerpt.length > 140 ? '…' : ''}
                    </p>
                  ) : null}
                </a>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-20 border-t border-white/10 pt-6">
          <a
            href="/"
            className="font-mono text-fluid-xs uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            ← weid.fun
          </a>
        </div>
      </section>
    </div>
  )
}
`

  fs.writeFileSync(path.join(seriesDir, 'index.html'), indexHtml)
  fs.writeFileSync(path.join(seriesDir, 'main.tsx'), mainTsx)
  fs.writeFileSync(path.join(seriesDir, 'page.tsx'), pageTsx)

  console.error(`✓ series page created: ${seriesDir}/{index.html,main.tsx,page.tsx}`)

  const updateScript = path.resolve(import.meta.dir, 'update-home-data.ts')
  const refresh = spawnSync('bun', ['run', updateScript, '--series-only'], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (refresh.status !== 0) {
    console.error('⚠ failed to refresh home-data series index; please run manually')
  }
}

if (import.meta.main) {
  main()
}
