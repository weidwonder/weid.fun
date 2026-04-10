import { CornerMarker } from '@/primitives/CornerMarker'
import { DragFigure } from '@/primitives/DragFigure'

export function PlaygroundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <CornerMarker />
      <div className="flex min-h-screen items-center justify-center">
        <DragFigure testId="drag-figure" initialX={0} initialY={0}>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-mono text-fluid-xs uppercase tracking-wider shadow-2xl">
            drag me
          </div>
        </DragFigure>
      </div>
    </div>
  )
}
