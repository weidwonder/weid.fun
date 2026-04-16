import type { ArticleMeta } from '@/lib/types'

interface HeroArticleProps {
  article: ArticleMeta
}

/**
 * HeroArticle · 首页 A 区（首屏主文章）
 *
 * Swiss editorial 风格：12 列网格，meta 侧栏 + 大标题主区。
 * 整块可点击进入文章。
 */
export function HeroArticle({ article }: HeroArticleProps) {
  const excerptClean = article.excerpt
    ?.replace(/^>\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)

  const publishDate = new Date(article.publishedAt)
  const dateShort = `${publishDate.getFullYear()}.${String(publishDate.getMonth() + 1).padStart(
    2,
    '0',
  )}.${String(publishDate.getDate()).padStart(2, '0')}`

  return (
    <section
      data-testid="hero-article"
      className="relative isolate flex min-h-[100dvh] w-full items-center overflow-hidden"
      style={{
        background: article.coverImage
          ? `url(${article.coverImage}) center/cover`
          : article.colors.bg,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: article.coverImage
            ? undefined
            : `radial-gradient(ellipse 70% 60% at 50% 40%, ${article.colors.primary}40, transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60"
      />

      <a
        href={`/src/articles/${article.slug}/`}
        data-testid={`hero-link-${article.slug}`}
        className="group relative block w-full focus-visible:outline-none"
      >
        <div
          className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-8 gap-y-10 px-6 py-16 md:gap-x-12 md:py-24"
          style={{
            paddingTop: 'max(5rem, calc(var(--sat) + 4rem))',
            paddingBottom: 'max(4rem, calc(var(--sab) + 4rem))',
          }}
        >
          <aside className="col-span-12 flex flex-col gap-3 md:col-span-3 md:gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-px w-6 bg-white/40"
              />
              <span className="font-mono text-fluid-xs uppercase tracking-[0.2em] text-white/60">
                {article.pin ? 'Latest' : 'Essay'}
              </span>
            </div>
            <dl className="mt-4 flex flex-col gap-3 font-mono text-fluid-xs text-white/50 md:mt-6">
              <div className="flex items-baseline gap-3">
                <dt className="w-14 shrink-0 uppercase tracking-wider text-white/30">Series</dt>
                <dd className="flex items-center gap-1.5 text-white/80">
                  <span
                    aria-hidden
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: article.colors.primary }}
                  />
                  {article.seriesName || article.series || '—'}
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-14 shrink-0 uppercase tracking-wider text-white/30">Date</dt>
                <dd className="tabular-nums text-white/80">{dateShort}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-14 shrink-0 uppercase tracking-wider text-white/30">No.</dt>
                <dd className="tabular-nums text-white/80">01</dd>
              </div>
            </dl>
          </aside>

          <div className="col-span-12 flex flex-col gap-8 md:col-span-9 md:gap-10">
            <h1
              data-testid="hero-article-title"
              className="font-sans font-bold leading-[1.02] tracking-tight text-white"
              style={{ fontSize: 'clamp(2.5rem, 6.5vw, 6rem)' }}
            >
              {article.title}
            </h1>

            {excerptClean ? (
              <p className="max-w-2xl font-sans text-fluid-base leading-[1.7] text-white/75 md:text-fluid-lg">
                {excerptClean}
                {article.excerpt.length > 180 ? '…' : ''}
              </p>
            ) : null}

            <span className="mt-2 inline-flex items-center gap-3 self-start border-b border-white/20 pb-1 font-mono text-fluid-xs uppercase tracking-[0.25em] text-white/80 transition-all group-hover:border-white group-hover:text-white">
              Read article
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </div>
      </a>
    </section>
  )
}
