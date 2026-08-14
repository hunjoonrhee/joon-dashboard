import { getAuthenticatedUserId } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Omitting `name` makes Google pick a default voice for the languageCode,
// which is a cheaper Standard voice, not WaveNet - naming a WaveNet voice
// explicitly per target language is the only way to actually get the
// quality the product decided on for roleplay playback.
const WAVENET_VOICE_BY_LANGUAGE: Record<string, string> = {
  'de-DE': 'de-DE-Wavenet-B',
  'en-US': 'en-US-Wavenet-D',
  'ko-KR': 'ko-KR-Wavenet-C',
  'ja-JP': 'ja-JP-Wavenet-C',
};

// GET (not POST like /api/speech/transcribe) so the mobile AudioPlayer can
// use this route directly as a remote audio source's `uri` - it issues its
// own GET with the Authorization header attached via AudioSource.headers,
// no client-side fetch/download/decode step needed.
export async function GET(req: NextRequest) {
  // Shares GOOGLE_TTS_API_KEY with the Speech-to-Text route - same Google
  // Cloud project, same key, already scoped to just these two APIs.
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_TTS_API_KEY not set' }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const text = req.nextUrl.searchParams.get('text');
  if (!text) {
    return NextResponse.json({ error: 'text query param is required' }, { status: 400 });
  }
  const languageCode = req.nextUrl.searchParams.get('languageCode');
  if (!languageCode) {
    return NextResponse.json({ error: 'languageCode query param is required' }, { status: 400 });
  }

  const voiceName = WAVENET_VOICE_BY_LANGUAGE[languageCode];

  try {
    const res = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: voiceName ? { languageCode, name: voiceName } : { languageCode, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Google Text-to-Speech error:', res.status, errText);
      return NextResponse.json({ error: 'Text-to-Speech API error' }, { status: 502 });
    }

    const data = await res.json();
    const audioContent = data.audioContent as string | undefined;
    if (!audioContent) {
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 });
    }

    // Returned as raw bytes, not JSON+base64 - the whole point of this being
    // a GET route is that the client's AudioPlayer streams straight from
    // this URL, no separate fetch/decode step on the client.
    return new NextResponse(Buffer.from(audioContent, 'base64'), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Speech synthesize route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
