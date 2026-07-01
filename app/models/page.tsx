import { TopHeader } from '@/components/top-header'
import { getModelSummaries } from '@/lib/db/public'
import { eloConfidenceRadius95, isPreliminaryElo } from '@/lib/elo'
import { getCurrentUser } from '@/lib/supabase/server'
import { formatElo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function readUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export default async function ModelsPage() {
  const [user, models] = await Promise.all([
    readUser(),
    getModelSummaries().catch(() => []),
  ])

  return (
    <main className="min-h-svh bg-background">
      <TopHeader isLoggedIn={Boolean(user)} />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Model Roster
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Models
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            The text-to-speech systems currently tracked by AudioArena.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => {
            const ci = eloConfidenceRadius95(model.battles)
            const preliminary = isPreliminaryElo(model.battles)

            return (
              <article
                key={model.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-foreground">
                      {model.display_name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{model.provider}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      model.runtime_configured
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground'
                    }`}
                  >
                    {model.runtime_configured ? 'Configured' : 'Unavailable'}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current Elo
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-medium text-foreground">
                      {formatElo(model.elo)}
                    </span>
                    <span className="text-sm text-muted-foreground">&plusmn;{ci}</span>
                    {preliminary && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        Preliminary
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <Stat label="Wins" value={model.wins} />
                  <Stat label="Losses" value={model.losses} />
                  <Stat label="Battles" value={model.battles} />
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium text-foreground">{value}</div>
    </div>
  )
}
