export type PronunciationWordScore = { word: string; accuracyScore: number; errorType: string };
export type PronunciationResult = {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words: PronunciationWordScore[];
};

// Kept as a small permanent diagnostic rather than a one-off debug prop -
// this call can fail intermittently in real usage (external API), and
// callers have no other way to surface why to anyone testing it.
export type PronunciationAttempt = { result: PronunciationResult | null; debugReason: string | null };

/**
 * Scores a LINEAR16 WAV recording against a reference text via Azure
 * Speech's Pronunciation Assessment REST API - a per-word acoustic/phonetic
 * accuracy score, not a "did Azure agree with some other transcript" check.
 * Best-effort: any failure returns a null result (with a debugReason)
 * rather than throwing - callers should treat this as an enhancement, not
 * a hard requirement.
 */
export async function assessPronunciation(audioBuffer: ArrayBuffer, referenceText: string, languageCode: string): Promise<PronunciationAttempt> {
  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key) return { result: null, debugReason: 'AZURE_SPEECH_REGION/AZURE_SPEECH_KEY not set' };

  const assessmentConfig = Buffer.from(
    JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true,
    })
  ).toString('base64');

  try {
    const res = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${languageCode}&format=detailed`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          // The audio is a full WAV file (RIFF header + PCM data), so the
          // content type must say so ("audio/wav" alone, parsed like any
          // WAV file) rather than "codecs=audio/pcm" (headerless raw PCM) -
          // the latter tells Azure there's no header to skip, so it tried
          // to align the 44-byte RIFF header itself as audio samples and
          // returned no usable result.
          'Content-Type': 'audio/wav',
          Accept: 'application/json',
          'Pronunciation-Assessment': assessmentConfig,
        },
        body: Buffer.from(audioBuffer),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Azure Pronunciation Assessment error:', res.status, errText);
      return { result: null, debugReason: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    const best = data.NBest?.[0];
    // Scores sit directly on the NBest item (AccuracyScore/FluencyScore/
    // CompletenessScore/PronScore, same for each Words[] entry) - not
    // nested under a PronunciationAssessment sub-object like Microsoft's
    // SDK-based samples show. Confirmed by logging the response's actual
    // key names rather than trusting the docs' shape.
    if (!best || typeof best.PronScore !== 'number') {
      return { result: null, debugReason: `RecognitionStatus=${data.RecognitionStatus}, no usable NBest[0]` };
    }

    return {
      result: {
        accuracyScore: best.AccuracyScore ?? 0,
        fluencyScore: best.FluencyScore ?? 0,
        completenessScore: best.CompletenessScore ?? 0,
        pronScore: best.PronScore ?? 0,
        words: ((best.Words ?? []) as { Word: string; AccuracyScore?: number; ErrorType?: string }[]).map((w) => ({
          word: w.Word,
          accuracyScore: w.AccuracyScore ?? 0,
          errorType: w.ErrorType ?? 'None',
        })),
      },
      debugReason: null,
    };
  } catch (e) {
    console.error('Azure Pronunciation Assessment request failed:', e);
    return { result: null, debugReason: e instanceof Error ? e.message : String(e) };
  }
}
