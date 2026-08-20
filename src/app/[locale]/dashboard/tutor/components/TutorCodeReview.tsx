'use client';

import { Code2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  loading: boolean;
  onSubmit: (code: string) => void;
  onClose: () => void;
}

export default function TutorCodeReview({ loading, onSubmit, onClose }: Props) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim() || loading) return;
    onSubmit(code.trim());
    setCode('');
  };

  return (
    <div className="border-t border-border bg-surf-2 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-pri flex items-center gap-1">
          <Code2 size={12} /> 코드 리뷰
        </p>
        <button onClick={onClose} className="text-xs text-ink-faint hover:text-ink-dim">
          취소
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="리뷰 받을 코드를 붙여넣기 하세요..."
        rows={24}
        className="w-full bg-[#1e1e1e] text-[#e5e5e5] border border-border rounded-xl px-3 py-2.5 text-xs font-mono outline-none resize-none focus:border-pri transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={!code.trim() || loading}
        className="mt-2 w-full py-2 rounded-xl bg-pri text-on-pri text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-colors"
      >
        리뷰 요청
      </button>
    </div>
  );
}
