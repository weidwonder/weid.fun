import { useState } from 'react'
import { CornerMarker } from '@/primitives/CornerMarker'
import { DragFigure } from '@/primitives/DragFigure'

export function PlaygroundPage() {
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <CornerMarker />
      <button
        type="button"
        data-testid="drag-figure-sync-button"
        onClick={() => setCoords({ x: 120, y: 80 })}
        className="absolute left-6 top-20 rounded border border-neutral-700 px-3 py-2 font-mono text-fluid-xs uppercase tracking-wider text-neutral-300"
      >
        move props
      </button>
      <div className="flex min-h-screen items-center justify-center">
        <DragFigure testId="drag-figure-sync-target" initialX={coords.x} initialY={coords.y}>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-mono text-fluid-xs uppercase tracking-wider shadow-2xl">
            sync me
          </div>
        </DragFigure>
      </div>
    </div>
  )
}
