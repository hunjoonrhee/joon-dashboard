import { insertWithUser, supabase } from '@/lib/supabase';

export async function savePronunciationAttempt(score: number) {
  return insertWithUser('pronunciation_attempts', { score });
}

export type BestPronunciationScore = { score: number; date: string } | null;

export async function fetchBestPronunciationScore(): Promise<BestPronunciationScore> {
  const { data } = await supabase
    .from('pronunciation_attempts')
    .select('score, created_at')
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { score: data.score, date: data.created_at };
}
