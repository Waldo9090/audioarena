'use client'

import { useState } from 'react'
import { ImagePlus, Zap, ChevronDown, ArrowRight } from 'lucide-react'
import { Laurel } from '@/components/laurel'
import { ModelChip } from '@/components/model-chip'
import { models } from '@/lib/models'

export function PromptView({ onSubmit }: { onSubmit: (prompt: string) => void }) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text) return
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
          4.8M+ users
        </p>

        <h2 className="mt-8 font-serif text-2xl text-foreground text-balance">
          What are you creating today?
        </h2>

        <div className="mt-6 w-full rounded-2xl border border-border bg-card shadow-sm">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder="Describe what you want to design..."
            className="w-full resize-none bg-transparent px-4 pt-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Add image"
              >
                <ImagePlus size={18} />
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-secondary transition-colors"
              >
                <Zap size={13} className="text-primary" />
                PRO
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Submit prompt"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
