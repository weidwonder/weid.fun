import type { ReactNode } from 'react'

interface CornerMarkerProps {
  /** 点击左上角触发的动作。默认跳转首页 / */
  onHomeClick?: () => void
  /** 点击右上角菜单按钮触发的动作。默认仅打印到 console */
  onMenuClick?: () => void
  /** 站点名，默认 "weid.fun" */
  siteName?: string
}

/**
 * CornerMarker · 站点级外壳 primitive
 *
 * 两个元素：
 * - 左上角：站点名，点击回首页
 * - 右上角：⌘ 菜单按钮（MVP 阶段仅占位，后续 Plan 会接入命令面板）
 *
 * 响应式要求（R1）：
 * - 所有断点都可见
 * - 手机端使用 safe-area-inset 避让刘海 / 灵动岛
 * - 不影响 WebGL canvas 的 pointer events（wrapper 用 pointer-events: none）
 */
export function CornerMarker({
  onHomeClick,
  onMenuClick,
  siteName = 'weid.fun',
}: CornerMarkerProps): ReactNode {
  const handleHome = () => {
    if (onHomeClick) {
      onHomeClick()
      return
    }

    window.location.href = '/'
  }

  const handleMenu = () => {
    if (onMenuClick) {
      onMenuClick()
      return
    }

    console.log('[CornerMarker] menu clicked (command palette pending)')
  }

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        paddingTop: 'max(12px, var(--sat))',
        paddingRight: 'max(12px, var(--sar))',
        paddingBottom: 'max(12px, var(--sab))',
        paddingLeft: 'max(12px, var(--sal))',
      }}
    >
      <button
        type="button"
        data-testid="corner-marker-home"
        onClick={handleHome}
        className="
          pointer-events-auto absolute left-0 top-0
          border-0 bg-transparent px-2 py-1
          font-mono text-fluid-xs tracking-wider
          text-neutral-400 transition-colors duration-200
          hover:text-neutral-100
        "
        style={{
          top: 'max(12px, var(--sat))',
          left: 'max(12px, var(--sal))',
        }}
      >
        {siteName} /
      </button>

      <button
        type="button"
        data-testid="corner-marker-menu"
        aria-label="Open menu"
        onClick={handleMenu}
        className="
          pointer-events-auto absolute right-0 top-0
          flex h-6 w-6 items-center justify-center rounded-full
          border border-neutral-500 bg-transparent
          text-[10px] text-neutral-400 transition-colors duration-200
          hover:border-neutral-100 hover:text-neutral-100
        "
        style={{
          top: 'max(12px, var(--sat))',
          right: 'max(12px, var(--sar))',
        }}
      >
        ⌘
      </button>
    </div>
  )
}
