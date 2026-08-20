'use client';

import type { PronunciationResult } from '@/lib/azure-pronunciation';
import { encodeWavFromBlob, recordAudio, type RecordingController } from '@/lib/audio-recording';
import { useCallback, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'transcribing' | 'scoring' | 'error';

export type VoiceResult = { transcript: string; pronunciation: PronunciationResult | null };

export function useVoiceRecorder(languageCode: string | null) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const controllerRef = useRef<RecordingController | null>(null);

  const start = useCallback(async () => {
    if (!languageCode) return;
    try {
      controllerRef.current = await recordAudio();
      setStatus('recording');
    } catch {
      // Most likely mic permission denied or no device - nothing more specific to say.
      setStatus('error');
    }
  }, [languageCode]);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
    controllerRef.current = null;
    setStatus('idle');
  }, []);

  const stop = useCallback(async (): Promise<VoiceResult | null> => {
    const controller = controllerRef.current;
    if (!controller || !languageCode) return null;

    try {
      const rawBlob = await controller.stop();
      controllerRef.current = null;

      setStatus('transcribing');
      const wavBlob = await encodeWavFromBlob(rawBlob);

      const transcribeRes = await fetch(`/api/speech/transcribe?languageCode=${encodeURIComponent(languageCode)}`, {
        method: 'POST',
        body: wavBlob,
      });
      if (!transcribeRes.ok) throw new Error('transcribe failed');
      const { transcript } = (await transcribeRes.json()) as { transcript: string };
      if (!transcript.trim()) {
        setStatus('idle');
        return { transcript: '', pronunciation: null };
      }

      setStatus('scoring');
      const pronunciationRes = await fetch(
        `/api/speech/pronunciation?languageCode=${encodeURIComponent(languageCode)}&referenceText=${encodeURIComponent(transcript)}`,
        { method: 'POST', body: wavBlob }
      );
      const pronunciation = pronunciationRes.ok
        ? ((await pronunciationRes.json()) as { pronunciation: PronunciationResult | null }).pronunciation
        : null;

      setStatus('idle');
      return { transcript, pronunciation };
    } catch {
      setStatus('error');
      return null;
    }
  }, [languageCode]);

  return { status, start, stop, cancel };
}
