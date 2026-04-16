import { WebGLHero } from '@/primitives/WebGLHero'
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
        subtitle={seriesSpec.tagline || `${articles.length} articles`}
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
                  href={`/src/articles/${article.slug}/`}
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
