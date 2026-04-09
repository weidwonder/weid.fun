import type { ArticleMeta } from '@/lib/types'

interface VitrineProps {
  articles: ArticleMeta[]
}

/**
 * Vitrine · 首页 C 区（精选橱窗）
 *
 * - pin=true 的文章永远排在最前
 * - 其它按 publishedAt 倒序
 * - 每张卡片背景：有 coverImage 用图片，否则用 colors.primary 填充
 * - 空数组时显示 placeholder
 */
export function Vitrine({ articles }: VitrineProps) {
  if (articles.length === 0) {
    return (
      <section
        data-testid="vitrine"
        className="flex min-h-[50vh] items-center justify-center bg-neutral-950 px-6 py-20 text-white"
      >
        <p
          data-testid="vitrine-empty"
          className="text-center font-mono text-fluid-xs uppercase tracking-wider text-neutral-600"
        >
          no writings yet · check back later
        </p>
      </section>
    )
  }

  const sorted = [...articles].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })

  return (
    <section data-testid="vitrine" className="min-h-screen bg-neutral-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-baseline justify-between">
          <p className="font-mono text-fluid-xs uppercase tracking-widest text-neutral-500">Writings</p>
          <p className="font-mono text-fluid-xs text-neutral-600">{articles.length} total</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((article) => (
            <a
              key={article.slug}
              href={`/src/articles/${article.slug}/`}
              data-testid={`vitrine-card-${article.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
              style={{
                background: article.coverImage
                  ? `url(${article.coverImage}) center/cover`
                  : article.colors.primary,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-5">
                {article.pin ? (
                  <span className="mb-2 inline-block self-start rounded border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                    pinned
                  </span>
                ) : null}
                <h3 className="text-fluid-lg font-sans font-bold leading-tight text-white">
                  {article.title}
                </h3>
                {article.series ? (
                  <p className="mt-1 font-mono text-fluid-xs text-white/60">{article.series}</p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
