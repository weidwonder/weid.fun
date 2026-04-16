import type { HomeSeriesSummary } from '@/lib/types'

interface TopNavProps {
  series: HomeSeriesSummary[]
}

/**
 * TopNav · 首页顶栏
 *
 * - 左：站点名（点回首页）
 * - 中/右：series pills（横向滚动可承接未来更多系列）
 * - 右：⌘ 菜单占位（保持与 CornerMarker 的视觉一致）
 *
 * 固定在顶端，高度约 48px，不占首屏主视觉。
 */
export function TopNav({ series }: TopNavProps) {
  return (
    <nav
      data-testid="top-nav"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md"
      style={{
        paddingTop: 'var(--sat)',
        paddingLeft: 'max(16px, var(--sal))',
        paddingRight: 'max(16px, var(--sar))',
      }}
    >
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-4">
        <a
          href="/"
          className="shrink-0 font-mono text-fluid-xs tracking-wider text-neutral-300 transition-colors hover:text-white"
        >
          weid.fun /
        </a>

        {series.length > 0 ? (
          <ul className="flex flex-1 items-center gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2">
            {series.map((s) => (
              <li key={s.seriesSlug} className="shrink-0">
                <a
                  href={`/src/series/${s.seriesSlug}/`}
                  data-testid={`nav-series-${s.seriesSlug}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-fluid-xs text-neutral-300 transition-colors hover:border-white/40 hover:text-white focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <span
                    aria-hidden
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: s.colors.primary }}
                  />
                  <span>{s.seriesName}</span>
                  <span className="text-neutral-500">· {s.articleCount}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1" />
        )}

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => {
            console.log('[TopNav] menu clicked (command palette pending)')
          }}
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-500 text-fluid-xs text-neutral-400 transition-colors hover:border-white hover:text-white"
        >
          ⌘
        </button>
      </div>
    </nav>
  )
}
