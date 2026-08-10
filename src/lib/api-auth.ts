import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Verifies the caller's identity for a Route Handler from either the
 * browser's session cookies (same-origin web requests, via @supabase/ssr)
 * or an `Authorization: Bearer <token>` header (mobile, or any other
 * cross-origin client) - never from a client-supplied body field, which a
 * caller could set to any value to act as another user. Returns null for
 * unauthenticated/invalid callers rather than throwing, since some routes
 * intentionally allow an anonymous path (e.g. the roadmap trial).
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (bearerToken) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.auth.getUser(bearerToken);
    return error || !data.user ? null : data.user.id;
  }

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  return user?.id ?? null;
}
