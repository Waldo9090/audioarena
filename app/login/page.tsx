import Link from 'next/link'
import { signInAction, signInWithGoogleAction } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const error = typeof params.error === 'string' ? params.error : null

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-medium text-foreground">Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your AudioArena account to vote in blind battles.
          </p>
        </div>

        <form action={signInWithGoogleAction} className="mt-6">
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <span className="font-semibold" aria-hidden="true">
              G
            </span>
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>Email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={signInAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
