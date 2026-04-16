import type { HomeSeriesSummary } from '@/lib/types'

interface SeriesRailProps {
  series: HomeSeriesSummary[]
}

/**
 * SeriesRail · 首页顶部系列导航
 *
 * 极简水平导航，居中浮在 CornerMarker 下方。
 * 不带背景 / 边框，只是文字链接。editorial 风格。
 */
export function SeriesRail({ series }: SeriesRailProps) {
  if (series.length === 0) return null

  return (
    <div
      data-testid="series-rail"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
      style={{ paddingTop: 'max(16px, calc(var(--sat) + 4px))' }}
    >
      <nav
        aria-label="Series navigation"
        className="pointer-events-auto flex items-center gap-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {series.map((s, idx) => (
          <a
            key={s.seriesSlug}
            href={`/src/series/${s.seriesSlug}/`}
            data-testid={`series-rail-${s.seriesSlug}`}
            className="group inline-flex shrink-0 items-center gap-2 font-mono text-fluid-xs tracking-wider text-neutral-500 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{
              animationDelay: `${idx * 60}ms`,
            }}
          >
            <span
              aria-hidden
              className="inline-block size-1.5 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ background: s.colors.primary }}
            />
            <span className="uppercase tracking-wider">{s.seriesName}</span>
            <span className="text-neutral-700">
              / {s.articleCount.toString().padStart(2, '0')}
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}
