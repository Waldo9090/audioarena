import { Info } from 'lucide-react'
import { TopHeader } from '@/components/top-header'
import { getLeaderboardRows } from '@/lib/db/public'
import { eloConfidenceRadius95, isPreliminaryElo } from '@/lib/elo'
import { getCurrentUser } from '@/lib/supabase/server'
import { formatElo, formatPercent } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function readUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export default async function LeaderboardPage() {
  const [user, rows] = await Promise.all([
    readUser(),
    getLeaderboardRows().catch(() => []),
  ])
  const topElo = Math.max(...rows.map((row) => row.elo), 1000)

  return (
    <main className="min-h-svh bg-background">
      <TopHeader isLoggedIn={Boolean(user)} />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Rankings</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            TTS Leaderboard
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Live Elo rankings from blind pairwise voice comparisons.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[64px_1fr_120px_130px_90px_90px_90px_100px] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground max-lg:hidden">
            <div>Rank</div>
            <div>Model</div>
            <div>Provider</div>
            <div>Rating</div>
            <div className="text-right">Wins</div>
            <div className="text-right">Losses</div>
            <div className="text-right">Battles</div>
            <div className="text-right">Win Rate</div>
          </div>

          <div className="divide-y divide-border">
            {rows.map((row, index) => {
              const barWidth = Math.max(8, Math.round((row.elo / topElo) * 100))
              const ci = eloConfidenceRadius95(row.battles)
              const preliminary = isPreliminaryElo(row.battles)

              return (
                <div
                  key={row.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[64px_1fr_120px_130px_90px_90px_90px_100px] lg:items-center lg:gap-4"
                >
                  <div className="text-sm font-medium text-primary">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-foreground">{row.display_name}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground lg:hidden">
                      {row.provider}
                    </div>
                  </div>
                  <div className="hidden text-sm text-muted-foreground lg:block">{row.provider}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{formatElo(row.elo)}</span>
                    <span className="text-muted-foreground">&plusmn;{ci}</span>
                    {preliminary && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        <Info size={12} />
                        Preliminary
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground lg:text-right">{row.wins}</div>
                  <div className="text-sm text-foreground lg:text-right">{row.losses}</div>
                  <div className="text-sm text-foreground lg:text-right">{row.battles}</div>
                  <div className="text-sm text-foreground lg:text-right">
                    {formatPercent(row.win_rate)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
