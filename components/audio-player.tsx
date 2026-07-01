'use client'

import { useRef, useState } from 'react'
import { MoreVertical, Pause, Play, Volume2 } from 'lucide-react'

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) {
    return '0:00'
  }

  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    if (audio.ended) {
      audio.currentTime = 0
    }

    await audio.play()
    setPlaying(true)
  }

  const pct = duration > 0 ? Math.min(100, (pos / duration) * 100) : 0

  return (
    <div className="flex items-center gap-3 rounded-full bg-secondary/70 px-2 py-2">
      <audio
        key={src}
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(event) => setPos(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={() => void toggle()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background/60"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <span className="text-xs tabular-nums text-muted-foreground">
        {fmt(pos)} / {fmt(duration)}
      </span>
      <div className="relative h-1 flex-1 rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground/70"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <Volume2 size={16} className="shrink-0 text-muted-foreground" />
      <MoreVertical size={16} className="shrink-0 text-muted-foreground" />
    </div>
  )
}
