import { CornerMarker } from '@/primitives/CornerMarker'
import { AudioPad } from '@/primitives/AudioPad'

export function PlaygroundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black text-white">
      <CornerMarker />
      <h2 className="text-fluid-2xl font-bold">Audio Pad Playground</h2>
      <AudioPad
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        label="silent test"
      />
      <p className="max-w-md text-center font-mono text-fluid-xs text-neutral-600">
        真实使用时 src 应指向 audio 文件。playground 里用的是 1 字节 silent wav 便于测试。
      </p>
    </div>
  )
}
