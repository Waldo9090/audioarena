'use client'

import { useState } from 'react'
import { Sidebar, type RecentDesign } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { PromptView } from '@/components/prompt-view'
import { ChatView } from '@/components/chat-view'

export function ArenaShell({
  isLoggedIn,
  userEmail,
}: {
  isLoggedIn: boolean
  userEmail?: string
}) {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentDesign[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const startBattle = (p: string) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now())
    setRecents((prev) => [{ id, label: p }, ...prev])
    setActiveId(id)
    setPrompt(p)
  }

  const newBattle = () => {
    setPrompt(null)
    setActiveId(null)
  }

  const selectRecent = (id: string) => {
    const battle = recents.find((r) => r.id === id)
    if (!battle) return
    setActiveId(id)
    setPrompt(battle.label)
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar
        recents={recents}
        activeId={activeId}
        onNewProject={newBattle}
        onSelectRecent={selectRecent}
        userEmail={userEmail}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader title={prompt ?? undefined} isLoggedIn={isLoggedIn} />
        {prompt ? (
          <ChatView key={activeId ?? prompt} prompt={prompt} isLoggedIn={isLoggedIn} />
        ) : (
          <PromptView onSubmit={startBattle} isLoggedIn={isLoggedIn} />
        )}
      </div>
    </div>
  )
}
