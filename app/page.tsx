import { ArenaShell } from '@/components/arena-shell'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function readUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export default async function Page() {
  const user = await readUser()

  return <ArenaShell isLoggedIn={Boolean(user)} userEmail={user?.email ?? undefined} />
}
