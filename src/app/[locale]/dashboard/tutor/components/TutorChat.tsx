'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '../hooks/useTutorSession';
import TutorMessageItem from './TutorMessageItem';

interface Props {
  messages: Message[];
  loading: boolean;
  isEndingSession: boolean;
  onQuizSelect: (msgIdx: number, optIdx: number) => void;
}

export default function TutorChat({ messages, loading, isEndingSession, onQuizSelect }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.map((msg, i) => (
        <TutorMessageItem key={i} message={msg} msgIdx={i} onQuizSelect={onQuizSelect} />
      ))}

      {(loading || isEndingSession) && (
        <div className="flex gap-1 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm w-fit">
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
