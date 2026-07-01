'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, Mic2 } from 'lucide-react'
import { Laurel } from '@/components/laurel'
import { ModelChip } from '@/components/model-chip'
import { models } from '@/lib/models'

const MAX_TEXT_LENGTH = 1000

export function PromptView({
  onSubmit,
  isLoggedIn,
}: {
  onSubmit: (prompt: string) => void
  isLoggedIn: boolean
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || !isLoggedIn || value.length > MAX_TEXT_LENGTH) return
    onSubmit(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* faded architecture backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[url('/colonnade.png')] bg-cover bg-bottom bg-no-repeat opacity-[0.12]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/60 to-transparent"
      />

      {/* floating model chips */}
      <ModelChip
        model={models[0]}
        className="absolute left-[12%] top-[46%] hidden lg:inline-flex"
      />
      <ModelChip
        model={models[1]}
        className="absolute right-[12%] top-[42%] hidden lg:inline-flex"
      />
      <ModelChip
        model={models[2]}
        className="absolute left-1/2 bottom-[14%] hidden -translate-x-1/2 lg:inline-flex"
      />

      <div className="relative z-10 mx-auto flex min-h-full max-w-2xl flex-col items-center px-4 pt-14 pb-16">
        <Laurel size={56} className="text-foreground" />
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-foreground">
          AudioArena
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Blind rankings for text-to-speech models
        </p>

        <h2 className="mt-8 font-serif text-2xl text-foreground text-balance">
          What should the models say?
        </h2>
        <p className="mt-2 max-w-lg text-center text-sm leading-6 text-muted-foreground">
          Type one prompt, listen to two anonymous voices, and vote for the better generation.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-border bg-card shadow-sm">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_TEXT_LENGTH + 200}
            rows={4}
            aria-label="Text to synthesize"
            placeholder="Type up to 1000 characters..."
            className="w-full resize-none bg-transparent px-4 pt-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${
                  value.length > MAX_TEXT_LENGTH ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {value.length}/{MAX_TEXT_LENGTH}
              </span>
              {!isLoggedIn && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <Lock size={13} />
                  Login required
                </span>
              )}
            </div>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={submit}
                disabled={!value.trim() || value.length > MAX_TEXT_LENGTH}
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Generate battle"
              >
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Mic2 size={14} />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
