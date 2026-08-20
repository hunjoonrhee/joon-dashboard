import { computeNextReview } from '@/lib/spaced-repetition';
import { getCurrentUserId, supabase, upsertWithUser } from '@/lib/supabase';
import type { VocabWord } from '@/types';

export async function fetchAllVocabWords(): Promise<VocabWord[]> {
  const { data } = await supabase.from('vocab_words').select('*').order('created_at', { ascending: false });
  return (data ?? []) as VocabWord[];
}

export async function fetchDueVocabWords(limit = 20): Promise<VocabWord[]> {
  const { data } = await supabase
    .from('vocab_words')
    .select('*')
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit);
  return (data ?? []) as VocabWord[];
}

export async function fetchVocabWordCount(): Promise<number> {
  const { count } = await supabase.from('vocab_words').select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export type CreateVocabWordInput = {
  language: string;
  word: string;
  meaning: string;
  example_sentence?: string | null;
};

/** Upserts on (user_id, language, word) - saving the same word twice (e.g. the LLM suggests it again next session) just no-ops rather than erroring. */
export async function createVocabWord(input: CreateVocabWordInput) {
  return upsertWithUser(
    'vocab_words',
    {
      language: input.language,
      word: input.word,
      meaning: input.meaning,
      example_sentence: input.example_sentence ?? null,
    },
    { onConflict: 'user_id,language,word' }
  );
}

export async function saveVocabWords(language: string, words: { word: string; meaning: string; example: string }[]) {
  const userId = await getCurrentUserId();
  if (!userId || words.length === 0) return;
  await Promise.all(
    words.map((w) => createVocabWord({ language, word: w.word, meaning: w.meaning, example_sentence: w.example }))
  );
}

export async function deleteVocabWord(id: string) {
  return supabase.from('vocab_words').delete().eq('id', id);
}

export async function reviewVocabWord(word: VocabWord, knew: boolean) {
  const result = computeNextReview(
    { intervalDays: word.interval_days, easeFactor: word.ease_factor, reviewCount: word.review_count },
    knew
  );
  return supabase
    .from('vocab_words')
    .update({
      interval_days: result.intervalDays,
      ease_factor: result.easeFactor,
      review_count: result.reviewCount,
      next_review_at: result.nextReviewAt,
    })
    .eq('id', word.id);
}
