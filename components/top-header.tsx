'use client'

import Link from 'next/link'
import { Globe, LogOut } from 'lucide-react'
import { signOutAction } from '@/lib/auth/actions'

const links = [
  { label: 'Arena', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Models', href: '/models' },
  { label: 'Methodology', href: '/methodology' },
]

export function TopHeader({
  title,
  isLoggedIn,
}: {
  title?: string
  isLoggedIn: boolean
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-baseline gap-2 min-w-0">
        <Link href="/" className="font-serif text-lg font-medium text-foreground">
          Audio Arena
        </Link>
      </div>

      {title && (
        <span className="absolute left-1/2 hidden -translate-x-1/2 truncate text-sm text-foreground/80 lg:block">
          {title}
        </span>
      )}

      <nav className="flex items-center gap-5">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hidden text-sm text-foreground/70 hover:text-foreground transition-colors lg:inline"
          >
            {item.label}
          </Link>
        ))}
        {isLoggedIn ? (
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              <LogOut size={15} />
              Logout
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Login
          </Link>
        )}
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
