'use client';

import { Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../hooks/useTutorSession';
import { markdownComponents } from '../lib/markdownComponents';
import TutorQuiz from './TutorQuiz';

interface Props {
  message: Message;
  msgIdx: number;
  onQuizSelect: (msgIdx: number, optIdx: number) => void;
}

export default function TutorMessageItem({ message, msgIdx, onQuizSelect }: Props) {
  if (message.role === 'model') {
    return (
      <div className="flex flex-col gap-2 max-w-[88%]">
        {message.parts[0].text && (
          <div className="text-sm text-ink leading-relaxed">
            <ReactMarkdown components={markdownComponents}>{message.parts[0].text}</ReactMarkdown>
          </div>
        )}
        {message.quiz && (
          <TutorQuiz
            quiz={message.quiz}
            selectedOption={message.selectedOption}
            onSelect={(optIdx) => onQuizSelect(msgIdx, optIdx)}
          />
        )}
      </div>
    );
  }

  if (message.isCodeReview) {
    return (
      <div className="flex justify-end">
        <div className="bg-[#1e1e1e] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
          <p className="text-[10px] text-pri-2 font-semibold mb-1 flex items-center gap-1">
            <Code2 size={11} /> 코드 리뷰 요청
          </p>
          <p className="text-[10px] opacity-70">코드가 제출됐어요 — AI 리뷰를 확인하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="bg-pri text-on-pri rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
        <p className="text-sm leading-relaxed">{message.parts[0].text}</p>
      </div>
    </div>
  );
}
