import { getAuthenticatedUserId } from '@/lib/api-auth';
import { assessPronunciation } from '@/lib/azure-pronunciation';
import { NextRequest, NextResponse } from 'next/server';

// Split out from /api/speech/transcribe (which only does Google STT) so the
// client can call this as a genuinely separate second step, once it has a
// transcript to use as the reference text - that lets the mobile app show
// "변환 중..." then "발음 분석 중..." as two real phases instead of one
// combined wait with no visibility into which part is slow.
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const languageCode = req.nextUrl.searchParams.get('languageCode');
  if (!languageCode) {
    return NextResponse.json({ error: 'languageCode query param is required' }, { status: 400 });
  }
  const referenceText = req.nextUrl.searchParams.get('referenceText');
  if (!referenceText) {
    return NextResponse.json({ error: 'referenceText query param is required' }, { status: 400 });
  }

  const audioBuffer = await req.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
  }

  const attempt = await assessPronunciation(audioBuffer, referenceText, languageCode);
  return NextResponse.json({ pronunciation: attempt.result, pronunciationDebug: attempt.debugReason });
}
