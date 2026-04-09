import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  /** 触发时机：0 = 元素刚进入视口，1 = 完全进入视口。默认 0.3 */
  threshold?: number
  /** 入场偏移距离（px）。默认 40 */
  offsetY?: number
  /** 动画时长（ms）。默认 800 */
  duration?: number
  /** data-testid pass-through */
  testId?: string
}

/**
 * ScrollReveal · 滚动驱动的淡入 + 上移 primitive
 *
 * 响应式契约（R1）：
 * - 使用 IntersectionObserver，touch 滚动同样触发
 * - 不依赖 :hover
 * - 不会产生横向滚动（仅 opacity + translateY）
 */
export function ScrollReveal({
  children,
  threshold = 0.3,
  offsetY = 40,
  duration = 800,
  testId,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.unobserve(el)
          }
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : `translateY(${offsetY}px)`,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}
