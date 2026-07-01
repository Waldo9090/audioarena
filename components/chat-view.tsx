'use client'

import { useEffect, useState } from 'react'
import { AudioLines, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Laurel } from '@/components/laurel'
import { AudioPlayer } from '@/components/audio-player'
import { models } from '@/lib/models'

type Stage = 'generating' | 'ready' | 'voted'

export function ChatView({ prompt }: { prompt: string }) {
  const [stage, setStage] = useState<Stage>('generating')
  const [showTooltip, setShowTooltip] = useState(true)
  const [choice, setChoice] = useState<'A' | 'B' | null>(null)

  useEffect(() => {
    setStage('generating')
    setChoice(null)
    setShowTooltip(true)
    const t = setTimeout(() => setStage('ready'), 2200)
    return () => clearTimeout(t)
  }, [prompt])

  const vote = (c: 'A' | 'B') => {
    setChoice(c)
    setStage('voted')
    setShowTooltip(false)
  }

  // Reveal the models behind each option after voting
  const modelA = models[3]
  const modelB = models[5]

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 pb-40">
        {/* user message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
            {prompt}
          </div>
        </div>

        {/* assistant */}
        <div className="mt-8 flex gap-3">
          <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary" />
          <div className="flex-1">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground/70">
              <AudioLines size={13} className="text-primary" />
              Text-to-Speech
            </div>

            {stage === 'generating' ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
                Generating designs from the top models…
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                Designs are in! I went a couple different directions — compare
                and pick the one you prefer.
              </p>
            )}

            {stage !== 'generating' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <OptionCard
                  label="Option A"
                  duration={24}
                  revealed={stage === 'voted'}
                  modelName={modelA.name}
                  chosen={choice === 'A'}
                />
                <OptionCard
                  label="Option B"
                  duration={84}
                  revealed={stage === 'voted'}
                  modelName={modelB.name}
                  chosen={choice === 'B'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* vote bar */}
      {stage !== 'generating' && (
        <div className="pointer-events-none sticky bottom-0 z-10 flex justify-center pb-8">
          <div className="pointer-events-auto relative flex items-center gap-3">
            {showTooltip && (
              <div className="absolute -top-28 left-1/2 w-52 -translate-x-1/2 rounded-xl border border-border bg-card p-4 text-center shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
                <p className="font-serif text-sm font-medium text-foreground">
                  Vote here!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick the design you prefer to cast your vote.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="mt-3 w-full rounded-md bg-foreground py-1.5 text-xs font-medium text-background"
                >
                  Got it
                </button>
                <div className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-card" />
              </div>
            )}

            <button
              type="button"
              onClick={() => vote('A')}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors ${
                choice === 'A'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              <ArrowLeft size={15} />
              I prefer A
            </button>
            <Laurel size={26} className="text-foreground" />
            <button
              type="button"
              onClick={() => vote('B')}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors ${
                choice === 'B'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              I prefer B
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionCard({
  label,
  duration,
  revealed,
  modelName,
  chosen,
}: {
  label: string
  duration: number
  revealed: boolean
  modelName: string
  chosen: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-colors ${
        chosen ? 'border-primary ring-1 ring-primary' : 'border-border'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {revealed && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {modelName}
          </span>
        )}
      </div>
      <AudioPlayer duration={duration} />
    </div>
  )
}
