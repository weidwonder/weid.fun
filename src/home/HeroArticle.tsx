import type { ArticleMeta } from '@/lib/types'

interface HeroArticleProps {
  article: ArticleMeta
}

/**
 * HeroArticle · 首页 A 区（首屏主文章）
 *
 * 展示最新 / 置顶文章。整块可点击进入文章页。
 * 背景：coverImage（若有）否则 colors.primary。
 *
 * 响应式：移动端留白更小，标题字号随 clamp 变化。
 */
export function HeroArticle({ article }: HeroArticleProps) {
  const excerptClean = article.excerpt
    ?.replace(/^>\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)

  const publishDate = new Date(article.publishedAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section
      data-testid="hero-article"
      className="relative isolate flex min-h-[calc(100dvh-3rem)] w-full items-center overflow-hidden pt-12"
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
            : `radial-gradient(ellipse at 75% 30%, ${article.colors.primary}55, transparent 55%), radial-gradient(ellipse at 10% 90%, ${article.colors.primary}20, transparent 45%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black/70"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 select-none font-mono text-[14rem] font-black leading-none text-white/[0.04] lg:block"
      >
        01
      </div>

      <a
        href={`/src/articles/${article.slug}/`}
        data-testid={`hero-link-${article.slug}`}
        className="group relative block w-full focus-visible:outline-none"
      >
        <div
          className="mx-auto flex max-w-7xl flex-col gap-8 border-l-2 px-6 py-16 md:gap-10 md:py-24"
          style={{
            borderColor: article.colors.primary,
            marginLeft: 0,
            paddingBottom: 'max(4rem, calc(var(--sab) + 4rem))',
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {article.pin ? (
              <span className="rounded-full border border-white/40 px-2.5 py-0.5 font-mono text-fluid-xs uppercase tracking-widest text-white">
                Latest
              </span>
            ) : null}
            <span className="font-mono text-fluid-xs uppercase tracking-widest text-white/70">
              {article.seriesName || article.series || 'Essay'}
            </span>
            <span className="font-mono text-fluid-xs text-white/40">· {publishDate}</span>
          </div>

          <h1
            data-testid="hero-article-title"
            className="max-w-5xl font-sans font-bold leading-[1.02] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.75rem, 7vw, 7rem)' }}
          >
            {article.title}
          </h1>

          {excerptClean ? (
            <p className="max-w-2xl font-sans text-fluid-base leading-relaxed text-white/80 md:text-fluid-lg">
              {excerptClean}
              {article.excerpt.length > 180 ? '…' : ''}
            </p>
          ) : null}

          <span className="mt-4 inline-flex items-center gap-2 font-mono text-fluid-xs uppercase tracking-widest text-white/80 transition-colors group-hover:text-white">
            Read article
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </a>
    </section>
  )
}
