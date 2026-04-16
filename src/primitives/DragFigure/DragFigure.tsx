import { useLayoutEffect, useState, type ReactNode } from 'react'
import { useDrag } from '@use-gesture/react'

interface DragFigureProps {
  children: ReactNode
  /** 初始 x 偏移 */
  initialX?: number
  /** 初始 y 偏移 */
  initialY?: number
  /** data-testid pass-through */
  testId?: string
}

/**
 * DragFigure · 可拖拽 primitive
 *
 * 使用 @use-gesture/react 的 useDrag hook，一次处理 mouse + touch + pointer。
 */
export function DragFigure({
  children,
  initialX = 0,
  initialY = 0,
  testId,
}: DragFigureProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY })

  useLayoutEffect(() => {
    setPos({ x: initialX, y: initialY })
  }, [initialX, initialY])

  const bind = useDrag(({ offset: [ox, oy] }) => {
    setPos({ x: initialX + ox, y: initialY + oy })
  })

  return (
    <div
      {...bind()}
      data-testid={testId}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: 'none',
        cursor: 'grab',
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}
