import Image from 'next/image'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { ModelChip } from '@/components/model-chip'
import { models } from '@/lib/models'
import { getCurrentUser } from '@/lib/supabase/server'

const showcase = [
  { src: '/showcase-art.png', alt: 'Art studio landing page design' },
  { src: '/showcase-properties.png', alt: 'Real estate landing page design' },
  { src: '/showcase-nutrition.png', alt: 'Nutrition brand landing page design' },
]

export const dynamic = 'force-dynamic'

async function readUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export default async function AboutPage() {
  const user = await readUser()

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar userEmail={user?.email ?? undefined} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader isLoggedIn={Boolean(user)} />
        <main className="flex-1 overflow-y-auto">
          <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
            <div>
              <h1 className="font-serif text-4xl font-medium text-foreground text-balance">
                What is Audio Arena?
              </h1>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/80">
                <p>
                  Audio Arena is the world&apos;s first crowdsourced benchmark
                  for AI-generated speech. We give the same text prompt to two
                  hidden TTS models, show you the audio side by side, and let
                  you vote on which voice is best.
                </p>
                <p>
                  Blind votes power the leaderboard that tells researchers,
                  builders, and model companies which systems actually sound
                  best to listeners.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Get Started
                </Link>
                <Link
                  href="/leaderboard"
                  className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  See Leaderboards
                </Link>
              </div>
            </div>

            {/* decorative collage */}
            <div className="relative hidden aspect-square lg:block">
              <div className="absolute right-6 top-6 size-52 rotate-3 rounded-2xl bg-primary/25" />
              <div className="absolute right-24 top-28 size-40 rounded-2xl bg-accent" />
              <div className="absolute left-6 top-40 size-36 -rotate-6 rounded-2xl bg-chart-2/25" />
              <div className="absolute left-2 top-20 size-24 rounded-2xl bg-secondary" />
              <ModelChip
                model={models[3]}
                className="absolute left-8 top-28 shadow-md"
              />
              <ModelChip
                model={models[4]}
                className="absolute right-10 top-1/2 shadow-md"
              />
              <ModelChip
                model={models[5]}
                className="absolute bottom-16 left-1/3 shadow-md"
              />
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-12 text-center">
            <h2 className="font-serif text-3xl font-medium text-foreground text-balance">
              Benchmarking the world&apos;s best voice models
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              AudioArena keeps model identities hidden until after each vote,
              then updates live Elo ratings from pairwise comparisons.
            </p>

            <div className="mt-10 grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((s) => (
                <div
                  key={s.src}
                  className="group overflow-hidden rounded-xl border border-border bg-card"
                >
                  <Image
                    src={s.src || '/placeholder.svg'}
                    alt={s.alt}
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
