import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGLScene } from './WebGLScene'

export function detectMobileViewport(): boolean {
  return typeof window !== 'undefined' ? window.innerWidth < 768 : false
}

interface WebGLHeroProps {
  /** 主标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** Hero 色调（CSS 颜色字符串） */
  primaryColor?: string
  /** 背景色（CSS 颜色字符串） */
  bgColor?: string
}

/**
 * WebGLHero · Tier 4 hero primitive
 *
 * 满屏 WebGL scene + 标题覆盖层。
 *
 * 响应式契约（R1）：
 * - 满视口
 * - Canvas 自动适配容器尺寸
 * - mobile DPR 限制到 1.5
 * - mobile geometry 复杂度降档
 */
export function WebGLHero({
  title,
  subtitle,
  primaryColor = '#8338ec',
  bgColor = '#000000',
}: WebGLHeroProps) {
  const [isMobile, setIsMobile] = useState(detectMobileViewport)

  useEffect(() => {
    const check = () => setIsMobile(detectMobileViewport())
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section
      data-testid="webgl-hero"
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <Canvas
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: !isMobile }}
      >
        <WebGLScene primaryColor={primaryColor} isMobile={isMobile} />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ color: '#fff' }}
      >
        <h1
          data-testid="webgl-hero-title"
          className="max-w-[90vw] font-sans text-fluid-3xl font-bold leading-none tracking-tight md:text-fluid-4xl"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-6 font-mono text-fluid-xs uppercase tracking-wider opacity-70">{subtitle}</p>
        ) : null}
      </div>
    </section>
  )
}
