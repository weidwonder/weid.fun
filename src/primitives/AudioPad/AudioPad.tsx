import { useEffect, useRef, useState } from 'react'

interface AudioPadProps {
  /** 音频 URL */
  src: string
  /** 可选音量 0-1，默认 0.4 */
  volume?: number
  /** 循环播放，默认 true */
  loop?: boolean
  /** 显示用的 label */
  label?: string
}

/**
 * AudioPad · Tier 4 音频 primitive
 *
 * 必须由用户点击触发才能播放，不做自动播放。
 */
export function AudioPad({
  src,
  volume = 0.4,
  loop = true,
  label = 'Ambient',
}: AudioPadProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.loop = loop
  }, [volume, loop])

  useEffect(() => {
    const audio = audioRef.current
    setError(false)
    setPlaying(false)
    audio?.pause()
    audio?.load()
  }, [src])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        setPlaying(true)
        await audio.play()
      }
    } catch {
      setPlaying(false)
    }
  }

  if (error) {
    return (
      <div className="rounded border border-neutral-800 px-3 py-2 font-mono text-fluid-xs text-neutral-600">
        audio unavailable
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="auto" onError={() => setError(true)} />
      <button
        type="button"
        data-testid="audio-pad-toggle"
        onClick={toggle}
        className="
          cursor-pointer rounded-full border border-neutral-600
          bg-black/50 px-4 py-2 font-mono text-fluid-xs uppercase tracking-wider
          text-neutral-300 backdrop-blur-sm transition-colors
          hover:border-neutral-300 hover:text-white
        "
      >
        {playing ? `⏸ pause ${label}` : `▶ play ${label}`}
      </button>
    </div>
  )
}
