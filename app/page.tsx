'use client'

import { useState } from 'react'
import { Sidebar, type RecentDesign } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { PromptView } from '@/components/prompt-view'
import { ChatView } from '@/components/chat-view'

export default function Page() {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentDesign[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const startProject = (p: string) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now())
    setRecents((prev) => [{ id, label: p }, ...prev])
    setActiveId(id)
    setPrompt(p)
  }

  const newProject = () => {
    setPrompt(null)
    setActiveId(null)
  }

  const selectRecent = (id: string) => {
    const design = recents.find((r) => r.id === id)
    if (!design) return
    setActiveId(id)
    setPrompt(design.label)
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar
        recents={recents}
        activeId={activeId}
        onNewProject={newProject}
        onSelectRecent={selectRecent}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader title={prompt ?? undefined} />
        {prompt ? (
          <ChatView key={activeId ?? prompt} prompt={prompt} />
        ) : (
          <PromptView onSubmit={startProject} />
        )}
      </div>
    </div>
  )
}
