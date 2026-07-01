'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, AudioLines, Loader2, Trophy, X } from 'lucide-react'
import { Laurel } from '@/components/laurel'
import { AudioPlayer } from '@/components/audio-player'

type Stage = 'generating' | 'ready' | 'voted' | 'failed'

type BattleResponse = {
  battleId: string
  left: {
    label: 'A'
    audioUrl: string
  }
  right: {
    label: 'B'
    audioUrl: string
  }
}

type VoteReveal = {
  battleId: string
  chosenSide: 'left' | 'right'
  winner: {
    name: string
    provider: string
    eloAfter?: number
  }
  loser: {
    name: string
    provider: string
    eloAfter?: number
  }
  left: {
    name: string
    provider: string
    eloAfter?: number
  }
  right: {
    name: string
    provider: string
    eloAfter?: number
  }
}

function formatElo(value?: number) {
  return typeof value === 'number' ? Math.round(value).toLocaleString('en-US') : null
}

export function ChatView({
  prompt,
  isLoggedIn,
}: {
  prompt: string
  isLoggedIn: boolean
}) {
  const [stage, setStage] = useState<Stage>('generating')
  const [showTooltip, setShowTooltip] = useState(true)
  const [choice, setChoice] = useState<'A' | 'B' | null>(null)
  const [battle, setBattle] = useState<BattleResponse | null>(null)
  const [reveal, setReveal] = useState<VoteReveal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voting, setVoting] = useState<'left' | 'right' | null>(null)

  useEffect(() => {
    let active = true

    async function createBattle() {
      setStage('generating')
      setChoice(null)
      setBattle(null)
      setReveal(null)
      setError(null)
      setVoting(null)
      setShowTooltip(true)

      if (!isLoggedIn) {
        setStage('failed')
        setError('Log in to generate an arena battle.')
        return
      }

      try {
        const response = await fetch('/api/battles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: prompt }),
        })
        const payload = (await response.json().catch(() => ({}))) as
          | BattleResponse
          | { error?: string }

        if (!response.ok) {
          throw new Error('error' in payload && payload.error ? payload.error : 'Unable to generate battle.')
        }

        if (active) {
          setBattle(payload as BattleResponse)
          setStage('ready')
        }
      } catch (err) {
        if (active) {
          setStage('failed')
          setError(err instanceof Error ? err.message : 'Unable to generate battle.')
        }
      }
    }

    void createBattle()

    return () => {
      active = false
    }
  }, [prompt, isLoggedIn])

  const vote = async (side: 'left' | 'right') => {
    if (!battle || voting || stage === 'voted') return

    setVoting(side)
    setChoice(side === 'left' ? 'A' : 'B')
    setShowTooltip(false)
    setError(null)

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          battleId: battle.battleId,
          chosenSide: side,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as VoteReveal | { error?: string }

      if (!response.ok) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Unable to save vote.')
      }

      setReveal(payload as VoteReveal)
      setStage('voted')
    } catch (err) {
      setChoice(null)
      setError(err instanceof Error ? err.message : 'Unable to save vote.')
    } finally {
      setVoting(null)
    }
  }

  const leftElo = formatElo(reveal?.left.eloAfter)
  const rightElo = formatElo(reveal?.right.eloAfter)

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 pb-40">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
            {prompt}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary" />
          <div className="flex-1">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground/70">
              <AudioLines size={13} className="text-primary" />
              Text-to-Speech
            </div>

            {stage === 'generating' ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" />
                Generating anonymous voice samples from two models...
              </p>
            ) : stage === 'failed' ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
                {!isLoggedIn && (
                  <Link href="/login" className="ml-2 font-medium underline underline-offset-4">
                    Login
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                Both clips are ready. Listen to Voice A and Voice B, then choose the one you prefer.
              </p>
            )}

            {battle && stage !== 'generating' && stage !== 'failed' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <OptionCard
                  label="Voice A"
                  audioUrl={battle.left.audioUrl}
                  revealed={stage === 'voted'}
                  modelName={reveal?.left.name}
                  provider={reveal?.left.provider}
                  elo={leftElo}
                  chosen={choice === 'A'}
                />
                <OptionCard
                  label="Voice B"
                  audioUrl={battle.right.audioUrl}
                  revealed={stage === 'voted'}
                  modelName={reveal?.right.name}
                  provider={reveal?.right.provider}
                  elo={rightElo}
                  chosen={choice === 'B'}
                />
              </div>
            )}

            {reveal && (
              <div className="mt-5 rounded-xl border border-primary/30 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Trophy size={16} className="text-primary" />
                  Winner: {reveal.winner.name}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reveal.winner.provider} won this blind comparison.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {battle && stage !== 'generating' && stage !== 'failed' && (
        <div className="pointer-events-none sticky bottom-0 z-10 flex justify-center pb-8">
          <div className="pointer-events-auto relative flex items-center gap-3">
            {showTooltip && stage === 'ready' && (
              <div className="absolute -top-28 left-1/2 w-52 -translate-x-1/2 rounded-xl border border-border bg-card p-4 text-center shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
                <p className="font-serif text-sm font-medium text-foreground">Vote here</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick one voice to reveal the models.
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
              onClick={() => void vote('left')}
              disabled={stage === 'voted' || Boolean(voting)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                choice === 'A'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              {voting === 'left' ? <Loader2 size={15} className="animate-spin" /> : <ArrowLeft size={15} />}
              I prefer A
            </button>
            <Laurel size={26} className="text-foreground" />
            <button
              type="button"
              onClick={() => void vote('right')}
              disabled={stage === 'voted' || Boolean(voting)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                choice === 'B'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              I prefer B
              {voting === 'right' ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionCard({
  label,
  audioUrl,
  revealed,
  modelName,
  provider,
  elo,
  chosen,
}: {
  label: string
  audioUrl: string
  revealed: boolean
  modelName?: string
  provider?: string
  elo: string | null
  chosen: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-colors ${
        chosen ? 'border-primary ring-1 ring-primary' : 'border-border'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {revealed && modelName && (
            <p className="mt-1 text-xs text-muted-foreground">
              {modelName}
              {provider ? ` by ${provider}` : ''}
            </p>
          )}
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {revealed && elo ? `Elo ${elo}` : 'Hidden'}
        </span>
      </div>
      <AudioPlayer src={audioUrl} />
    </div>
  )
}
