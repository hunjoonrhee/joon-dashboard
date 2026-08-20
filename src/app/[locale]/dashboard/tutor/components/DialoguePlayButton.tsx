'use client';

import { Loader2, Pause, Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  text: string;
  languageCode: string;
}

/** Plays a [DIALOGUE]-tagged sentence via /api/speech/synthesize (OpenAI TTS) - the route is a plain GET streaming mp3, so a bare <audio> element handles the fetch/decode/playback itself, no manual blob juggling needed. */
export default function DialoguePlayButton({ text, languageCode }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = () => {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }

    if (!audioRef.current) {
      const src = `/api/speech/synthesize?text=${encodeURIComponent(text)}&languageCode=${encodeURIComponent(languageCode)}`;
      const audio = new Audio(src);
      audio.addEventListener('canplay', () => setState('playing'), { once: true });
      audio.addEventListener('ended', () => setState('idle'));
      audio.addEventListener('error', () => setState('idle'));
      audioRef.current = audio;
    }
    setState('loading');
    audioRef.current.play();
  };

  return (
    <button
      onClick={handleClick}
      className="text-pri hover:opacity-80 transition-colors flex-shrink-0"
      title="발음 듣기"
    >
      {state === 'loading' && <Loader2 size={13} className="animate-spin" />}
      {state === 'playing' && <Pause size={13} />}
      {state === 'idle' && <Volume2 size={13} />}
    </button>
  );
}
