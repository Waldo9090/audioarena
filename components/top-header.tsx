'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'

const links = ['Leaderboards', 'Models', 'Methodology', 'Our Users']

export function TopHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-baseline gap-2 min-w-0">
        <Link href="/about" className="font-serif text-lg font-medium text-foreground">
          Audio Arena
        </Link>
      </div>

      {title && (
        <span className="absolute left-1/2 hidden -translate-x-1/2 truncate text-sm text-foreground/80 lg:block">
          {title}
        </span>
      )}

      <nav className="flex items-center gap-5">
        {links.map((l) => (
          <Link
            key={l}
            href="/about"
            className="hidden text-sm text-foreground/70 hover:text-foreground transition-colors lg:inline"
          >
            {l}
          </Link>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          <Globe size={15} />
          EN
        </button>
      </nav>
    </header>
  )
}
