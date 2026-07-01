import { TopHeader } from '@/components/top-header'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const sections = [
  {
    title: 'Blind Comparisons',
    eyebrow: 'Anonymous before voting',
    body:
      'Each battle uses one submitted text prompt, two randomly selected enabled and configured TTS models, and two signed private audio URLs. The client never receives left or right model IDs before voting.',
  },
  {
    title: 'Elo Scoring',
    eyebrow: 'Pairwise ranking',
    body:
      'Every model starts at 1000 Elo and uses a K-factor of 32 by default. A winner receives score 1 and the loser receives score 0. The database vote function locks the battle and model rows, inserts the vote, and updates wins, losses, battles, and Elo atomically.',
  },
  {
    title: 'Text Moderation',
    eyebrow: 'Safety before synthesis',
    body:
      'Prompt text is checked by a local banned-content filter and OpenAI moderation before any TTS provider is called. Blocked requests return a friendly error and no audio is generated.',
  },
  {
    title: 'Audio Caching',
    eyebrow: 'Private cache artifacts',
    body:
      'Generated audio is cached by normalized text hash, model ID, voice, and config version. Files live in a private Supabase Storage bucket under opaque UUID paths and are served through short-lived signed URLs.',
  },
  {
    title: 'Model Availability',
    eyebrow: 'Runtime configured only',
    body:
      'Only configured and enabled providers are eligible for random battles. Server-side adapter checks exclude models without working credentials or required provider configuration.',
  },
]

async function readUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export default async function MethodologyPage() {
  const user = await readUser()

  return (
    <main className="min-h-svh bg-background">
      <TopHeader isLoggedIn={Boolean(user)} />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Methodology
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            How AudioArena Works
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            How votes are collected, protected, and converted into live model rankings.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                {section.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
