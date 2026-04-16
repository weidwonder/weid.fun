import { useState } from 'react'
import { AudioPad } from '@/primitives/AudioPad'
import { CornerMarker } from '@/primitives/CornerMarker'

const GOOD_SRC =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

export function PlaygroundPage() {
  const [src, setSrc] = useState('broken-audio-src')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-white">
      <CornerMarker />
      <button
        type="button"
        data-testid="audio-pad-reset-src"
        onClick={() => setSrc(GOOD_SRC)}
        className="rounded border border-neutral-700 px-3 py-2 font-mono text-fluid-xs uppercase tracking-wider text-neutral-300"
      >
        swap src
      </button>
      <AudioPad src={src} label="reset test" />
    </div>
  )
}
