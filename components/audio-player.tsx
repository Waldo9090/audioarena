'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, MoreVertical } from 'lucide-react'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ duration }: { duration: number }) {
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const raf = useRef<number | null>(null)
  const last = useRef<number>(0)

  useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000
      last.current = now
      setPos((p) => {
        const next = p + dt
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [playing, duration])

  const pct = Math.min(100, (pos / duration) * 100)

  return (
    <div className="flex items-center gap-3 rounded-full bg-secondary/70 px-2 py-2">
      <button
        type="button"
        onClick={() => {
          if (pos >= duration) setPos(0)
          setPlaying((p) => !p)
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-background/60 transition-colors"
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
