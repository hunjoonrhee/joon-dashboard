import { getAuthenticatedUserId } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';

// OpenAI's TTS voices are multilingual by design (unlike Google's
// one-voice-per-language-plus-explicit-name model this route used to need) -
// a single voice reads German/Korean/English/Japanese all reasonably
// naturally, so no per-languageCode voice map is needed here even though
// the client still sends one (kept for API compatibility, just unused).
const VOICE = 'nova';

// GET (not POST like /api/speech/transcribe) so the mobile AudioPlayer can
// use this route directly as a remote audio source's `uri` - it issues its
// own GET with the Authorization header attached via AudioSource.headers,
// no client-side fetch/download/decode step needed.
export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
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

  try {
    const res = await fetch(OPENAI_SPEECH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: text,
        voice: VOICE,
        response_format: 'mp3',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI Text-to-Speech error:', res.status, errText);
      return NextResponse.json({ error: 'Text-to-Speech API error' }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();

    // Returned as raw bytes, not JSON+base64 - the whole point of this being
    // a GET route is that the client's AudioPlayer streams straight from
    // this URL, no separate fetch/decode step on the client.
    return new NextResponse(Buffer.from(audioBuffer), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Speech synthesize route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
