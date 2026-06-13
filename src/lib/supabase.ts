import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export const supabase = createSupabaseBrowserClient()

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}
