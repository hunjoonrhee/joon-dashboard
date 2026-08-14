import { getAuthenticatedUserId } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const SPEECH_API_URL = 'https://speech.googleapis.com/v1/speech:recognize';
const DEFAULT_SAMPLE_RATE_HERTZ = 16000;

// Growpath's dev-career persona dictates study notes and goals in Korean
// with English technical loanwords embedded ("오늘 앵귤러 공부를 했어") - without
// a hint, Google's language model tends to overwrite the loanword with a
// more probable Korean word for that sentence position, even though it
// transcribes the same word correctly in isolation. speechContexts biases
// recognition toward this list without forcing it, so it's harmless for
// language-learner sessions (German/English dictation) that never hit it.
const TECH_TERM_SPEECH_HINTS = [
  'Angular',
  'React',
  'Vue',
  'Svelte',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Node.js',
  'API',
  'REST',
  'GraphQL',
  'SQL',
  'NoSQL',
  'Computed',
  'Props',
  'State',
  'Hooks',
  'RxJS',
  'Redux',
  'Docker',
  'Kubernetes',
  'AWS',
  'CI/CD',
  'Git',
  'frontend',
  'backend',
  'fullstack',
];

type PronunciationWordScore = { word: string; accuracyScore: number; errorType: string };
type PronunciationResult = {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words: PronunciationWordScore[];
};

/**
 * Scores the same audio already sent to Google STT against its own
 * transcript as the reference text - not a "did Azure agree with Google"
 * check, but a per-word acoustic/phonetic accuracy score for whatever the
 * user actually said. Best-effort: any failure here (missing config,
 * network, a malformed Azure response) returns null rather than failing the
 * request - the transcript is the primary result callers need, this is an
 * enhancement on top of it.
 */
async function assessPronunciation(audioBuffer: ArrayBuffer, referenceText: string, languageCode: string): Promise<PronunciationResult | null> {
  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key) return null;

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
          // Same WAV bytes already sent to Google, reused here rather than
          // re-reading the request body - this IS a full WAV file (RIFF
          // header + PCM data), so the content type must say so ("audio/wav"
          // alone, parsed like any WAV file) rather than
          // "codecs=audio/pcm" (headerless raw PCM) - the latter tells Azure
          // there's no header to skip, so it tried to align the 44-byte RIFF
          // header itself as audio samples. Google's STT tolerated that
          // mismatch; Azure's phoneme-level scoring did not - it returned no
          // NBest result at all, which assessPronunciation was already
          // built to treat as a null result, so this failed silently rather
          // than with a visible error.
          'Content-Type': 'audio/wav',
          Accept: 'application/json',
          'Pronunciation-Assessment': assessmentConfig,
        },
        body: Buffer.from(audioBuffer),
      }
    );

    if (!res.ok) {
      console.error('Azure Pronunciation Assessment error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const best = data.NBest?.[0];
    // Scores sit directly on the NBest item (AccuracyScore/FluencyScore/
    // CompletenessScore/PronScore, same for each Words[] entry) - not
    // nested under a PronunciationAssessment sub-object like Microsoft's
    // SDK-based samples show. Confirmed by logging the response's actual
    // key names rather than trusting the docs' shape.
    if (!best || typeof best.PronScore !== 'number') return null;

    return {
      accuracyScore: best.AccuracyScore ?? 0,
      fluencyScore: best.FluencyScore ?? 0,
      completenessScore: best.CompletenessScore ?? 0,
      pronScore: best.PronScore ?? 0,
      words: ((best.Words ?? []) as { Word: string; AccuracyScore?: number; ErrorType?: string }[]).map((w) => ({
        word: w.Word,
        accuracyScore: w.AccuracyScore ?? 0,
        errorType: w.ErrorType ?? 'None',
      })),
    };
  } catch (e) {
    console.error('Azure Pronunciation Assessment request failed:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Shares GOOGLE_TTS_API_KEY with the Text-to-Speech route rather than
  // having its own env var - same Google Cloud project, same key, already
  // scoped (via API restrictions on the key itself) to just these two APIs.
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_TTS_API_KEY not set' }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const languageCode = req.nextUrl.searchParams.get('languageCode');
  if (!languageCode) {
    return NextResponse.json({ error: 'languageCode query param is required' }, { status: 400 });
  }
  const sampleRateParam = req.nextUrl.searchParams.get('sampleRateHertz');
  const sampleRateHertz = sampleRateParam ? Number(sampleRateParam) : DEFAULT_SAMPLE_RATE_HERTZ;
  // Opt-in - only the roleplay voice composer wants this (and its extra
  // Azure round-trip); log/goal-setup dictation has no use for a
  // pronunciation score and shouldn't pay for one.
  const shouldAssessPronunciation = req.nextUrl.searchParams.get('assessPronunciation') === 'true';

  // The client uploads the raw recorded audio bytes directly (LINEAR16 WAV)
  // rather than JSON+base64 - expo-file-system's upload() sends the file as
  // a binary request body, which avoids base64-encoding a multi-second
  // audio clip on the client. Google's own API requires base64 either way,
  // so that conversion just happens here instead, where Buffer makes it a
  // one-liner.
  const audioBuffer = await req.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
  }
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  try {
    const res = await fetch(`${SPEECH_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz,
          languageCode,
          // latest_long over latest_short - callers (log/goal-setup notes,
          // roleplay turns) routinely dictate more than one sentence, and
          // latest_short is tuned for single short commands/queries.
          model: 'latest_long',
          // Without this, multiple spoken sentences come back as one
          // unbroken run of words with no period/comma between them - reads
          // as "it merged my sentences into one" even though every word was
          // transcribed correctly.
          enableAutomaticPunctuation: true,
          speechContexts: [{ phrases: TECH_TERM_SPEECH_HINTS, boost: 15 }],
        },
        audio: { content: audioBase64 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Google Speech-to-Text error:', res.status, errText);
      return NextResponse.json({ error: 'Speech-to-Text API error' }, { status: 502 });
    }

    const data = await res.json();
    const transcript = ((data.results ?? []) as { alternatives?: { transcript?: string }[] }[])
      .map((result) => result.alternatives?.[0]?.transcript ?? '')
      .join(' ')
      .trim();

    // Nothing to score without a transcript, and no point spending an Azure
    // call on an empty reference text.
    const pronunciation =
      shouldAssessPronunciation && transcript ? await assessPronunciation(audioBuffer, transcript, languageCode) : null;

    return NextResponse.json({ transcript, pronunciation });
  } catch (e) {
    console.error('Speech transcribe route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
