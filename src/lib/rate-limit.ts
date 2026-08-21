import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Daily per-identifier caps on the paid AI endpoints (Gemini/OpenAI/Azure) -
 * without this, an account (or an anonymous caller on the /try trial path)
 * can call these in an unbounded loop and the cost is entirely ours, with no
 * technical guardrail. Numbers are generous defaults for real usage, not
 * measured - tune once real traffic exists.
 */
export const RATE_LIMITS = {
  'roadmap-generate': 10,
  'roadmap-generate-trial': 3,
  'tutor-chat': 200,
  'coach-suggest': 20,
  'roleplay-suggest': 20,
  'speech-transcribe': 150,
  'speech-synthesize': 150,
  'speech-pronunciation': 150,
} as const;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/** Prefers the authenticated user; falls back to IP for anonymous callers (e.g. the roadmap trial). */
export function getRateLimitIdentifier(userId: string | null, req: NextRequest): string {
  if (userId) return `user:${userId}`;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  return `ip:${ip}`;
}

/**
 * Atomically increments today's usage counter and reports whether this
 * request is still within the daily limit. Fails open (returns true) if the
 * check itself errors - e.g. the api_usage table/function haven't been
 * created yet - so a rate-limiting infra hiccup can't take down every AI
 * feature in the app; it just means the limit isn't enforced until fixed.
 */
export async function checkRateLimit(identifier: string, endpoint: RateLimitEndpoint): Promise<boolean> {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabaseAdmin.rpc('increment_api_usage', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_limit: RATE_LIMITS[endpoint],
    });
    if (error) {
      console.error(`Rate limit check failed for ${endpoint}:`, error);
      return true;
    }
    return data?.[0]?.allowed ?? true;
  } catch (e) {
    console.error(`Rate limit check threw for ${endpoint}:`, e);
    return true;
  }
}
