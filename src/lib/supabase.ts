import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

export const supabase = getClient()

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function insertWithUser<T extends Record<string, unknown>>(
  table: string,
  data: T | T[]
) {
  const userId = await getCurrentUserId()
  const withUserId = Array.isArray(data)
    ? data.map((d) => ({ ...d, user_id: userId }))
    : { ...data, user_id: userId }
  return supabase.from(table).insert(withUserId)
}

export async function upsertWithUser<T extends Record<string, unknown>>(
  table: string,
  data: T | T[],
  options?: { onConflict?: string }
) {
  const userId = await getCurrentUserId()
  const withUserId = Array.isArray(data)
    ? data.map((d) => ({ ...d, user_id: userId }))
    : { ...data, user_id: userId }
  return supabase.from(table).upsert(withUserId, options)
}
