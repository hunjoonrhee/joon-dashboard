import { getAuthenticatedUserId } from '@/lib/api-auth';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Growpath's dev-career persona dictates study notes and goals in Korean
// with English technical loanwords embedded ("오늘 Angular Computed 공부를
// 했어") - Whisper/gpt-4o-transcribe's `prompt` param works like a style/
// vocabulary hint (not a hard constraint), same intent as Google STT's
// speechContexts before this route switched providers. Kept as a plain
// comma list rather than a full sentence - a prompt written as an example
// sentence risks the model echoing that sentence's *structure*, not just
// its vocabulary, on unrelated audio.
const TECH_TERM_PROMPT_HINT =
  'Angular, React, Vue, Svelte, Next.js, TypeScript, JavaScript, Python, Java, Kotlin, Swift, Node.js, API, REST, GraphQL, SQL, NoSQL, Computed, Props, State, Hooks, RxJS, Redux, Docker, Kubernetes, AWS, CI/CD, Git, frontend, backend, fullstack';

/** Whisper/gpt-4o-transcribe want a bare ISO-639-1 code ("ko") - the client sends a full BCP-47 tag ("ko-KR"). */
function toIso639(bcp47LanguageCode: string): string {
  return bcp47LanguageCode.split('-')[0].toLowerCase();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const withinLimit = await checkRateLimit(getRateLimitIdentifier(userId, req), 'speech-transcribe');
  if (!withinLimit) {
    return NextResponse.json({ error: 'Daily usage limit reached. Please try again tomorrow.' }, { status: 429 });
  }

  const languageCode = req.nextUrl.searchParams.get('languageCode');
  if (!languageCode) {
    return NextResponse.json({ error: 'languageCode query param is required' }, { status: 400 });
  }

  // The client uploads the raw recorded audio bytes directly (LINEAR16 WAV)
  // rather than JSON+base64 - expo-file-system's upload() sends the file as
  // a binary request body. OpenAI's endpoint wants multipart/form-data with
  // the audio as a file part, so that's assembled here instead - no base64
  // step needed either way (unlike the Google STT route this replaced).
  const audioBuffer = await req.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    // gpt-4o-transcribe over whisper-1 - handles the Korean/English
    // code-switching this app's dictation sessions hit constantly
    // (technical loanwords, roleplay language practice) noticeably better.
    form.append('model', 'gpt-4o-transcribe');
    form.append('language', toIso639(languageCode));
    form.append('prompt', TECH_TERM_PROMPT_HINT);

    const res = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI transcription error:', res.status, errText);
      return NextResponse.json({ error: 'Speech-to-Text API error' }, { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ transcript: (data.text ?? '').trim() });
  } catch (e) {
    console.error('Speech transcribe route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
