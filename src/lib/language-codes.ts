/**
 * Maps the English language names the roadmap generator classifies
 * (ai_roadmaps.target_language, e.g. "German", "Japanese") to a BCP-47 code
 * for the STT/TTS/pronunciation APIs, which all take a real language tag.
 */
const LANGUAGE_CODES: Record<string, string> = {
  German: 'de-DE',
  English: 'en-US',
  Korean: 'ko-KR',
  Japanese: 'ja-JP',
  Chinese: 'zh-CN',
  Spanish: 'es-ES',
  French: 'fr-FR',
  Italian: 'it-IT',
  Portuguese: 'pt-PT',
  Dutch: 'nl-NL',
  Russian: 'ru-RU',
  Polish: 'pl-PL',
  Turkish: 'tr-TR',
  Vietnamese: 'vi-VN',
  Thai: 'th-TH',
  Arabic: 'ar-SA',
};

/** Null when there's no known code for this language - callers should hide voice features rather than guess. */
export function getLanguageCode(targetLanguage: string | null): string | null {
  if (!targetLanguage) return null;
  return LANGUAGE_CODES[targetLanguage] ?? null;
}
