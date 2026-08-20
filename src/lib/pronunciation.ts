import { insertWithUser, supabase } from '@/lib/supabase';

export async function savePronunciationAttempt(score: number) {
  const { error } = await insertWithUser('pronunciation_attempts', { score });
  if (error) console.error('Failed to save pronunciation attempt:', error);
  return { error };
}

export type BestPronunciationScore = { score: number; date: string } | null;

export async function fetchBestPronunciationScore(): Promise<BestPronunciationScore> {
  const { data, error } = await supabase
    .from('pronunciation_attempts')
    .select('score, created_at')
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error('Failed to fetch best pronunciation score:', error);
  if (!data) return null;
  return { score: data.score, date: data.created_at };
}
