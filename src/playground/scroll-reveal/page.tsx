import { CornerMarker } from '@/primitives/CornerMarker'
import { ScrollReveal } from '@/primitives/ScrollReveal'

export function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <div className="mx-auto max-w-2xl space-y-40 px-6 py-32">
        <ScrollReveal testId="reveal-item-1">
          <h2 className="text-fluid-3xl font-bold">Scroll down to reveal →</h2>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-2">
          <p className="text-fluid-lg">This paragraph appears when you scroll it into view.</p>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-3">
          <p className="text-fluid-lg">So does this one, but later.</p>
        </ScrollReveal>
        <ScrollReveal testId="reveal-item-4">
          <p className="font-mono text-fluid-lg text-neutral-500">End of playground.</p>
        </ScrollReveal>
      </div>
    </div>
  )
}
