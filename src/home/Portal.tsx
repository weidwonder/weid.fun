import type { PortalConfig } from '@/lib/types'

interface PortalProps {
  config: PortalConfig
}

/**
 * Portal · 首页 D 区（生成式门户）
 *
 * MVP 版本：满屏显示 portal.title + subtitle + ENTER 提示。
 * 后续 Plan C 再升级成真正的 Tier 4 hero。
 */
export function Portal({ config }: PortalProps) {
  return (
    <section
      data-testid="portal"
      className="
        relative flex h-screen w-full flex-col items-center justify-center
        overflow-hidden bg-black text-white
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_50%_50%,rgba(131,56,236,0.25),transparent_60%)]
        "
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <h1
          data-testid="portal-title"
          className="
            max-w-[90vw] font-serif text-fluid-3xl italic font-normal
            leading-none tracking-tight md:text-fluid-4xl
          "
        >
          {config.title}
        </h1>
        {config.subtitle ? (
          <p className="font-mono text-fluid-xs uppercase tracking-wider text-neutral-500">
            {config.subtitle}
          </p>
        ) : null}
      </div>

      <div
        data-testid="portal-enter"
        className="
          absolute left-1/2 flex -translate-x-1/2 items-center gap-2
          font-mono text-fluid-xs tracking-widest text-neutral-500
        "
        style={{ bottom: 'max(2.5rem, var(--sab) + 1.5rem)' }}
      >
        <span>ENTER</span>
        <span className="animate-bounce">↓</span>
      </div>
    </section>
  )
}
