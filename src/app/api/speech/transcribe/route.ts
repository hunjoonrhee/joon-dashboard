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
  // Common two/three-word combinations, not just isolated tokens - an
  // out-of-vocabulary word sequence like "Angular Computed" competes with
  // the whole sentence's Korean language model, so boosting each word
  // alone still lets a more probable all-Korean reading win. Boosting the
  // actual sequence gives it a real foothold at that position too.
  'Angular Signals',
  'Angular Computed',
  'React Hooks',
  'Vue Composition API',
  'TypeScript Generics',
  'Node.js Backend',
];

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
          // 20 is Google's documented ceiling for a meaningfully stronger
          // pull without the model starting to force-fit the hint list onto
          // audio that doesn't actually contain it - 15 wasn't winning
          // against a fluent all-Korean reading of the same audio often
          // enough (see task #22 follow-up).
          speechContexts: [{ phrases: TECH_TERM_SPEECH_HINTS, boost: 20 }],
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

    return NextResponse.json({ transcript });
  } catch (e) {
    console.error('Speech transcribe route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
