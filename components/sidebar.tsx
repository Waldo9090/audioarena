'use client'

import Link from 'next/link'
import {
  Plus,
  Search,
  LayoutGrid,
  FolderClosed,
  BarChart3,
  ChevronsUpDown,
  PanelLeft,
} from 'lucide-react'
import { Laurel } from '@/components/laurel'

export type RecentDesign = { id: string; label: string }

const navItems = [
  { label: 'Search', icon: Search, href: '/' },
  { label: 'Gallery', icon: LayoutGrid, href: '/about' },
  { label: 'My Projects', icon: FolderClosed, href: '/' },
  { label: 'Leaderboards', icon: BarChart3, href: '/about' },
]

export function Sidebar({
  recents = [],
  activeId = null,
  onNewProject,
  onSelectRecent,
}: {
  recents?: RecentDesign[]
  activeId?: string | null
  onNewProject?: () => void
  onSelectRecent?: (id: string) => void
}) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="text-foreground" aria-label="Audio Arena home">
          <Laurel size={26} />
        </Link>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      <nav className="px-3 py-2 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Plus size={18} className="text-muted-foreground" />
          New project
        </button>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
          >
            <item.icon size={18} className="text-muted-foreground" />
            {item.label}
          </Link>
        ))}
      </nav>

      {recents.length > 0 && (
        <>
          <div className="px-5 pt-5 pb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent Designs
            </span>
          </div>
          <div className="px-3 flex flex-col gap-0.5">
            {recents.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectRecent?.(item.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-left transition-colors ${
                  item.id === activeId
                    ? 'bg-secondary text-foreground'
                    : 'text-foreground/70 hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary transition-colors"
        >
          <span className="size-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            AM
          </span>
          <span className="flex-1 text-left text-sm font-medium text-foreground">
            Aditya Mahna
          </span>
          <ChevronsUpDown size={15} className="text-muted-foreground" />
        </button>
      </div>
    </aside>
  )
}
