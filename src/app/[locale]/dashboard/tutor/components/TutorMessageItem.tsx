'use client';

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
          <div className="text-sm text-gray-800 leading-relaxed">
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
        <div className="bg-gray-900 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%] w-full">
          <p className="text-[10px] text-indigo-400 font-semibold mb-1.5">🔍 코드 리뷰 요청</p>
          <ReactMarkdown components={markdownComponents}>{message.parts[0].text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
        <p className="text-sm leading-relaxed">{message.parts[0].text}</p>
      </div>
    </div>
  );
}
