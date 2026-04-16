import type { HomeSeriesSummary } from '@/lib/types'

interface SeriesStripProps {
  series: HomeSeriesSummary[]
}

/**
 * 首页 B+ 区 · 系列入口条带
 *
 * 空数组时整条不渲染。每枚 pill 跳到 /src/series/<slug>/。
 */
export function SeriesStrip({ series }: SeriesStripProps) {
  if (series.length === 0) return null

  return (
    <section
      data-testid="series-strip"
      className="border-y border-white/10 bg-neutral-950 px-6 py-8 text-white"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <p className="shrink-0 font-mono text-fluid-xs uppercase tracking-widest text-neutral-500">
          Series
        </p>
        <ul className="flex flex-wrap gap-2 md:gap-3">
          {series.map((s) => (
            <li key={s.seriesSlug}>
              <a
                href={`/src/series/${s.seriesSlug}/`}
                data-testid={`series-pill-${s.seriesSlug}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 font-mono text-fluid-xs transition-colors hover:border-white/60 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{ background: s.colors.primary }}
                />
                <span className="text-white">{s.seriesName}</span>
                <span className="text-neutral-500">· {s.articleCount}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
