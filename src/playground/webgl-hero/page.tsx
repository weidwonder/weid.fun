import { CornerMarker } from '@/primitives/CornerMarker'
import { WebGLHero } from '@/primitives/WebGLHero'

export function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title="WebGL Hero Playground"
        subtitle="Primitive · Tier 4"
        primaryColor="#ff006e"
        bgColor="#000000"
      />
    </div>
  )
}
